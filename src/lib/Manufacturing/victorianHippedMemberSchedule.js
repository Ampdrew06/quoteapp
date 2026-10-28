import {calculateLeanToGeometry} from '../geometry/leanToGeometry';
import {calculateJackHipSetback,calculateSparHookEnd} from '../geometry/hipPerimeterIntersection';
import {buildVictorianHippedRingBeamProfiles} from './victorianHippedRingBeamProfiles';

const rad=d=>d*Math.PI/180;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const length=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);
const onSegment=(p,a,b)=>Math.abs((b.xMM-a.xMM)*(p.yMM-a.yMM)-(b.yMM-a.yMM)*(p.xMM-a.xMM))/Math.max(1,length(a,b))<1e-5&&(p.xMM-a.xMM)*(p.xMM-b.xMM)+(p.yMM-a.yMM)*(p.yMM-b.yMM)<=1e-5;

// Full-width square toe enclosing the actual convex external ply perimeter.
function toe(g,member,widthMM) {
 const plan=length(member.start,member.end),u={x:(member.end.xMM-member.start.xMM)/plan,y:(member.end.yMM-member.start.yMM)/plan},normal={x:-u.y,y:u.x};
 const exit=s=>{
  const origin={xMM:member.end.xMM+normal.x*s,yMM:member.end.yMM+normal.y*s},hits=[];
  g.externalOutline.forEach((a,i)=>{const b=g.externalOutline[(i+1)%g.externalOutline.length],edge={x:b.xMM-a.xMM,y:b.yMM-a.yMM},q={x:a.xMM-origin.xMM,y:a.yMM-origin.yMM},det=cross(u,edge);if(Math.abs(det)<1e-9)return;const t=cross(q,edge)/det,k=cross(q,u)/det;if(t>=-1e-7&&k>=-1e-8&&k<=1+1e-8)hits.push(Math.max(0,t));});
  return hits.length?Math.min(...hits):NaN;
 };
 const samples=[exit(-widthMM/2),exit(widthMM/2),exit(0)];
 g.externalOutline.forEach(p=>{const dx=p.xMM-member.end.xMM,dy=p.yMM-member.end.yMM,s=dx*normal.x+dy*normal.y,t=dx*u.x+dy*u.y;if(Math.abs(s)<=widthMM/2+1e-7&&t>=0)samples.push(t);});
 return {horizontalFootCutMM:Math.max(...samples),firstTrimDistanceMM:Math.min(...samples),samples};
}

