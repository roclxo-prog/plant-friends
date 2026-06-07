# 애드센스 승인 전 최종 체크리스트 (adsense-final-check)

> 작성: affiliate-marketing-specialist 겸 static-site-dev
> 작성일: 2026-06-07
> 라이브: https://plant-friends.pages.dev · 소스: `C:\projects\plant-friends\`
> 목적: **구글 애드센스 한 번에 승인** 받기 위한 최종 점검 + 사용자가 할 일.

---

## A. 충족 / 미충족 현황

| # | 항목 | 상태 | 근거 / 비고 |
|---|---|---|---|
| 1 | 개인정보처리방침 (광고·쿠키 고지) | ✅ 충족 | `privacy.html` §3 보강: 제3자 광고 공급업체(구글) 쿠키, **개인화 광고**, adssettings.google.com / policies.google.com/technologies/ads / aboutads.info/choices 명시, 브라우저 쿠키 끄기 안내. §4 쿠팡 파트너스 수수료 고지. `docs/content/privacy.md`도 동기화. |
| 2 | 사이트 소개 (about) | ✅ 충족 | `about.html`: 운영 목적·신뢰성·**수익 정직 고지**(쿠팡 파트너스). |
| 3 | 문의 (contact) | ✅ 충족 | `contact.html`: 이메일 문의 + FAQ 9개. 이메일은 `config.js`로 주입(현재 placeholder → 실제 값 필요). |
| 4 | 고유 콘텐츠 분량 | ✅ 충족 | 읽을거리(articles) **10편**, 정적 식물 상세(`plants/*.html`) **12종**, 케어가이드 12편, 홈 추천/랭킹·돌봄안내·퀴즈. 모두 한국어 고유 본문. |
| 5 | 광고 배치 정책 (결과·도구 위 금지) | ✅ 충족 | `.ad-slot`은 콘텐츠 페이지(articles 10·plants 12·about·contact·privacy·plant.html·guide)에만, **본문 최하단**에 위치. index/quiz/result에는 `.ad-slot` 0개(재확인). |
| 6 | 애드센스 로더 코드 주입 | ✅ 충족(코드 완비) | `scripts/app.js`: 실제 ID(ca-pub-…)면 로더 스크립트를 **모든 페이지 head에 1회** 주입(`injectAdsenseLoader`, 심사·자동광고용) + `.ad-slot__body` 있는 페이지에서만 광고 단위 push. placeholder면 아무것도 로드 안 함. `node --check` 통과. |
| 7 | ads.txt | ✅ 준비완료(활성화 대기) | 루트 `ads.txt` 생성. 사용법 주석 + 비활성(주석) 한 줄. **승인 후 pub 번호 넣고 활성화**(가이드: `docs/adsense-ads-txt-안내.md`). |
| 8 | sitemap.xml + robots.txt | ✅ 충족 | `sitemap.xml`에 articles 10편 포함 전 페이지 등록, `robots.txt` Allow + Sitemap 지시. |
| 9 | 모바일 반응형·빠른 로딩 | ✅ 충족 | 전 페이지 `meta viewport`, 외부 의존 최소(Pretendard CDN 1건, preconnect), 자체 호스팅 CSS/JS, 이미지 lazy/async. |
| 10 | 깨진 링크·빈 페이지·"공사중" | ✅ 충족 | 본문 스캔 결과 "공사중/준비중/TODO/coming soon" 0건. articles는 articles.html·sitemap에 모두 연결. |
| 11 | 접근성·가독성(18px+) | ✅ 충족 | 큰 글씨 디자인 토큰, 광고 토스트도 18px, 광고 슬롯에 "광고" 라벨. |
| 12 | 절대경로 | ✅ 충족 | 자산·내부링크 모두 절대경로(`/...`), JSON-LD 절대 URL은 라이브 도메인 기준. |
| 13 | 비밀·실제 ID 하드코딩 없음 | ✅ 충족 | `config.js`는 placeholder만. 코드/ads.txt에 실제 pub ID·비밀 없음. |
| △ | 실제 식물 사진 | ⚠️ 미충족(권장) | `public/plants/*.jpg` 미존재 → placeholder.svg 폴백 중. 사진 없이도 본문 텍스트는 풍부하나, **실제 사진을 채우면 "가치 있는 콘텐츠" 평가에 유리.** |
| △ | 실제 ID 주입 | ⚠️ 미충족(필수) | `config.js`의 `ADSENSE_CLIENT_ID`·`CONTACT_EMAIL` 등 placeholder. 승인 신청 전 최소 `CONTACT_EMAIL`, 승인 후 `ADSENSE_CLIENT_ID`. |

