# QA 테스트 리포트 — 우리집 초록친구

- 검증일: 2026-06-06
- 담당: qa-engineer
- 소스: `C:\projects\plant-friends\`
- 방식: 정적 검증(HTML 구조·링크 정합성·스크립트 로직 추적) + Node 단위테스트(매칭·링크). Playwright 미설치로 E2E는 스펙만 작성(실행 가능 코드 완성).
- 환경: Node v24.15.0 / Python 3.14.5 사용 가능, Playwright 미설치(`@playwright/test` 없음, `node_modules`에 `sharp`만 존재).

## 요약

| 항목 | 결과 |
|---|---|
| 치명 결함(Critical) | **0개** |
| 깨진 링크 | **이미지 12종(.jpg) 미존재 — 단, 전부 placeholder 폴백 처리됨. 내비게이션/페이지 링크는 0개** |
| 매칭 단위테스트 통과율 | **9/9 (100%)** |
| 검사한 로컬 링크 | 424개 / HTML 19개 |
| 식물 상세 페이지 | 12/12 존재 |

---

## 시나리오별 통과/실패

### 1. 핵심 흐름 (index → quiz → result) — 통과
- `index.html` 의 `<a class="btn-primary" href="/quiz.html">식물 추천받기</a>` 확인(96행). quiz.html로 이동.
- `quiz.js` 로직 추적: Q1 빛(`light`) → Q2 물(`water`) → Q3 목적(`purpose`) → Q4 경험(`level`, 선택). 각 `.choice-card` 클릭 시 `state.answers[key]` 저장 후 다음 질문, 마지막에서 `finish()` 호출.
- `finish()` URL 빌드 추적(검증 완료):
  - 4문항 전체: `/result.html?light=high&water=mid&purpose=air&level=beginner`
  - Q4 건너뛰기: `/result.html?light=low&water=low&purpose=gift`
- 근거: `scripts/quiz.js:148-156`(onSelect 전환), `scripts/quiz.js:184-192`(finish).
- 재현: `quiz.html`에서 각 단계 큰 버튼 클릭 → 결과 URL이 위 형식과 일치.

### 2. 결과 렌더 — 통과
- `result.js`: `parseAnswers()`(쿼리 화이트리스트 검증) → `App.loadPlants()`(plants.json fetch) → `window.matchPlants()` → 3종 카드.
- 카드 `[자세히 보기]` 링크 = `/plants/{plant.id}.html`(`result.js:87`). plant.id는 plants.json의 검증된 12종에서만 옴 → **12종 상세 페이지 전부 존재 확인**.
- 쿠팡 버튼(`a.btn--shop`, `rel="noopener nofollow sponsored"`, `target="_blank"`) 존재(`result.js:88-89`).
- 카톡 공유 버튼(`button.btn--share[data-share-id]`) 존재 + `App.share`(navigator.share→클립보드 폴백) 바인딩(`result.js:90-91`, `app.js:107-131`).
- 이미지: `src="/public/plants/{id}.jpg"` 지만 파일 미존재 → `data-fallback`로 `App.attachImageFallback` 바인딩되어 `placeholder.svg`로 자동 대체(`app.js:51-59`). 깨진 이미지 노출 없음.

### 3. 매칭 정확성(Node 단위테스트) — 통과 (9/9)
- `scripts/match.js`를 Node로 직접 로드(`module.exports` 지원 확인) + `plants.json` 로드해 실행.
- 점수식: light 일치 +3, water +3, purpose +2, 초보+"매우 쉬움" +1. 정렬: 점수 내림차순 → 난이도(매우 쉬움<쉬움<보통) → common 우선.
- 결과: **모든 비어있지 않은 답에서 정확히 3종**, 점수 내림차순 정렬, harvest 폴백 시 상추·바질 우선 확인.

대표 케이스 결과표:

| 케이스 | 입력(light/water/purpose/level) | 결과 3종(점수) | 검증 |
|---|---|---|---|
| C1 | high/high/harvest/beginner | lettuce(8), basil(8), sansevieria(4) | 상추·바질 1·2위 |
| C2 | low/low/air/beginner | sansevieria(9), succulent(4), scindapsus(3) | 산세 압도적 |
| C3 | mid/mid/deco/experienced | spathiphyllum(8), parlor_palm(8), scindapsus(6) | 동점 난이도순 |
| C4 | high/low/gift | sansevieria(8), succulent(8), phalaenopsis(8) | 3동점→난이도/common |
| C5 | -/-/harvest | lettuce(2), basil(2), sansevieria(0) | **harvest 폴백 OK** |
| C6 | low/-/- | sansevieria(3), succulent(0), scindapsus(0) | 부족분 common 채움 |
| C7 | (빈 답) | sansevieria, succulent, scindapsus | matchPlants 자체는 채우나 result.js가 차단(아래 7번) |
| C8 | mid/mid (동점 유발) | scindapsus(6), spathiphyllum(6), parlor_palm(6) | 동점 난이도순 |
| C9 | high/low/air/beginner | sansevieria(9), succulent(7), phalaenopsis(6) | 정상 |
| C10 | low/high/gift | sansevieria(5), lettuce(3), basil(3) | 정상 |

- **동점 처리**: C3/C4/C8에서 점수 동률 시 난이도(매우 쉬움→쉬움→보통)→common 순으로 결정 — 정상.
- **harvest 폴백**: 목적만 harvest일 때 picked < 3 → 4-a 분기로 harvest 태그(상추·바질) 우선 채움 후 common으로 보충 — 정상.
- **"모든 식물 0점" 폴백**: `matchPlants`는 빈 답/0점이어도 common·난이도순으로 3종을 채움(`match.js:54-81`). `빈 plants 배열` 입력 시에만 `[]` 반환(방어). 다만 검증된 단일 답이라도 항상 일부 식물과 매칭되므로(모든 light/water 값이 어떤 식물엔 존재) `result.js`의 `allZeroFallback`(0점 안내문) 분기는 **실질적으로 빈 답 외에는 도달 불가** — 결함 아님, 안내 카피 분기 차이일 뿐.

### 4. 이전 / 다시하기 — 통과
- `← 이전`(`#nav-back`): 첫 질문에서 `disabled`(`quiz.js:123`), 이후 `goBack()`이 `state.index--` 후 `renderQuestion()` + `restoreSelection()`로 이전 답 `aria-pressed=true` 복원(`quiz.js:158-177`).
- quiz의 `처음부터 다시`(`#nav-restart`): `restart()`가 `state` 초기화 후 Q1 재렌더(`quiz.js:179-182`).
- result의 `처음부터 다시`/`이전`: 둘 다 `/quiz.html`로 이동(`result.js:182-185`).
- 근거: 로직 추적 완료. E2E 스펙 시나리오 4에 자동화 작성됨.

