# 우리집 초록친구 — 컴포넌트 스펙 (static-site-dev용)

> 본 문서는 정적사이트 컴포넌트 7종의 **구현 명세**입니다.
> 모든 수치는 `senior-ux-guide.md`(KWCAG 2.2·시니어 수치)와 `brand.md`(컬러·폰트)에서 확정된 값을 그대로 따릅니다.
> static-site-dev는 이 문서의 HTML/CSS를 **그대로 복사해 구현**할 수 있습니다. 토큰은 하드코딩하지 말고 `:root` 변수를 참조하세요.

---

## 0. 공통 전제 (모든 컴포넌트 적용)

### 0.1 디자인 토큰 (`:root`)

브랜드·가이드 확정값을 토큰으로 고정합니다. 모든 컴포넌트는 이 토큰만 참조합니다.

```css
:root {
  /* 폰트 */
  --font-sans: "Pretendard", "Pretendard Variable",
    "Noto Sans KR", -apple-system, BlinkMacSystemFont,
    "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;

  /* 글자 크기 (본문 18px 미만 금지) */
  --font-base: 18px;     /* 본문 최소 */
  --font-caption: 16px;  /* 보조 텍스트 최소, 그 이하 금지 */
  --font-h3: 22px;       /* 소제목 */
  --font-h2: 26px;       /* 부제목 */
  --font-h1: 30px;       /* 대제목 */
  --line-height: 1.7;

  /* 색 (brand.md 확정값, 모두 4.5:1 이상 검증 조합) */
  --color-text: #1B1B1B;        /* 본문 잉크 (크림 위 15.8:1) */
  --color-bg: #F5F0E1;          /* 크림 배경 */
  --color-surface: #FFFFFF;     /* 카드 흰 배경 (잉크 18.9:1) */
  --color-primary: #2E7D32;     /* 초록 (흰 글자 5.1:1) */
  --color-on-primary: #FFFFFF;
  --color-secondary: #5D4037;   /* 브라운 (흰 글자 8.9:1) */
  --color-on-secondary: #FFFFFF;
  --color-soft: #A5D6A7;        /* 연초록: 배경/장식 전용, 위에는 잉크만 */
  --color-warning-text: #B3261E;/* 경고 텍스트 (아이콘·문구 병기 필수) */
  --color-border: #5D4037;      /* 카드/선택 테두리 */
  --color-disabled-bg: #D7D2C4; /* 비활성 배경 */
  --color-disabled-text: #5A564B;/* 비활성 텍스트 (대비 3:1+ 확보) */

  /* 터치 타깃 */
  --tap-min: 48px;        /* 버튼 최소 높이·너비 */
  --tap-primary: 56px;    /* 핵심 행동 버튼 */
  --tap-card: 96px;       /* 선택 카드 최소 높이 */
  --gap-min: 12px;        /* 버튼 간 최소 간격 */

  /* 간격·모서리 */
  --space-1: 12px;
  --space-2: 16px;
  --space-3: 24px;
  --radius: 12px;
  --focus-width: 3px;

  /* 레이아웃 */
  --content-max: 480px;
  --base-width: 360px;
  --bottomnav-h: 72px;    /* 하단 고정 네비 높이 */
}
```

### 0.2 모든 컴포넌트가 지키는 공통 규칙

- **본문 18px 이상**, 버튼 라벨 18px 이상, 터치 타깃 48×48px 이상, 버튼 간 간격 12px 이상.
- **대비 4.5:1 이상**(큰 글자 3:1). 연초록 `#A5D6A7` 위에는 잉크 텍스트만.
- **색만으로 정보 전달 금지** → 텍스트 + 아이콘 병기.
- **호버 의존 금지** → `:hover`로만 보이는 인터랙션 없음. `:hover`와 `:focus-visible`를 항상 함께 처리.
- **자동재생·팝업·모달 안 모달 금지.**
- 버튼은 반드시 `<button type="button">` 또는 `<a>`, 의미 전달은 `aria-*`로.
- **모션 최소화**: 전역에 아래 미디어쿼리 적용.

```css
/* 전역: 화면 전환 200~300ms, 급격한 점프 금지 */
* { transition-duration: 200ms; }

/* 사용자가 모션 최소화를 켜면 모든 애니메이션·전환 제거 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}

/* 공통 포커스 링: 키보드 접근성 (Tab 이동 시 또렷하게) */
:focus-visible {
  outline: var(--focus-width) solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 1. 큰 시작 버튼 `.btn-primary`

시작 화면의 단일 핵심 행동 버튼. 한 화면 1과업 원칙에 따라 화면당 1개만.

### HTML

```html
<button class="btn-primary" type="button">
  <img src="/img/leaf.svg" alt="" aria-hidden="true" class="btn-primary__icon" />
  <span class="btn-primary__label">내게 맞는 식물 찾기</span>
