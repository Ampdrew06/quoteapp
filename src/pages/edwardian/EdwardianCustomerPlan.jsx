import React from 'react';
export default function EdwardianCustomerPlan({geometry:g}){
 const scale=Math.min(550/g.externalWidthMM,430/g.externalProjectionMM),x=v=>125+(v+g.externalLeftMM)*scale,y=v=>105+v*scale;
 const left=x(-g.externalLeftMM),right=x(g.widthMM+g.externalRightMM),bottom=y(g.externalProjectionMM),mid=x(g.widthMM/2);
 const line=(x1,y1,x2,y2,props={})=><line x1={x(x1)} y1={y(y1)} x2={x(x2)} y2={y(y2)} {...props}/>;
 const dim=(x1,y1,x2,y2)=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" markerStart="url(#edwardian-preview-arrow)" markerEnd="url(#edwardian-preview-arrow)"/>;
 return <svg viewBox="0 0 820 670" role="img" aria-label="Edwardian plan preview" style={{width:'100%',display:'block',border:'1px solid #f1f5f9',borderRadius:8}}>
 <defs><marker id="edwardian-preview-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#334155" strokeWidth="2"/></marker></defs>
 <rect x={left} y={y(0)} width={g.externalWidthMM*scale} height={g.externalProjectionMM*scale} fill="#f8fafc" stroke="#64748b"/>
 <rect x={x(0)} y={y(0)} width={g.widthMM*scale} height={g.projectionMM*scale} fill="none" stroke="#111827"/>
 {g.layout.centresMM.map((centre,n)=><g key={n}>{line(0,centre,g.widthMM,centre,{stroke:'#2563eb',strokeWidth:3})}{n>0&&<text x={right+8} y={y(centre)+4} fontSize="12">{Math.round(centre)}</text>}</g>)}
 {g.sideJacks.map(r=><g key={r.id}>{line(r.side==='left'?0:g.widthMM,r.positionMM,r.side==='left'?r.hipMeetingXMM:g.widthMM-r.hipMeetingXMM,r.positionMM,{stroke:'#2563eb',strokeWidth:3})}</g>)}
 {g.frontRafters.map(r=><g key={r.id}>{line(r.centreMM,g.projectionMM,r.centreMM,r.hipMeetingYMM,{stroke:'#2563eb',strokeWidth:3})}<text x={x(r.centreMM)} y={bottom+15} textAnchor="middle" fontSize="12">{Math.round(r.centreMM)}</text></g>)}
 {line(g.widthMM/2,0,g.widthMM/2,g.ridgeEndYMM,{stroke:'#111827',strokeWidth:3})}
 {g.hips.map(h=>line(h.start.xMM,h.start.yMM,h.end.xMM,h.end.yMM,{key:h.side,stroke:'#111827',strokeWidth:3}))}
 <text x={mid} y="50" textAnchor="middle" fontSize="15">HOUSE WALL</text>
 <text x={x(g.widthMM/4)} y={y(g.ridgeEndYMM/2)} textAnchor="middle" fontWeight="bold" fontSize="16">{g.pitchDeg.toFixed(1)}°</text><text x={x(g.widthMM*3/4)} y={y(g.ridgeEndYMM/2)} textAnchor="middle" fontWeight="bold" fontSize="16">{g.pitchDeg.toFixed(1)}°</text>
 <text x={mid} y={y((g.ridgeEndYMM+g.projectionMM)/2)} textAnchor="middle" fontWeight="bold" fontSize="16">{g.frontPitchDeg.toFixed(1)}°</text>
 {dim(x(0),y(0)-20,x(g.widthMM),y(0)-20)}<text x={mid} y={y(0)-27} textAnchor="middle" fontSize="13">{Math.round(g.widthMM)} int</text>
 {dim(left,bottom+36,right,bottom+36)}<text x={mid} y={bottom+30} textAnchor="middle" fontSize="13">{Math.round(g.externalWidthMM)} ext</text>
 {dim(left-35,y(0),left-35,bottom)}<text transform={`translate(${left-42},${(y(0)+bottom)/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{Math.round(g.externalProjectionMM)} ext</text>
 {dim(right+65,y(0),right+65,y(g.projectionMM))}<text transform={`translate(${right+80},${(y(0)+y(g.projectionMM))/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{Math.round(g.projectionMM)} int</text>
 <circle cx={left+5} cy={bottom+7} r="5" fill="#111827"/>
 </svg>;
}
