import React from 'react';
const mm=n=>Number(n).toFixed(1),rad=p=>p*Math.PI/180;
// Workshop drawings only. No values from this component feed ordering, areas or prices.
function profile(pitch,depth,run,vertical=false){const c=Math.cos(rad(pitch)),s=Math.sin(rad(pitch)),i=depth*Math.tan(rad(pitch)/2),a={x:-300*c,y:-300*s};return [a,{x:0,y:0},{x:run,y:0},{x:run,y:-depth},{x:i,y:-depth},vertical?{x:a.x,y:-depth+(a.x-i)*Math.tan(rad(pitch))}:{x:a.x+depth*s,y:a.y-depth*c}];}
const map=(points,x,y,scale,mirror=false)=>points.map(p=>({x:x+(mirror?-p.x:p.x)*scale,y:y-p.y*scale}));
function Edge({a,b,label,offset=15}){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l*offset,ny=dx/l*offset,x1=a.x+nx,y1=a.y+ny,x2=b.x+nx,y2=b.y+ny;let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;return <g><line x1={a.x} y1={a.y} x2={x1+nx*.25} y2={y1+ny*.25} stroke="#64748b"/><line x1={b.x} y1={b.y} x2={x2+nx*.25} y2={y2+ny*.25} stroke="#64748b"/><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b"/><text x={(x1+x2)/2} y={(y1+y2)/2-4} transform={`rotate(${angle} ${(x1+x2)/2} ${(y1+y2)/2})`} textAnchor="middle" fontSize="19" fontWeight="700" fill="#111827">{label}</text></g>;}
function Cut({points,pitch,web=false,mirror=false,run,vertical=false}){const p=points,c=Math.cos(rad(pitch)),inset=(web?143:220)*Math.tan(rad(pitch)/2),lower=vertical?300+inset/c:300-inset;return <g><polygon points={p.map(a=>`${a.x},${a.y}`).join(' ')} fill="#f8fafc" stroke="#111827" strokeWidth="2"/>
 <Edge a={p[0]} b={p[1]} label="300" offset={mirror?20:-20}/><Edge a={p[1]} b={p[2]} label={mm(run)} offset={mirror?20:-20}/>
 <Edge a={p[4]} b={p[5]} label={mm(lower)} offset={mirror?24:-24}/><Edge a={p[3]} b={p[4]} label={mm(run-inset)} offset={mirror?24:-24}/><Edge a={p[5]} b={p[0]} label={vertical?mm(220/c):'143'} offset={mirror?18:-18}/>
 <text x={p[4].x+(mirror?-16:16)} y={p[4].y-10} textAnchor={mirror?'end':'start'} fontSize="20" fontWeight="700" fill="#dc2626">{mm(180+pitch)}°</text>
 {web&&<><text x={p[0].x+(mirror?-8:8)} y={p[0].y+17} fontSize="19" textAnchor={mirror?'end':'start'} fill="#dc2626">90°</text><text x={p[2].x+(mirror?12:-12)} y={p[2].y+20} textAnchor={mirror?'start':'end'} fontSize="19" fill="#dc2626">90°</text></>}
 {vertical&&<text x={p[0].x+(mirror?-10:10)} y={p[0].y+20} textAnchor={mirror?'end':'start'} fontSize="19" fontWeight="700" fill="#dc2626">{mm(90+pitch)}°</text>}
 </g>;}
function Rect({x,y,w,h,length,width,qty}){const p=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];return <g><polygon points={p.map(a=>`${a.x},${a.y}`).join(' ')} fill="#f8fafc" stroke="#111827" strokeWidth="2"/><Edge a={p[0]} b={p[1]} label={mm(length)} offset={-18}/><Edge a={p[2]} b={p[3]} label={mm(length)} offset={-22}/><Edge a={p[3]} b={p[0]} label={String(width)} offset={-18}/><text x={x+w/2} y={y+h/2+7} textAnchor="middle" fontSize="20">×{qty}</text></g>;}
function Panel({title,kind,children}){return <div className={`wallplate-ply-card ${kind}`}><h3>{title}</h3>{children}</div>;}
export default function ManufacturingWallplatePly({geometry:g}){
 if(!g?.wallplateAssembly?.valid||g.bossArrangement==='central')return null;
 const ew=g.horizontalWallplateExternalLengthMM,iw=g.horizontalWallplateInternalLengthMM,left=g.wallplateAssembly.left,right=g.wallplateAssembly.right,joints=Number(Boolean(left))+Number(Boolean(right)),centre=ew-joints*300,half=ew/2,packers=[left,right].filter(Boolean).reduce((n,s)=>n+Math.ceil(s.externalSlopeMM/800),0),fs=Math.min(.45,300/(half+300));
 return <div className="wallplate-ply-grid wallplate-ply-profiles">
 <Panel title="18mm infill & chevrons — ×2 sets · red = corner angles" kind="wallplate-infill-profile"><svg viewBox="0 0 1000 250" style={{fontFamily:'Arial,sans-serif'}} role="img" aria-label="Dimensioned 18mm chevrons and centre infill">
 {left&&<Cut points={map(profile(left.pitchDeg,143,300),185,70,.42)} pitch={left.pitchDeg} web run={300}/>}
 {centre>0?<Rect x={414} y={70} w={172} h={60} length={centre} width={143} qty={2}/>:<text x="500" y="120" textAnchor="middle" fontSize="18">Centre infill: fit to available run</text>}
 {right&&<Cut points={map(profile(right.pitchDeg,143,300),815,70,.42,true)} pitch={right.pitchDeg} web run={300} mirror/>}
 <text x="175" y="240" fontSize="18" textAnchor="middle">{left?'×2 left':''}</text><text x="825" y="240" fontSize="18" textAnchor="middle">{right?'×2 right':''}</text>
 </svg></Panel>
 <Panel title="9mm front faceplate — split to suit 2400mm sheets" kind="wallplate-front-profile"><svg viewBox="0 0 1000 260" style={{fontFamily:'Arial,sans-serif'}} role="img" aria-label="Dimensioned front faceplate and corner angles">
 {left?<Cut points={map(profile(left.pitchDeg,220,half,true),190,60,fs)} pitch={left.pitchDeg} run={half} vertical/>:<Rect x={55} y={60} w={340} h={85} length={half} width={220} qty={1}/>}
 {right?<Cut points={map(profile(right.pitchDeg,220,half,true),810,60,fs,true)} pitch={right.pitchDeg} run={half} vertical mirror/>:<Rect x={605} y={60} w={340} h={85} length={half} width={220} qty={1}/>}
 <text x="500" y="242" fontSize="18" textAnchor="middle">EWPL {mm(ew)} · IWPL {mm(iw)} · horizontal height 220</text>
 </svg></Panel>
 <Panel title="9mm rear faceplate & 75mm packers — max. 800mm centres" kind="wallplate-rear-profile"><svg viewBox="0 0 1000 160" style={{fontFamily:'Arial,sans-serif'}} role="img" aria-label="Dimensioned rear faceplate and wallbar packers"><Rect x={100} y={44} w={535} h={60} length={iw} width={220} qty={1}/><Rect x={795} y={44} w={48} h={60} length={75} width={220} qty={packers}/></svg></Panel>
 </div>;
}