</button>
```

- 라벨은 명확한 한글 동사형("내게 맞는 식물 찾기", "시작하기"). 영문 CTA 금지.
- 아이콘은 장식이므로 `alt=""` + `aria-hidden="true"` (라벨이 의미 전달).

### CSS

```css
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  min-height: var(--tap-primary);   /* 56px (48px 이상) */
  padding: 0 var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-h2);        /* 26px, 굵게 */
  font-weight: 700;
  color: var(--color-on-primary);   /* 흰색 */
  background: var(--color-primary);  /* 초록, 흰 글자 대비 5.1:1 */
  border: 0;
  border-radius: var(--radius);
  cursor: pointer;
}
.btn-primary__icon { width: 28px; height: 28px; }

/* 상태: hover와 focus를 함께 (호버 의존 금지) */
.btn-primary:hover,
.btn-primary:focus-visible {
  background: #256628;             /* 초록 어둡게, 대비 유지 */
  outline: var(--focus-width) solid var(--color-secondary);
  outline-offset: 2px;
}
.btn-primary:active { background: #1E551F; transform: translateY(1px); }
.btn-primary:disabled {
  background: var(--color-disabled-bg);
  color: var(--color-disabled-text);  /* 대비 3:1+ */
  cursor: not-allowed;
}
```

### 수치·접근성

- 높이 **56px**(48px 이상), 너비 100%, 라벨 26px/700.
- 대비: 초록 `#2E7D32` + 흰색 = **5.1:1** (본문·큰글자 통과).
- 키보드: `<button>` 기본 `Tab` 포커스, `Enter`/`Space` 실행.
- 모션: `transform`은 reduced-motion에서 전환 제거됨.

---

## 2. 선택 카드 버튼 `.choice-card`

질문 화면의 보기. 그림 + 큰 글씨 병기. 선택 시 테두리+체크로 명확히 표시(색만으로 X).

### HTML

```html
<div class="choice-group" role="group" aria-label="키우실 곳을 골라 주세요">
  <button class="choice-card" type="button" aria-pressed="false">
    <span class="choice-card__emoji" aria-hidden="true">🪟</span>
    <span class="choice-card__label">햇빛 잘 드는 창가</span>
    <span class="choice-card__check" aria-hidden="true">✓</span>
  </button>
  <button class="choice-card" type="button" aria-pressed="true">
    <span class="choice-card__emoji" aria-hidden="true">💡</span>
    <span class="choice-card__label">햇빛이 적은 방 안</span>
    <span class="choice-card__check" aria-hidden="true">✓</span>
  </button>
</div>
```

- 선택 상태는 **`aria-pressed`**로 보조기기에 전달(색 의존 X).
- 이모지/아이콘은 `aria-hidden`, 라벨 텍스트가 의미 담당.
- 체크 표시는 선택 시에만 보이게(아래 CSS).

### CSS

```css
.choice-group { display: flex; flex-direction: column; gap: var(--gap-min); }

.choice-card {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--tap-card);      /* 96px 이상 */
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-h3);        /* 22px 큰 글씨 */
  font-weight: 600;
  text-align: left;
  color: var(--color-text);
  background: var(--color-surface);
  border: 2px solid var(--color-border);  /* 평상시에도 또렷한 테두리 */
  border-radius: var(--radius);
  cursor: pointer;
}
.choice-card__emoji { font-size: 40px; line-height: 1; flex: 0 0 auto; }
.choice-card__label { flex: 1 1 auto; }
.choice-card__check {
  flex: 0 0 auto;
  font-size: 28px; font-weight: 700;
  color: var(--color-primary);
  visibility: hidden;               /* 미선택 시 숨김 */
}

/* 상태: hover와 focus 함께 */
.choice-card:hover,
.choice-card:focus-visible {
  outline: var(--focus-width) solid var(--color-primary);
  outline-offset: 2px;
}
.choice-card:active { transform: translateY(1px); }

/* 선택됨: 테두리 굵게 + 배경 연초록 + 체크 노출 (3중 표시, 색만 X) */
.choice-card[aria-pressed="true"] {
  border-width: 4px;
  border-color: var(--color-primary);
  background: var(--color-soft);    /* 연초록 위 잉크 글자 11.3:1 */
}
.choice-card[aria-pressed="true"] .choice-card__check { visibility: visible; }

.choice-card:disabled {
  background: var(--color-disabled-bg);
  color: var(--color-disabled-text);
  border-color: var(--color-disabled-text);
  cursor: not-allowed;
}
```

### 수치·접근성

- 높이 **96px 이상**, 라벨 22px/600, 이모지 40px, 카드 간격 12px.
- 선택 표시 **3중**: 테두리 4px + 연초록 배경 + 체크 ✓ (색만으로 구분 X).
- 대비: 흰 배경 잉크 18.9:1 / 선택 시 연초록 위 잉크 11.3:1.
- 키보드: `Tab` 이동, `Enter`/`Space` 토글. JS로 `aria-pressed` 갱신.

---

## 3. 진행바 `.progress`

①②③ 형태로 "지금 어디인지" 항상 표시. 현재 단계는 텍스트+색 병기로 강조.

### HTML

```html
<nav class="progress" aria-label="진행 단계">
  <ol class="progress__list">
    <li class="progress__step is-done">
      <span class="progress__num" aria-hidden="true">①</span>
      <span class="progress__text">식물 고르기</span>
      <span class="sr-only">(완료)</span>
    </li>
    <li class="progress__step is-current" aria-current="step">
      <span class="progress__num" aria-hidden="true">②</span>
      <span class="progress__text">상태 확인</span>
      <span class="sr-only">(지금 여기)</span>
    </li>
    <li class="progress__step">
      <span class="progress__num" aria-hidden="true">③</span>
      <span class="progress__text">돌보는 법</span>
    </li>
  </ol>
</nav>
```

- 현재 단계는 **`aria-current="step"`** + 화면낭독용 "(지금 여기)" 텍스트.
- 숫자 ①②③ + 라벨 텍스트 항상 노출(색만 X).

### CSS

```css
.progress__list {
  display: flex;
  justify-content: space-between;
  gap: var(--space-1);
  list-style: none; margin: 0; padding: var(--space-2) 0;
}
.progress__step {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  flex: 1 1 0;
  font-size: var(--font-caption);   /* 16px 이상 */
  color: var(--color-text);
  text-align: center;
}
.progress__num { font-size: var(--font-h2); font-weight: 700; line-height: 1; }

/* 완료 단계 */
.progress__step.is-done .progress__num { color: var(--color-secondary); }

/* 현재 단계 강조: 색 + 굵기 + 숫자 (텍스트 병기) */
.progress__step.is-current {
  font-weight: 700;
  color: var(--color-primary);
}
.progress__step.is-current .progress__num {
  color: var(--color-primary);
}
.progress__step.is-current .progress__text {
  text-decoration: underline;       /* 색 외 추가 단서 */
  text-underline-offset: 4px;
}

/* 화면낭독 전용 텍스트 */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

### 수치·접근성

- 라벨 16px 이상, 숫자 26px/700. 현재 단계 = 초록색 + 굵게 + 밑줄(색 단독 X).
- 대비: 크림 위 초록 4.6:1 / 크림 위 브라운 8.0:1.
- 접근성: `<nav aria-label>` + `<ol>` 순서 + `aria-current="step"`.

---

## 4. 식물 카드 `.plant-card`

결과/추천용. 사진 + 큰 이름 + "왜 맞는지" 한 줄 + 버튼 3개. lazy 이미지 + onerror 폴백.

### HTML

```html
<article class="plant-card">
  <img class="plant-card__photo"
       src="/img/plants/sansevieria.webp"
       alt="산세베리아 화분 사진"
       loading="lazy" decoding="async" width="480" height="320"
       onerror="this.onerror=null; this.src='/img/plants/_fallback.svg'; this.alt='사진을 준비 중이에요';" />
  <div class="plant-card__body">
    <h3 class="plant-card__name">산세베리아</h3>
    <p class="plant-card__why">햇빛 적은 방에서도 잘 자라요.</p>
    <div class="plant-card__actions">
      <a class="btn btn--detail" href="/plant/sansevieria.html">
        자세히 보기
      </a>
      <a class="btn btn--shop" href="https://coupang.example/..."
         target="_blank" rel="noopener nofollow sponsored">
        쿠팡에서 보기 <span aria-hidden="true">🛒</span>
      </a>
      <button class="btn btn--share" type="button" data-share="sansevieria">
        카톡 공유 <span aria-hidden="true">💬</span>
      </button>
    </div>
  </div>
</article>
```

- 사진 `loading="lazy"` + `width/height`로 레이아웃 이동 방지. `onerror` 폴백 이미지·alt 교체.
- 버튼 3개는 세로 1열, 간격 12px. 쿠팡 링크는 `rel="nofollow sponsored"`.
- 이모지는 `aria-hidden`, 라벨 텍스트가 목적 전달("쿠팡에서 보기", "카톡 공유").

### CSS

```css
.plant-card {
  background: var(--color-surface);
  border: 1px solid var(--color-soft);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: var(--space-3);
}
.plant-card__photo {
  display: block; width: 100%; height: auto;
  aspect-ratio: 3 / 2; object-fit: cover;
  background: var(--color-soft);    /* 로딩 중 빈자리 표시 */
}
.plant-card__body { padding: var(--space-3); }
.plant-card__name {
  font-size: var(--font-h2);        /* 26px 큰 글씨 */
  font-weight: 700; margin: 0 0 var(--space-1);
}
.plant-card__why {
  font-size: var(--font-base);      /* 18px */
  margin: 0 0 var(--space-3);
}

/* 버튼 3개: 세로 1열, 간격 12px */
.plant-card__actions { display: flex; flex-direction: column; gap: var(--gap-min); }

.btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: var(--tap-min);       /* 48px 이상 */
  padding: 0 var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-base); font-weight: 600;
  border-radius: var(--radius);
  text-decoration: none; cursor: pointer; border: 2px solid transparent;
}
.btn--detail { background: var(--color-primary); color: var(--color-on-primary); }
.btn--shop   { background: var(--color-secondary); color: var(--color-on-secondary); }
.btn--share  { background: var(--color-surface); color: var(--color-secondary);
               border-color: var(--color-secondary); }

