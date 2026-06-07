/* =====================================================================
   scripts/app.js — 공통 로직
   - plants.json fetch 헬퍼
   - 이미지 onerror 폴백
   - 공유 함수(navigator.share → 클립보드 복사 폴백)
   - 쿠팡 링크 처리
   - 광고 로드(애드센스 ID가 placeholder면 로드 안 함)
   모든 페이지에서 defer 로드. config.js 먼저 로드되어 있어야 함.
   ===================================================================== */
(function (global) {
  "use strict";

  var App = {};
  var PLACEHOLDER_PREFIX_KR = "여기에"; // placeholder 판별용

  var PLANTS_URL = "/packages/plants/plants.json";
  var PLACEHOLDER_IMG = "/public/plants/placeholder.svg";

  /* --- 설정 헬퍼 -------------------------------------------------- */
  App.config = function () { return global.CONFIG || {}; };

  App.isPlaceholder = function (val) {
    if (!val || typeof val !== "string") return true;
    if (val.indexOf(PLACEHOLDER_PREFIX_KR) !== -1) return true;
    if (val.indexOf("PLACEHOLDER") !== -1) return true;
    return false;
  };

  /* --- 데이터 로드 ------------------------------------------------ */
  var _plantsCache = null;
  App.loadPlants = function () {
    if (_plantsCache) return Promise.resolve(_plantsCache);
    return fetch(PLANTS_URL, { cache: "force-cache" }).then(function (res) {
      if (!res.ok) throw new Error("plants load failed: " + res.status);
      return res.json();
    }).then(function (data) {
      _plantsCache = data;
      return data;
    });
  };

  App.findPlant = function (plants, id) {
    for (var i = 0; i < plants.length; i++) {
      if (plants[i].id === id) return plants[i];
    }
    return null;
  };

  /* --- 이미지 폴백 ------------------------------------------------ */
  // 인라인 onerror 대신 JS에서 일괄 처리(CSP 친화)
  App.attachImageFallback = function (img) {
    if (!img || img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = "1";
    img.addEventListener("error", function handle() {
      img.removeEventListener("error", handle);
      img.src = PLACEHOLDER_IMG;
      img.alt = "사진을 준비 중이에요";
    });
  };
  App.PLACEHOLDER_IMG = PLACEHOLDER_IMG;

  /* --- 쿠팡 링크 처리 -------------------------------------------- */
  // plant.coupang_url 사용. placeholder면 안전하게 검색 폴백.
  App.coupangUrl = function (plant) {
    if (plant && plant.coupang_url && !App.isPlaceholder(plant.coupang_url)) {
      return plant.coupang_url;
    }
    // 링크가 아직 없으면 쿠팡 검색으로 폴백(빈 링크 방지)
    var name = plant && plant.name ? plant.name : "식물";
    return "https://www.coupang.com/np/search?q=" + encodeURIComponent(name);
  };

  // 페이지에서 식물 이름 추정(쿠팡 검색 폴백용)
  // 1) 버튼의 data-coupang-name → 2) <h1> 텍스트에서 "키우는 법" 제거 → 3) 기본값
  App.guessPlantName = function (el) {
    if (el && el.getAttribute) {
      var attr = el.getAttribute("data-coupang-name");
      if (attr && attr.trim()) return attr.trim();
    }
    var h1 = document.querySelector("h1");
    if (h1 && h1.textContent) {
      var t = h1.textContent.replace(/키우는\s*법/g, "").trim();
      if (t) return t;
    }
    return "식물";
  };

  // DOM의 쿠팡 버튼(a[data-coupang]) href가 placeholder면 검색 URL로 교체.
  // plants.json 없이도 안전하게 빈 링크를 막습니다. 공통 init에서 1회 실행.
  App.bindCoupangLinks = function () {
    var links = document.querySelectorAll("a[data-coupang]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.dataset.coupangBound) continue;
      a.dataset.coupangBound = "1";
      var href = a.getAttribute("href");
      if (App.isPlaceholder(href)) {
        var name = App.guessPlantName(a);
        a.setAttribute("href",
          "https://www.coupang.com/np/search?q=" + encodeURIComponent(name));
      }
    }
  };

  /* --- 공유 함수 -------------------------------------------------- */
  // navigator.share 우선, 없으면 현재 URL 클립보드 복사 + 안내
  App.share = function (opts) {
    opts = opts || {};
    var shareData = {
      title: opts.title || "우리집 초록친구",
      text: opts.text || "우리집에 맞는 식물을 찾아보세요.",
      url: opts.url || global.location.href
    };

    if (navigator.share) {
      return navigator.share(shareData).catch(function () { /* 사용자가 취소 — 무시 */ });
    }

    // 폴백: 클립보드 복사
    var url = shareData.url;
    var notify = function () { App.toast("링크를 복사했어요. 카톡에 붙여 넣으세요."); };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).then(notify, function () {
        App.fallbackCopy(url); notify();
      });
    }
    App.fallbackCopy(url);
    notify();
    return Promise.resolve();
  };

  // 정적 페이지용: data-share 버튼을 일괄 바인딩(인라인 onclick 대신, CSP 친화)
  // 속성: data-share-title(선택), data-share-text(선택), data-share-url(선택, 없으면 현재 URL)
  // data-share-url 이 상대경로면 SITE_URL 기준 절대 URL로 보정.
  App.bindShareButtons = function () {
    var btns = document.querySelectorAll("[data-share]");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (b.dataset.shareBound) continue;
      b.dataset.shareBound = "1";
      b.addEventListener("click", function (e) {
        var el = e.currentTarget;
        var cfg = App.config();
        var base = (cfg.SITE_URL && !App.isPlaceholder(cfg.SITE_URL))
          ? cfg.SITE_URL.replace(/\/$/, "")
          : global.location.origin;
        var url = el.getAttribute("data-share-url");
        if (!url) {
          url = base + global.location.pathname;
        } else if (url.indexOf("http") !== 0) {
          url = base + (url.indexOf("/") === 0 ? "" : "/") + url;
        }
        App.share({
          title: el.getAttribute("data-share-title") || undefined,
          text: el.getAttribute("data-share-text") || undefined,
          url: url
        });
      });
    }
  };

  App.fallbackCopy = function (text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) { /* 무시 */ }
  };

  /* --- 안내 토스트(인라인, 팝업/모달 아님, aria-live) ------------ */
  App.toast = function (message) {
    var el = document.getElementById("app-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.style.cssText = [
        "position:fixed", "left:50%", "bottom:calc(var(--bottomnav-h, 0px) + 16px)",
        "transform:translateX(-50%)", "z-index:300",
        "max-width:90%", "padding:12px 16px",
        "font-size:18px", "font-weight:600",
        "color:#FFFFFF", "background:#1B1B1B",
        "border-radius:12px", "box-shadow:0 2px 8px rgba(0,0,0,.3)",
        "text-align:center"
      ].join(";");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.display = "block";
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(function () { el.style.display = "none"; }, 3500);
  };

  /* --- 광고 로드(애드센스) --------------------------------------- */
  // ADSENSE_CLIENT_ID가 placeholder면 아무것도 로드하지 않음(현행 유지).
  // 실제 ID(ca-pub-…)일 때:
  //   1) 애드센스 로더 스크립트를 head에 1회 주입(심사·자동광고용, 모든 페이지).
  //   2) 콘텐츠 하단 .ad-slot__body 가 있는 페이지에서만 광고 단위 push.

  // 로더 스크립트 1회 주입(심사 크롤러가 사이트 전역에서 코드를 확인).
  App.injectAdsenseLoader = function () {
    var cfg = App.config();
    var id = cfg.ADSENSE_CLIENT_ID;
    if (App.isPlaceholder(id)) return false; // 실제 ID 없으면 미주입
    if (document.querySelector('script[data-adsbygoogle-loaded]')) return true; // 중복 방지

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(id);
    s.crossOrigin = "anonymous";
    s.setAttribute("data-adsbygoogle-loaded", "1");
    document.head.appendChild(s);
    return true;
  };

  // .ad-slot__body 안에 광고 단위 삽입(콘텐츠 하단 슬롯이 있을 때만).
  App.loadAds = function () {
    var cfg = App.config();
    var id = cfg.ADSENSE_CLIENT_ID;
    if (App.isPlaceholder(id)) return; // 실제 ID 없으면 광고 미로드

    if (!App.injectAdsenseLoader()) return;

    var bodies = document.querySelectorAll(".ad-slot__body");
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i].dataset.adFilled) continue;
      bodies[i].dataset.adFilled = "1";
      var ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", id);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      bodies[i].appendChild(ins);
      try { (global.adsbygoogle = global.adsbygoogle || []).push({}); } catch (e) { /* 무시 */ }
    }
  };

  /* --- 공통 UI 바인딩 -------------------------------------------- */
  // 이미지 폴백 일괄 바인딩 + 광고 로드 + 푸터 연도/이메일 채움
  App.initCommon = function () {
    // 이미지 폴백
    var imgs = document.querySelectorAll("img[data-fallback]");
    for (var i = 0; i < imgs.length; i++) App.attachImageFallback(imgs[i]);

    // 푸터 이메일(placeholder 아니면 노출)
    var cfg = App.config();
    var mails = document.querySelectorAll("[data-contact-email]");
    for (var j = 0; j < mails.length; j++) {
      var email = cfg.CONTACT_EMAIL && !App.isPlaceholder(cfg.CONTACT_EMAIL)
        ? cfg.CONTACT_EMAIL : "roclxo@gmail.com";
      mails[j].textContent = email;
      if (mails[j].tagName === "A") mails[j].setAttribute("href", "mailto:" + email);
    }

    // 쿠팡 버튼 placeholder 링크 → 검색 URL 폴백
    App.bindCoupangLinks();

    // 공유 버튼(data-share) 바인딩 — 정적 상세·글 페이지에서 사용
    App.bindShareButtons();

    // 광고(애드센스)
    // - 실제 ID면 로더는 모든 페이지 head에 1회 주입(심사·자동광고용).
    // - 광고 단위 push 는 콘텐츠 하단 .ad-slot 이 있는 페이지에서만.
    if (document.querySelector(".ad-slot")) {
      App.loadAds();
    } else {
      App.injectAdsenseLoader();
    }
  };

  global.App = App;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", App.initCommon);
  } else {
    App.initCommon();
  }
})(window);
