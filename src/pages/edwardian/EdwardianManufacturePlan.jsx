import React from 'react';
const mm=v=>Number(v).toFixed(1);
export default function EdwardianManufacturePlan({schedule:s}){
 const g=s.geometry,L=170,T=100,W=600,H=660;
 const px=x=>L+(x+g.externalLeftMM)/g.externalWidthMM*W,py=y=>T+y/g.externalProjectionMM*H;
 const ridgeX=px(g.widthMM/2),ridgeY=py(g.ridgeEndYMM);
 const label=(x,y,text,anchor='middle')=><text x={x} y={y} textAnchor={anchor} fontSize="18" fill="#111827">{text}</text>;
 const line=(x1,y1,x2,y2)=> <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth="3"/>;
 const dim=(x1,y1,x2,y2,text,vertical=false)=><g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" markerStart="url(#ed-book-arrow)" markerEnd="url(#ed-book-arrow)"/><text x={vertical?x1-12:(x1+x2)/2} y={vertical?(y1+y2)/2:y1-10} transform={vertical?`rotate(-90 ${x1-12} ${(y1+y2)/2})`:undefined} textAnchor="middle" fontSize="20">{text}</text></g>;
 return <svg viewBox="0 0 1000 910" role="img" aria-label="Edwardian manufacturing setting-out plan" style={{fontFamily:'Arial,sans-serif'}}>
 <defs><marker id="ed-book-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#64748b"/></marker></defs>
 {label(470,27,'HOUSE WALL — positions measured from internal frame datums')}
 <rect x={L} y={T} width={W} height={H} fill="#f8fafc" stroke="#111827" strokeWidth="3"/>
 <rect x={px(0)} y={T} width={g.widthMM/g.externalWidthMM*W} height={g.projectionMM/g.externalProjectionMM*H} fill="none" stroke="#94a3b8" strokeDasharray="7 5"/>
 <line x1={ridgeX} x2={ridgeX} y1={T} y2={ridgeY} stroke="#475569" strokeWidth="2" strokeDasharray="8 5"/>
 {s.trusses.map((t,n)=><g key={t.id}><line x1={L} x2={L+W} y1={py(t.centreMM)} y2={py(t.centreMM)} stroke="#2563eb" strokeWidth="3"/>{label(L-12,py(t.centreMM)+6,t.id,'end')}{label(L+W+10,py(t.centreMM)+6,mm(t.centreMM),'start')}{n>0&&label(px(700),py((t.centreMM+s.trusses[n-1].centreMM)/2)+5,`${mm(g.layout.gapsMM[n-1])} c/c`)}</g>)}
 {g.hips.map(h=><g key={h.side}>{line(ridgeX,ridgeY,px(h.side==='left'?-g.externalLeftMM:g.widthMM+g.externalRightMM),py(g.externalProjectionMM))}{label(px(h.side==='left'?g.widthMM*.22:g.widthMM*.78),py(g.ridgeEndYMM+(g.projectionMM-g.ridgeEndYMM)*.58),h.side==='left'?'H1':'H2')}</g>)}
 {s.members.filter(m=>m.type.endsWith('-jack')).map(m=>{const front=m.type==='front-jack',r=front?g.frontRafters.find(r=>r.id===m.id):g.sideJacks.find(r=>r.id===m.id);const x1=front?px(r.centreMM):px(r.side==='left'?-g.externalLeftMM:g.widthMM+g.externalRightMM),y1=front?py(g.externalProjectionMM):py(r.positionMM),x2=front?x1:px(r.side==='left'?r.hipMeetingXMM:g.widthMM-r.hipMeetingXMM),y2=front?py(r.hipMeetingYMM):y1;return <g key={m.id}>{line(x1,y1,x2,y2)}{label(front?x1:(x1+x2)/2,front?(y1+y2)/2-5:y1-8,m.ref)}</g>;})}
 {line(ridgeX,py(g.externalProjectionMM),ridgeX,ridgeY)}{label(ridgeX+24,py((g.projectionMM+g.ridgeEndYMM)/2),'R1','start')}
 <circle cx={ridgeX} cy={ridgeY} r="5" fill="#dc2626"/>
 
 {label(L+32,T+H*.5,'RB1')}{label(L+W-32,T+H*.5,'RB3')}{label(L+W/2,T+H-14,'RB2')}
 {label(px(g.widthMM*.13),py(180),`${mm(g.pitchDeg)}°`)}{label(px(g.widthMM*.87),py(180),`${mm(g.pitchDeg)}°`)}{label(ridgeX,py(g.projectionMM-180),`${mm(g.frontPitchDeg)}°`)}
 {dim(px(0),65,px(g.widthMM),65,`IW ${mm(g.widthMM)} mm`)}{dim(L,T+H+48,L+W,T+H+48,`EW ${mm(g.externalWidthMM)} mm`)}{dim(L-85,T,L-85,T+H,`EP ${mm(g.externalProjectionMM)} mm`,true)}{dim(L+W+155,T,L+W+155,py(g.projectionMM),`IP ${mm(g.projectionMM)} mm`,true)}
 {label(470,865,'Dashed perimeter: internal frame · T: truss · H: hip · R: boss rafter · J: jack')}
 {label(470,893,'Ridge line is a setting-out datum; no physical ridge timber. All dimensions in mm.')}
 </svg>;
}