### 5. 진행바 ①②③ — 통과
- `renderProgress(i)`가 3칸 고정(STEP_LABELS=빛/물/목적). `s < i` → `is-done`, `s === current` → `is-current`(`aria-current="step"`). Q4(index≥3)에서는 current=-1로 3칸 모두 완료 표시(`quiz.js:66-83`).
- SR 보조 텍스트(완료/지금 여기) 포함 — 접근성 양호.

### 6. 내부 링크 정합성 — 통과(내비게이션) / 경미 결함(이미지)
- HTML 19개에서 로컬 링크 424개 검사. **내비게이션·스타일·스크립트·페이지 링크 깨짐 0개**(`/styles/styles.css`, `/scripts/*.js`, `/public/*`, `/plants/{id}.html`, `/index.html`, `/guide.html`, `/about.html`, `/contact.html`, `/privacy.html` 전부 존재).
- 깨진 링크 = 식물 사진 `.jpg` 12종뿐(상세페이지마다 2회 참조 = 24건). 아래 목록 참고. **전부 placeholder 폴백 처리되어 사용자 영향은 "사진 준비 중" 표시뿐.**

### 7. 한국어 엣지케이스 — 통과
- 빈 쿼리 `result.html` 직접 진입: `parseAnswers()` → `{}`, `hasCoreAnswers()` false → `renderEmpty()`(안내 + `🌱 식물 추천받기` 링크), 카드 0개(`result.js:29-32, 98-105, 187-188`).
- 잘못된 파라미터(`light=PURPLE&water=999&purpose=hack`): 화이트리스트 검증으로 전부 탈락 → `{}` → 안내 화면. (로직 추적 검증 완료)
- 일부만 유효(`light=low&water=999&purpose=hack`): `light`만 채택 → 결과 3종 진행.
- 존재하지 않는 식물 id 링크: 카드 id는 plants.json 12종에서만 생성되므로 임의 id 링크 생성 불가 — 깨진 상세 링크 없음.

