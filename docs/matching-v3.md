# 매칭 알고리즘 v3 명세 — 의도 우선(intent-first)

> 작성: prompt-engineer 겸 plant-domain-expert · 대상 데이터: `packages/plants/plants.json` (213종)
> 구현 대상: `scripts/match.js` (`matchPlants(answers, plants)` 시그니처 유지)
> 소비처: `scripts/result.js` (각 결과의 점수·매칭근거로 "왜 맞는지" 정직히 출력)

---

## 0. 배경 — v2의 실제 문제(데이터로 확인)

v2 점수표는 **환경(빛3+물3+장소2+크기2=10)**가 **원하는 것(목적2+보는재미1=3)**를 압도한다.
그래서 "목적=꾸밈(deco)·보는재미=꽃(flower)"을 골라도, **flower 태그가 없는 잎식물**이 환경만 맞으면 상위에 온다.

실제 데이터 확인:

| 식물 | tags_purpose | tags_interest | 문제 |
|---|---|---|---|
| 아디안텀 (`adiantum`) | `["deco"]` | `["foliage"]` | flower 원했는데 환경 좋으면 상위 |
| 칼라데아 오비폴리아 (`calathea_orbifolia`) | `["air","deco"]` | `["foliage"]` | 동일 |
| 미니칼라데아 (`mini_calathea`) | `["deco"]` | `["foliage"]` | 동일 |

→ **사용자 의도가 결과에 약하게만 반영됨.** v3의 핵심은 **의도(purpose·interest)를 하드(또는 준-하드) 필터로 승격**하고, 환경은 그 안에서의 **순위 결정자**로 강등하는 것.

---

## 1. 데이터 분포(설계 근거 · 실측)

213종, 필드: `id, name, scientific_name, tags_light, tags_water, tags_purpose, tags_place, tags_interest, size, difficulty, water_cycle, light_desc, merit, caution, toxic_to_pets, common, tier, image, coupang_url`

```
tags_light    : low 15,  mid 129, high 136   (식물 1종이 복수 빛 허용)
tags_water    : low 63,  mid 138, high 24
tags_purpose  : air 45,  gift 42, deco 167,  harvest 36
tags_place    : living 97, desk 80, bathroom 24, window 175
tags_interest : foliage 171, flower 54, fruit 15
size          : small 130, medium 54, large 29
difficulty    : 매우쉬움 34, 쉬움 110, 보통 69
toxic_to_pets : true 93, false 120
common        : true 204, false 9
tier          : core 27, ext 186
```

### 1-1. purpose × interest 교차표 (의도 동시충족 가능량)

|          | flower | foliage | fruit |
|----------|-------:|--------:|------:|
| **air**  | 2      | 44      | 0     |
| **deco** | 51     | 133     | 8     |
| **gift** | 24     | 24      | 2     |
| **harvest** | 2   | 27      | 9     |

### 1-2. purpose × petSafe(비독성)

```
air     : 전체 45 / petSafe 17
deco    : 전체 167 / petSafe 97
gift    : 전체 42 / petSafe 22
harvest : 전체 36 / petSafe 24
```

### 1-3. **충족 불가능에 가까운 조합**(완화 로직이 반드시 처리해야 함)

```
air + flower   → 전체 2, petSafe 0     ← air 식물엔 꽃이 거의 없음
air + fruit    → 전체 0                 ← 존재하지 않음
gift + fruit   → 전체 2, petSafe 0
harvest + flower → 전체 2, petSafe 2
deco + fruit (petSafe) → 3              ← 아슬아슬
```

**결론:** "purpose ∩ interest"를 동시에 하드 필터로 걸면 일부 조합은 0~2종 → 최소 3종 보장 불가.
따라서 **purpose는 하드(거의 양보 안 함), interest는 준-하드(우선군 vs 후순위군 분리)** 로 설계한다.

---

## 2. 설계 원칙

