# v2 확장 설계 — 200종+ 매칭 DB + 7문항 맞춤 추천

> 기존 12종/3문항 → 200종+/7문항(필수 3 + 선택 4) 하이브리드. 인기 50종만 정밀 콘텐츠(상세페이지·가이드), 나머지는 매칭 전용.

## 1. plants.json 스키마 v2 (필드)
| 필드 | 타입/허용값 | 설명 |
|---|---|---|
| id | 영문 소문자 snake | 고유 |
| name | 한글명 | |
| scientific_name | 학명 | 추측 금지 |
| tags_light | ["low","mid","high"] 부분집합 | 음지/반음지/양지 |
| tags_water | ["low","mid","high"] 부분집합 | 적게/보통/자주 |
| tags_purpose | ["air","deco","harvest","gift"] 부분집합 | 공기정화/꾸밈/수확/선물 |
| **tags_place** | ["living","window","bathroom","desk"] 부분집합 | 거실/베란다·창가/욕실·습한곳/책상·사무실 |
| **tags_interest** | ["flower","foliage","fruit"] 부분집합 | 꽃/잎·무늬/열매·단풍 |
| **size** | "small"\|"medium"\|"large" | 탁상/중간/거실용 |
| difficulty | "매우 쉬움"\|"쉬움"\|"보통" | 시니어 친화(어려운 종은 보통까지만) |
| water_cycle | 문자열 | 예 "2~3주에 한 번" |
| light_desc | 짧은 한글 | |
| merit | 한 문장 | 존댓말 |
| caution | 한 문장 | 존댓말 |
| toxic_to_pets | bool | 반려동물 독성(ASPCA 기준) |
| common | bool | 한국 마트·꽃집 구매 용이 |
| **tier** | "core"\|"ext" | core=정밀콘텐츠(상세·가이드), ext=매칭전용 |
| image | "public/plants/{id}.jpg" | 없으면 placeholder 폴백 |
| coupang_url | placeholder | |

## 2. 질문 흐름 (필수 3 + 선택 4)
- **Q1 빛(필수)**: high/mid/low
- **Q2 물(필수)**: low/mid/high
- **Q3 목적(필수)**: air/deco/harvest/gift
- → 여기서 "이대로 추천받기"(바로 결과) 또는 "더 정확히 추천받기"(선택 4문항)
- **Q4 장소(선택)**: living/window/bathroom/desk
- **Q5 반려동물(선택)**: pet=yes/no
- **Q6 크기(선택)**: small/medium/large
- **Q7 보는재미(선택)**: flower/foliage/fruit
- 각 선택 문항은 "잘 모르겠어요/건너뛰기" 가능. 시니어 UX: 필수는 3개로 짧게, 정밀화는 자발적.
- URL: `result.html?light=&water=&purpose=&place=&pet=&size=&interest=&level=`

## 3. 매칭 점수식 v2 (match.js)
```
score = (light ∈ tags_light ? 3 : 0)
      + (water ∈ tags_water ? 3 : 0)
      + (purpose ∈ tags_purpose ? 2 : 0)
      + (place ∈ tags_place ? 2 : 0)        // place 미응답 시 0
      + (size === plant.size ? 2 : 0)       // size 미응답 시 0
      + (interest ∈ tags_interest ? 1 : 0)  // interest 미응답 시 0
      + (level==='beginner' && difficulty==='매우 쉬움' ? 1 : 0)
```
- **반려동물 안전 필터**: `pet==='yes'`면 `toxic_to_pets===true` 식물 **제외**(안전). 단 최소 3종 보장이 안전 식물 내에서 충족되도록 폴백.
- 정렬: score 내림차순 → 난이도(매우쉬움<쉬움<보통) → common(true 우선).
- **최소 3종 보장**: 후보 부족 시 (purpose=harvest면 harvest 우선) → common:true → 안전(pet 필터 적용) 순으로 채움.
- 미응답 차원은 점수 0(감점 아님) → 필수 3개만으로도 정상 작동(하위호환).

## 4. 콘텐츠 2계층
- **core(인기 50종, 기존 12 포함)**: 정밀 검증 데이터 + 케어가이드(1500자+) + 정적 상세페이지 `plants/{id}.html`(SEO) + 사진.
- **ext(나머지 150+)**: 매칭 전용 핵심 데이터. "자세히 보기" → 동적 상세 `plant.html?id={id}`(plants.json 데이터로 클라이언트 렌더, 얇은 양산 정적페이지 회피 = 애드센스 안전). 사진 없으면 placeholder.
- result 카드는 core/ext 모두 동일하게 정보·쿠팡·공유 노출. 차이는 "자세히 보기" 대상(정적 vs 동적)뿐.

## 5. 단계(Phase) 실행
- **P1 데이터**: 카테고리별 plant-domain-expert가 fragment(JSON) 작성 → 병합·중복제거·유효성검사 → plants.json v2(200종+, tier 표기).
- **P2 질문**: quiz.html/quiz.js 7문항(필수3+선택4·건너뛰기) + copy-deck 갱신.
- **P3 매칭**: match.js v2(신규 차원+pet 필터+최소3) + result.js 이유 생성 갱신.
- **P4 상세**: plant.html?id= 동적 템플릿 + result 카드 링크 분기(core→정적, ext→동적).
- **P5 core 콘텐츠**: 인기 50종 선정·가이드·사진(기존 12 완료, 나머지 점진).
- **P6 SEO/QA**: sitemap(core만 정적 등록), 매칭 검증, 회귀 테스트.
- 하위호환: 기존 12종·3문항 흐름은 그대로 동작(신규 필드 없으면 점수 0 처리).
