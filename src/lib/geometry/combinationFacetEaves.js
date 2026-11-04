import {solveFacetEavesGeometry} from './facetEavesGeometry';
import {alignChamferedLathEaves} from './alignChamferedLathEaves';
// Reuse the established unequal-pitch foot/eaves alignment, facet by facet.
export function combinationFacetEaves({facets,reference,inputs,materials}){
 const base=reference.plyBaseWidthMM,rows=[];
 for(const f of facets){
  const rule=alignChamferedLathEaves(solveFacetEavesGeometry({requestedReferenceSoffitMM:Number(inputs.soffitMM??150),referencePitchDeg:reference.pitchDeg,leftPitchDeg:f.pitchDeg,rightPitchDeg:reference.pitchDeg,hasLeftFacet:true,hasRightFacet:true,materials:{...materials,side_frame_thickness_mm:Number(inputs.frameThicknessMM??70)},fasciaThicknessMM:Number(materials.fascia_thickness_mm??10),plyProjectionAllowanceMM:Number(materials.ply_projection_allowance_mm??5),fasciaLipMM:Number(materials.fascia_lip_mm??25)}));
  if(!rule.solutionValid)return {valid:false,errors:[`Facet ${f.id}: cannot resolve the unequal-pitch eaves.`]};
  const rawDelta=rule.left.matchedHorizontalFootRunMM-rule.referenceTimberHorizontalFootCutMM,delta=Math.abs(f.pitchDeg-reference.pitchDeg)<1e-7||Math.abs(rawDelta)<1e-6?0:rawDelta;
  const plyBaseWidthMM=base+delta,timberHfcMM=rule.left.matchedHorizontalFootRunMM;
  if(!Number.isFinite(delta)||plyBaseWidthMM<95||timberHfcMM<=0)return {valid:false,errors:[`Facet ${f.id}: the required eaves are too narrow for the ring-beam. Review pitch or soffit.`]};
  rows.push({id:f.id,plyBaseWidthMM,timberHfcMM,pitchDeg:f.pitchDeg,soffitMM:plyBaseWidthMM-Number(inputs.frameThicknessMM??70),eaves:rule});
 }
 return {valid:true,errors:[],rows};
}
