# 우리집 초록친구 — 정적 사이트 아키텍처

> 빌드툴·프레임워크·npm 의존이 **전혀 없는** 순수 HTML/CSS/Vanilla JS 정적 사이트.
> 데이터는 `plants.json` 단일 파일(fetch), 배포는 Cloudflare Pages(빌드 없음, output=루트).
> 이 문서 하나만 보고 `static-site-dev`가 구현할 수 있도록 구체적으로 기술한다.

---

## 1. 파일·폴더 구조

저장소 루트(`/`)가 그대로 배포 output 디렉터리다. 빌드 산출물이 없으므로 작성한 파일이 곧 배포 파일이다.

```
plant-friends/
├── index.html                  # 시작 화면(서비스 소개 + "시작하기" 버튼)
├── quiz.html                   # 질문 3개(+선택 Q4) 화면. 큰 카드 버튼으로 응답
├── result.html                 # 추천 결과(식물 3종 카드). 쿼리스트링 읽어 매칭 실행
├── guide.html                  # 케어가이드 허브(전체 식물 목록 → 각 가이드로 이동, SEO 진입)
├── about.html                  # 서비스 소개·운영 주체 안내
├── privacy.html                # 개인정보 처리방침(수집·저장 없음 명시)
├── contact.html                # 문의 안내(이메일 등)
├── 404.html                    # 없는 경로 진입 시 안내(Cloudflare Pages가 자동 사용)
│
├── plants/                     # 식물별 상세/케어가이드 정적 페이지(개별 URL = SEO 랜딩)
│   ├── sansevieria.html        #   plants/{id}.html — id는 plants.json의 id와 1:1
│   ├── spathiphyllum.html
│   ├── succulent.html
│   └── …                       #   plants.json의 모든 항목마다 1개씩
│
├── styles/
│   └── styles.css              # 전역 스타일. 디자인 토큰(CSS 변수), 큰 글씨/큰 버튼, 반응형
│
├── scripts/
│   ├── config.js               # window.CONFIG 주입(쿠팡/애드센스/GA ID placeholder). 최상단 로드
│   ├── match.js                # 매칭 알고리즘(순수 함수). plants 배열 + 답변 → 추천 3종
│   ├── app.js                  # 공통 로직: plants.json fetch, 헤더/푸터, 광고 고지, 유틸
│   ├── quiz.js                 # 질문 흐름(Q1→Q2→Q3[→Q4]) 상태·진행표시·이전버튼·쿼리 생성
│   ├── result.js               # 쿼리 파싱 → match.js 호출 → 카드 렌더 → 상세 링크
│   └── plant.js                # plants/{id}.html에서 해당 식물 데이터 바인딩·공유·구매버튼
│
├── public/                     # 정적 자산(CC0/자체 제작만)
│   ├── plants/                 #   식물 사진. plants.json image 경로의 실제 파일
│   │   ├── sansevieria.jpg
│   │   └── …
│   ├── illustrations/          #   단순 일러스트/배경(복잡 자체 일러스트 SVG 금지)
│   ├── favicon.ico             #   파비콘
│   └── og/                     #   OG(소셜 공유) 대표 이미지(기본 + 식물별)
│       ├── default.jpg
│       └── {id}.jpg
│
├── packages/
│   ├── plants/
│   │   ├── plants.json         # ★ 단일 데이터 소스. 모든 페이지가 fetch
│   │   └── care-guides/        #   식물별 상세 돌보기 본문(긴 글) — {id}.html 조각 또는 .md
│   │       └── {id}.html
│   └── affiliate/              # 제휴(쿠팡 파트너스) 링크/고지 문구 등 수익 관련 자료
│       └── coupang-links.json  #   id → 쿠팡 링크 매핑(또는 plants.json coupang_url 보강용)
│
├── sitemap.xml                 # 검색엔진용 사이트맵(루트/케어가이드/식물 전 페이지)
├── robots.txt                  # 크롤러 정책 + sitemap 위치 명시
└── CLAUDE.md                   # 프로젝트 규칙(읽기 전용 참조)
```

