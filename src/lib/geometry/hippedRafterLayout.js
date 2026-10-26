import {resolveLeanToRafterLayout} from './leanToRafterLayout';

export function validateHippedRafterPositions({positions,widthMM}) {
 return resolveLeanToRafterLayout({widthMM,positions,boundaryStartMM:24,boundaryEndMM:Number(widthMM)-24});
}

// Reclassify moved members from their current hip intersection, rather than
// retaining the role they had at their original position.
export function applyHippedFrontRafterPositions(layout,positions,{widthMM,hasLeftHip,hasRightHip}) {
 if(positions==null)return layout;
 const resolved=validateHippedRafterPositions({positions,widthMM});
 if(!resolved.valid)return layout;
 const left=Number(layout.leftBossXMM),right=Number(layout.rightBossXMM);
 const allRafters=resolved.interiorMM.map((centreMM,i)=>{
  const bossSide=hasLeftHip&&Math.abs(centreMM-left)<0.01?'left':hasRightHip&&Math.abs(centreMM-right)<0.01?'right':null;
  const zone=hasLeftHip&&centreMM<left?'left-jack':hasRightHip&&centreMM>right?'right-jack':'centre';
  return {id:`front-manual-${i+1}`,facet:'front',centreMM,defaultCentreMM:centreMM,
   zone,role:bossSide?'boss-rafter':zone==='centre'?'plain':'jack',bossSide,
   isDefaultBossAligned:!!bossSide,isManuallyMoved:true};
 });
 const centreRafters=allRafters.filter(r=>r.zone==='centre');
 const leftJackRafters=allRafters.filter(r=>r.zone==='left-jack');
 const rightJackRafters=allRafters.filter(r=>r.zone==='right-jack');
 return {...layout,allRafters,centreRafters,leftJackRafters,rightJackRafters,
  leftJackCount:leftJackRafters.length,rightJackCount:rightJackRafters.length,
  plainRafterCount:centreRafters.filter(r=>r.role==='plain').length,
  bossRafterCount:centreRafters.filter(r=>r.role==='boss-rafter').length,totalRafterCount:allRafters.length};
}
