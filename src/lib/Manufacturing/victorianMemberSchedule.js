import {buildVictorianTrussSchedule} from './victorianTrussSchedule';
import {calculateSparHookEnd} from '../geometry/hipPerimeterIntersection';
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
 if(members.some(m=>![m.topEdgeMM,m.bottomEdgeMM,m.horizontalFootCutMM,m.verticalFootCutMM].every(Number.isFinite)||Math.min(m.topEdgeMM,m.bottomEdgeMM,m.verticalFootCutMM)<=0))return fail('The boss allowance or foot geometry leaves an invalid member profile.');
 const grouped=new Map();members.forEach(m=>{const key=JSON.stringify([m.type,...[m.pitchDeg,m.topEdgeMM,m.bottomEdgeMM,m.horizontalFootCutMM,m.verticalFootCutMM].map(n=>Number(n.toFixed(3)))]);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(m);});
 return {valid:true,errors:[],members,groups:[...grouped.values()],bossTopContinuationMM:allowance,pendingJackCount:g.jackRafters.length};
}