1. **purpose(목적)는 1차 하드 필터.** 사용자가 air/deco/gift/harvest를 고른 이상, 그 태그를 가진 식물만 1차 후보가 된다. (단 후보 < 3이면 단계적 완화)
2. **interest(보는재미)는 후보 내부의 우선군 분리.** purpose 후보를 `interest 일치 우선군 → interest 불일치 후순위군` 두 층으로 나눈다. 우선군이 3종 이상이면 후순위군은 결과에 안 들어온다. → **"꽃 원했는데 잎식물"이 상위에 오지 않음**을 보장.
3. **pet=yes면 독성 식물(`toxic_to_pets===true`) 전면 제외.** 이건 안전 문제라 purpose보다도 강한 하드 필터.
4. **환경(빛·물·장소·크기)은 후보 정렬용 점수**일 뿐, 후보 자격을 만들지 않는다.
5. **최소 3종 보장.** 의도를 최대한 유지하며 단계적으로만 완화하고, 완화가 일어나면 결과에 정직히 표기(`relaxed` 플래그/사유).
6. **데이터 추측 금지.** 태그를 코드에서 임의 변경하지 않는다. (명백한 오류는 별도 표기 후 데이터에서 수정)

---

## 3. 가중치 재조정안 (환경 점수 — 후보 **내부** 정렬용)

후보 자격은 §2에서 이미 결정되므로, 아래 점수는 **순위(정렬)에만** 쓰인다.
의도가 후보 자격을 만들기 때문에 "환경이 의도를 누르는" 일은 구조적으로 불가능하다.

```
환경 적합 점수(envScore):
  빛 일치(tags_light ∋ light)      +3
  물 일치(tags_water ∋ water)      +3
  장소 일치(tags_place ∋ place)    +2
  크기 일치(size === size)         +2
  --------------------------------------
  최대 10점

보너스(동률 깨기 보조, 정렬 후순위 키로도 사용):
  common === true                  +0.5
  tier === "core"                  +0.5
  difficulty 매우 쉬움             +0.5
```

> `level`(초보) 질문은 v3에서 **제거**. `scoreOf`/`envScore`에서 관련 항을 삭제(무해 처리). `answers.level`이 들어와도 무시.

**의도 점수는 별도로 계산하되 정렬에는 직접 더하지 않는다**(자격으로 이미 반영됨). 다만 디버깅·근거 표기용으로 반환한다:

```
purposeMatch = tags_purpose ∋ purpose         (boolean)
interestMatch = tags_interest ∋ interest       (boolean)
```

---

## 4. 알고리즘 의사코드