### 경로 규칙
- `plants.json`의 `image` 필드는 `public/plants/{id}.jpg`처럼 **루트 기준 상대경로**로 저장된다. 하위 폴더(`plants/{id}.html`)에서 fetch/참조할 때 경로가 어긋나지 않도록, 모든 자산은 **루트 기준 절대경로(`/public/...`, `/packages/plants/plants.json`)** 로 참조한다.
- 페이지 간 링크도 절대경로(`/quiz.html`, `/plants/{id}.html`)를 사용한다.

---

## 2. `plants.json` 스키마 정의

최상위는 식물 객체의 **배열**(`Array<Plant>`)이다. 각 객체 필드:

| 필드 | 타입 | 허용값 / 형식 | 설명 |
| --- | --- | --- | --- |
| `id` | `string` | 영소문자·언더스코어 슬러그(`sansevieria`, `parlor_palm`) | 고유 식별자. `plants/{id}.html`·이미지 파일명·OG와 1:1 매핑 |
| `name` | `string` | 한국어 식물 이름(`산세베리아`) | 화면 표시 이름 |
| `scientific_name` | `string` | 학명(`Sansevieria trifasciata`) | 상세/SEO 보조 정보 |
| `tags_light` | `string[]` | `"low"` \| `"mid"` \| `"high"` 의 부분집합 | 견딜 수 있는 빛 조건들. **이 식물이 적응 가능한 빛**(여러 개 가능) |
| `tags_water` | `string[]` | `"low"` \| `"mid"` \| `"high"` 의 부분집합 | 적정 물 주기 구간. **사용자 답이 이 안에 포함되면 일치** |
| `tags_purpose` | `string[]` | `"air"`(공기정화) \| `"deco"`(장식·꽃) \| `"gift"`(선물) \| `"harvest"`(수확·먹기) | 목적 태그 |
| `difficulty` | `string` | `"매우 쉬움"` \| `"쉬움"` \| `"보통"` | 난이도(정렬·초보 가점에 사용). 정렬 우선순위: 매우 쉬움 < 쉬움 < 보통 |
| `water_cycle` | `string` | 자유 텍스트(`"2~3주에 한 번"`) | 사람이 읽는 물 주기 안내 |
| `light_desc` | `string` | 자유 텍스트(`"어두운 곳도 잘 견뎌요"`) | 사람이 읽는 빛 안내 |
| `merit` | `string` | 한 줄 설명(쉬운 한국어) | 카드/상세 장점 문구 |
| `caution` | `string` | 한 줄 설명(쉬운 한국어) | 주의할 점 |
| `toxic_to_pets` | `boolean` | `true` \| `false` | 반려동물 독성 여부. 상세에 경고 표시(추천 자체는 막지 않음) |
| `common` | `boolean` | `true` \| `false` | 흔히 키우는 입문 식물 여부. **동점 정렬·최소 3종 채움**에 사용 |
| `image` | `string` | 루트 기준 경로(`public/plants/{id}.jpg`) | 대표 사진 경로 |
| `coupang_url` | `string` | URL(쿠팡 파트너스 링크 또는 placeholder) | 구매 버튼 링크 |

### 값 도메인 상수(스크립트에서 공유)
```js
const LIGHT  = ["low", "mid", "high"];               // 빛: 어두움 / 보통 / 밝음
const WATER  = ["low", "mid", "high"];               // 물: 가끔 / 보통 / 자주
const PURPOSE = ["air", "deco", "gift", "harvest"];  // 목적
const DIFFICULTY_ORDER = { "매우 쉬움": 0, "쉬움": 1, "보통": 2 }; // 작을수록 쉬움
```

> **Hard Rule**: 독성 식물 추천 금지 항목은 "추천 목록에서 제외"가 아니라 상세에서 **명확한 경고 표시**로 충족한다. 반려동물 여부를 묻지 않으므로 매칭에서 `toxic_to_pets`로 거르지 않는다. (정책 변경 시 `docs/decisions.md`에 기록)

