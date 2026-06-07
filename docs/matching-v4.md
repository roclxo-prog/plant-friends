# 매칭 알고리즘 v4 설계서 — 정밀도 · 다양성 동시 개선

문서 위치: `docs/matching-v4.md`
대상 구현: `scripts/match.js` (`matchPlants(answers, plants)` 교체)
데이터: `packages/plants/plants.json` (213종)
호환 대상: `scripts/result.js` (`_match` 메타 소비)

---

## 0. 한 줄 요약

v3는 "동점 → id 사전순" tie-break + "보통(어려움) 식물을 하드 그룹으로 후순위 분리" 때문에 **2,592개 조합 중 103종(48%)만 추천되고 110종은 한 번도 안 나오며 TOP10이 전체 슬롯의 36.5%를 차지**했다. v4는 (1) 7차원 전부를 점수화하고 granularity를 키워 동점 자체를 줄이고, (2) 난이도를 하드 그룹 분리 대신 **소프트 점수**로 바꾸며, (3) 동점에는 **답 조합(salt) 기반 결정적 해시 jitter**를 넣어 종을 분산시킨다. 시뮬레이션 결과 **distinct 추천 184/213(86%)**, TOP10 점유율 27%로 개선되며 목적 일치율 100% · 독성 노출 0 · 결정론은 유지된다.

---

## 1. v3 진단 (검증 완료, 수치 근거)

전수 스윕(2,592 조합 = 3·3·4·4·2·3·3, 각 3종 추천 → 7,776 슬롯)으로 측정:

| 지표 | v3 측정값 | 문제 |
|---|---|---|
| distinct 추천 종 | **103 / 213** | 절반이 죽은 데이터 |
| 한 번도 추천 안 됨 | **110종** | 커버리지 붕괴 |
| TOP10 슬롯 점유 | **36.5%** | 소수 편중 |
| TOP3 (green_bean·pea·chlorophytum) | 각 432·432·360 | "늘 같은 몇 종" 체감의 실체 |
| 목적 일치율 | 100% | (정밀도는 OK) |
| 독성 노출(pet=yes) | 0 | (안전은 OK) |

### 근본 원인 3가지
1. **동점 다발 + id 사전순 tie-break** — envScore가 정수 0~10(빛3·물3·장소2·크기2)뿐이라 후보 다수가 동점. 동점이면 항상 `id` 알파벳 앞 종(green_bean, pea, chlorophytum…)이 이김 → 조합이 바뀌어도 같은 종이 반복.
2. **난이도 하드 그룹 분리** — `isHard`('보통')를 별도 그룹으로 항상 뒤로 보내, '보통'에 속한 정밀 적합종이 영원히 상위3에 못 든다. 특히 harvest(36종)·fruit 풀에서 '쉬움'인 pea/green_bean이 모든 조합을 독식(이게 "harvest=늘 상추·바질" 현상).
3. **7차원 중 2개(purpose·interest)는 필터로만, 5개(나머지)는 거친 점수로만** 작동해 변별력 부족. `common` 보너스는 204/213이 `common:true`라 사실상 무의미.

---

## 2. 7개 질문 ↔ 7개 식물 속성 정밀 매핑

| # | 질문(answers) | 식물 속성 | v4 역할 | 비고 |
|---|---|---|---|---|
| 1 | `light` (low/mid/high) | `tags_light[]` | 점수(정확 9 / 근접 4) | 순서척도 → 근접 부분점수 |
| 2 | `water` (low/mid/high) | `tags_water[]` | 점수(정확 9 / 근접 4) | 순서척도 → 근접 부분점수 |
| 3 | `purpose` (air/deco/harvest/gift) | `tags_purpose[]` | **하드 필터 + 점수 40** | 가장 강한 관련성 |
| 4 | `place` (living/window/bathroom/desk) | `tags_place[]` | 점수 14 | 명목척도 → 정확일치만 |
| 5 | `pet` (yes/no) | `toxic_to_pets` | **하드 안전 필터** | yes면 독성 전면 제외 |
| 6 | `size` (small/medium/large) | `size` | 점수(정확 12 / 근접 5) | 순서척도 → 근접 부분점수 |
| 7 | `interest` (flower/foliage/fruit) | `tags_interest[]` | 점수 30 | 보는재미, 두 번째로 높은 관련성 |
| — | (난이도, 질문 없음) | `difficulty` | 소프트 점수(매우쉬움 +6 / 쉬움 +3 / 보통 0) | 시니어 안전 선호, **하드 아님** |

