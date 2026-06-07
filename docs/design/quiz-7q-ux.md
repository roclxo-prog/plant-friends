# 식물 추천 퀴즈 — 7문항 필수 UX 설계서

> 대상: 50~60대 시니어. 목표: **7개 질문 전부 필수**이면서도 **중도 이탈 0**.
> 기존 흐름(필수 3 + 분기 + 선택 4)을 **7문항 일직선 흐름**으로 바꾼다. 분기 화면은 제거한다.
> 모든 수치·색은 `docs/senior-ux-guide.md`와 `styles/tokens.css`를 따른다(임의 변경 금지).
> 기준 폭은 **320px**(가장 좁은 시니어 단말)까지 가로 넘침 없이 성립해야 한다.

관련 파일: `quiz.html`, `scripts/quiz.js`, `styles/styles.css`, `styles/tokens.css`

---

## 0. 핵심 결정 요약 (먼저 읽기)

| 항목 | 결정 | 이유 |
| --- | --- | --- |
| 흐름 | Q1→Q7 일직선, 분기·"건너뛰기" 보기 제거 | 7개 모두 필수. 선택지·갈림길이 없어야 인지 부하가 낮다. |
| 진행 표시 | **"3 / 7" 텍스트 + 막대 + 점 7개** 하이브리드 | 320px에서 동그라미 7개는 빠듯 → 막대가 주역, 점은 보조. |
| 이동 방식 | **선택 즉시 자동 진행**(권고) + '← 이전' 상시 | 시니어는 "선택 후 다음 버튼 또 누르기"를 빠뜨리거나 헷갈림. 탭 1번으로 다음. |
| '다음' 버튼 | 두지 않음(자동 진행이 대체). 단 마지막 Q7만 "결과 보기" 명시 | 매 화면 버튼 1개 원칙 + 마지막엔 "끝났다" 신호 필요. |
| 격려 문구 | 진행률에 따라 단계별 마이크로카피 | "거의 다 왔어요"로 막판 이탈 방지. |

---

## 1. 진행 표시 (320px에서도 안 깨지게)

### 1-1. 구조: 3단 하이브리드
한 줄에 **숫자(3 / 7) + 진행 막대 + 점 7개**를 함께 둔다. 셋 다 같은 정보를 다른 방식으로 전달하므로(숫자·길이·개수), 색에만 의존하지 않고 어느 하나가 안 보여도 위치를 알 수 있다.

```
  거의 절반!            3 / 7      ← 텍스트(굵게)
  ▓▓▓▓▓▓▓▓░░░░░░░░░░░          ← 막대(채움 비율)
  ● ● ● ○ ○ ○ ○                ← 점 7개(현재=테두리 강조)
```

- **숫자 "3 / 7"**: 가장 명확. "지금 몇 번째 / 전체 몇 개"를 글자로. 18px 이상.
- **막대**: `width: (current/7)*100%`. "얼마나 남았는지"를 길이로 직감.
- **점 7개**: 보조. 지난 점=초록 채움+✓느낌, 현재=초록 테두리 굵게, 다음=회색. **320px에서 점은 작아도 됨**(텍스트·막대가 주 정보원이므로). 점 자체에 글자를 넣지 않으므로 지름을 14~20px까지 줄여도 정보 손실 없음.

> 기존 `.progress__num`(지름 44px 동그라미 7개 + 단어 라벨)은 320px에서 한 줄에 욱여넣어야 해 글자가 빠듯하다. **7문항에서는 큰 동그라미+단어 라벨을 버리고**, 위 3단 하이브리드로 교체한다. 단어 라벨(빛·물…)은 진행바가 아니라 **질문 제목**이 이미 말해주므로 중복이다.

### 1-2. 구체 CSS 권고

