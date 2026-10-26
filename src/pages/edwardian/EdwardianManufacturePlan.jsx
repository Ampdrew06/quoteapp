import React from 'react';
const mm=v=>Number(v).toFixed(1);
export default function EdwardianManufacturePlan({schedule:s}){
 const g=s.geometry,svgHeight=Math.min(1160,Math.max(700,g.externalProjectionMM*744/g.externalWidthMM+354)),scale=Math.min(744/g.externalWidthMM,(svgHeight-354)/g.externalProjectionMM),W=g.externalWidthMM*scale,H=g.externalProjectionMM*scale,L=(1000-W)/2,T=130;
 const px=x=>L+(x+g.externalLeftMM)/g.externalWidthMM*W,py=y=>T+y/g.externalProjectionMM*H;
 const ridgeX=px(g.widthMM/2),ridgeY=py(g.ridgeEndYMM),frontPositions=[0,...g.frontRafters.map(r=>r.centreMM),g.widthMM],sideCentres=[...s.trusses.map(t=>t.centreMM),...g.sideJacks.filter(r=>r.side==='left').map(r=>r.positionMM),g.projectionMM];
 const label=(x,y,text,anchor='middle',fill='#111827',bold=false)=><text x={x} y={y} textAnchor={anchor} fontSize="20" fill={fill} fontWeight={bold?'700':undefined}>{text}</text>;
 const line=(x1,y1,x2,y2,colour='#111827')=> <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colour} strokeWidth="3"/>;
 const dim=(x1,y1,x2,y2,text,vertical=false)=><g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" markerStart="url(#ed-book-arrow)" markerEnd="url(#ed-book-arrow)"/><text x={vertical?x1-12:(x1+x2)/2} y={vertical?(y1+y2)/2:y1-10} transform={vertical?`rotate(-90 ${x1-12} ${(y1+y2)/2})`:undefined} textAnchor="middle" fontSize="22">{text}</text></g>;
 return <svg viewBox={`0 0 1000 ${svgHeight}`} role="img" aria-label="Edwardian manufacturing setting-out plan" style={{fontFamily:'Arial,sans-serif'}}>
 <defs><marker id="ed-book-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#64748b"/></marker></defs>
 {label(500,32,'HOUSE WALL')}
 <rect x={L} y={T} width={W} height={H} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
 <rect x={px(0)} y={T} width={g.widthMM/g.externalWidthMM*W} height={g.projectionMM/g.externalProjectionMM*H} fill="none" stroke="#111827" strokeWidth="3"/>
 <line x1={ridgeX} x2={ridgeX} y1={T} y2={ridgeY} stroke="#475569" strokeWidth="2" strokeDasharray="8 5"/>
 {s.trusses.map((t,n)=><g key={t.id}><line x1={L} x2={L+W} y1={py(t.centreMM)} y2={py(t.centreMM)} stroke="#2563eb" strokeWidth="3"/>{label(px(0)+24,py(t.centreMM)-9,t.id,'start','#2563eb',true)}{label(L+W+10,py(t.centreMM)+6,n===0?'Wall':Math.round(t.centreMM),'start','#111827',true)}</g>)}
 {g.hips.map(h=><g key={h.side}>{line(ridgeX,ridgeY,px(h.side==='left'?-g.externalLeftMM:g.widthMM+g.externalRightMM),py(g.externalProjectionMM))}{label(px(h.side==='left'?g.widthMM*.22:g.widthMM*.78),py(g.ridgeEndYMM+(g.projectionMM-g.ridgeEndYMM)*.58),h.side==='left'?'H1':'H2','middle','#2563eb',true)}</g>)}
 {g.hips.map(h=><g key={`pitch-${h.side}`}>{label(px(h.side==='left'?g.widthMM*.34:g.widthMM*.66)+(h.side==='left'?-20:20),py(g.ridgeEndYMM+(g.projectionMM-g.ridgeEndYMM)*.32)-10,`${mm(g.hipPitchDeg)}°`,h.side==='left'?'end':'start','#dc2626',true)}</g>)}
 {s.members.filter(m=>m.type.endsWith('-jack')).map(m=>{const front=m.type==='front-jack',r=front?g.frontRafters.find(r=>r.id===m.id):g.sideJacks.find(r=>r.id===m.id);const x1=front?px(r.centreMM):px(r.side==='left'?-g.externalLeftMM:g.widthMM+g.externalRightMM),y1=front?py(g.externalProjectionMM):py(r.positionMM),x2=front?x1:px(r.side==='left'?r.hipMeetingXMM:g.widthMM-r.hipMeetingXMM),y2=front?py(r.hipMeetingYMM):y1;return <g key={m.id}>{line(x1,y1,x2,y2,'#2563eb')}{label(front?x1:(x1+x2)/2,front?(y1+y2)/2-5:y1-8,m.ref,'middle','#2563eb',true)}</g>;})}
 {g.frontRafters.map(r=><g key={`position-${r.id}`}>{label(px(r.centreMM),T+H+22,Math.round(r.centreMM),'middle','#111827',true)}</g>)}
 {sideCentres.slice(1).map((p,n)=><g key={`side-gap-${n}`}>{label(px(0)-16,py((p+sideCentres[n])/2)+6,Math.round(p-sideCentres[n]),'end')}</g>)}
 {frontPositions.slice(1).map((p,n)=><g key={`gap-${n}`}>{label(px((p+frontPositions[n])/2),T+H+52,Math.round(p-frontPositions[n]),'middle','#111827',false)}</g>)}
 {g.sideJacks.filter(r=>r.side==='right').map(r=><g key={`side-position-${r.id}`}>{label(L+W+10,py(r.positionMM)+6,Math.round(r.positionMM),'start','#111827',true)}</g>)}
 {g.frontRafters.some(r=>r.role==='boss-rafter')&&<>{line(ridgeX,py(g.externalProjectionMM),ridgeX,ridgeY,'#2563eb')}{label(ridgeX+24,py((g.projectionMM+g.ridgeEndYMM)/2),'R1','start','#2563eb',true)}</>}
 <circle cx={ridgeX} cy={ridgeY} r="7" fill="#111827"/>
 
 {label(L+32,py(g.ridgeEndYMM*.4),'RB1')}{label(L+W-32,py(g.ridgeEndYMM*.4),'RB3')}{label(L+W/2,T+H-14,'RB2')}
 {label(px(g.widthMM*.13),py(180),`${mm(g.pitchDeg)}°`,'middle','#16a34a',true)}{label(px(g.widthMM*.87),py(180),`${mm(g.pitchDeg)}°`,'middle','#16a34a',true)}{label(ridgeX,py(g.projectionMM-180),`${mm(g.frontPitchDeg)}°`,'middle','#16a34a',true)}
 {dim(px(0),65,px(g.widthMM),65,`IW: ${Math.round(g.widthMM)} mm`)}{dim(L,T+H+104,L+W,T+H+104,`EW: ${Math.round(g.externalWidthMM)} mm`)}{dim(L-85,T,L-85,T+H,`EP: ${Math.round(g.externalProjectionMM)} mm`,true)}{dim(L+W+120,T,L+W+120,py(g.projectionMM),`IP: ${Math.round(g.projectionMM)} mm`,true)}
 
 
 </svg>;
}
