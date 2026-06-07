/* =====================================================================
   scripts/home.js — 메인(index.html) 동적 섹션
   - App.loadPlants()로 plants.json 로드
   - featured: 오늘의 초록친구 3종(접속할 때마다 무작위, common 우선, 사진 있는 종만)
   - rankings: 쿠팡 구매 유도 4구좌 × 6종(선물/쉬움/공기정화/반려동물 안전)
   사진 위 글씨 금지. 흰 카드. 쿠팡 링크는 app.js 안전 처리(coupangUrl) 사용.
   ===================================================================== */
(function () {
  "use strict";

  // HTML 이스케이프 — plants.json은 신뢰 데이터지만 방어적으로 적용
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  // 사진 없는 종(오십령옥) 제외 — 사진 위 글씨 금지 원칙상 카드엔 사진 필수
  var NO_PHOTO_IDS = { fenestraria: true };

  // 정적 케어 가이드(상세)가 있는 core 12종 — 있으면 /plants/{id}.html로 연결
  var STATIC_CORE = {
    sansevieria: 1, spathiphyllum: 1, succulent: 1, scindapsus: 1,
    zamioculcas: 1, parlor_palm: 1, rubber_plant: 1, lucky_bamboo: 1,
    phalaenopsis: 1, ivy: 1, lettuce: 1, basil: 1
  };

  // 카드 기본 행동: core 12종은 정적 상세, 나머지는 동적 상세(?id=)
  function detailHref(plant) {
    var id = encodeURIComponent(plant.id);
    return STATIC_CORE[plant.id] ? ("/plants/" + id + ".html") : ("/plant.html?id=" + id);
  }

  function hasPhoto(plant) {
    return !!plant && !NO_PHOTO_IDS[plant.id];
  }

  function inTags(tags, val) {
    return Array.isArray(tags) && tags.indexOf(val) !== -1;
  }

  // 무작위 셔플(Fisher–Yates) — 접속(로드)마다 결과가 바뀌도록
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // common:true 우선으로 셔플 — 흔히 구할 수 있는 식물을 앞에, 그 안에서 무작위
  function shuffleCommonFirst(plants) {
    var common = shuffle(plants.filter(function (p) { return p.common === true; }));
    var rest = shuffle(plants.filter(function (p) { return p.common !== true; }));
    return common.concat(rest);
  }

  // 추천 대상 생성 규칙(1~2개, 짧게) — 알약 태그로 표시
  function audienceTags(plant) {
    var out = [];
    if (inTags(plant.tags_purpose, "air")) out.push("공기를 맑게 하고 싶은 분");
    if (plant.difficulty === "매우 쉬움") out.push("처음 키우는 분");
    if (inTags(plant.tags_purpose, "gift")) out.push("선물 찾는 분");
    if (plant.toxic_to_pets === false) out.push("반려동물 가족");
    if (plant.size === "small") out.push("책상·좁은 공간");
    if (inTags(plant.tags_purpose, "harvest")) out.push("길러 먹고 싶은 분");
    return out.slice(0, 2);
  }

  // merit 한 줄 축약(랭킹 카드용) — 첫 문장 또는 적당히 줄임
  function shortMerit(plant) {
    var m = String(plant.merit || "").trim();
    if (!m) return "키우기 좋은 친구예요.";
    // 첫 문장(마침표 기준)만, 없으면 28자 컷
    var dot = m.indexOf(".");
    var first = dot > -1 ? m.slice(0, dot + 1) : m;
    if (first.length > 34) first = first.slice(0, 32) + "…";
    return first;
  }

  function plantImg(plant) {
    // image 필드 우선, 없으면 id 기준 절대경로
    var src = plant.image
      ? "/" + String(plant.image).replace(/^\/+/, "")
      : "/public/plants/" + encodeURIComponent(plant.id) + ".jpg";
    return src;
  }

  /* --- featured 카드(오늘의 초록친구) --------------------------------- */
  function featuredCardHTML(plant, eager) {
    var name = esc(plant.name);
    var detail = esc(detailHref(plant));
    var img = esc(plantImg(plant));
    var loading = eager ? "eager" : "lazy";

    var aud = audienceTags(plant);
    var audHTML = "";
    if (aud.length) {
      audHTML += '<div class="featured-card__audience" aria-label="추천 대상">';
      for (var i = 0; i < aud.length; i++) {
        audHTML += '<span class="badge">' + esc(aud[i]) + "</span>";
      }
      audHTML += "</div>";
    }

    var html = "";
    html += '<article class="featured-card">';
    html += '<img class="featured-card__photo" src="' + img + '" alt="' + name + ' 사진"'
      + ' loading="' + loading + '" decoding="async" width="480" height="320" data-fallback="1" />';
    html += '<div class="featured-card__body">';
    html += '<h3 class="featured-card__name">' + name + "</h3>";
    html += '<p class="featured-card__merit">' + esc(plant.merit || "") + "</p>";
    html += audHTML;
    html += '<div class="featured-card__actions">';
    html += '<a class="btn btn--detail" href="' + detail + '">'
      + '자세히 보기 <span aria-hidden="true">→</span></a>';
    html += "</div>"; // actions
    html += "</div>"; // body
    html += "</article>";
    return html;
  }

  function renderFeatured(container, plants) {
    var pool = shuffleCommonFirst(plants.filter(hasPhoto));
    var picks = pool.slice(0, 3);
    if (!picks.length) { container.parentNode.style.display = "none"; return; }

    var html = '<div class="featured-grid">';
    for (var i = 0; i < picks.length; i++) {
      html += featuredCardHTML(picks[i], i === 0); // 첫 장만 eager
    }
    html += "</div>";
    container.innerHTML = html;
    bindImages(container);
  }

  /* --- 랭킹 카드(쿠팡 구매 유도) ------------------------------------- */
  function rankCardHTML(plant, rank) {
    var name = esc(plant.name);
    var detail = esc(detailHref(plant));
    var img = esc(plantImg(plant));

    var html = "";
    html += '<article class="rank-card">';
    html += '<a class="rank-card__link" href="' + detail + '">';
    html += '<span class="rank-card__num" aria-hidden="true">' + rank + "</span>";
    html += '<img class="rank-card__photo" src="' + img + '" alt="' + name + ' 사진"'
      + ' loading="lazy" decoding="async" width="240" height="160" data-fallback="1" />';
    html += '<span class="rank-card__rank-label sr-only">' + rank + "위</span>";
    html += '<span class="rank-card__name">' + name + "</span>";
    html += '<span class="rank-card__merit">' + esc(shortMerit(plant)) + "</span>";
    html += "</a>";
    html += '<a class="btn btn--detail rank-card__detail" href="' + detail + '">'
      + '자세히 보기 <span aria-hidden="true">→</span></a>';
    html += "</article>";
    return html;
  }

  function rankBlockHTML(title, plants) {
    if (!plants.length) return "";
    var html = "";
    html += '<div class="rank-block">';
    html += '<h3 class="rank-block__title">' + esc(title) + "</h3>";
    // 가로 스크롤 + 좌/우 화살표(시니어가 손쉽게 넘길 수 있도록)
    html += '<div class="rank-scroller">';
    html += '<button class="rank-arrow rank-arrow--prev" type="button"'
      + ' aria-label="이전 식물 보기"><span aria-hidden="true">◀</span></button>';
    html += '<div class="rank-row">';
    for (var i = 0; i < plants.length; i++) {
      html += rankCardHTML(plants[i], i + 1);
    }
    html += "</div>"; // rank-row
    html += '<button class="rank-arrow rank-arrow--next" type="button"'
      + ' aria-label="다음 식물 보기"><span aria-hidden="true">▶</span></button>';
    html += "</div>"; // rank-scroller
    html += "</div>"; // rank-block
    return html;
  }

  /* --- 랭킹 가로 스크롤 화살표 바인딩 -------------------------------- */
  function prefersReducedMotion() {
    return !!(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function bindRankArrows(scope) {
    var scrollers = scope.querySelectorAll(".rank-scroller");
    for (var s = 0; s < scrollers.length; s++) {
      (function (scroller) {
        var row = scroller.querySelector(".rank-row");
        var prev = scroller.querySelector(".rank-arrow--prev");
        var next = scroller.querySelector(".rank-arrow--next");
        if (!row || !prev || !next) return;

        // 카드 1~2개 폭만큼 이동(카드 폭 + gap을 측정, 폴백 220px)
        function step() {
          var card = row.querySelector(".rank-card");
          var w = card ? card.getBoundingClientRect().width : 200;
          var gap = 16;
          var unit = w + gap;
          // 화면이 좁으면 1개, 넓으면 2개씩
          var count = row.clientWidth >= unit * 2.5 ? 2 : 1;
          return unit * count;
        }

        function scrollByDir(dir) {
          var opts = { left: dir * step() };
          opts.behavior = prefersReducedMotion() ? "auto" : "smooth";
          row.scrollBy(opts);
        }

        // 끝에 닿으면 화살표 비활성(시각·상호작용 모두)
        function updateArrows() {
          var max = row.scrollWidth - row.clientWidth - 1;
          var atStart = row.scrollLeft <= 0;
          var atEnd = row.scrollLeft >= max;
          prev.disabled = atStart;
          next.disabled = atEnd;
        }

        prev.addEventListener("click", function () { scrollByDir(-1); });
        next.addEventListener("click", function () { scrollByDir(1); });
        row.addEventListener("scroll", updateArrows, { passive: true });
        window.addEventListener("resize", updateArrows);
        updateArrows();
      })(scrollers[s]);
    }
  }

  function renderRankings(container, plants) {
    var withPhoto = plants.filter(hasPhoto);

    // 1) 선물로 좋은 식물
    var gift = shuffleCommonFirst(withPhoto.filter(function (p) {
      return inTags(p.tags_purpose, "gift");
    })).slice(0, 6);

    // 2) 초보도 안 죽이는 쉬운 식물 — '매우 쉬움' 우선, 그다음 '쉬움'
    var veryEasy = shuffleCommonFirst(withPhoto.filter(function (p) {
      return p.difficulty === "매우 쉬움";
    }));
    var easy = shuffleCommonFirst(withPhoto.filter(function (p) {
      return p.difficulty === "쉬움";
    }));
    var easyAll = veryEasy.concat(easy).slice(0, 6);

    // 3) 공기를 맑게 하는 식물
    var air = shuffleCommonFirst(withPhoto.filter(function (p) {
      return inTags(p.tags_purpose, "air");
    })).slice(0, 6);

    // 4) 반려동물과 안전한 식물
    var pet = shuffleCommonFirst(withPhoto.filter(function (p) {
      return p.toxic_to_pets === false;
    })).slice(0, 6);

    var html = "";
    html += rankBlockHTML("🎁 선물로 좋은 식물", gift);
    html += rankBlockHTML("🌱 초보도 안 죽이는 쉬운 식물", easyAll);
    html += rankBlockHTML("🌬️ 공기를 맑게 하는 식물", air);
    html += rankBlockHTML("🐾 반려동물과 안전한 식물", pet);

    container.innerHTML = html;
    bindImages(container);
    bindRankArrows(container);
  }

  /* --- 공통 --------------------------------------------------------- */
  function bindImages(scope) {
    if (!window.App || typeof window.App.attachImageFallback !== "function") return;
    var imgs = scope.querySelectorAll("img[data-fallback]");
    for (var i = 0; i < imgs.length; i++) window.App.attachImageFallback(imgs[i]);
  }

  function init() {
    var featured = document.getElementById("featured-cards");
    var rankings = document.getElementById("rankings-blocks");
    if (!featured && !rankings) return;
    if (!window.App || typeof window.App.loadPlants !== "function") return;

    window.App.loadPlants().then(function (plants) {
      if (!Array.isArray(plants)) throw new Error("plants not array");
      // 섹션별 독립 처리 — 한 곳이 실패해도 다른 곳은 정상 노출, 로딩 문구 잔존 방지
      if (featured) {
        try { renderFeatured(featured, plants); }
        catch (e) { featured.parentNode.style.display = "none"; }
      }
      if (rankings) {
        try { renderRankings(rankings, plants); }
        catch (e) { rankings.parentNode.style.display = "none"; }
      }
    }).catch(function () {
      // 데이터 로드 자체 실패 — 정적 콘텐츠(히어로·이용방법)는 그대로 보임
      if (featured) featured.parentNode.style.display = "none";
      if (rankings) rankings.parentNode.style.display = "none";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