.btn:hover, .btn:focus-visible {
  outline: var(--focus-width) solid var(--color-primary);
  outline-offset: 2px;
}
.btn:active { transform: translateY(1px); }
.btn:disabled {
  background: var(--color-disabled-bg); color: var(--color-disabled-text);
  border-color: transparent; cursor: not-allowed;
}
```

### 수치·접근성

- 이름 26px/700, 설명 18px, 버튼 3개 각 48px 이상 + 간격 12px.
- 대비: 자세히 보기(초록 5.1:1), 쿠팡(브라운 8.9:1), 카톡(흰 위 브라운 글자 8.0:1).
- 이미지: lazy + `width/height` + `onerror` 폴백 + 의미 있는 `alt`.
- 키보드: 링크·버튼 모두 `Tab`/`Enter` 동작. 새 탭 링크는 `rel="noopener"`.

---

## 5. 네비게이션 버튼 (하단 고정)

'← 이전' / '다시하기(처음부터)'. 모든 화면 하단에 항상 고정 노출.

### HTML

```html
<nav class="bottomnav" aria-label="화면 이동">
  <button class="bottomnav__btn bottomnav__btn--back" type="button">
    <span aria-hidden="true">←</span> 이전
  </button>
  <button class="bottomnav__btn bottomnav__btn--restart" type="button">
    <span aria-hidden="true">↻</span> 다시하기
  </button>
