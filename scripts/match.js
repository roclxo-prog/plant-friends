/* =====================================================================
   scripts/match.js — 매칭 알고리즘 (순수 함수)
   DOM·fetch 의존 없음 → 단독 테스트 가능.
   matchPlants(answers, plants) → 추천 식물 3종 배열 반환.
   answers = { light, water, purpose, level }
   ===================================================================== */
(function (global) {
  "use strict";

  var DIFFICULTY_ORDER = { "매우 쉬움": 0, "쉬움": 1, "보통": 2 };

  function diffRank(p) {
    var r = DIFFICULTY_ORDER[p.difficulty];
    return typeof r === "number" ? r : 99; // 알 수 없는 난이도는 뒤로
  }

  /**
   * 점수 매칭 + 정렬 + 최소 3종 보장.
   * @param {{light?:string, water?:string, purpose?:string, level?:string}} answers
   * @param {Array<Object>} plants  plants.json 전체 배열
   * @returns {Array<Object>} 추천 식물 객체 3종
   */
  function matchPlants(answers, plants) {
    answers = answers || {};
    if (!Array.isArray(plants) || plants.length === 0) return [];

    var light = answers.light;
    var water = answers.water;
    var purpose = answers.purpose;
    var isBeginner = answers.level === "beginner";

    // 1) 점수 계산
    var scored = plants.map(function (p) {
      var score = 0;
      if (light && Array.isArray(p.tags_light) && p.tags_light.indexOf(light) !== -1) score += 3;
      if (water && Array.isArray(p.tags_water) && p.tags_water.indexOf(water) !== -1) score += 3;
      if (purpose && Array.isArray(p.tags_purpose) && p.tags_purpose.indexOf(purpose) !== -1) score += 2;
      if (isBeginner && p.difficulty === "매우 쉬움") score += 1;
      return { plant: p, score: score };
    });

    // 2) 정렬: score 내림차순 → 난이도 쉬운 순 → common(true) 우선
    scored.sort(function (a, b) {
      return (b.score - a.score)
        || (diffRank(a.plant) - diffRank(b.plant))
        || ((b.plant.common === true ? 1 : 0) - (a.plant.common === true ? 1 : 0));
    });

    // 3) 유효 후보(점수 > 0)만 우선 선택
    var picked = scored.filter(function (s) { return s.score > 0; })
                       .map(function (s) { return s.plant; });

    // 4) 최소 3종 보장(부족분 채우기)
    if (picked.length < 3) {
      var have = {};
      picked.forEach(function (p) { have[p.id] = true; });

      var fillSort = function (a, b) { return diffRank(a) - diffRank(b); };
      var pushFill = function (list) {
        for (var i = 0; i < list.length; i++) {
          if (picked.length >= 3) break;
          var p = list[i];
          if (!have[p.id]) { picked.push(p); have[p.id] = true; }
        }
      };

      // 4-a) harvest 목적이면 harvest 태그 식물 먼저(상추·바질 우선)
      if (purpose === "harvest") {
        pushFill(plants.filter(function (p) {
          return Array.isArray(p.tags_purpose) && p.tags_purpose.indexOf("harvest") !== -1 && !have[p.id];
        }).sort(fillSort));
      }

      // 4-b) common 입문 식물로 나머지 채움(난이도 쉬운 순)
      pushFill(plants.filter(function (p) {
        return p.common === true && !have[p.id];
      }).sort(fillSort));

      // 4-c) 그래도 부족하면 전체에서 채움(방어)
      pushFill(plants.slice().sort(fillSort));
    }

    // 5) 정확히 3종 반환
    return picked.slice(0, 3);
  }

  // 노출: 브라우저(window) + Node(module.exports) 모두 지원
  global.matchPlants = matchPlants;
  global.DIFFICULTY_ORDER = global.DIFFICULTY_ORDER || DIFFICULTY_ORDER;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { matchPlants: matchPlants, DIFFICULTY_ORDER: DIFFICULTY_ORDER };
  }
})(typeof window !== "undefined" ? window : this);
