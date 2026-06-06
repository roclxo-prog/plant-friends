/* =====================================================================
   scripts/quiz.js — 질문 흐름 v2 (한 화면 1질문)
   필수 Q1 빛 → Q2 물 → Q3 목적
     → 분기 화면("이대로 추천받기" / "더 정확히 추천받기")
   선택 Q4 장소 → Q5 반려동물 → Q6 크기 → Q7 보는 재미(각각 건너뛰기 가능)
   진행바: 필수 3칸 → 정밀화 선택 시 7칸 확장. '← 이전' / '다시하기'.
   답은 URL 쿼리스트링으로만 전달(저장 없음). 선택 미응답/건너뛰기는 파라미터 생략.
   접근성: 새 질문마다 heading 포커스 이동·aria, reduced-motion 처리 유지.
   ===================================================================== */
(function () {
  "use strict";

  // 필수 질문(3) — 카피덱 라벨 그대로
  var REQUIRED = [
    {
      key: "light", step: "빛",
      question: "식물 둘 곳에 햇빛이 잘 드나요?",
      options: [
        { value: "high", emoji: "☀️", label: "햇빛이 잘 들어요" },
        { value: "mid",  emoji: "⛅", label: "조금 들어요" },
        { value: "low",  emoji: "🌙", label: "빛이 약해요" }
      ]
    },
    {
      key: "water", step: "물",
      question: "물은 자주 챙겨 주실 수 있나요?",
      options: [
        { value: "high", emoji: "💧", label: "자주 줄 수 있어요" },
        { value: "mid",  emoji: "🌿", label: "가끔 줄 수 있어요" },
        { value: "low",  emoji: "🍃", label: "자주 깜빡해요" }
      ]
    },
    {
      key: "purpose", step: "목적",
      question: "어떤 식물을 찾으세요?",
      options: [
        { value: "air",     emoji: "🌳", label: "공기 맑게 하는 식물" },
        { value: "deco",    emoji: "🌸", label: "꽃이 예쁜 식물" },
        { value: "gift",    emoji: "🪴", label: "작고 귀여운 식물" },
        { value: "harvest", emoji: "🥬", label: "먹을 수 있는 식물" }
      ]
    }
  ];

  // 선택 질문(4) — 각각 "잘 모르겠어요/건너뛰기" 보기(값 비움 → 파라미터 생략)
  var OPTIONAL = [
    {
      key: "place", step: "장소",
      question: "어디에 두실 건가요?",
      options: [
        { value: "living",   emoji: "🛋️", label: "거실" },
        { value: "window",   emoji: "🪟", label: "베란다·창가" },
        { value: "bathroom", emoji: "🚿", label: "욕실·습한 곳" },
        { value: "desk",     emoji: "🖥️", label: "책상·사무실" },
        { value: "",         emoji: "🤷", label: "잘 모르겠어요" }
      ]
    },
    {
      key: "pet", step: "반려동물",
      question: "강아지나 고양이를 키우세요?",
      options: [
        { value: "yes", emoji: "🐶", label: "강아지·고양이 있어요" },
        { value: "no",  emoji: "🙆", label: "없어요" },
        { value: "",    emoji: "🤷", label: "잘 모르겠어요" }
      ]
    },
    {
      key: "size", step: "크기",
      question: "어느 정도 크기가 좋으세요?",
      options: [
        { value: "small",  emoji: "🌱", label: "작은 탁상용" },
        { value: "medium", emoji: "🪴", label: "중간 크기" },
        { value: "large",  emoji: "🌳", label: "큰 거실용" },
        { value: "",       emoji: "🤷", label: "잘 모르겠어요" }
      ]
    },
    {
      key: "interest", step: "보는 재미",
      question: "무엇을 보는 재미가 좋으세요?",
      options: [
        { value: "flower",  emoji: "🌸", label: "꽃" },
        { value: "foliage", emoji: "🍃", label: "잎·무늬" },
        { value: "fruit",   emoji: "🍅", label: "열매·단풍" },
        { value: "",        emoji: "🤷", label: "상관없어요" }
      ]
    }
  ];

  var NUM = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

  // state.mode: 'required'(Q1~3) | 'branch'(분기) | 'optional'(Q4~7)
  var state = { mode: "required", index: 0, answers: {} };

  var elQuestion, elProgress, elHint, elBack;

  /* --- 진행바 ----------------------------------------------------- */
  // 필수 단계에서는 3칸, 정밀화(분기 이후)부터 7칸으로 확장.
  function renderProgress() {
    var expanded = (state.mode !== "required");
    var steps = expanded
      ? REQUIRED.concat(OPTIONAL)
      : REQUIRED;

    // 현재 위치(전체 흐름에서의 0-based index)
    var current;
    if (state.mode === "required") current = state.index;
    else if (state.mode === "branch") current = -1; // 분기 화면: 필수 3개 완료
    else current = REQUIRED.length + state.index;

    var html = '<ol class="progress__list">';
    for (var s = 0; s < steps.length; s++) {
      var isDone = (s < current || (state.mode === "branch" && s < REQUIRED.length));
      var isCurrent = (s === current);
      var cls = "progress__step";
      if (isDone) cls += " is-done";
      if (isCurrent) cls += " is-current";
      html += '<li class="' + cls + '"' + (isCurrent ? ' aria-current="step"' : '') + '>';
      // 지난 단계는 색만이 아니라 '체크(✓)'로, 현재·다음은 숫자로 — 색 외 정보 병기
      html += '<span class="progress__num" aria-hidden="true">' + (isDone ? '✓' : NUM[s]) + '</span>';
      html += '<span class="progress__text">' + steps[s].step + '</span>';
      if (isDone) html += '<span class="sr-only">(완료)</span>';
      else if (isCurrent) html += '<span class="sr-only">(지금 여기)</span>';
      html += '</li>';
    }
    html += '</ol>';
    elProgress.innerHTML = html;
  }

  /* --- 진행 안내(시니어 친화: "지금 어디인지") -------------------- */
  function hintText() {
    if (state.mode === "required") {
      return "3개 중 " + (state.index + 1) + "번째예요 · 천천히 고르셔도 돼요.";
    }
    if (state.mode === "branch") {
      return "필수 질문 3개를 마쳤어요.";
    }
    // optional
    var total = REQUIRED.length + OPTIONAL.length;
    return (REQUIRED.length + state.index + 1) + " / " + total + " · 모르시면 건너뛰셔도 돼요.";
  }

  /* --- 현재 질문 객체 --------------------------------------------- */
  function currentQuestion() {
    if (state.mode === "required") return REQUIRED[state.index];
    if (state.mode === "optional") return OPTIONAL[state.index];
    return null;
  }

  /* --- 화면 렌더 -------------------------------------------------- */
  function render() {
    renderProgress();
    if (elHint) elHint.textContent = hintText();

    if (state.mode === "branch") {
      renderBranch();
    } else {
      renderQuestion();
    }

    if (elBack) elBack.disabled = (state.mode === "required" && state.index === 0);

    var heading = document.getElementById("quiz-question");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    window.scrollTo(0, 0);
  }

  function renderQuestion() {
    var q = currentQuestion();
    var optional = (state.mode === "optional");

    var html = '';
    html += '<h1 id="quiz-question">' + q.question + (optional ? ' <span class="lead">(선택)</span>' : '') + '</h1>';
    html += '<div class="choice-group" role="group" aria-labelledby="quiz-question">';
    for (var i = 0; i < q.options.length; i++) {
      var o = q.options[i];
      var isSkip = (o.value === "");
      var cls = "choice-card" + (isSkip ? " choice-card--skip" : "");
      html += '<button class="' + cls + '" type="button" aria-pressed="false"'
        + ' data-value="' + o.value + '" data-idx="' + i + '">';
      html += '<span class="choice-card__emoji" aria-hidden="true">' + o.emoji + '</span>';
      html += '<span class="choice-card__label">' + o.label + '</span>';
      html += '<span class="choice-card__check" aria-hidden="true">✓</span>';
      html += '</button>';
    }
    html += '</div>';

    elQuestion.innerHTML = html;

    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var c = 0; c < cards.length; c++) cards[c].addEventListener("click", onSelect);
  }

  function renderBranch() {
    var html = '';
    html += '<h1 id="quiz-question">필수 질문 3개를 마쳤어요!</h1>';
    html += '<p class="lead">이대로 추천받으셔도 되고, 몇 가지만 더 알려 주시면 더 잘 맞는 식물을 찾아 드려요.</p>';
    html += '<div class="choice-group" role="group" aria-labelledby="quiz-question">';
    html += '<button class="choice-card" type="button" id="branch-now">';
    html += '<span class="choice-card__emoji" aria-hidden="true">✅</span>';
    html += '<span class="choice-card__label">이대로 추천받기</span>';
    html += '<span class="choice-card__check" aria-hidden="true">✓</span>';
    html += '</button>';
    html += '<button class="choice-card" type="button" id="branch-more">';
    html += '<span class="choice-card__emoji" aria-hidden="true">🔎</span>';
    html += '<span class="choice-card__label">더 정확히 추천받기 (4문항)</span>';
    html += '<span class="choice-card__check" aria-hidden="true">✓</span>';
    html += '</button>';
    html += '</div>';

    elQuestion.innerHTML = html;

    document.getElementById("branch-now").addEventListener("click", function () { finish(); });
    document.getElementById("branch-more").addEventListener("click", function () {
      state.mode = "optional";
      state.index = 0;
      render();
    });
  }

  /* --- 선택 처리 -------------------------------------------------- */
  function onSelect(e) {
    var btn = e.currentTarget;
    var q = currentQuestion();
    var value = btn.getAttribute("data-value");

    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var i = 0; i < cards.length; i++) cards[i].setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-pressed", "true");

    // 건너뛰기(빈 값)는 해당 답을 지움(파라미터 생략)
    if (value === "") delete state.answers[q.key];
    else state.answers[q.key] = value;

    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = reduceMotion ? 0 : 220;

    setTimeout(advance, delay);
  }

  function advance() {
    if (state.mode === "required") {
      if (state.index < REQUIRED.length - 1) {
        state.index++;
        render();
      } else {
        // 필수 끝 → 분기 화면
        state.mode = "branch";
        render();
      }
    } else if (state.mode === "optional") {
      if (state.index < OPTIONAL.length - 1) {
        state.index++;
        render();
      } else {
        finish();
      }
    }
  }

  /* --- 이전 / 다시하기 -------------------------------------------- */
  function goBack() {
    if (state.mode === "required") {
      if (state.index > 0) { state.index--; render(); restoreSelection(); }
    } else if (state.mode === "branch") {
      state.mode = "required";
      state.index = REQUIRED.length - 1;
      render();
      restoreSelection();
    } else if (state.mode === "optional") {
      if (state.index > 0) { state.index--; render(); restoreSelection(); }
      else { state.mode = "branch"; render(); }
    }
  }

  function restoreSelection() {
    var q = currentQuestion();
    if (!q) return;
    var saved = state.answers[q.key];
    if (saved === undefined) return;
    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-value") === saved) {
        cards[i].setAttribute("aria-pressed", "true");
      }
    }
  }

  function restart() {
    state = { mode: "required", index: 0, answers: {} };
    render();
  }

  /* --- 완료 → 결과 이동 ------------------------------------------- */
  function finish() {
    var a = state.answers;
    var params = [];
    var keys = ["light", "water", "purpose", "place", "pet", "size", "interest", "level"];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (a[k] !== undefined && a[k] !== "") {
        params.push(k + "=" + encodeURIComponent(a[k]));
      }
    }
    window.location.assign("/result.html?" + params.join("&"));
  }

  function init() {
    elQuestion = document.getElementById("quiz-container");
    elProgress = document.getElementById("quiz-progress");
    elHint = document.getElementById("quiz-hint");
    elBack = document.getElementById("nav-back");
    var elRestart = document.getElementById("nav-restart");

    if (elBack) elBack.addEventListener("click", goBack);
    if (elRestart) elRestart.addEventListener("click", restart);

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