```text
matchPlants(answers, plants):
  answers ← answers || {}
  if plants 비었거나 배열 아님: return []

  light, water, purpose, place, pet, size, interest ← answers의 각 필드
  petYes ← (pet === "yes")

  ───────────────────────────────────────────────
  STEP A. 안전 필터 (pet) — 가장 강한 하드 필터
  ───────────────────────────────────────────────
  base ← petYes ? plants.filter(p ⇒ p.toxic_to_pets !== true) : plants
  # 방어: 안전 식물이 3 미만이면(실데이터상 발생 안 함) 안전필터 해제하고 petFiltered=false
  if petYes and base.length < 3:
     base ← plants ; petApplied ← false
  else:
     petApplied ← petYes

  ───────────────────────────────────────────────
  STEP B. 의도 1차 필터 (purpose) — 하드, 단 부족 시 완화
  ───────────────────────────────────────────────
  relaxed ← []                      # 완화 사유 누적(결과에 정직히 표기)
  if purpose 존재:
     pPool ← base.filter(p ⇒ tags_purpose ∋ purpose)
  else:
     pPool ← base                   # 목적 미응답(방어). 전제상 거의 없음

  if pPool.length < 3:
     relaxed.push("purpose")        # 목적 일치가 3종 미만 → 완화 필요
     # purpose는 끝까지 양보하지 않되, 부족분은 STEP E에서 base로 보충
     # (pPool 자체는 그대로 두고, 우선 채운 뒤 모자라면 base에서 채움)

  ───────────────────────────────────────────────
  STEP C. 의도 2차 분리 (interest) — 준-하드(우선군 vs 후순위군)
  ───────────────────────────────────────────────
  if interest 존재:
     primary   ← pPool.filter(p ⇒ tags_interest ∋ interest)   # 의도 완전일치
     secondary ← pPool.filter(p ⇒ tags_interest ∌ interest)   # purpose는 맞으나 interest는 다름
  else:
     primary   ← pPool
     secondary ← []

  # 핵심 보장: primary가 3종 이상이면 secondary는 결과에 절대 안 들어옴
  #          → "꽃 원했는데 잎식물(secondary)" 상위 노출 차단

  ───────────────────────────────────────────────
  STEP D. 환경 점수로 각 군을 내부 정렬
  ───────────────────────────────────────────────
  sortByEnv(list) = list 정렬:
     1순위: envScore(p, answers) 내림차순
     2순위: tieBonus(p) 내림차순            # common/core/매우쉬움
     3순위: difficultyRank(p) 오름차순       # 매우쉬움<쉬움<보통
     4순위: id 사전순(결정론적 안정성)
  sort primary, secondary each by sortByEnv

  ───────────────────────────────────────────────
  STEP E. 결과 조립 — 최소 3종, 의도 최대 유지하며 단계적 완화
  ───────────────────────────────────────────────
  picks ← []
  take(list): for p in list: if picks<3 and p∉picks: picks.push(p)

  take(primary)                                  # ① 목적+보는재미 완전일치 (최우선)
  if picks.length < 3:
     if interest 존재: relaxed.push("interest")  # 보는재미는 못 맞췄음을 기록
     take(secondary)                             # ② 목적만 일치(보는재미 양보)

  if picks.length < 3:
     # ③ 목적도 부족 → base에서 환경/대중성 우수한 common으로 보충
     relaxed.push("purpose-fill")
     fillPool ← base.filter(p ⇒ p ∉ picks)
                     .filter(p ⇒ p.common === true)
     # harvest 특례: 먹는 식물을 원했으면 먹는 것 위주로 먼저
     if purpose === "harvest":
        take( fillPool.filter(p ⇒ tags_purpose ∋ "harvest") |> sortByEnv )
     take( fillPool |> sortByEnv )

  if picks.length < 3:                            # ④ 최후의 보충(common 아님 포함)
     take( base.filter(p ⇒ p ∉ picks) |> sortByEnv )

  if picks.length < 3 and petApplied:             # ⑤ 방어 최후: pet 필터까지 풀기
     relaxed.push("pet-relaxed")
     take( plants.filter(p ⇒ p ∉ picks) |> sortByEnv )

  ───────────────────────────────────────────────
  STEP F. 반환(점수·근거 동봉)
  ───────────────────────────────────────────────
  return picks.slice(0,3).map(p ⇒ buildResult(p, answers, relaxed))
```

### 4-1. `buildResult` — 반환 형태 (result.js가 정직한 근거를 쓰도록)

`matchPlants`는 **식물 객체 배열을 그대로 반환하되, 비파괴적으로 `_match` 메타를 덧붙인 얕은 복사본**을 반환한다. (원본 plants 오염 방지)

```js
{
  ...plant,                       // 기존 필드 전부(result.js 기존 렌더 그대로 동작)
  _match: {
    score: 8,                     // 환경 점수(0~10)
    purposeMatch: true,           // 목적 일치 여부
    interestMatch: true,          // 보는재미 일치 여부
    lightMatch: true,
    waterMatch: false,
    placeMatch: true,
    sizeMatch: true,
    petSafe: true,                // pet=yes일 때 안전한가 (pet 미응답이면 null)
    tier: "primary",              // "primary"(목적+보는재미) | "secondary"(목적만) | "fill"(완화보충)
    relaxed: ["interest"],        // 이 결과에 적용된 완화 사유들(없으면 [])
    reasons: ["air","place:living"] // 매칭 근거 키(선택: result.js가 카피 선택에 활용)
  }
}
```

> **하위호환:** `result.js`는 현재 `plant.tags_*`/`plant.name` 등만 읽으므로 스프레드 복사본으로 그대로 동작한다. `_match`는 추가 정보이며, `buildReason`을 `_match` 기반으로 더 정직하게 개선할 수 있다(§7).