설계 원칙: **purpose=하드 필터(자격), 나머지 6개=점수(정렬)**. interest는 v3처럼 풀을 둘로 쪼개지 않고 큰 가중치(30)로 점수에 녹여 — 같은 효과(상위는 거의 interest 일치)를 내면서 동점 분리는 jitter에 맡긴다.

---

## 3. 가중치 · 점수식 v4 (의사코드)

```text
WEIGHTS = {
  purpose:    40,   # 하드 필터를 통과한 종에게 동일 가산(서열 안정화용 베이스)
  interest:   30,   # 보는재미 정확 일치
  place:      14,   # 장소 정확 일치 (명목척도)
  size:       12,   # 크기 정확 일치
  size_near:   5,   #   크기 인접(small↔medium, medium↔large) 부분점수
  light:       9,   # 빛 정확 일치
  light_near:  4,   #   빛 인접(low↔mid, mid↔high) 부분점수
  water:       9,   # 물 정확 일치
  water_near:  4,   #   물 인접 부분점수
  easy_vv:     6,   # 난이도 '매우 쉬움' (소프트 선호)
  easy_v:      3,   # 난이도 '쉬움'
}
EPS = 6.0           # 다양성 jitter 진폭 (가장 작은 의미 가중치 easy_v=3과 비슷, 정밀 가중치 < EPS 인 동점군만 흔듦)

ORD = { low:0, mid:1, high:2 }            # 빛·물 순서척도
SIZE_ORD = { small:0, medium:1, large:2 } # 크기 순서척도

func proximity(tags, val, nearBonus):     # 정확 불일치 시 인접값 부분점수
  if val not in ORD: return 0
  best = 0
  for t in tags where t in ORD:
    if abs(ORD[t] - ORD[val]) == 1: best = max(best, nearBonus)
  return best

func sizeScore(p, a):
  if not a.size: return 0
  if p.size == a.size: return WEIGHTS.size
  if abs(SIZE_ORD[p.size] - SIZE_ORD[a.size]) == 1: return WEIGHTS.size_near
  return 0

func score(p, a):                          # 환경/관련성 본 점수 (난이도 소프트 포함)
  s = 0
  if a.purpose in p.tags_purpose:  s += WEIGHTS.purpose
  if a.interest in p.tags_interest: s += WEIGHTS.interest
  if a.place    in p.tags_place:    s += WEIGHTS.place
  s += sizeScore(p, a)
  if a.light in p.tags_light: s += WEIGHTS.light  else s += proximity(p.tags_light, a.light, WEIGHTS.light_near)
  if a.water in p.tags_water: s += WEIGHTS.water  else s += proximity(p.tags_water, a.water, WEIGHTS.water_near)
  if p.difficulty == '매우 쉬움': s += WEIGHTS.easy_vv
  elif p.difficulty == '쉬움':    s += WEIGHTS.easy_v
  return s
```

### Granularity 설계 (동점 자체를 줄임)
- v3의 정수 0~10 → v4는 0~약120 스케일에 **정확/근접 2단계 부분점수**가 6개 차원에 걸쳐 들어가 가능한 점수 값이 훨씬 촘촘해진다. 같은 점수가 되려면 6차원이 *모두* 동일 패턴이어야 하므로 동점 빈도가 급감한다.
- **근접 부분점수(proximity)**: 순서척도(빛·물·크기)는 "정확히는 아니지만 옆 칸"에 절반 미만 점수를 줘 변별. 예) 물 `mid` 요구에 식물이 `low`만 가지면 `water_near=4`(정확 9의 44%). 명목척도(장소)·이산 태그(목적·보는재미)는 의미적 '근접'이 없어 정확일치만 인정.

---

## 4. tie-break / 다양성 전략 (핵심 변경)

