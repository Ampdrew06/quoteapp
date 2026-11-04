import {combinationFacetEaves} from './combinationFacetEaves';
import {resolveCombinationFacetGeometry,combinationVictorianSpecification} from './combinationFacetGeometry';
import {applyCombinationRafterLayout} from './combinationRafterLayout';
import {buildEdwardianGeometry} from './edwardianGeometry';
import {buildVictorianGeometry} from './victorianGeometry';
const point=(xMM,yMM)=>({xMM,yMM});
const distance=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
// Ridge-based, equal-pitch template. This is deliberately separate from the
// wallplate-based Victorian Hipped Lean-To and from manufacturing cut geometry.
export function buildCombinationGeometry({inputs={},materials={}}={}){
 const left=inputs.leftSide??'edwardian',right=inputs.rightSide??'victorian';
 if(![left,right].every(s=>['edwardian','victorian'].includes(s)))return {valid:false,errors:['Choose Edwardian or Victorian for each side.']};
 const clean={widthMM:inputs.widthMM,projMM:inputs.projMM,pitchDeg:inputs.pitchDeg??25,frameThicknessMM:Number(inputs.frameThicknessMM??70),soffitMM:inputs.soffitMM??150,maxFinishedHeightMM:inputs.maxFinishedHeightMM,ridgeMode:'automatic'};
 const bothEdwardian=left==='edwardian'&&right==='edwardian';
 const spec=inputs.combinationFacetGeometry;
 const fitted=spec?resolveCombinationFacetGeometry({widthMM:clean.widthMM,projectionMM:clean.projMM,leftSide:left,rightSide:right,specification:spec}):null;
 if(fitted&&!fitted.valid)return fitted;
 if(spec&&!['survey','adjust'].includes(spec.mode)&&left===right&&left==='victorian')clean.victorianFacetGeometry=combinationVictorianSpecification(spec);
 const reference=bothEdwardian?buildEdwardianGeometry({inputs:clean,materials}):buildVictorianGeometry({inputs:clean,materials});
 if(!reference.valid)return reference;
 const w=reference.widthMM,p=reference.projectionMM,ridge=reference.ridge;
 const c=w/(2+Math.SQRT2);let corners=[];
 if(left==='victorian')corners.push(point(0,p-c),point(c,p));else corners.push(point(0,p));
 if(right==='victorian')corners.push(point(w-c,p),point(w,p-c));else corners.push(point(w,p));
 if(fitted)corners=fitted.corners;
 if(!bothEdwardian&&(corners[0].yMM<=ridge.yMM||corners[corners.length-1].yMM<=ridge.yMM))return {valid:false,errors:['The ridge must remain behind both side-to-front corners.']};
 const internalOutline=[point(0,0),...corners,point(w,0)],n=internalOutline.length;
 const preliminary=internalOutline.slice(0,-1).map((a,i)=>{const b=internalOutline[i+1],l=distance(a,b),run=Math.abs((b.xMM-a.xMM)*(ridge.yMM-a.yMM)-(b.yMM-a.yMM)*(ridge.xMM-a.xMM))/l;return {id:`facet-${i+1}`,pitchDeg:Math.atan2(reference.riseMM,run)*180/Math.PI};});
 const survey=!!fitted?.requiresManufactureReview;
 const eaves=survey?combinationFacetEaves({facets:preliminary,reference,inputs,materials}):null;
 if(eaves&&!eaves.valid)return {valid:false,errors:eaves.errors};
 const lines=internalOutline.map((a,i)=>{const b=internalOutline[(i+1)%n],l=distance(a,b),nx=-(b.yMM-a.yMM)/l,ny=(b.xMM-a.xMM)/l;
 const offset=i===n-1?0:survey?eaves.rows[i].plyBaseWidthMM:bothEdwardian?(i===0?reference.externalLeftMM:i===n-2?reference.externalRightMM:reference.externalFrontMM):reference.plyBaseWidthMM;
 return {nx,ny,c:nx*a.xMM+ny*a.yMM+offset};});
 const externalOutline=lines.map((b,i)=>{const a=lines[(i+n-1)%n],d=a.nx*b.ny-b.nx*a.ny;return point((a.c*b.ny-b.c*a.ny)/d,(a.nx*b.c-b.nx*a.c)/d);});
 const facets=internalOutline.slice(0,-1).map((a,i)=>{const b=internalOutline[i+1],l=distance(a,b),run=Math.abs((b.xMM-a.xMM)*(ridge.yMM-a.yMM)-(b.yMM-a.yMM)*(ridge.xMM-a.xMM))/l;return {id:`facet-${i+1}`,start:a,end:b,internalLengthMM:l,externalLengthMM:distance(externalOutline[i],externalOutline[i+1]),pitchDeg:Math.atan2(reference.riseMM,run)*180/Math.PI};});
 const cornerAnglesDeg=corners.map((b,i)=>{const a=internalOutline[i],c2=internalOutline[i+2],u=distance(a,b),v=distance(c2,b);return Math.acos(Math.max(-1,Math.min(1,((a.xMM-b.xMM)*(c2.xMM-b.xMM)+(a.yMM-b.yMM)*(c2.yMM-b.yMM))/(u*v))))*180/Math.PI;});
 const nominalCornerAnglesDeg=left===right?(left==='victorian'?[135,135,135,135]:[90,90]):left==='victorian'?[135,135,90]:[90,135,135];
 const geometry={...(survey?{facetEaves:eaves.rows,variablePitchPricingValidated:true}:{}),...(fitted?{appliedFacetGeometry:fitted,customFacetGeometry:fitted,adjustedAngles:cornerAnglesDeg.some((a,i)=>Math.abs(a-nominalCornerAnglesDeg[i])>1e-7)}:{}),nominalCornerAnglesDeg,valid:true,errors:[],frameMM:reference.frameMM,widthMM:w,projectionMM:p,pitchDeg:reference.pitchDeg,finishedHeightMM:reference.finishedHeightMM,ridge,riseMM:reference.riseMM,internalOutline,externalOutline,facets,cornerAnglesDeg,hips:corners.map(end=>({start:ridge,end})),externalWidthMM:Math.max(...externalOutline.map(a=>a.xMM))-Math.min(...externalOutline.map(a=>a.xMM)),externalProjectionMM:Math.max(...externalOutline.map(a=>a.yMM)),leftSide:left,rightSide:right};
 return applyCombinationRafterLayout(geometry,reference,inputs);
}