```css
/* 진행 컨테이너 — 가로 넘침 차단(기존 .progress 유지) */
.progress { width: 100%; overflow-x: hidden; padding: var(--space-2) 0; }

/* (A) 텍스트형 "3 / 7" + 격려문 한 줄 */
.progress__head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: var(--space-2); margin-bottom: 8px;
}
.progress__cheer {                 /* 왼쪽: 격려 문구 */
  font-size: var(--font-base);     /* 18px 하한 */
  font-weight: 700;
  color: var(--color-primary-dark);
}
.progress__count {                 /* 오른쪽: "3 / 7" */
  font-size: var(--font-h3);       /* 20px */
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;             /* "3 / 7" 줄바꿈 금지 */
}
.progress__count b { color: var(--color-primary); }  /* 현재 숫자만 강조 */

/* (B) 막대 — 채움 비율로 '얼마나 남았는지' */
.progress__bar {
  height: 14px;                    /* 시니어가 보이게 두툼 */
  background: var(--green-100);    /* 빈 부분: 연초록(대비 확보) */
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.progress__fill {
  height: 100%;
  background: var(--color-primary);/* 채움: 초록 */
  border-radius: var(--radius-pill);
  transition: width 200ms ease;    /* 200ms 이내, reduce 시 자동 제거 */
  /* width 는 JS 에서 (current/7*100)% 로 인라인 지정 */
}

/* (C) 점 7개 — 보조 표시(색만 의존 금지: 채움/테두리/모양 차이 병기) */
.progress__dots {
  display: flex; justify-content: center; gap: 8px;
  margin-top: 8px; list-style: none; padding: 0;
}
.progress__dot {
  width: 16px; height: 16px; border-radius: var(--radius-pill);
  background: var(--card); border: 2px solid var(--line);  /* 다음: 회색 테두리 */
}
.progress__dot.is-done {           /* 지난: 초록 채움 */
  background: var(--color-primary); border-color: var(--color-primary);
}
.progress__dot.is-current {        /* 현재: 초록 테두리 굵게 + 약간 큼 */
  width: 20px; height: 20px;
  background: var(--card); border: 3px solid var(--color-primary);
}

/* 320px 보호: 점만 더 촘촘히(텍스트·막대는 그대로 큼) */
@media (max-width: 360px) {
  .progress__dots { gap: 6px; }
  .progress__dot { width: 14px; height: 14px; }
  .progress__dot.is-current { width: 18px; height: 18px; }
}
```

검증: 320px에서 점 7개 = `7×14 + 6×6(gap) = 134px` → 컨테이너(약 296px 내용폭) 안에 여유. 막대·"3 / 7" 텍스트는 폭에 무관(막대는 100% 폭, 텍스트는 5글자). **가로 스크롤 발생 불가.**

---

## 2. 격려·짧은 문장 (마이크로카피)

### 2-1. 질문 제목 — 각 15자 이내(시니어 가이드 §2)
아래 §4의 7세트 질문문은 전부 15자 이내로 작성했다(가장 긴 것 "물은 자주 주실 수 있나요?" 13자).

### 2-2. 단계별 격려 문구 (`progress__cheer` + `aria-live` 힌트)
진행률에 따라 바뀌어 "조금만 더 하면 된다"는 느낌을 준다.

| 단계 | 격려 문구(굵게, 진행바 위) | 보조 힌트(aria-live, 회색) |
| --- | --- | --- |
| 1 / 7 | 시작이 반이에요 | 천천히 고르셔도 돼요 |
| 2 / 7 | 잘 하고 계세요 | 마음에 드는 걸 눌러 보세요 |
| 3 / 7 | 좋아요, 순조로워요 | 정답은 없어요 |
| 4 / 7 | **절반 넘었어요!** | 벌써 절반을 지났어요 |
| 5 / 7 | **거의 다 왔어요** | 세 개만 더예요 |
| 6 / 7 | **곧 끝나요!** | 두 개만 더예요 |
| 7 / 7 | **마지막 질문이에요** | 이거 고르면 결과를 보여 드려요 |

마이크로카피 원칙(부담 줄이기):
- 명령형 금지, 권유형 존댓말("눌러 보세요").
- "정답은 없어요" / "마음에 드는 걸로" → 틀릴까 봐 멈추는 불안 제거.
- 숫자 격려는 4번부터 등장시켜 "끝이 보인다"를 강조.

---

## 3. 이동 (이전 / 자동 진행 / 처음부터)

### 3-1. 선택 즉시 자동 진행 — **권고안**
시니어에게는 "보기 선택 → 다음 버튼 또 누르기"의 2탭 구조가 가장 흔한 이탈·혼란 지점이다(선택만 하고 멈춤). 따라서:

- 보기 카드를 누르면 → `aria-pressed=true` + ✓ 표시 → **약 220ms 뒤 자동으로 다음 질문**(기존 quiz.js의 `setTimeout(advance, 220)` 패턴 유지).
- 220ms 지연은 "내가 뭘 골랐는지" 확인하는 시각 피드백 시간. `prefers-reduced-motion`이면 0ms 즉시 이동(기존 로직 유지).
- 자동 진행이므로 **별도 '다음' 버튼은 두지 않는다**(화면당 주요 버튼 1개 원칙과도 합치).

> 대안(비권고): '다음' 비활성→선택 시 활성. 정확하지만 시니어에겐 탭 수가 늘고 "왜 다음이 회색이지?" 혼란을 부른다. **자동 진행을 채택**한다.

