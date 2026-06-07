# v3 QA 검증 리포트 — 합격선 기준

> 검증자: qa-engineer · 일자: 2026-06-07
> 대상 소스: `scripts/quiz.js`, `quiz.html`, `scripts/match.js`, `scripts/result.js`, `plant.html`, `scripts/plant.js`
> 기준: `docs/prd/v3-requirements.md`, `docs/matching-v3.md`
> 데이터: `packages/plants/plants.json` (213종)
> 검증 도구: `tests/v3-sweep.js`(전수 2,592조합), `tests/v3-interest-detail.js`, `tests/v3-cases.js`(18케이스+정직성)
> 실행 환경: Node v24.15.0

---

## 0. 종합 요약

| 구분 | 결과 |
|---|---|
| **치명 결함 수** | **0건** |
| **독성 노출 건수(pet=yes)** | **0건** (전수 864조합) |
| **목적 일치율(air/deco/gift)** | **100.00%** (≥2종 100%, 전부 3종 일치) |
| **harvest 비-식용 노출** | **0건** |
| **3종 보장** | **100%** (2,592조합 전부 정확히 3종, 중복 0) |
| **결정론** | **100%** (동일 입력 10회 동일 출력) |
| **보는재미(interest) 유효 일치율** | **100%** (달성 가능 조합 2,160개 전부 ≥2종) |
| **출시 가능 여부** | **출시 가능 (GO)** — 비치명 권고 2건 동반 |

---

## 1. 7문항 전부 필수 흐름 (US-1)

소스: `scripts/quiz.js`, `quiz.html`. 정적 코드 검증 + e2e 스펙(`tests/e2e.spec.js`) 시나리오 대조.

| AC | 항목 | 판정 | 근거 |
|---|---|---|---|
| AC-1.1 | 7문항 순서·1화면 1질문 | 통과 | `QUESTIONS` 배열이 ①light ②water ③purpose ④place ⑤pet ⑥size ⑦interest 순. `renderQuestion()`이 한 번에 한 질문만 렌더. |
| AC-1.2 | 분기 제거 | 통과 | "이대로 추천받기/더 정확히" 코드·문자열 부재(grep 0건, 주석에 '제거' 명시만). `advance()`는 다음 인덱스로 직진. |
| AC-1.3 | 건너뛰기 제거 | 통과 | "건너뛰기/잘 모르겠/상관없" 보기 0건(grep), 모든 option `value` 비어있지 않음. |
| AC-1.4 | 미응답 시 다음 불가 | 통과 | 진행 트리거는 `onSelect`(보기 클릭)뿐. 답 없이 다음으로 가는 경로 없음. '다음' 버튼 자체가 없음. |
| AC-1.5 | 7개 모두 답해야 결과·URL 7파라미터 | 통과 | `finish()`가 7개 key를 모두 `encodeURIComponent`하여 `/result.html?light=…&interest=…`로 이동. 마지막(index 6) 답 후에만 `finish()` 도달. |
| AC-1.6 | ← 이전 복원·첫질문 비활성 | 통과 | `goBack()`→`render()`→`restoreSelection()`이 `aria-pressed="true"` 복원. `elBack.disabled = (index===0)`. e2e 시나리오4 일치. |
| AC-1.7 | 진행 "n / 7" + 7칸 막대 + 점7 | 통과 | `renderProgress()`가 `<b>n</b> / 7` 텍스트, `role="progressbar"`(valuemin1/valuemax7/valuenow n), 점 7개 고정 루프(`TOTAL`). 동적 확장 없음. |
| AC-1.8 | 처음부터 다시 | 통과 | `restart()`가 `{index:0, answers:{}}`로 초기화 후 `render()`. |
| AC-1.9 | 무상태 | 통과 | localStorage/쿠키/sessionStorage 사용 0건. 답은 `state.answers`(메모리) → URL 쿼리로만 전달. |

비기능(NFR-3): 한 화면 1질문·"n/7" 상시·← 이전·짧은 문구·포커스 이동(`heading.focus()`)·`aria-current`성격의 진행 표시·`prefers-reduced-motion`(자동진행 0ms) 처리 모두 코드상 확인. (Lighthouse/명암대비 등 런타임 NFR은 본 정적 검증 범위 밖 — 기존 KWCAG 감사 문서 참조 권장.)