---

## 3. 점수 매칭 알고리즘 명세 (PRD 5-2)

### 3.1 입력
- `plants`: `plants.json` 전체 배열
- `answers`: 사용자 응답 객체
  ```js
  { light: "mid", water: "low", purpose: "air", level: "beginner" }
  // light  : "low" | "mid" | "high"  (Q1, 필수)
  // water  : "low" | "mid" | "high"  (Q2, 필수)
  // purpose: "air" | "deco" | "gift" | "harvest"  (Q3, 필수)
  // level  : "beginner" | "experienced" | undefined  (Q4, 선택)
  ```

### 3.2 점수 공식
```
score = (light 일치     ? 3 : 0)   // answers.light ∈ plant.tags_light
      + (water 허용범위  ? 3 : 0)   // answers.water ∈ plant.tags_water
      + (purpose 포함    ? 2 : 0)   // answers.purpose ∈ plant.tags_purpose
      + (초보 && 난이도 '매우 쉬움' ? 1 : 0)  // level==="beginner" && difficulty==="매우 쉬움"
```
- 최대 9점(3+3+2+1).
- `level`이 미선택(`undefined`)이면 마지막 +1 가점은 항상 0(beginner가 아니므로). 즉 Q4는 가점이지 필수 아님.

### 3.3 정렬·선택 규칙
1. `score` **내림차순**.
2. 동점 시 **난이도 쉬운 순**: `DIFFICULTY_ORDER` 오름차순(매우 쉬움 0 < 쉬움 1 < 보통 2).
3. 그래도 동점이면 **`common: true` 우선**(흔한 입문 식물 먼저).
4. 상위 **3종** 반환.

### 3.4 최소 3종 보장
- 위 정렬 결과 후보가 3개 미만이거나(데이터 자체가 적을 때), 모든 후보가 0점이라 신뢰도가 낮을 때 → `common: true`인 입문 식물로 **부족분을 채운다**. 채울 때도 난이도 쉬운 순으로 정렬해 추가하며 이미 포함된 id는 중복 추가하지 않는다.

### 3.5 엣지케이스
- **모든 식물 0점**(어떤 조건도 안 맞음): 빈 화면 대신 `common: true` 입문 식물(산세베리아·다육식물·스킨답서스 등)을 난이도 쉬운 순 상위 3종으로 채워 반환. 결과 화면 상단에 "환경에 딱 맞는 식물은 적지만, 누구나 키우기 쉬운 식물을 추천해요" 안내.
- **purpose가 `harvest`**(수확): 해당 목적 태그를 가진 식물(상추·바질)이 자연히 +2를 받아 상위로 올라온다. 다만 상추·바질은 `tags_light=["mid","high"]/["high"]`, `tags_water=["high"]`라 빛·물이 안 맞으면 점수가 낮아질 수 있다. harvest 선택 시에는 **purpose 일치 식물을 우선 노출**하도록, 동점·부족 채움 단계에서 harvest 태그 식물을 입문 채움보다 먼저 고려한다(아래 의사코드 `purposeFill`).
- **level 미선택**: `answers.level`이 `undefined` → +1 가점만 빠지고 나머지는 정상 동작. 결과 품질 저하 없음.
- **purpose 무응답**(이론상 발생 안 함, 방어): purpose 미정이면 +2를 모두에게 미부여하고 빛·물 위주로 매칭.

### 3.6 의사코드 (pseudocode)