### 3-2. '← 이전' — 상시(답 수정용)
- 하단 고정 네비에 항상 노출(기존 `#nav-back`).
- **Q1에서만 비활성**(돌아갈 곳 없음, `disabled`). Q2~Q7은 활성.
- 이전으로 가면 그 질문의 **기존 선택이 복원**되어 보이고(✓ 유지), 자동 진행은 일어나지 않는다(되돌아온 화면에서 의도치 않게 또 넘어가면 안 됨 → 복원은 표시만, 재선택해야 진행).

### 3-3. '처음부터 다시' — 상시
- 하단 네비 우측에 항상 노출(기존 `#nav-restart`). 누르면 Q1로, 답 전부 초기화.
- 막다른 느낌 방지: 7문항 어디서든 빠져나갈 안전장치.

### 3-4. 마지막(7/7) 처리
- Q7도 동일하게 **선택 즉시 결과로 이동**(자동). 단 7/7 화면 힌트에 "이거 고르면 결과를 보여 드려요"를 명시해 끝을 예고 → 갑작스러운 화면 전환의 당황 제거(가이드 §3-3 예측 가능성).

---

## 4. 질문·보기 문구 7세트 (이모지 + 큰 글씨 라벨)

> 모든 라벨은 한글, 18~20px, 이모지는 장식(`aria-hidden`)이며 의미는 글자가 전달.
> 7문항 전부 필수 → **"잘 모르겠어요/건너뛰기" 보기는 넣지 않는다.** 대신 각 보기를 시니어가 망설임 없이 고를 수 있게 일상어로.

### ① 빛 (light)
- 제목: **"햇빛이 잘 드는 곳인가요?"** (12자)
- ☀️ 햇빛이 잘 들어요 (`high`)
- ⛅ 조금 들어요 (`mid`)
- 🌙 빛이 약해요 (`low`)

### ② 물 (water)
- 제목: **"물은 자주 주실 수 있나요?"** (13자)
- 💧 자주 줄 수 있어요 (`high`)
- 🌿 가끔 줄 수 있어요 (`mid`)
- 🍃 자주 깜빡해요 (`low`)

### ③ 목적 (purpose)
- 제목: **"어떤 식물을 찾으세요?"** (11자)
- 🌬️ 공기를 맑게 (`air`)   ← 공기정화
- 🌸 꽃·예쁜 모양 (`deco`)
- 🥬 길러서 먹기 (`harvest`)
- 🎁 선물·상징(행운·재물) (`gift`)   ← 금전수·행운목 등(크기 인상 주지 않게 "작고 귀여운" 폐기)

### ④ 장소 (place)
- 제목: **"어디에 두실 건가요?"** (10자)
- 🛋️ 거실 (`living`)
- 🪟 베란다·창가 (`window`)
- 🚿 욕실 (`bathroom`)
- 🖥️ 책상 (`desk`)

### ⑤ 반려동물 (pet)
- 제목: **"반려동물을 키우세요?"** (11자)
- 🐶 있어요 (`yes`)
- 🙆 없어요 (`no`)

### ⑥ 크기 (size)
- 제목: **"어느 크기가 좋으세요?"** (11자)
- 🌱 작은 탁상용 (`small`)
- 🪴 중간 크기 (`medium`)
- 🌳 큰 거실용 (`large`)

### ⑦ 보는 재미 (interest)
- 제목: **"무엇을 보는 게 좋아요?"** (12자)
- 🌸 꽃 (`flower`)
- 🍃 잎·무늬 (`foliage`)
- 🍅 열매·단풍 (`fruit`)

> ⑤ 반려동물은 보기가 2개뿐 → 카드가 커 보이고 누르기 쉬움(가독 이점). 그대로 둔다.
> 기존 코드의 `OPTIONAL` 배열에서 각 질문의 `value:""` "잘 모르겠어요" 보기를 제거하고, 7개를 하나의 필수 배열로 합치면 된다.

---

## 5. 이탈 방지 (7개가 길게 안 느껴지게)

1. **한 화면 1질문** — 선택지·버튼이 적어 "이거 하나만 고르면 되네" 느낌(가이드 §1-4).
2. **빠른 진행감** — 선택 즉시 다음(§3-1) → 탭→화면전환 리듬이 경쾌. 막대가 차오르는 시각 피드백이 보상.
3. **끝이 보이는 격려** — 4/7부터 "절반 넘었어요 → 거의 다 → 곧 끝 → 마지막"(§2-2). 남은 개수를 숫자로("두 개만 더예요").
4. **큰 버튼 96px 유지** — `.choice-card { min-height: var(--choice-min-h) }`(96px) 그대로. 오터치 감소가 곧 이탈 감소.
5. **틀릴 걱정 제거** — "정답은 없어요", 언제든 '← 이전'으로 수정 가능 → 신중함 때문에 멈추지 않게.
6. **막다른 화면 없음** — 모든 화면에 이전·처음부터, 마지막엔 결과 예고. 갇힌 느낌 0.