**섹션 판정: 통과 (치명 0)**

---

## 2. 매칭 품질 — 전수 스윕 (US-2)

`tests/v3-sweep.js`로 7차원 **전 조합 2,592개**(3·3·4·4·2·3·3) 전수 실행.

### 2-1. 스윕 결과표

| AC | 검증 항목 | 합격선 | 측정값 | 판정 |
|---|---|---|---|---|
| AC-2.7 | 결과 정확히 3종 | 100% | 비-3종 **0건** / 중복 **0건** | 통과 |
| AC-2.1 | pet=yes 독성 노출 | 0건 | 독성 식물 **0건**, 영향 조합 **0개** (864 pet=yes 조합) | 통과 |
| AC-2.2 | harvest=먹는 식물만 | 0건 위반 | 비-harvest 노출 **0건** (648 harvest 조합) | 통과 |
| AC-2.3 | 목적(air/deco/gift) ≥2종 | 100% | 1,944조합 전부 ≥2종, **전부 3종 일치** (목적일치율 100.00%) | 통과 |
| AC-2.4 | 보는재미 ≥2종 | ≥95%(안전필터 예외 제외) | 명목 83.3% → **유효 100%** (아래 2-2) | 통과 |
| AC-2.6 | 완화 안내 일치 | 누락 0 | primary<3인데 relaxed 미발동 **0건** | 통과 |
| — | 결정론 | 100% | 10회 반복 불일치 **0건** | 통과 |

### 2-2. AC-2.4 보는재미 정밀 분석 (`tests/v3-interest-detail.js`)

명목상 interest <2종 = 432조합. **전수 분석 결과 432건 모두 데이터상 충족 불가(primary pool 자체가 <2)인 정당한 케이스이며, primary≥2인데 결과가 <2인 실제 버그는 0건.**

| 미충족 조합(원인) | 건수 | 비고 |
|---|---|---|
| air+flower (petSafe) | 108 | air 식물 중 꽃 종이 거의 없음(전체 2종, petSafe 0) — matching-v3 §1-3 문서화된 한계 |
| air+fruit | 108 | air+fruit = 0종(존재하지 않음) |
| air+fruit (petSafe) | 108 | 동일 |
| gift+fruit (petSafe) | 108 | gift+fruit petSafe 0종 |

- **달성 가능 조합(primary≥2) 2,160개 → ≥2종 충족 100.00%.** 안전필터 예외를 제외한 유효 일치율은 합격선(95%)을 상회.
- 위 432건 전부 `_match.relaxed`에 `"interest"`가 기록되어 result.js의 "딱 맞진 않지만" 안내가 정상 발동(AC-2.6 누락 0건과 정합).
- **interest 우선군 보장(v2 회귀 핵심):** primary≥3 조합 1,728개에서 "상위 3종 전부 interest 일치" 위반 **0건** → "꽃 원했는데 잎식물" 회귀 구조적 차단 확인.

### 2-3. 18 대표 케이스 (`tests/v3-cases.js`, matching-v3 §6)

T1~T18 전 케이스 불변식 **82개 단언 전부 통과(fail 0)**. 핵심:
- T1: 상위 3종 전부 flower+deco, 진단식물(adiantum·calathea) 미포함 — v2 회귀 차단 확인.
- T3/T4/T17: harvest 전부 먹는 식물(+T17 비독성).
- T5/T6/T8/T12/T16: pet=yes 전부 비독성.
- T7/T8/T9/T18: 완화 케이스 `_match.relaxed`에 `"interest"` 정상 표기, purpose는 미양보(전부 air/gift 유지).
- T14/T15: 결정론(2회/10회 호출 동일).

### 2-4. 함수 견고성

- 빈 plants 배열 → `[]` 반환(방어 정상).
- `answers=null` → 3종 정상 반환.
- `level` 파라미터 무시(7차원 답만 사용) 확인.
- **비파괴성:** 원본 `plants[0]` 불변, 원본에 `_match` 누출 0 — 얕은 복사본만 오염 없이 반환.

**섹션 판정: 통과 (치명 0)**

---

## 3. result.js 정직성 (AC-2.5 / AC-2.6)

소스: `scripts/result.js` `buildReason()` / `render()`.

