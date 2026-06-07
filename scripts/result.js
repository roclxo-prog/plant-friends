/* =====================================================================
   scripts/result.js — 결과 화면 v2
   URL 쿼리 파싱(light/water/purpose/place/pet/size/interest)
   → 화이트리스트 검증 → plants.json fetch → matchPlants → 식물 3종 카드 렌더.
   각 카드: 사진 + 이름 + "왜 맞는지" 이유(새 차원 반영) + 버튼 3개 + 배지.
   "자세히 보기"는 모든 식물 → /plant.html?id={id} (동적 상세, 213종 전부 동작).
   쿼리 없으면 안내 + 시작으로.
   ===================================================================== */
(function () {
  "use strict";

  // HTML 이스케이프 헬퍼 — plants.json은 신뢰 데이터지만 방어적으로 적용
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  var LIGHT = ["low", "mid", "high"];
  var WATER = ["low", "mid", "high"];
  var PURPOSE = ["air", "deco", "gift", "harvest"];
  var PLACE = ["living", "window", "bathroom", "desk"];
  var PET = ["yes", "no"];
  var SIZE = ["small", "medium", "large"];
  var INTEREST = ["flower", "foliage", "fruit"];

  // 쿠팡 href 방어: https:// 로 시작하지 않거나 placeholder면 안전한 검색 URL로 폴백.
  // (App.coupangUrl 의 폴백과 일관) esc() 는 호출부에서 그대로 유지.
  function safeCoupang(plant) {
    var url = (window.App && typeof window.App.coupangUrl === "function")
      ? window.App.coupangUrl(plant)
      : null;
    if (typeof url === "string" && url.indexOf("https://") === 0 &&
        url.indexOf("여기에_") === -1) {
      return url;
    }
    var name = (plant && plant.name) ? plant.name : "식물";
    return "https://www.coupang.com/np/search?q=" + encodeURIComponent(name);
  }

  function pickFrom(list, val) {
    return list.indexOf(val) !== -1 ? val : undefined;
  }

  function parseAnswers() {
    var p = new URLSearchParams(window.location.search);
    var a = {};
    var v;
    if ((v = pickFrom(LIGHT, p.get("light"))) !== undefined) a.light = v;
    if ((v = pickFrom(WATER, p.get("water"))) !== undefined) a.water = v;
    if ((v = pickFrom(PURPOSE, p.get("purpose"))) !== undefined) a.purpose = v;
    if ((v = pickFrom(PLACE, p.get("place"))) !== undefined) a.place = v;
    if ((v = pickFrom(PET, p.get("pet"))) !== undefined) a.pet = v;
    if ((v = pickFrom(SIZE, p.get("size"))) !== undefined) a.size = v;
    if ((v = pickFrom(INTEREST, p.get("interest"))) !== undefined) a.interest = v;
    return a;
  }

  function hasCoreAnswers(a) {
    // 빛·물·목적 중 하나라도 있으면 결과 진행(전부 없으면 안내)
    return !!(a.light || a.water || a.purpose);
  }

  function inTags(tags, val) {
    return !!val && Array.isArray(tags) && tags.indexOf(val) !== -1;
  }

  function interestLabel(v) {
    if (v === "flower") return "꽃";
    if (v === "foliage") return "잎·무늬";
    if (v === "fruit") return "열매·단풍";
    return "보는 재미";
  }

  // "왜 맞는지" 한 줄 이유 — v3: 의도(목적·보는재미) 먼저, 환경 다음.
  // _match가 있으면 그것으로 정직하게(실제 일치 차원만), 없으면 직접 계산(하위호환).
  function buildReason(plant, a) {
    var m = plant._match || {};
    var hasMeta = !!plant._match;

    var lightMatch  = hasMeta ? m.lightMatch  : inTags(plant.tags_light, a.light);
    var waterMatch  = hasMeta ? m.waterMatch  : inTags(plant.tags_water, a.water);
    var purposeMatch = hasMeta ? m.purposeMatch : inTags(plant.tags_purpose, a.purpose);
    var placeMatch  = hasMeta ? m.placeMatch  : inTags(plant.tags_place, a.place);
    var sizeMatch   = hasMeta ? m.sizeMatch   : !!(a.size && plant.size === a.size);
    var interestMatch = hasMeta ? m.interestMatch : inTags(plant.tags_interest, a.interest);
    var petSafe = (a.pet === "yes" && plant.toxic_to_pets !== true);
    var relaxed = m.relaxed || [];

    // 1) 반려동물 안전(가장 안심되는 정보 먼저)
    if (petSafe) return "반려동물에게 안전한 식물이에요.";

    // 2) 의도 먼저 — 보는재미(interest) 일치
    if (interestMatch) {
      if (a.interest === "flower")  return "원하시던 꽃이 피는 식물이에요.";
      if (a.interest === "foliage") return "잎과 무늬가 멋진 식물이에요.";
      if (a.interest === "fruit")   return "열매·단풍을 볼 수 있는 식물이에요.";
    }

    // 3) 의도 먼저 — 목적(purpose) 일치
    if (purposeMatch) {
      if (a.purpose === "air")     return "공기를 맑게 해 주는 식물이에요.";
      if (a.purpose === "deco")    return "보기 좋게 집을 꾸며 주는 식물이에요.";
      if (a.purpose === "gift")    return "선물·행운의 의미가 담긴 식물이에요.";
      if (a.purpose === "harvest") return "길러서 드실 수 있는 식물이에요.";
    }

    // 4) 보는재미를 양보한 경우 — 정직 안내
    if (relaxed.indexOf("interest") !== -1 && a.interest) {
      return "딱 ‘" + interestLabel(a.interest) + "’은 아니지만, 원하신 용도에 가장 잘 맞아요.";
    }

    // 5) 환경 — 장소 일치
    if (placeMatch && a.place) {
      if (a.place === "living")   return "거실에 두기 좋아요.";
      if (a.place === "window")   return "베란다·창가에 잘 어울려요.";
      if (a.place === "bathroom") return "습한 욕실에서도 잘 자라요.";
      if (a.place === "desk")     return "작아서 책상에 딱 맞아요.";
    }

    // 6) 환경 — 크기 일치
    if (sizeMatch) {
      if (a.size === "small")  return "작아서 어디에나 두기 좋아요.";
      if (a.size === "large")  return "크게 자라 거실을 채워 줘요.";
      if (a.size === "medium") return "크기가 알맞아 키우기 편해요.";
    }

    // 7) 환경 — 빛+물 조합
    if (lightMatch && waterMatch) {
      if (a.light === "high" && a.water === "high") return "햇빛 좋고 물 좋아하는 친구예요.";
      if (a.light === "high" && a.water === "low")  return "햇빛 좋아하고 손이 덜 가요.";
      if (a.light === "low" && a.water === "mid")   return "그늘에서도 잘 자라요.";
      if (a.light === "low" && a.water === "low")   return "빛 적고 물 잊어도 괜찮아요.";
    }

    // 8) 환경 — 빛 또는 물 단독 일치
    if (lightMatch && a.light === "low") return "빛이 약해도 잘 자라요.";
    if (waterMatch && a.water === "low") return "물을 자주 안 줘도 돼요.";
    if (lightMatch) return "두실 곳 빛에 잘 맞아요.";
    if (waterMatch) return "물 주기가 잘 맞아요.";

    // 폴백
    return "누구나 키우기 쉬운 친구예요.";
  }

  function cardHTML(plant, a) {
    var reason = buildReason(plant, a);
    var coupang = safeCoupang(plant);
    var img = "/" + String(plant.image || "").replace(/^\/+/, "");
    var name = esc(plant.name);
    var id = esc(plant.id);

    var badges = "";
    if (plant.difficulty === "매우 쉬움") {
      badges += '<span class="badge">🌱 아주 쉬움</span>';
    }
    if (plant.toxic_to_pets === true) {
      badges += '<span class="badge badge--warn">🐾 반려동물 주의</span>';
    }

    var html = '';
    html += '<article class="plant-card">';
    html += '<img class="plant-card__photo" src="' + esc(img) + '" alt="' + name + ' 사진"'
      + ' loading="lazy" decoding="async" width="480" height="320" data-fallback="1" />';
    html += '<div class="plant-card__body">';
    if (badges) html += '<div class="plant-card__badges">' + badges + '</div>';
    html += '<h2 class="plant-card__name">' + name + '</h2>';
    html += '<p class="plant-card__why">' + esc(reason) + '</p>';
    // 핵심 돌봄 정보를 태그(흰 카드 위 알약)로 강조 — 빛·물 한눈에
    var facts = '';
    if (plant.light_desc) facts += '<span class="badge"><span aria-hidden="true">☀️</span> ' + esc(plant.light_desc) + '</span>';
    if (plant.water_cycle) facts += '<span class="badge"><span aria-hidden="true">💧</span> 물 ' + esc(plant.water_cycle) + '</span>';
    if (facts) html += '<div class="plant-card__badges">' + facts + '</div>';
    html += '<div class="plant-card__actions">';
    html += '<a class="btn btn--detail" href="/plant.html?id=' + encodeURIComponent(plant.id) + '">🔎 자세히 보기</a>';
    html += '<a class="btn btn--shop" href="' + esc(coupang) + '" target="_blank" rel="noopener nofollow sponsored">'
      + '쿠팡에서 보기 <span aria-hidden="true">🛒</span></a>';
    html += '<button class="btn btn--share" type="button" data-share-id="' + id + '" data-share-name="' + name + '">'
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
      '<p>답을 해 주시면 식물을 찾아 드려요.</p>' +
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
    // v3: _match.relaxed 로 "완화(딱 맞진 않음)" 여부 판단(중복 점수계산 제거).
    var relaxed = picks.some(function (p) {
      return p._match && p._match.relaxed && p._match.relaxed.length > 0;
    });

    var html = '';
    html += '<div class="result-head card">';
    html += '<h1 class="result-head__title">이런 식물이 잘 맞아요 <span aria-hidden="true">🌿</span></h1>';
    html += '<p class="result-head__subtitle">우리집에 잘 맞는 식물 3가지예요.</p>';
    html += '</div>';

    if (relaxed) {
      html += '<p class="notice">딱 맞진 않지만, 의도에 가장 가까운 식물로 골랐어요.</p>';
    } else if (a.pet === "yes") {
      html += '<p class="notice">반려동물에게 안전한 식물로 골랐어요. 천천히 보세요.</p>';
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
        var base = (window.CONFIG && window.CONFIG.SITE_URL)
          ? window.CONFIG.SITE_URL.replace(/\/$/, "")
          : window.location.origin;
        window.App.share({
          title: "우리집 초록친구 — " + name,
          text: name + " 어떠세요? 우리집에 맞는 식물을 찾아봤어요.",
          url: base + "/plant.html?id=" + encodeURIComponent(id)
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
