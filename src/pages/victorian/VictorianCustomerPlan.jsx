import React from 'react';
export default function VictorianCustomerPlan({geometry:g}){
 const minX=Math.min(...g.externalOutline.map(p=>p.xMM)),scale=Math.min(560/g.externalWidthMM,430/g.externalProjectionMM),x=v=>125+(v-minX)*scale,y=v=>105+v*scale,mid=x(g.widthMM/2),bottom=y(g.externalProjectionMM);
 const poly=points=>points.map(p=>`${x(p.xMM)},${y(p.yMM)}`).join(' ');
 const line=(a,b,stroke,width=2)=><line x1={x(a.xMM)} y1={y(a.yMM)} x2={x(b.xMM)} y2={y(b.yMM)} stroke={stroke} strokeWidth={width}/>;
 const dim=(x1,y1,x2,y2)=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" markerStart="url(#victorian-customer-arrow)" markerEnd="url(#victorian-customer-arrow)"/>;
 return <svg viewBox="0 0 820 670" role="img" aria-label="Victorian plan preview" style={{width:'100%',display:'block',border:'1px solid #f1f5f9',borderRadius:8}}>
 <defs><marker id="victorian-customer-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill="none" stroke="#334155" strokeWidth="2"/></marker></defs>
 <polygon points={poly(g.externalOutline)} fill="#f8fafc" stroke="#64748b"/><polygon points={poly(g.internalOutline)} fill="none" stroke="#111827"/>
 {g.layout.centresMM.map((centre,n)=><g key={n}>{line({xMM:0,yMM:centre},{xMM:g.widthMM,yMM:centre},'#2563eb',3)}{n>0&&<text x={x(g.widthMM)+9} y={y(centre)+4} fontSize="12">{Math.round(centre)}</text>}</g>)}
 {line({xMM:g.widthMM/2,yMM:0},g.ridge,'#111827',3)}{g.hips.map(h=><g key={h.id}>{line(h.start,h.end,'#111827',3)}</g>)}{[...g.intermediateBars,...g.jackRafters].map(r=><g key={r.id}>{line(r.start,r.end,'#2563eb',3)}</g>)}
 {g.facets.map(f=><text key={f.id} x={x((f.start.xMM+f.end.xMM+g.ridge.xMM)/3)} y={y((f.start.yMM+f.end.yMM+g.ridge.yMM)/3)} textAnchor="middle" fontWeight="bold" fontSize="17">{f.pitchDeg.toFixed(1)}°</text>)}
 <text x={mid} y="50" textAnchor="middle" fontSize="15">HOUSE WALL</text>
 {dim(x(0),y(0)-20,x(g.widthMM),y(0)-20)}<text x={mid} y={y(0)-27} textAnchor="middle" fontSize="13">{Math.round(g.widthMM)} int</text>
 {dim(x(minX),bottom+25,x(minX+g.externalWidthMM),bottom+25)}<text x={mid} y={bottom+19} textAnchor="middle" fontSize="13">{Math.round(g.externalWidthMM)} ext</text>
 {dim(x(minX)-35,y(0),x(minX)-35,bottom)}<text transform={`translate(${x(minX)-42},${(y(0)+bottom)/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{Math.round(g.externalProjectionMM)} ext</text>
 {dim(x(minX+g.externalWidthMM)+65,y(0),x(minX+g.externalWidthMM)+65,y(g.projectionMM))}<text transform={`translate(${x(minX+g.externalWidthMM)+80},${(y(0)+y(g.projectionMM))/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{Math.round(g.projectionMM)} int</text>
 </svg>;
}