---

## 5. 동점 처리 · 최소 3종 · 반려동물 필터 규칙

### 5-1. 동점 처리(정렬 tie-break, 위→아래 순서로 적용)
1. `envScore` 내림차순 (빛3+물3+장소2+크기2)
2. `tieBonus` 내림차순 (`common`+0.5, `tier==="core"`+0.5, `difficulty==="매우 쉬움"`+0.5)
3. `difficultyRank` 오름차순 (매우 쉬움 0 < 쉬움 1 < 보통 2 < 미상 99)
4. `id` 사전순 — **완전 결정론**(같은 입력 → 항상 같은 출력, QA 재현성 보장)

### 5-2. 최소 3종 보장(단계적 완화 — 의도 보존 우선순위)
```
① primary (purpose ∩ interest 완전일치)        ← 의도 100%
② secondary (purpose 일치, interest 불일치)    ← interest만 양보
③ purpose-fill (common 우수, harvest는 먹는것 우선) ← purpose도 양보(흔치 않음)
④ base 전체 보충                                ← 최후
⑤ pet 필터 해제                                 ← 데이터상 발생 안 함(방어)
```
각 단계 진입 시 `relaxed`에 사유 기록 → result.js가 "딱 맞진 않지만…" 정직 안내.

### 5-3. 반려동물 필터
- `pet==="yes"` → `toxic_to_pets===true` 식물 **전면 제외**(STEP A, 최상위 하드 필터).
- 안전 식물이 3종 미만일 때만(실데이터 120종 → 절대 발생 안 함) 방어적으로 필터 해제 + `relaxed:["pet-relaxed"]`.
- `pet==="no"` 또는 미응답 → 독성 필터 미적용(단, 독성 식물은 카드에서 `🐾 반려동물 주의` 배지 유지).

---

## 6. 테스트 케이스 (18개) — dev/QA 검증용

각 케이스: **입력 7답 → 기대 결과의 "성질"**(특정 식물 id 고정이 아니라 불변식으로 검증).
`has(p, field, val)` = `p[field].includes(val)`. 상위 3종 = `matchPlants(answers, plants)` 결과.

