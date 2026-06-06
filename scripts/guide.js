/* =====================================================================
   scripts/guide.js — 케어가이드 허브 목록 렌더
   plants.json을 읽어 식물별 "키우는 법" 링크 카드 목록을 만듭니다.
   ===================================================================== */
(function () {
  "use strict";

  // HTML 이스케이프 헬퍼 — plants.json은 신뢰 데이터지만 방어적으로 적용
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function itemHTML(plant) {
    var img = esc("/" + String(plant.image || "").replace(/^\/+/, ""));
    var name = esc(plant.name);
    var id = esc(plant.id);
    var html = '';
    html += '<li class="guide-item">';
    html += '<a href="/plants/' + id + '.html">';
    html += '<img class="guide-item__thumb" src="' + img + '" alt="' + name + ' 사진"'
      + ' loading="lazy" decoding="async" width="64" height="64" data-fallback="1" />';
    html += '<span class="guide-item__name">' + name + ' 키우는 법</span>';
    html += '<span class="guide-item__diff">' + esc(plant.difficulty || '') + '</span>';
    html += '</a>';
    html += '</li>';
    return html;
  }

  // 긴 케어가이드(정적 상세페이지)가 있는 식물만 이 허브에 노출 → 깨진 링크 방지.
  // 나머지 200여 종은 추천 도구(quiz)와 동적 상세(plant.html)로 만남.
  var STATIC_GUIDE_IDS = [
    "sansevieria", "spathiphyllum", "succulent", "scindapsus", "zamioculcas",
    "parlor_palm", "rubber_plant", "lucky_bamboo", "phalaenopsis", "ivy",
    "lettuce", "basil"
  ];

  function init() {
    var list = document.getElementById("guide-list");
    if (!list) return;

    window.App.loadPlants().then(function (plants) {
      var byId = {};
      for (var k = 0; k < plants.length; k++) byId[plants[k].id] = plants[k];
      var guided = STATIC_GUIDE_IDS.map(function (id) { return byId[id]; }).filter(Boolean);
      var html = "";
      for (var i = 0; i < guided.length; i++) html += itemHTML(guided[i]);
      list.innerHTML = html;
      var imgs = list.querySelectorAll("img[data-fallback]");
      for (var j = 0; j < imgs.length; j++) window.App.attachImageFallback(imgs[j]);
    }).catch(function () {
      list.innerHTML = '<li class="guide-item">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</li>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