</nav>
```

- 같은 기능은 모든 화면 동일 위치·동일 라벨(가이드: 도움 일관 배치).
- "다시하기"는 처음부터 시작. 사용자 동작 없이 자동 이동 금지.

### CSS

```css
.bottomnav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
  display: flex; gap: var(--gap-min);
  width: 100%; max-width: var(--content-max);
  margin: 0 auto; padding: var(--space-1) var(--space-2);
  min-height: var(--bottomnav-h);
  background: var(--color-bg);
  border-top: 2px solid var(--color-soft);
  /* iOS 홈바 여백 */
  padding-bottom: calc(var(--space-1) + env(safe-area-inset-bottom));
}
.bottomnav__btn {
  flex: 1 1 0;
  min-height: var(--tap-min);       /* 48px 이상 */
  font-family: var(--font-sans);
  font-size: var(--font-base); font-weight: 600;
  border-radius: var(--radius); cursor: pointer;
}
.bottomnav__btn--back {
  background: var(--color-surface); color: var(--color-secondary);
  border: 2px solid var(--color-secondary);   /* 보조 동작 */
}
.bottomnav__btn--restart {
  background: var(--color-secondary); color: var(--color-on-secondary); border: 0;
}
.bottomnav__btn:hover, .bottomnav__btn:focus-visible {
  outline: var(--focus-width) solid var(--color-primary);
  outline-offset: 2px;
}
.bottomnav__btn:active { transform: translateY(1px); }
.bottomnav__btn:disabled {
  background: var(--color-disabled-bg); color: var(--color-disabled-text);
  border-color: transparent; cursor: not-allowed;
}