| # | light | water | purpose | place | pet | size | interest | 기대 성질(불변식) |
|---|---|---|---|---|---|---|---|---|
| T1 | high | mid | deco | living | no | medium | flower | **상위 3종 모두 `tags_interest∋flower`** 그리고 모두 `tags_purpose∋deco`. 아디안텀·칼라데아 등 잎식물(flower 없음) **미포함**. (v2 회귀 방지 핵심) |
| T2 | mid | low | air | living | no | large | foliage | 상위 3종 모두 `tags_purpose∋air`. air 후보가 충분하므로 모두 air. foliage 우대(대부분 foliage). |
| T3 | high | high | harvest | window | no | small | fruit | 상위 3종 모두 **먹는 식물**(`tags_purpose∋harvest`). `harvest+fruit`은 9종 있으므로 fruit 우선군이 상위. **꽃/관상 잎식물만인 비식용 식물 미포함**. |
| T4 | mid | mid | harvest | desk | no | small | foliage | 상위 3종 모두 `harvest`. 상추·바질·로즈마리 등 잎채소가 환경순으로. 모두 먹을 수 있음. |
| T5 | high | mid | deco | living | **yes** | medium | flower | 상위 3종 모두 `tags_interest∋flower` **AND** `toxic_to_pets!==true`. (deco+flower petSafe 27종 → 충분) **독성 식물 0개.** |
| T6 | low | low | air | living | **yes** | large | foliage | 상위 3종 모두 `air` AND 비독성. (air petSafe 17 → 충분) 독성 0. |
| T7 | mid | mid | **air** | window | no | medium | **flower** | **완화 케이스.** air+flower는 전체 2종뿐 → primary<3. 기대: 상위에 air 식물 우선, interest 양보됨. 결과 `_match.relaxed`에 `"interest"` 포함. 그래도 **3종 모두 `tags_purpose∋air`**(purpose는 안 양보). |
| T8 | high | high | **air** | window | **yes** | small | flower | 더 빡센 완화. air+flower+petSafe = 0. 기대: 3종 모두 `air` AND 비독성, interest 완화 표기. purpose·pet은 유지. |
| T9 | mid | low | gift | desk | no | small | fruit | gift+fruit 전체 2종 → 완화. 3종 모두 `gift`(purpose 유지), interest 완화. |
| T10 | high | mid | deco | living | no | large | foliage | 흔한 조합. 3종 모두 `deco`+`foliage`. 크기 large 우대로 large 식물이 상위 경향(envScore). |
| T11 | low | low | air | bathroom | no | small | foliage | 빛 약함+물 적음 환경. 3종 모두 `air`. 정렬상 `tags_light∋low` & `tags_water∋low` 식물이 상위(envScore 높음). 산세베리아류 상위 기대. |
| T12 | high | high | deco | window | **yes** | medium | flower | pet 안전 + 꽃. 3종 모두 flower & deco & 비독성. **스파티필름은 독성이면 제외**되는지 확인(데이터 따라). 독성 0 불변식. |
| T13 | mid | mid | deco | living | no | medium | **(없음/상관없음)** | interest 미응답. primary=pPool 전체. 3종 모두 `deco`. interest 불변식 없음. envScore 순. |
| T14 | (없음) | (없음) | deco | (없음) | no | (없음) | flower | 환경 전부 미응답(방어). envScore 전부 동일→tieBonus·difficulty·id로 결정. 그래도 3종 모두 `deco`+`flower`. **결정론**(2회 호출 동일 결과). |
| T15 | high | mid | deco | living | no | medium | flower | **결정론 검증.** 동일 입력 10회 호출 → 매번 동일한 id 3개·동일 순서. |
| T16 | high | mid | deco | living | **yes** | medium | foliage | deco+foliage 비독성 80종으로 충분. 결과는 **비독성 잎식물만**, `toxic_to_pets===true` 0개. (칼라데아류는 모두 비독성이라 포함 가능, 독성 잎식물만 제외) |
| T17 | mid | mid | harvest | window | **yes** | small | foliage | 먹는 식물 + 반려동물 안전. 3종 모두 harvest & 비독성. (민트·파슬리 등 독성 harvest는 제외, 상추·바질·로즈마리·루꼴라 등 비독성만) |
| T18 | low | mid | air | living | no | large | flower | air+flower 완화. 3종 모두 air. relaxed에 interest. **잎식물이 와도 OK(air라서)**, 단 flower만 고집해서 후보를 깨지 않음. |

### 6-1. 공통 불변식(모든 케이스 적용)
- `result.length === 3` (항상 정확히 3종)
- 중복 없음: `new Set(result.map(p=>p.id)).size === 3`
- `pet==="yes"`면 `result.every(p=>p.toxic_to_pets!==true)` (T5,T6,T8,T12,T16,T17)
- `purpose` 응답 시 가능하면 `result.every(p=>p.tags_purpose.includes(purpose))` — 완화(purpose-fill)된 경우에만 예외이며 그 땐 `_match.relaxed`에 `"purpose-fill"` 표기
- 각 결과에 `_match` 존재, `_match.score`는 0~10
- **interest 우선군 보장(핵심 회귀 테스트):** `primary.length >= 3`인 케이스(T1,T2,T3,T4,T5,T6,T10,T16,T17 등)는 `result.every(p=>p.tags_interest.includes(interest))`

### 6-2. v2 회귀 방지 핵심 단언(꼭 자동화)
```js
// "꽃 원했는데 잎식물" 재발 방지
const r = matchPlants({light:"high",water:"mid",purpose:"deco",place:"living",
                       pet:"no",size:"medium",interest:"flower"}, plants);
assert(r.length === 3);
assert(r.every(p => p.tags_interest.includes("flower")));   // 잎식물 차단
assert(r.every(p => p.tags_purpose.includes("deco")));
assert(!r.some(p => p.id === "adiantum" || /calathea/.test(p.id))); // 진단 식물 미포함
```

---

## 7. `scripts/match.js` 구현 가이드 (시그니처 유지)