export function buildVictorianHippedMemberSchedule({geometry:g,inputs={},materials={}}={}) {
 const fail=errors=>({valid:false,errors,members:[],groups:[]});
 if(!g?.valid)return fail(g?.errors?.length?g.errors:['Valid Victorian Hipped geometry is required.']);
 const beams=buildVictorianHippedRingBeamProfiles({geometry:g,inputs});if(!beams.valid)return fail(beams.errors);
 const controls={wallplateFaceMM:Number(inputs.memberWallplateFaceMM??materials.wallplate_thickness_mm??63),hipBossPlanMM:Number(inputs.hipBossPlanMM??156),bossRafterSlopeMM:Number(inputs.bossRafterSlopeMM??150)};
 if(['memberWallplateFaceMM','hipBossPlanMM','bossRafterSlopeMM'].some(key=>inputs[key]==='')||Object.values(controls).some(v=>!Number.isFinite(v)||v<0))return fail(['Enter non-negative wallplate-face and boss connection allowances.']);
 const depth=220,width=45,members=[],errors=[];
 const plans=[...g.hips.map(h=>({...h,reference:h.reference||h.id,role:'hip'})),...g.rafterLayout.members];
 for(const p of plans){
  const plan=length(p.start,p.end),pitch=p.pitchDeg,c=Math.cos(rad(pitch)),s=Math.sin(rad(pitch));
  const foot=toe(g,p,width),hfc=foot.horizontalFootCutMM,vfc=depth/c-hfc*Math.tan(rad(pitch));
  const axis={x:(p.start.xMM-p.end.xMM)/plan,y:(p.start.yMM-p.end.yMM)/plan};
  let connection=null,facePlan=0,bossPlan=0,bossSlope=0,cutAngle=pitch;
  if(p.role==='jack'){
   const hip=g.hips.find(h=>onSegment(p.start,h.start,h.end));
   if(!hip){errors.push(`${p.reference}: no supporting hip.`);continue;}
   const h={x:hip.end.xMM-hip.start.xMM,y:hip.end.yMM-hip.start.yMM};
   connection=calculateJackHipSetback({hipWidthRunMM:Math.abs(cross(axis,h)),hipProjectionRunMM:Math.abs(axis.x*h.x+axis.y*h.y),facet:'front',hipTimberWidthMM:width,jackTimberWidthMM:width,closestCornerGapMM:5});
   if(!connection.valid){errors.push(`${p.reference}: invalid jack/hip angle.`);continue;}
   connection={...connection,supportingHipRef:hip.reference||hip.id};bossPlan=connection.hipCentrelineSetbackMM;
  }else{
   const wallNormal=Math.abs(axis.y);
   if(!(wallNormal>1e-7)){errors.push(`${p.reference}: member does not cross the wallplate face.`);continue;}
   facePlan=controls.wallplateFaceMM/wallNormal;
   if(p.role==='hip')bossPlan=controls.hipBossPlanMM;
   if(p.role==='boss-rafter')bossSlope=controls.bossRafterSlopeMM;
  }
  const hooked=p.role==='hip'||p.role==='boss-rafter',hook=hooked?calculateSparHookEnd({pitchDeg:pitch,depthMM:depth}):null;
  if(hooked)cutAngle=hook.topCutOffSquareDeg;
  const bottom=(plan-facePlan-bossPlan)/c-bossSlope;
  const top=bottom+hfc/c+(hook?.externalEdgeAdjustmentMM??0);
  const lowerEnd={xMM:bottom*c,yMM:bottom*s},upperFoot={xMM:-hfc,yMM:vfc},upperEnd={xMM:-hfc+top*c,yMM:vfc+top*s};
  if(![hfc,vfc,bottom,top,...foot.samples].every(Number.isFinite)||Math.min(hfc,vfc,bottom,top)<=0){errors.push(`${p.reference}: the foot or connection allowances leave no positive cutting profile.`);continue;}
  members.push({ref:p.reference,id:p.id,type:({hip:'Hip','boss-rafter':'Boss rafter',rafter:'Rafter',jack:'Jack rafter'})[p.role],role:p.role,facetId:p.facetId??null,bossId:p.bossId??null,pitchDeg:pitch,topCutOffSquareDeg:cutAngle,topCutLengthMM:length(lowerEnd,upperEnd),topEdgeMM:top,bottomEdgeMM:bottom,horizontalFootCutMM:hfc,verticalFootCutMM:vfc,firstTrimDistanceMM:foot.firstTrimDistanceMM,planLengthMM:plan,wallplateFacePlanMM:facePlan,bossAllowancePlanMM:p.role==='hip'?bossPlan:0,bossAllowanceSlopeMM:bossSlope,jackConnection:connection,hookAdjustmentMM:hook?.externalEdgeAdjustmentMM??0,reviewRequired:true,points:[{xMM:0,yMM:0},lowerEnd,upperEnd,upperFoot,{xMM:-hfc,yMM:0}].map(q=>({...q,xMM:-q.xMM}))});
 }
 // Wall-side rafters use the established regular lean-to internal cut run.
 // Their foot follows the front eaves, not the removed hipped side facet.
 if(g.wallMembers?.length){
  const raw=calculateLeanToGeometry({widthMM:g.widthMM,projectionMM:g.projectionMM,pitchDeg:g.pitchDeg,soffitDepthMM:g.soffitMM,materials:{...materials,side_frame_thickness_mm:g.frameMM}}).raw;
  const foot=g.eaves.rows.find(e=>e.facetId==='F3'),pitch=g.pitchDeg,c=Math.cos(rad(pitch)),s=Math.sin(rad(pitch));
  const bottom=Number(raw.internalRafterLengthMM),hfc=foot.horizontalFootCutMM,vfc=foot.verticalFootCutMM,top=bottom+hfc/c;
  if(![bottom,hfc,vfc,top].every(Number.isFinite)||Math.min(bottom,hfc,vfc,top)<=0)errors.push('The wall-side rafter does not leave a positive cutting profile.');
  else for(const wall of g.wallMembers){
   const lowerEnd={xMM:bottom*c,yMM:bottom*s},upperFoot={xMM:-hfc,yMM:vfc},upperEnd={xMM:-hfc+top*c,yMM:vfc+top*s};
   members.push({ref:g.manufactureNumbering?.byId[wall.id]||wall.id,id:wall.id,type:'Wall-side rafter',role:'wall-rafter',facetId:'F3',bossId:null,pitchDeg:pitch,topCutOffSquareDeg:pitch,topCutLengthMM:length(lowerEnd,upperEnd),topEdgeMM:top,bottomEdgeMM:bottom,horizontalFootCutMM:hfc,verticalFootCutMM:vfc,firstTrimDistanceMM:hfc,planLengthMM:g.projectionMM,wallplateFacePlanMM:Number(raw.wallplateThicknessMM),bossAllowancePlanMM:0,bossAllowanceSlopeMM:0,jackConnection:null,hookAdjustmentMM:0,ruleSource:'leanToGeometry',reviewRequired:true,points:[{xMM:0,yMM:0},lowerEnd,upperEnd,upperFoot,{xMM:-hfc,yMM:0}].map(q=>({...q,xMM:-q.xMM}))});
  }
 }
 if(errors.length)return fail(errors);
 const groups=new Map();for(const m of members){const key=JSON.stringify([m.role,m.pitchDeg,m.topCutOffSquareDeg,m.topEdgeMM,m.bottomEdgeMM,m.horizontalFootCutMM,m.verticalFootCutMM,m.firstTrimDistanceMM].map(v=>typeof v==='number'?Number(v.toFixed(3)):v));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}
 return {valid:true,errors:[],members,groups:[...groups.values()],controls,reviewRequired:true,counts:{hips:members.filter(m=>m.role==='hip').length,bossRafters:members.filter(m=>m.role==='boss-rafter').length,rafters:members.filter(m=>m.role==='rafter').length,...(g.wallMembers?.length?{wallRafters:g.wallMembers.length}:{}),jacks:members.filter(m=>m.role==='jack').length},datumNote:'Plan centres use the internal frame and wallplate-boss datums. Wallplate face is measured from the house-wall line along the wall normal; hip allowance is additional plan distance, boss-rafter allowance is additional slope length. These inherited allowances require factory confirmation for this style.'};
}
