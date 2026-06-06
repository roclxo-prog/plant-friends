# 모션 최소화 점검 보고서 (motion-review)

- 대상: `우리집 초록친구` (어르신 대상 식물 추천 웹)
- 점검자: ui-ux-specialist
- 점검일: 2026-06-06
- 점검 범위(읽기 전용):
  - `styles/styles.css` — animation·transition·transform 전수
  - `scripts/quiz.js`, `result.js`, `app.js`, `guide.js`, `match.js` — JS 애니메이션·스크롤·자동전환
  - 루트 HTML 7개(`index/about/guide/quiz/result/privacy/contact.html`) — 자동재생 미디어·marquee·자동 캐러셀

> 본 문서는 점검·지시서이며 코드 파일은 수정하지 않았습니다.

---

## 점검 결과 표

| # | 항목 | 결과 | 근거(파일:위치) | 수정지시 |
|---|------|------|----------------|----------|
| 1 | 자동재생 비디오·GIF·캐러셀 없음 | 준수 | 전수 검색 결과 `<video>`·`<audio>`·`autoplay`·`marquee`·`carousel`·`.gif` 0건. HTML 7개 모두 정적 마크업 | 없음 |
| 2 | 카드 호버 모션 약하게 + `:hover`/`:focus-visible` 동일 처리 | 준수 | `.choice-card`(347–351), `.btn`(454–457), `.btn-primary`(303–308), `.bottomnav__btn`(491–494), `.guide-item a`(633–636), `.related-plants a`(724–728), `.site-nav a`(202–206) — 모두 `:hover, :focus-visible`를 한 셀렉터로 묶어 동일 효과(outline/underline)만 적용. scale·이동 없음 | 없음 |
| 3 | 전환은 은은하게, 200ms 이내 | 준수 | `* { transition-duration: 200ms; }`(70). 전역 상한 200ms 고정, 과한 transition 속성 지정 없음 | 없음(권고: 아래 경미 1) |
| 4 | `prefers-reduced-motion: reduce` 무력화 처리 존재 | 준수 | `@media (prefers-reduced-motion: reduce)`(98–106) — `animation:none !important; transition:none !important; scroll-behavior:auto !important` 전역 적용. line 75의 `scroll-behavior: smooth`도 여기서 무력화됨 | 없음(권고: 아래 경미 2) |
| 5 | 무한 애니메이션·깜빡임(3회/초 초과) 없음 — 광과민성 안전 | 준수 | `@keyframes`·`animation-name`·`infinite` 0건. 점멸/플래시 효과 없음 | 없음 |
| 6 | 페이지 자동 이동·강제 스크롤 없음(클릭 기반만) | 준수 | meta refresh 0건. `quiz.js`의 다음 질문 전환(143–151)·`finish()`(179–187)는 모두 사용자 클릭(`onSelect`) 직후 실행. `window.scrollTo(0,0)`(128)는 질문 교체 시 화면 상단 복귀(즉시·비애니메이션, 기대된 동작). `result.js` 이동(183–185)도 클릭 핸들러 내 | 없음(권고: 아래 경미 3) |

---

## 권고(경미) — 통과에는 영향 없음, 품질 개선 차원

### 경미 1 — 전역 `transition-duration` 적용 범위 광범위
- 위치: `styles/styles.css:69–71` `* { transition-duration: 200ms; }`
- 내용: 모든 요소에 일괄 200ms 부여. 현재 `transition-property`가 명시되지 않아 실제 애니메이션되는 속성은 브라우저 기본(없음 또는 all 미지정)에 의존, 위반은 아님. 다만 의도치 않은 속성까지 전환될 여지가 있음.
- 권고(수정 시): 와일드카드 대신 인터랙션 요소에 명시적 속성 한정.
  ```css
  /* 권고: 전역 * 대신 대상 한정 */
  .btn, .btn-primary, .choice-card, .bottomnav__btn,
  .guide-item a, .related-plants a, .site-nav a, a {
    transition: outline-color 200ms ease, background-color 200ms ease, color 200ms ease;
  }
  ```
  (필수 아님. 현 상태로도 항목 3 통과)

### 경미 2 — `:active` 의 `transform: translateY(1px)` 가 reduced-motion에서 미무력화
- 위치: `.btn-primary:active`(309), `.choice-card:active`(352), `.btn:active`(458), `.bottomnav__btn:active`(495), `.related-plants a:active`(729)
- 내용: 1px 눌림 피드백은 모션으로 보기 어려운 미세 이동이며 `transition:none`으로 즉시 적용되어 애니메이션도 아님. 위반 아님.
- 권고(엄격 적용 원할 때):
  ```css
  @media (prefers-reduced-motion: reduce) {
    .btn-primary:active, .choice-card:active, .btn:active,
    .bottomnav__btn:active, .related-plants a:active { transform: none; }
  }
  ```
  (필수 아님)

### 경미 3 — `quiz.js` 자동 다음전환 220ms 지연이 reduced-motion에서 동일
- 위치: `scripts/quiz.js:143–150` `setTimeout(..., 220)`
- 내용: 선택 카드 클릭 후 체크 표시를 보여주고 220ms 뒤 다음 질문으로 전환. 사용자 클릭 직후이므로 "자동 이동" 위반 아님(항목 6 통과). 다만 모션 민감 사용자에게는 즉시 전환이 더 안정적.
- 권고(엄격 적용 원할 때): reduced-motion 환경이면 지연 없이 즉시 전환.
  ```js
  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var delay = reduce ? 0 : 220;
  setTimeout(function () { /* 기존 로직 */ }, delay);
  ```
  (필수 아님)

---

## 분류 및 통과 여부

- 치명(Critical) 위반: **0건**
- 경미(Minor) 위반: **0건** (위 3개는 위반이 아닌 품질 권고 사항)

### 최종 판정: **통과 (PASS)**

6개 점검 항목 전부 준수. 자동재생 미디어·무한/점멸 애니메이션·강제 스크롤·자동 페이지 이동 없음. `:hover`/`:focus-visible` 동일 처리로 호버 비의존 충족, 전환 200ms 상한 고정, `prefers-reduced-motion: reduce` 전역 무력화 존재. 광과민성 안전 기준 충족.
