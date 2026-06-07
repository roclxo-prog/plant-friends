/* =====================================================================
   scripts/auto/generate-posts.mjs — 매일 복붙 마케팅 게시물 생성 (API 불필요)
   - plants.json + 최신 글 + 요일 기반 템플릿/로테이션으로 자연스러운 변형 생성
   - 네이버 카페·밴드용 1~2개, 카톡 1개, 그날 추천 식물 1종 + 최신 글 링크
   - docs/marketing/daily/{YYYY-MM-DD}.md 로 저장(복붙 + 주의사항)
   날짜는 env DAILY_DATE(YYYY-MM-DD) 우선, 없으면 KST(Asia/Seoul) 계산.
   ===================================================================== */
import path from "node:path";
import {
  PATHS, SITE_URL, kstDate, loadPlants, plantById,
  readText, writeText, existsSync, listArticleSlugs, readTopics,
  josa, endDot,
} from "./lib.mjs";

// 요일별로 자연스럽게 도는 인사/톤(스팸 방지: 매일 다른 문장)
const GREETINGS = [
  "안녕하세요. 한 주 잘 보내고 계신가요? 🌱",
  "오늘도 평안한 하루 보내세요. 🌿",
  "날씨 어떠세요? 식물 이야기 하나 나눠 봅니다. 🌱",
  "주말 잘 보내고 계신가요? 초록 친구 소식 전해요. 🌿",
  "오늘은 이런 식물 어떠세요? :)",
  "안녕하세요, 오늘의 초록 친구 소개해 드려요. 🌱",
  "한 주의 시작, 작은 초록으로 기분 전환 어떠세요? 🌿",
];

// 추천 식물에 곁들일 한 줄 변형(plant 정보로 채움 — 자연스러운 존댓말)
function plantBlurbs(plant) {
  const name = plant.name;
  const light = endDot(plant.light_desc || "");
  const water = plant.water_cycle || "";
  const merit = endDot(plant.merit || "");
  return [
    `${josa(name, "은", "는")} ${plant.difficulty} 정도라 처음이셔도 부담이 적어요. 물은 ${water} 주시면 됩니다.`,
    `${name} 키워 보세요. ${light} 손이 많이 가지 않아요.`,
    `오늘은 ${josa(name, "을", "를")} 추천드려요. ${merit}`,
    `${light} 물은 ${water} 정도면 충분한 식물이에요.`,
  ];
}

// 그날의 인덱스(요일·날짜 기반 결정적 회전)
function rotate(arr, seed) {
  if (!arr.length) return null;
  return arr[seed % arr.length];
}

// 추천 식물 풀: common && core 우선(어르신 친화·구하기 쉬움)
function pickFeatured(plants, seed) {
  const pool = plants.filter((p) => p.common && p.tier === "core");
  const list = pool.length ? pool : plants.filter((p) => p.common);
  // 날짜 기반으로 매일 다른 식물(연중 고르게 순환)
  return list[seed % list.length];
}

// 글 HTML에서 제목 추출(사이트명 꼬리 제거)
async function articleMeta(slug) {
  const html = await readText(path.join(PATHS.articlesDir, `${slug}.html`));
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  let title = m ? m[1].trim() : slug;
  title = title.replace(/\s*\|\s*우리집 초록친구\s*$/, "").trim();
  return { slug, title, url: `${SITE_URL}/articles/${slug}.html` };
}

// 최신 글 고르기: topics.json published date 우선, 없으면 디렉터리 mtime 대용으로 알파벳 마지막
async function pickLatestArticle() {
  const slugs = await listArticleSlugs();
  if (!slugs.length) return null;

  // topics.json 의 published 항목 중 가장 최근 발행 글을 우선 사용
  try {
    const { list } = await readTopics();
    const pubs = list
      .filter((t) => t.status === "published" && t.date && slugs.includes(t.slug))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (pubs.length) return articleMeta(pubs[0].slug);
  } catch { /* topics 없거나 깨지면 무시 */ }

  // 폴백: 알파벳 마지막(결정적). 핵심 4개는 제외하지 않음.
  return articleMeta(slugs.sort()[slugs.length - 1]);
}

