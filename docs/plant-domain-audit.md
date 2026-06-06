# 식물 정보 정확성 검수 (plant-domain-audit)

- 검수일: 2026-06-06
- 검수자: plant-domain-expert (한국 실내 식물·원예)
- 대상: `packages/plants/plants.json` (12종), `packages/plants/care-guides/*.md` (12편), `plants/*.html` (상세 12개)
- 기준 출처: 농촌진흥청 농사로/국가표준식물목록, ASPCA Animal Poison Control, NASA Clean Air Study, treeinfo.net

## 요약 결론

- **발견한 명백한 사실 오류: 1건** — 행운목 학명 오기 (`Dracaena sanderiana` → `Dracaena fragrans`).
- **직접 수정: 2개 파일** — `packages/plants/plants.json`, `public/IMAGE-SOURCES.md` (연쇄 오류).
- **독성(toxic_to_pets) 표기: 12/12 정확** (ASPCA 기준 모두 일치). 수정 불필요.
- **빛/물/난이도/물주기: 합리적**. plants.json ↔ 케어가이드 ↔ 상세HTML 3자 모순 없음.
- **과장 효능("암 치료" 등) 없음**, 12종 모두 한국 마트·꽃집·온라인에서 구하기 쉬운 종.
- 권고(비오류) 사항 2건은 하단 별도 정리.

## 12종 점검표

| # | 종 | 학명 | 학명 판정 | 빛 | 물주기 | 난이도 | 독성표기 | 독성 판정 | common |
|---|----|----|----|----|----|----|----|----|----|
| 1 | 산세베리아 | Sansevieria trifasciata | OK(통용·Dracaena trifasciata 동의어) | low/mid/high | 2~3주 | 매우 쉬움 | true | OK | true |
| 2 | 스파티필름 | Spathiphyllum wallisii | OK | mid | 1주 | 쉬움 | true | OK | true |
| 3 | 다육식물 | Echeveria spp. | OK(대표속) | high | 2~3주 | 매우 쉬움 | false | OK | true |
| 4 | 스킨답서스 | Epipremnum aureum | OK | mid | 1주 | 매우 쉬움 | true | OK | true |
| 5 | 금전수 | Zamioculcas zamiifolia | OK | mid | 2~3주 | 쉬움 | true | OK | true |
| 6 | 테이블야자 | Chamaedorea elegans | OK | mid | 1주 | 쉬움 | false | OK | true |
| 7 | 고무나무 | Ficus elastica | OK | mid/high | 1주 | 쉬움 | true | OK | true |
| 8 | 행운목 | ~~Dracaena sanderiana~~ → **Dracaena fragrans** | **오류→수정** | mid | 1주 | 쉬움 | true | OK | true |
| 9 | 호접란 | Phalaenopsis aphrodite | OK(통용) | mid/high | 열흘 | 보통 | false | OK | true |
| 10 | 아이비 | Hedera helix | OK | mid | 1주 | 쉬움 | true | OK | true |
| 11 | 상추 | Lactuca sativa | OK | mid/high | 이틀 | 쉬움 | false | OK | true |
| 12 | 바질 | Ocimum basilicum | OK | high | 이틀 | 쉬움 | false | OK | true |

## 1. 학명 정확성

11종은 정확하거나 한국 통용 학명으로 허용 가능. **행운목 1종만 오류**.

### 행운목 학명 오류 (수정 완료)
- **문제**: `scientific_name: "Dracaena sanderiana"` 로 표기. 그러나 `Dracaena sanderiana`는 한국명 **개운죽(만년죽), 영어명 lucky bamboo** — 대나무처럼 가는 줄기를 수경재배하는 별개 종이다.
- **한국에서 "행운목"으로 유통·판매되는 식물**은 굵은 줄기에 넓은 잎이 위에 달리고 잎 중앙에 노란 줄무늬가 있는 **Dracaena fragrans (옥수수목/맛상게아나, corn plant)** 이다.
- plants.json의 한국명("행운목"), 케어가이드 본문("곧게 뻗은 줄기에 푸른 잎이 시원하게 자라는", "집들이/개업 선물"), 이미지 alt("곧은 줄기 끝에 초록 잎이 달린 행운목") 모두 *D. fragrans*를 묘사 → 학명만 *sanderiana*로 잘못 매칭된 명백한 데이터 오류.
- **수정**: `Dracaena sanderiana` → `Dracaena fragrans` (`packages/plants/plants.json`). 연쇄로 `public/IMAGE-SOURCES.md`의 검색어/이미지 출처도 corn plant·*D. fragrans* 'Massangeana'로 교정.
- **출처**: treeinfo.net(행운목=Dracaena fragrans 'Massangeana' / 개운죽=Dracaena sanderiana), 월간원예, 위키백과 용혈수속.

