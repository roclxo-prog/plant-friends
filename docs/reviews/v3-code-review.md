# v3 코드 리뷰 — 우리집 초록친구

리뷰 대상: `scripts/match.js`(의도-우선 v3), `scripts/quiz.js`(7문항), `scripts/result.js`, `styles/styles.css`(진행바), `quiz.html`
리뷰어: code-reviewer · 일자: 2026-06-07 · **수정 금지, 리뷰만**
데이터 검증: `packages/plants/plants.json` 213종 기준 정적 분석 + 72개 조합 시뮬레이션

---

## 종합 판정

> **치명(Critical) 0건.** 출시 차단 결함 없음.
> 중요(Major) 2건 · 경미(Minor) 7건. 모두 후속 개선 항목이며, 현재 동작은 정상.

72개(빛3 × 목적4 × 보는재미3 × 반려2) 조합 시뮬레이션 결과:
- 전부 정확히 **3종 반환**, **결정론적**(2회 호출 동일), **원본 plants 비오염**(JSON 동일, `_match` 미누출), pet-relaxed 폴백 미발동.

---

## 분류표

| # | 심각도 | 영역 | 파일:위치 | 내용 | 권고 |
|---|--------|------|-----------|------|------|
| 1 | 중요 | a11y | quiz.js:144-146 | 자동 진행마다 `heading.focus()` 호출 → 매 선택 시 포커스가 새 질문 제목으로 강제 이동. 스크린리더 사용자에게는 적절하나, 키보드+화면 동시 사용자는 매번 포커스가 튐. 자동진행(220ms) 후 발생하므로 선택 직후 사용자가 다른 곳을 보기 전 이동됨 | 자동진행 흐름과 포커스 이동은 양립 가능하나, `prefers-reduced-motion`/연속 진행 시 포커스 이동을 최소화하거나 `aria-live`로 질문 전환을 알리는 방식 병행 검토 |
| 2 | 중요 | 정합/잔재 | result.js:3,26,55 | result.js는 `level`을 여전히 화이트리스트(`LEVEL`)에 두고 `parseAnswers`에서 `a.level`을 채움. match.js는 level을 무시하므로 무해하나, "level 제거" 설계 의도(match.js:14)와 어긋나는 **죽은 코드 잔재**. quiz.js는 level을 생성하지 않음 | result.js의 `LEVEL` 상수·`a.level` 파싱·헤더 주석의 `level` 언급 제거 권고(하위호환 불필요 시) |
| 3 | 경미 | a11y | quiz.js:112-113 | progressbar `aria-valuemin="1"`. ARIA 규약상 보통 0이 시작값. `aria-valuetext`가 함께 제공돼 실사용 문제는 없음 | valuemin=0 / valuenow=cur(0-based) 또는 현행 유지(valuetext가 우선되므로 영향 경미) |
| 4 | 경미 | 정확성 | match.js:160-165 | `relaxed.push("interest")`가 `picks.length < 3` 조건 하에서 secondary를 take하기 **직전** 무조건 기록됨. interest 응답이 있고 primary가 3 미만이면, 실제 secondary가 채워지지 않아도(=interest 양보가 결과에 반영 안 돼도) relaxed에 'interest'가 남을 수 있음. 단 picks<3이면 이후 fill 단계로 가므로 실질 결과는 항상 interest를 양보한 상태 → **거짓 이유 아님**. 다만 의미상 "secondary에서 실제로 뽑았을 때만" 기록하는 게 더 정밀 | take 후 picks 증가분이 있을 때만 push하도록 정밀화 가능(현 동작 정상) |
| 5 | 경미 | 효율 | match.js:173-175 | harvest 특례에서 `fillPool.filter(...).sort()` 후 다시 `fillPool.sort()`로 전체를 take. `fillPool`을 in-place `sort`하므로 첫 호출이 원본 fillPool을 정렬(부작용). have[] dedup으로 중복은 방지되나, 같은 배열을 두 번 정렬 | harvest 분기는 별도 정렬 배열 사용 또는 `slice().sort()`로 명확화(결과 정상, 가독성/미세 효율) |
| 6 | 경미 | a11y | quiz.js:157,182-183 | 선택 카드 `aria-pressed` 토글은 정상 구현. 단 자동진행 단일선택 UX에서 `aria-pressed`(토글 의미)보다 `role="radio"`+`aria-checked`가 의미상 더 정확할 수 있음 | 현행 허용. 라디오 그룹 시맨틱 전환은 선택 사항 |
| 7 | 경미 | 견고성 | result.js:30-31 | `safeCoupang`이 `window.App.coupangUrl` 존재를 가정. App 미로드 시 TypeError. 단 app.js가 defer로 먼저 로드되고 loadPlants 성공 후 호출되므로 실무상 안전 | `window.App && window.App.coupangUrl` 가드 추가 검토(방어적) |
| 8 | 경미 | CSS | styles.css:445-507 | 진행바 320px 검증: dot 16px×7 + gap 8px×6 = 160px, 360px 미디어쿼리에서 14px×7 + gap 6px×6 = 134px. 컨테이너 `overflow-x:hidden` 보호막까지 있어 **넘침 없음**. 색만 의존 금지 충족(숫자 n/7 + 채움막대 + 점 채움/테두리/크기 3중 구분). 죽은 구 규칙(`.progress__list`/`__step`/`__num`) **없음**. 토큰 사용 양호 | 양호. 단 일부 하드코딩 px(`margin-bottom:8px`, `gap:8px`, `height:14px`)는 토큰화 가능(미세) |
| 9 | 경미 | 정합 | match.js:90 vs result.js:87 | `petSafe` 정의 일관(pet==='yes' && toxic!==true). result는 `_match` 우선 사용하나 `petSafe`만은 `_match.petSafe` 대신 직접 재계산(buildReason:87) → 값은 동일하나 _match 활용 일관성에서 벗어남 | `m.petSafe` 활용 검토(현 결과 동일) |