- `matchPlants(answers, plants)` 시그니처 **그대로**. 반환은 **3종 배열**(기존과 동일 길이/형태) — 단 각 원소는 `{...plant, _match}` 얕은 복사본.
- `level` 관련 코드(`scoreOf`의 beginner 항) **삭제**. `answers.level` 들어와도 무시.
- 순수 함수 유지(DOM·fetch 의존 없음) → 기존 단위테스트 패턴(`module.exports`) 유지.
- 헬퍼: `envScore(p,a)`, `tieBonus(p)`, `diffRank(p)`, `inTags(tags,v)`, `buildResult(p,a,relaxed)`.

### 7-1. `result.js` 연계 개선(권장, 선택)
현재 `buildReason`은 환경을 목적보다 먼저 말해 "왜 추천됐는지"와 어긋날 수 있다. `_match`를 쓰면 정직해진다:
```js
function buildReason(plant, a){
  var m = plant._match || {};
  if (a.pet === "yes" && m.petSafe) return "반려동물에게 안전한 식물이에요.";
  // 의도 먼저: 사용자가 고른 목적·보는재미를 가장 앞에
  if (m.interestMatch && a.interest === "flower") return "원하시던 꽃이 피는 식물이에요.";
  if (m.purposeMatch  && a.purpose === "air")     return "공기를 맑게 해 주는 식물이에요.";
  // …(이하 환경 근거)
  // 완화된 경우 정직하게:
  if ((m.relaxed||[]).includes("interest"))
    return "딱 ‘" + interestLabel(a.interest) + "’은 아니지만, 원하신 용도에 가장 잘 맞아요.";
  …
}
```
- 결과 상단 안내(`notice`)도 `picks.some(p=>p._match.relaxed.length)` 이면 **"딱 맞는 건 적지만, 의도에 가장 가깝게 골랐어요."** 로 정직히 전환.
- v2의 `allZeroFallback` 재계산 로직은 `_match.relaxed`로 대체 가능(중복 점수계산 제거).

---

## 8. 데이터 메모(추측 변경 금지 · 관찰 사항만 기록)

코드에서 태그를 바꾸지 않는다. 다만 다음은 **검토 권장(데이터 담당이 판단)**, 본 v3 동작에는 영향 없음:

- `air + flower` 조합이 사실상 0(전체 2종, petSafe 0). air 식물 중 꽃 보는 재미를 가진 종이 거의 없는 건 도메인상 자연스러움(공기정화 대표종이 잎식물 위주). → 완화 로직으로 처리하므로 **데이터 수정 불필요**.
- `air + fruit` = 0, `gift + fruit` petSafe 0 — 동일하게 완화로 처리.
- `tier: core 27` vs 기획 의도(core 12종 상세페이지)와 수치 차이 있음 — 매칭과 무관하나 콘텐츠팀 확인 권장.

> 위 항목은 **명백한 오류가 아니므로 데이터 변경하지 않음.** 변경이 필요하면 별도 PR에서 근거와 함께.

---

## 9. 예상 개선 효과

- **의도 정합성:** purpose가 하드 필터가 되어, 목적 불일치 식물이 상위 3종에 **구조적으로 진입 불가**. interest는 우선군 분리로 "꽃 원했는데 잎식물" 회귀를 **차단**(primary≥3인 흔한 조합 전부 해결: deco/harvest/gift 등).
- **체감:** "공기정화/꽃/선물/수확"을 고른 의도가 **항상** 결과에 반영 → "이상함" 신고의 주원인 제거.
- **정직성:** 충족 불가 조합(air+flower 등)은 침묵하지 않고 `relaxed`로 "딱 맞진 않지만 의도에 가장 가깝게" 안내.
- **안전성:** pet=yes 독성 0 불변식 자동 테스트로 보장.
- **재현성:** id 기반 최종 tie-break로 완전 결정론 → QA·회귀 테스트 안정.
- **리스크:** 매우 빡센 조합에서 환경 적합도가 다소 희생될 수 있으나(의도 우선이므로 의도된 트레이드오프), 환경은 후보 내부 정렬로 여전히 최대한 반영.
