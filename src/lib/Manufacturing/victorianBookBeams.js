// Canonical bay direction lets mirrored beams share one visual cutting page.
// Retain the original bay numbers for the labels printed inside each upstand.
export function victorianBookBeams(beams){
 return beams.map(b=>{const forward=b.upstands.map(u=>Number(u.widthMM.toFixed(3))),reverse=[...forward].reverse(),flip=JSON.stringify(reverse)<JSON.stringify(forward);
  return {manufactureRef:b.reference,cuts:{continuous:b.layers,upstandHeightMM:b.upstands[0]?.heightMM,upstandArrangement:b.upstandArrangement},bays:flip?[...b.upstands].reverse():b.upstands,upstandBayOrder:b.upstands.map((_,i)=>flip?b.upstands.length-i:i+1)};
 });
}