```js
// match.js — 순수 함수, DOM/fetch 의존 없음(테스트 용이)
function recommend(plants, answers) {
  const { light, water, purpose, level } = answers;
  const isBeginner = level === "beginner";

  // 1) 점수 계산
  const scored = plants.map(p => {
    let score = 0;
    if (light   && p.tags_light.includes(light))     score += 3;
    if (water   && p.tags_water.includes(water))     score += 3;
    if (purpose && p.tags_purpose.includes(purpose)) score += 2;
    if (isBeginner && p.difficulty === "매우 쉬움")   score += 1;
    return { plant: p, score };
  });

  // 2) 정렬: score↓ → 난이도 쉬운 순↑ → common 우선
  const byRank = (a, b) =>
       b.score - a.score
    || DIFFICULTY_ORDER[a.plant.difficulty] - DIFFICULTY_ORDER[b.plant.difficulty]
    || (b.plant.common === true) - (a.plant.common === true); // true=1 우선

  scored.sort(byRank);

  // 3) 유효 후보(점수 > 0)만 우선 선택
  let picked = scored.filter(s => s.score > 0).map(s => s.plant);

  // 4) 최소 3종 보장(부족분 채우기)
  if (picked.length < 3) {
    const have = new Set(picked.map(p => p.id));

    // 4-a) harvest 목적이면 harvest 태그 식물 먼저 채움(상추·바질 우선)
    if (purpose === "harvest") {
      const purposeFill = plants
        .filter(p => p.tags_purpose.includes("harvest") && !have.has(p.id))
        .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
      for (const p of purposeFill) { if (picked.length >= 3) break; picked.push(p); have.add(p.id); }
    }

    // 4-b) common 입문 식물로 나머지 채움(난이도 쉬운 순)
    const commonFill = plants
      .filter(p => p.common === true && !have.has(p.id))
      .sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
    for (const p of commonFill) { if (picked.length >= 3) break; picked.push(p); have.add(p.id); }

    // 4-c) 그래도 부족하면 전체에서 채움(방어)
    for (const p of plants) { if (picked.length >= 3) break; if (!have.has(p.id)) { picked.push(p); have.add(p.id); } }
  }

  // 5) 정확히 3종 반환
  return picked.slice(0, 3);
}
```

> `(b.plant.common === true) - (a.plant.common === true)`는 `true→1, false→0`으로 변환되어 common이 true인 쪽을 앞으로 보낸다.

---

## 4. 상태 전달 방식

### 4.1 quiz → result: URL 쿼리스트링
- 질문 응답은 **URL 쿼리스트링**으로만 전달한다.
  ```
  /result.html?light=mid&water=low&purpose=air&level=beginner
  ```
- 장점: 결과 URL이 **공유·북마크·새로고침에 안전**하고, 서버·저장소가 필요 없다.
- `quiz.js`가 마지막 질문 응답 후 위 URL을 만들어 `location.assign(...)`로 이동.
- `result.js`는 `new URLSearchParams(location.search)`로 파싱하여 `answers` 객체 구성. `level`은 없을 수 있음(선택).
- 파라미터 검증: 허용값(섹션 2의 상수)에 없는 값이 오면 무시하거나 안전 기본값 처리 후 결과 렌더(깨진 화면 방지).

### 4.2 저장 금지
- **localStorage·sessionStorage·쿠키에 개인정보·응답을 저장하지 않는다.** (PRD: 가입·개인정보 저장 없음 / Privacy 페이지 명시)
- 분석 이벤트(GA 등)는 익명 집계만. 개인 식별 정보 전송 금지.

### 4.3 데이터 로드: fetch
- 모든 페이지는 `plants.json`을 `fetch('/packages/plants/plants.json')`로 비동기 로드.
  ```js
  async function loadPlants() {
    const res = await fetch('/packages/plants/plants.json', { cache: 'force-cache' });
    if (!res.ok) throw new Error('plants load failed');
    return res.json();
  }
  ```
- 로드 실패 시 사용자에게 "잠시 후 다시 시도해 주세요" 안내 + 재시도 버튼(빈 화면 금지).
- `plants/{id}.html`은 정적 SEO 콘텐츠(title·meta·대표 이미지·본문)를 HTML에 **직접 작성**하고, 부가 데이터(쿠팡 링크 등)만 fetch로 보강한다. → JS 비활성 환경에서도 핵심 콘텐츠가 보임.

