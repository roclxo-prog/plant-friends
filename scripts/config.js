/* =====================================================================
   scripts/config.js — 모든 페이지 <head>에 가장 먼저(동기) 로드
   실제 ID는 배포 전 이 파일만 교체합니다(placeholder만 보관).
   이 정적사이트는 빌드 단계가 없으므로 빌드 시점 환경변수를 쓰지 않고,
   오직 이 window.CONFIG 객체로만 설정값을 주입합니다.
   여기 값은 모두 공개 가능한 클라이언트 ID여야 합니다(비밀키 금지).
   ===================================================================== */
window.CONFIG = {
  COUPANG_TRACKING_ID: "여기에_쿠팡_ID",
  ADSENSE_CLIENT_ID: "여기에_애드센스_ID",
  KAKAO_JS_KEY: "여기에_카카오_JS_키",
  CONTACT_EMAIL: "여기에_이메일@example.com",
  SITE_URL: "https://plant-friends.pages.dev"
};
