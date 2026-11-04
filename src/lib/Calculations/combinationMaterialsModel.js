import {combinationVictorianSpecification} from '../geometry/combinationFacetGeometry';
import {buildCombinationGeometry} from '../geometry/combinationGeometry';
import {buildEdwardianMaterialsReconciliation} from './edwardianMaterialsReconciliation';
import {buildVictorianMaterialsReconciliation} from './victorianMaterialsReconciliation';
import {buildVictorianGeometry} from '../geometry/victorianGeometry';
const length=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
function framePerimeter(g,offset){
 const p=g.internalOutline,n=p.length,lines=p.map((a,i)=>{const b=p[(i+1)%n],l=length(a,b),nx=-(b.yMM-a.yMM)/l,ny=(b.xMM-a.xMM)/l;return {nx,ny,c:nx*a.xMM+ny*a.yMM+(i===n-1?0:offset)};});
 const points=lines.map((b,i)=>{const a=lines[(i+n-1)%n],d=a.nx*b.ny-b.nx*a.ny;return {xMM:(a.c*b.ny-b.c*a.ny)/d,yMM:(a.nx*b.c-b.nx*a.c)/d};});
 return points.slice(0,-1).reduce((sum,a,i)=>sum+length(a,points[i+1]),0);
}
// Translate the new editor into the established style-specific input contracts.
// Matching styles run their own complete calculation pipeline, including edits.
export function combinationReferenceInputs(inputs,family){
 const p=inputs.combinationRafterPositionsMM||{},next={...inputs,ridgeMode:'automatic',frameThicknessMM:Number(inputs.frameThicknessMM??70)};
 if(family==='edwardian'){
  next.rearTrussPositionsMM=inputs.combinationRearTrussPositionsMM;
  next.sideJackPositionsMM={left:p['facet-1'],right:p['facet-3']};next.frontRafterPositionsMM=p['facet-2'];next.frontRafterSpacingOverride=inputs.combinationSpacingOverride===true;
 }else{
  next.victorianFacetGeometry=combinationVictorianSpecification(inputs.combinationFacetGeometry);
  next.victorianRearTrussPositionsMM=inputs.combinationRearTrussPositionsMM;
  next.victorianSideJackPositionsMM={left:p['facet-1'],right:p['facet-5']};
  next.victorianFacetPositionsMM=Object.fromEntries(['facet-2','facet-3','facet-4'].filter(k=>p[k]!=null).map(k=>[k,p[k]]));
 }
 return next;
}
export function buildCombinationMaterialsModel({inputs={},materials={}}={}){
 const g=buildCombinationGeometry({inputs,materials});
 if(!g.valid)return {valid:false,errors:g.errors,sections:{}};

 const options={productId:inputs.tileProductId??'britmetShingle',plasticsColour:inputs.plasticsColour??'white',gutterProfile:inputs.gutterProfile??'square'};
 if(g.leftSide===g.rightSide&&!g.variablePitchPricingValidated){
  const family=g.leftSide,referenceInputs=combinationReferenceInputs(inputs,family);
  const model=family==='edwardian'?buildEdwardianMaterialsReconciliation({inputs:referenceInputs,materials}):buildVictorianMaterialsReconciliation({geometry:buildVictorianGeometry({inputs:referenceInputs,materials}),materials,...options});
  return {...model,comparisonStyle:family,geometry:g};
 }
 const template=buildVictorianGeometry({inputs:{widthMM:inputs.widthMM,projMM:inputs.projMM,pitchDeg:inputs.pitchDeg??25,soffitMM:inputs.soffitMM??150,frameThicknessMM:Number(inputs.frameThicknessMM??70),maxFinishedHeightMM:inputs.maxFinishedHeightMM},materials});
 if(!template.valid)return {valid:false,errors:template.errors,sections:{}};
 // The mixed template has three hips and four eaves facets. Carry only shared
 // construction metadata, replacing all polygon, corner and member quantities.
 const geometry={...template,...g,style:'Edwardian / Victorian',combination:g.leftSide!==g.rightSide,frontFacetCount:g.leftSide===g.rightSide?3:2,adjustedAngles:g.adjustedAngles??false,mitresDeg:g.cornerAnglesDeg.map(a=>(180-a)/2),ridgeEndYMM:g.ridge.yMM,
  facets:g.facets.map((f,i)=>({...f,label:`Facet ${i+1}`})),hips:g.hips.map((h,i)=>({...h,id:`H${i+1}`,planLengthMM:length(h.start,h.end),pitchDeg:Math.atan2(g.riseMM,length(h.start,h.end))*180/Math.PI})),
  intermediateBars:g.rafters.filter(r=>r.kind==='boss'),jackRafters:g.rafters.filter(r=>r.kind!=='boss'),
 };
 geometry.framePerimeterMM=framePerimeter(geometry,geometry.frameMM);
 const model=buildVictorianMaterialsReconciliation({geometry,materials,...options});
 return {...model,comparisonStyle:'mixed',geometry};
}