---

## 5. 페이지 흐름도

```
                         ┌──────────────┐
   직접진입(SEO) ──────▶ │  index.html  │  시작 화면
                         └──────┬───────┘
                                │ "시작하기"
                                ▼
                         ┌──────────────┐
                         │  quiz.html   │  Q1 빛 → Q2 물 → Q3 목적 [→ Q4 숙련도(선택)]
                         │  진행표시 1/3 │  "이전" 버튼으로 되돌아가기
                         └──────┬───────┘
                                │ 마지막 응답 → 쿼리스트링 생성
                                ▼
                         ┌──────────────┐
            "다시 고르기" │ result.html  │  match.js로 식물 3종 카드 렌더
            ◀────────────│  ?light=&… │
                         └──────┬───────┘
                                │ 카드 클릭
                                ▼
        직접진입(SEO/공유) ──▶ ┌──────────────────┐
                              │ plants/{id}.html │  상세·케어가이드
                              │  돌보기·쿠팡구매  │  "추천으로 돌아가기"→result
                              │  카톡공유        │
                              └──────────────────┘

  SEO·정보 페이지(헤더/푸터 링크로 직접 진입):
    guide.html(케어가이드 허브) ─▶ plants/{id}.html
    about.html · privacy.html · contact.html
```

흐름 요약:
- **메인 흐름**: `index → quiz(Q1→Q2→Q3[→Q4]) → result → plants/{id}`.
- **SEO 진입**: 검색·공유로 `plants/{id}.html`, `guide.html`에 **직접 진입** 가능(앞 단계 없이도 완결). 이 페이지들은 구매 버튼·공유 버튼을 자체 보유.
- **되돌아가기**: quiz 내 "이전", result의 "다시 고르기"(→ quiz 처음), 상세의 "추천으로 돌아가기"(→ result, `document.referrer` 또는 직접 진입 시 `index`로 폴백).

---

## 6. Cloudflare Pages 배포 전략

| 설정 | 값 |
| --- | --- |
| **빌드 명령(Build command)** | (비움) — 빌드 없음 |
| **출력 디렉터리(Build output directory)** | `/` (저장소 루트) |
| **프레임워크 프리셋** | None |
| **Node 버전 / 의존성 설치** | 없음 (npm·package.json 미사용) |
| **연결** | GitHub 저장소 → main 브랜치 push 시 자동 배포 |

### 6.1 설정 주입(`scripts/config.js`)
- 빌드 환경변수(`NEXT_PUBLIC_*` 등) **절대 금지**. 모든 ID는 `config.js`의 `window.CONFIG`로 주입.
  ```js
  // scripts/config.js — 모든 페이지에서 <head>에 가장 먼저 로드
  window.CONFIG = {
    COUPANG_PARTNER_ID: "PLACEHOLDER_COUPANG",   // 쿠팡 파트너스 ID
    ADSENSE_CLIENT_ID:  "ca-pub-PLACEHOLDER",    // 애드센스
    GA_MEASUREMENT_ID:  "G-PLACEHOLDER",         // GA4
    SITE_ORIGIN:        "https://초록친구도메인"   // 절대 URL 생성용(OG/canonical/sitemap)
  };
  ```
- 실제 운영 값은 배포 전 `config.js`만 교체(또는 Cloudflare Pages의 정적 파일로 관리). 키는 모두 공개 가능한 클라이언트 ID여야 한다(비밀키 금지).

### 6.2 커스텀 도메인
- Cloudflare Pages → Custom domains에 도메인 연결, Cloudflare DNS로 자동 SSL(HTTPS) 적용.
- `config.js`의 `SITE_ORIGIN`, `sitemap.xml`, OG `og:url`, `<link rel="canonical">`을 동일 도메인으로 일치시킨다.