/* 고정 네비가 본문을 가리지 않도록 본문 하단 여백 확보 (포커스 가림 방지) */
body { padding-bottom: calc(var(--bottomnav-h) + var(--space-3)); }
```

### 수치·접근성

- 두 버튼 각 48px 이상, 간격 12px, 컨테이너 높이 72px.
- 항상 하단 고정 노출 + 본문 `padding-bottom`으로 콘텐츠 가림 방지.
- 첫 화면에서는 `← 이전`을 `disabled` 처리(되돌릴 곳 없음).
- 키보드: `Tab`/`Enter`. 새 화면 진입 시 포커스가 네비에 가려지지 않게 스크롤 여백 확보.

---

## 6. 상세 페이지 정보 블록

물주기·햇빛·난이도·공기정화·주의점을 큰 글씨 카드로. 1열 나열.

### HTML

```html
<section class="info-grid" aria-label="이 식물 돌보기 정보">
  <div class="info-card">
    <span class="info-card__icon" aria-hidden="true">💧</span>
    <h3 class="info-card__title">물 주기</h3>
    <p class="info-card__value">흙이 마르면 한 컵 정도만 주세요.</p>
  </div>
  <div class="info-card">
    <span class="info-card__icon" aria-hidden="true">☀️</span>
    <h3 class="info-card__title">햇빛</h3>
    <p class="info-card__value">햇빛이 적은 방에서도 잘 자라요.</p>
  </div>
  <div class="info-card">
    <span class="info-card__icon" aria-hidden="true">🌱</span>
    <h3 class="info-card__title">난이도</h3>
    <p class="info-card__value">아주 쉬워요. 처음에도 괜찮아요.</p>
  </div>
  <div class="info-card">
    <span class="info-card__icon" aria-hidden="true">🍃</span>
    <h3 class="info-card__title">공기 정화</h3>
    <p class="info-card__value">밤에도 공기를 맑게 해줘요.</p>
  </div>
  <!-- 주의점: 색만이 아니라 아이콘 + "주의" 텍스트 병기 -->
  <div class="info-card info-card--warn">
    <span class="info-card__icon" aria-hidden="true">⚠️</span>
    <h3 class="info-card__title">주의할 점</h3>
    <p class="info-card__value">
      <strong class="info-card__warnlabel">주의</strong>
      반려동물이 잎을 먹지 않게 해주세요.
    </p>
  </div>
</section>
```

- 각 카드 = 아이콘 + 제목 + 쉬운 설명문(존댓말, 15자 내외).
- 주의점은 색만으로 구분하지 않고 ⚠️ 아이콘 + "주의" 텍스트 병기.

### CSS

```css
.info-grid { display: flex; flex-direction: column; gap: var(--space-2); }
.info-card {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-areas: "icon title" "icon value";
  column-gap: var(--space-2); row-gap: 4px;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-soft);
  border-radius: var(--radius);
}
.info-card__icon  { grid-area: icon; font-size: 36px; line-height: 1; }
.info-card__title { grid-area: title; margin: 0;
                    font-size: var(--font-h3); font-weight: 700; }
.info-card__value { grid-area: value; margin: 0;
                    font-size: var(--font-base); }   /* 18px */

/* 주의 카드: 왼쪽 굵은 띠 + 경고색 라벨 (색 단독 X) */
.info-card--warn { border-left: 6px solid var(--color-warning-text); }
.info-card__warnlabel {
  display: inline-block; margin-right: 6px;
  color: var(--color-warning-text); font-weight: 700;
}
```

### 수치·접근성

- 제목 22px/700, 본문 18px, 아이콘 36px, 카드 간격 16px.
- 대비: 흰 카드 위 잉크 18.9:1 / 경고 텍스트 `#B3261E`(아이콘·"주의" 병기).
- 주의 강조 = 왼쪽 띠 + "주의" 텍스트 + 아이콘(색 단독 금지).
- 접근성: 각 항목 `<h3>` 제목 + 설명. `<section aria-label>`로 묶음.

---

## 7. 광고 슬롯 `.ad-slot`

