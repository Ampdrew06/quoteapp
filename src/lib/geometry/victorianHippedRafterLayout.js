import {buildDefaultFrontRafterLayout} from '../Manufacturing/rafterLayoutBuilder';
import {resolveLeanToRafterLayout} from './leanToRafterLayout';
import {VICTORIAN_MAX_SPACING_MM} from './victorianSupportRules';

const cross=(a,b)=>a.x*b.y-a.y*b.x;
const distance=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);

// All lengths here are between internal plan datums, without timber cuts,
// terminal deductions, eaves extensions or spar-hook adjustments.
export function buildVictorianHippedRafterLayout({geometry:g,positionsByFacet={},alignmentByFacet={},materials={}}) {
 const errors=[],members=[],facets=[];
 const spacing=Number(materials.rafter_spacing_mm??665),first=Number(materials.rafter_first_center_mm??690);
 if(!Number.isFinite(spacing)||!Number.isFinite(first)||!(spacing>0&&first>0))return {valid:false,errors:['Positive rafter spacing and first centre are required.'],members:[],facets:[]};
 const hitBoundary=(f,end)=>{
  const ray={x:(f.end.yMM-f.start.yMM)/f.internalLengthMM,y:-(f.end.xMM-f.start.xMM)/f.internalLengthMM};
  const hits=[];
  // The first polygon edge is the eaves. Intersect the other edges only.
  for(let i=1;i<f.points.length;i++){
   const a=f.points[i],b=f.points[(i+1)%f.points.length],edge={x:b.xMM-a.xMM,y:b.yMM-a.yMM},q={x:a.xMM-end.xMM,y:a.yMM-end.yMM},det=cross(ray,edge);
   if(Math.abs(det)<1e-9)continue;
   const run=cross(q,edge)/det,t=cross(q,ray)/det;
   if(run>1e-7&&t>=-1e-8&&t<=1+1e-8)hits.push({run,start:{xMM:end.xMM+run*ray.x,yMM:end.yMM+run*ray.y}});
  }
  return hits.sort((a,b)=>a.run-b.run)[0];
 };
 for(const f of g.facets){
  const side=f.id==='F1'||f.id==='F5',manual=positionsByFacet?.[f.id]!=null,alignment=(f.id==='F2'||f.id==='F4')?(alignmentByFacet?.[f.id]||'automatic'):'automatic';
  if(!['automatic','perpendicular'].includes(alignment)){errors.push(`${f.label}: choose automatic or perpendicular rafter alignment.`);continue;}
  let positions=[];
  if(manual)positions=positionsByFacet[f.id];
  else if(side){
   // Same wall-led centres and final hip-seat clearance as Hipped Lean-To.
   for(let p=first;p<f.internalLengthMM;p+=spacing){
    if(f.internalLengthMM-48-(p+24)<400)break;
    positions.push(p);
   }
  }else if(f.id==='F3'){
   const left=(g.bosses.find(b=>b.id==='BL')?.xMM??f.start.xMM)-f.start.xMM,right=(g.bosses.find(b=>b.id==='BR')?.xMM??f.end.xMM)-f.start.xMM;
   positions=buildDefaultFrontRafterLayout({widthMM:f.internalLengthMM,leftBossXMM:left,rightBossXMM:right,hasLeftHip:left>0&&left<f.internalLengthMM,hasRightHip:right>0&&right<f.internalLengthMM,spacingMM:spacing}).allRafters.map(r=>r.centreMM);
  }else if(f.internalLengthMM>VICTORIAN_MAX_SPACING_MM+1e-7){
   if(f.internalLengthMM<=2*VICTORIAN_MAX_SPACING_MM+1e-7)positions=[f.internalLengthMM/2];
   else {const bays=Math.ceil((f.internalLengthMM-1e-7)/VICTORIAN_MAX_SPACING_MM);positions=Array.from({length:bays-1},(_,n)=>f.internalLengthMM*(n+1)/bays);}
  }
  if(!manual)positions=positions.filter(p=>p>72&&p<f.internalLengthMM-72);
  const resolved=resolveLeanToRafterLayout({widthMM:f.internalLengthMM,positions,boundaryStartMM:24,boundaryEndMM:f.internalLengthMM-24});
  if(!resolved.valid){errors.push(`${f.label}: ${resolved.errors.join(' ')}`);continue;}
  const facetMembers=[];
  resolved.interiorMM.forEach((positionMM,n)=>{
   // Both sides are measured from the wall. Front facets follow the perimeter.
   const along=f.id==='F5'?f.internalLengthMM-positionMM:positionMM,t=along/f.internalLengthMM;
   const end={xMM:f.start.xMM+(f.end.xMM-f.start.xMM)*t,yMM:f.start.yMM+(f.end.yMM-f.start.yMM)*t};
   // Chamfer boss rafters fan from the boss to the facet midpoint. Their
   // member pitch can differ from the perpendicular facet pitch.
   const fan=alignment!=='perpendicular'&&(f.id==='F2'||f.id==='F4')&&f.internalLengthMM<=2*VICTORIAN_MAX_SPACING_MM+1e-7&&Math.abs(along-f.internalLengthMM/2)<0.01;
   const boss=fan?g.bosses.find(b=>b.id===(f.id==='F2'?'BL':'BR')):null;
   const hit=boss?{start:{xMM:boss.xMM,yMM:boss.yMM}}:hitBoundary(f,end);
   if(!hit){errors.push(`${f.label}: no supporting hip or wallplate at ${positionMM}mm.`);return;}
   const planLengthMM=distance(hit.start,end),atBoss=g.bosses.find(b=>distance(hit.start,b)<0.1),onWall=Math.abs(hit.start.yMM)<1e-6;
   const role=atBoss?'boss-rafter':onWall?'rafter':'jack';
   const startHeightMM=boss?g.riseMM:planLengthMM*Math.tan(f.pitchDeg*Math.PI/180);
   const member={id:`${f.id}-rafter-${n+1}`,facetId:f.id,alignment:fan?'boss-fan':'perpendicular',positionMM,perimeterPositionMM:along,role,bossId:atBoss?.id??null,start:hit.start,end,planLengthMM,startHeightMM,geometricSlopeMM:Math.hypot(planLengthMM,startHeightMM),pitchDeg:Math.atan2(startHeightMM,planLengthMM)*180/Math.PI};
   if(!(planLengthMM>0&&startHeightMM>0)||startHeightMM>g.riseMM+1e-5){errors.push(`${f.label}: invalid support height at ${positionMM}mm.`);return;}
   members.push(member);facetMembers.push(member);
  });
  facets.push({facetId:f.id,label:f.label,alignment,manual,positionsMM:resolved.interiorMM,gapsMM:resolved.gapsMM,members:facetMembers,counts:{bossRafters:facetMembers.filter(r=>r.role==='boss-rafter').length,rafters:facetMembers.filter(r=>r.role==='rafter').length,jacks:facetMembers.filter(r=>r.role==='jack').length}});
 }
 members.forEach((r,i)=>{r.reference=`R${i+1}`;});
 return {valid:errors.length===0,errors,members,facets,counts:{bossRafters:members.filter(r=>r.role==='boss-rafter').length,rafters:members.filter(r=>r.role==='rafter').length,jacks:members.filter(r=>r.role==='jack').length,total:members.length},sideFirstCentreMM:first,spacingMM:spacing,frontFacetMaxSpacingMM:VICTORIAN_MAX_SPACING_MM};
}
