/* =====================================================================
   scripts/quiz.js — 질문 흐름 v3 (7문항 전부 필수, 한 화면 1질문)
   Q1 빛 → Q2 물 → Q3 목적 → Q4 장소 → Q5 반려동물 → Q6 크기 → Q7 보는재미
   - 분기 화면·'이대로 추천받기'·'건너뛰기/잘 모르겠어요' 전부 제거.
   - 진행: "n/7" 텍스트 + 채움 막대(progressbar) + 점 7개(보조).
   - 선택 즉시 자동 진행(✓ 후 220ms, reduced-motion 0ms). '다음' 버튼 없음.
   - '← 이전' 상시(Q1 비활성, 복귀 시 선택 복원). '처음부터 다시' 상시.
   - 7개 다 답해야 result.html?light=&water=&purpose=&place=&pet=&size=&interest= 로 이동.
   답은 URL 쿼리스트링으로만 전달(저장 없음). 설계 출처: docs/design/quiz-7q-ux.md
   ===================================================================== */
(function () {
  "use strict";

  // 7문항 단일 배열 — quiz-7q-ux.md §4 문구(이모지 장식 + 15자 이내 라벨)
  var QUESTIONS = [
    {
      key: "light",
      question: "햇빛이 잘 드는 곳인가요?",
      options: [
        { value: "high", emoji: "☀️", label: "햇빛이 잘 들어요" },
        { value: "mid",  emoji: "⛅", label: "조금 들어요" },
        { value: "low",  emoji: "🌙", label: "빛이 약해요" }
      ]
    },
    {
      key: "water",
      question: "물은 자주 주실 수 있나요?",
      options: [
        { value: "high", emoji: "💧", label: "자주 줄 수 있어요" },
        { value: "mid",  emoji: "🌿", label: "가끔 줄 수 있어요" },
        { value: "low",  emoji: "🍃", label: "자주 깜빡해요" }
      ]
    },
    {
      key: "purpose",
      question: "어떤 식물을 찾으세요?",
      options: [
        { value: "air",     emoji: "🌬️", label: "공기를 맑게" },
        { value: "deco",    emoji: "🌸", label: "꽃·예쁜 모양" },
        { value: "harvest", emoji: "🥬", label: "길러서 먹기" },
        { value: "gift",    emoji: "🎁", label: "선물·상징(행운·재물)" }
      ]
    },
    {
      key: "place",
      question: "어디에 두실 건가요?",
      options: [
        { value: "living",   emoji: "🛋️", label: "거실" },
        { value: "window",   emoji: "🪟", label: "베란다·창가" },
        { value: "bathroom", emoji: "🚿", label: "욕실" },
        { value: "desk",     emoji: "🖥️", label: "책상" }
      ]
    },
    {
      key: "pet",
      question: "반려동물을 키우세요?",
      options: [
        { value: "yes", emoji: "🐶", label: "있어요" },
        { value: "no",  emoji: "🙆", label: "없어요" }
      ]
    },
    {
      key: "size",
      question: "어느 크기가 좋으세요?",
      options: [
        { value: "small",  emoji: "🌱", label: "작은 탁상용" },
        { value: "medium", emoji: "🪴", label: "중간 크기" },
        { value: "large",  emoji: "🌳", label: "큰 거실용" }
      ]
    },
    {
      key: "interest",
      question: "무엇을 보는 게 좋아요?",
      options: [
        { value: "flower",  emoji: "🌸", label: "꽃" },
        { value: "foliage", emoji: "🍃", label: "잎·무늬" },
        { value: "fruit",   emoji: "🍅", label: "열매·단풍" }
      ]
    }
  ];

  var TOTAL = QUESTIONS.length; // 7

  // 단계별 격려(굵게) + 보조 힌트(aria-live) — quiz-7q-ux.md §2-2
  var CHEER = [
    { cheer: "시작이 반이에요",    hint: "천천히 고르셔도 돼요" },
    { cheer: "잘 하고 계세요",     hint: "마음에 드는 걸 눌러 보세요" },
    { cheer: "좋아요, 순조로워요", hint: "정답은 없어요" },
    { cheer: "절반 넘었어요!",     hint: "벌써 절반을 지났어요" },
    { cheer: "거의 다 왔어요",     hint: "세 개만 더예요" },
    { cheer: "곧 끝나요!",         hint: "두 개만 더예요" },
    { cheer: "마지막 질문이에요",  hint: "이거 고르면 결과를 보여 드려요" }
  ];

  var state = { index: 0, answers: {} };

  var elQuestion, elProgress, elHint, elBack;

  /* --- 진행 표시: 숫자 n/7 + 채움 막대 + 점 7개 -------------------- */
  function renderProgress() {
    var cur = state.index;            // 0-based
    var n = cur + 1;                  // 1-based
    var pct = (n / TOTAL) * 100;
    var c = CHEER[cur] || CHEER[CHEER.length - 1];

    var html = '';
    html += '<div class="progress__head">';
    html += '<span class="progress__cheer">' + c.cheer + '</span>';
    html += '<span class="progress__count"><b>' + n + '</b> / ' + TOTAL + '</span>';
    html += '</div>';

    html += '<div class="progress__bar" role="progressbar"'
      + ' aria-valuemin="1" aria-valuemax="' + TOTAL + '" aria-valuenow="' + n + '"'
      + ' aria-valuetext="' + TOTAL + '개 중 ' + n + '번째 질문">';
    html += '<div class="progress__fill" style="width:' + pct.toFixed(1) + '%"></div>';
    html += '</div>';

    html += '<ul class="progress__dots" aria-hidden="true">';
    for (var i = 0; i < TOTAL; i++) {
      var cls = "progress__dot";
      if (i < cur) cls += " is-done";
      else if (i === cur) cls += " is-current";
      html += '<li class="' + cls + '"></li>';
    }
    html += '</ul>';

    elProgress.innerHTML = html;
  }

  function currentQuestion() {
    return QUESTIONS[state.index];
  }

  /* --- 화면 렌더 -------------------------------------------------- */
  function render() {
    renderProgress();
    var c = CHEER[state.index] || CHEER[CHEER.length - 1];
    if (elHint) elHint.textContent = c.hint;

    renderQuestion();

    if (elBack) elBack.disabled = (state.index === 0);

    var heading = document.getElementById("quiz-question");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    window.scrollTo(0, 0);
  }

  function renderQuestion() {
    var q = currentQuestion();

    var html = '';
    html += '<h1 id="quiz-question">' + q.question + '</h1>';
    html += '<div class="choice-group" role="group" aria-labelledby="quiz-question">';
    for (var i = 0; i < q.options.length; i++) {
      var o = q.options[i];
      html += '<button class="choice-card" type="button" aria-pressed="false"'
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

    // 복귀 시 선택 복원(표시만, 자동 진행은 일어나지 않음)
    restoreSelection();
  }

  /* --- 선택 처리(즉시 자동 진행) ---------------------------------- */
  function onSelect(e) {
    var btn = e.currentTarget;
    var q = currentQuestion();
    var value = btn.getAttribute("data-value");

    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var i = 0; i < cards.length; i++) cards[i].setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-pressed", "true");

    state.answers[q.key] = value;

    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = reduceMotion ? 0 : 220;

    setTimeout(advance, delay);
  }

  function advance() {
    if (state.index < TOTAL - 1) {
      state.index++;
      render();
    } else {
      finish();
    }
  }

  /* --- 이전 / 처음부터 -------------------------------------------- */
  function goBack() {
    if (state.index > 0) {
      state.index--;
      render(); // render()가 restoreSelection()까지 호출
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
    state = { index: 0, answers: {} };
    render();
  }

  /* --- 완료 → 결과 이동(7개 모두 채워짐) -------------------------- */
  function finish() {
    var a = state.answers;
    var keys = ["light", "water", "purpose", "place", "pet", "size", "interest"];
    var params = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      params.push(k + "=" + encodeURIComponent(a[k]));
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
