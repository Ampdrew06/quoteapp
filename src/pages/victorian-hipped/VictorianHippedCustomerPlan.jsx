import React from 'react';
const mm=value=>Number(value).toFixed(1).replace(/\.0$/,'');
// D/O presentation only. All coordinates and dimensions come from the applied
// roof geometry; the detailed factory plan remains a separate component.
export default function VictorianHippedCustomerPlan({geometry:g}){
 if(!g?.valid)return null;
 const minX=Math.min(...g.externalOutline.map(p=>p.xMM)),maxX=Math.max(...g.externalOutline.map(p=>p.xMM));
 const scale=Math.min(550/(maxX-minX),430/g.externalProjectionMM),left=(820-(maxX-minX)*scale)/2,right=left+(maxX-minX)*scale,top=105,bottom=top+g.externalProjectionMM*scale;
 const x=v=>left+(v-minX)*scale,y=v=>top+v*scale;
 const path=points=>points.map((p,i)=>`${i?'L':'M'}${x(p.xMM)},${y(p.yMM)}`).join(' ')+'Z';
 const line=(a,b,props={})=><line x1={x(a.xMM)} y1={y(a.yMM)} x2={x(b.xMM)} y2={y(b.yMM)} {...props}/>;
 const dimension=(x1,y1,x2,y2,text,vertical=false)=>{
  const cx=(x1+x2)/2,cy=(y1+y2)/2;
  return <g data-dimension={text}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" markerStart="url(#vh-customer-arrow)" markerEnd="url(#vh-customer-arrow)"/>
   <text x={vertical?undefined:cx} y={vertical?undefined:cy-7} transform={vertical?`translate(${cx-8},${cy}) rotate(-90)`:undefined} textAnchor="middle" fontSize="13">{text}</text></g>;
 };
 return <svg viewBox="0 0 820 670" role="img" aria-label="Victorian hipped lean-to plan preview with internal and external dimensions" style={{width:'100%',display:'block',border:'1px solid #f1f5f9',borderRadius:8}}>
 <defs><marker id="vh-customer-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#334155" strokeWidth="2"/></marker></defs>
 <path d={path(g.externalOutline)} fill="#f8fafc" stroke="#64748b" strokeWidth="1"/>
 {g.rafterLayout?.members.map(r=>line(r.start,r.end,{key:r.id,stroke:'#2563eb',strokeWidth:3}))}
 {g.wallMembers?.map(r=>line(r.start,r.end,{key:r.id,stroke:'#111827',strokeWidth:3}))}
 {g.hips.map(h=>line(h.start,h.end,{key:h.id,stroke:'#111827',strokeWidth:3}))}
 <path d={path(g.internalOutline)} fill="none" stroke="#111827" strokeWidth="2"/>
 {g.facets.map(f=>{
  const centre=f.points.reduce((n,p)=>({xMM:n.xMM+p.xMM/f.points.length,yMM:n.yMM+p.yMM/f.points.length}),{xMM:0,yMM:0});
  const dx=x(f.end.xMM)-x(f.start.xMM),dy=y(f.end.yMM)-y(f.start.yMM),length=Math.hypot(dx,dy),lx=(x(f.start.xMM)+x(f.end.xMM))/2-dy/length*18,ly=(y(f.start.yMM)+y(f.end.yMM))/2+dx/length*18;
  let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;
  const pitch=f.id==='F1'||f.id==='F5'?g.sidePitchDeg:f.pitchDeg;
  return <g key={f.id}>
   <text x={x(centre.xMM)} y={y(centre.yMM)+5} textAnchor="middle" fontSize="16" fontWeight="bold" stroke="#f8fafc" strokeWidth="4" paintOrder="stroke" fill="#111827">{f.id} · {pitch.toFixed(1)}°</text>
   <text data-facet-length={f.id} transform={`translate(${lx},${ly}) rotate(${angle})`} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#111827" stroke="white" strokeWidth="4" paintOrder="stroke">{mm(f.internalLengthMM)}</text>
  </g>;
 })}
 {g.facets.slice(0,-1).map((f,i)=>{
  const index=g.internalOutline.findIndex(p=>Math.hypot(p.xMM-f.end.xMM,p.yMM-f.end.yMM)<.001),outer=g.externalOutline[index]||f.end,leftCorner=f.end.xMM<g.widthMM/2,frontCorner=Math.abs(f.end.yMM-g.projectionMM)<.001;
  return <text key={`angle-${f.id}`} data-corner-angle={g.cornerAnglesDeg[i]} x={x(outer.xMM)+(leftCorner?-12:12)} y={y(outer.yMM)+(frontCorner?22:5)} textAnchor={leftCorner?'end':'start'} fontSize="12" fill="#334155" stroke="white" strokeWidth="4" paintOrder="stroke">{Number(g.cornerAnglesDeg[i].toFixed(2))}°</text>;
 })}
 {dimension(x(0),top-20,x(g.widthMM),top-20,`${mm(g.widthMM)} int`)}
 {dimension(left,bottom+52,right,bottom+52,`${mm(g.externalWidthMM)} ext`)}
 {dimension(left-90,top,left-90,bottom,`${mm(g.externalProjectionMM)} ext`,true)}
 {dimension(right+90,top,right+90,y(g.projectionMM),`${mm(g.projectionMM)} int`,true)}
 </svg>;
}
