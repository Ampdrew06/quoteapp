import {solveFacetEavesGeometry} from './facetEavesGeometry';
import {alignChamferedLathEaves} from './alignChamferedLathEaves';
import {buildChamferedLathHeightAudit} from '../Calculations/chamferedLathHeightAudit';

// Front-led alignment, applied to each facet rather than one uniform offset.
export function resolveVictorianHippedEaves({facets,frontPitchDeg,sidePitchDeg,frameMM,soffitMM,soffitMode,baseWidthMM,materials={}}){
 const rows=[];
 for(const f of facets){
  const pitchDeg=f.id==='F1'||f.id==='F5'?sidePitchDeg:f.pitchDeg;
  let plyBaseWidthMM,horizontalFootCutMM,verticalFootCutMM,targetFinishedHeightMM;
  if(soffitMode==='standard'){
   const r=alignChamferedLathEaves(solveFacetEavesGeometry({requestedReferenceSoffitMM:soffitMM,referencePitchDeg:frontPitchDeg,leftPitchDeg:pitchDeg,rightPitchDeg:pitchDeg,hasLeftFacet:true,hasRightFacet:true,materials:{...materials,side_frame_thickness_mm:frameMM},minimumSoffitMM:25,manufacturingRoundIncrementMM:5}));
   if(!r.solutionValid||Math.abs(r.referenceBaseWidthMM-baseWidthMM)>1e-6)return {valid:false,errors:['Eaves alignment would change the requested front soffit. Review the dimensions.']};
   const front=f.id==='F3';
   plyBaseWidthMM=front?r.referenceBaseWidthMM:r.left.manufacturedHorizontalFootRunMM;
   horizontalFootCutMM=front?r.referenceTimberHorizontalFootCutMM:r.left.matchedHorizontalFootRunMM;
   verticalFootCutMM=front?r.targetPlumbCutHeightMM:r.left.matchedPlumbCutHeightMM;
   targetFinishedHeightMM=r.chamferedLathAlignment.targetFinishedHeightMM;
  }else{
   const profile=p=>({pitchDeg:p,horizontalFootRunMM:baseWidthMM,plumbCutHeightMM:220/Math.cos(p*Math.PI/180)-baseWidthMM*Math.tan(p*Math.PI/180)});
   const a=buildChamferedLathHeightAudit({geometry:{frontTemplateDebug:profile(frontPitchDeg),leftTemplateDebug:profile(pitchDeg),hasLeftHip:true}});
   if(!a.valid)return {valid:false,errors:a.errors};
   const r=a.rows.find(row=>row.id==='left');
   plyBaseWidthMM=horizontalFootCutMM=r.candidateHfcMM;verticalFootCutMM=r.candidateVfcMM;targetFinishedHeightMM=a.targetFinishedHeightMM;
  }
  if(![plyBaseWidthMM,horizontalFootCutMM,verticalFootCutMM].every(Number.isFinite)||plyBaseWidthMM<95||verticalFootCutMM<=0)return {valid:false,errors:[`${f.id}: aligned ply base cannot accommodate the 95mm PSE. Review the soffit and pitches.`]};
  rows.push({facetId:f.id,pitchDeg,plyBaseWidthMM,horizontalFootCutMM,verticalFootCutMM,soffitProjectionMM:plyBaseWidthMM-frameMM,targetFinishedHeightMM,finishedHeightMM:verticalFootCutMM+25/Math.cos(pitchDeg*Math.PI/180)});
 }
 return {valid:true,errors:[],rows};
}
