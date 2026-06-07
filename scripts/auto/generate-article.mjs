/* =====================================================================
   scripts/auto/generate-article.mjs — 주 2~3회 실행, 고품질 SEO 글 1편 생성
   - topics.json 에서 status:"queued" 첫 주제 1개 선택
   - Anthropic API(env ANTHROPIC_API_KEY)로 시니어 친화 존댓말 본문 생성
   - 기존 글 HTML 템플릿에 맞춰 articles/{slug}.html 작성
   - articles.html 허브 카드 추가 + sitemap.xml URL 추가 + topics 갱신 + rss.xml 재생성
   안전장치:
     * 큐 비면 아무것도 안 하고 0 종료
     * 하루 1편 초과 금지(오늘 이미 발행됐으면 0 종료)
     * API 실패/키 없음 → 비정상 종료(커밋 안 되게). 단, --dry 면 API 없이 조립까지만.
   비밀키는 env 로만 받습니다. 코드/커밋에 절대 포함 금지.
   ===================================================================== */
import path from "node:path";
import {
  PATHS, SITE_URL, ADSENSE_CLIENT, kstDate,
  loadPlants, plantById, readText, writeText, escapeHtml, escapeXml,
  readTopics, serializeTopics,
} from "./lib.mjs";
import { buildRss } from "./build-rss.mjs";

const DRY = process.argv.includes("--dry");
const MOCK = process.argv.includes("--mock"); // 테스트: API 없이 가짜 본문으로 전체 파이프라인 실행
const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/* --- 큐에서 다음 주제 ----------------------------------------- */
function nextQueued(list) {
  return list.find((t) => t.status === "queued") || null;
}

function publishedToday(list, iso) {
  return list.some((t) => t.status === "published" && t.date === iso);
}

// topics.json 항목에 누락될 수 있는 필드 보강(요약·썸네일·라벨)
function normalizeTopic(topic, plants) {
  const summary =
    topic.summary ||
    `${topic.title} — 큰 글씨로 쉽게 안내합니다. ${topic.main_keyword ? topic.main_keyword + " 고를 때 참고하세요." : ""}`.trim();
  const thumbId = topic.thumb_id || (topic.plant_ids && topic.plant_ids[0]);
  const thumbPlant = plantById(plants, thumbId);
  const thumbImage =
    (thumbPlant && thumbPlant.image) || "public/plants/placeholder.svg";
  const diffLabel = topic.diff_label || topic.main_keyword || "안내";
  return { summary, thumbImage, diffLabel };
}

/* --- Anthropic API 호출 --------------------------------------- */
function buildPrompt(topic, plantInfos, summary) {
  const list = plantInfos
    .map(
      (p) =>
        `- id=${p.id} / 이름="${p.name}" / 난이도=${p.difficulty} / 물주기=${p.water_cycle} / 빛=${p.light_desc} / 장점=${p.merit} / 주의=${p.caution} / 반려동물독성=${p.toxic_to_pets ? "있음(주의)" : "없음(안전)"}`
    )
    .join("\n");

  return `당신은 한국의 시니어(50~70대) 독자를 위한 실내 식물 안내 글을 쓰는 따뜻한 식물 칼럼니스트입니다.

[글 주제]
제목(참고): ${topic.title}
메인 키워드: ${topic.main_keyword}
서브 키워드: ${(topic.sub_keywords || []).join(", ")}
요약: ${summary}

[소개할 식물 — 반드시 이 식물들만, 아래 한국어 이름 그대로 사용]
${list}

[작성 규칙 — 반드시 지킬 것]
1. 존댓말(~해요/~합니다)로, 따뜻하고 다정하게. 어르신이 읽기 쉽게 짧고 명확한 문장.
2. 전체 본문 1500자 이상(공백 제외 기준 넉넉히).
3. 외래어·전문용어 남용 금지(쉬운 우리말로). "디톡스, 힐링, 가드닝" 같은 불필요한 외래어 금지.
4. 미검증 효능·과장 금지. "미세먼지를 제거한다/병을 낫게 한다" 류 단정 금지. "공기를 맑게 하는 데 도움을 준다고 알려져 있어요" 같은 절제된 표현만.
5. 메인 키워드와 서브 키워드를 본문에 자연스럽게 녹여서 여러 번(억지스럽지 않게) 넣으세요(SEO).
6. 각 식물은 위에 준 한국어 이름을 그대로 쓰고, 난이도·물주기·빛·장점·주의를 자연스러운 문장으로 풀어 소개.
7. 반려동물 독성이 "있음"인 식물은 반려동물 주의 문장을 꼭 한 줄 넣으세요.

[출력 형식 — 매우 중요]
- 순수 HTML 본문 조각만 출력하세요(<html>,<head>,<body> 금지, 코드펜스 금지, 설명 금지).
- 첫 줄은 반드시: <p class="lead">…(한 문장 도입부)…</p>
- 그 다음 도입 <h2>…</h2> 와 <p> 1~3개.
- 각 식물마다 <h2>숫자. 식물이름 — 한 줄 특징</h2> 과 <p> 2개 정도, 그리고 그 식물 소개 끝에
  <p><a href="/plant.html?id={id}">{이름} 자세히 보기 &gt;</a></p> 형태의 링크를 넣으세요(id는 위 목록의 id).
- 글 중간(식물 절반쯤 소개한 뒤)에 한 번, 그리고 마지막 "정리하며" 앞 또는 뒤에 한 번,
  아래 CTA를 그대로 넣으세요(2회):
  <p style="margin-top:var(--space-3)"><a class="btn-primary" href="/quiz.html"><span aria-hidden="true">🌱</span> 우리집에 맞는 식물 추천받기</a></p>
- 마지막은 <h2>정리하며</h2> 와 <p> 1~2개로 마무리.
- 이미지 태그(<img>)는 넣지 마세요(시스템이 따로 넣습니다).
- h1 은 넣지 마세요(시스템이 따로 넣습니다).

지금 위 규칙을 모두 지켜 HTML 본문 조각만 출력하세요.`;
}

