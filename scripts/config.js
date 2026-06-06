/* =====================================================================
   scripts/config.js — 모든 페이지 <head>에 가장 먼저(동기) 로드
   실제 ID는 배포 전 이 파일만 교체합니다(placeholder만 보관).
   NEXT_PUBLIC_ 등 빌드 환경변수 절대 사용 금지.
   여기 값은 모두 공개 가능한 클라이언트 ID여야 합니다(비밀키 금지).
   ===================================================================== */
window.CONFIG = {
  COUPANG_TRACKING_ID: "여기에_쿠팡_ID",
  ADSENSE_CLIENT_ID: "여기에_애드센스_ID",
  KAKAO_JS_KEY: "여기에_카카오_JS_키",
  CONTACT_EMAIL: "여기에_이메일@example.com",
  SITE_URL: "https://초록친구.example.pages.dev"
};
