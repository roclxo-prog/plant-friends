/* 18 named cases from matching-v3.md §6 + relaxed-honesty checks for result.js buildReason */
const path=require("path");
const plants=require(path.join(__dirname,"..","packages","plants","plants.json"));
const {matchPlants}=require(path.join(__dirname,"..","scripts","match.js"));
function has(p,f,v){return Array.isArray(p[f])&&p[f].includes(v);}
let pass=0,fail=0; const fails=[];
function chk(name,cond){if(cond)pass++;else{fail++;fails.push(name);}}

const C={
T1:{light:"high",water:"mid",purpose:"deco",place:"living",pet:"no",size:"medium",interest:"flower"},
T2:{light:"mid",water:"low",purpose:"air",place:"living",pet:"no",size:"large",interest:"foliage"},
T3:{light:"high",water:"high",purpose:"harvest",place:"window",pet:"no",size:"small",interest:"fruit"},
T4:{light:"mid",water:"mid",purpose:"harvest",place:"desk",pet:"no",size:"small",interest:"foliage"},
T5:{light:"high",water:"mid",purpose:"deco",place:"living",pet:"yes",size:"medium",interest:"flower"},
T6:{light:"low",water:"low",purpose:"air",place:"living",pet:"yes",size:"large",interest:"foliage"},
T7:{light:"mid",water:"mid",purpose:"air",place:"window",pet:"no",size:"medium",interest:"flower"},
T8:{light:"high",water:"high",purpose:"air",place:"window",pet:"yes",size:"small",interest:"flower"},
T9:{light:"mid",water:"low",purpose:"gift",place:"desk",pet:"no",size:"small",interest:"fruit"},
T10:{light:"high",water:"mid",purpose:"deco",place:"living",pet:"no",size:"large",interest:"foliage"},
T11:{light:"low",water:"low",purpose:"air",place:"bathroom",pet:"no",size:"small",interest:"foliage"},
T12:{light:"high",water:"high",purpose:"deco",place:"window",pet:"yes",size:"medium",interest:"flower"},
T13:{light:"mid",water:"mid",purpose:"deco",place:"living",pet:"no",size:"medium"},
T14:{purpose:"deco",pet:"no",interest:"flower"},
T15:{light:"high",water:"mid",purpose:"deco",place:"living",pet:"no",size:"medium",interest:"flower"},
T16:{light:"high",water:"mid",purpose:"deco",place:"living",pet:"yes",size:"medium",interest:"foliage"},
T17:{light:"mid",water:"mid",purpose:"harvest",place:"window",pet:"yes",size:"small",interest:"foliage"},
T18:{light:"low",water:"mid",purpose:"air",place:"living",pet:"no",size:"large",interest:"flower"},
};
const r=k=>matchPlants(C[k],plants);
const rel=picks=>{const s=new Set();picks.forEach(p=>(p._match.relaxed||[]).forEach(x=>s.add(x)));return s;};

// common invariants for all
for(const k of Object.keys(C)){const x=r(k);chk(k+" len3",x.length===3);chk(k+" nodup",new Set(x.map(p=>p.id)).size===3);chk(k+" hasMeta",x.every(p=>p._match&&p._match.score>=0&&p._match.score<=10));}