### 6.3 캐시
- 정적 자산(이미지·CSS·JS)은 파일명 또는 쿼리 버전(`styles.css?v=2`)으로 캐시 무효화.
- `plants.json`은 업데이트 빈도가 낮으므로 `cache: 'force-cache'`. 데이터 갱신 시 쿼리 버전(`plants.json?v=날짜`) 또는 커밋으로 무효화.
- 필요 시 `_headers` 파일(루트)로 캐시 정책 지정:
  ```
  /public/*
    Cache-Control: public, max-age=31536000, immutable
  /styles/*
    Cache-Control: public, max-age=86400
  ```
- 리다이렉트가 필요하면 루트 `_redirects` 파일 사용(서버 로직 없이 정적 규칙만).

### 6.4 SEO 파일
- `robots.txt`: 크롤 허용 + `Sitemap: https://도메인/sitemap.xml` 명시.
- `sitemap.xml`: 루트 페이지 + `guide.html` + 모든 `plants/{id}.html` URL 포함. 식물 추가 시 함께 갱신(데이터가 적어 수기 관리 가능, 추후 단순 스크립트로 생성 고려하되 빌드툴 도입은 금지).

---

## 7. 성능 원칙 (Lighthouse 90+)

1. **외부 라이브러리 무의존**: 웹폰트(Pretendard, Noto Sans KR 폴백)를 **유일한** 외부 의존으로 허용. 그 외 JS 프레임워크·jQuery·UI 라이브러리·아이콘 폰트 도입 금지(필요 아이콘은 단순 인라인 SVG).
   - 웹폰트도 `font-display: swap`, 서브셋(한글 핵심 글리프) 우선, `preconnect`로 지연 최소화.
2. **이미지 lazy loading**: 식물 사진 `<img loading="lazy" decoding="async" width height>`로 CLS 방지. 첫 화면 above-the-fold 이미지만 `loading="eager"`(또는 `fetchpriority="high"`).
   - 이미지 용량 축소(WebP 권장, `.jpg` 폴백), 카드/썸네일은 적정 해상도로 리사이즈. CC0/자체 제작만 사용.
3. **CSS/JS 인라인 최소화**: 스타일은 `styles/styles.css` 한 파일로 분리·캐시. critical 인라인은 최소(폰트 깜빡임 방지 수준)만. JS는 `scripts/*.js`로 분리하고 `<script defer>`로 로드(렌더 차단 방지). `config.js`만 동기 선로드.
4. **요청 수 최소화**: 데이터는 `plants.json` 단일 fetch, 스크립트는 페이지별 필요한 것만 로드(`quiz.html`은 quiz.js, `result.html`은 result.js). 공통은 `app.js`.
5. **접근성·SEO 기본 충족(Lighthouse 가중)**: 본문 18px+/버튼 48px+/대비 4.5:1+(CLAUDE.md 토큰), 모든 `<img>` alt, 페이지별 `title`·`meta description`·`og:*`·`canonical`, 의미론적 HTML(`<main>`, `<button>`, `<nav>`).
6. **광고는 콘텐츠 하단만**: 애드센스는 도구(quiz)·결과(result) 위 배치 금지, 콘텐츠 페이지 하단만. 광고 스크립트는 지연 로드해 LCP/TBT 영향 최소화.

---

## 부록 A — 스크립트 의존 관계

```
config.js  (window.CONFIG)           ← 모든 페이지 <head> 최선두
   ▲
app.js     (loadPlants, 공통 UI, 고지문, 유틸)
   ▲                         ▲                    ▲
quiz.js                  result.js ── match.js   plant.js
(quiz.html)              (result.html, 순수함수)  (plants/{id}.html)
```
- `match.js`는 DOM·fetch 의존이 없는 **순수 함수**라 단독 테스트 가능(브라우저 콘솔 또는 간단한 HTML 테스트 러너).
- 데이터 계약은 섹션 2 스키마. 필드 추가 시 본 문서와 `plants.json`을 함께 갱신하고 `docs/decisions.md`에 기록.
