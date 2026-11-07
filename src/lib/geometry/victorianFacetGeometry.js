import {solveCombinationSurvey} from './combinationSurveyGeometry';
// Three-facet Victorian front, tangent to one equal-pitch roof.
// The rear corners stay square. Width, projection and measured front are held;
// side/chamfer rounding is fitted only inside the explicitly supplied tolerance.
export function resolveVictorianFacetGeometry({widthMM,projectionMM,specification={}}={}) {
 const w=Number(widthMM),p=Number(projectionMM),s=specification,r=w/2;
 const fail=message=>({valid:false,errors:[message]});
 const number=v=>v!==''&&v!=null&&Number.isFinite(Number(v));
 if(![w,p].every(Number.isFinite)||!(w>0&&p>0))return fail('Enter positive width and projection first.');
 if(s.mode==='survey'){
  const fit=solveCombinationSurvey({widthMM:w,projectionMM:p,leftSide:'victorian',rightSide:'victorian',specification:{...s,mode:'survey',lengthsMM:[s.leftSideMM,s.leftChamferMM,s.frontMM,s.rightChamferMM,s.rightSideMM]}});
  if(!fit.valid)return fit;
  return {...fit,frontMM:fit.lengthsMM[2],left:{sideMM:fit.lengthsMM[0]},right:{sideMM:fit.lengthsMM[4]}};
 }
 if(!['lengths','angles'].includes(s.mode))return fail('Choose measured facet lengths or corner angles.');
 const at=x=>{const depth=2*r*(r-x)/(2*r-x);return {widthRunMM:x,depthMM:depth,sideMM:p-depth,chamferMM:Math.hypot(x,depth),cornerDeg:90+Math.atan2(depth,x)*180/Math.PI};};
 let left,right,toleranceMM=0;
 if(s.mode==='angles') {
  if(!['leftCornerDeg','rightCornerDeg'].every(k=>number(s[k])&&Number(s[k])>90&&Number(s[k])<180))return fail('Both side corner angles must be above 90° and below 180°.');
  const fromAngle=a=>at(r*(1-Math.tan((Number(a)-90)*Math.PI/360)));
  left=fromAngle(s.leftCornerDeg);right=fromAngle(s.rightCornerDeg);
 } else {
  const keys=['leftSideMM','leftChamferMM','frontMM','rightChamferMM','rightSideMM'];
  if(!keys.every(k=>number(s[k])&&Number(s[k])>0))return fail('Enter a positive length for all five facets.');
  toleranceMM=Number(s.toleranceMM??2);
  if(!number(s.toleranceMM??2)||toleranceMM<0)return fail('Enter a non-negative measurement tolerance.');
  const sum=w-Number(s.frontMM),lo=Math.max(1e-6,sum-r+1e-6),hi=Math.min(r-1e-6,sum-1e-6);
  if(!(Number(s.frontMM)<w&&hi>lo))return fail('The front must be shorter than the width and leave two positive angled facets.');
  // Minimise the largest measurement error. The two side runs and chamfer
  // lengths are monotonic on this interval, so the objective is unimodal.
  const error=x=>{const a=at(x),b=at(sum-x);return Math.max(Math.abs(a.sideMM-Number(s.leftSideMM)),Math.abs(a.chamferMM-Number(s.leftChamferMM)),Math.abs(b.chamferMM-Number(s.rightChamferMM)),Math.abs(b.sideMM-Number(s.rightSideMM)));};
  let a=lo,b=hi;for(let n=0;n<100;n++){const u=a+(b-a)/3,v=b-(b-a)/3;if(error(u)<=error(v))b=v;else a=u;}
  left=at((a+b)/2);right=at(sum-(a+b)/2);
  if(error((a+b)/2)>toleranceMM+1e-7)return fail(`These measurements cannot form an equal-pitch Victorian within ${toleranceMM}mm per facet. Check the survey; independent facet pitches require a separate manufacture update.`);
 }
 const frontMM=w-left.widthRunMM-right.widthRunMM;
 if(!(frontMM>0&&left.sideMM>0&&right.sideMM>0))return fail('The angles must leave positive side and front facets.');
 const lengths=[left.sideMM,left.chamferMM,frontMM,right.chamferMM,right.sideMM];
 const supplied=s.mode==='lengths'?[s.leftSideMM,s.leftChamferMM,s.frontMM,s.rightChamferMM,s.rightSideMM].map(Number):null;
 return {valid:true,errors:[],mode:s.mode,toleranceMM,equalPitchValidated:true,left,right,frontMM,lengthsMM:lengths,suppliedMM:supplied,differencesMM:supplied?lengths.map((v,i)=>v-supplied[i]):null,
  cornerAnglesDeg:[left.cornerDeg,270-left.cornerDeg,270-right.cornerDeg,right.cornerDeg],
  corners:[{xMM:0,yMM:left.sideMM},{xMM:left.widthRunMM,yMM:p},{xMM:w-right.widthRunMM,yMM:p},{xMM:w,yMM:right.sideMM}]};
}
