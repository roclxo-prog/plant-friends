/* Detailed analysis of AC-2.4 interest <2 cases: are they all legitimate (primary pool genuinely <2)? */
const path = require("path");
const plants = require(path.join(__dirname, "..", "packages", "plants", "plants.json"));
const { matchPlants } = require(path.join(__dirname, "..", "scripts", "match.js"));

const LIGHT=["low","mid","high"],WATER=["low","mid","high"],PURPOSE=["air","deco","gift","harvest"],
PLACE=["living","window","bathroom","desk"],PET=["yes","no"],SIZE=["small","medium","large"],INTEREST=["flower","foliage","fruit"];
function has(p,f,v){return Array.isArray(p[f])&&p[f].includes(v);}
function primarySize(a){let base=plants;if(a.pet==="yes"){const s=plants.filter(p=>p.toxic_to_pets!==true);base=s.length<3?plants:s;}let pp=a.purpose?base.filter(p=>has(p,"tags_purpose",a.purpose)):base;let pr=a.interest?pp.filter(p=>has(p,"tags_interest",a.interest)):pp;return pr.length;}

let lt2=0, lt2_legit=0, lt2_illegit=0;
const illegitSamples=[];
const breakdown={}; // purpose+interest+pet -> count of <2

for(const light of LIGHT)for(const water of WATER)for(const purpose of PURPOSE)for(const place of PLACE)for(const pet of PET)for(const size of SIZE)for(const interest of INTEREST){
  const a={light,water,purpose,place,pet,size,interest};
  const r=matchPlants(a,plants);
  const im=r.filter(p=>has(p,"tags_interest",interest)).length;
  if(im<2){
    lt2++;
    const ps=primarySize(a);
    if(ps<2){lt2_legit++; const key=purpose+"+"+interest+(pet==="yes"?"+petSafe":""); breakdown[key]=(breakdown[key]||0)+1;}
    else{lt2_illegit++; if(illegitSamples.length<10) illegitSamples.push({a,im,primarySize:ps,ids:r.map(p=>p.id)});}
  }
}

console.log("interest <2 total:", lt2);
console.log("  legit (primary pool genuinely <2):", lt2_legit);
console.log("  ILLEGIT (primary>=2 but result <2 — real bug):", lt2_illegit);
console.log("\nbreakdown of legit <2 by purpose+interest(+petSafe):");
Object.keys(breakdown).sort().forEach(k=>console.log("  "+k+": "+breakdown[k]));
if(illegitSamples.length){console.log("\nILLEGIT samples:");illegitSamples.forEach(s=>console.log(JSON.stringify(s)));}

// Spec AC-2.9: interest match >=2 excluding safety-filter exception should be >=95%.
// Effective denominator = combos where primary>=2 (i.e. it was achievable). Compute that rate.
let achievable=0, achievableMet=0;
for(const light of LIGHT)for(const water of WATER)for(const purpose of PURPOSE)for(const place of PLACE)for(const pet of PET)for(const size of SIZE)for(const interest of INTEREST){
  const a={light,water,purpose,place,pet,size,interest};
  if(primarySize(a)>=2){achievable++; const r=matchPlants(a,plants); if(r.filter(p=>has(p,"tags_interest",interest)).length>=2) achievableMet++;}
}
console.log("\nAC-2.4 effective rate (combos where >=2 was achievable):");
console.log("  achievable combos:", achievable, "| met:", achievableMet, "=", (achievableMet/achievable*100).toFixed(2)+"%");
