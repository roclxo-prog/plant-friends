# 코드 리뷰 — 우리집 초록친구

- 리뷰어: code-reviewer (리뷰 전용, 코드 직접 수정 없음)
- 리뷰일: 2026-06-06
- 대상: `scripts/{config,match,app,quiz,result,guide}.js`, `styles/styles.css`, 루트 HTML 7종, `plants/*.html`(대표 3종: sansevieria, basil, lettuce)
- 데이터: `packages/plants/plants.json`(12종, 신뢰 데이터)

전체 인상: 바닐라 JS 정적사이트로 구조가 명확하고, 접근성·시맨틱·성능 고려가 전반적으로 우수합니다. defer 사용, lazy 이미지, width/height 명시, skip-link, focus-visible, prefers-reduced-motion, aria-live, sr-only 등 기본기가 탄탄합니다. **치명 결함은 없습니다.** 다만 데이터 가드 누락, XSS 패턴(신뢰 데이터지만 관행), 폰트 로딩 렌더블로킹, data-fallback 속성 의미 불일치 등 중요/경미 개선점이 있습니다.

---

## 1. 치명 (Blocker) — 0건

치명 결함 없음.

---

## 2. 중요 (Major)

| # | 파일:위치 | 문제 | 권고 |
|---|-----------|------|------|
| M1 | `scripts/result.js:127-133` (`render`의 `allZeroFallback`) | `p.tags_light.indexOf(...)` 등을 **가드 없이** 호출. `match.js`는 `Array.isArray`로 가드하지만 여기서는 미가드. 현재 plants.json은 모든 항목이 배열을 갖지만, 데이터에 태그 누락 시 `TypeError`로 결과 화면 전체가 깨짐(빈 카드/렌더 중단). | `match.js`와 동일하게 `a.light && Array.isArray(p.tags_light) && p.tags_light.indexOf(...) !== -1` 형태로 가드. 더 좋게는 점수 계산 로직을 `match.js`로 단일화(중복 제거, 아래 M5 참조). |
| M2 | XSS 패턴: `scripts/result.js:80,84,90` / `scripts/guide.js:13,15` | `plant.name`, `plant.id`, `reason`을 **`innerHTML` 문자열 결합**으로 삽입. plants.json은 신뢰 데이터라 현재 실익은 없으나, 속성값(`alt="'+plant.name+'"`, `data-share-name="'+plant.name+'"`)에 따옴표/`<` 포함 시 속성 탈출·구조 붕괴 위험이 잠재. 향후 데이터 출처가 외부로 바뀌면 즉시 취약. | `textContent`/`setAttribute` 기반 DOM 생성으로 전환하거나, 최소한 HTML 이스케이프 헬퍼(`&<>"'`) 적용. `plant.id`는 화이트리스트(영문/숫자/_)만 허용 권장. |
| M3 | 웹폰트 로딩 (모든 HTML `<head>`, 예: `index.html:26-32`) | Pretendard CSS(`pretendard.min.css`)에 `display=swap` 보장이 없고, **렌더블로킹 `<link rel="stylesheet">`** 2종(jsdelivr + Google Fonts) + preconnect 3개. 외부 폰트 CSS는 LCP/FCP를 직접 지연시켜 Lighthouse 성능 점수에 가장 큰 리스크. | (1) Pretendard는 self-host 또는 필요한 weight subset만, (2) Google Fonts는 가능하면 제거(폴백으로 Pretendard 충분)하여 외부 렌더블로킹 1개로 축소, (3) 폰트 CSS를 `media="print" onload` 또는 `preload`+비동기 적용 패턴으로 비차단화. swap은 이미 Noto에는 적용됨. |
| M4 | `plants/*.html` 상세 대표사진 (`sansevieria.html:130-132` 등) | LCP 후보인 상단 대표 이미지에 `loading="lazy"`만 있고 **`width`/`height`/`decoding`/`fetchpriority` 미지정**. lazy는 above-the-fold LCP 이미지에 오히려 해로움(지연 로드). result/guide 카드 이미지는 width/height가 있으나 상세 페이지 본문 이미지는 누락 → CLS 유발 가능. | 상단 대표 이미지: `loading="eager"` + `fetchpriority="high"` + 명시적 `width`/`height`(예 480×320) + `decoding="async"`. 본문 `guide-figure`는 `width`/`height` 추가로 CLS 방지. |
| M5 | 중복 코드: `scripts/match.js:35-38` ↔ `scripts/result.js:65-96, 127-133` | 점수 계산 로직과 카드 렌더가 두 곳에 흩어져 동일 가중치(3/3/2)를 중복 정의. 한쪽만 바뀌면 결과·라벨 불일치. | 점수 계산은 `match.js` 단일 소스로, `matchPlants`가 score를 함께 반환(`{plant, score}`)하도록 확장해 result.js가 재계산하지 않게. |