---

## 항목별 점검 결과

### 1. match.js 정확성 — 양호
- **STEP A~E 정합**: pet 제외(A) → purpose 필터(B) → interest 2층 분리(C) → 환경정렬(D) → 단계적 완화(E) 순서·조건 모두 설계와 일치. interest 우선군 3+ 시 후순위 배제 정상.
- **tie-break 결정론**: `envScore↓ → tieBonus↓ → diffRank↑ → id 사전순`. id 최종 분기로 완전 결정론(시뮬레이션 2회 호출 동일 확인).
- **최소 3 보장**: 72조합 전부 3종. petSafe 식물 총 120종, 목적별 최소 17종(air)이라 pet-relaxed(⑤) 미발동 확인.
- **원본 비오염**: buildResult가 `for...in + hasOwnProperty` 얕은 복사 후 `_match` 부착. 시뮬레이션 후 원본 JSON 불변·`_match` 미누출 확인.
- **Array.isArray 가드**: `inTags`, plants 인자 모두 가드 존재. plants 빈 배열 시 `[]` 반환.
- **무한루프/누락**: take()는 list 길이 + picks>=3 이중 종료. 완화 단계가 base→plants까지 단계적이라 누락 위험 없음.

### 2. quiz.js — 양호
- **7문항 단일 흐름**: 분기 없음. QUESTIONS 7개 선형. 구 분기/level/건너뛰기/이대로추천 **잔재 없음**(주석 외 코드 0).
- **이전 복원**: goBack → render → restoreSelection, aria-pressed 복원. 자동진행 미발동(표시만) 정상.
- **자동진행 타이밍**: reduced-motion 시 delay 0, 아니면 220ms. matchMedia 가드 존재.
- **키보드/aria**: 네이티브 `<button>` 사용(키보드 OK), progressbar role + aria-valuetext, choice aria-pressed 토글. (항목 1·3·6 참조)

### 3. result.js — 양호
- **_match 활용**: buildReason이 `_match` 있으면 실제 일치 차원만 사용(hasMeta 분기), relaxed로 정직 안내. render의 relaxed 판정도 `_match.relaxed`로 중복 점수계산 제거.
- **esc() XSS 가드**: name/id/reason/img/coupang 모두 esc 적용. 5개 메타문자 치환 정상.
- **거짓 이유 방지**: petSafe→interest→purpose→relaxed안내→환경 순 우선순위. 일치 안 하면 폴백("키우기 쉬운 친구"). 거짓 사유 생성 경로 없음.
- **null 가드**: `plant._match || {}`, `m.relaxed || []`, hasCoreAnswers, 컨테이너 null 가드 존재. (항목 7 참조)

### 4. CSS 진행바 — 양호
- 320/360px 넘침 없음(계산상 134~160px < 320, + overflow-x:hidden). 색 외 3중 중복 구분 충족. 죽은 구 규칙 제거됨. 토큰 사용 양호(일부 px 하드코딩 미세). (항목 8 참조)

### 5. Hard Rules / 디자인 — 양호
- **18px+**: progress__cheer=`--fs-body`(18px), count=`--fs-h3`(20px). 본문 기본 18px(tokens).
- **유리효과**: `.site-header`·`.bottomnav` **2곳만** backdrop-filter, 둘 다 `@supports not` 불투명 폴백. 카드/사진에는 미적용.
- **사진 위 글씨 없음**: plant-card__photo는 별도 img, 텍스트는 흰 body 영역(plant-card__body)에 분리. 진행바도 사진 무관.
- **56/96px**: 진행바 자체 규칙엔 직접 등장 안 함(버튼 터치영역은 본 리뷰 범위 외 choice-card/btn 규칙에서 관리).

---

## 결론

**치명 0건 — 확인.** 출시 차단 결함 없음. 매칭 알고리즘은 정확·결정론·비오염·최소3 보장 모두 충족(213종 데이터 + 72조합 시뮬 검증). 중요 2건(quiz 포커스 이동 UX, result.js level 잔재)과 경미 7건은 후속 개선 권고이며 현재 동작에 영향 없음.