---

## 6. 접근성 (KWCAG 2.2)

### 6-1. 진행 상태 ARIA
진행 영역에 ARIA progressbar 의미를 부여하고, 변화는 `aria-live`로 읽어준다.

```html
<nav class="progress" id="quiz-progress" aria-label="진행 단계">
  <div class="progress__head">
    <span class="progress__cheer">거의 다 왔어요</span>
    <span class="progress__count"><b>5</b> / 7</span>
  </div>

  <!-- 막대: progressbar 역할 + 현재값 -->
  <div class="progress__bar"
       role="progressbar"
       aria-valuemin="1" aria-valuemax="7" aria-valuenow="5"
       aria-valuetext="7개 중 5번째 질문">
    <div class="progress__fill" style="width:71.4%"></div>
  </div>

  <!-- 점: 보조 표시이므로 스크린리더에선 숨김(중복 방지) -->
  <ul class="progress__dots" aria-hidden="true">
    <li class="progress__dot is-done"></li>
    ... (7개)
  </ul>
</nav>

<!-- 진행/격려 안내는 live 영역으로 별도 통지 -->
<p class="lead" id="quiz-hint" aria-live="polite">세 개만 더예요.</p>
```

- `aria-valuetext`로 "7개 중 5번째 질문"을 자연어로 읽어줌(숫자만보다 친절).
- 질문이 바뀔 때마다 `aria-valuenow`·`aria-valuetext`·힌트 텍스트 갱신 → 스크린리더가 "지금 어디/완료"를 인지.
- 점(`.progress__dots`)은 `aria-hidden="true"`(막대 progressbar와 정보 중복).

### 6-2. 질문·보기 ARIA (기존 패턴 유지)
- 질문마다 `<h1 id="quiz-question">`에 포커스 이동(`tabindex=-1`) → 새 화면 시작점 명확.
- 보기 그룹 `role="group" aria-labelledby="quiz-question"`.
- 보기 카드 `<button aria-pressed="false">`, 선택 시 `true` + ✓ 가시화(색 외 정보 병기).

### 6-3. 키보드
- 모든 보기·이전·처음부터는 `<button>` → `Tab` 이동, `Enter`/`Space` 실행(기존 구조 충족).
- 자동 진행은 키보드 선택(Enter)에도 동일 적용 → 마우스 없이 7문항 완주 가능.
- `:focus-visible` 3px 초록 아웃라인(기존 전역 규칙).

### 6-4. 색만 의존 금지
- 진행: 숫자("5 / 7") + 막대 길이 + 점 채움/테두리/크기 차이 → 색맹·저시력도 위치 인지.
- 선택: 초록 테두리 + 연초록 배경 + **✓ 아이콘** 병기(기존 `.choice-card[aria-pressed=true]`).

### 6-5. 모션
- 막대 채움 전환 200ms, `prefers-reduced-motion: reduce`에서 전역 규칙으로 transition 제거 → 급격한 점프·자동 진행 지연 0ms.

---

## 7. 구현 변경 요약 (scripts/quiz.js · styles)

| 위치 | 변경 |
| --- | --- |
| `quiz.js` 데이터 | `REQUIRED`·`OPTIONAL` 분리·분기 제거 → 7개 단일 배열 `QUESTIONS`. 각 질문에서 `value:""` "잘 모르겠어요" 보기 삭제. §4 문구로 교체. |
| `quiz.js` state | `mode` 제거, `index: 0~6` 단일. `branch` 화면·`renderBranch` 삭제. |
| `quiz.js` 진행 | `renderProgress`를 §1-2 하이브리드(head 숫자+격려 / 막대 width / 점 7개)로 교체. |
| `quiz.js` 힌트 | `hintText`를 §2-2 단계별 격려·보조 힌트로 교체. |
| `quiz.js` 이동 | `advance`: 6→결과(`finish`). `goBack`: index>0일 때만, Q1 disabled. 자동 진행 220ms 유지. |
| `styles.css` | 기존 `.progress__list/__step/__num`(44px 동그라미+단어) → §1-2의 `.progress__head/__bar/__fill/__dots/__dot`로 교체. 320/360px 미디어쿼리도 점 기준으로 갱신. |
| `result.html` 연동 | `finish()`의 7개 파라미터(`light…interest`)는 그대로 — 이제 모두 채워짐. `place/pet/size/interest`가 항상 값 있음. |
