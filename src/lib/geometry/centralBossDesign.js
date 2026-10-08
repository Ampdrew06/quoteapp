import {buildCentralBossTrussAudit} from './centralBossTrussAudit';
import {solveFacetEavesGeometry} from './facetEavesGeometry';
import {alignChamferedLathEaves} from './alignChamferedLathEaves';
import {buildDefaultFrontRafterLayout} from '../Manufacturing/rafterLayoutBuilder';

export const CENTRAL_BOSS = 'central';
export const OFFSET_BOSSES = 'offset';
export const isCentralBossDesign = inputs => inputs?.roofStyle === 'hippedLeanTo' && inputs?.bossArrangement === CENTRAL_BOSS;
export function normalizeBossArrangementInputs(inputs={}) {
 if(!isCentralBossDesign(inputs))return {...inputs,bossArrangement:OFFSET_BOSSES};
 const width=Number(inputs.internalWidthMM ?? inputs.widthMM ?? 0);
 return {...inputs,bossArrangement:CENTRAL_BOSS,hippedSides:'both',leftHip:true,rightHip:true,
  leftHipWidthMM:width/2,rightHipWidthMM:width/2,requestedLeftSidePitchDeg:null,
  requestedRightSidePitchDeg:null,centralGussetWidthMM:595,designIntegrationStatus:'costing'};
}
export function buildCentralBossDesign({inputs={},materials={}}={}) {
 const resolved=normalizeBossArrangementInputs({...inputs,roofStyle:'hippedLeanTo',bossArrangement:CENTRAL_BOSS});
 const widthMM=Number(resolved.internalWidthMM ?? resolved.widthMM),projectionMM=Number(resolved.internalProjectionMM ?? resolved.projMM);
 const frontPitchDeg=Number(resolved.pitchDeg ?? 15);
 const args={widthMM,projectionMM,frontPitchDeg,gussetWidthMM:595,
  memberDepthMM:Number(materials.rafter_depth_mm ?? 220),flangeWidthMM:45,
  ringBeamHeightMM:Number(materials.ring_beam_height_mm ?? 40)};
 const initial=buildCentralBossTrussAudit(args);
 if(!initial.valid)return initial;
 if(inputs.sideSoffitMode==='specified' && !(Number(inputs.specifiedSideSoffitMM)>0))return {valid:false,errors:['Enter the required side soffit size.']};
 const eaves=alignChamferedLathEaves(solveFacetEavesGeometry({
  requestedReferenceSoffitMM:Number(inputs.soffit_mm ?? inputs.eavesOverhangMM ?? 150),
  referencePitchDeg:frontPitchDeg,leftPitchDeg:initial.sidePitchDeg,rightPitchDeg:initial.sidePitchDeg,
  hasLeftFacet:true,hasRightFacet:true,materials,minimumSoffitMM:25,manufacturingRoundIncrementMM:5,
  sideSoffitControl:inputs.sideSoffitMode==='specified' || inputs.sideSoffitMode==='none' ? {
   mode:inputs.sideSoffitMode,side:inputs.sideSoffitControlSide==='right'?'right':'left',
   requestedProjectionMM:Number(inputs.specifiedSideSoffitMM ?? 0)} : null,
  fasciaThicknessMM:Number(materials.fascia_thickness_mm ?? 10),
  plyProjectionAllowanceMM:Number(materials.ply_projection_allowance_mm ?? 5),fasciaLipMM:Number(materials.fascia_lip_mm ?? 25),
 }));
 if(!eaves.solutionValid)return {valid:false,errors:['The central-boss eaves could not satisfy the selected soffit requirement.']};
 const truss=buildCentralBossTrussAudit({...args,sideHfcMM:eaves.left.geometry.raw.manufacturedHorizontalFootCutMM});
 if(!truss.valid)return truss;
 const layout=buildDefaultFrontRafterLayout({widthMM,leftBossXMM:widthMM/2,rightBossXMM:widthMM/2,
  hasLeftHip:true,hasRightHip:true,spacingMM:Number(materials.rafter_spacing_mm ?? 665)});
 // One physical boss and one aligned front rafter, rather than two coincident members.
 const centre=layout.centreRafters.slice(0,1).map(r=>({...r,id:'front-central-boss-rafter',bossSide:'central'}));
 const allRafters=[...layout.leftJackRafters,...centre,...layout.rightJackRafters].sort((a,b)=>a.centreMM-b.centreMM);
 const front=eaves.referenceGeometry.raw;
 return {...truss,readOnly:true,designIntegrationStatus:'costing',resolvedInputs:resolved,eaves,
  bossQty:1,hipQty:2,bossRafterCount:1,frontRafterLayout:{...layout,centreRafters:centre,allRafters,bossRafterCount:1,totalRafterCount:allRafters.length},
  frontFoot:{hfcMM:front.manufacturedHorizontalFootCutMM,vfcMM:front.manufacturedPlumbCutHeightMM},
  sideFoot:{hfcMM:eaves.left.geometry.raw.manufacturedHorizontalFootCutMM,vfcMM:eaves.left.geometry.raw.manufacturedPlumbCutHeightMM},
  externalWidthMM:widthMM+eaves.left.manufacturedHorizontalFootRunMM+eaves.right.manufacturedHorizontalFootRunMM,
  externalProjectionMM:projectionMM+eaves.referenceBaseWidthMM,
  assumptions:truss.assumptions.filter(note=>!note.startsWith('153mm')).map(note=>note.replace('No cost or loading quantities are integrated yet.','Costing and manufacture quantities are integrated.')).concat('D/O preview uses the existing soffit solver and chamfered-lath outside-height alignment. Summary and quotation costing use this geometry. Manufacture dimensions use this geometry.'),
 };
}
