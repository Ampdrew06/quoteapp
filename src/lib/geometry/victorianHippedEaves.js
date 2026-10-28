import {solveFacetEavesGeometry} from './facetEavesGeometry';
import {alignChamferedLathEaves} from './alignChamferedLathEaves';
import {buildChamferedLathHeightAudit} from '../Calculations/chamferedLathHeightAudit';

// Front-led alignment, applied to each facet rather than one uniform offset.
export function resolveVictorianHippedEaves({facets,frontPitchDeg,sidePitchDeg,frameMM,soffitMM,soffitMode,baseWidthMM,materials={},sideSoffitMode='automatic',sideSoffitControlSide='left',specifiedSideSoffitMM}){
 if(!['automatic','specified','none'].includes(sideSoffitMode))return {valid:false,errors:['Choose a valid soffit requirement.']};
 if(sideSoffitMode==='specified'||sideSoffitMode==='none'){
  const none=sideSoffitMode==='none',lip=Number(materials.fascia_lip_mm??25);
  const requested=Number(specifiedSideSoffitMM),hasLeft=facets.some(f=>f.id==='F1'),hasRight=facets.some(f=>f.id==='F5');
  if(!none&&(specifiedSideSoffitMM==null||String(specifiedSideSoffitMM).trim()===''||!Number.isFinite(requested)||requested<0))return {valid:false,errors:['Enter a non-negative required side soffit size.']};
  if(!none&&!hasLeft&&!hasRight)return {valid:false,errors:['Required side soffit needs an active side facet. Choose Automatic for two wall ends.']};
  const rule=alignChamferedLathEaves(solveFacetEavesGeometry({requestedReferenceSoffitMM:soffitMM,referencePitchDeg:frontPitchDeg,leftPitchDeg:hasLeft||hasRight?sidePitchDeg:frontPitchDeg,rightPitchDeg:hasLeft||hasRight?sidePitchDeg:frontPitchDeg,hasLeftFacet:hasLeft||(!hasRight&&none),hasRightFacet:hasRight,materials:{...materials,side_frame_thickness_mm:frameMM},sideSoffitControl:{mode:sideSoffitMode,side:sideSoffitControlSide,requestedProjectionMM:requested},fasciaThicknessMM:Number(materials.fascia_thickness_mm??10),plyProjectionAllowanceMM:Number(materials.ply_projection_allowance_mm??5),fasciaLipMM:lip}));
  if(!rule.solutionValid)return {valid:false,errors:['The requested side soffit cannot form aligned eaves at these pitches.']};
  const frontOnly=none&&!hasLeft&&!hasRight;
  if(frontOnly){rule.referenceBaseWidthMM=rule.left.manufacturedHorizontalFootRunMM;rule.referenceTimberHorizontalFootCutMM=rule.left.matchedHorizontalFootRunMM;rule.effectiveReferenceSoffitMM=0;}
  const target=rule.chamferedLathAlignment.targetFinishedHeightMM,rows=facets.map(f=>{
   const pitchDeg=f.id==='F1'||f.id==='F5'?sidePitchDeg:f.pitchDeg,angle=pitchDeg*Math.PI/180,side=f.id==='F1'?rule.left:f.id==='F5'?rule.right:null,front=f.id==='F3';
   const horizontalFootCutMM=front?rule.referenceTimberHorizontalFootCutMM:side?side.matchedHorizontalFootRunMM:(245/Math.cos(angle)-target)/Math.tan(angle),plyBaseWidthMM=front?rule.referenceBaseWidthMM:side?side.manufacturedHorizontalFootRunMM:horizontalFootCutMM+2,verticalFootCutMM=220/Math.cos(angle)-horizontalFootCutMM*Math.tan(angle);
   return {facetId:f.id,pitchDeg,plyBaseWidthMM,horizontalFootCutMM,verticalFootCutMM,soffitProjectionMM:plyBaseWidthMM-frameMM,soffitStripWidthMM:none?(side?0:front?Math.max(0,rule.effectiveReferenceSoffitMM-lip):Math.max(0,plyBaseWidthMM-frameMM-lip)):front?rule.effectiveReferenceSoffitMM:plyBaseWidthMM-frameMM,targetFinishedHeightMM:target,finishedHeightMM:verticalFootCutMM+25/Math.cos(angle)};
  });
  if(rows.some(r=>![r.plyBaseWidthMM,r.horizontalFootCutMM,r.verticalFootCutMM,r.soffitStripWidthMM].every(Number.isFinite)||r.plyBaseWidthMM<95||r.soffitStripWidthMM<0||r.verticalFootCutMM<=0))return {valid:false,errors:[none?'No soffit cannot be achieved at these pitches while retaining the 95mm ringbeam PSE and aligned fascia. Workshop review is required.':'The requested side soffit leaves insufficient ringbeam/PSE space. Increase the required size.']};
  return {valid:true,errors:[],rows,sideSoffitControl:rule.sideSoffitControl,referenceBaseWidthMM:rule.referenceBaseWidthMM,effectiveReferenceSoffitMM:rule.effectiveReferenceSoffitMM};
 }
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
