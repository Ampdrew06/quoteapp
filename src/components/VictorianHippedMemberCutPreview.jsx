import React from 'react';
import {WorkshopShape} from './ManufacturingGableTrussPage';
import {buildVictorianHippedMemberSchedule} from '../lib/Manufacturing/victorianHippedMemberSchedule';
const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
export default function VictorianHippedMemberCutPreview({geometry,inputs,materials,kind='all'}) {
 const schedule=buildVictorianHippedMemberSchedule({geometry,inputs,materials});
 const title=kind==='hips'?'Hips':kind==='rafters'?'Rafters and jack rafters':'Hip and rafter cutting profiles · review';
 if(!schedule.valid)return <section><h2>{title}</h2><p role="alert">{schedule.errors.join(' ')}</p></section>;
 const include=m=>kind==='hips'?m.role==='hip':kind==='rafters'?m.role!=='hip':true;
 const groups=schedule.groups.filter(rows=>include(rows[0])).sort((a,b)=>Math.min(...a.map(r=>Number(r.ref.slice(1))))-Math.min(...b.map(r=>Number(r.ref.slice(1)))));
 const members=schedule.members.filter(include);
 if(!groups.length)return null;
 return <section className="vh-member-cuts" data-book-section={kind}><h2>{title}</h2>
  <p>Connection datums and allowances require factory confirmation for this style. Shapes use 220mm members with the existing 45mm thickness; spar-hook top cuts are capped at 18° off square.</p>
  <div className="vh-cut-grid">{groups.map(rows=>{const m=rows[0],refs=rows.map(r=>r.ref).join(' / ');return <article className="vh-cut-card" key={refs}><h3>{refs} · {m.type} × {rows.length}</h3><WorkshopShape points={m.points} title={`${refs} cutting profile`} showAngles={false} cutPitch={m.topCutOffSquareDeg} footPitch={m.pitchDeg} compact/>{m.role==='hip'&&<p>Toe trim from heel: {mm(m.firstTrimDistanceMM)}–{mm(m.horizontalFootCutMM)}mm.</p>}</article>;})}</div>
  <details><summary>Connection allowances and cut checks</summary><p>{schedule.datumNote}</p><div className="vh-table"><table><thead><tr><th>Member</th><th>Top edge</th><th>Bottom edge</th><th>Wallplate face · plan</th><th>Hip boss · plan</th><th>Boss rafter · slope</th><th>Jack setback · plan</th></tr></thead><tbody>{members.map(m=><tr key={m.ref}><td>{m.ref}</td><td>{mm(m.topEdgeMM)}</td><td>{mm(m.bottomEdgeMM)}</td><td>{mm(m.wallplateFacePlanMM)}</td><td>{mm(m.bossAllowancePlanMM)}</td><td>{mm(m.bossAllowanceSlopeMM)}</td><td>{mm(m.jackConnection?.hipCentrelineSetbackMM??0)}</td></tr>)}</tbody></table></div></details>
  <style>{`.vh-member-cuts{break-before:page}.vh-cut-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.vh-cut-card{border:1px solid #cbd5e1;border-radius:7px;padding:10px;min-width:0;break-inside:avoid;background:#fff}.vh-cut-card h3{font-size:15px;margin:0 0 4px}.vh-cut-card svg{margin:4px 0!important;max-height:none!important}.vh-cut-card p{font-size:12px;margin:5px 0}.vh-member-cuts>details{margin-top:16px}@media(max-width:650px){.vh-cut-grid{grid-template-columns:1fr}}@media print{.vh-cut-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
 </section>;
}
