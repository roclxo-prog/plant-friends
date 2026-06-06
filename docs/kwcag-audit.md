# KWCAG 2.2 + 시니어 친화 전수검사 — 수정 지시서

> 대상: 우리집 초록친구 정적 사이트 (루트 HTML 7 + plants/*.html 12 + styles.css + scripts)
> 기준: `docs/senior-ux-guide.md` (KWCAG 2.2 29항목 + 핵심원칙 8 + 금지사항)
> 작성일: 2026-06-06 · 작성자: senior-ux-specialist
> 검사 방식: index/quiz/result/guide/plants(sansevieria) 정독 + 나머지 18개 HTML 패턴 일치 확인 + CSS 토큰·대비값 수치 계산
> **본 문서는 읽기 전용 검사 결과입니다. 파일을 수정하지 않았습니다.**

---

## 1. 항목별 점검 결과

### 항목 1 — 본문 18px+ / 제목 24~32px

| 결과 | 근거(파일:위치) | 비고 |
| --- | --- | --- |
| **통과** | styles.css:17-21 `--font-base:18px`, `--font-h2:26px`, `--font-h1:30px(768px↑ 32px)`, `--font-h3:22px` | 본문·제목 토큰 모두 기준 충족 |
| **주의(경미)** | styles.css:18 `--font-caption:16px` | 가이드 4번 "캡션도 18px 이하 금지", 금지사항 "16px 이하 폰트 본문·캡션·안내 어디에도 금지"와 충돌. 실제 사용처: `.site-nav a`(196), `.badge`(419), `.progress__step`(381), `.breadcrumb`(654), `figcaption`(692), `.guide-item__diff`(643), `.ad-disclosure`(736), `.site-footer__note`(245), `app.js:160 toast 는 18px라 무관` |

**수정지시 (중요):**
`--font-caption` 을 16px → **18px** 로 상향.
```css
/* before */ --font-caption: 16px;
/* after  */ --font-caption: 18px;
```
상향 시 `.site-nav` 가 360px에서 줄바꿈될 수 있으므로, 내비 항목이 넘치면 `styles.css:188 .site-nav { gap:4px }` 유지하되 `@media(max-width:360px)`(780)에서 `.site-nav a { font-size: var(--font-base); padding:0 6px; }` 로 보호. 라벨이 짧아(소개/문의 등) 18px도 수용 가능.

---

### 항목 2 — 명도 대비 4.5:1+

계산값(WCAG 상대휘도 공식):

| 조합 | 대비 | 판정 |
| --- | --- | --- |
| 본문 #1B1B1B / 크림 #F5F0E1 | 15.12:1 | 통과 |
| 본문 #1B1B1B / 흰 #FFFFFF | 17.22:1 | 통과 |
| 본문 #1B1B1B / 연초록 #A5D6A7 (선택카드 active·notice) | 10.48:1 | 통과 |
| 흰 글자 / 초록 #2E7D32 (btn-primary, btn--detail) | **5.13:1** | 통과 |
| 흰 글자 / 브라운 #5D4037 (btn--shop, restart) | 9.32:1 | 통과 |
| 브라운 #5D4037 / 크림 (lead, 부제목, 푸터링크, ad-disclosure) | 8.18:1 | 통과 |
| 브라운 #5D4037 / 흰 (btn--share 글자, site-nav) | 9.32:1 | 통과 |
| 브라운 #5D4037 / 연초록 #A5D6A7 | 5.67:1 | 통과 |
| 초록 #2E7D32 / 크림 (본문 인라인 링크 `a`, 헤더 로고) | **4.50:1** | 통과(경계값) |
| 초록 #2E7D32 / 흰 | 5.13:1 | 통과 |
| 경고 #B3261E / 흰 (badge--warn, info-card--warn) | 6.54:1 | 통과 |
| 경고 #B3261E / 크림 | 5.74:1 | 통과 |
| 비활성 #5A564B / 비활성배경 #D7D2C4 | 4.85:1 | 통과(비활성도 3:1+ 충족) |

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | 위 표, styles.css:24-38 토큰 | 모든 실제 사용 조합이 4.5:1 이상. 위반 조합 없음 |

**수정지시 (경미·권고):**
초록 #2E7D32 가 크림 위에서 정확히 **4.50:1**(경계). `a { color: var(--color-primary) }`(styles.css:94)가 크림 배경 본문에 인라인 링크로 쓰이면 합격선에 턱걸이. 안전 여유를 위해 본문 인라인 링크는 `--color-primary-dark(#256628, 흰 6.98:1 / 크림 약 6:1)` 사용 권고:
```css
/* styles.css:93-95 권고 */
a { color: var(--color-primary-dark); }
```
필수 아님(현재도 통과). 단, 추후 폰트 색 변경 시 이 경계값을 깨지 않도록 주의.

---

### 항목 3 — 터치영역 48×48px+ / 간격 12px+

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | btn-primary 56px(289), choice-card 96px(326), btn 48px(442), bottomnav 72px(472)/btn 48px(479), site-nav a 48px(194), footer a 48px(231), breadcrumb a 48px(660), guide-item 96px(625), related-plants 96px(709) | 모든 타깃 48px+ |
| **통과(간격)** | choice-group gap 12px(319), btn-group/actions gap 12px(438), bottomnav gap 12px(469), footer-links gap 12px(223) | 간격 12px+ 충족 |

**수정지시:** 없음(준수).
참고(경미): `.site-nav { gap:4px }`(189) 와 `.plant-card__badges gap:8px`(412)는 12px 미만이나, 내비 링크는 패딩으로 실제 터치영역이 분리되고 badge는 터치 타깃이 아닌 표시 요소라 위반 아님.

---

### 항목 4 — 진행바 ①②③ + 현재단계 텍스트 병기(색만 X)

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | quiz.js:66-83 renderProgress: `①②③`+텍스트(빛/물/목적)+`aria-current="step"`+`is-current`(굵기·밑줄·색)+`.sr-only "(지금 여기)"` / 완료단계 `.sr-only "(완료)"` | 숫자·텍스트·굵기·밑줄·스크린리더 라벨까지 다중 표기. 색 단독 의존 아님 |

**수정지시:** 없음(준수).

---

### 항목 5 — '← 이전' / '다시하기' 항상 노출

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | quiz.html:53-60 bottomnav 고정(이전+처음부터 다시), result.html:51-58 동일, quiz.js:123 첫질문서 이전 disabled(되돌릴 것 없음·정상), result.js:182-185 restart/back 바인딩 | 모든 진행 화면 하단 고정 노출 |

**수정지시:** 없음(준수).
참고(경미): 정적 콘텐츠 페이지(plants/*, guide, about 등)는 bottomnav 없이 헤더 내비+breadcrumb+푸터로 되돌아가기 제공 — 진단 흐름 화면이 아니므로 가이드 5번 위반 아님.

---

### 항목 6 — 가입·로그인·사진촬영 요구 없음

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | 전 파일에 form 로그인/회원가입 없음, `<input type=file>`/카메라/getUserMedia 없음. 퀴즈는 버튼 선택형(quiz.js:96), 답은 URL 쿼리로만 전달(quiz.js:179-186, 저장 없음) | 진입 장벽 0 |

**수정지시:** 없음(준수).

---

### 항목 7 — 자동재생·팝업·모달 안 모달 없음

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | autoplay/`<video>`/`<audio>`/`<dialog>`/`window.alert` 전무(전수 grep). 토스트는 인라인 `role=status aria-live=polite`, 화면 비차단(app.js:147-170). 광고는 콘텐츠 하단 .ad-slot 한정·placeholder면 미로드(app.js:175-203, 226) | 모달·진입팝업·자동재생 없음 |

**수정지시:** 없음(준수).

---

### 항목 8 — 색만으로 정보전달 금지(아이콘·텍스트 병기)

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | 선택표시: choice-card active 시 테두리 4px+배경+`✓` 아이콘 표시(styles.css:354-359, quiz.js:100/138) — 색+테두리+체크 3중 / 주의표시: badge--warn `🐾`+"반려동물 주의"(result.js:75), info-card--warn `⚠️`아이콘+`__warnlabel`텍스트(sansevieria.html:151-160), 진행바 현재=색+굵기+밑줄+sr-only | 색 단독 전달 없음 |

**수정지시:** 없음(준수).

---

### 항목 9 — 키보드 접근성(focus-visible, tabindex, skip-link) / aria·role·landmark

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | `:focus-visible` 전역+컴포넌트별 3px outline(styles.css:109,303,347,454,491,633,724) / skip-link 모든 페이지(index:67 등)+`.skip-link:focus{top}`(138) / 동작요소 전부 `<button>`/`<a>` 네이티브 / quiz.js:127 새 질문 heading `tabindex=-1` 포커스 이동 / landmark: header·main#main·nav(aria-label)·footer 일관 / aria-pressed(96), aria-live(quiz.html:45,47 result.html:46), role=group(93) | 키보드·스크린리더 접근성 양호 |

**수정지시:** 없음(준수).
참고(경미·권고): quiz.html:47 `#quiz-container aria-live="polite"` 와 quiz.html:45 `#quiz-hint aria-live` 가 동시에 갱신되면 낭독이 겹칠 수 있음. 질문 컨테이너는 포커스 이동(이미 구현, quiz.js:127)으로 안내되므로, `#quiz-container` 의 `aria-live` 는 제거해도 무방(중복 낭독 완화). 필수 아님.

---

### 항목 10 — 이미지 alt 한국어 / 자동재생 미디어 없음

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | 식물 사진 alt 한국어 서술형(sansevieria.html:127 "잎이 길쭉하게 곧게 자란 산세베리아 화분", 12종 동일 패턴 전수 확인), guide-figure alt 한국어(172 등) / 장식 이미지(로고·파비콘) `alt="" aria-hidden="true"`(index:72,85 등) / result.js:80 동적카드 `alt="<이름> 사진"` 한국어 / 폴백 alt "사진을 준비 중이에요"(app.js:57) / 자동재생 미디어 없음 | alt 규칙 정확히 준수 |

**수정지시:** 없음(준수).

---

### 항목 11 — prefers-reduced-motion 존중

| 결과 | 근거 | 비고 |
| --- | --- | --- |
| **통과** | styles.css:98-106 `@media(prefers-reduced-motion:reduce)` 에서 animation·transition·scroll-behavior 모두 차단(`!important`). 기본 전환도 200ms(styles.css:70)로 급격한 점프 없음 | 모션 최소화 존중 |

**수정지시:** 없음(준수).
참고(경미): quiz.js:143 `setTimeout(...,220)` 선택→다음 전환 지연은 CSS 모션이 아니라 reduced-motion 영향 밖. 220ms는 사용자 클릭 직후 시각 피드백용으로 짧아 문제 없음(자동 종료/타임아웃 아님).

---

## 2. 위반 분류 요약

| 심각도 | 건수 | 내용 |
| --- | --- | --- |
| **치명(Critical)** | **0** | 머지 불가 수준 위반 없음 |
| **중요(Major)** | **1** | 항목1: `--font-caption:16px` → 가이드 "16px 이하 금지" 위반. **18px로 상향 필요** |
| **경미(Minor)** | **4** | ① 항목2 초록 링크색 4.50:1 경계(권고 #256628) ② 항목9 quiz-container 중복 aria-live(권고) ③ site-nav gap 4px(터치영역은 패딩으로 확보, 표시상 권고) ④ caption 상향 시 360px 내비 줄바꿈 보호 필요 |

---

## 3. 통과율

- 점검 항목 **11개 중 10개 완전 통과**, 1개(항목1)는 토큰 1개의 caption 값만 부분 위반.
- **항목 기준 통과율: 10/11 = 90.9%**
- 위반은 전부 단일 CSS 토큰 1줄 수정으로 해소 가능(치명 0건).

---

## 4. 핵심 수정지시 (우선순위)

1. **[중요]** `styles.css:18` — `--font-caption: 16px;` → **`18px;`** (가이드 금지사항 "16px 이하" 위반 해소). 적용되는 곳: 헤더 내비·뱃지·진행바 라벨·breadcrumb·figcaption·난이도 표시·광고 고지·푸터 안내문.
2. **[중요·연계]** `styles.css:780 @media(max-width:360px)` 에 `.site-nav a { font-size: var(--font-base); padding: 0 6px; }` 추가 — caption 상향 후 360px 화면 내비 줄바꿈/가로스크롤 방지.
3. **[경미·권고]** `styles.css:94` — 본문 인라인 링크 `a { color: var(--color-primary); }` → `var(--color-primary-dark)` 로 변경, 크림 위 대비를 4.50:1 → 약 6:1로 여유 확보(헤더 로고 `.site-header__logo` 는 22px 굵게라 현행 유지 가능).
4. **[경미·권고]** `quiz.html:47` — `#quiz-container` 의 `aria-live="polite"` 제거(질문 포커스 이동으로 이미 안내되어 hint와 중복 낭독 방지).
5. **유지(변경 금지)** 진행바 다중표기, 이전/다시하기 고정, 색+아이콘+텍스트 병기, skip-link, reduced-motion, 가입·사진 없음 — 가이드를 모범적으로 충족하므로 그대로 유지.