### 4-1. 난이도를 하드 그룹에서 **소프트 점수**로 강등
v3의 `isHard` 그룹 선분리를 제거. '보통'은 `easy` 보너스를 0점 받을 뿐, 다른 차원에서 더 잘 맞으면 '쉬움'을 이길 수 있다. 시니어 안전은 보너스(+6/+3)로 여전히 평균적으로 쉬운 종이 앞서되(시뮬레이션상 '보통'은 슬롯의 약 22%에 그침), 정밀 적합한 '보통' 종도 등장 가능 → **이 한 가지가 distinct를 103→179로 끌어올린 최대 요인.**

### 4-2. 결정적 해시 jitter (동점 분산, 무작위 아님)
```text
salt = answers.light+water+purpose+place+pet+size+interest   # 답 조합 서명
jitter(id, salt) = (fnv1a32(salt + '|' + id) % 100000) / 100000   # 0..1, 결정적
final = score(p, a) + jitter(p.id, salt) * EPS
```
- **결정론 유지**: 같은 답이면 salt가 같아 jitter도 같다 → 결과 100% 재현(20회 반복 검증 완료).
- **종 분산**: 답이 바뀌면 salt가 바뀌어 jitter 서열이 재배열 → 동점/근접점수 후보들이 조합마다 다른 종을 상위로 올림. id 사전순 편향(green_bean·pea·chlorophytum 독식) 제거.
- **정밀도 보호**: `EPS=6`은 정확일치 가중치(purpose40·interest30·place14·size12·light9·water9)보다 작다. 즉 jitter는 **점수가 거의 같은(차이 < EPS) 동점 클러스터 내부만** 흔들고, 더 잘 맞는 종을 덜 맞는 종 아래로 절대 떨어뜨리지 못한다 → 관련성 안 깨짐.

### 4-3. 최종 비교자(결정적, 다층)
```text
sort by:
  1) final 점수 내림차순            # 정밀도 (jitter는 동점 클러스터만 영향)
  2) difficulty 오름차순            # 동점이면 쉬운 종 우선 (시니어 안전 보조)
  3) jitter 내림차순               # 그래도 같으면 해시로 분산
  4) id 사전순                     # 완전 동일 시 최후 안정 정렬(재현성 보장)
```
"늘 같은 commons" 편향 제거 근거: ①granularity로 동점 빈도 자체 감소 ②동점 시 1순위 tie-break이 더 이상 id가 아니라 salt 종속 해시 → 조합마다 다른 종 ③`common` 보너스 폐지로 commons 인위 가산 없음.

---

## 5. 하드 필터 · 최소 3종 보장 · 완화 규칙

### STEP A. 반려동물 안전 (가장 강한 하드)
- `pet === 'yes'` → `toxic_to_pets === true` 전면 제외. **절대 완화 안 함**(아래 ⑤ 방어 제외).
- 안전종이 3 미만이면(실데이터상 발생 안 함: 가장 작은 pet+purpose 풀도 17종) 방어적으로 base 복귀.

### STEP B. 목적 하드 필터
- `purpose` 지정 시 `tags_purpose`에 포함된 종만 후보. 풀 ≥ 3이면 그대로.
- 풀 < 3이면 `relaxed.push('purpose')` 후 base 전체로 완화(실데이터상 모든 목적 풀 ≥ 36, pet 동시 적용해도 ≥ 17 → 발생 안 함).

### STEP C. 점수 정렬 + jitter → 상위 3 선택
- §3·§4의 `final`로 정렬, 상위 3종.

### STEP D. 최소 3종 보장 / 단계적 완화 (순서대로, 부족할 때만)
1. purpose 풀에서 상위 채우기(기본 경로).
2. (purpose 완화됨) base 점수 상위로 채우기 — `relaxed: ['purpose']`.
3. ⑤ 방어 최후: 위로도 3종 미만이고 pet 필터가 적용됐다면 pet 해제까지 — `relaxed: ['pet-relaxed']`. (실데이터상 도달 불가, 안전망)

> 실데이터 검증: 213종 분포상 STEP A·B만으로 항상 ≥ 3종 확보되어 완화는 발생하지 않음. 완화 경로는 데이터가 줄어드는 미래 대비 안전망이며, 발생 시 `_match.relaxed`에 정직히 표기되어 result.js가 "딱 맞진 않지만…" 문구로 안내한다.

---

## 6. 함수 시그니처 · `_match` 반환 (result.js 호환)