**코드·콘텐츠·정책 측면: 전부 충족. 남은 것은 운영자만 할 수 있는 라이브 설정(이메일·사진·pub ID).**

---

## B. 동적 plant.html?id= (thin content) 평가

- **위험 평가:** `plant.html`은 `?id=`로 213종을 JS 렌더링 → 심사 크롤러에 본문이 얇게(thin) 보일 수 있는 구조.
- **현 대응(적절함):** `plant.html` head에 `<meta name="robots" content="noindex, follow">`가 이미 있음.
  - 213종 동적 페이지는 **색인 제외(noindex)**, 링크는 따라감(follow).
  - 핵심 12종은 별도 **정적** `plants/{id}.html`로 색인(사이트맵 등록), 본문 임베드.
- **의견:** 승인 근거 콘텐츠는 **정적 자산(읽을거리 10편 + 정적 식물 12종 + 케어가이드 12편 + 정책 3종)** 으로 충분합니다.
  이들은 JS 없이도 HTML 본문이 존재해 크롤러가 그대로 읽습니다. 동적 plant.html이 thin으로 평가될 위험은
  noindex로 차단되어 **승인에 부정적 영향을 주지 않습니다.**
- **권고(과한 구조변경 불필요):** 구조는 그대로 두세요. 단, 심사 신청 시 **읽을거리·정적 식물 페이지 URL이
  사이트맵·내부링크로 잘 노출되는지**만 확인하면 됩니다(이미 충족).

---

## C. 사용자가 할 일 (순서대로)

### 1단계 — 신청 전 라이브 설정
1. `scripts/config.js`의 `CONTACT_EMAIL`을 실제 이메일로 교체(정책·문의 페이지에 노출됨).
2. (권장) `public/plants/{id}.jpg` 실제 식물 사진 채우기. `docs/asset-licenses.md`의 무료·상업이용 출처 사용, 800px·4:3 JPG. 채운 뒤 출처/작가 기입.
3. (권장) `COUPANG_TRACKING_ID` 등 나머지 placeholder도 가능하면 채우기(승인과 무관하나 수익화에 필요).
4. 변경분 배포(Cloudflare Pages) 후 라이브에서 페이지가 정상인지 1회 확인.

### 2단계 — 애드센스 가입·신청
5. https://adsense.google.com 가입 → 사이트 `plant-friends.pages.dev` 추가.
6. 애드센스가 주는 **사이트 연결용 코드 스니펫**을 받습니다. 받은 게시자 ID(`ca-pub-...`)를
   `scripts/config.js`의 `ADSENSE_CLIENT_ID`에 입력 → 저장 → **재배포.**
   - 입력 즉시 `app.js`가 로더 스크립트를 모든 페이지 head에 자동 주입(별도 HTML 수정 불필요).
7. 애드센스 콘솔에서 "검토 요청"을 누릅니다. 보통 며칠~2주 소요.

### 3단계 — 승인 후
8. 받은 `pub-번호`로 루트 `ads.txt`의 마지막 줄을 채우고 `#` 제거 → 재배포(가이드: `docs/adsense-ads-txt-안내.md`).
9. (권장) Google Search Console에 사이트 등록 + `sitemap.xml` 제출.

---

## D. 한 번에 통과 팁 (거절 흔한 사유 대비)

- **콘텐츠 가치 부족("low value content") 대비:** 읽을거리 10편·정적 식물 12종이 핵심 근거. 신청 전 실제 식물 사진을 채워 빈 placeholder 인상을 줄이세요(가장 흔한 거절 사유).
- **정책 페이지 누락 대비:** privacy(광고 쿠키 고지 포함)·about·contact 3종 모두 푸터에서 1클릭 접근 가능 — 이미 충족.
- **"사이트 이용 불가/공사중" 대비:** 모든 내부 링크 작동, 빈/공사중 페이지 없음 — 이미 충족. 신청 시점에 라이브가 정상 응답하는지 확인.
- **광고 정책 위반(콘텐츠 없이 광고) 대비:** 광고는 본문 하단에만, 도구(quiz/result)·홈에는 광고 없음 — 이미 충족.
- **트래픽 출처:** 인위적 클릭 유도·자가 클릭 금지. 승인 전후 광고 클릭 절대 금지.
- **신청 후 코드 유지:** 검토 기간 동안 `ADSENSE_CLIENT_ID`를 다시 placeholder로 되돌리지 마세요(로더가 빠지면 "코드를 찾을 수 없음"으로 거절).
- **ads.txt 경고:** 승인 전에는 비워(주석) 두는 게 정상. 승인 후 채우면 됩니다.
