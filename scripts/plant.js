/* =====================================================================
   scripts/plant.js — 동적 식물 상세 (?id={id})
   plants.json fetch → 해당 식물 렌더: 사진(폴백)·이름·학명·info-grid
   ·장점·주의·반려동물 주의·쿠팡·관련 식물 3개·다른 식물 추천받기.
   core 12종이면 상단에 "키우는 법 자세히 보기" → /plants/{id}.html.
   잘못된 id면 안내 + 추천 시작 링크. esc() XSS 가드, 이미지 폴백 유지.
   ===================================================================== */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  // 정적 상세페이지(케어 가이드)가 존재하는 core 12종
  var STATIC_CORE = {
    sansevieria: 1, spathiphyllum: 1, succulent: 1, scindapsus: 1,
    zamioculcas: 1, parlor_palm: 1, rubber_plant: 1, lucky_bamboo: 1,
    phalaenopsis: 1, ivy: 1, lettuce: 1, basil: 1
  };

  var SIZE_LABEL = { small: "작은 탁상용", medium: "중간 크기", large: "큰 거실용" };
  var PLACE_LABEL = {
    living: "거실", window: "베란다·창가", bathroom: "욕실·습한 곳", desk: "책상·사무실"
  };
  var INTEREST_LABEL = { flower: "꽃", foliage: "잎·무늬", fruit: "열매·단풍" };

  function joinLabels(tags, map) {
    if (!Array.isArray(tags)) return "";
    var out = [];
    for (var i = 0; i < tags.length; i++) {
      if (map[tags[i]]) out.push(map[tags[i]]);
    }
    return out.join(", ");
  }

  function getId() {
    var p = new URLSearchParams(window.location.search);
    return (p.get("id") || "").trim();
  }

  /* --- 관련 식물 3개: 같은 목적/장소 우선 ------------------------- */
  function relatedPlants(plant, plants) {
    var picks = [];
    var have = {};
    have[plant.id] = true;

    function tagOverlap(a, b) {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) !== -1) return true;
      return false;
    }

    // 점수: 목적 겹침 +2, 장소 겹침 +1, common +0.5
    var scored = plants.filter(function (p) { return p.id !== plant.id; })
      .map(function (p) {
        var s = 0;
        if (tagOverlap(p.tags_purpose, plant.tags_purpose)) s += 2;
        if (tagOverlap(p.tags_place, plant.tags_place)) s += 1;
        if (p.common === true) s += 0.5;
        return { plant: p, score: s };
      });

    scored.sort(function (a, b) { return b.score - a.score; });

    for (var i = 0; i < scored.length && picks.length < 3; i++) {
      if (scored[i].score <= 0) break;
      picks.push(scored[i].plant);
      have[scored[i].plant.id] = true;
    }
    // 부족하면 common으로 채움
    for (var j = 0; j < plants.length && picks.length < 3; j++) {
      if (!have[plants[j].id]) { picks.push(plants[j]); have[plants[j].id] = true; }
    }
    return picks;
  }

  function infoCard(icon, title, value, warn) {
    var cls = "info-card" + (warn ? " info-card--warn" : "");
    return '<div class="' + cls + '">' +
      '<span class="info-card__icon" aria-hidden="true">' + icon + '</span>' +
      '<h3 class="info-card__title">' + esc(title) + '</h3>' +
      '<p class="info-card__value">' + esc(value) + '</p>' +
      '</div>';
  }

  function render(container, plant, plants) {
    var name = esc(plant.name);
    var img = "/" + String(plant.image || "").replace(/^\/+/, "");
    var isCore = !!STATIC_CORE[plant.id];

    // 페이지 제목 갱신
    document.title = plant.name + " | 우리집 초록친구";

    var coupang = window.App.coupangUrl(plant);

    var html = '';

    // 빵부스러기
    html += '<nav class="breadcrumb" aria-label="현재 위치">';
    html += '<a href="/index.html">홈</a> &gt; ';
    html += '<a href="/quiz.html">식물 추천</a> &gt; ';
    html += '<span aria-current="page">' + name + '</span>';
    html += '</nav>';

    html += '<h1>' + name + '</h1>';
    if (plant.scientific_name) {
      html += '<p class="lead"><em>' + esc(plant.scientific_name) + '</em></p>';
    }

    // core면 상단에 큰 버튼: 키우는 법 자세히 보기 → 정적 상세
    if (isCore) {
      html += '<p style="margin:var(--space-2) 0">';
      html += '<a class="btn-primary" href="/plants/' + encodeURIComponent(plant.id) + '.html">';
      html += '🌱 키우는 법 자세히 보기 <span aria-hidden="true">→</span></a>';
      html += '</p>';
    }

    // 사진
    html += '<img class="plant-card__photo" src="' + esc(img) + '"'
      + ' alt="' + name + ' 사진" width="800" height="600"'
      + ' decoding="async" data-fallback="1" />';

    // 한눈에 보는 핵심 정보
    html += '<h2>한눈에 보는 핵심 정보</h2>';
    html += '<div class="info-grid">';
    html += infoCard("☀️", "빛", plant.light_desc || "—");
    html += infoCard("💧", "물 주기", plant.water_cycle || "—");
    html += infoCard("🌱", "난이도", plant.difficulty || "—");
    html += infoCard("📏", "크기", SIZE_LABEL[plant.size] || "—");
    var placeText = joinLabels(plant.tags_place, PLACE_LABEL);
    html += infoCard("🛋️", "두는 곳", placeText || "어디든 좋아요");
    var interestText = joinLabels(plant.tags_interest, INTEREST_LABEL);
    html += infoCard("🍃", "보는 재미", interestText || "—");
    html += '</div>';

    // 장점 / 주의
    if (plant.merit) {
      html += '<h2>이런 점이 좋아요</h2>';
      html += '<p>' + esc(plant.merit) + '</p>';
    }
    if (plant.caution) {
      html += '<h2>이것만 주의하세요</h2>';
      html += '<p>' + esc(plant.caution) + '</p>';
    }

    // 반려동물 주의 카드
    if (plant.toxic_to_pets === true) {
      html += '<div class="info-card info-card--warn" style="margin:var(--space-2) 0">';
      html += '<span class="info-card__icon" aria-hidden="true">🐾</span>';
      html += '<h3 class="info-card__title">반려동물 주의</h3>';
      html += '<p class="info-card__value">강아지·고양이가 잎을 먹지 않게 손이 닿지 않는 곳에 두세요.</p>';
      html += '</div>';
    } else {
      html += '<div class="info-card" style="margin:var(--space-2) 0">';
      html += '<span class="info-card__icon" aria-hidden="true">🐶</span>';
      html += '<h3 class="info-card__title">반려동물</h3>';
      html += '<p class="info-card__value">반려동물에게 비교적 안전한 식물이에요.</p>';
      html += '</div>';
    }

    // 쿠팡 구매
    html += '<p style="margin-top:var(--space-3)">';
    html += '<a class="btn-primary" href="' + esc(coupang) + '" data-coupang-name="' + name + '"';
    html += ' rel="nofollow sponsored noopener" target="_blank">';
    html += '<span aria-hidden="true">🛒</span> 쿠팡에서 보기</a>';
    html += '</p>';
    html += '<p class="ad-disclosure">이 링크는 쿠팡 파트너스 활동의 일환으로 수수료를 받을 수 있습니다.</p>';

    // 관련 식물 3개
    var related = relatedPlants(plant, plants);
    if (related.length) {
      html += '<h2>이런 식물도 잘 어울려요</h2>';
      html += '<ul class="related-plants">';
      for (var i = 0; i < related.length; i++) {
        var r = related[i];
        html += '<li><a href="/plant.html?id=' + encodeURIComponent(r.id) + '">' + esc(r.name) + '</a></li>';
      }
      html += '</ul>';
    }

    // 다른 식물 추천받기
    html += '<p style="margin-top:var(--space-3)">';
    html += '<a class="btn-primary" href="/quiz.html"><span aria-hidden="true">🌱</span> 다른 식물 추천받기</a>';
    html += '</p>';

    container.innerHTML = html;

    // 이미지 폴백
    var imgs = container.querySelectorAll("img[data-fallback]");
    for (var k = 0; k < imgs.length; k++) window.App.attachImageFallback(imgs[k]);

    // 쿠팡 placeholder 링크 폴백(공통 헬퍼)
    if (window.App.bindCoupangLinks) window.App.bindCoupangLinks();
  }

  function renderNotFound(container) {
    document.title = "식물을 찾지 못했어요 | 우리집 초록친구";
    container.innerHTML =
      '<div class="state-box">' +
      '<h1>식물을 찾지 못했어요.</h1>' +
      '<p>주소가 잘못되었거나 아직 준비 중인 식물이에요.</p>' +
      '<a class="btn-primary" href="/quiz.html">🌱 식물 추천받기</a>' +
      '</div>';
  }

  function renderError(container) {
    container.innerHTML =
      '<div class="state-box" role="alert">' +
      '<h1>잠깐 문제가 있었어요.</h1>' +
      '<p>한 번만 다시 눌러 주세요.</p>' +
      '<button class="btn-primary" type="button" id="plant-retry">🔄 다시 시도하기</button>' +
      '</div>';
    var btn = document.getElementById("plant-retry");
    if (btn) btn.addEventListener("click", function () { window.location.reload(); });
  }

  function init() {
    var container = document.getElementById("plant-container");
    if (!container) return;

    var id = getId();
    if (!id) { renderNotFound(container); return; }

    window.App.loadPlants().then(function (plants) {
      var plant = window.App.findPlant(plants, id);
      if (!plant) { renderNotFound(container); return; }
      render(container, plant, plants);
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
