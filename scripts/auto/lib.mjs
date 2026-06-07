/* =====================================================================
   scripts/auto/lib.mjs — 자동화 스크립트 공통 헬퍼 (Node ESM)
   - 경로 상수, KST 날짜, 식물 로드, HTML 이스케이프, 파일 유틸
   비밀키는 여기서 다루지 않습니다(env/Actions secret 전용).
   ===================================================================== */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/auto/ → 프로젝트 루트
export const ROOT = path.resolve(__dirname, "..", "..");
export const SITE_URL = "https://plant-friends.pages.dev";
export const ADSENSE_CLIENT = "ca-pub-4865224730315219";

export const PATHS = {
  topics: path.join(ROOT, "scripts", "auto", "topics.json"),
  plants: path.join(ROOT, "packages", "plants", "plants.json"),
  articlesDir: path.join(ROOT, "articles"),
  articlesHub: path.join(ROOT, "articles.html"),
  sitemap: path.join(ROOT, "sitemap.xml"),
  rss: path.join(ROOT, "rss.xml"),
  dailyDir: path.join(ROOT, "docs", "marketing", "daily"),
};

/* --- 날짜(KST, Asia/Seoul) ------------------------------------- */
// 워크플로가 TZ=Asia/Seoul로 실행되거나, 여기서 UTC+9로 직접 계산.
export function kstDate(now = new Date()) {
  // UTC 기준 +9시간
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return { iso: `${y}-${m}-${d}`, year: y, month: kst.getUTCMonth() + 1, day: kst.getUTCDate(), weekday: kst.getUTCDay() };
}

// RFC822(RSS pubDate)용 — 해당 날짜 09:00 KST 기준
export function rfc822(isoDate) {
  // isoDate "YYYY-MM-DD" → 그 날 00:00:00 +09:00
  const dt = new Date(`${isoDate}T00:00:00+09:00`);
  return dt.toUTCString();
}

/* --- 파일 유틸 ------------------------------------------------- */
export async function readJson(p) {
  return JSON.parse(await readFile(p, "utf8"));
}
export async function readText(p) {
  return readFile(p, "utf8");
}
export async function writeText(p, content) {
  await writeFile(p, content, "utf8");
}
export { existsSync };

/* --- 한국어 조사(받침 유무) ----------------------------------- */
// 마지막 글자에 받침이 있으면 hasJong=true
export function hasJongseong(word) {
  if (!word) return false;
  const ch = word[word.length - 1];
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글 음절이 아니면(숫자·영문 등) 받침 없음 취급
  return (code - 0xac00) % 28 !== 0;
}
// 은/는, 이/가, 을/를 등 자동 선택. 사용: word + josa(word, "은", "는")
export function josa(word, withJong, withoutJong) {
  return word + (hasJongseong(word) ? withJong : withoutJong);
}
// 문장 끝에 마침표가 없으면 붙임
export function endDot(s) {
  if (!s) return "";
  return /[.!?。…]$/.test(s.trim()) ? s.trim() : s.trim() + ".";
}

/* --- 식물 ------------------------------------------------------ */
export async function loadPlants() {
  return readJson(PATHS.plants);
}
export function plantById(plants, id) {
  return plants.find((p) => p.id === id) || null;
}

/* --- HTML 이스케이프 ------------------------------------------- */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// XML 텍스트(RSS)용 — &,<,> 만 처리(속성 아님)
export function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* --- topics.json 정규화 ---------------------------------------
   topics.json 은 (A) 최상위 배열  또는  (B) { topics: [...] } 두 형태 모두 허용.
   read → { list, wrap(newList) } 로 다뤄 원래 형태로 다시 저장합니다.
   각 토픽의 누락 필드(summary/diff_label/thumb_id)는 사용처에서 보강합니다. */
export async function readTopics() {
  const raw = await readJson(PATHS.topics);
  if (Array.isArray(raw)) {
    return { list: raw, isArray: true, raw };
  }
  return { list: raw.topics || [], isArray: false, raw };
}
export function serializeTopics(state) {
  if (state.isArray) return JSON.stringify(state.list, null, 2) + "\n";
  return JSON.stringify({ ...state.raw, topics: state.list }, null, 2) + "\n";
}

/* --- 기존 글 슬러그 목록 -------------------------------------- */
export async function listArticleSlugs() {
  const files = await readdir(PATHS.articlesDir);
  return files
    .filter((f) => f.endsWith(".html"))
    .map((f) => f.replace(/\.html$/, ""));
}
