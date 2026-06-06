/* =====================================================================
   scripts/match.js — 매칭 알고리즘 v2 (순수 함수)
   DOM·fetch 의존 없음 → 단독 테스트 가능.
   matchPlants(answers, plants) → 추천 식물 3종 배열 반환.
   answers = { light, water, purpose, place, pet, size, interest, level }
   - 필수 3차원(light/water/purpose)만으로도 동작(하위호환).
   - 미응답(undefined/'') 차원은 0점(감점 아님).
   - pet==='yes'면 toxic_to_pets===true 식물 제외(안전 식물만으로 최소 3종 보장).
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

  function scoreOf(p, a) {
    var score = 0;
    if (inTags(p.tags_light, a.light)) score += 3;
    if (inTags(p.tags_water, a.water)) score += 3;
    if (inTags(p.tags_purpose, a.purpose)) score += 2;
    if (inTags(p.tags_place, a.place)) score += 2;
    if (a.size && p.size === a.size) score += 2;
    if (inTags(p.tags_interest, a.interest)) score += 1;
    if (a.level === "beginner" && p.difficulty === "매우 쉬움") score += 1;
    return score;
  }

  /**
   * 점수 매칭 + (반려동물 안전 필터) + 정렬 + 최소 3종 보장.
   * @param {Object} answers { light?, water?, purpose?, place?, pet?, size?, interest?, level? }
   * @param {Array<Object>} plants  plants.json 전체 배열
   * @returns {Array<Object>} 추천 식물 객체 3종
   */
  function matchPlants(answers, plants) {
    answers = answers || {};
    if (!Array.isArray(plants) || plants.length === 0) return [];

    var purpose = answers.purpose;
    var petSafe = answers.pet === "yes"; // 반려동물 있음 → 안전 식물만

    // 0) 반려동물 안전 필터: 후보 풀을 좁힘(단 최소 3종 가능할 때만 적용)
    var safe = petSafe
      ? plants.filter(function (p) { return p.toxic_to_pets !== true; })
      : plants;
    // 안전 식물이 3종 미만이면 필터를 적용하지 않음(방어; 실제 데이터는 충분)
    var pool = (petSafe && safe.length >= 3) ? safe : plants;
    var petFiltered = (petSafe && safe.length >= 3);

    // 1) 점수 계산
    var scored = pool.map(function (p) {
      return { plant: p, score: scoreOf(p, answers) };
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
        pushFill(pool.filter(function (p) {
          return inTags(p.tags_purpose, "harvest") && !have[p.id];
        }).sort(fillSort));
      }

      // 4-b) common 입문 식물로 나머지 채움(난이도 쉬운 순)
      pushFill(pool.filter(function (p) {
        return p.common === true && !have[p.id];
      }).sort(fillSort));

      // 4-c) 그래도 부족하면 후보 풀 전체에서 채움(pet=yes면 안전 풀)
      pushFill(pool.slice().sort(fillSort));

      // 4-d) 방어: pet 필터로 안전 풀이 부족했던 예외 상황에서만 전체 사용
      if (!petFiltered) pushFill(plants.slice().sort(fillSort));
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
