import React from 'react';
const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
export default function VictorianHippedManufacturePlan({geometry:g}){
 if(!g?.valid)return null;
 const numbering=g.manufactureNumbering,minX=Math.min(...g.externalOutline.map(p=>p.xMM)),scale=Math.min(760/g.externalWidthMM,460/g.externalProjectionMM),left=(1180-g.externalWidthMM*scale)/2,top=155,x=v=>left+(v-minX)*scale,y=v=>top+v*scale,bottom=y(g.externalProjectionMM),right=left+g.externalWidthMM*scale;
 const path=ps=>ps.map((p,i)=>`${i?'L':'M'}${x(p.xMM)},${y(p.yMM)}`).join(' ')+'Z';
 const line=(a,b,props={})=><line x1={x(a.xMM)} y1={y(a.yMM)} x2={x(b.xMM)} y2={y(b.yMM)} {...props}/>;
 const dimension=(x1,y1,x2,y2,label,vertical=false)=><g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" markerStart="url(#vh-factory-arrow)" markerEnd="url(#vh-factory-arrow)"/><text x={vertical?undefined:(x1+x2)/2} y={vertical?undefined:y1-9} transform={vertical?`translate(${x1-12},${(y1+y2)/2}) rotate(-90)`:undefined} textAnchor="middle" fontSize="16">{label}</text></g>;
 const text=(px,py,label,props={})=><text x={px} y={py} textAnchor="middle" fontFamily="Arial,sans-serif" stroke="white" strokeWidth="3" paintOrder="stroke" {...props}>{label}</text>;
 return <svg viewBox={`0 0 1180 ${Math.max(850,bottom+220)}`} role="img" aria-label="Victorian Hipped manufacture plan with counter-clockwise member numbers, rafter centres and gaps">
 <defs><marker id="vh-factory-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#334155" strokeWidth="2"/></marker></defs>
 <path d={path(g.externalOutline)} fill="#f8fafc" stroke="#94a3b8"/>
 <path d={path(g.internalOutline)} fill="none" stroke="#111827" strokeWidth="3"/>
 {g.rafterLayout.members.map(r=><g key={r.id}>{line(r.start,r.end,{stroke:'#2563eb',strokeWidth:2.5})}{text(x(r.start.xMM*.3+r.end.xMM*.7)+10,y(r.start.yMM*.3+r.end.yMM*.7)-7,r.reference,{fontSize:16,fill:'#1d4ed8','data-member-ref':r.reference})}</g>)}
 {g.hips.map(h=><g key={h.id}>{line(h.start,h.end,{stroke:'#111827',strokeWidth:3})}{text(x((h.start.xMM+h.end.xMM)/2)+14,y((h.start.yMM+h.end.yMM)/2)-10,h.reference,{fontSize:16,fill:'#1d4ed8','data-member-ref':h.reference})}{text(x(h.start.xMM*.7+h.end.xMM*.3),y(h.start.yMM*.7+h.end.yMM*.3)+18,`${h.pitchDeg.toFixed(1)}°`,{fontSize:14,fill:'#b91c1c'})}</g>)}
 {numbering.entries.filter(e=>['WB1','WB2','WP1','WL','WR'].includes(e.id)).map(e=><g key={e.id}>{line(e.start,e.end,{stroke:'#111827',strokeWidth:3})}{text(x((e.start.xMM+e.end.xMM)/2),y((e.start.yMM+e.end.yMM)/2)-12,e.reference,{fontSize:16,fill:'#1d4ed8','data-member-ref':e.reference})}</g>)}
 {g.bosses.map(b=><g key={b.id}><circle cx={x(b.xMM)} cy={y(b.yMM)} r="5" fill="#111827"/>{text(x(b.xMM),y(b.yMM)-33,'BOSS',{fontSize:14})}</g>)}
 {g.facets.map(f=>{
  const dx=f.end.xMM-f.start.xMM,dy=f.end.yMM-f.start.yMM,L=f.internalLengthMM,nx=-dy/L,ny=dx/L;
  const label=(position,offset,value,props={})=>text(x(f.start.xMM+dx*position/L)+nx*offset,y(f.start.yMM+dy*position/L)+ny*offset,value,props);
  const members=g.rafterLayout.members.filter(r=>r.facetId===f.id).sort((a,b)=>a.perimeterPositionMM-b.perimeterPositionMM),positions=[0,...members.map(r=>r.perimeterPositionMM),L];
  let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;
  const centre=f.points.reduce((a,p)=>({xMM:a.xMM+p.xMM/f.points.length,yMM:a.yMM+p.yMM/f.points.length}),{xMM:0,yMM:0});
  return <g key={f.id}>
   {text(x(centre.xMM),y(centre.yMM)+15,`${f.id} · ${f.eaves.pitchDeg.toFixed(1)}°`,{fontSize:17,fontWeight:'bold'})}
   {members.map(r=><g key={r.id}>{label(r.perimeterPositionMM,25,mm(r.positionMM),{fontSize:13,fill:'#1d4ed8','data-rafter-centre':r.id})}</g>)}
   {positions.slice(1).map((p,n)=>label((p+positions[n])/2,49,mm(p-positions[n]),{key:n,fontSize:12,fill:'#475569','data-rafter-gap':f.id}))}
   <text transform={`translate(${x((f.start.xMM+f.end.xMM)/2)+nx*85},${y((f.start.yMM+f.end.yMM)/2)+ny*85}) rotate(${angle})`} textAnchor="middle" fontSize="15" fontWeight="bold" data-member-ref={numbering.byId[`ring:${f.id}`]}>{numbering.byId[`ring:${f.id}`]} · {mm(L)} mm</text>
  </g>;
 })}
 {dimension(x(0),top-75,x(g.widthMM),top-75,`IW: ${mm(g.widthMM)} mm`)}
 {dimension(left,bottom+160,right,bottom+160,`EW: ${mm(g.externalWidthMM)} mm`)}
 {dimension(left-145,top,left-145,bottom,`EP: ${mm(g.externalProjectionMM)} mm`,true)}
 {dimension(right+145,top,right+145,y(g.projectionMM),`IP: ${mm(g.projectionMM)} mm`,true)}
 {text(590,bottom+195,'Blue edge figures: centres from facet datum · Grey edge figures: gaps between centres/corners (mm)',{fontSize:13})}
 </svg>;
}
