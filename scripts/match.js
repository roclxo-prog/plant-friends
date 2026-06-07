/* =====================================================================
   scripts/match.js — 매칭 알고리즘 v4 (정밀도 + 다양성)
   DOM·fetch 의존 없음 → 단독 테스트 가능.
   matchPlants(answers, plants) → 추천 식물 3종 배열 반환(각 원소는 {...plant,_match}).
   answers = { light, water, purpose, place, pet, size, interest }
   설계 출처: docs/matching-v4.md

   핵심 원칙(v4):
   - STEP A: pet==='yes' → toxic_to_pets===true 전면 제외(가장 강한 하드 필터, 절대 완화 안 함).
   - STEP B: purpose 일치 식물만 1차 후보(하드 필터). 풀<3이면 base로 완화(relaxed:'purpose').
   - STEP C: 7차원 점수화 + 난이도 소프트 보너스(매우쉬움+6/쉬움+3/보통0). common 보너스 폐지.
   - tie-break: 답조합 salt 기반 FNV-1a 해시 jitter(진폭 EPS=6, 정밀 가중치보다 작음)
               → 같은 답=결정론, 답 바뀌면 동점군 분산. 다층 비교자(final↓→난이도↑→jitter↓→id).
   - 최소 3종 보장(단계적 완화, relaxed 기록). level 점수 제거(들어와도 무시).
   ===================================================================== */