---

## 3. 경미 (Minor)

| # | 파일:위치 | 문제 | 권고 |
|---|-----------|------|------|
| m1 | `scripts/quiz.js:45-48` | Q4 옵션 중 "조금 키워 봤어요"와 "잘 키워요"가 **둘 다 `value:"experienced"`**. 의도된 단순화로 보이나, 두 선택지가 동일 결과라 사용자가 구분 의미를 느끼지 못함. 의도면 주석 명시 권장. | 의도라면 코드 주석 추가. 아니면 별도 value 부여 후 match 반영. |
| m2 | `data-fallback` 의미 불일치: `plants/*.html`은 `data-fallback="/public/...placeholder.svg"`(URL) vs `result.js`/`guide.js`는 `data-fallback="1"`. `app.js:51-59`는 속성값을 **무시**하고 항상 하드코딩 `PLACEHOLDER_IMG` 사용. | 동작은 정상이나 HTML의 URL 값이 죽은 정보(오해 유발). 속성값을 실제 폴백 경로로 사용하거나, 상세 HTML도 `data-fallback="1"`로 통일. |
| m3 | `scripts/quiz.js:66-83`, `renderProgress`/`renderQuestion` | 질문을 **`innerHTML` 문자열 빌드**(정적 데이터지만 패턴 일관성). `q.question`/`o.label`은 코드 상수라 안전하나 result/guide와 동일하게 DOM API 권장. | 일관성 차원에서 DOM 생성 또는 `<template>` 사용 고려(필수 아님). |
| m4 | `scripts/app.js:133-145` `fallbackCopy` | `document.execCommand("copy")`는 deprecated. `navigator.clipboard` 폴백으로만 두므로 허용 범위지만, 구형 폴백 임시 textarea가 포커스를 잠깐 가져갈 수 있음. | 현행 유지 가능. 주석으로 deprecated 명시. |
| m5 | 매직넘버: `scripts/quiz.js:145` `delay = 220`, `app.js:169` `3500`, `result.js` width/height `480/320` | 전환 지연·토스트 시간 등 매직넘버가 인라인. | 상단 상수(`var SELECT_DELAY_MS = 220;` 등)로 추출해 유지보수성 향상. |
| m6 | `scripts/app.js:148-170` `toast` | 토스트 스타일을 **JS 인라인 `cssText`로 하드코딩**(색·반경 등). styles.css의 디자인 토큰 원칙과 어긋남. | `.app-toast` 클래스를 styles.css에 정의하고 JS는 클래스만 토글. |
| m7 | `index.html:113` `<ol class="steps-3" style="list-style:none;...">` | 인라인 style 사용(CSP·일관성). `.steps-3`에 동일 규칙 존재하므로 인라인 불필요. | 인라인 style 제거(CSS로 이전). `about.html`/`sansevieria.html`의 `style="margin-top:var(--space-3)"`도 유틸 클래스화 권장. |
| m8 | `styles/styles.css:69-71` `* { transition-duration: 200ms; }` | **전 요소 전역 transition-duration**은 불필요한 스타일 계산/리플로 트리거 가능. reduced-motion에서 무효화하긴 하나 광범위. | 전환이 필요한 컴포넌트에만 `transition` 지정 권장(성능·예측가능성). |
| m9 | `styles/styles.css:637` `.state-box h2` | result.js `renderEmpty`/`renderError`/`render`는 상태 박스에서 `<h1>`을 쓰는데 CSS는 `.state-box h2`만 스타일. 죽은 셀렉터(또는 마크업/CSS 불일치). | 사용 태그에 맞춰 셀렉터 정정. |
| m10 | `result.html:51` `aria-live="polite"`가 `#result-container`에 상주 | 컨테이너 전체가 live region이라 결과 카드 3개 전체 텍스트가 한꺼번에 낭독될 수 있음(장황). | 로딩/상태 문구에만 live 적용하고 결과 본문은 일반 영역으로 분리, 또는 `aria-busy` 활용. |
| m11 | `scripts/result.js:169-172` SITE_URL 조합 | 공유 URL을 `window.CONFIG.SITE_URL`(placeholder 가능)로 만듦. placeholder 미치환 배포 시 잘못된 도메인 공유 위험. | `App.isPlaceholder(SITE_URL)`면 `location.origin` 폴백 사용. |

---

## 4. 항목별 요약

