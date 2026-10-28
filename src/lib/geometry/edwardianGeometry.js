import {resolveEdwardianRearTrusses,resolveEdwardianSideJacks} from './edwardianSideLayout';
import {resolveEdwardianFrontRafters} from './edwardianFrontRafters';
import {buildGableTrussLayout} from './gableGeometry';
import {buildDefaultFrontRafterLayout} from '../Manufacturing/rafterLayoutBuilder';
import {solveFacetEavesGeometry} from './facetEavesGeometry';
import {alignChamferedLathEaves} from './alignChamferedLathEaves';
const rad=d=>d*Math.PI/180;
// Setting-out only. Plan distances are not manufactured member cut lengths.
export function buildEdwardianGeometry({inputs={},materials={},shortRidgeAdjustment=true}={}) {
 const widthMM=Number(inputs.widthMM),projectionMM=Number(inputs.projMM),requestedPitchDeg=Number(inputs.pitchDeg??25),frameMM=Number(inputs.frameThicknessMM??70);
 let pitchDeg=requestedPitchDeg;
 const soffitMM=Number(inputs.soffitMM??150),mode=inputs.ridgeMode??'automatic';
 const invalid=message=>({valid:false,readOnly:true,errors:[message]});
 if(![widthMM,projectionMM,pitchDeg,frameMM,soffitMM].every(Number.isFinite)||widthMM<=0||projectionMM<=0||frameMM<=0||soffitMM<0||pitchDeg<=0||pitchDeg>=90)return invalid('Enter positive dimensions and a pitch between 0 and 90 degrees.');
 if(!['automatic','frontPitch','manual'].includes(mode))return invalid('Select a valid ridge setting-out mode.');
 const depth=Number(materials.rafter_depth_mm??220),ringHeight=Number(materials.ring_beam_height_mm??40);
 const heightAt=angle=>ringHeight+widthMM/2*Math.tan(rad(angle))+(depth+25+3)/Math.cos(rad(angle));
 if(![depth,ringHeight].every(Number.isFinite)||depth<=0||ringHeight<0)return invalid('Valid roof section dimensions are required.');
 if(inputs.maxFinishedHeightMM!=null&&inputs.maxFinishedHeightMM!==''){
  if(mode==='manual')return invalid('Use front pitch rather than a manual ridge position with maximum finished height.');
  const maximum=Number(inputs.maxFinishedHeightMM),target=maximum-5;
  if(!Number.isFinite(maximum)||!Number.isFinite(heightAt(0))||target<=heightAt(0))return invalid('Maximum finished height is too low for this roof section.');
  let lo=0,hi=89;for(let n=0;n<70;n++){const mid=(lo+hi)/2;if(heightAt(mid)<=target)lo=mid;else hi=mid;}pitchDeg=lo;
 }
 const half=widthMM/2,riseMM=half*Math.tan(rad(pitchDeg));
 let frontPitchDeg=pitchDeg,ridgeEndYMM=projectionMM-half;
 if(mode==='frontPitch') {
  frontPitchDeg=Number(inputs.frontPitchDeg);
  if(!Number.isFinite(frontPitchDeg)||frontPitchDeg<=0||frontPitchDeg>=90)return invalid('Front pitch must be between 0 and 90 degrees.');
  ridgeEndYMM=projectionMM-riseMM/Math.tan(rad(frontPitchDeg));
 } else if(mode==='manual') {
  ridgeEndYMM=Number(inputs.ridgePositionMM);
  if(!Number.isFinite(ridgeEndYMM)||ridgeEndYMM<=0||ridgeEndYMM>=projectionMM)return invalid('Ridge position must lie between the house wall and internal front frame.');
  frontPitchDeg=Math.atan2(riseMM,projectionMM-ridgeEndYMM)*180/Math.PI;
 }
 const terminalSetbackMM=33,minimumBossTrussCentreMM=200,maximumAutomaticFrontPitchDeg=35;
 let frontPitchAutoAdjusted=false;
 if(shortRidgeAdjustment&&mode==='automatic'&&ridgeEndYMM-terminalSetbackMM<minimumBossTrussCentreMM){
  ridgeEndYMM=minimumBossTrussCentreMM+terminalSetbackMM;
  const run=projectionMM-ridgeEndYMM;
  const needed=run>0?Math.atan2(riseMM,run)*180/Math.PI:90;
  if(needed>maximumAutomaticFrontPitchDeg+1e-8)return invalid('The short ridge needs a front pitch above 35°. Please select a central-boss Hipped Lean-To or request an admin review.');
  frontPitchDeg=needed;frontPitchAutoAdjusted=true;
 }
 const terminalTrussCentreMM=ridgeEndYMM-terminalSetbackMM;
 if(terminalTrussCentreMM<=31.5)return invalid('The ridge is too close to the house wall for a rear truss run.');
 // The existing builder ends at projection minus half the joist width.
 // Supply an equivalent endpoint so its last centre is our terminal datum.
 const rearMin=inputs.trussMinimumSpacingMM==null||inputs.trussMinimumSpacingMM===''?400:Number(inputs.trussMinimumSpacingMM);
 if(!Number.isFinite(rearMin)||rearMin<100||rearMin>400)return invalid('Admin rear truss minimum must be between 100 and 400mm.');
 let layout=buildGableTrussLayout({externalProjectionMM:terminalTrussCentreMM+22.5,minSpacingMM:rearMin});
 // The fixed terminal truss is exempt from the ordinary minimum spacing.
 // Keep all ordinary gaps within the normal limits; never exceed 700mm.
 if(!layout.valid&&shortRidgeAdjustment){
  const start=31.5,span=terminalTrussCentreMM-start;
  if(span>45){
   const count=Math.ceil(span/700),step=count>1?Math.min(665,(span-45)/(count-1)):span;
   if(count===1||step>=rearMin){
    const centresMM=[start];for(let n=1;n<count;n++)centresMM.push(start+n*step);centresMM.push(terminalTrussCentreMM);
    const gapsMM=centresMM.slice(1).map((v,n)=>v-centresMM[n]);
    layout={valid:true,errors:[],centresMM,gapsMM,trussCount:centresMM.length,rearCentreMM:start,frontCentreMM:terminalTrussCentreMM,secondCentreRetained:Math.abs((centresMM[1]??0)-696.5)<1e-7,minSpacingMM:rearMin,maxSpacingMM:700,targetSpacingMM:665,terminalMinimumExempt:true};
   }
  }
 }
 if(inputs.rearTrussPositionsMM!=null)layout=resolveEdwardianRearTrusses(inputs.rearTrussPositionsMM,terminalTrussCentreMM);
 if(!layout.valid)return invalid(layout.errors.join(' '));
 const none=inputs.sideSoffitMode==='none',restricted=inputs.sideSoffitMode==='specified';
 if(restricted&&!(Number(inputs.specifiedSideSoffitMM)>0))return invalid('Enter the restricted side-soffit envelope.');
 const eaves=alignChamferedLathEaves(solveFacetEavesGeometry({requestedReferenceSoffitMM:soffitMM,referencePitchDeg:frontPitchDeg,leftPitchDeg:pitchDeg,rightPitchDeg:pitchDeg,hasLeftFacet:true,hasRightFacet:true,
  materials:{...materials,side_frame_thickness_mm:frameMM},minimumSoffitMM:25,manufacturingRoundIncrementMM:5,
  sideSoffitControl:restricted||none?{mode:none?'none':'specified',side:'left',requestedProjectionMM:Number(inputs.specifiedSideSoffitMM)}:null,
  fasciaThicknessMM:Number(materials.fascia_thickness_mm??10),plyProjectionAllowanceMM:Number(materials.ply_projection_allowance_mm??5),fasciaLipMM:Number(materials.fascia_lip_mm??25)}));
 if(!eaves.solutionValid)return invalid('The eaves solver cannot satisfy these pitches and soffits.');
 const externalLeftMM=eaves.left.manufacturedHorizontalFootRunMM,externalRightMM=eaves.right.manufacturedHorizontalFootRunMM,externalFrontMM=eaves.referenceBaseWidthMM;
 const ridge={xMM:half,yMM:ridgeEndYMM};
 const frontLayout=buildDefaultFrontRafterLayout({widthMM,leftBossXMM:half,rightBossXMM:half,hasLeftHip:true,hasRightHip:true,spacingMM:665});
 let frontRafters=[...frontLayout.leftJackRafters,...frontLayout.centreRafters.slice(0,1),...frontLayout.rightJackRafters].map(r=>({...r,hipMeetingYMM:projectionMM-(projectionMM-ridgeEndYMM)*Math.min(r.centreMM,widthMM-r.centreMM)/half}));
 const manualFront=inputs.frontRafterPositionsMM!==undefined&&inputs.frontRafterPositionsMM!==null;
 let frontRafterWarnings=[];
 if(manualFront){
  const resolved=resolveEdwardianFrontRafters({positions:inputs.frontRafterPositionsMM,widthMM,ridgeEndYMM,projectionMM,allowWideGaps:inputs.frontRafterSpacingOverride===true});
  if(!resolved.valid)return invalid(resolved.errors.join(' '));
  frontRafters=resolved.rafters;frontRafterWarnings=resolved.warnings;
 }
 const sideLayout=buildGableTrussLayout({externalProjectionMM:projectionMM+22.5,rearCentreMM:terminalTrussCentreMM,secondCentreMM:terminalTrussCentreMM+665});
 if(!sideLayout.valid&&!inputs.sideJackPositionsMM)return invalid('Side jack spacing: '+sideLayout.errors.join(' '));
 let sideJacks=(sideLayout.centresMM||[]).slice(1,-1).flatMap(positionMM=>['left','right'].map(side=>({id:`side-${side}-jack-${positionMM}`,side,positionMM,hipMeetingXMM:half*(projectionMM-positionMM)/(projectionMM-ridgeEndYMM)})));
 const sideLayouts={};
 for(const side of ['left','right']){
  const positions=inputs.sideJackPositionsMM?.[side];
  if(positions!=null){
   const resolved=resolveEdwardianSideJacks(positions,{side,terminalMM:terminalTrussCentreMM,projectionMM,widthMM,ridgeEndYMM});
   if(!resolved.valid)return invalid(resolved.errors.join(' '));
   sideJacks=[...sideJacks.filter(r=>r.side!==side),...resolved.jacks];sideLayouts[side]=resolved;
  }else if(!sideLayout.valid)return invalid('Side jack spacing: '+sideLayout.errors.join(' '));
  const centresMM=[terminalTrussCentreMM,...sideJacks.filter(r=>r.side===side).map(r=>r.positionMM).sort((a,b)=>a-b),projectionMM];
  sideLayouts[side]={...sideLayout,...sideLayouts[side],centresMM,gapsMM:centresMM.slice(1).map((p,i)=>p-centresMM[i])};
 }
 sideJacks.sort((a,b)=>a.side.localeCompare(b.side)||a.positionMM-b.positionMM);
 const hipPitchDeg=Math.atan2(riseMM,Math.hypot(half,projectionMM-ridgeEndYMM))*180/Math.PI;
 return {valid:true,errors:[],readOnly:true,...(none?{soffitRequestedNone:true}:{}),finishedHeightMM:heightAt(pitchDeg),heightSafetyBufferMM:inputs.maxFinishedHeightMM?5:0,requestedPitchDeg,widthMM,projectionMM,pitchDeg,frontPitchDeg,frontPitchAutoAdjusted,minimumBossTrussCentreMM,maximumAutomaticFrontPitchDeg,frameMM,soffitMM,ridgeMode:mode,ridge,ridgeEndYMM,ridgeSetbackMM:projectionMM-ridgeEndYMM,terminalSetbackMM,terminalTrussCentreMM,riseMM,hipPitchDeg,layout,eaves,frontRafters,manualFront,frontRafterWarnings,sideLayout:sideLayouts.left,sideLayouts,sideJacks,manualSides:inputs.rearTrussPositionsMM!=null||inputs.sideJackPositionsMM!=null,
  externalLeftMM,externalRightMM,externalFrontMM,externalWidthMM:widthMM+externalLeftMM+externalRightMM,externalProjectionMM:projectionMM+externalFrontMM,
  hips:[{side:'left',start:{xMM:0,yMM:projectionMM},end:ridge},{side:'right',start:{xMM:widthMM,yMM:projectionMM},end:ridge}],
  notes:['Plan setting-out only: hip lines meet the internal front corners centrally. External hip feet and member profiles are separate cutting candidates for factory review.',
   'One terminal truss and one boss serve both hips and the front boss rafter. There is no physical ridge timber.',
   'Terminal truss centre is always 33mm behind the ridge point. Current rear truss setting-out retains 45mm joists and 9mm rear packers.',
   `Rear trusses use 665mm target centres within ${rearMin}–700mm, with the fixed terminal truss exempt from the minimum${rearMin<400?' (admin closer-centre override)':''}. Front jack positions reuse the existing Hipped front layout.`,
   'Eaves reuse the shared Hipped soffit solver and chamfered-lath height alignment. External dimensions are manufacturing geometry candidates.',
   'Factory measurements are comparison evidence only. This audit does not alter quotation prices, Summary or manufacture books.']};
}