(function (global) {
  "use strict";

  var DIFFICULTY_ORDER = { "매우 쉬움": 0, "쉬움": 1, "보통": 2 };

  // ── 가중치 (docs/matching-v4.md §3) ──
  var WEIGHTS = {
    purpose: 40,    // 하드 필터 통과 종 베이스 가산(서열 안정화)
    interest: 30,   // 보는재미 정확 일치
    place: 14,      // 장소 정확 일치(명목척도)
    size: 12,       // 크기 정확 일치
    size_near: 5,   //   크기 인접(small↔medium, medium↔large)
    light: 9,       // 빛 정확 일치
    light_near: 4,  //   빛 인접(low↔mid, mid↔high)
    water: 9,       // 물 정확 일치
    water_near: 4,  //   물 인접
    easy_vv: 6,     // 난이도 '매우 쉬움'(소프트 선호)
    easy_v: 3       // 난이도 '쉬움'
  };
  var EPS = 6.0;    // 다양성 jitter 진폭(정밀 가중치보다 작아 동점군 내부만 흔듦)

  var ORD = { low: 0, mid: 1, high: 2 };               // 빛·물 순서척도
  var SIZE_ORD = { small: 0, medium: 1, large: 2 };    // 크기 순서척도

  function diffRank(p) {
    var r = DIFFICULTY_ORDER[p.difficulty];
    return typeof r === "number" ? r : 99; // 알 수 없는 난이도는 뒤로
  }

  function inTags(tags, val) {
    return !!val && Array.isArray(tags) && tags.indexOf(val) !== -1;
  }

  // 순서척도 인접 부분점수: 정확 불일치 시 옆 칸이면 nearBonus.
  function proximity(tags, val, nearBonus) {
    if (!(val in ORD) || !Array.isArray(tags)) return 0;
    var best = 0;
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (t in ORD && Math.abs(ORD[t] - ORD[val]) === 1) {
        if (nearBonus > best) best = nearBonus;
      }
    }
    return best;
  }

  function sizeScore(p, a) {
    if (!a.size) return 0;
    if (p.size === a.size) return WEIGHTS.size;
    if ((p.size in SIZE_ORD) && (a.size in SIZE_ORD) &&
        Math.abs(SIZE_ORD[p.size] - SIZE_ORD[a.size]) === 1) {
      return WEIGHTS.size_near;
    }
    return 0;
  }

  // 본 점수(난이도 소프트 보너스 포함, jitter 제외).
  function score(p, a) {
    var s = 0;
    if (inTags(p.tags_purpose, a.purpose)) s += WEIGHTS.purpose;
    if (inTags(p.tags_interest, a.interest)) s += WEIGHTS.interest;
    if (inTags(p.tags_place, a.place)) s += WEIGHTS.place;
    s += sizeScore(p, a);
    if (inTags(p.tags_light, a.light)) s += WEIGHTS.light;
    else s += proximity(p.tags_light, a.light, WEIGHTS.light_near);
    if (inTags(p.tags_water, a.water)) s += WEIGHTS.water;
    else s += proximity(p.tags_water, a.water, WEIGHTS.water_near);
    if (p.difficulty === "매우 쉬움") s += WEIGHTS.easy_vv;
    else if (p.difficulty === "쉬움") s += WEIGHTS.easy_v;
    return s;
  }

  // FNV-1a 32bit 해시(결정적). 부호 없는 정수 반환.
  function fnv1a32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      // h *= 16777619 (32bit)
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  // 답 조합 서명(salt). 답이 같으면 동일 → 결정론.
  function saltOf(a) {
    return [a.light, a.water, a.purpose, a.place, a.pet, a.size, a.interest]
      .map(function (v) { return v == null ? "" : String(v); })
      .join("|");
  }

  // 0..1 결정적 jitter (id+salt 종속).
  function jitterOf(id, salt) {
    return (fnv1a32(salt + "|" + String(id)) % 100000) / 100000;
  }

  // 다층 비교자: final(점수+jitter*EPS)↓ → 난이도↑ → jitter↓ → id 사전순.
  function makeSorter(a, salt) {
    return function (x, y) {
      var jx = jitterOf(x.id, salt), jy = jitterOf(y.id, salt);
      var fx = score(x, a) + jx * EPS, fy = score(y, a) + jy * EPS;
      if (fx !== fy) return fy - fx;            // 1) final 내림차순
      var dr = diffRank(x) - diffRank(y);
      if (dr) return dr;                         // 2) 난이도 오름차순(쉬운 우선)
      if (jx !== jy) return jy - jx;             // 3) jitter 내림차순
      var ix = String(x.id), iy = String(y.id);  // 4) id 사전순(최종 안정)
      return ix < iy ? -1 : (ix > iy ? 1 : 0);
    };
  }

  // 반환 형태: {...plant, _match{...}} 얕은 복사(원본 plants 오염 방지).
  function buildResult(p, a, tier, relaxed) {
    // *Match 불리언은 '정확 일치' 기준만(근접 부분점수는 score에만 반영).
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
      score: score(p, a),  // 본 점수(jitter 제외, 표시·디버그용)
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
   * v4 매칭 + 최소 3종 보장.
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
    var salt = saltOf(a);
    var sortBy = makeSorter(a, salt);

    // ── STEP A. 안전 필터(pet) — 가장 강한 하드 필터, 절대 완화 안 함 ──
    var base, petApplied;
    if (petYes) {
      var safe = plants.filter(function (p) { return p.toxic_to_pets !== true; });
      if (safe.length < 3) { base = plants; petApplied = false; } // 방어(실데이터상 발생 안 함)
      else { base = safe; petApplied = true; }
    } else {
      base = plants; petApplied = false;
    }

    var relaxed = []; // 완화 사유 누적(결과에 정직히 표기)

    // ── STEP B. 목적 하드 필터 — 풀<3이면 base로 완화 ──
    var pPool;
    if (purpose) {
      pPool = base.filter(function (p) { return inTags(p.tags_purpose, purpose); });
      if (pPool.length < 3) { relaxed.push("purpose"); pPool = base; }
    } else {
      pPool = base; // 목적 미응답(방어). 전제상 거의 없음.
    }

    // ── STEP C. 점수 정렬(+jitter) → 상위 3 선택 ──
    var ranked = pPool.slice().sort(sortBy);

    var picks = [];   // {plant, tier}
    var have = {};
    function take(list, tier) {
      for (var i = 0; i < list.length; i++) {
        if (picks.length >= 3) break;
        var p = list[i];
        if (!have[p.id]) { have[p.id] = true; picks.push({ plant: p, tier: tier }); }
      }
    }
    take(ranked, "primary");

    // ── STEP D. 최소 3종 보장 / 단계적 완화 ──
    if (picks.length < 3 && purpose && relaxed.indexOf("purpose") === -1) {
      // purpose 풀이 3을 못 채운 경우(중복 등) → base 점수 상위로 완화.
      relaxed.push("purpose");
      take(base.slice().sort(sortBy), "fill");
    }
    if (picks.length < 3) {
      // base 전체에서 마저 채움(이미 위에서 base였을 수도 있으나 안전).
      take(base.slice().sort(sortBy), "fill");
    }
    if (picks.length < 3 && petApplied) {
      // ⑤ 방어 최후: pet 필터 해제(실데이터상 도달 불가, 안전망).
      relaxed.push("pet-relaxed");
      take(plants.slice().sort(sortBy), "fill");
    }

    // ── interest 정직 안내: 상위3 중 interest 불일치 있고 사용자가 interest 선택 시 기록 ──
    if (interest) {
      var anyInterestMiss = picks.slice(0, 3).some(function (x) {
        return !inTags(x.plant.tags_interest, interest);
      });
      if (anyInterestMiss && relaxed.indexOf("interest") === -1) relaxed.push("interest");
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