export async function generatePosts() {
  const { iso, weekday, year, month, day } = (() => {
    const env = process.env.DAILY_DATE;
    if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) {
      const dt = new Date(`${env}T00:00:00+09:00`);
      return {
        iso: env,
        weekday: dt.getUTCDay(),
        year: dt.getUTCFullYear(),
        month: dt.getUTCMonth() + 1,
        day: dt.getUTCDate(),
      };
    }
    return kstDate();
  })();

  const outPath = path.join(PATHS.dailyDir, `${iso}.md`);
  if (existsSync(outPath)) {
    console.log(`[generate-posts] 이미 존재: ${iso}.md (건너뜀)`);
    return { skipped: true, path: outPath };
  }

  const plants = await loadPlants();
  // 날짜 기반 시드(연중 일자) — 결정적이지만 매일 변함
  const seed = Number(`${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`) % 100000;

  const featured = pickFeatured(plants, seed);
  const blurb = rotate(plantBlurbs(featured), seed) || featured.merit;
  const greeting = rotate(GREETINGS, weekday + (day % 3));
  const article = await pickLatestArticle();

  const plantUrl = `${SITE_URL}/plant.html?id=${featured.id}`;
  const safeNote = featured.toxic_to_pets
    ? "반려동물이 잎을 먹지 않게 손이 닿지 않는 곳에 두세요."
    : "강아지·고양이와 함께 두어도 안전한 편이에요.";

  const articleLine = article
    ? `→ ${article.title}: ${article.url}`
    : `→ 읽을거리 모음: ${SITE_URL}/articles.html`;

  // 카페/밴드 글 2종(서로 다른 톤)
  const cafe1 = `${greeting}

요즘 ${featured.name} 키우고 계신 분 있으실까요?
${blurb}
${endDot(featured.caution || "")}

저처럼 처음이신 분들은 손이 적게 가는 친구부터 시작하시면 마음이 편하더라고요.
혹시 우리집에 뭐가 맞을지 모르겠으면, 질문 몇 개 답하면 골라주는 곳도 있어요.
필요하신 분 계시면 댓글로 알려드릴게요. 🌱`;

  const cafe2 = `[오늘의 초록 친구] ${featured.name}

${endDot(featured.merit || "")}
${endDot(featured.light_desc || "")} 물은 ${featured.water_cycle} 정도면 충분해요.
${safeNote}

너무 어렵게 생각 안 하셔도 돼요. 천천히 같이 키워봐요. 🌿`;

  // 카톡 메시지 1개(짧게 + 링크)
  const kakao = `오늘은 ${featured.name} 어때요? ${josa(featured.difficulty, "이라", "라")} 키우기 편해요 🌱
우리집에 맞는 식물은 질문 3개로 1분이면 찾을 수 있어요. 가입·사진 없이요.
${SITE_URL}/`;

  const weekdayKr = ["일", "월", "화", "수", "목", "금", "토"][weekday];

  const md = `# 복붙 게시물 — ${iso} (${weekdayKr}요일)

> 자동 생성된 그날의 복붙 게시물입니다. 아래 코드칸 글을 **그대로 복사 → 붙여넣기** 하세요.
> **원칙: 존댓말·따뜻하게. 도배·과장·허위효능 금지.** 같은 글을 여러 곳에 그대로 붙이지 말고, 내 경험을 한두 줄 바꿔 다르게 쓰세요.
> 라이브: ${SITE_URL}/

---

## 오늘의 추천 식물: ${featured.name}

- 난이도: ${featured.difficulty}
- 물 주기: ${featured.water_cycle}
- 빛: ${featured.light_desc || "-"}
- 상세 페이지: ${plantUrl}
- 안전: ${safeNote}

---

## 1. 네이버 카페 / 밴드 — 경험 나눔형

> **붙여넣는 곳**: 가입해 활동 중인 카페·밴드 새 게시글. 내 식물 사진 1장 함께 올리면 더 좋아요.
> **주의**: 가입 직후엔 쓰지 마세요(며칠 활동 후). 링크는 본문에 넣지 말고, 누가 물으면 댓글로 안내(카페 규정 확인).

\`\`\`
${cafe1}
\`\`\`

> 누가 "어디서 알아봤어요?" 물으면 댓글로:
> \`우리집에 맞는 식물 1분 만에 찾기 → ${SITE_URL}/ (가입·사진 없어요)\`

## 2. 네이버 카페 / 밴드 — 정보 나눔형

> **붙여넣는 곳**: 신뢰가 좀 쌓인 카페에 정보 나눔 게시글. 위 글과 **다른 카페**에 쓰세요(같은 글 도배 금지).
> **주의**: 효능 단정 금지. "저는 이렇게 하니 잘 됐어요" 정도의 경험 톤으로.

\`\`\`
${cafe2}
\`\`\`

> 링크 요청·허용 시 한 줄 덧붙이기:
> \`${articleLine}\`

---

## 3. 카카오톡 메시지

> **붙여넣는 곳**: 자녀·친구와의 **개별 카톡**. 단톡방 도배 금지.
> 링크는 기본 주소를 쓰면 미리보기 카드가 예쁘게 떠요.

\`\`\`
${kakao}
\`\`\`

---

## 오늘 함께 권하기 좋은 글

${articleLine}

---

> 붙여넣기 주의 요약: ① 가입 직후 금지 ② 한 글에 링크 1개 이하 ③ 같은 글 여러 곳 복붙 금지(한두 줄 바꾸기) ④ 단톡방·댓글 도배 금지 ⑤ 효능 과장·단정 금지.
`;

  await writeText(outPath, md);
  return { skipped: false, path: outPath, date: iso, featured: featured.name };
}

const _isMain =
  process.argv[1] &&
  path.basename(process.argv[1]) === path.basename(new URL(import.meta.url).pathname);
if (_isMain) {
  generatePosts()
    .then((r) => {
      if (r.skipped) console.log(`[generate-posts] 건너뜀: ${r.path}`);
      else console.log(`[generate-posts] 생성: ${r.path} (추천: ${r.featured})`);
    })
    .catch((err) => {
      console.error("[generate-posts] 실패:", err.message);
      process.exit(1);
    });
}