chk("T1 all flower",r("T1").every(p=>has(p,"tags_interest","flower")));
chk("T1 all deco",r("T1").every(p=>has(p,"tags_purpose","deco")));
chk("T1 no adiantum/calathea",!r("T1").some(p=>p.id==="adiantum"||/calathea/.test(p.id)));
chk("T2 all air",r("T2").every(p=>has(p,"tags_purpose","air")));
chk("T3 all harvest",r("T3").every(p=>has(p,"tags_purpose","harvest")));
chk("T4 all harvest",r("T4").every(p=>has(p,"tags_purpose","harvest")));
chk("T5 all flower",r("T5").every(p=>has(p,"tags_interest","flower")));
chk("T5 pet-safe",r("T5").every(p=>p.toxic_to_pets!==true));
chk("T6 all air",r("T6").every(p=>has(p,"tags_purpose","air")));
chk("T6 pet-safe",r("T6").every(p=>p.toxic_to_pets!==true));
chk("T7 all air",r("T7").every(p=>has(p,"tags_purpose","air")));
chk("T7 relaxed-interest",rel(r("T7")).has("interest"));
chk("T8 all air",r("T8").every(p=>has(p,"tags_purpose","air")));
chk("T8 pet-safe",r("T8").every(p=>p.toxic_to_pets!==true));
chk("T8 relaxed-interest",rel(r("T8")).has("interest"));
chk("T9 all gift",r("T9").every(p=>has(p,"tags_purpose","gift")));
chk("T9 relaxed-interest",rel(r("T9")).has("interest"));
chk("T10 all deco+foliage",r("T10").every(p=>has(p,"tags_purpose","deco")&&has(p,"tags_interest","foliage")));
chk("T11 all air",r("T11").every(p=>has(p,"tags_purpose","air")));
chk("T12 all flower+deco+safe",r("T12").every(p=>has(p,"tags_interest","flower")&&has(p,"tags_purpose","deco")&&p.toxic_to_pets!==true));
chk("T13 all deco",r("T13").every(p=>has(p,"tags_purpose","deco")));
chk("T14 all deco+flower",r("T14").every(p=>has(p,"tags_purpose","deco")&&has(p,"tags_interest","flower")));
const t14a=r("T14").map(p=>p.id).join(","),t14b=r("T14").map(p=>p.id).join(",");
chk("T14 deterministic",t14a===t14b);
const t15=[];for(let i=0;i<10;i++)t15.push(r("T15").map(p=>p.id).join(","));
chk("T15 deterministic 10x",new Set(t15).size===1);
chk("T16 safe foliage",r("T16").every(p=>has(p,"tags_interest","foliage")&&p.toxic_to_pets!==true));
chk("T17 harvest+safe",r("T17").every(p=>has(p,"tags_purpose","harvest")&&p.toxic_to_pets!==true));
chk("T18 all air",r("T18").every(p=>has(p,"tags_purpose","air")));
chk("T18 relaxed-interest",rel(r("T18")).has("interest"));

console.log("CASES pass:",pass,"fail:",fail);
if(fails.length)console.log("FAILED:",fails.join(" | "));

// === result.js buildReason honesty (AC-2.5/2.6): air+flower relaxed must NOT claim "flower" ===
// Simulate buildReason logic for T7 (air relaxed interest=flower, pet=no)
function interestLabel(v){return v==="flower"?"꽃":v==="foliage"?"잎·무늬":v==="fruit"?"열매·단풍":"보는 재미";}
function buildReason(plant,a){const m=plant._match||{};
  const petSafe=(a.pet==="yes"&&plant.toxic_to_pets!==true);
  if(petSafe)return"반려동물에게 안전한 식물이에요.";
  if(m.interestMatch){if(a.interest==="flower")return"원하시던 꽃이 피는 식물이에요.";if(a.interest==="foliage")return"잎과 무늬가 멋진 식물이에요.";if(a.interest==="fruit")return"열매·단풍을 볼 수 있는 식물이에요.";}
  if(m.purposeMatch){if(a.purpose==="air")return"공기를 맑게 해 주는 식물이에요.";if(a.purpose==="deco")return"보기 좋게 집을 꾸며 주는 식물이에요.";if(a.purpose==="gift")return"작고 키우기 쉬워 곁에 두기 좋아요.";if(a.purpose==="harvest")return"길러서 드실 수 있는 식물이에요.";}
  if((m.relaxed||[]).indexOf("interest")!==-1&&a.interest)return"딱 ‘"+interestLabel(a.interest)+"’은 아니지만, 원하신 용도에 가장 잘 맞아요.";
  return"(env fallback)";}

let honestyFail=0;
// For T7: any pick that is NOT actually flower must NOT get "원하시던 꽃이..." reason
for(const k of ["T7","T8","T18","T9"]){const picks=r(k);const a=C[k];picks.forEach(p=>{const reason=buildReason(p,a);const isFlowerClaim=reason.indexOf("꽃이 피는")!==-1;const isFruitClaim=reason.indexOf("열매·단풍을 볼")!==-1;const actuallyInterest=has(p,"tags_interest",a.interest);if((isFlowerClaim||isFruitClaim)&&!actuallyInterest){honestyFail++;console.log("HONESTY FAIL",k,p.id,"reason:",reason,"actualInterest:",p.tags_interest);}});}
console.log("buildReason honesty failures (lying about non-matching interest):",honestyFail);
// sample reasons for T7
console.log("\nT7 (air+flower relaxed) sample reasons:");
r("T7").forEach(p=>console.log("  "+p.id+" ["+p.tags_interest+"] ->",buildReason(p,C.T7)));
