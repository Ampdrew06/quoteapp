import React from 'react';
import {victorianFrameExtension} from '../../lib/geometry/victorianSurfaceAreas';
const mm=v=>Number(v).toFixed(1).replace(/\.0$/,'');

// Positions are taken from the applied geometry, including manual overrides.
export function victorianPlanSetout(g){
 return g.facets.map((f,i)=>{
  const side=i===0||i===g.facets.length-1,right=i===g.facets.length-1;
  const members=[...g.intermediateBars,...g.jackRafters].filter(r=>r.facetId===f.id).map(r=>({reference:r.id,positionMM:right?f.internalLengthMM-r.positionMM:r.positionMM}));
  if(side)members.push(...g.layout.centresMM.map((positionMM,n)=>({reference:`T${n+1}`,positionMM})));
  members.sort((a,b)=>a.positionMM-b.positionMM);
  const positions=[0,...members.map(r=>r.positionMM),f.internalLengthMM];
  return {facetId:f.id,reference:`RB${i+1}`,side,right,lengthMM:f.internalLengthMM,members,gaps:positions.slice(1).map((end,n)=>({startMM:positions[n],endMM:end,lengthMM:end-positions[n]}))};
 });
}

export default function VictorianManufacturePlan({geometry:g}){
 const minX=Math.min(...g.externalOutline.map(p=>p.xMM)),height=Math.min(650,Math.max(320,g.externalProjectionMM*600/g.externalWidthMM)),scale=Math.min(600/g.externalWidthMM,height/g.externalProjectionMM),W=g.externalWidthMM*scale,H=g.externalProjectionMM*scale,L=(1000-W)/2,T=120,svgHeight=T+H+230;
 const map=p=>({x:L+(p.xMM-minX)*scale,y:T+p.yMM*scale}),poly=points=>points.map(p=>{const q=map(p);return `${q.x},${q.y}`;}).join(' '),setout=victorianPlanSetout(g);
 const text=(x,y,value,fill='#111827',size=17,anchor='middle',angle=0)=><text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} transform={angle?`rotate(${angle} ${x} ${y})`:undefined} paintOrder="stroke" stroke="white" strokeWidth="2">{value}</text>;
 const line=(a,b,colour='#111827',width=2.5)=>{const x=map(a),y=map(b);return <line x1={x.x} y1={x.y} x2={y.x} y2={y.y} stroke={colour} strokeWidth={width}/>;};
 const arrow=(x1,y1,x2,y2,value,vertical=false)=><g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" markerStart="url(#vic-book-arrow)" markerEnd="url(#vic-book-arrow)"/>{text(vertical?x1-12:(x1+x2)/2,vertical?(y1+y2)/2:y1-9,value,'#111827',20,'middle',vertical?-90:0)}</g>;
 const facetDimension=(f,value,offset)=>{const a=map(f.start),b=map(f.end),dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;return <g><line x1={a.x+nx*offset} y1={a.y+ny*offset} x2={b.x+nx*offset} y2={b.y+ny*offset} stroke="#94a3b8" markerStart="url(#vic-book-arrow)" markerEnd="url(#vic-book-arrow)"/>{text((a.x+b.x)/2+nx*offset,(a.y+b.y)/2+ny*offset-4,value,'#111827',16,'middle',angle)}</g>;};
 const trajectoryEnd=r=>{const length=Math.hypot(r.end.xMM-r.start.xMM,r.end.yMM-r.start.yMM),extra=victorianFrameExtension(g,r,g.plyBaseWidthMM);return Number.isFinite(extra)?{xMM:r.end.xMM+(r.end.xMM-r.start.xMM)*extra/length,yMM:r.end.yMM+(r.end.yMM-r.start.yMM)*extra/length}:r.end;};
 const station=(f,s,position,offset)=>{const t=(s.right?s.lengthMM-position:position)/s.lengthMM,a=map(f.start),b=map(f.end),dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;return {x:a.x+t*dx-dy/l*offset,y:a.y+t*dy+dx/l*offset,angle};};
 const at=(a,b,t)=>map({xMM:a.xMM+(b.xMM-a.xMM)*t,yMM:a.yMM+(b.yMM-a.yMM)*t});
 const centre=map(g.ridge),rear=map({xMM:g.widthMM/2,yMM:0});
 return <svg viewBox={`0 0 1000 ${svgHeight}`} role="img" aria-label="Victorian manufacturing setting-out plan" style={{fontFamily:'Arial,sans-serif'}}>
  <defs><marker id="vic-book-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#64748b"/></marker></defs>
  {text(500,30,'HOUSE WALL','#111827',20)}
  <polygon points={poly(g.externalOutline)} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
  <polygon points={poly(g.internalOutline)} fill="none" stroke="#111827" strokeWidth="2.5"/>
  <line x1={rear.x} y1={rear.y} x2={centre.x} y2={centre.y} stroke="#475569" strokeWidth="1.5" strokeDasharray="8 5"/>
  {g.layout.centresMM.map((y,n)=>{const a=map({xMM:0,yMM:y});return <g key={`truss-${n}`} data-truss-position-mm={y}>{line({xMM:minX,yMM:y},{xMM:minX+g.externalWidthMM,yMM:y},'#2563eb')}{text(a.x+22,a.y-8,`T${n+1}`,'#2563eb',18,'start')}</g>;})}
  {g.hips.map(h=>{const p=at(h.start,h.end,.55),q=at(h.start,h.end,.35);return <g key={h.id}>{line(h.start,trajectoryEnd(h))}{text(p.x,p.y-8,h.id,'#2563eb',18)}{text(q.x,q.y-6,`${mm(h.pitchDeg)}°`,'#dc2626',16)}</g>;})}
  {[...g.intermediateBars,...g.jackRafters].map(r=>{const p=at(r.start,r.end,.64);return <g key={r.id}>{line(r.start,trajectoryEnd(r),'#2563eb')}{text(p.x+8,p.y-5,r.id,'#2563eb',18,'start')}</g>;})}
  <circle cx={centre.x} cy={centre.y} r="5" fill="#111827"/>
  {g.facets.map((f,i)=>{const s=setout[i],pitch=map({xMM:(f.start.xMM+f.end.xMM+g.ridge.xMM)/3,yMM:(f.start.yMM+f.end.yMM+g.ridge.yMM)/3}),rb=station(f,s,s.lengthMM/2,s.side?-12:8);return <g key={f.id}>
   {text(pitch.x,pitch.y,`${mm(f.pitchDeg)}°`,'#16a34a',18)}{text(rb.x,rb.y,s.reference,'#111827',14,'middle',rb.angle)}
   {facetDimension(f,`I: ${mm(f.internalLengthMM)}`,40)}
   {facetDimension({start:g.externalOutline[i],end:g.externalOutline[i+1]},`E: ${mm(f.externalLengthMM)}`,46)}
   {s.members.map((r,n)=>{const crowded=[s.members[n-1],s.members[n+1]].some(q=>q&&Math.abs(q.positionMM-r.positionMM)*scale<42),p=station(f,s,r.positionMM,crowded?102+(n%2?12:-12):105);return <g key={`position-${n}`} data-facet={f.id} data-member={r.reference} data-position-mm={r.positionMM}>{text(p.x,p.y,mm(r.positionMM),'#111827',crowded?13:14,'middle',p.angle)}</g>;})}
   {s.gaps.map((gap,n)=>{const p=station(f,s,(gap.startMM+gap.endMM)/2,135);return <g key={`gap-${n}`} data-facet-gap={f.id} data-gap-mm={gap.lengthMM}>{(gap.lengthMM>=60||n!==0||!s.side)?text(p.x,p.y,mm(gap.lengthMM),'#111827',14,'middle',p.angle):null}</g>;})}
  </g>;})}
  {g.internalOutline.slice(1,-1).map((p,n)=>{const q=at(p,g.ridge,.09);return <g key={`corner-${n}`}>{text(q.x,q.y,`${g.cornerAnglesDeg[n].toFixed(3)}°`,'#475569',15)}</g>;})}
  {arrow(map({xMM:0,yMM:0}).x,70,map({xMM:g.widthMM,yMM:0}).x,70,`IW: ${mm(g.widthMM)} mm`)}
  {arrow(L,T+H+165,L+W,T+H+165,`EW: ${mm(g.externalWidthMM)} mm`)}
  {arrow(L-170,T,L-170,T+H,`EP: ${mm(g.externalProjectionMM)} mm`,true)}
  {arrow(L+W+170,T,L+W+170,map({xMM:0,yMM:g.projectionMM}).y,`IP: ${mm(g.projectionMM)} mm`,true)}
  {text(500,T+H+205,'I/E = internal/external facet mm · near chain = positions · far chain = gaps','#475569',14)}
 </svg>;
}
