/* =====================================================================
   scripts/guide.js — 케어가이드 허브 목록 렌더
   plants.json을 읽어 식물별 "키우는 법" 링크 카드 목록을 만듭니다.
   ===================================================================== */
(function () {
  "use strict";

  function itemHTML(plant) {
    var img = "/" + String(plant.image || "").replace(/^\/+/, "");
    var html = '';
    html += '<li class="guide-item">';
    html += '<a href="/plants/' + plant.id + '.html">';
    html += '<img class="guide-item__thumb" src="' + img + '" alt="' + plant.name + ' 사진"'
      + ' loading="lazy" decoding="async" width="64" height="64" data-fallback="1" />';
    html += '<span class="guide-item__name">' + plant.name + ' 키우는 법</span>';
    html += '<span class="guide-item__diff">' + (plant.difficulty || '') + '</span>';
    html += '</a>';
    html += '</li>';
    return html;
  }

  function init() {
    var list = document.getElementById("guide-list");
    if (!list) return;

    window.App.loadPlants().then(function (plants) {
      var html = "";
      for (var i = 0; i < plants.length; i++) html += itemHTML(plants[i]);
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