### 4.1 Vanilla JS 품질
- 전역 오염: 최소화 양호(`App`, `matchPlants`, `CONFIG`만 노출, IIFE 사용). `DIFFICULTY_ORDER` 전역 노출은 불필요(테스트 외).
- 이벤트 리스너 누수: quiz의 choice-card 리스너는 매 렌더마다 `innerHTML` 교체로 노드가 폐기되어 GC 대상 → 실질 누수 없음. 이미지 `error` 리스너는 1회 후 자기 제거(양호).
- 에러 처리: `loadPlants` fetch `res.ok` 체크·`.catch` 존재(양호). result/guide 모두 catch로 에러 UI 제공(우수).
- null 가드: match.js 우수, **result.js render는 가드 누락(M1)**.
- 비동기: 캐시(`_plantsCache`) + `force-cache`로 중복 fetch 방지(우수).
- 중복: 점수 로직 중복(M5).

### 4.2 시맨틱 HTML
- header/main/nav/footer 랜드마크 일관 사용, `main#main` + skip-link 우수.
- 페이지당 `h1` 1개 원칙 준수(quiz는 JS가 `#quiz-question`을 h1로 주입, 정적 상태엔 h1 없음 → 로드 전 잠깐 h1 부재는 허용 범위).
- h 위계 양호. about.html h1→h2→h3 정상.
- 목록/버튼/링크 구분 적절(이동=`<a>`, 동작=`<button type=button>`).

### 4.3 접근성
- aria-current(breadcrumb, progress step), aria-pressed(choice-card), aria-live, role=status/alert, sr-only, aria-labelledby(choice-group) 적절.
- 장식 이미지 `alt="" aria-hidden`, 콘텐츠 이미지 의미 있는 alt(우수).
- 키보드 포커스: 질문 전환 시 heading에 `tabindex=-1` 포커스 이동(우수). focus-visible 전역 정의.
- 폼/버튼 라벨 충분. 이모지는 `aria-hidden`으로 낭독 제외(우수).
- 경미: result 컨테이너 live region 범위(m10).

### 4.4 성능 (Lighthouse 90+ 관점)
- defer 스크립트, lazy 이미지(카드), aspect-ratio로 CLS 방지, CSS 토큰 기반 단일 파일(용량 적정)로 양호.
- 리스크: **외부 폰트 2종 렌더블로킹(M3)**, 상세 대표 이미지 lazy+크기 누락(M4). 이 둘이 성능 점수의 주요 변수.

### 4.5 보안
- `target="_blank"` 링크에 `rel="noopener"` 포함(쿠팡 버튼 `noopener nofollow sponsored`)(우수).
- innerHTML 데이터 삽입 패턴(M2): 신뢰 데이터라 현재 안전하나 관행상 개선 권장.
- 비밀키 없음, config는 공개 클라이언트 ID만(주석 명시, 우수).

### 4.6 유지보수성
- 주석 풍부, 함수 분리 양호. 매직넘버/인라인 스타일(m5~m7) 정리 여지.

---

## 5. Lighthouse 추정 점수 (모바일 기준, 배포 후 placeholder 치환·실제 이미지 가정)

| 카테고리 | 추정 | 90+ 가능성 | 근거 |
|----------|------|-----------|------|
| 성능(Performance) | 82~92 | 조건부 가능 | defer/lazy/aspect-ratio는 양호하나 외부 폰트 2종 렌더블로킹(M3)·상세 LCP 이미지 lazy(M4)가 변수. M3/M4 해결 시 95+ 가능. 미해결 시 85 내외. |
| 접근성(Accessibility) | 95~100 | **매우 높음** | 랜드마크·aria·대비(4.5:1 검증 토큰)·포커스·라벨 모두 충실. 거의 만점 기대. |
| 모범사례(Best Practices) | 92~100 | 높음 | rel=noopener, https, color-scheme 적절. execCommand(deprecated)·외부 스크립트(애드센스 로드 시) 정도가 감점 가능. |
| SEO | 95~100 | **매우 높음** | title/description/canonical/OG/구조화데이터(JSON-LD)·lang·viewport 완비. 단, JSON-LD·canonical의 `example.pages.dev` placeholder를 **배포 시 반드시 치환**해야 점수·리치결과 유효. |

주의: 애드센스 로드(`app.js:loadAds`)는 실제 ID 주입 시 성능·모범사례 점수를 끌어내릴 수 있음. placeholder 상태(미로드)에서 측정하면 점수가 더 높게 나옴.

---

## 6. 결론 — 치명 결함 0 여부

**치명 결함 0건 — 확인.**

- 치명: 0
- 중요: 5 (M1 데이터 가드, M2 XSS 패턴, M3 폰트 렌더블로킹, M4 상세 LCP 이미지, M5 점수 로직 중복)
- 경미: 11

전반적으로 프로덕션 배포 가능한 수준이며, 중요 5건(특히 M1 가드·M3 폰트·M4 LCP 이미지)을 처리하면 Lighthouse 전 카테고리 90+가 안정적으로 달성 가능합니다. 배포 전 `example.pages.dev` 및 `여기에_*` placeholder 일괄 치환은 필수입니다.
