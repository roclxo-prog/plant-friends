# 메인 개편 코드 리뷰 — 우리집 초록친구

리뷰 대상: `scripts/home.js`, `index.html`, `styles/styles.css`(섹션10), 전 페이지 nav 변경
검토 방식: 정적 분석(소스 직접 검토) + `plants.json` 213종 카테고리 카운트 + 25개 HTML nav 대조 + 이미지 파일 실존 확인
리뷰어: code-reviewer · 일자: 2026-06-07 · **수정 없음, 리뷰 전용**

## 결론: 치명(Blocker) 0건

배포를 막는 치명 결함은 없습니다. 런타임 안전 처리·XSS 방어·선택 로직·nav 일관성 모두 견고합니다. 아래는 중요 2건, 경미 6건의 개선 권고입니다.

---

## 분류표

| # | 심각도 | 항목 | 파일:위치 | 내용 | 권고 |
|---|--------|------|-----------|------|------|
| 1 | 중요 | featured 셔플 풀 공유로 인한 동일 종 중복 노출 | `home.js:127-139` / `179-214` | featured와 rankings가 같은 `plants`에서 각각 독립 셔플 → 한 화면에 같은 식물이 featured와 여러 랭킹 블록에 동시 등장 가능(중복 자체는 버그 아니나 "다양성" 체감 저하). 또한 랭킹 4블록 간에도 동일 종이 여러 블록(예: gift+air 둘 다 가진 산세베리아)에 중복 등장. | 의도된 동작이면 유지. "한 종은 한 곳만" 원하면 featured 3종을 먼저 뽑고 rankings 풀에서 제외하는 set 가드 추가 권고. |
| 2 | 중요 | 부분 실패 시 섹션이 빈 채로 남음 | `home.js:229-237` | `loadPlants()` 성공 후 `renderFeatured`/`renderRankings` 내부에서 예외가 나면(데이터 형태 이상 등) `.catch`가 잡지 못해 로딩 문구("초록친구를 고르고 있어요")가 영구 노출될 수 있음. fetch 실패는 graceful(섹션 숨김)이나, 렌더 단계 예외는 미보호. | 렌더 호출을 try/catch로 감싸 실패 시 섹션 숨김 처리 권고. |
| 3 | 경미 | rankings 블록 0건 시 섹션 헤더만 남음 | `home.js:165-166`, `index.html:126-135` | `rankBlockHTML`은 빈 배열이면 ""를 반환하나, 4블록 전부 비어 `rankings-blocks`가 빈 문자열이 돼도 `<h2>이런 식물은 어떠세요</h2>`와 `.affiliate-note`는 그대로 노출. 현재 데이터(각 카테고리 42~120종)로는 발생 불가. | 방어적으로 `container.innerHTML`이 비면 `rankings` 섹션 숨김 권고(현재는 이론적 리스크). |
| 4 | 경미 | 제휴 문구 위치상 추천 미표시 시에도 노출 | `index.html:131-134` | `.affiliate-note`가 `#rankings-blocks` 형제라 rankings 렌더 실패로 블록이 비어도 제휴 문구는 남음(`.catch` 시엔 부모 숨김으로 함께 사라짐). | 제휴 문구를 `#rankings-blocks` 안으로 넣거나 #3과 함께 처리. |
| 5 | 경미 | 순위 배지 색 의존 — 텍스트 대체는 있으나 시각적 위계는 색만 | `home.js:151,154`, `styles.css:1120-1137` | 숫자 배지에 `.sr-only`로 "N위" 텍스트가 있어 스크린리더 OK. 다만 1~6위 모두 동일 `--green-600` 단색이라 시각적으로 "순위"임이 색/모양만으로는 약함(숫자 자체로 구분되므로 위반은 아님). | 현행 허용. 1위 강조가 필요하면 크기/테두리 차등 권고(색만 의존 금지 규칙은 숫자 텍스트로 이미 충족). |
| 6 | 경미 | `shortMerit` 글자 자르기 한국어 음절 안전하나 말줄임 기준 혼재 | `home.js:72-80` | 첫 문장(마침표) 우선, 없으면 34/32자 컷. 한글은 코드포인트 단위라 깨짐 없음. merit에 마침표 없는 종은 32자+"…". 동작상 문제 없음. | 유지 가능. 일관성 위해 컷 기준 상수화 권고(경미). |
| 7 | 경미 | featured 이미지 `width/height`와 CSS `aspect-ratio` 불일치 | `home.js:111`(480×320=3:2) vs `styles.css:1035`(3/2) | 일치함(3:2). rank 카드도 240×160(3:2) vs `aspect-ratio:3/2` 일치. **문제 없음** — 확인 완료 항목. | 조치 불필요. |
| 8 | 경미 | index.html nav에 aria-current 없음(홈 자신은 nav에 링크 없음) | `index.html:89-94` | nav 4개 항목(추천받기/돌봄안내/읽을거리/소개)에 홈이 포함되지 않아 index에서 aria-current 부재는 정상. 다른 24개 페이지는 해당 항목에 `aria-current="page"` 정확히 적용. | 조치 불필요(정상). |