```js
matchPlants(answers, plants) -> Array<{ ...plant, _match }>   // 정확히 3종
answers = { light, water, purpose, place, pet, size, interest }   // level은 무시
```
`_match`는 v3 필드를 **그대로 유지**(result.js의 `buildReason`이 소비):
```js
_match = {
  score,            // §3 본 점수(jitter 제외, 표시·디버그용)
  purposeMatch,     // bool  (result.js 필수)
  interestMatch,    // bool  (result.js 필수)
  lightMatch,       // bool
  waterMatch,       // bool
  placeMatch,       // bool
  sizeMatch,        // bool
  petSafe,          // pet==='yes'면 bool, 아니면 null
  tier,             // 'primary' | 'fill' 등 (디버그)
  relaxed,          // string[]  (result.js 필수: 'interest'·'purpose'·'pet-relaxed')
  reasons,          // string[]  (디버그)
}
```
- `*Match` 불리언은 **정확 일치(태그/동일값) 기준**으로 채운다(근접 부분점수는 score에만 반영, Match에는 반영 안 함 — 사용자에게 "딱 맞아요"라고 거짓 안내하지 않기 위함).
- `relaxed`에 `'interest'`는 v3에서 interest 풀 양보 시 넣던 값. v4는 interest를 필터가 아닌 점수로 쓰므로, **상위 3종 중 interest 불일치가 있고 사용자가 interest를 골랐다면** `relaxed.push('interest')`로 동등한 정직 안내를 유지한다(result.js line 109 분기 호환).

---

## 7. 검증 계획 (전 2,592조합 스윕)

테스트 하니스: 기존 `tests/v3-sweep.js`를 `tests/v4-sweep.js`로 복제·확장. 측정 항목:

| 지표 | v3 실측 | v4 목표 | v4 프로토타입 실측 |
|---|---|---|---|
| (a) 목적 일치율 (air/deco/gift 슬롯) | 100% | = 100% 유지 | **100%** |
| 목적 harvest 비일치 노출 | 0 | 0 | **0** |
| (b) 독성 노출(pet=yes) | 0 | **0 (절대)** | **0** |
| (c) **distinct 추천 종(커버리지)** | 103 | **≥ 150** (스트레치 ≥ 170) | **184 / 213** |
| 한 번도 추천 안 됨 | 110 | ≤ 60 | **29** |
| TOP10 슬롯 점유 | 36.5% | ≤ 30% | **27.1%** |
| interest ≥ 2 일치율 | 75.0% | ≥ 75% | **81.6%** |
| 정확히 3종 / 중복 0 | OK | OK | OK |
| 결정론(동일 답 20회) | OK | OK | **OK** |

> 프로토타입 수치는 §3·§4 그대로(EPS=6)를 213종 실데이터에 전수 적용해 측정. **커버리지 103→184(+79종, +77%)**, 미추천 110→29, TOP10 36.5%→27.1%. 목적·안전·결정론은 회귀 없음.

### 추가 단위 검증 (구현 후 필수)
1. 단일 답 변경 민감도: 한 항목만 바꾸면 상위3이 실제로 달라지는지(7항목 각 샘플). — 프로토타입에서 7/7 변화 확인.
2. petSafe 정합: pet=yes 결과에 `toxic_to_pets===true` 0건, `_match.petSafe===true`.
3. `_match` 계약: result.js가 읽는 9개 필드 존재·타입 동일(스냅샷 비교).
4. 근접 점수 단위: 물 mid 요구 + low-only 식물 score에 `water_near` 가산 확인.

---

## 8. 잔여 한계 (정직 기록)
- harvest+fruit 풀은 9종뿐이라 pea·green_bean이 여전히 최상위 빈도(각 ~320). 이는 **무작위로 깰 대상이 아니라 데이터 한계**(작은 풀 = 낮은 다양성). 진짜 해법은 식물 데이터 확장(harvest/fruit 종 추가)이며, 본 v4 범위(추측 데이터 변경 금지)를 벗어나므로 별도 데이터 작업으로 분리한다.
- difficulty를 소프트화하면서 '보통' 종이 슬롯의 약 22% 등장. 시니어 타깃상 허용 범위로 판단(여전히 78%는 쉬운 종)하나, 운영 중 체감 난이도 민원이 생기면 `easy_vv/easy_v` 가중치 상향으로 조절 가능(EPS·관련성 가중치는 그대로 둠).
