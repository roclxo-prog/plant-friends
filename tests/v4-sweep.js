/* v4 QA sweep harness — exhaustive combination test of matchPlants (정밀도+다양성)
   측정: (a)항상 3종 (b)목적 일치율 (c)독성 노출 0 (d)distinct 추천종(커버리지) (e)결정론 */
const path = require("path");
const plants = require(path.join(__dirname, "..", "packages", "plants", "plants.json"));
const { matchPlants } = require(path.join(__dirname, "..", "scripts", "match.js"));

const LIGHT = ["low", "mid", "high"];
const WATER = ["low", "mid", "high"];
const PURPOSE = ["air", "deco", "gift", "harvest"];
const PLACE = ["living", "window", "bathroom", "desk"];
const PET = ["yes", "no"];
const SIZE = ["small", "medium", "large"];
const INTEREST = ["flower", "foliage", "fruit"];

function has(p, field, val) { return Array.isArray(p[field]) && p[field].includes(val); }

let total = 0;
let failCount3 = 0;        // not exactly 3
let dupCount = 0;          // duplicate ids within a combo
let toxicExposure = 0;     // pet=yes with toxic plant (plant count)
let toxicCombos = 0;       // combos with any toxic exposure
let harvestViolation = 0;  // purpose=harvest combo with non-harvest plant
let harvestComboFail = 0;
let purposeCombos = 0;     // air/deco/gift/harvest combos with purpose set
let purposeMatchSum = 0;   // sum of slots whose plant matches purpose
let purposeSlots = 0;      // total slots in purpose combos
let interestCombos = 0;
let interestMatch2plus = 0;
let petSafeFlagBad = 0;    // pet=yes but _match.petSafe !== true

const slotCount = {};      // id -> times recommended (coverage)

function bump(id) { slotCount[id] = (slotCount[id] || 0) + 1; }

for (const light of LIGHT)
 for (const water of WATER)
  for (const purpose of PURPOSE)
   for (const place of PLACE)
    for (const pet of PET)
     for (const size of SIZE)
      for (const interest of INTEREST) {
        const a = { light, water, purpose, place, pet, size, interest };
        total++;
        const r = matchPlants(a, plants);

        // (a) exactly 3 + no dup
        if (r.length !== 3) failCount3++;
        const ids = new Set(r.map(p => p.id));
        if (ids.size !== r.length) dupCount++;
        r.forEach(p => bump(p.id));

        // (c) pet safety — toxic exposure must be 0, petSafe flag must be true
        if (pet === "yes") {
          const toxic = r.filter(p => p.toxic_to_pets === true).length;
          if (toxic > 0) { toxicExposure += toxic; toxicCombos++; }
          r.forEach(p => { if (!(p._match && p._match.petSafe === true)) petSafeFlagBad++; });
        }

        // (b) purpose match rate
        if (purpose) {
          purposeCombos++;
          purposeSlots += r.length;
          const m = r.filter(p => has(p, "tags_purpose", purpose)).length;
          purposeMatchSum += m;
        }
        if (purpose === "harvest") {
          const bad = r.filter(p => !has(p, "tags_purpose", "harvest")).length;
          if (bad > 0) { harvestViolation += bad; harvestComboFail++; }
        }

        // interest >=2 rate (informational)
        interestCombos++;
        const im = r.filter(p => has(p, "tags_interest", interest)).length;
        if (im >= 2) interestMatch2plus++;
      }

// (e) determinism: run representative combos twice, must be identical
const detCombos = [
  { light:"high",water:"mid",purpose:"deco",place:"living",pet:"no",size:"medium",interest:"flower" },
  { light:"mid",water:"low",purpose:"air",place:"living",pet:"no",size:"large",interest:"foliage" },
  { light:"high",water:"high",purpose:"harvest",place:"window",pet:"no",size:"small",interest:"fruit" },
  { light:"high",water:"mid",purpose:"deco",place:"living",pet:"yes",size:"medium",interest:"flower" },
  { light:"mid",water:"mid",purpose:"air",place:"window",pet:"no",size:"medium",interest:"flower" },
  { light:"low",water:"low",purpose:"gift",place:"desk",pet:"yes",size:"small",interest:"foliage" }
];
let detFail = 0;
for (const a of detCombos) {
  const first = matchPlants(a, plants).map(p => p.id).join(",");
  const again = matchPlants(a, plants).map(p => p.id).join(",");
  if (again !== first) detFail++;
}

// coverage metrics
const distinct = Object.keys(slotCount).length;
const neverShown = plants.length - distinct;
const totalSlots = total * 3;
const sortedFreq = Object.entries(slotCount).sort((x, y) => y[1] - x[1]);
const top10 = sortedFreq.slice(0, 10).reduce((s, e) => s + e[1], 0);
const top10Pct = (top10 / totalSlots * 100);

const purposeRate = (purposeMatchSum / purposeSlots * 100);
const interest2Rate = (interestMatch2plus / interestCombos * 100);

console.log("=== V4 SWEEP RESULTS ===");
console.log("Total combinations:", total, "| total slots:", totalSlots);
console.log("");
console.log("(a) exactly-3 fail:", failCount3, "| duplicates within combo:", dupCount,
            "| => always exactly 3:", (failCount3 === 0 && dupCount === 0) ? "YES" : "NO");
console.log("(b) purpose match rate (matching slots / purpose slots):",
            purposeRate.toFixed(2) + "%",
            "| harvest non-harvest exposure:", harvestViolation);
console.log("(c) pet=yes toxic exposure (plants):", toxicExposure,
            "| combos affected:", toxicCombos,
            "| petSafe-flag bad:", petSafeFlagBad,
            "| => toxic exposure 0:", (toxicExposure === 0 && petSafeFlagBad === 0) ? "YES" : "NO");
console.log("(d) distinct recommended species (coverage):", distinct + " / " + plants.length,
            "| never shown:", neverShown,
            "| TOP10 slot share:", top10Pct.toFixed(1) + "%",
            "| => >=150:", (distinct >= 150) ? "YES" : "NO");
console.log("(e) determinism (same answers twice mismatches):", detFail,
            "| => deterministic:", (detFail === 0) ? "YES" : "NO");
console.log("");
console.log("[info] interest >=2 match rate:", interest2Rate.toFixed(1) + "%");
console.log("[info] TOP10 species:", sortedFreq.slice(0, 10).map(e => e[0] + ":" + e[1]).join(", "));

const pass = failCount3 === 0 && dupCount === 0 && toxicExposure === 0 &&
             petSafeFlagBad === 0 && purposeRate === 100 && distinct >= 150 && detFail === 0;
console.log("");
console.log("OVERALL:", pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);
