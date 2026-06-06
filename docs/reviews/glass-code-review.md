# 글래스모피즘 디자인 시스템 — 코드/CSS 품질 & Hard Rules 검수

- 검수일: 2026-06-06
- 검수자: code-reviewer (우리집 초록친구)
- 범위: `styles/tokens.css`, `styles/styles.css`, `index.html`, `quiz.html`, `result.html`, `plant.html`, `plants/sansevieria.html`, `scripts/{quiz,result,plant,app}.js`
- 방침: **리뷰 전용. 소스 직접 수정 없음.**

---

## 요약

| 심각도 | 개수 |
|---|---|
| 🔴 치명 | 0 |
| 🟠 중요 | 4 |
| 🟡 경미 | 7 |

- **치명 0 여부: 예 (치명 0건).**
- **미해결 var(없는 변수/자기참조): 0건.**
- **순환참조: 0건.**

전반적으로 Hard Rules(불투명 카드 위 글씨, 18px+, weight 500+, 버튼 56/96px, 사진 위 텍스트 금지, 유리 폴백)을 잘 지킴. 토큰 단일 출처 원칙도 별칭 매핑이 깔끔하게 유지됨. 발견된 항목은 모두 시각/접근성에 치명적이지 않은 중요·경미 수준.

---

## 1. 토큰 일관성 / var 무결성 (점검 항목 1)

전수 검사 결과 **미해결 var·순환참조 0건.** styles.css의 옛 변수 별칭은 모두 tokens.css의 실존 변수를 가리키며, 자기 자신을 참조하는 규칙 없음.

- `--space-1..4` 겹침은 **의도적으로 회피**됨: styles.css가 `--sp-1..4`(12/16/24/32)를 새로 정의하고 `--space-1..4`를 거기에 연결 → 순환 아님. (styles.css:60-67, 주석으로 명시)
- 단, **의미 변화 주의(중요)**: tokens.css `--space-4 = 24px`인데 styles.css가 `--space-4 = var(--sp-4) = 32px`로 **재정의**. 로드 순서상 styles.css가 이김. tokens.css의 `--space-4`(24px)는 어디서도 그 값으로 쓰이지 않음. → 아래 [중요-1].

| # | 심각도 | 파일:위치 | 문제 | 권고 |
|---|---|---|---|---|
| 중요-1 | 🟠 | tokens.css:35-36 ↔ styles.css:60-67 | tokens.css가 "단일 출처"라 선언했으나 간격 스케일(`--space-1..4`)을 styles.css가 다른 값으로 덮어씀(특히 `--space-4`: 24px→32px). 단일 출처 원칙과 실제가 불일치. 기능 버그는 아니나 유지보수 시 혼란. | tokens.css의 space 스케일을 12/16/24/32로 통일하거나, styles.css 별칭이 tokens 값을 그대로 상속하도록 정리. 최소한 tokens.css 주석에 "간격은 styles.css가 최종 재정의"라고 명시. |
| 경미-1 | 🟡 | tokens.css:46 | 주석 `/* 일반 버튼 (>48px) */` — 실제 값은 56px. 주석의 부등호가 빈약(>48이 아니라 =56). | 주석을 `56px` 명시로 정정. |
| 경미-2 | 🟡 | app.js:155-163 | 토스트가 `font-size:18px`, 색 `#FFFFFF`/`#1B1B1B`, `border-radius:12px` 등 **하드코딩**으로 토큰 우회. (JS 인라인이라 토큰 접근 제약은 이해되나) `var(--bottomnav-h)`는 쓰면서 색/폰트는 하드코딩 — 일관성 부족. | 가능하면 `.app-toast` 클래스를 styles.css에 두고 JS는 클래스만 부여. 최소 18px·weight≥500은 유지되고 있어 Hard Rules 위반은 아님. |
| 경미-3 | 🟡 | styles.css:46, 49-50, 161 등 | `--color-warning-text:#B3261E`, `--color-disabled-bg:#D7D2C4`, `--color-disabled-text:#5A564B`, `--font-size 18px`(app.js) 등 토큰 밖 하드코딩 색 존재. 주석으로 "토큰 외 고대비" 사유는 달려 있음. | 의도된 예외이므로 tokens.css에 `--warn`, `--disabled-*` 토큰으로 승격하면 단일 출처 원칙 완성. |

---

## 2. Hard Rules 위반 (코드 레벨) (점검 항목 2)

**치명적 위반 없음.** 전수 확인 결과:

- 글씨 카드(`.card`, `.choice-card`, `.plant-card__body`, `.info-card`, `.hero__card`, `.reassure`, `.prose`)는 모두 `background: var(--card)`(불투명 흰색) — 반투명/`backdrop-filter` 없음. ✅
- `backdrop-filter`는 `.site-header`(0.82)·`.bottomnav`(0.85) **장식 영역에만** 적용, 둘 다 글씨는 진한 잉크/green-700. ✅
- 사진 위 절대배치 텍스트 없음. 히어로는 배경사진+오버레이 위에 **불투명 흰 `.hero__card`**에만 글씨. `.plant-card__photo`는 글씨 없음. ✅
- font-size: 최소값 `--font-caption = --fs-body = 18px`. 18px 미만 없음. (이모지·동그라미 숫자 28~40px는 텍스트 본문 아님) ✅
- font-weight: body 500, 나머지 600/700. Light/Thin(<500) 없음. ✅
- 버튼 높이: `.btn-primary` 56px, `.choice-card` 96px, `.btn`/`.bottomnav__btn`/네비 48px(--tap-min). 규격 충족. ✅

