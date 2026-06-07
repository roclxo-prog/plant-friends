/* v3 QA sweep harness — exhaustive combination test of matchPlants */
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
let dupCount = 0;          // duplicates
let toxicExposure = 0;     // pet=yes with toxic plant
let toxicCombos = 0;       // combos with any toxic exposure
let harvestViolation = 0;  // purpose=harvest combo with non-harvest plant
let harvestComboFail = 0;
let purposeCombos = 0;     // air/deco/gift combos
let purposeMatch2plus = 0; // >=2 match
let purposeMatch3 = 0;     // all 3 match
let purposeMatchSum = 0;   // sum of matching plants (for rate)
let interestCombos = 0;    // combos where interest specified & not blocked by pet
let interestMatch2plus = 0;
let interestPrimaryGE3Combos = 0; // primary>=3 expected: all 3 match
let interestPrimaryGE3Fail = 0;
let noticeMismatch = 0;    // relaxed flag vs whether any plant relaxed
let allZeroMatch = 0;

// determinism check holders
const detSamples = [];

function relaxedOf(picks) {
  // union of relaxed across picks
  const s = new Set();
  picks.forEach(p => (p._match.relaxed || []).forEach(r => s.add(r)));
  return s;
}

// precompute primary pool size for a combo (mimic match.js step A-C)
function primarySize(a) {
  let base = plants;
  if (a.pet === "yes") {
    const safe = plants.filter(p => p.toxic_to_pets !== true);
    base = safe.length < 3 ? plants : safe;
  }
  let pPool = a.purpose ? base.filter(p => has(p, "tags_purpose", a.purpose)) : base;
  let primary = a.interest ? pPool.filter(p => has(p, "tags_interest", a.interest)) : pPool;
  return primary.length;
}

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

        // AC-2.7 exactly 3 + no dup
        if (r.length !== 3) failCount3++;
        const ids = new Set(r.map(p => p.id));
        if (ids.size !== r.length) dupCount++;

        // AC-2.1 pet safety
        if (pet === "yes") {
          const toxic = r.filter(p => p.toxic_to_pets === true).length;
          if (toxic > 0) { toxicExposure += toxic; toxicCombos++; }
        }

        // AC-2.2 harvest
        if (purpose === "harvest") {
          harvestComboFail; // placeholder
          const bad = r.filter(p => !has(p, "tags_purpose", "harvest")).length;
          if (bad > 0) { harvestViolation += bad; harvestComboFail++; }
        }

        // AC-2.3 purpose match for air/deco/gift
        if (purpose !== "harvest") {
          purposeCombos++;
          const m = r.filter(p => has(p, "tags_purpose", purpose)).length;
          purposeMatchSum += m;
          if (m >= 2) purposeMatch2plus++;
          if (m === 3) purposeMatch3++;
        }

        // AC-2.4 interest match (exclude combos where pet filter blocks interest below 2)
        // We count all interest combos; report 2+ rate. Also strict: primary>=3 must be all match.
        const ps = primarySize(a);
        interestCombos++;
        const im = r.filter(p => has(p, "tags_interest", interest)).length;
        if (im >= 2) interestMatch2plus++;
        if (ps >= 3) {
          interestPrimaryGE3Combos++;
          if (im !== 3) interestPrimaryGE3Fail++;
        }

        // AC-2.6 notice/relaxed consistency:
        // relaxed flag should be present iff any pick has relaxed entries.
        // Cross-check: if primary < 3 (interest specified) OR purpose pool < 3, relaxed must fire.
        const rel = relaxedOf(r);
        const anyRelaxed = r.some(p => (p._match.relaxed || []).length > 0);
        // expected relaxed: interest specified and primary<3 => "interest" relaxation should occur
        // We verify it is not silently missing when primary<3
        if (ps < 3 && interest && !anyRelaxed) noticeMismatch++;

        // all-zero env detection not separately required
      }

// Determinism: run 10 representative combos 10x
const detCombos = [
  { light:"high",water:"mid",purpose:"deco",place:"living",pet:"no",size:"medium",interest:"flower" },
  { light:"mid",water:"low",purpose:"air",place:"living",pet:"no",size:"large",interest:"foliage" },
  { light:"high",water:"high",purpose:"harvest",place:"window",pet:"no",size:"small",interest:"fruit" },
  { light:"high",water:"mid",purpose:"deco",place:"living",pet:"yes",size:"medium",interest:"flower" },
  { light:"mid",water:"mid",purpose:"air",place:"window",pet:"no",size:"medium",interest:"flower" },
];
let detFail = 0;
for (const a of detCombos) {
  const first = matchPlants(a, plants).map(p => p.id).join(",");
  for (let i = 0; i < 10; i++) {
    const again = matchPlants(a, plants).map(p => p.id).join(",");
    if (again !== first) detFail++;
  }
}

const purposeRate = (purposeMatchSum / (purposeCombos * 3) * 100);
const interest2Rate = (interestMatch2plus / interestCombos * 100);

console.log("=== V3 SWEEP RESULTS ===");
console.log("Total combinations:", total);
console.log("");
console.log("[AC-2.7] not-exactly-3:", failCount3, "| duplicates:", dupCount);
console.log("[AC-2.1] pet=yes toxic exposure (plants):", toxicExposure, "| combos affected:", toxicCombos);
console.log("[AC-2.2] harvest non-harvest exposure (plants):", harvestViolation, "| combos affected:", harvestComboFail);
console.log("[AC-2.3] purpose(air/deco/gift) combos:", purposeCombos);
console.log("         >=2 match:", purposeMatch2plus, "(" + (purposeMatch2plus/purposeCombos*100).toFixed(1) + "%) | all-3:", purposeMatch3);
console.log("         purpose match rate (matching/total slots):", purposeRate.toFixed(2) + "%");
console.log("[AC-2.4] interest combos:", interestCombos, "| >=2 match:", interestMatch2plus, "(" + interest2Rate.toFixed(1) + "%)");
console.log("         primary>=3 combos:", interestPrimaryGE3Combos, "| all-3-match fails:", interestPrimaryGE3Fail);
console.log("[AC-2.6] relaxed-notice missing when primary<3:", noticeMismatch);
console.log("[Determinism] mismatches over 10x runs:", detFail);
