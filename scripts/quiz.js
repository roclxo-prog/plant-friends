/* =====================================================================
   scripts/quiz.js — 질문 흐름 (한 화면 1질문)
   Q1 빛 → Q2 물 → Q3 목적 → Q4 경험(선택)
   진행바 ①②③ 갱신, '← 이전' / '다시하기', 답 완료 시 result.html 이동.
   답은 URL 쿼리스트링으로만 전달(저장 없음).
   ===================================================================== */
(function () {
  "use strict";

  // 질문 정의(카피덱 라벨 그대로)
  var QUESTIONS = [
    {
      key: "light",
      question: "식물 둘 곳에 햇빛이 잘 드나요?",
      options: [
        { value: "high", emoji: "☀️", label: "햇빛이 잘 들어요" },
        { value: "mid",  emoji: "⛅", label: "조금 들어요" },
        { value: "low",  emoji: "🌙", label: "빛이 약해요" }
      ]
    },
    {
      key: "water",
      question: "물은 자주 챙겨 주실 수 있나요?",
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
        { value: "air",     emoji: "🌳", label: "공기 맑게 하는 식물" },
        { value: "deco",    emoji: "🌸", label: "꽃이 예쁜 식물" },
        { value: "gift",    emoji: "🪴", label: "작고 귀여운 식물" },
        { value: "harvest", emoji: "🥬", label: "먹을 수 있는 식물" }
      ]
    },
    {
      key: "level",
      optional: true,
      question: "식물을 키워 보신 적 있나요?",
      options: [
        { value: "beginner",     emoji: "🐣", label: "처음이에요" },
        { value: "experienced",  emoji: "🌱", label: "조금 키워 봤어요" },
        { value: "experienced",  emoji: "🌳", label: "잘 키워요" }
      ]
    }
  ];

  // 진행바에 표시할 3단계(Q4는 선택이라 진행바는 3칸 유지)
  var STEP_LABELS = ["빛", "물", "목적"];

  var ORDINAL = ["1번째", "2번째", "3번째", "4번째"];

  var state = { index: 0, answers: {} };

  var elQuestion, elProgress, elHint, elBack;

  function ordinalText(i) {
    if (i < 3) return "3개 중 " + ORDINAL[i];
    return "마지막 질문이에요 (선택)";
  }

  function renderProgress(i) {
    var html = '<ol class="progress__list">';
    for (var s = 0; s < STEP_LABELS.length; s++) {
      var cls = "progress__step";
      var current = (i >= 3) ? -1 : i; // Q4에서는 모두 완료로 표시
      if (s < i) cls += " is-done";
      if (s === current) cls += " is-current";
      var num = ["①", "②", "③"][s];
      html += '<li class="' + cls + '"' + (s === current ? ' aria-current="step"' : '') + '>';
      html += '<span class="progress__num" aria-hidden="true">' + num + '</span>';
      html += '<span class="progress__text">' + STEP_LABELS[s] + '</span>';
      if (s < i) html += '<span class="sr-only">(완료)</span>';
      else if (s === current) html += '<span class="sr-only">(지금 여기)</span>';
      html += '</li>';
    }
    html += '</ol>';
    elProgress.innerHTML = html;
  }

  function renderQuestion() {
    var q = QUESTIONS[state.index];
    renderProgress(state.index);

    if (elHint) elHint.textContent = ordinalText(state.index) + " · 천천히 고르셔도 돼요.";

    var html = '';
    html += '<h1 id="quiz-question">' + q.question + (q.optional ? ' <span class="lead">(선택)</span>' : '') + '</h1>';
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

    // Q4(선택)에는 "건너뛰고 결과 보기" 보조 동작 제공
    if (q.optional) {
      html += '<div style="margin-top:var(--space-3)">';
      html += '<button class="bottomnav__btn bottomnav__btn--back" type="button" id="quiz-skip" style="width:100%;min-height:var(--tap-min)">건너뛰고 결과 보기</button>';
      html += '</div>';
    }

    elQuestion.innerHTML = html;

    // 선택 핸들러
    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var c = 0; c < cards.length; c++) {
      cards[c].addEventListener("click", onSelect);
    }
    var skip = document.getElementById("quiz-skip");
    if (skip) skip.addEventListener("click", function () { finish(); });

    // 이전 버튼 상태(첫 질문에서는 disabled)
    if (elBack) elBack.disabled = (state.index === 0);

    // 새 질문으로 포커스 이동(스크린리더 안내)
    var heading = document.getElementById("quiz-question");
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus(); }
    window.scrollTo(0, 0);
  }

  function onSelect(e) {
    var btn = e.currentTarget;
    var q = QUESTIONS[state.index];

    // 시각적 선택 표시(3중) — 잠깐 보여주고 다음으로
    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var i = 0; i < cards.length; i++) cards[i].setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-pressed", "true");

    state.answers[q.key] = btn.getAttribute("data-value");

    // 모션 최소화 사용자는 전환 지연 없이 즉시 이동(점프감 제거)
    var reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = reduceMotion ? 0 : 220;

    // 명시적 동작(클릭)으로만 전환 — 자동 점프지만 사용자 동작 직후라 허용
    setTimeout(function () {
      if (state.index < QUESTIONS.length - 1) {
        state.index++;
        renderQuestion();
      } else {
        finish();
      }
    }, delay);
  }

  function goBack() {
    if (state.index > 0) {
      state.index--;
      // 되돌아온 질문의 기존 답을 화면에 반영
      renderQuestion();
      restoreSelection();
    }
  }

  function restoreSelection() {
    var q = QUESTIONS[state.index];
    var saved = state.answers[q.key];
    if (!saved) return;
    var cards = elQuestion.querySelectorAll(".choice-card");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-value") === saved) {
        cards[i].setAttribute("aria-pressed", "true");
      }
    }
  }

  function restart() {
    state = { index: 0, answers: {} };
    renderQuestion();
  }

  function finish() {
    var a = state.answers;
    var params = [];
    if (a.light)   params.push("light=" + encodeURIComponent(a.light));
    if (a.water)   params.push("water=" + encodeURIComponent(a.water));
    if (a.purpose) params.push("purpose=" + encodeURIComponent(a.purpose));
    if (a.level)   params.push("level=" + encodeURIComponent(a.level));
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

    renderQuestion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
