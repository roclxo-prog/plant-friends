# 디자인 리뷰 — 우리집 초록친구

> 검토자: design-lead · 검토일: 2026-06-06
> 검토 대상: `styles/styles.css`(정독), 루트 HTML 7종, `plants/*.html` 대표 3종(sansevieria·basil·phalaenopsis), 자산 SVG 3종
> 기준: `docs/brand.md` (컬러 #2E7D32·#F5F0E1·#5D4037·#1B1B1B·#A5D6A7 / 폰트 Pretendard→Noto Sans KR)
> **본 문서는 점검 결과·수정 지시서입니다. 코드 수정은 별도 작업으로 진행하세요.**

---

## 1. 컬러 일관성

| 항목 | 결과 | 근거(파일:위치) | 수정 지시 |
|---|---|---|---|
| CSS 변수로 팔레트 정의 | **통과** | `styles/styles.css:24-38` — `--color-text:#1B1B1B`, `--color-bg:#F5F0E1`, `--color-primary:#2E7D32`, `--color-secondary:#5D4037`, `--color-soft:#A5D6A7` 모두 brand.md 확정값과 정확히 일치 | 없음 |
| HTML 내 하드코딩 색 | **통과** | 루트 7종 + plants 전수 `#hex`/`color:`/`background` 검색 결과 0건. 인라인 `style`은 `var(--space-3)`·`list-style` 등 토큰/레이아웃만 사용(`index.html:108`, 각 plants `:200~217`) | 없음 |
| CSS 내 비변수 색 사용 | **부분 통과** | `--color-primary-dark:#256628`, `--color-primary-darker:#1E551F`, `--color-warning-text:#B3261E`, `--color-disabled-bg:#D7D2C4`, `--color-disabled-text:#5A564B`(`styles.css:29-38`)는 brand.md 팔레트에 없는 파생색 | 의도된 상태색(hover/active/경고/비활성)으로 합리적. 단 brand.md에 **파생 토큰 표를 추가**해 출처를 명문화할 것. 신규 색 추가는 금지. |
| 자산 SVG 색 | **통과** | `public/logo.svg:6,11,13,18`, `favicon.svg:4,9,11`, `og-image.svg:4,11,14,16,23,30` 모두 5색 팔레트 정확히 사용(브라운 화분/초록 큰잎/연초록 작은잎/크림 배경·잎맥/잉크 본문) | 없음 |
| 연초록 위 텍스트 규칙 | **통과** | `styles.css:357` 선택카드 활성 시 `background:var(--color-soft)` + 본문색 잉크 유지(11.3:1). `.notice`(`:604-611`), `.badge`(`:415-423`)도 연초록 위 잉크만 사용 | 없음 |

**소결:** 컬러 일관성 우수. 변수 단일 출처 원칙이 HTML까지 관철됨. 파생색 문서화만 보완 권장.

---

## 2. 폰트 일관성

| 항목 | 결과 | 근거(파일:위치) | 수정 지시 |
|---|---|---|---|
| Pretendard 로드(jsDelivr) | **통과** | 전 페이지 head 동일: `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/...pretendard.min.css` (`index.html:24-25` 외 전 페이지) | 없음 |
| Noto Sans KR 폴백(swap) | **통과** | `fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap` 전 페이지(`index.html:26-27`) | 없음 |
| `font-family` 선언 일관 | **통과** | `--font-sans`(`styles.css:12-14`) brand.md 스택과 일치, `body`(`:80`)·버튼·카드 모두 `var(--font-sans)` 참조. SVG 텍스트도 `Pretendard,'Noto Sans KR',sans-serif`(`logo.svg:18`, `og-image.svg:23-30`) | 없음 |
| Pretendard `<link>` 속성 | **부분 통과** | `<link rel="stylesheet" as="style" crossorigin>`(`index.html:24`) — `as`는 `rel="preload"`용 속성으로 `rel="stylesheet"`에선 무의미(브라우저 무시, 동작엔 무해) | (경미) `as="style"` 제거하거나, 진짜 프리로드를 원하면 `<link rel="preload" as="style">` + `<link rel="stylesheet">` 2줄로 분리. 기능 영향 없으므로 우선순위 낮음. |
| 본문 최소 크기 | **통과** | `--font-base:18px`(`:17`), 캡션 `--font-caption:16px`(`:18`) — brand.md 18px+/16px+ 충족 | 없음 |

**소결:** 폰트 로드·폴백·크기 규칙 전부 충족. `as="style"` 속성만 정리 권장.

---

## 3. 로고 / 파비콘 / OG

| 항목 | 결과 | 근거(파일:위치) | 수정 지시 |
|---|---|---|---|
| favicon 절대경로 참조 | **통과** | 전 페이지 `<link rel="icon" href="/public/favicon.svg">` + `apple-touch-icon`(`index.html:10-11` 외). 파일 실재: `public/favicon.svg` | 없음(아래 PNG 폴백 항목 참조) |
| logo 참조 | **통과** | `index.html:85` hero `/public/logo.svg`, JSON-LD `logo`(`:43`) 모두 절대경로, 파일 실재 | 없음 |
| OG 이미지 참조 | **부분 통과(주의)** | 전 페이지 `og:image=/public/og-image.svg`. 파일은 실재하나 **SVG는 주요 SNS(카카오톡·페이스북·트위터/X·슬랙)에서 OG 썸네일로 렌더 안 됨** — 빈 미리보기 위험 | **`public/og-image.png`(1200×630 PNG)를 생성**하고 전 페이지 `og:image`를 `/public/og-image.png`로 교체. SVG는 소스로 보관. brand.md 권장도 `.png`임. **우선 수정 대상.** |
| OG 절대 URL | **부분 통과** | `og:image`가 사이트 루트 상대(`/public/...`). 일부 크롤러는 절대 URL(`https://...`) 요구 | 배포 시 `og:image`를 `https://<도메인>/public/og-image.png` 절대 URL로 치환(이미 JSON-LD는 placeholder 치환 안내 있음, `index.html:33`). OG에도 동일 치환 절차 추가. |
| 파비콘 PNG 폴백 | **부분 통과** | brand.md `:152` 권장: `favicon-32.png`/`favicon-16.png`/`apple-touch-icon.png`(180). 현재 `apple-touch-icon`이 **SVG를 가리킴**(`index.html:11`) — iOS 홈화면 아이콘은 SVG 미지원 | `apple-touch-icon.png`(180×180 PNG) 생성 후 `<link rel="apple-touch-icon" href="/public/apple-touch-icon.png">`로 교체. 16/32 PNG도 구형 브라우저용으로 추가 권장. |
| 누락 페이지 | **통과** | quiz·result 포함 7종 + plants 3종 전부 favicon/og 세트 보유. 누락 없음 | 없음 |

**소결:** 참조 경로·파일 실재성은 양호하나, **OG/애플터치 아이콘이 SVG라 실제 공유·홈화면에서 깨질 위험** → PNG 산출이 핵심 보완.

---

## 4. 반응형 6종(320 / 375 / 414 / 768 / 1024 / 1920)

### 4.1 브레이크포인트별 위험 지점

| 폭(px) | 적용 규칙 | 위험 지점 | 판정 | 수정 지시(CSS) |
|---|---|---|---|---|
| **320** | `@media(max-width:360px)` 컨테이너 패딩 축소(`styles.css:780-783`) | 진행바 `.progress__list`가 `justify-content:space-between` + 단계명 한글 라벨. 320px에서 3단계 텍스트가 좁아져 줄바꿈·세로 뭉침 가능(`:371-393`). 하단 네비 버튼 2개 "← 이전"/"🔄 처음부터 다시"가 `font-base 18px`로 320px에선 빠듯 | **주의** | `@media(max-width:360px)`에 `.bottomnav__btn{font-size:var(--font-caption);padding:0 8px;}` 추가, `.progress__text{word-break:keep-all;}` 추가로 한글 단어 깨짐 방지 |
| **375** | 기본(모바일 1열) | 대표적 정상 폭. info-grid 1열, 카드 풀폭 | **통과** | 없음 |
| **414** | 기본(모바일 1열) | 정상 | **통과** | 없음 |
| **768** | `--content-max:640px`, `--font-h1:32px`, `.related-plants` 2열(`:743-745,751-757`) | `.info-grid`는 `flex-direction:column`(`:504`)으로 **768~1024에서도 1열 유지** → 넓은 화면에 카드가 세로로만 길게 늘어져 여백 과다 | **주의(미관)** | `@media(min-width:768px){.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--space-2);}}` 추가 검토(2열로 시선 효율↑). 깨짐은 아님 |
| **1024** | `--content-max:760px`, `.result-cards` 2열(`:759-770`) | `.result-cards` 그리드 클래스가 **result.js 렌더 마크업에 실제 존재하는지 미확인**(result.html은 JS 주입). 클래스 누락 시 2열 미적용 | **확인 필요** | result.js 출력 컨테이너에 `class="result-cards"` 부여 확인. 없으면 추가 |
| **1920** | `--content-max:880px`, `--font-base:20px`(`:772-777`) | 본문 880px 폭 캡으로 초대형 화면에서도 줄길이 제어 양호(한글 35~45자 권장 부합). 가로 스크롤 유발 요소 없음 | **통과** | 없음 |

### 4.2 가로 스크롤 / 넘침 공통 점검

| 위험 요소 | 결과 | 근거 | 수정 지시 |
|---|---|---|---|
| 컨테이너 max-width | **통과** | `.container`/`header__inner`/`footer__inner`/`bottomnav` 모두 `max-width:var(--content-max)` + `width:100%`(`:145-150,164-173,470-471`) | 없음 |
| 카드 그리드 | **통과** | `.related-plants` 모바일 1열→768 2열(`:697-704,744`). `.result-cards` 1024 2열. 넘침 없음 | 4.1의 result-cards 클래스 확인만 |
| 진행바 | **주의** | `.progress__step{flex:1 1 0}`(`:380`)로 균등 분할되나 한글 라벨 줄바꿈 미제어 | `word-break:keep-all` 추가(위) |
| 하단 고정 네비 | **통과** | `position:fixed` + `max-width` + `env(safe-area-inset-bottom)`(`:467-476`), `has-bottomnav` 본문 하단 여백 확보(`:153-155`) | 320px 폰트 축소만(위) |
| info-grid | **통과(깨짐 없음)** | flex 1열, 카드 내부 `grid-template-columns:48px 1fr`(`:506-507`) — 아이콘+텍스트 안정 | 768+ 2열은 미관 개선(선택) |
| 이미지 넘침 | **통과** | `img{max-width:100%}`(`:90`), 카드 사진 `aspect-ratio:3/2;object-fit:cover`(`:406-407`) | 없음 |

**소결:** 모바일 우선 구조 견고, 가로 스크롤 유발 요소 없음. 320px 하단 네비 글자/진행바 한글 줄바꿈, 그리고 result-cards 클래스 적용 여부가 점검 포인트.

---

## 5. 간격·여백 일관성 / 정렬 (시니어 친화)

| 항목 | 결과 | 근거(파일:위치) | 수정 지시 |
|---|---|---|---|
| 간격 토큰화 | **통과** | `--space-1~4`(12·16·24·32) 일관 사용, 매직넘버 거의 없음(`styles.css:47-50`) | 없음 |
| 터치 타깃 | **통과** | 버튼 `--tap-min:48px`/주버튼 56px/선택카드 96px(`:41-43`), 네비·푸터 링크 `min-height:48px`(`:194,230`) — brand.md 48px+ 충족 | 없음 |
| 버튼 간 간격 | **통과** | `--gap-min:12px` 카드 액션·네비·choice-group 적용(`:319,438,469`) | 없음 |
| 카드 정렬 | **통과** | `.choice-card`/`.info-card`/`.plant-card` flex/grid 정렬 일관, `text-align:left`로 좌측 정렬(`:331`) | 없음 |
| 본문 행간 | **통과** | `--line-height:1.7`(`:22`) brand.md 권장 1.7 일치 | 없음 |
| 잔여 매직넘버 | **부분 통과** | `8px`(`:177,255,338` 등), `4px`, `40px`(emoji), `64px`(thumb) 등 소수 하드코딩 | 기능 무해. 정밀 일관성 원하면 `--space-0:8px` 토큰화. 우선순위 낮음 |

**소결:** 넉넉한 여백·큰 터치 타깃 등 시니어 친화 원칙이 토큰 단위로 잘 반영됨.

---

## 6. 다크모드 / 고대비 환경

| 항목 | 결과 | 근거 | 수정 지시 |
|---|---|---|---|
| `prefers-color-scheme` 대응 | **실패(미구현)** | `styles.css` 전체에 `prefers-color-scheme` 규칙 없음. OS 다크모드 시 크림 배경·잉크 본문 그대로 유지 | 정적 라이트 테마 고정이 의도라면 `<meta name="color-scheme" content="light">`를 head에 명시해 브라우저 강제 다크 반전(특히 모바일)·폼요소 색 뒤집힘을 방지. **권장 추가.** |
| `prefers-contrast` 대응 | **실패(미구현)** | 고대비 모드 전용 규칙 없음 | 기본 대비가 이미 높음(잉크/크림 15.8:1, 모든 조합 4.5:1+ 검증). 필수는 아님. 추가 시 `@media(prefers-contrast:more){:root{--color-border:#1B1B1B;}}`로 테두리 강화 가능 |
| 강제 다크모드 깨짐 위험 | **주의** | `--color-surface:#FFFFFF` 카드가 모바일 강제 다크에서 반전되면 본문 대비 역전 우려 | 위 `color-scheme:light` 메타로 예방 |

**소결:** 다크/고대비 미구현이나 라이트 단일 테마 정책상 치명적 아님. 단 강제 다크 반전 방지용 `color-scheme:light` 메타는 추가 권장.

---

## 종합 점수

| 항목 | 배점 | 득점 | 비고 |
|---|---:|---:|---|
| 1. 컬러 일관성 | 20 | 19 | 파생색 문서화만 미흡 |
| 2. 폰트 일관성 | 15 | 14 | `as="style"` 경미 |
| 3. 로고/파비콘/OG | 20 | 13 | OG·apple-touch가 SVG → PNG 필요 |
| 4. 반응형 6종 | 20 | 17 | 320 네비/진행바, result-cards 확인 |
| 5. 간격·여백·정렬 | 15 | 14 | 소수 매직넘버 |
| 6. 다크/고대비 | 10 | 7 | 미구현, color-scheme 메타 권장 |
| **합계** | **100** | **84** | |

### 통과 여부: **통과 (84점 / 80점 기준)**

브랜드 일관성(컬러·폰트·자산)은 매우 견고하며 토큰 단일 출처 원칙이 HTML까지 관철됨. 감점의 핵심은 **공유·아이콘용 PNG 산출 부재**와 일부 반응형 미세 위험.

---

## 우선 수정 3~5개 (순위)

1. **[높음] OG 이미지 PNG 산출** — `public/og-image.png`(1200×630) 생성, 전 페이지 `og:image`를 `/public/og-image.png`로 교체. SVG는 SNS 썸네일에서 렌더되지 않아 공유 시 빈 미리보기 발생. (근거: 전 페이지 head `og:image=/public/og-image.svg`)
2. **[높음] apple-touch-icon PNG 산출** — `public/apple-touch-icon.png`(180×180) 생성 후 `apple-touch-icon` 참조 교체. iOS 홈화면은 SVG 미지원. 16/32 PNG 폴백도 함께 권장. (근거: `*.html:11`)
3. **[중간] 320px 하단 네비·진행바 보호** — `@media(max-width:360px)`에 `.bottomnav__btn{font-size:var(--font-caption);padding:0 8px;}` 와 `.progress__text{word-break:keep-all;}` 추가로 좁은 화면 글자 깨짐/줄바꿈 방지. (근거: `styles.css:477-499,371-393,780-783`)
4. **[중간] result-cards 클래스 적용 확인** — 1024px 2열 그리드가 동작하려면 result.js가 렌더하는 컨테이너에 `class="result-cards"`가 있어야 함. 누락 시 추가. (근거: `styles.css:763-770`, `result.html:46` JS 주입)
5. **[낮음] `color-scheme:light` 메타 추가** — 전 페이지 head에 `<meta name="color-scheme" content="light">` 추가로 모바일 강제 다크모드 반전 시 카드/본문 대비 역전 예방. (근거: `styles.css` 다크모드 규칙 부재)

> 선택 보완: brand.md에 파생 상태색(hover/active/경고/비활성) 토큰 표 추가, Pretendard `<link>`의 `as="style"` 정리, 768px+ info-grid 2열 미관 개선.
