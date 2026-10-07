import React, {useMemo,useState} from 'react';
import {buildCentralBossTrussAudit} from '../lib/geometry/centralBossTrussAudit';
const mm=v=>Number(v).toFixed(1);
const td={border:'1px solid #cbd5e1',padding:8};
export default function CentralBossTrussAudit() {
 const [inputs,setInputs]=useState({widthMM:4050,projectionMM:2885,frontPitchDeg:15,gussetWidthMM:595});
 const a=useMemo(()=>buildCentralBossTrussAudit(inputs),[inputs]);
 const chart=(plates=false)=>{
  const shapes=plates?[a.gusset.points,a.chevron.points,a.closure.points]:a.members.map(m=>m.points);
  const points=shapes.flat();
  const minX=Math.min(...points.map(p=>p.xMM)),maxX=Math.max(...points.map(p=>p.xMM));
  const minY=Math.min(...points.map(p=>p.yMM)),maxY=Math.max(...points.map(p=>p.yMM));
  const scale=Math.min(900/(maxX-minX),300/(maxY-minY));
  const x=v=>60+(v-minX)*scale,y=v=>365-(v-minY)*scale;
  return <svg viewBox="0 0 1040 435" style={{width:'100%',background:'#f8fafc'}} aria-label={plates?'Chevron and gusset outlines':'Central boss truss elevation'}>
   {shapes.map((shape,i)=><polygon key={i} points={shape.map(p=>`${x(p.xMM)},${y(p.yMM)}`).join(' ')} fill={plates?(i===2?'#86efac':i?'#fdba74':'#bfdbfe'):'#e7cfaa'} stroke="#334155" strokeWidth="2" />)}
   <line x1={x(a.boss.xMM)} y1="40" x2={x(a.boss.xMM)} y2="375" stroke="#64748b" strokeDasharray="6 5" />
   <circle cx={x(a.boss.xMM)} cy={y(a.boss.yMM)} r="5" fill="#dc2626" />
   {!plates && [['A',a.apexTop],['B',a.boss],['C',a.apexBottom]].map(([label,p])=><g key={label}><circle cx={x(p.xMM)} cy={y(p.yMM)} r="4" fill="#dc2626" /><text x={x(p.xMM)+12} y={y(p.yMM)+5} fontSize="18" fill="#991b1b">{label}</text></g>)}
   <text x="520" y="24" textAnchor="middle" fontSize="19">{plates?'Blue: 9mm gusset · Orange: 18mm chevron · Green: 45×45 closure':'House-wall elevation · central plumb joint'}</text>
   <text x="520" y="415" textAnchor="middle" fontSize="18">{plates?`Shared bottom ${mm(a.gusset.widthMM)}mm · vertical sides ${mm(a.gusset.sideHeightMM)}mm`:`Internal span ${mm(a.widthMM)}mm · side pitch ${mm(a.sidePitchDeg)}° · 220mm joists / 45mm flanges`}</text>
  </svg>;
 };
 return <section style={{marginBottom:16,padding:16,border:'1px solid #cbd5e1',borderRadius:10,background:'#fff'}}>
  <h2 style={{marginTop:0}}>Single central boss — truss audit</h2>
  <p>Read-only proposal. These inputs are separate from Design/Options and do not alter the current roof, Summary or manufacture book.</p>
  <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>{Object.entries(inputs).map(([key,value])=><label key={key}>{key==='widthMM'?'Internal width (mm)':key==='projectionMM'?'Internal projection (mm)':key==='gussetWidthMM'?'Gusset / closure width (mm)':'Front pitch (°)'} <input type="number" value={value} min="0" step="0.1" style={{width:100}} onChange={e=>setInputs({...inputs,[key]:e.target.value})} /></label>)}</div>
  {!a.valid?<p>{a.errors.join(' ')}</p>:<>
   {chart()}
   <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Member','Pitch','External slope','Internal slope','HFC','VFC','Apex cut length'].map(t=><th key={t} style={td}>{t}</th>)}</tr></thead><tbody>{a.members.map(m=><tr key={m.side}>{[m.side,`${mm(m.pitchDeg)}°`,`${mm(m.externalSlopeMM)}mm`,`${mm(m.internalSlopeMM)}mm`,`${mm(m.hfcMM)}mm`,`${mm(m.vfcMM)}mm`,`${mm(m.topCutLengthMM)}mm`].map((t,i)=><td key={i} style={td}>{t}</td>)}</tr>)}</tbody></table>
   <p><b>Apex setting-out:</b> x = {mm(a.boss.xMM)}mm from the internal left frame. Boss centre B = {mm(a.boss.yMM)}mm above the factory floor; top A = {mm(a.apexTop.yMM)}mm; bottom C = {mm(a.apexBottom.yMM)}mm. Apex cuts are plumb at {mm(a.sidePitchDeg)}° off square; the 18° spar-hook cap does not apply to this timber-to-timber joint.</p>
   {chart(true)}
   <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Plate','Quantity','Outer sloping edge','Width','Bounding blank','Net area, each'].map(t=><th key={t} style={td}>{t}</th>)}</tr></thead><tbody>{[['18mm chevron',a.chevron],['9mm gusset',a.gusset]].map(([label,p])=><tr key={label}>{[label,p.quantity,`${mm(p.armMM || p.slopeEdgeMM)}mm`,`${p.widthMM}mm`,`${mm(p.blankWidthMM)} × ${mm(p.blankHeightMM)}mm`,`${p.areaEachM2.toFixed(4)}m²`].map((t,i)=><td key={i} style={td}>{t}</td>)}</tr>)}</tbody></table>
   <p><b>9mm gusset:</b> vertical sides {mm(a.gusset.sideHeightMM)}mm; overall height {mm(a.gusset.blankHeightMM)}mm; each sloping edge {mm(a.gusset.slopeEdgeMM)}mm. The bottom corners meet the joist undersides.</p>
   <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['45×45 closure','Bottom long edge','Top short edge','Inset each end','Angled end length','End angle to bottom','End cut off square'].map(t=><th key={t} style={td}>{t}</th>)}</tr></thead><tbody><tr>{['1 component',`${mm(a.closure.cutLengthMM)}mm`,`${mm(a.closure.shortEdgeMM)}mm`,`${mm(a.closure.endInsetMM)}mm`,`${mm(a.closure.endLengthMM)}mm`,`${mm(a.closure.endAngleToLongEdgeDeg)}°`,`${mm(a.closure.endCutOffSquareDeg)}°`].map((t,i)=><td key={i} style={td}>{t}</td>)}</tr></tbody></table>
   <p>The closure is 45mm high, with opposite angled ends following the joist undersides. The angle to its bottom edge and angle off square are shown separately. <b>Eaves stiffeners:</b> none.</p>
   <details open><summary>Datums and factory checks before integration</summary><ul>{a.assumptions.map(note=><li key={note}>{note}</li>)}</ul></details>
  </>}
 </section>;
}
