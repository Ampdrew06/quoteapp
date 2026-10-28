const finite=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v));
const deg=r=>r*180/Math.PI;
// Front remains parallel to the rear wall; left/right chamfers are independent.
// Width, projection, side lengths and front length are controlling dimensions.
export function resolveVictorianHippedFacetGeometry({widthMM:w,projectionMM:p,cornerInsetMM:c,leftEndType:left,rightEndType:right,specification:spec={}}){
 const fail=message=>({valid:false,errors:[message]});
 const mode=spec?.mode??'template',lv=left==='victorian',rv=right==='victorian';
 if(!['template','lengths','angles'].includes(mode))return fail('Choose template, measured lengths or angles for facet geometry.');
 let lx=lv?c:0,rx=rv?c:0,ly=lx,ry=rx,closureAdjustmentMM=0,toleranceMM=0;
 const supplied={};
 if(mode!=='template'){
  if(!lv&&!rv)return fail('Custom chamfer geometry requires at least one Victorian end. Use template geometry for this arrangement.');
  for(const [side,active] of [['left',lv],['right',rv]])if(active){
   if(!finite(spec[side+'SideMM'])||Number(spec[side+'SideMM'])<=0||Number(spec[side+'SideMM'])>=p)return fail(`${side==='left'?'Left':'Right'} side length must be positive and less than the projection.`);
  }
  ly=lv?p-Number(spec.leftSideMM):0;ry=rv?p-Number(spec.rightSideMM):0;
  if(mode==='lengths'){
   if(!finite(spec.frontMM)||Number(spec.frontMM)<=0||Number(spec.frontMM)>=w)return fail('The measured front length must be positive and smaller than the width.');
   toleranceMM=Number(spec.toleranceMM??2);
   if(!finite(spec.toleranceMM??2)||!Number.isFinite(toleranceMM)||toleranceMM<0)return fail('Enter a non-negative measurement tolerance.');
   const run=(side,active,y)=>{
    if(!active)return 0;
    const value=spec[side+'ChamferMM'];
    if(!finite(value)||Number(value)<=y)return NaN;
    supplied[side]=Number(value);return Math.sqrt(Number(value)**2-y*y);
   };
   const rawL=run('left',lv,ly),rawR=run('right',rv,ry);
   if(![rawL,rawR].every(Number.isFinite))return fail('Each small-facet length must exceed its projection component.');
   const available=w-Number(spec.frontMM),sum=rawL+rawR;
   if(!(sum>0))return fail('The measured chamfers do not leave a usable front.');
   // Explicit fit for rounded survey lengths; every resulting deviation is
   // returned and must remain inside the user's chosen measurement tolerance.
   closureAdjustmentMM=available-sum;
   lx=available*rawL/sum;rx=available*rawR/sum;
  }else{
   const run=(side,active,y)=>{
    if(!active)return 0;
    const a=spec[side+'CornerDeg'];
    if(!finite(a)||Number(a)<=90||Number(a)>=180)return NaN;
    return y/Math.tan((Number(a)-90)*Math.PI/180);
   };
   lx=run('left',lv,ly);rx=run('right',rv,ry);
   if(![lx,rx].every(Number.isFinite))return fail('Each side-to-small-facet corner angle must be above 90° and below 180°.');
  }
 }
 if(![lx,rx,ly,ry].every(Number.isFinite)||lx<0||rx<0||ly<0||ry<0||lx+rx>=w||(lv&&(!(lx>0&&ly>0)||ly>=p))||(rv&&(!(rx>0&&ry>0)||ry>=p)))return fail('The facet geometry must leave positive side and front lengths inside the roof dimensions.');
 const result=side=>{const active=side==='left'?lv:rv,x=side==='left'?lx:rx,y=side==='left'?ly:ry;
  const length=active?Math.hypot(x,y):0,bearing=active?deg(Math.atan2(y,x)):0;
  return {active,widthRunMM:x,projectionRunMM:y,sideLengthMM:p-y,chamferLengthMM:length,sideCornerDeg:active?90+bearing:null,frontCornerDeg:active?180-bearing:null,suppliedChamferMM:supplied[side]??null,residualMM:mode==='lengths'&&active?length-supplied[side]:0};};
 const leftResult=result('left'),rightResult=result('right');
 if(mode==='lengths'&&[leftResult,rightResult].some(r=>r.active&&Math.abs(r.residualMM)>toleranceMM+1e-7))return fail(`The supplied facet lengths cannot close within ${toleranceMM}mm tolerance. Check the measurements or deliberately revise the tolerance.`);
 return {valid:true,errors:[],mode,left:leftResult,right:rightResult,frontLengthMM:w-lx-rx,closureAdjustmentMM,toleranceMM};
}
