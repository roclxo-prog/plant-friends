/* =====================================================================
   scripts/match.js — 매칭 알고리즘 v3 (의도 우선 · 순수 함수)
   DOM·fetch 의존 없음 → 단독 테스트 가능.
   matchPlants(answers, plants) → 추천 식물 3종 배열 반환(각 원소는 {...plant,_match}).
   answers = { light, water, purpose, place, pet, size, interest }
   설계 출처: docs/matching-v3.md

   핵심 원칙(의도 우선):
   - STEP A: pet==='yes' → toxic_to_pets===true 전면 제외(가장 강한 하드 필터).
   - STEP B: purpose 일치 식물만 1차 후보(목적 불일치는 상위3 진입 불가).
   - STEP C: interest 일치 우선군 → 불일치 후순위군 2층 분리(우선군 3+면 후순위 배제).
   - STEP D: 환경 점수(빛+3·물+3·장소+2·크기+2)로 후보 내부 정렬.
   - STEP E: 최소 3종 단계적 완화(primary→secondary→purpose-fill→base→pet 해제).
   - level 점수 제거. answers.level 들어와도 무시.
   ===================================================================== */
(function (global) {
  "use strict";

  var DIFFICULTY_ORDER = { "매우 쉬움": 0, "쉬움": 1, "보통": 2 };

  function diffRank(p) {
    var r = DIFFICULTY_ORDER[p.difficulty];
    return typeof r === "number" ? r : 99; // 알 수 없는 난이도는 뒤로
  }

  function inTags(tags, val) {
    return !!val && Array.isArray(tags) && tags.indexOf(val) !== -1;
  }

  // 환경 적합 점수(0~10): 후보 '내부' 정렬에만 사용(자격은 의도가 만든다).
  function envScore(p, a) {
    var s = 0;
    if (inTags(p.tags_light, a.light)) s += 3;
    if (inTags(p.tags_water, a.water)) s += 3;
    if (inTags(p.tags_place, a.place)) s += 2;
    if (a.size && p.size === a.size) s += 2;
    return s;
  }

  // 동률 보너스(정렬 보조): common +0.5, tier===core +0.5, 매우 쉬움 +0.5
  function tieBonus(p) {
    var b = 0;
    if (p.common === true) b += 0.5;
    if (p.tier === "core") b += 0.5;
    if (p.difficulty === "매우 쉬움") b += 0.5;
    return b;
  }

  // 결정론적 정렬: envScore↓ → tieBonus↓ → diffRank↑ → id 사전순
  function makeSorter(a) {
    return function (x, y) {
      var d = envScore(y, a) - envScore(x, a);
      if (d) return d;
      d = tieBonus(y) - tieBonus(x);
      if (d) return d;
      d = diffRank(x) - diffRank(y);
      if (d) return d;
      var ix = String(x.id), iy = String(y.id);
      return ix < iy ? -1 : (ix > iy ? 1 : 0);
    };
  }

  // 반환 형태: {...plant, _match{...}} 얕은 복사(원본 plants 오염 방지)
  function buildResult(p, a, tier, relaxed) {
    var lightMatch = inTags(p.tags_light, a.light);
    var waterMatch = inTags(p.tags_water, a.water);
    var placeMatch = inTags(p.tags_place, a.place);
    var sizeMatch = !!(a.size && p.size === a.size);
    var purposeMatch = inTags(p.tags_purpose, a.purpose);
    var interestMatch = inTags(p.tags_interest, a.interest);

    var reasons = [];
    if (purposeMatch) reasons.push("purpose:" + a.purpose);
    if (interestMatch) reasons.push("interest:" + a.interest);
    if (lightMatch) reasons.push("light:" + a.light);
    if (waterMatch) reasons.push("water:" + a.water);
    if (placeMatch) reasons.push("place:" + a.place);
    if (sizeMatch) reasons.push("size:" + a.size);

    var out = {};
    for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) out[k] = p[k]; }
    out._match = {
      score: envScore(p, a),
      purposeMatch: purposeMatch,
      interestMatch: interestMatch,
      lightMatch: lightMatch,
      waterMatch: waterMatch,
      placeMatch: placeMatch,
      sizeMatch: sizeMatch,
      petSafe: (a.pet === "yes") ? (p.toxic_to_pets !== true) : null,
      tier: tier,
      relaxed: relaxed.slice(),
      reasons: reasons
    };
    return out;
  }

  /**
   * 의도 우선 매칭 + 최소 3종 보장.
   * @param {Object} answers { light?, water?, purpose?, place?, pet?, size?, interest? }
   * @param {Array<Object>} plants  plants.json 전체 배열
   * @returns {Array<Object>} 추천 식물 3종(각 {...plant,_match})
   */
  function matchPlants(answers, plants) {
    answers = answers || {};
    if (!Array.isArray(plants) || plants.length === 0) return [];

    var a = answers;
    var purpose = a.purpose;
    var interest = a.interest;
    var petYes = (a.pet === "yes");
    var sortByEnv = makeSorter(a);

    // ── STEP A. 안전 필터(pet) — 가장 강한 하드 필터 ──
    var base, petApplied;
    if (petYes) {
      var safe = plants.filter(function (p) { return p.toxic_to_pets !== true; });
      if (safe.length < 3) { base = plants; petApplied = false; } // 방어(실데이터상 발생 안 함)
      else { base = safe; petApplied = true; }
    } else {
      base = plants; petApplied = false;
    }

    var relaxed = []; // 완화 사유 누적(결과에 정직히 표기)

    // ── STEP B. 의도 1차 필터(purpose) — 하드, 부족 시 STEP E에서 보충 ──
    var pPool;
    if (purpose) {
      pPool = base.filter(function (p) { return inTags(p.tags_purpose, purpose); });
    } else {
      pPool = base; // 목적 미응답(방어). 전제상 거의 없음.
    }
    if (pPool.length < 3 && purpose) relaxed.push("purpose");

    // ── STEP C. 의도 2차 분리(interest) — 준-하드(우선군 vs 후순위군) ──
    var primary, secondary;
    if (interest) {
      primary = pPool.filter(function (p) { return inTags(p.tags_interest, interest); });
      secondary = pPool.filter(function (p) { return !inTags(p.tags_interest, interest); });
    } else {
      primary = pPool.slice();
      secondary = [];
    }

    // ── STEP D. 환경 점수로 각 군 내부 정렬 ──
    primary = primary.slice().sort(sortByEnv);
    secondary = secondary.slice().sort(sortByEnv);

    // ── STEP E. 결과 조립 — 최소 3종, 의도 최대 유지하며 단계적 완화 ──
    var picks = [];   // {plant, tier}
    var have = {};
    function take(list, tier) {
      for (var i = 0; i < list.length; i++) {
        if (picks.length >= 3) break;
        var p = list[i];
        if (!have[p.id]) { have[p.id] = true; picks.push({ plant: p, tier: tier }); }
      }
    }

    take(primary, "primary"); // ① 목적+보는재미 완전일치(최우선)

    if (picks.length < 3) {
      if (interest) relaxed.push("interest"); // 보는재미 양보 기록
      take(secondary, "secondary"); // ② 목적만 일치
    }

    if (picks.length < 3) {
      // ③ 목적도 부족 → base에서 common 우수종으로 보충
      relaxed.push("purpose-fill");
      var fillPool = base.filter(function (p) { return !have[p.id] && p.common === true; });
      // harvest 특례: 먹는 식물을 원했으면 먹는 것 위주로 먼저
      if (purpose === "harvest") {
        take(fillPool.filter(function (p) { return inTags(p.tags_purpose, "harvest"); }).slice().sort(sortByEnv), "fill");
      }
      take(fillPool.slice().sort(sortByEnv), "fill");
    }

    if (picks.length < 3) {
      // ④ 최후 보충(common 아님 포함)
      take(base.filter(function (p) { return !have[p.id]; }).sort(sortByEnv), "fill");
    }

    if (picks.length < 3 && petApplied) {
      // ⑤ 방어 최후: pet 필터까지 해제(실데이터상 발생 안 함)
      relaxed.push("pet-relaxed");
      take(plants.filter(function (p) { return !have[p.id]; }).sort(sortByEnv), "fill");
    }

    return picks.slice(0, 3).map(function (x) {
      return buildResult(x.plant, a, x.tier, relaxed);
    });
  }

  // 노출: 브라우저(window) + Node(module.exports) 모두 지원
  global.matchPlants = matchPlants;
  global.DIFFICULTY_ORDER = global.DIFFICULTY_ORDER || DIFFICULTY_ORDER;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { matchPlants: matchPlants, DIFFICULTY_ORDER: DIFFICULTY_ORDER };
  }
})(typeof window !== "undefined" ? window : this);