### 통용 학명으로 허용한 항목 (오류 아님)
- 산세베리아 `Sansevieria trifasciata`: 2017년 APG 분류상 *Dracaena trifasciata*로 재분류되었으나, 화훼·유통에서 Sansevieria가 여전히 표준 통용명이므로 허용.
- 호접란 `Phalaenopsis aphrodite`: 시판 품종 대부분이 *P. aphrodite*/*P. amabilis* 교배종이므로 대표 학명으로 허용.
- 다육식물 `Echeveria spp.` / 호접란·산세베리아처럼 "대표속"으로 묶은 표기는 콘텐츠 성격상 적절.

## 2. 빛/물/난이도 적정성 + 3자 일치

- 한국 실내 환경 기준 모든 종의 빛·물·난이도 설정이 합리적.
  - 산세베리아: 음지~양지(low/mid/high)·물적게·매우 쉬움 → 적절.
  - 호접란: 난이도 "보통"·물 열흘 → 적절(다른 종보다 손이 더 감).
  - 다육·금전수: 양지/밝은 간접광·물 적게·2~3주 → 적절.
- **3자(JSON ↔ 케어가이드 ↔ 상세HTML) 모순 없음.** 난이도·물주기·빛 설명·장점 문구가 HTML info-card 및 JSON-LD description과 모두 일치함을 12종 전수 확인.
- 참고: 상세 HTML에는 학명(scientific_name)이 렌더링되지 않으며, front-end 스크립트(`scripts/*.js`)도 scientific_name을 사용하지 않음 → 학명 수정은 plants.json 반영만으로 충분(파생 HTML 없음).

## 3. 물주기 현실성 (계절 반영)

- water_cycle은 모두 "기준값"으로 제시되고, 케어가이드 "온도와 계절 관리" 단락에서 계절 보정을 안내하여 위험한 고정 표현이 아님.
  - 산세베리아·다육·금전수: 가이드에 "겨울에는 한 달에 한 번 정도로 줄이라"고 명시 → 적절.
  - 스킨답서스·테이블야자·고무나무·행운목·아이비: "겨울 자람이 느려지니 횟수를 줄이고 흙이 마른 뒤에" 안내 → 적절.
  - 호접란: "겨울엔 간격을 넉넉히" 안내 → 적절.
  - 상추·바질: 이틀에 한 번(다습 선호) + "여름엔 더 자주" 안내 → 식용엽채/허브 특성상 적절.
- 위험한 계절 무시 표현 없음.

## 4. 독성(toxic_to_pets) 정확성 — 12/12 정확

ASPCA 기준 전수 대조 결과 모두 일치. 오표기 없음.

| 종 | 표기 | ASPCA 근거 |
|----|----|----|
| 산세베리아 | true | saponin 함유, 개·고양이 독성 |
| 스파티필름 | true | 불용성 칼슘옥살레이트(raphides) |
| 스킨답서스 | true | 불용성 칼슘옥살레이트 |
| 금전수 | true | 불용성 칼슘옥살레이트 |
| 고무나무 | true | Ficus, 경미 독성(구강 자극·구토) |
| 행운목(D. fragrans) | true | Dracaena saponin, 개·고양이 독성 |
| 아이비 | true | triterpenoid saponin |
| 다육(Echeveria) | false | 무독성(과식 시 경미한 위장 자극뿐) |
| 테이블야자 | false | 무독성(ASPCA non-toxic) |
| 호접란 | false | 무독성(ASPCA non-toxic) |
| 상추 | false | 무독성 식용 |
| 바질 | false | 무독성 식용 허브 |

- 독성 7종(산세베리아·스파티필름·스킨답서스·금전수·고무나무·행운목·아이비) 상세 HTML에 "🐾 반려동물 주의" 경고 카드 노출 확인.
- 안전 5종(다육·테이블야자·호접란·상추·바질) "반려동물에게도 안전" 카드 노출 확인.
- 행운목 학명을 *D. sanderiana*→*D. fragrans*로 정정해도 둘 다 ASPCA 독성종이므로 독성 표기(true)는 변동 없음.

## 5. 주의점(caution) 타당성 / 과장 효능

- 모든 caution이 원예적으로 타당(과습 무름, 직사광 잎탐, 한기, 고무나무 유액 피부자극, 아이비 독성 경고 등).
- **미검증 효능·의료 과장("암 치료", "미세먼지 제거율 OO%" 등) 표현 없음.** "공기를 맑게 해 준다" 수준의 일반적 공기정화 서술만 존재(NASA Clean Air Study 범위 내 무난한 표현).

## 6. 구매 용이성(common) — 전부 적절

12종 모두 한국 대형마트·꽃집·온라인(쿠팡)에서 쉽게 구입 가능한 보급종으로, `common: true` 설정이 모두 타당.

## 수정 내역 (Changelog)

1. `packages/plants/plants.json` — 행운목 `scientific_name`: `Dracaena sanderiana` → `Dracaena fragrans`. (JSON 유효성 검증 통과)
2. `public/IMAGE-SOURCES.md` — 행운목 항목 검색어/이미지 출처를 lucky bamboo·*D. sanderiana* → corn plant·*Dracaena fragrans* 'Massangeana'로 교정(연쇄 오류 정정).

## 권고 사항 (비(非)오류 — 콘텐츠/UX 개선 제안)

1. **스파티필름 케어가이드 본문에 독성 경고 부재**: plants.json·상세HTML info-card에는 "반려동물 주의"가 있으나, `care-guides/spathiphyllum.md` 본문에는 독성 언급이 없다(아이비 가이드는 본문에 명시). 일관성·안전성 위해 본문에도 한 줄 추가 권고. (사실 오류는 아님)
2. **행운목/개운죽 혼동 주의**: 향후 "개운죽(Dracaena sanderiana, 수경 lucky bamboo)"을 별도 종으로 추가할 경우, 이번에 정정한 행운목(*D. fragrans*)과 학명·이미지가 다시 섞이지 않도록 관리 필요.
