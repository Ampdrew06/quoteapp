import {calculateJackRafterManufactureGeometry} from '../geometry/jackRafterManufactureGeometry';
import {buildVictorianTrussSchedule} from './victorianTrussSchedule';
import {calculateJackHipSetback,calculateSparHookEnd} from '../geometry/hipPerimeterIntersection';
const rad=d=>d*Math.PI/180;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
// Full-width toe intersection with the actual convex exterior, not a 90° corner approximation.
function hipToe(g,h){
 const l=h.planLengthMM,u={x:(h.end.xMM-h.start.xMM)/l,y:(h.end.yMM-h.start.yMM)/l},n={x:-u.y,y:u.x};
 const samples=[-22.5,0,22.5].map(s=>{
  const p={x:h.end.xMM+n.x*s,y:h.end.yMM+n.y*s},hits=[];
  g.externalOutline.forEach((a,i)=>{const b=g.externalOutline[(i+1)%g.externalOutline.length],v={x:b.xMM-a.xMM,y:b.yMM-a.yMM},q={x:a.xMM-p.x,y:a.yMM-p.y},det=cross(u,v);if(Math.abs(det)<1e-9)return;const t=cross(q,v)/det,k=cross(q,u)/det;if(t>=0&&k>=-1e-8&&k<=1+1e-8)hits.push(t);});
  return hits.length?Math.min(...hits):NaN;
 });
 // Also sample the outside mitre vertex: the maximum of the concave exit function can be there.
 g.externalOutline.forEach(p=>{const dx=p.xMM-h.end.xMM,dy=p.yMM-h.end.yMM,s=dx*n.x+dy*n.y,t=dx*u.x+dy*u.y;if(Math.abs(s)<=22.5+1e-7&&t>=0)samples.push(t);});
 return {horizontalFootCutMM:Math.max(...samples),firstTrimDistanceMM:Math.min(...samples)};
}
export function buildVictorianMemberSchedule({geometry:g,materials={}}={}){
 const fail=message=>({valid:false,errors:[message],members:[],groups:[]});
 if(!g?.valid)return fail('Valid Victorian plan required.');
 if(g.adjustedAngles)return fail('Adjusted-angle hip and rafter cutting profiles require a separate eaves/connection review.');
 const trusses=buildVictorianTrussSchedule({geometry:g,materials});if(!trusses.valid)return fail(trusses.errors.join(' '));
 const allowance=Number(g.bossTopContinuationMM??160);
 if(!Number.isFinite(allowance)||allowance<0)return fail('Enter a non-negative sloping boss continuation allowance.');
 const make=(ref,type,pitch,fullTop,hfc,trim)=>{
  const c=Math.cos(rad(pitch)),s=Math.sin(rad(pitch)),depth=220,hook=calculateSparHookEnd({pitchDeg:pitch,depthMM:depth});
  // The allowance fixes the TOP endpoint already. Never deduct the hook adjustment a second time.
  const top=fullTop-allowance,v=depth/c-hfc*Math.tan(rad(pitch));
  const upperFoot={xMM:-hfc,yMM:v},upperEnd={xMM:-hfc+top*c,yMM:v+top*s};
  const endDx=depth*(-s+c*Math.tan(rad(hook.topCutOffSquareDeg))),endDy=depth*(c+s*Math.tan(rad(hook.topCutOffSquareDeg)));
  const lowerEnd={xMM:upperEnd.xMM-endDx,yMM:upperEnd.yMM-endDy},bottom=lowerEnd.xMM*c+lowerEnd.yMM*s;
  return {ref,type,pitchDeg:pitch,topCutOffSquareDeg:hook.topCutOffSquareDeg,topCutLengthMM:hook.topCutLengthMM,topEdgeMM:top,bottomEdgeMM:bottom,horizontalFootCutMM:hfc,verticalFootCutMM:v,firstTrimDistanceMM:trim,
   points:[{xMM:0,yMM:0},lowerEnd,upperEnd,upperFoot,{xMM:-hfc,yMM:0}].map(p=>({...p,xMM:-p.xMM}))};
 };
 const members=g.hips.map(h=>{const toe=hipToe(g,h),c=Math.cos(rad(h.pitchDeg));return make(h.id,'Hip',h.pitchDeg,Math.hypot(h.planLengthMM,g.riseMM)+toe.horizontalFootCutMM/c,toe.horizontalFootCutMM,toe.firstTrimDistanceMM);});
 g.intermediateBars.forEach(r=>{const f=g.facets.find(f=>f.id===r.facetId),plan=Math.hypot(r.end.xMM-r.start.xMM,r.end.yMM-r.start.yMM),hfc=trusses.truss.members[0].hfcMM;
  members.push(make(r.id,'Intermediate rafter',f.pitchDeg,(plan+hfc)/Math.cos(rad(f.pitchDeg)),hfc,null));});
 const jackErrors=[];
 g.jackRafters.forEach(r=>{
  const f=g.facets.find(f=>f.id===r.facetId),plan=Math.hypot(r.end.xMM-r.start.xMM,r.end.yMM-r.start.yMM),d={x:(r.start.xMM-r.end.xMM)/plan,y:(r.start.yMM-r.end.yMM)/plan};
  const hip=g.hips.find(h=>{const vx=h.end.xMM-h.start.xMM,vy=h.end.yMM-h.start.yMM,l2=vx*vx+vy*vy,t=((r.start.xMM-h.start.xMM)*vx+(r.start.yMM-h.start.yMM)*vy)/l2;return t>=-1e-7&&t<=1+1e-7&&Math.abs(vx*(r.start.yMM-h.start.yMM)-vy*(r.start.xMM-h.start.xMM))/Math.sqrt(l2)<1e-5;});
  if(!hip){jackErrors.push(`${r.id}: no supporting hip intersection.`);return;}
  const hv={x:hip.end.xMM-hip.start.xMM,y:hip.end.yMM-hip.start.yMM};
  const connection=calculateJackHipSetback({hipWidthRunMM:Math.abs(cross(d,hv)),hipProjectionRunMM:Math.abs(d.x*hv.x+d.y*hv.y),facet:'front'});
  if(!connection.valid){jackErrors.push(`${r.id}: invalid hip connection geometry.`);return;}
  const hfc=trusses.truss.members[0].hfcMM,c=Math.cos(rad(f.pitchDeg)),v=220/c-hfc*Math.tan(rad(f.pitchDeg));
  const profile=calculateJackRafterManufactureGeometry({facetPitchDeg:f.pitchDeg,hipCentrelinePlanRunMM:plan,hipCentrelineSetbackMM:connection.hipCentrelineSetbackMM,horizontalFootCutMM:hfc,verticalFootCutMM:v});
  if(!profile.valid){jackErrors.push(`${r.id}: ${profile.reason}`);return;}
  const upperFoot={xMM:-hfc,yMM:v},upperEnd={xMM:-hfc+profile.externalSlopeLengthMM*c,yMM:v+profile.externalSlopeLengthMM*Math.sin(rad(f.pitchDeg))},lowerEnd={xMM:upperEnd.xMM,yMM:upperEnd.yMM-profile.topVerticalCutMM};
  members.push({ref:r.id,type:'Jack rafter',facetId:r.facetId,supportingHipRef:hip.id,pricingOnly:true,connection,profile,pitchDeg:f.pitchDeg,topCutOffSquareDeg:f.pitchDeg,topCutLengthMM:profile.topVerticalCutMM,topEdgeMM:profile.externalSlopeLengthMM,bottomEdgeMM:profile.internalSlopeLengthMM,horizontalFootCutMM:hfc,verticalFootCutMM:v,firstTrimDistanceMM:null,points:[{xMM:0,yMM:0},lowerEnd,upperEnd,upperFoot,{xMM:-hfc,yMM:0}].map(p=>({...p,xMM:-p.xMM}))});
 });
 if(jackErrors.length)return fail(jackErrors.join(' '));
 if(members.some(m=>![m.topEdgeMM,m.bottomEdgeMM,m.horizontalFootCutMM,m.verticalFootCutMM].every(Number.isFinite)||Math.min(m.topEdgeMM,m.bottomEdgeMM,m.verticalFootCutMM)<=0))return fail('The boss allowance or foot geometry leaves an invalid member profile.');
 const grouped=new Map();members.filter(m=>!m.pricingOnly).forEach(m=>{const key=JSON.stringify([m.type,...[m.pitchDeg,m.topEdgeMM,m.bottomEdgeMM,m.horizontalFootCutMM,m.verticalFootCutMM].map(n=>Number(n.toFixed(3)))]);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(m);});
 return {valid:true,errors:[],members,groups:[...grouped.values()],bossTopContinuationMM:allowance,pendingJackCount:g.jackRafters.length};
}
