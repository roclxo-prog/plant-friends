/* =====================================================================
   scripts/guide.js — 케어가이드 허브 목록 렌더 (전 213종)
   plants.json을 읽어 식물별 "키우는 법" 카드 목록을 만듭니다.
   - core 12종: 긴 정적 가이드 /plants/{id}.html
   - 나머지 전부: 동적 상세 /plant.html?id={id}
   - 목적별 섹션 그룹핑(시니어 친화) + 상단 이름 필터
   ===================================================================== */
(function () {
  "use strict";

  // HTML 이스케이프 헬퍼 — plants.json은 신뢰 데이터지만 방어적으로 적용
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  // 긴 정적 가이드(/plants/{id}.html)가 있는 core 12종 → 정적 링크.
  // 나머지 전부는 동적 상세(/plant.html?id=)로 연결 → 깨진 링크 0.
  var STATIC_GUIDE_IDS = [
    "sansevieria", "spathiphyllum", "succulent", "scindapsus", "zamioculcas",
    "parlor_palm", "rubber_plant", "lucky_bamboo", "phalaenopsis", "ivy",
    "lettuce", "basil"
  ];
  var STATIC_SET = {};
  for (var s = 0; s < STATIC_GUIDE_IDS.length; s++) STATIC_SET[STATIC_GUIDE_IDS[s]] = true;

  function hrefFor(id) {
    return STATIC_SET[id]
      ? "/plants/" + id + ".html"
      : "/plant.html?id=" + encodeURIComponent(id);
  }

  // 목적별 섹션 정의(시니어 친화). 같은 종은 첫 매칭 섹션에만 노출(중복 방지).
  var SECTIONS = [
    {
      key: "air", icon: "🌬️", title: "공기를 맑게",
      match: function (p) { return (p.tags_purpose || []).indexOf("air") !== -1; }
    },
    {
      key: "flower", icon: "🌸", title: "꽃·열매가 보기 좋은",
      match: function (p) {
        var it = p.tags_interest || [];
        return it.indexOf("flower") !== -1 || it.indexOf("fruit") !== -1;
      }
    },
    {
      key: "gift", icon: "🎁", title: "선물·상징",
      match: function (p) { return (p.tags_purpose || []).indexOf("gift") !== -1; }
    },
    {
      key: "harvest", icon: "🥬", title: "길러 먹기",
      match: function (p) { return (p.tags_purpose || []).indexOf("harvest") !== -1; }
    },
    {
      key: "other", icon: "🌿", title: "그 외 잎식물",
      match: function () { return true; } // 나머지 전부(폴백)
    }
  ];

  function cardHTML(plant) {
    var img = esc("/" + String(plant.image || "").replace(/^\/+/, ""));
    var name = esc(plant.name);
    var id = esc(plant.id);
    var href = esc(hrefFor(plant.id));
    var diff = esc(plant.difficulty || "");
    var merit = String(plant.merit || "");
    if (merit.length > 34) merit = merit.slice(0, 33) + "…";
    merit = esc(merit);

    var html = '';
    html += '<li class="guide-card" data-name="' + name + '">';
    html += '<a class="guide-card__link" href="' + href + '">';
    html += '<img class="guide-card__photo" src="' + img + '" alt="' + name + ' 사진"'
      + ' loading="lazy" decoding="async" width="240" height="160" data-fallback="1" />';
    html += '<span class="guide-card__body">';
    html += '<span class="guide-card__name">' + name + '</span>';
    if (diff) html += '<span class="guide-card__diff">난이도: ' + diff + '</span>';
    if (merit) html += '<span class="guide-card__merit">' + merit + '</span>';
    html += '</span>';
    html += '</a>';
    html += '</li>';
    return html;
  }

  function sectionHTML(section, plants) {
    var cards = "";
    for (var i = 0; i < plants.length; i++) cards += cardHTML(plants[i]);
    var titleId = "guide-sec-" + section.key;
    var html = '';
    html += '<section class="guide-section" aria-labelledby="' + titleId + '">';
    html += '<h2 class="guide-section__title" id="' + titleId + '">';
    html += '<span class="guide-section__icon" aria-hidden="true">' + section.icon + '</span> ';
    html += esc(section.title);
    html += ' <span class="guide-section__count">' + plants.length + '종</span>';
    html += '</h2>';
    html += '<ul class="guide-grid">' + cards + '</ul>';
    html += '</section>';
    return html;
  }

  function attachFilter(root) {
    var input = document.getElementById("guide-filter");
    var status = document.getElementById("guide-filter-status");
    if (!input) return;
    var cards = root.querySelectorAll(".guide-card");
    var sections = root.querySelectorAll(".guide-section");

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var name = (cards[i].getAttribute("data-name") || "").toLowerCase();
        var hit = !q || name.indexOf(q) !== -1;
        cards[i].style.display = hit ? "" : "none";
        if (hit) shown++;
      }
      // 빈 섹션은 제목까지 숨김
      for (var j = 0; j < sections.length; j++) {
        var visible = sections[j].querySelectorAll('.guide-card:not([style*="display: none"])').length;
        sections[j].style.display = visible ? "" : "none";
      }
      if (status) {
        status.textContent = q
          ? (shown ? shown + "종이 검색되었어요." : "검색 결과가 없어요.")
          : "";
      }
    }
    input.addEventListener("input", apply);
  }

  function init() {
    var root = document.getElementById("guide-list");
    if (!root) return;

    window.App.loadPlants().then(function (plants) {
      // 섹션별로 분배(첫 매칭 섹션에만 — 중복 노출 방지)
      var buckets = {};
      for (var s = 0; s < SECTIONS.length; s++) buckets[SECTIONS[s].key] = [];
      for (var i = 0; i < plants.length; i++) {
        var p = plants[i];
        for (var k = 0; k < SECTIONS.length; k++) {
          if (SECTIONS[k].match(p)) { buckets[SECTIONS[k].key].push(p); break; }
        }
      }

      var html = "";
      for (var m = 0; m < SECTIONS.length; m++) {
        var sec = SECTIONS[m];
        if (buckets[sec.key].length) html += sectionHTML(sec, buckets[sec.key]);
      }
      root.innerHTML = html;

      var imgs = root.querySelectorAll("img[data-fallback]");
      for (var j = 0; j < imgs.length; j++) window.App.attachImageFallback(imgs[j]);

      attachFilter(root);
    }).catch(function () {
      root.innerHTML = '<p class="guide-error">목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>';
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
