import React from 'react';
import {buildVictorianHippedWallplateSchedule} from '../lib/Manufacturing/victorianHippedWallplateSchedule';
import {WorkshopShape} from './ManufacturingGableTrussPage';
const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');

export function VictorianHippedWallplateAssembly({schedule:s}) {
 const a=s.assembly,minX=a.left.externalFoot.xMM,maxX=a.right.externalFoot.xMM;
 const scale=Math.min(980/(maxX-minX),280/a.topHeightMM),floorY=365;
 const map=p=>({x:60+(p.xMM-minX)*scale,y:floorY-p.yMM*scale});
 const polygon=ps=>ps.map(p=>{const q=map(p);return `${q.x},${q.y}`;}).join(' ');
 const h=a.horizontal,tl=map(h.topLeft),tr=map(h.topRight),bl=map(h.bottomLeft),br=map(h.bottomRight);
 const dimension=(x1,x2,y,text)=><g><path d={`M${x1},${y-5}V${y+5} M${x2},${y-5}V${y+5} M${x1},${y}H${x2}`} stroke="#64748b" fill="none"/><text x={(x1+x2)/2} y={y-9} textAnchor="middle" fontSize="17" fontWeight="700">{text}</text></g>;
 return <svg viewBox="0 0 1100 455" role="img" aria-label="Victorian hipped joint-centred wallplate assembly">
  <line x1="35" x2="1065" y1={floorY} y2={floorY} stroke="#94a3b8"/>
  <polygon points={polygon([h.topLeft,h.topRight,h.bottomRight,h.bottomLeft])} fill="#dbeafe" stroke="#111827" strokeWidth="2"/>
  {['left','right'].map((side,n)=>{const w=a[side],A=map(w.A),B=map(w.B),C=map(w.C),foot=map(w.externalFoot);return <g key={side}>
   <polygon points={polygon([w.externalFoot,w.A,w.C,w.internalFoot,{xMM:w.externalFoot.xMM,yMM:a.ringBeamHeightMM}])} fill="#f1f5f9" stroke="#111827" strokeWidth="2"/>
   <circle cx={B.x} cy={B.y} r="5" fill="#7c3aed"/>
   <text x={A.x+(n?14:-14)} y={A.y-5} textAnchor={n?'start':'end'} fontSize="16" fontWeight="700">A</text>
   <text x={B.x+(n?16:-16)} y={B.y+5} textAnchor={n?'start':'end'} fontSize="16" fontWeight="700" fill="#7c3aed">B</text>
   <text x={C.x+(n?-14:14)} y={C.y+18} textAnchor={n?'end':'start'} fontSize="16" fontWeight="700">C</text>
   <text x={(foot.x+A.x)/2} y={(foot.y+A.y)/2-12} transform={`rotate(${n?w.pitchDeg:-w.pitchDeg} ${(foot.x+A.x)/2} ${(foot.y+A.y)/2-12})`} textAnchor="middle" fontSize="16">WB{n+1} · top {mm(w.externalSlopeMM)}mm</text>
  </g>;})}
  {dimension(tl.x,tr.x,tl.y-30,`WP1 top ${mm(s.horizontal.topEdgeMM)}mm`)}
  {dimension(bl.x,br.x,bl.y+50,`WP1 bottom ${mm(s.horizontal.bottomEdgeMM)}mm`)}
  <text x="550" y="42" textAnchor="middle" fontSize="19" fontWeight="700">House-wall elevation · equal-depth mitred joints</text>
  <text x="550" y="411" textAnchor="middle" fontSize="16">Boss-centre spacing {mm(s.planBossDistanceMM)}mm · ringbeam datum {mm(a.ringBeamHeightMM)}mm</text>
  <text x="550" y="439" textAnchor="middle" fontSize="16">Top height {mm(a.topHeightMM)}mm · underside {mm(a.bottomHeightMM)}mm from factory floor</text>
 </svg>;
}

export default function VictorianHippedWallplatePreview({geometry,materials}) {
 const s=buildVictorianHippedWallplateSchedule({geometry,materials});
 if(!s.valid)return <section><h2>Wallplate and boss assembly · review</h2><p role="alert">{s.errors.join(' ')}</p></section>;
 const w=s.wallbars[0];
 return <section className="vh-wallplate"><h2>Wallplate and boss assembly · review</h2>
  <p role="status" className="vh-joint-note">Uses the regular hipped lean-to wallplate rules. Wallbar pitch: {s.assemblySidePitchDeg.toFixed(2)}°. Victorian hip and rafter cuts remain under review.</p>
  <VictorianHippedWallplateAssembly schedule={s}/>
  <div className="vh-wallplate-grid"><article><h3>WB1 / WB2 · sloping wallbars × 2</h3><WorkshopShape points={w.points} title="Sloping wallbar cutting profile" showAngles={false} cutPitch={w.topCutOffSquareDeg} footPitch={w.pitchDeg} compact/></article>
   <article><h3>WP1 · horizontal wallplate × 1</h3><p>Both end mitres: {mm(s.horizontal.leftCutOffSquareDeg)}° off square.</p><WorkshopShape points={s.horizontal.points} title="Horizontal wallplate cutting profile" showAngles={false} compact/></article></div>
  <details><summary>Boss joint coordinates and datums</summary><p>{s.datumNote}</p><div className="vh-table"><table><thead><tr><th>Side</th><th>A · inward top</th><th>B · inward boss centre</th><th>C · inward bottom</th><th>Wallbar pitch</th><th>Joint saw setting</th></tr></thead><tbody>{['left','right'].map(side=>{const w=s.assembly[side];return <tr key={side}><td>{side}</td><td>{mm(w.topPositionMM)}</td><td>{mm(w.bossCentrePositionMM)}</td><td>{mm(w.bottomPositionMM)}</td><td>{w.pitchDeg.toFixed(2)}°</td><td>{s.mitre.wallbarTopCutOffSquareDeg.toFixed(2)}° off square</td></tr>;})}</tbody></table></div></details>
  <style>{`.vh-joint-note{background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:10px}.vh-wallplate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.vh-wallplate-grid article{border:1px solid #cbd5e1;border-radius:7px;padding:10px;min-width:0;break-inside:avoid}.vh-wallplate-grid h3{font-size:15px;margin:0 0 4px}.vh-wallplate-grid p{font-size:13px;margin:5px 0}.vh-wallplate-grid svg{max-height:none!important;margin:4px 0!important}.vh-wallplate>details{margin:14px 0}@media(max-width:650px){.vh-wallplate-grid{grid-template-columns:1fr}}`}</style>
 </section>;
}