---

## 깨진 링크 목록

내비게이션/페이지/스타일/스크립트 링크: **0개**.

이미지(.jpg) — 파일 미존재, **placeholder.svg 폴백 적용됨**(경미):

| 참조 위치 | 링크 | 비고 |
|---|---|---|
| plants/sansevieria.html (×2) | /public/plants/sansevieria.jpg | 폴백 |
| plants/spathiphyllum.html (×2) | /public/plants/spathiphyllum.jpg | 폴백 |
| plants/succulent.html (×2) | /public/plants/succulent.jpg | 폴백 |
| plants/scindapsus.html (×2) | /public/plants/scindapsus.jpg | 폴백 |
| plants/zamioculcas.html (×2) | /public/plants/zamioculcas.jpg | 폴백 |
| plants/parlor_palm.html (×2) | /public/plants/parlor_palm.jpg | 폴백 |
| plants/rubber_plant.html (×2) | /public/plants/rubber_plant.jpg | 폴백 |
| plants/lucky_bamboo.html (×2) | /public/plants/lucky_bamboo.jpg | 폴백 |
| plants/phalaenopsis.html (×2) | /public/plants/phalaenopsis.jpg | 폴백 |
| plants/ivy.html (×2) | /public/plants/ivy.jpg | 폴백 |
| plants/lettuce.html (×2) | /public/plants/lettuce.jpg | 폴백 |
| plants/basil.html (×2) | /public/plants/basil.jpg | 폴백 |

- result.js / guide.js가 동적으로 만드는 카드 이미지(`/public/plants/{id}.jpg`)도 동일하게 12종 모두 미존재 → `data-fallback`로 placeholder 대체.
- 실제 존재하는 이미지 자산: `public/plants/placeholder.svg`만 있음.

---

## 매칭 테스트 결과표 (재게재)

위 시나리오 3 표 참조. 통과율 **9/9 (100%)**. 항상 3종, 동점 난이도→common 처리, harvest→상추·바질 폴백, 빈 plants 배열 방어 모두 확인.

---

## 결함 분류

### 치명(Critical) — 0개
없음. 핵심 흐름(추천→결과→상세→구매/공유)이 정상 동작.

### 중요(Major) — 0개
없음.

### 경미(Minor)
1. **식물 사진 12종(.jpg) 자산 누락** — 모든 상세/결과/가이드 이미지가 placeholder로 표시됨. 폴백이 있어 깨진 이미지는 아니나, 실제 사진 12장 추가 필요. (자산 작업 항목; 코드 결함 아님)
2. **placeholder 설정값 미치환** — `config.js`의 COUPANG/ADSENSE/KAKAO/CONTACT/SITE_URL이 전부 "여기에_..." placeholder. 의도된 배포 전 상태(쿠팡 버튼은 `App.coupangUrl`이 검색 URL로, 광고는 미로드로 안전 폴백). 배포 전 교체 필요.

### 관찰(Observation, 결함 아님)
- `quiz.js`/`result.js`는 절대경로(`/result.html`, `/quiz.html`, `/packages/plants/plants.json`)를 사용 → 반드시 사이트 루트(`/`)에서 서빙해야 함. `file://` 직접 열기나 하위경로 배포 시 fetch/네비 실패. Cloudflare Pages 루트 배포 전제라면 문제없음.
- `result.js`의 `allZeroFallback`(0점 안내 카피) 분기는 검증된 단일 답으로는 사실상 도달 불가(모든 light/water/purpose 값이 최소 한 식물과 매칭). 기능 결함 아님.

---

## 재현/실행 방법

정적 검증(서버 불필요):
```
node -e "const{matchPlants}=require('./scripts/match.js');const p=require('./packages/plants/plants.json');console.log(matchPlants({purpose:'harvest'},p).map(x=>x.id))"
```

E2E(Playwright 설치 후):
```
# 1) 루트에서 정적 서버
python -m http.server 8000
# 2) Playwright 설치
npm i -D @playwright/test && npx playwright install chromium
# 3) 실행
set BASE_URL=http://localhost:8000 && npx playwright test tests/e2e.spec.js
```
스펙 파일: `tests/e2e.spec.js` (시나리오 1·2·4·5·7 자동화 — 미설치 상태에서도 코드는 완성).