| # | 심각도 | 파일:위치 | 문제 | 권고 |
|---|---|---|---|---|
| 경미-4 | 🟡 | styles.css:539-540 (`.btn--share`), 768/887 (`.guide-item a`/`.related-plants a`) | `.btn`(목록 버튼) `min-height: var(--tap-min)`=48px. Hard Rules "버튼 56px+" 기준을 엄격 적용하면 결과 카드의 보조 버튼 3종이 48px. 다만 명세가 "일반 버튼 ≥48 / 시작 버튼 56 / 선택 96"의 3단계라면 적합. | 명세 재확인. 보조 버튼도 56px로 올릴지 결정. 현재는 시니어 최소 터치(48px)는 만족. |

---

## 3. 글래스 폴백 (점검 항목 3)

**양호.** 블러 의존 영역 둘 다 폴백 보유:

- `.site-header`: `@supports not (...)` → `background: var(--card)` 불투명 폴백 (styles.css:202-204). ✅
- `.bottomnav`: 동일 폴백 (styles.css:575-577). ✅
- `@supports` 조건이 `backdrop-filter`와 `-webkit-backdrop-filter` 둘 다 검사 → 사파리/구형 모두 커버. ✅

위반 없음.

---

## 4. CSS 품질 (점검 항목 4)

| # | 심각도 | 파일:위치 | 문제 | 권고 |
|---|---|---|---|---|
| 중요-2 | 🟠 | quiz.html:53 ↔ styles.css | `<nav class="progress" id="quiz-progress">`에 부여된 **`.progress` 클래스에 대응하는 CSS 규칙이 없음**(정의는 `.progress__list/__step/__num/__text`만 존재). `.progress` 자체는 스타일 0 → 죽은 클래스. 렌더는 quiz.js가 내부 `<ol class="progress__list">`를 채워 동작하므로 시각 문제는 없으나, 마크업/CSS 계약 불일치. | `.progress` 컨테이너 규칙(여백 등)을 추가하거나, quiz.html의 클래스를 의미에 맞게 정리. 기능 영향 없음(경미에 가까운 중요). |
| 중요-3 | 🟠 | styles.css:735-737 ↔ 931-942 | `.result-cards`의 2열 전환이 **`@media(min-width:768px)`(736행)와 `@media(min-width:1024px)`(936행) 두 곳에서 중복** 정의(둘 다 `repeat(2,1fr)`). 768에서 이미 2열인데 1024 블록이 같은 선언 반복 → 죽은(중복) 규칙. | 1024 블록의 `.result-cards` 재선언 제거. gap만 다르면 gap만 남기기. |
| 경미-5 | 🟡 | styles.css:743 (`.notice` `--radius`), 760·766·775·858·888·912 등 | `.notice`·`.guide-item`·`.related-plants`·`.guide-figure`·`.credits-list` 등이 `var(--radius)`(=24px 카드 반경)를 버튼/썸네일에도 사용. 카드와 버튼 반경 의미가 섞임. 시각상 무해. | 의도면 OK. 썸네일은 `--radius-btn`(16px) 등으로 구분 고려. |
| 경미-6 | 🟡 | quiz.js:177 ↔ styles.css | quiz.js가 건너뛰기 보기에 `.choice-card--skip` 클래스를 부여하나 **styles.css에 `.choice-card--skip` 규칙 없음**(미사용/미스타일 클래스). 기본 `.choice-card`로만 보임. | 스킵 보기를 시각 구분할 의도면 규칙 추가, 아니면 클래스 제거. |
| 경미-7 | 🟡 | styles.css:89-91 | `* { transition-duration: 200ms; }` — **전역 와일드카드 transition-duration**. 모든 요소에 적용되어 의도치 않은 전환(예: 레이아웃 변수 변경 시)이나 약간의 비용 유발 가능. reduced-motion에서 `transition:none`으로 덮어 안전성은 확보됨. | 전역 대신 인터랙티브 요소(`a,button,.btn*,.choice-card`)로 한정 권고. |

**!important 남용:** 없음. `!important`는 `@media(prefers-reduced-motion)` 블록(123-135행)에서만 사용 — 접근성 강제 목적의 적절한 사용. ✅
**z-index 충돌:** skip-link 200 > bottomnav(fixed) 100 > site-header(sticky) 90. 토스트 300이 최상위. 계층 일관·충돌 없음. ✅
**반응형 정합:** 320(max-width:360 보호) / 768 / 1024 / 1920 미디어쿼리 일관. content-max 480→640→760→880 단계적 확장 정상. 1920에서 `--font-base:20px` 상향도 18px 하한 위반 아님. ✅ (단 중요-3 중복 제외)

---