**콘텐츠 페이지 하단에만** 배치. 결과·도구(진단 결과·핵심 버튼) 위·사이 배치 절대 금지.

> 가이드 금지사항: **광고를 결과·도구 위 배치 금지**(오터치·혼란 유발).
> `.ad-slot`은 페이지 **맨 아래**, 하단 네비 위쪽에만 둡니다. 결과 카드·진행바·CTA 버튼보다 항상 아래여야 합니다.

### HTML

```html
<!-- 반드시 본문 콘텐츠가 모두 끝난 뒤, 페이지 최하단에만 삽입 -->
<aside class="ad-slot" aria-label="광고">
  <p class="ad-slot__tag">광고</p>
  <!-- 광고 스크립트/이미지. 자동재생·팝업·확장 금지. -->
  <div class="ad-slot__body"><!-- ad unit --></div>
</aside>
```

- **`aria-label="광고"`** + 시각적 "광고" 라벨로 콘텐츠와 명확히 구분.
- 자동재생·팝업·모달·화면 덮기 금지. 고정(fixed) 금지 — 일반 흐름 최하단.

### CSS

```css
.ad-slot {
  margin: var(--space-3) 0 0;       /* 위 콘텐츠와 충분히 떨어뜨림 */
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px dashed var(--color-secondary);  /* 콘텐츠와 구분 */
  border-radius: var(--radius);
  text-align: center;
}
.ad-slot__tag {
  margin: 0 0 var(--space-1);
  font-size: var(--font-caption);   /* 16px */
  font-weight: 700; color: var(--color-secondary);
}
.ad-slot__body { min-height: 100px; }
```

### 배치 규칙 (static-site-dev 필독)

- 결과 페이지: `진행바 → 결과 안내 → 식물 카드들 → (필요시 도구) → .ad-slot → 하단 네비` 순서. 광고는 **항상 마지막 콘텐츠 뒤**.
- 진단 결과·핵심 버튼 **위/사이 삽입 금지.** 도구 화면 위 삽입 금지.
- 진입 광고 모달·전면 광고 금지. 인라인 1개만.
- 접근성: `aside` + `aria-label="광고"`, "광고" 텍스트 라벨 노출.

---

## 부록 — 컴포넌트 7종 핵심 수치 요약

| # | 컴포넌트 | 핵심 크기 | 대비 | 상태 표시 핵심 |
|---|---|---|---|---|
| 1 | `.btn-primary` 큰 시작 버튼 | 높이 **56px**, 라벨 26px/700, 너비 100% | 초록+흰 **5.1:1** | hover=focus 동일 처리, active 눌림, disabled 회색 3:1+ |
| 2 | `.choice-card` 선택 카드 | 높이 **96px+**, 라벨 22px, 이모지 40px, 간격 12px | 흰 18.9:1 / 선택 연초록 11.3:1 | 선택 시 **테두리4px+연초록배경+체크✓** 3중(색 단독 X), `aria-pressed` |
| 3 | `.progress` 진행바 | 숫자 26px/700, 라벨 16px+ | 크림+초록 4.6:1 | 현재=색+굵게+밑줄+`aria-current`, ①②③ 텍스트 병기 |
| 4 | `.plant-card` 식물 카드 | 이름 26px/700, 설명 18px, 버튼 3×48px+ 간격12px | 초록5.1 / 브라운8.9 / 8.0:1 | lazy+`onerror` 폴백, 버튼 hover=focus, 이모지 aria-hidden |
| 5 | 하단 네비 버튼 | 각 48px+, 간격 12px, 바 높이 72px | 브라운+흰 8.9:1 | 하단 fixed 상시, 첫 화면 이전=disabled, 본문 하단여백 |
| 6 | 상세 정보 블록 | 제목 22px/700, 본문 18px, 아이콘 36px, 간격 16px | 흰 18.9:1 / 경고 B3261E | 주의=왼쪽 띠+"주의"텍스트+⚠️(색 단독 X) |
| 7 | `.ad-slot` 광고 슬롯 | 라벨 16px, 점선 테두리 구분 | 브라운 8.0:1 | **페이지 최하단 전용**, 결과·도구 위 금지, 팝업/자동재생 금지 |

**전 컴포넌트 공통**: 본문 18px+ · 버튼 48px+ · 간격 12px+ · 대비 4.5:1+ · 호버 의존 금지(`:hover`=`:focus-visible`) · `prefers-reduced-motion` 전환 제거 · 키보드 `Tab`/`Enter`/`Space` 전부 동작.