| 항목 | 판정 | 근거 |
|---|---|---|
| 완화 시 상단 "딱 맞진 않지만" 안내 | 통과 | `render()`가 `picks.some(p=>p._match.relaxed.length>0)`이면 `<p class="notice">딱 맞진 않지만, 의도에 가장 가까운 식물로 골랐어요.</p>` 노출. |
| 비-꽃 식물을 꽃이라 거짓말 안 함 | 통과 | `buildReason`은 `m.interestMatch`가 true일 때만 "원하시던 꽃이…" 출력. `tests/v3-cases.js` 시뮬레이션에서 **interest 불일치 식물에 꽃/열매 주장 0건**. |
| 이유-매칭 차원 정합(AC-2.5) | 통과 | 이유는 `_match`의 실제 일치 플래그(interestMatch/purposeMatch/…) 기반으로만 생성. 양보된 차원은 "딱 ‘꽃’은 아니지만…" 정직 문구로 분기. |

검증 샘플(T7 air+flower 완화): spathiphyllum·bird_of_paradise(실제 flower)는 "원하시던 꽃이 피는 식물", ficus(foliage)는 거짓 없이 "공기를 맑게 해 주는 식물"로 출력 — 정직성 확인.

**섹션 판정: 통과 (치명 0)**

---

## 4. 회귀 — 흐름·링크 무결성

| 항목 | 판정 | 근거 |
|---|---|---|
| 시작→질문7→결과 흐름 | 통과 | index/about/식물상세 12종 `href="/quiz.html"` 정상. quiz `finish()`→`/result.html?…7파라미터`. result는 `App.loadPlants()`→`matchPlants`→카드 3종. |
| 결과 카드 "자세히 보기" → 동적 상세 | 통과 | result.js가 `/plant.html?id={id}`(전 213종). plant.js가 `id` 파싱→조회→미존재 시 `renderNotFound`. plant.html 존재 확인. |
| 정적 케어가이드 링크 깨짐 | 통과(0건) | plant.js의 정적상세 버튼은 `STATIC_CORE` 12-id 화이트리스트 게이트, guide.js도 `STATIC_GUIDE_IDS` 12종만 노출. 디스크상 `plants/*.html` 12개가 화이트리스트와 정확히 일치. 나머지 201종은 동적 `plant.html`로만 연결 → 깨진 링크 0. |

**섹션 판정: 통과 (치명 0)**

---

## 5. 비치명 발견(권고)

1. **[테스트 자산 노후 — 비제품]** `tests/e2e.spec.js` 시나리오 2·7이 결과 상세 링크를 `/plants/{id}.html`(정적 12종) 형식으로 단언하나, **현 v3 result.js는 `/plant.html?id=`(동적 213종)을 렌더**한다(브리프상 올바른 사양). 따라서 이 e2e는 현재 코드에 대해 **실패**한다. 제품 결함 아님 — e2e 스펙을 동적 라우트 기준으로 갱신 권장. (회귀 흐름 자체는 정상)
2. **[데이터 메모 — 영향 없음]** matching-v3 §8대로 `tier:core=27` vs 기획 12종 불일치. **매칭·링크 무결성에는 영향 없음**(plant.js는 tier가 아닌 명시 12-id 맵 사용). 콘텐츠팀 확인 권장.
3. **[UX 문구 검토 — 경미]** quiz.js purpose 보기 라벨이 값과 어긋난 인상: `deco`="꽃이 예쁜 식물", `gift`="작고 귀여운 식물". 값 매핑은 정확하나 라벨이 interest(꽃)와 겹쳐 보일 수 있음. 카피팀 확인 권고(기능 영향 없음).

---

## 6. 출시 가능 여부

**출시 가능 (GO).**

- 모든 강제 합격선(AC-2.1 독성0 · AC-2.2 harvest · AC-2.3 목적100% · AC-2.4 유효100% · AC-2.7 3종100% · 결정론100%)을 **전수 2,592조합**에서 충족.
- 7문항 필수 흐름(US-1 AC-1.1~1.9) 및 정직성(AC-2.5/2.6) 코드·시뮬레이션 검증 통과.
- 회귀 링크 무결성(깨진 링크 0).
- **치명 결함 0건.** 잔여 항목은 전부 비치명(테스트 스크립트 노후·데이터 메모·카피 검토)로 출시 차단 사유 아님. e2e 스펙 갱신은 출시 후 후속 처리 가능.