async function callAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY 환경변수가 없습니다.");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const block = (data.content || []).find((c) => c.type === "text");
  const out = block ? block.text : "";
  if (!out || out.trim().length < 200) {
    throw new Error("API 응답 본문이 비었거나 너무 짧습니다.");
  }
  return out.trim();
}

// 코드펜스가 섞여 오면 제거
function cleanBody(html) {
  let s = html.trim();
  s = s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return s;
}

/* --- 글 HTML 조립(기존 템플릿과 동일 구조) -------------------- */
function buildArticleHtml({ topic, bodyHtml, iso, summary }) {
  const url = `${SITE_URL}/articles/${topic.slug}.html`;
  const title = topic.title;
  const desc = summary;
  // OG 제목은 사이트명 없이 짧게
  const ogTitle = title;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description: desc,
    image: `${SITE_URL}/public/og-image.png`,
    datePublished: iso,
    dateModified: iso,
    inLanguage: "ko-KR",
    author: { "@type": "Organization", name: "우리집 초록친구" },
    publisher: {
      "@type": "Organization",
      name: "우리집 초록친구",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/public/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | 우리집 초록친구</title>
  <meta name="description" content="${escapeHtml(desc)}" />

  <meta name="color-scheme" content="light" />
  <link rel="icon" href="/public/favicon.svg" type="image/svg+xml" />
  <link rel="icon" type="image/png" sizes="32x32" href="/public/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/public/favicon-16.png" />
  <link rel="apple-touch-icon" href="/public/apple-touch-icon.png" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  <meta property="og:image" content="/public/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/public/og-image.png" />
  <link rel="canonical" href="/articles/${topic.slug}.html" />
  <link rel="alternate" type="application/rss+xml" title="우리집 초록친구 읽을거리" href="/rss.xml" />

  <!-- 폰트: Pretendard(비차단 로딩). 미로드 시 system-ui·Noto Sans KR 폴백으로 한글 정상 표시(styles.css --font-sans). -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="preload" as="style" crossorigin
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" crossorigin media="print" onload="this.media='all'"
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <noscript>
    <link rel="stylesheet" crossorigin
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  </noscript>

  <link rel="stylesheet" href="/styles/tokens.css" />
  <link rel="stylesheet" href="/styles/styles.css" />
  <script src="/scripts/config.js"></script>
  <script src="/scripts/app.js" defer></script>

  <!-- 구조화 데이터: Article -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>

  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__logo" href="/index.html">
        <img src="/public/favicon.svg" alt="" aria-hidden="true" />
        초록친구
      </a>
      <nav class="site-nav" aria-label="주요 메뉴">
        <a href="/quiz.html">추천받기</a>
        <a href="/guide.html">돌봄 안내</a>
        <a href="/articles.html" aria-current="page">읽을거리</a>
        <a href="/about.html">소개</a>
      </nav>
    </div>
  </header>

  <main id="main" class="container prose">
    <nav class="breadcrumb" aria-label="현재 위치">
      <a href="/index.html">홈</a> &gt;
      <a href="/articles.html">읽을거리</a> &gt;
      <span aria-current="page">${escapeHtml(title)}</span>
    </nav>

    <h1>${escapeHtml(title)}</h1>

${bodyHtml}

    <h2>함께 읽으면 좋은 글</h2>
    <ul class="related-plants">
      <li><a href="/articles/easy-low-water-plants.html">물 자주 안 줘도 되는 식물 7가지 — 깜빡해도 잘 커요</a></li>
      <li><a href="/articles/air-purifying-plants.html">거실에 두기 좋은 공기정화 식물 5가지</a></li>
    </ul>
    <p class="article-share" style="margin-top:var(--space-3)">
      <button class="btn btn--share" type="button" data-share
        data-share-title="${escapeHtml(title)} | 우리집 초록친구"
        data-share-url="/articles/${topic.slug}.html">
        이 글 공유하기 <span aria-hidden="true">💬</span>
      </button>
    </p>

    <!-- 광고는 콘텐츠 하단에만 -->
    <aside class="ad-slot" aria-label="광고">
      <p class="ad-slot__tag">광고</p>
      <div class="ad-slot__body"></div>
    </aside>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <ul class="site-footer__links">
        <li><a href="/index.html">처음으로</a></li>
        <li><a href="/about.html">소개</a></li>
        <li><a href="/privacy.html">개인정보처리방침</a></li>
        <li><a href="/contact.html">문의</a></li>
        <li><a href="/credits.html">사진 출처</a></li>
      </ul>
      <p class="site-footer__note">우리집 초록친구 · 처음이라도, 실수해도 괜찮아요.</p>
    </div>
  </footer>
</body>
</html>
`;
}

/* --- 허브(articles.html) 카드 추가 ---------------------------- */
function insertHubCard(hubHtml, topic, thumbImage, diffLabel) {
  // 이미 카드가 있으면 그대로
  if (hubHtml.includes(`/articles/${topic.slug}.html`)) return hubHtml;

  const card = `        <li class="guide-item">
          <a href="/articles/${topic.slug}.html">
            <img class="guide-item__thumb" src="/${thumbImage}"
              data-fallback="/public/plants/placeholder.svg"
              alt="${escapeHtml(topic.title)} 사진" loading="lazy" width="64" height="64" />
            <span class="guide-item__name">${escapeHtml(topic.title)}</span>
            <span class="guide-item__diff">${escapeHtml(diffLabel || "안내")}</span>
          </a>
        </li>
`;

  // <ul class="guide-list"> 의 맨 처음(최신 글이 위로)에 삽입
  const marker = '<ul class="guide-list">';
  const idx = hubHtml.indexOf(marker);
  if (idx === -1) return hubHtml; // 구조가 바뀌었으면 건드리지 않음
  const insertAt = idx + marker.length;
  let out =
    hubHtml.slice(0, insertAt) + "\n" + card.replace(/\n$/, "") + hubHtml.slice(insertAt);

  // JSON-LD ItemList 갱신(있으면): numberOfItems +1, 맨 앞 항목 추가, position 재정렬
  out = updateHubJsonLd(out, topic);
  return out;
}

function updateHubJsonLd(html, topic) {
  const url = `${SITE_URL}/articles/${topic.slug}.html`;
  // numberOfItems 숫자 +1
  html = html.replace(/("numberOfItems"\s*:\s*)(\d+)/, (m, p, n) => p + (Number(n) + 1));

  // itemListElement 배열의 첫 항목 앞에 새 ListItem 삽입(position은 그대로 두되 1을 새 글로)
  const listMarker = '"itemListElement": [';
  const i = html.indexOf(listMarker);
  if (i !== -1) {
    const insertAt = i + listMarker.length;
    const newItem = `\n        { "@type": "ListItem", "position": 1, "name": "${topic.title.replace(/"/g, '\\"')}", "url": "${url}" },`;
    // 기존 position 번호들을 +1
    let before = html.slice(0, insertAt);
    let after = html.slice(insertAt);
    after = after.replace(/"position":\s*(\d+)/g, (m, n) => `"position": ${Number(n) + 1}`);
    html = before + newItem + after;
  }
  return html;
}