## 5. JS 렌더 마크업 / 접근성 (점검 항목 5)

**양호.** 새 클래스 계약 일치 확인:

- quiz.js → `.choice-group/.choice-card/.choice-card__emoji/__label/__check`, `.progress__list/__step/__num/__text` 모두 styles.css와 일치. `aria-pressed` 토글(false↔true), `aria-current="step"`(WAI-ARIA 유효 토큰), heading `tabindex=-1` 포커스 이동, `sr-only` 병기 — 접근성 우수. ✅
- result.js → `.plant-card/__photo/__body/__badges/.badge/.btn--detail/--shop/--share`, `.result-head card`, `.notice`, `.state-box` 모두 일치. img `alt`, `loading=lazy`, `width/height`, `data-fallback` 부여. ✅
- plant.js → `.info-grid/.info-card/__icon/__title/__value`, `.breadcrumb`, `.related-plants` 일치. `aria-current="page"`, `alt` 부여. ✅
- **esc() XSS 가드 유지**: result.js(13-17)·plant.js(11-15) 모두 `&<>"'` 이스케이프. plants.json 값(name/id/reason/light_desc/water_cycle/merit/caution/scientific_name)에 일관 적용. ✅

| # | 심각도 | 파일:위치 | 문제 | 권고 |
|---|---|---|---|---|
| 중요-4 | 🟠 | result.js:138-139, 151, 153-154 | 이미지 `src`/공유 버튼 속성에서 `esc(img)`·`esc(coupang)`은 적용되나, **`alt="' + name + ' 사진"`의 `name`, `data-share-name="' + name + '"`의 `name`은 `esc()` 통과한 값**(127행 `name=esc(plant.name)`)이라 안전. 단 `alt` 안의 `name`은 따옴표 이스케이프(`&quot;`)가 적용되어 안전하나, **`coupang` URL은 `esc()`로 HTML이스케이프되지만 `javascript:` 스킴 검증은 없음**. plants.json이 신뢰 데이터라 실질 위험 낮음. | coupang_url에 `https?:` 스킴 화이트리스트 검증 1줄 추가 권고(방어적). 현 데이터 신뢰 전제면 수용 가능. |

(주: result.js의 `name`/`id`는 모두 esc 처리된 변수를 재사용하므로 추가 위반 아님. 위 항목은 URL 스킴 방어 보강 권고 수준.)

---

## 6. 성능 (점검 항목 6)

| # | 심각도 | 파일:위치 | 문제 | 권고 |
|---|---|---|---|---|
| 경미-8(중복분 제외, 정보) | 🟡 | index.html:660, public/hero-bg.jpg | 히어로 배경 `url("/public/hero-bg.jpg")` ≈ **347KB**. CSS `background-image`라 `loading`/`fetchpriority` 제어 불가, LCP 영향 가능. 모바일 우선 사이트에서 다소 큼. | hero-bg를 WebP/AVIF로 경량화(목표 <150KB) 또는 `image-set()`으로 화면별 제공. CSS 배경이라 preload(`<link rel=preload as=image>`) 고려. |

기타 성능 양호:
- 폰트 **비차단 로딩**: `media="print" onload="this.media='all'"` 패턴 + `preconnect`/`preload`/`noscript` 폴백 — 모범적. ✅
- result.js/plant.js 이미지 `loading="lazy"`, `decoding="async"`, `width/height` 명시 → CLS 방지. ✅ (sansevieria.html 상단 사진은 `fetchpriority="high"`로 LCP 우선 — 적절)
- plants.json `fetch({cache:"force-cache"})` + 메모리 캐시(`_plantsCache`) — 중복 요청 방지. ✅
- 불필요 리플로우: quiz.js가 `innerHTML` 한 번에 주입(증분 DOM 조작 아님) → 리플로우 최소. `window.scrollTo(0,0)` 매 렌더 호출은 의도된 UX. ✅

---

## 결론

- **치명(🔴) 0건 — 출시 차단 이슈 없음.**
- **미해결 var: 0건 / 순환참조: 0건** (전수 확인).
- 중요(🟠) 4건은 모두 **유지보수성·중복·계약 일치** 성격이며 시각/기능 즉시 결함 아님:
  1. 간격 토큰 단일 출처 불일치(`--space-4` 24↔32),
  2. `.progress` 죽은 클래스(마크업/CSS 계약),
  3. `.result-cards` 2열 미디어쿼리 중복,
  4. coupang URL 스킴 검증 부재(방어적 권고).
- Hard Rules(불투명 카드·18px+·weight 500+·56/96px·사진 위 텍스트 금지·유리 폴백)는 **전 항목 충족.**

### 우선 권고 5
1. `.result-cards` 1024 미디어쿼리 중복 선언 제거(중요-3).
2. `.progress` 컨테이너 규칙 추가 또는 클래스 정리(중요-2).
3. 간격 토큰을 tokens.css 단일 출처로 통일/주석 명시(중요-1).
4. hero-bg.jpg WebP 경량화 + preload(경미-8, LCP).
5. coupang URL `https?:` 스킴 화이트리스트 1줄 추가(중요-4, 방어).
