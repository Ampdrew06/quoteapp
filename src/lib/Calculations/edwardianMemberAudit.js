import {calculateHipManufactureGeometryV2} from '../geometry/hipManufactureGeometryV2';
import {calculateJackHipSetback,calculateSparHookEnd} from '../geometry/hipPerimeterIntersection';
import {calculateJackRafterManufactureGeometry} from '../geometry/jackRafterManufactureGeometry';
// Working connection allowance agreed from the completed Edwardian roof.
export const EDWARDIAN_BOSS_LOWER_GAP_MM = 118;
export const EDWARDIAN_TERMINAL_TRUSS_ASSEMBLY_MM = 45 + 9 + 9;
// Cutting candidates reuse existing profiles; physical checks remain necessary.
export function buildEdwardianMemberAudit({geometry:g}={}) {
 if(!g?.valid)return {valid:false,errors:['Valid Edwardian setting-out is required.'],members:[]};
 const members=[],half=g.widthMM/2,frontRun=g.ridgeSetbackMM;
 const foot=facet=>{const raw=facet==='front'?g.eaves.referenceGeometry.raw:g.eaves.left.geometry.raw;return {horizontalFootCutMM:raw.manufacturedHorizontalFootCutMM,verticalFootCutMM:raw.manufacturedPlumbCutHeightMM};};
 const c=p=>Math.cos(p*Math.PI/180);
 const sides=foot('side'),front=foot('front');
 g.layout.centresMM.forEach((y,i)=>['left','right'].forEach(side=>members.push({id:`truss-${i+1}-${side}`,label:`T${i+1} ${side}`,type:'truss-member',positionMM:y,profile:{valid:true,facetPitchDeg:g.pitchDeg,internalSlopeLengthMM:half/c(g.pitchDeg),externalSlopeLengthMM:(half+sides.horizontalFootCutMM)/c(g.pitchDeg),...sides,topCutOffSquareDeg:g.pitchDeg}})));
 const hook=calculateSparHookEnd({pitchDeg:g.frontPitchDeg});
 const terminalFrontFaceMM=g.terminalTrussCentreMM+EDWARDIAN_TERMINAL_TRUSS_ASSEMBLY_MM/2;
 const bossLowerEndpointMM=terminalFrontFaceMM+EDWARDIAN_BOSS_LOWER_GAP_MM;
 const bossInternalRunMM=g.projectionMM-bossLowerEndpointMM;
 if(g.frontRafters.some(r=>r.role==='boss-rafter'))members.push({id:'front-boss-rafter',label:'Front boss rafter',type:'boss-rafter',positionMM:half,profile:{valid:bossInternalRunMM>0,facetPitchDeg:g.frontPitchDeg,
  internalSlopeLengthMM:bossInternalRunMM/c(g.frontPitchDeg),
  externalSlopeLengthMM:(bossInternalRunMM+front.horizontalFootCutMM)/c(g.frontPitchDeg)+hook.externalEdgeAdjustmentMM,
  ...front,topCutOffSquareDeg:hook.topCutOffSquareDeg,topCutLengthMM:hook.topCutLengthMM,
  sparHookExternalEdgeAdjustmentMM:hook.externalEdgeAdjustmentMM,terminalFrontFaceMM,bossLowerEndpointMM,
  bossConnectionHorizontalGapMM:EDWARDIAN_BOSS_LOWER_GAP_MM,terminalTrussAssemblyMM:EDWARDIAN_TERMINAL_TRUSS_ASSEMBLY_MM,
  connectionAllowanceStatus:'Working factory allowance; review as further roofs are built.'}});
 ['left','right'].forEach(side=>members.push({id:`hip-${side}`,label:`${side} hip`,type:'hip',profile:calculateHipManufactureGeometryV2({hipWidthMM:half,effectivePitchRunMM:frontRun,frontPitchDeg:g.frontPitchDeg,frontBaseWidthMM:g.externalFrontMM,sideBaseWidthMM:side==='left'?g.externalLeftMM:g.externalRightMM,perimeterProjectionRunMM:frontRun})}));
 const jack=(id,label,facet,positionMM,run)=>{
  const connection=calculateJackHipSetback({hipWidthRunMM:half,hipProjectionRunMM:frontRun,facet});
  const profile=calculateJackRafterManufactureGeometry({facetPitchDeg:facet==='front'?g.frontPitchDeg:g.pitchDeg,hipCentrelinePlanRunMM:run,hipCentrelineSetbackMM:connection.hipCentrelineSetbackMM,...foot(facet)});
  members.push({id,label,type:`${facet}-jack`,positionMM,connection,profile});
 };
 g.frontRafters.filter(r=>r.role==='jack').forEach(r=>jack(r.id,`Front jack at ${Math.round(r.centreMM)}mm`,'front',r.centreMM,g.projectionMM-r.hipMeetingYMM));
 g.sideJacks.forEach(r=>jack(r.id,`${r.side} jack at ${Math.round(r.positionMM)}mm`,'side',r.positionMM,r.hipMeetingXMM));
 const errors=members.filter(m=>!m.profile.valid||m.profile.internalSlopeLengthMM<=0||m.profile.externalSlopeLengthMM<=0).map(m=>`${m.label} does not leave a valid positive cut profile.`);
 return {valid:!errors.length,errors,readOnly:true,members,notes:[
 'Truss members reuse the Gable half-span profile. Truss apex joints retain their pitch angle; they do not receive spar-hook deductions.',
 'Front boss rafter: lower cut endpoint is 118mm horizontally forward of the terminal truss front face. This working factory allowance will be reviewed through normal build feedback. Current truss assembly is 63mm (45mm joist + two 9mm faceplates).',
 'Both hips retain the existing 156mm plan terminal deduction. Spar-hook top cuts are capped at 18 degrees; the boss rafter uses the same angle correction as Hipped Lean-To.',
 'Jack lengths use the actual hip centreline intersection, timber-width setback and 5mm closest-corner clearance from the existing Hipped profile builder.',
 'Ridge terminal and truss centre remain separate. Hips use the ridge terminal datum; the front boss rafter uses the terminal truss face and the horizontal connection gap.',
 'The connection gap sets the boss-rafter endpoint geometrically; no fixed amount is added to match a recorded slope length. Position-dependent jack comparisons require the actual installed centre position.',
 'Read-only candidates: these lengths are not yet released into a manufacture book or pricing model.'
 ]};
}
