import {solveCombinationSurvey} from './combinationSurveyGeometry';
import {resolveVictorianFacetGeometry} from './victorianFacetGeometry';
const numeric=v=>v!==''&&v!=null&&Number.isFinite(Number(v));
export function combinationVictorianSpecification(spec){
 if(!spec)return undefined;
 if(spec.mode==='angles')return {mode:'angles',leftCornerDeg:spec.leftCornerDeg,rightCornerDeg:spec.rightCornerDeg};
 const a=spec.lengthsMM||[];
 return {mode:spec.mode,leftSideMM:a[0],leftChamferMM:a[1],frontMM:a[2],rightChamferMM:a[3],rightSideMM:a[4],toleranceMM:spec.toleranceMM??2};
}
// A chamfer must be tangent to the same equal-pitch roof as its square sides.
// The ridge is fixed by width/2 and projection; only one chamfer degree of
// freedom remains on a mixed roof. Square rear/front Edwardian corners stay fixed.
export function resolveCombinationFacetGeometry({widthMM,projectionMM,leftSide='edwardian',rightSide='victorian',specification={}}={}){
 const fail=message=>({valid:false,errors:[message]});
 const w=Number(widthMM),p=Number(projectionMM),r=w/2,s=specification;
 if(![w,p].every(Number.isFinite)||!(w>0&&p>0))return fail('Enter positive width and projection first.');
 if(![leftSide,rightSide].every(v=>['edwardian','victorian'].includes(v)))return fail('Choose a valid side configuration.');
 if(['survey','adjust'].includes(s.mode))return solveCombinationSurvey({widthMM:w,projectionMM:p,leftSide,rightSide,specification:s});
 if(leftSide===rightSide){
  if(leftSide==='edwardian')return fail('Both Edwardian sides remain square. Change width/projection on Design/Options instead.');
  if(s.mode==='lengths'&&(!Array.isArray(s.lengthsMM)||s.lengthsMM.length!==5))return fail('Enter all five facet lengths.');
  return resolveVictorianFacetGeometry({widthMM:w,projectionMM:p,specification:combinationVictorianSpecification(s)});
 }
 if(!['lengths','angles'].includes(s.mode))return fail('Choose measured facet lengths or a Victorian side corner angle.');
 const leftVictorian=leftSide==='victorian';let x,toleranceMM=0,suppliedMM=null;
 if(s.mode==='lengths'){
  if(!Array.isArray(s.lengthsMM)||s.lengthsMM.length!==4||!s.lengthsMM.every(v=>numeric(v)&&Number(v)>0))return fail('Enter a positive length for all four facets.');
  const tol=s.toleranceMM??2;if(!numeric(tol)||Number(tol)<0)return fail('Enter a non-negative measurement tolerance.');toleranceMM=Number(tol);
  suppliedMM=s.lengthsMM.map(Number);x=w-suppliedMM[leftVictorian?2:1];
 }else{
  if(!numeric(s.cornerDeg)||Number(s.cornerDeg)<=90||Number(s.cornerDeg)>=180)return fail('The Victorian side corner angle must be above 90° and below 180°.');
  x=r*(1-Math.tan((Number(s.cornerDeg)-90)*Math.PI/360));
 }
 if(!(x>1e-6&&x<r-1e-6))return fail('The front facet must lie between half the width and the full width for this equal-pitch half/half shape.');
 const depth=2*r*(r-x)/(2*r-x),side=p-depth,chamfer=Math.hypot(x,depth),front=w-x;
 if(!(side>0&&p-r>79.5&&depth<r))return fail('Insufficient room for the ridge, boss truss and side facet. Review the dimensions/angle.');
 const corner=90+Math.atan2(depth,x)*180/Math.PI;
 const lengthsMM=leftVictorian?[side,chamfer,front,p]:[p,front,chamfer,side];
 const differencesMM=suppliedMM?lengthsMM.map((v,i)=>v-suppliedMM[i]):null;
 if(differencesMM?.some(d=>Math.abs(d)>toleranceMM+1e-7))return fail(`These measurements cannot form a square-based, equal-pitch half/half within ${toleranceMM}mm per facet. Width, projection and the front facet are held; check the survey rather than forcing the roof out of square.`);
 return {valid:true,errors:[],mode:s.mode,equalPitchValidated:true,toleranceMM,lengthsMM,suppliedMM,differencesMM,frontMM:front,cornerAnglesDeg:leftVictorian?[corner,270-corner,90]:[90,270-corner,corner],corners:leftVictorian?[{xMM:0,yMM:side},{xMM:x,yMM:p},{xMM:w,yMM:p}]:[{xMM:0,yMM:p},{xMM:w-x,yMM:p},{xMM:w,yMM:side}]};
}