---

## 점검 항목별 상세

### 1. home.js 런타임 안전 — 양호
- `App.loadPlants`/`attachImageFallback`/`coupangUrl` 모두 `app.js`에 실존하며 시그니처 일치(`app.js:31,51,64`). 호출 전 `typeof === "function"` 가드 있음(`home.js:218,227`).
- fetch 실패: `.catch`에서 두 섹션 `parentNode.style.display="none"` → 정적 콘텐츠(히어로·이용방법·안심문구)는 유지. **graceful 확인**.
- 빈 결과 가드: `renderFeatured`에서 `if (!picks.length)` 섹션 숨김(`home.js:130`). `Array.isArray(plants)` 체크(`home.js:230`).
- 무한루프 없음: 모든 루프 유한(슬라이스·고정 배열). Fisher–Yates 정상.
- fenestraria(오십령옥) 제외: `NO_PHOTO_IDS={fenestraria:true}`로 `hasPhoto` 필터(`home.js:19-23,128,180`). **데이터 확인 결과 `public/plants/fenestraria.jpg` 실제 누락 → 제외 필수이며 정확히 동작**.
- 미보호 케이스: 렌더 단계 예외(항목 #2).

### 2. 선택 로직 정확성 — 양호
`plants.json` 213종 실측:
- gift 태그: 42종(common 42) — 6종 충분
- air 태그: 45종(common 44)
- toxic_to_pets===false(반려동물): 120종(common 112)
- 매우 쉬움+쉬움: 144종
- 중복 id: **0건**, image 필드 누락: **0건**

랭킹 4기준이 태그와 정확히 매칭(`gift`/`air`/`toxic_to_pets===false`/난이도 문자열 "매우 쉬움"·"쉬움"). `shuffleCommonFirst`로 common 우선(`home.js:53-57`) 정확. easy 블록은 "매우 쉬움" 먼저 concat 후 "쉬움"으로 우선순위 정확(`home.js:188-194`). 각 블록 내 중복 없음(단일 풀 슬라이스). **6종 미만 처리**: `rankBlockHTML`이 길이만큼만 렌더하고 빈 배열이면 블록 생략 — 안전(현재 데이터로는 항상 6종). 블록 **간** 중복은 항목 #1 참고.

### 3. XSS/보안 — 양호
- `esc()`가 `name`/`merit`/audience/title/shortMerit 전부에 적용(`home.js:113,114,103,156,169`). `id`는 `encodeURIComponent`로 href·속성에 안전 삽입(`home.js:93,150`).
- 쿠팡 href: `safeCoupang`이 `https://` 접두 + placeholder("여기에_") 차단 검사 후 미통과 시 쿠팡 검색 URL 폴백(`home.js:26-36`). 모든 쿠팡 링크 `rel="noopener nofollow sponsored"` + `target="_blank"`(`home.js:119,158-159`). **공정위·SEO·보안 모두 적합**.
- `plantImg`도 `encodeURIComponent(plant.id)` 적용(`home.js:86`).
- 참고: 현재 plants.json의 `coupang_url`은 전부 placeholder("…여기에_쿠팡_링크")라 실제로는 전 카드가 쿠팡 검색 폴백으로 동작 — 의도된 안전 폴백(빈/허위 링크 방지).

### 4. 접근성/Hard Rules — 양호
- 글씨 18px+: featured merit/audience(`--font-base`=18px), rank merit(18px), affiliate-note(18px 하한 명시 `styles.css:1164`). 배지 `--font-caption`도 18px(`styles.css:26`). **위반 없음**.
- 버튼 48px+: `.btn`/`.btn--detail`/`.btn--shop` `min-height:56px`(`styles.css:564`). **충족**.
- 사진 위 글씨 없음: 카드 사진은 상단 분리, 텍스트는 별도 `__body`/하단 패딩. 순위 배지는 숫자(장식)뿐, 본문 텍스트 아님. **준수**.
- 유리효과 미사용: 섹션10 카드는 `var(--card)`(불투명 흰색)·`--shadow-card`만 사용. **준수**(주석에도 명시).
- 가로스크롤 키보드 접근: `.rank-row` 내 카드가 `<a>`(상세링크+쿠팡버튼)로 포커스 가능 → Tab 시 브라우저가 자동 스크롤. **접근 가능**.
- 이미지 alt 한국어: `'<이름> 사진'` 형식(`home.js:110,152`), 폴백 시 "사진을 준비 중이에요"(`app.js:57`). **준수**.
- 순위 배지 색 의존 금지: `.sr-only` "N위" 텍스트 병기(`home.js:154`) → 색만 의존 아님. **준수**(항목 #5는 시각 위계 개선 제안에 한함).

### 5. nav 일관성 — 양호
- 25개 HTML 전부 동일 nav 4항목(추천받기/돌봄안내/읽을거리/소개), 모두 절대경로(`/quiz.html` 등)라 서브디렉터리(`plants/`, `articles/`)에서도 깨짐 없음.
- 링크 타깃 4개(`/quiz.html`, `/guide.html`, `/articles.html`, `/about.html`) **전부 실존**. 깨진 링크 0.
- `aria-current="page"`: 해당 페이지의 매칭 nav 항목에 정확히 적용(quiz/about/guide/articles 및 서브페이지 breadcrumb). index는 nav에 홈 링크가 없어 부재가 정상.

### 6. 제휴 표시 — 양호
- 문구(`index.html:131-134`): "이 추천은 우리집 초록친구가 식물 특징을 기준으로 고른 것이며, 쿠팡 파트너스 활동으로 일정액의 수수료를 받을 수 있어요." → 추천 기준 명시 + 수수료 수취 가능성 고지. **공정위 추천·보증 심사지침상 적정**(과장·허위·보증 표현 없음, "일정액"으로 단정 회피).
- `rel="sponsored"`까지 부착해 검색엔진 관점 표시도 일관.
- 개선 여지(경미): 문구를 rankings 블록과 결속(항목 #3·#4)하면 추천 미노출 시 외톨이 문구 방지.

---

## 권고 우선순위(요약)
1. (중요) 렌더 단계 try/catch 추가 — 부분 실패 시 로딩 문구 영구 노출 방지.
2. (중요) featured ↔ rankings, 블록 간 중복 노출 정책 결정(set 가드).
3. (경미) rankings 전부 비면 섹션·제휴문구 함께 숨김.
4. (경미) 제휴 문구를 rankings 렌더 결과에 결속.
5. (경미) 순위 1위 시각 강조(크기/테두리) — 색만 의존 회피 강화.