/* --- sitemap.xml URL 추가 ------------------------------------- */
function insertSitemap(xml, topic, iso) {
  const loc = `${SITE_URL}/articles/${topic.slug}.html`;
  if (xml.includes(loc)) return xml;

  const block = `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${iso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  // articles.html 허브 url 블록 바로 뒤(안내 글 목록 시작 지점)에 삽입.
  // 안전하게: 마지막 안내 글(articles/...) <url> 묶음 다음, 정보 페이지 주석 앞에 삽입.
  const anchor = "  <!-- 정보 페이지 -->";
  if (xml.includes(anchor)) {
    return xml.replace(anchor, block + "\n" + anchor);
  }
  // 폴백: </urlset> 앞
  return xml.replace("</urlset>", block + "\n</urlset>");
}

/* --- 메인 ----------------------------------------------------- */
async function main() {
  const { iso } = kstDate();
  const topicsState = await readTopics();

  // 하루 1편 초과 금지(중복 실행 가드)
  if (publishedToday(topicsState.list, iso)) {
    console.log(`[generate-article] 오늘(${iso}) 이미 발행됨 — 건너뜀.`);
    return 0;
  }

  const topic = nextQueued(topicsState.list);
  if (!topic) {
    console.log("[generate-article] 큐가 비었습니다 — 발행할 주제 없음. 종료.");
    return 0;
  }

  const plants = await loadPlants();
  const plantInfos = (topic.plant_ids || [])
    .map((id) => plantById(plants, id))
    .filter(Boolean);

  if (!plantInfos.length) {
    throw new Error(`주제 "${topic.slug}"의 plant_ids 가 plants.json 과 일치하지 않습니다.`);
  }

  const { summary, thumbImage, diffLabel } = normalizeTopic(topic, plants);

  console.log(`[generate-article] 주제 선택: ${topic.slug} (식물 ${plantInfos.length}종)`);

  // 본문 생성
  let bodyHtml;
  const prompt = buildPrompt(topic, plantInfos, summary);
  if (MOCK) {
    bodyHtml =
      `    <p class="lead">[MOCK] 테스트용 본문입니다. 실제 발행 시 Anthropic API 본문으로 대체됩니다.</p>\n    <h2>들어가며</h2>\n    <p>${escapeHtml(summary)}</p>\n` +
      plantInfos
        .map(
          (p, n) =>
            `    <h2>${n + 1}. ${escapeHtml(p.name)}</h2>\n    <p>${escapeHtml(p.merit)}</p>\n    <p><a href="/plant.html?id=${p.id}">${escapeHtml(p.name)} 자세히 보기 &gt;</a></p>`
        )
        .join("\n") +
      `\n    <p style="margin-top:var(--space-3)"><a class="btn-primary" href="/quiz.html"><span aria-hidden="true">🌱</span> 우리집에 맞는 식물 추천받기</a></p>\n    <h2>정리하며</h2>\n    <p>천천히 같이 키워봐요.</p>`;
  } else if (DRY) {
    if (process.env.ANTHROPIC_API_KEY) {
      bodyHtml = cleanBody(await callAnthropic(prompt));
    } else {
      console.log("[generate-article] --dry & 키 없음 → 자리표시 본문으로 조립만 검증(파일 미작성).");
      bodyHtml =
        `    <p class="lead">[DRY RUN] 실제 발행 시 Anthropic API 본문이 들어갑니다.</p>\n` +
        plantInfos
          .map(
            (p, n) =>
              `    <h2>${n + 1}. ${escapeHtml(p.name)}</h2>\n    <p>${escapeHtml(p.merit)}</p>\n    <p><a href="/plant.html?id=${p.id}">${escapeHtml(p.name)} 자세히 보기 &gt;</a></p>`
          )
          .join("\n");
      // 조립만 확인하고 파일은 쓰지 않음
      const html = buildArticleHtml({ topic, bodyHtml, iso, summary });
      console.log(`[generate-article] DRY 조립 OK — HTML 길이 ${html.length}자. (파일 미작성)`);
      return 0;
    }
  } else {
    bodyHtml = cleanBody(await callAnthropic(prompt));
  }

  // 글 HTML 작성
  const articleHtml = buildArticleHtml({ topic, bodyHtml, iso, summary });
  const articlePath = path.join(PATHS.articlesDir, `${topic.slug}.html`);
  await writeText(articlePath, articleHtml);
  console.log(`[generate-article] 글 작성: articles/${topic.slug}.html`);

  // 허브 카드 추가
  const hub = await readText(PATHS.articlesHub);
  await writeText(PATHS.articlesHub, insertHubCard(hub, topic, thumbImage, diffLabel));

  // sitemap 추가
  const sitemap = await readText(PATHS.sitemap);
  await writeText(PATHS.sitemap, insertSitemap(sitemap, topic, iso));

  // topics 갱신: published + date (원래 파일 형태 유지)
  topic.status = "published";
  topic.date = iso;
  await writeText(PATHS.topics, serializeTopics(topicsState));

  // rss 재생성
  const rss = await buildRss();
  console.log(`[generate-article] rss.xml 갱신 — ${rss.count}편`);

  console.log(`[generate-article] 완료: ${topic.slug}`);
  return 0;
}

main()
  .then((code) => process.exit(code || 0))
  .catch((err) => {
    console.error("[generate-article] 실패:", err.message);
    process.exit(1); // 실패 시 비정상 종료 → 워크플로가 커밋 안 함
  });
