import {automaticSupportCentres} from './automaticSupportSpacing';
import {resolveEdwardianRearTrusses} from './edwardianSideLayout';
import {resolveLeanToRafterLayout} from './leanToRafterLayout';
const point=(xMM,yMM)=>({xMM,yMM});
// Perpendicular-in-plan jack, clipped against the two hips bounding its facet.
export function combinationJackAt(g,f,positionMM){
 const end=point(f.start.xMM+(f.end.xMM-f.start.xMM)*positionMM/f.internalLengthMM,f.start.yMM+(f.end.yMM-f.start.yMM)*positionMM/f.internalLengthMM);
 const dx=(f.end.yMM-f.start.yMM)/f.internalLengthMM,dy=-(f.end.xMM-f.start.xMM)/f.internalLengthMM;
 const hits=[f.start,f.end].map(c=>{
  const vx=c.xMM-g.ridge.xMM,vy=c.yMM-g.ridge.yMM,det=dx*vy-dy*vx;
  if(Math.abs(det)<1e-9)return null;
  const qx=g.ridge.xMM-end.xMM,qy=g.ridge.yMM-end.yMM,u=(qx*vy-qy*vx)/det,v=(qx*dy-qy*dx)/det;
  return u>1e-7&&v>=-1e-8&&v<=1+1e-8?{u,start:point(end.xMM+u*dx,end.yMM+u*dy)}:null;
 }).filter(Boolean).sort((a,b)=>a.u-b.u);
 return hits.length?{start:hits[0].start,end,positionMM,facetId:f.id,kind:Math.hypot(hits[0].start.xMM-g.ridge.xMM,hits[0].start.yMM-g.ridge.yMM)<0.01?'boss':'jack'}:null;
}
export function applyCombinationRafterLayout(g,reference,inputs){
 const errors=[],warnings=[],last=g.facets.length-1,positions=inputs.combinationRafterPositionsMM||{},maxSpacing=850;
 let layout={...reference.layout,gapsMM:reference.layout.centresMM.slice(1).map((p,i)=>p-reference.layout.centresMM[i])};
 if(inputs.combinationRearTrussPositionsMM!=null){layout=resolveEdwardianRearTrusses(inputs.combinationRearTrussPositionsMM,reference.terminalTrussCentreMM);if(!layout.valid)errors.push(...layout.errors);}
 const rafters=[];
 const ed=g.leftSide==='edwardian'&&g.rightSide==='edwardian',vic=g.leftSide==='victorian'&&g.rightSide==='victorian';
 // Matching configurations preserve the mature automatic layouts exactly.
 const original=vic?[...reference.intermediateBars,...reference.jackRafters]:ed?[
  ...reference.frontRafters.map(r=>({facetId:'facet-2',positionMM:r.centreMM,start:point(r.centreMM,r.hipMeetingYMM),end:point(r.centreMM,g.projectionMM),kind:Math.abs(r.centreMM-g.ridge.xMM)<0.01?'boss':'jack'})),
  ...reference.sideJacks.map(r=>({facetId:r.side==='left'?'facet-1':'facet-3',positionMM:r.side==='left'?r.positionMM:g.projectionMM-r.positionMM,start:point(r.side==='left'?r.hipMeetingXMM:g.widthMM-r.hipMeetingXMM,r.positionMM),end:point(r.side==='left'?0:g.widthMM,r.positionMM),kind:'jack'}))
 ]:null;
 const groups=g.facets.map((f,i)=>{
  const side=i===0||i===last,right=i===last,start=side?reference.terminalTrussCentreMM:0,end=f.internalLengthMM;
  let members=[];
  if(original)members=original.filter(r=>r.facetId===f.id).map(r=>({...r,kind:r.kind||(Math.hypot(r.start.xMM-g.ridge.xMM,r.start.yMM-g.ridge.yMM)<0.01?'boss':'jack')}));
  else{
   const reverse=side?right:(f.start.xMM+f.end.xMM)/2>g.ridge.xMM;
   const automatic=automaticSupportCentres({startMM:start,endMM:end,clearanceMM:72});
   for(const pos of automatic.slice(1,-1)){const r=combinationJackAt(g,f,reverse?end-pos:pos);if(r)members.push(r);else errors.push(`Facet ${i+1}: cannot resolve the automatic hip connection.`);}
  }
  const manual=positions[f.id]!=null;
  if(manual){
   const checked=resolveLeanToRafterLayout({widthMM:end,positions:positions[f.id],boundaryStartMM:start,boundaryEndMM:end});
   if(!checked.valid)errors.push(...checked.errors.map(e=>`Facet ${i+1}: ${e}`));
   else{members=[];for(const pos of checked.interiorMM){const r=combinationJackAt(g,f,right?end-pos:pos);if(r)members.push(r);else errors.push(`Facet ${i+1}: cannot resolve the hip connection at ${pos}mm.`);}}
  }
  members=members.map((r,n)=>({...r,id:`${r.kind==='boss'?'R':'J'}${i+1}.${n+1}`}));rafters.push(...members);
  const centresMM=members.map(r=>right?end-r.positionMM:r.positionMM).sort((a,b)=>a-b),chain=[start,...centresMM,end],gapsMM=chain.slice(1).map((v,n)=>v-chain[n]);
  const limit=ed&&!side?750:maxSpacing;
  if(gapsMM.some(v=>v>limit+1e-7))warnings.push(`Facet ${i+1}: a bay exceeds ${limit}mm; review support spacing.`);
  return {id:f.id,number:i+1,side,origin:side?'house wall': 'left end of facet (viewed on plan)',boundaryStartMM:start,boundaryEndMM:end,centresMM,gapsMM,manual};
 });
 if(layout.gapsMM?.some(v=>v>665+1e-7))warnings.push('A rear truss bay exceeds 665mm; review support spacing.');
 return {...g,valid:errors.length===0,errors,rafterWarnings:warnings,rafterGroups:groups,rafters,trusses:(layout.centresMM||[]).map((v,i)=>({id:`T${i+1}`,start:point(0,v),end:point(g.widthMM,v),positionMM:v})),terminalTrussCentreMM:reference.terminalTrussCentreMM,layout};
}
