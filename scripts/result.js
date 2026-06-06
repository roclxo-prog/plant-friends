/* =====================================================================
   scripts/result.js — 결과 화면
   URL 쿼리 파싱 → plants.json fetch → matchPlants → 식물 3종 카드 렌더.
   각 카드: 사진 + 이름 + "왜 맞는지" 한 줄 이유 + 버튼 3개 + 반려동물 배지.
   쿼리 없으면 안내 + 시작으로.
   ===================================================================== */
(function () {
  "use strict";

  var LIGHT = ["low", "mid", "high"];
  var WATER = ["low", "mid", "high"];
  var PURPOSE = ["air", "deco", "gift", "harvest"];
  var LEVEL = ["beginner", "experienced"];

  function parseAnswers() {
    var p = new URLSearchParams(window.location.search);
    var a = {};
    var light = p.get("light");
    var water = p.get("water");
    var purpose = p.get("purpose");
    var level = p.get("level");
    if (LIGHT.indexOf(light) !== -1) a.light = light;
    if (WATER.indexOf(water) !== -1) a.water = water;
    if (PURPOSE.indexOf(purpose) !== -1) a.purpose = purpose;
    if (LEVEL.indexOf(level) !== -1) a.level = level;
    return a;
  }

  function hasCoreAnswers(a) {
    // 빛·물·목적 중 하나라도 있으면 결과 진행(전부 없으면 안내)
    return !!(a.light || a.water || a.purpose);
  }

  // "왜 맞는지" 한 줄 이유 — 빛/물/목적 일치 근거로 동적 생성(카피덱 템플릿 기반)
  function buildReason(plant, a) {
    var lightMatch = a.light && plant.tags_light && plant.tags_light.indexOf(a.light) !== -1;
    var waterMatch = a.water && plant.tags_water && plant.tags_water.indexOf(a.water) !== -1;
    var purposeMatch = a.purpose && plant.tags_purpose && plant.tags_purpose.indexOf(a.purpose) !== -1;

    // 빛+물 조합 우선
    if (lightMatch && waterMatch) {
      if (a.light === "high" && a.water === "high") return "햇빛 좋고 물 좋아하는 친구예요.";
      if (a.light === "high" && a.water === "low")  return "햇빛 좋아하고 손이 덜 가요.";
      if (a.light === "low" && a.water === "mid")   return "그늘에서도 잘 자라요.";
      if (a.light === "low" && a.water === "low")   return "빛 적고 물 잊어도 괜찮아요.";
    }
    // 목적 일치
    if (purposeMatch) {
      if (a.purpose === "air")     return "공기를 맑게 해 줘요.";
      if (a.purpose === "deco")    return "예쁜 꽃을 볼 수 있어요.";
      if (a.purpose === "gift")    return "작고 키우기 쉬워요.";
      if (a.purpose === "harvest") return "길러서 드실 수 있어요.";
    }
    // 빛 또는 물 단독 일치
    if (lightMatch && a.light === "low") return "빛이 약해도 잘 자라요.";
    if (waterMatch && a.water === "low") return "물을 자주 안 줘도 돼요.";
    if (lightMatch) return "두실 곳 빛에 잘 맞아요.";
    if (waterMatch) return "물 주기가 잘 맞아요.";
    // 초보 + 쉬움
    if (a.level === "beginner" && plant.difficulty === "매우 쉬움") return "처음이라도 잘 키워요.";
    // 폴백: 식물 자체 장점
    return "누구나 키우기 쉬운 친구예요.";
  }

  function cardHTML(plant, a) {
    var reason = buildReason(plant, a);
    var coupang = window.App.coupangUrl(plant);
    var img = "/" + String(plant.image || "").replace(/^\/+/, "");

    var badges = "";
    if (plant.difficulty === "매우 쉬움") {
      badges += '<span class="badge">🌱 아주 쉬움</span>';
    }
    if (plant.toxic_to_pets === true) {
      badges += '<span class="badge badge--warn">🐾 반려동물 주의</span>';
    }

    var html = '';
    html += '<article class="plant-card">';
    html += '<img class="plant-card__photo" src="' + img + '" alt="' + plant.name + ' 사진"'
      + ' loading="lazy" decoding="async" width="480" height="320" data-fallback="1" />';
    html += '<div class="plant-card__body">';
    if (badges) html += '<div class="plant-card__badges">' + badges + '</div>';
    html += '<h2 class="plant-card__name">' + plant.name + '</h2>';
    html += '<p class="plant-card__why">' + reason + '</p>';
    html += '<div class="plant-card__actions">';
    html += '<a class="btn btn--detail" href="/plants/' + plant.id + '.html">🔎 자세히 보기</a>';
    html += '<a class="btn btn--shop" href="' + coupang + '" target="_blank" rel="noopener nofollow sponsored">'
      + '쿠팡에서 보기 <span aria-hidden="true">🛒</span></a>';
    html += '<button class="btn btn--share" type="button" data-share-id="' + plant.id + '" data-share-name="' + plant.name + '">'
      + '카톡으로 공유 <span aria-hidden="true">💬</span></button>';
    html += '</div>';   // actions
    html += '</div>';   // body
    html += '</article>';
    return html;
  }

  function renderEmpty(container) {
    container.innerHTML =
      '<div class="state-box">' +
      '<h1>딱 맞는 친구를 못 찾았어요.</h1>' +
      '<p>질문에 답하면 우리집에 맞는 식물을 찾아 드려요.</p>' +
      '<a class="btn-primary" href="/quiz.html">🌱 식물 추천받기</a>' +
      '</div>';
  }

  function renderError(container) {
    container.innerHTML =
      '<div class="state-box" role="alert">' +
      '<h1>잠깐 문제가 있었어요.</h1>' +
      '<p>한 번만 다시 눌러 주세요.</p>' +
      '<button class="btn-primary" type="button" id="result-retry">🔄 다시 시도하기</button>' +
      '</div>';
    var btn = document.getElementById("result-retry");
    if (btn) btn.addEventListener("click", function () { window.location.reload(); });
  }

  function renderLoading(container) {
    container.innerHTML =
      '<div class="state-box" role="status" aria-live="polite">' +
      '<p class="lead">잘 맞는 친구를 찾고 있어요.</p>' +
      '</div>';
  }

  function render(container, plants, a) {
    var picks = window.matchPlants(a, plants);
    var allZeroFallback = picks.every(function (p) {
      var s = 0;
      if (a.light && p.tags_light.indexOf(a.light) !== -1) s += 3;
      if (a.water && p.tags_water.indexOf(a.water) !== -1) s += 3;
      if (a.purpose && p.tags_purpose.indexOf(a.purpose) !== -1) s += 2;
      return s === 0;
    });

    var html = '';
    html += '<div class="result-head">';
    html += '<h1 class="result-head__title">우리집에 딱 맞는 친구예요</h1>';
    html += '<p class="result-head__subtitle">어르신께 잘 어울리는 식물 3가지예요.</p>';
    html += '</div>';

    if (allZeroFallback) {
      html += '<p class="notice">환경에 딱 맞는 식물은 적지만, 누구나 키우기 쉬운 식물을 추천해요.</p>';
    } else {
      html += '<p class="notice">어느 친구든 키우기 쉬워요. 천천히 골라 보세요.</p>';
    }

    html += '<div class="result-cards">';
    for (var i = 0; i < picks.length; i++) {
      html += cardHTML(picks[i], a);
    }
    html += '</div>';

    container.innerHTML = html;

    // 이미지 폴백 바인딩
    var imgs = container.querySelectorAll("img[data-fallback]");
    for (var j = 0; j < imgs.length; j++) window.App.attachImageFallback(imgs[j]);

    // 공유 버튼
    var shareBtns = container.querySelectorAll("[data-share-id]");
    for (var k = 0; k < shareBtns.length; k++) {
      shareBtns[k].addEventListener("click", function (e) {
        var b = e.currentTarget;
        var id = b.getAttribute("data-share-id");
        var name = b.getAttribute("data-share-name");
        window.App.share({
          title: "우리집 초록친구 — " + name,
          text: name + " 어떠세요? 우리집에 맞는 식물을 찾아봤어요.",
          url: window.CONFIG && window.CONFIG.SITE_URL
            ? (window.CONFIG.SITE_URL.replace(/\/$/, "") + "/plants/" + id + ".html")
            : (window.location.origin + "/plants/" + id + ".html")
        });
      });
    }
  }

  function init() {
    var container = document.getElementById("result-container");
    if (!container) return;

    // '다시하기' 네비
    var restart = document.getElementById("nav-restart");
    if (restart) restart.addEventListener("click", function () { window.location.assign("/quiz.html"); });
    var back = document.getElementById("nav-back");
    if (back) back.addEventListener("click", function () { window.location.assign("/quiz.html"); });

    var a = parseAnswers();
    if (!hasCoreAnswers(a)) { renderEmpty(container); return; }

    renderLoading(container);
    window.App.loadPlants().then(function (plants) {
      render(container, plants, a);
    }).catch(function () {
      renderError(container);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
