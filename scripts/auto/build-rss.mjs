/* =====================================================================
   scripts/auto/build-rss.mjs — articles/*.html 을 모아 rss.xml(루트) 생성
   - 각 글의 <title>, description, canonical, datePublished 를 추출
   - 유효한 RSS 2.0 출력. API 불필요.
   사용: node scripts/auto/build-rss.mjs   (또는 다른 스크립트에서 buildRss() import)
   ===================================================================== */
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  PATHS, SITE_URL, readText, writeText, escapeXml, rfc822,
} from "./lib.mjs";

function pick(re, html) {
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

// 글 HTML 1개에서 메타 추출
function parseArticle(html, slug) {
  // <title>… | 우리집 초록친구</title> → 사이트명 꼬리 제거
  let title = pick(/<title>([\s\S]*?)<\/title>/i, html);
  title = title.replace(/\s*\|\s*우리집 초록친구\s*$/, "").trim();

  const description = pick(
    /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i,
    html
  );

  let canonical = pick(
    /<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']/i,
    html
  );
  if (canonical && canonical.indexOf("http") !== 0) {
    canonical = SITE_URL + (canonical.indexOf("/") === 0 ? "" : "/") + canonical;
  }
  if (!canonical) canonical = `${SITE_URL}/articles/${slug}.html`;

  // datePublished: JSON-LD 우선, 없으면 dateModified
  let date =
    pick(/"datePublished"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"/i, html) ||
    pick(/"dateModified"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"/i, html);

  return { slug, title, description, canonical, date };
}

export async function buildRss() {
  const files = (await readdir(PATHS.articlesDir)).filter((f) =>
    f.endsWith(".html")
  );

  const items = [];
  for (const f of files) {
    const slug = f.replace(/\.html$/, "");
    const html = await readText(path.join(PATHS.articlesDir, f));
    const a = parseArticle(html, slug);
    if (!a.title) continue; // 제목 없으면 스킵(비정상 파일)
    items.push(a);
  }

  // 최신 날짜 우선 정렬(날짜 같으면 slug 역순으로 안정화)
  items.sort((x, y) => {
    if (x.date !== y.date) return (y.date || "").localeCompare(x.date || "");
    return y.slug.localeCompare(x.slug);
  });

  const latest = items.length ? items[0].date : "";
  const lastBuild = latest ? rfc822(latest) : new Date().toUTCString();

  const itemXml = items
    .map((a) => {
      const pub = a.date ? `\n      <pubDate>${rfc822(a.date)}</pubDate>` : "";
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(a.canonical)}</link>
      <guid isPermaLink="true">${escapeXml(a.canonical)}</guid>
      <description>${escapeXml(a.description)}</description>${pub}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>우리집 초록친구 — 읽을거리</title>
    <link>${SITE_URL}/articles.html</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>식물을 쉽게 고르시도록 큰 글씨로 안내하는 글 모음입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${itemXml}
  </channel>
</rss>
`;

  await writeText(PATHS.rss, xml);
  return { count: items.length, path: PATHS.rss };
}

// 직접 실행 시(이 파일을 node로 직접 돌렸을 때만)
const _isMain =
  process.argv[1] &&
  path.basename(process.argv[1]) === path.basename(new URL(import.meta.url).pathname);
if (_isMain) {
  buildRss()
    .then((r) => {
      console.log(`[build-rss] rss.xml 생성 완료 — ${r.count}편`);
    })
    .catch((err) => {
      console.error("[build-rss] 실패:", err.message);
      process.exit(1);
    });
}
