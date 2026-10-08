import React from 'react';
import {buildCentralBossDesign} from '../lib/geometry/centralBossDesign';
const mm=value=>Number(value).toFixed(1);
export default function CentralBossDesignPreview({inputs,materials,pricingReady=false}) {
 const a=buildCentralBossDesign({inputs,materials});
 if(!a.valid)return <p role="status">{a.errors.join(' ')}</p>;
 const width=a.widthMM,projection=a.projectionMM,centre=width/2;
 const scale=Math.min(650/a.externalWidthMM,350/a.externalProjectionMM);
 const side=(a.externalWidthMM-width)/2;
 const x=v=>70+(v+side)*scale,y=v=>65+v*scale;
 const trussPoints=a.members.flatMap(m=>m.points),bottom=Math.min(...trussPoints.map(p=>p.yMM));
 const trussScale=Math.min(650/(width+2*a.sideFoot.hfcMM),200/(a.apexTop.yMM-bottom));
 const tx=v=>70+(v+a.sideFoot.hfcMM)*trussScale,ty=v=>300-(v-bottom)*trussScale;
 return <section style={{marginTop:16,padding:16,border:'1px solid #cbd5e1',borderRadius:8,background:'#fff'}}>
  <h2>Single central boss — design preview</h2>
  <p>One central boss, two hips and a rear truss. This choice is remembered with your design. {pricingReady ? 'Summary costing and quotation saving are available. Manufacture dimensions are available in the manufacture book.' : 'Complete the design and enter the closure allowance per metre on Materials to enable quotation pricing. Manufacture dimensions are available in the manufacture book.'}</p>
  <svg viewBox="0 0 800 475" style={{width:'100%',maxWidth:850}} aria-label="Three-facet central-boss roof plan">
   <rect x={x(-side)} y={y(0)} width={a.externalWidthMM*scale} height={a.externalProjectionMM*scale} fill="#f1f5f9" stroke="#94a3b8" />
   <polygon points={`${x(0)},${y(0)} ${x(centre)},${y(0)} ${x(0)},${y(projection)}`} fill="#dbeafe" stroke="#475569" />
   <polygon points={`${x(width)},${y(0)} ${x(centre)},${y(0)} ${x(width)},${y(projection)}`} fill="#dbeafe" stroke="#475569" />
   <polygon points={`${x(0)},${y(projection)} ${x(centre)},${y(0)} ${x(width)},${y(projection)}`} fill="#dcfce7" stroke="#475569" />
   {a.frontRafterLayout.allRafters.map(r=>{const run=projection*Math.min(r.centreMM,width-r.centreMM)/centre;return <line key={r.id} x1={x(r.centreMM)} x2={x(r.centreMM)} y1={y(projection)} y2={y(projection-run)} stroke="#a16207" strokeWidth="2" />;})}
   <circle cx={x(centre)} cy={y(0)} r="6" fill="#dc2626" />
   <text x={x(centre)} y="30" textAnchor="middle" fontSize="17">House wall · boss at {mm(centre)}mm</text>
   <text x={x(centre)} y={y(projection)+32} textAnchor="middle" fontSize="17">Internal {mm(width)} × {mm(projection)}mm · front {mm(a.frontPitchDeg)}°</text>
   <text x={x(centre)} y={y(projection)+56} textAnchor="middle" fontSize="16">Both side pitches {mm(a.sidePitchDeg)}° · preview external {mm(a.externalWidthMM)} × {mm(a.externalProjectionMM)}mm</text>
  </svg>
  <svg viewBox="0 0 800 345" style={{width:'100%',maxWidth:850}} aria-label="Central-boss rear truss elevation">
   {a.members.map(m=><polygon key={m.side} points={m.points.map(p=>`${tx(p.xMM)},${ty(p.yMM)}`).join(' ')} fill="#e7cfaa" stroke="#475569" />)}
   <text x="400" y="30" textAnchor="middle" fontSize="18">Rear truss · 595mm gusset / closure bottom width</text>
   <circle cx={tx(centre)} cy={ty(a.boss.yMM)} r="5" fill="#dc2626" />
  </svg>
  <p><b>Aligned foot cuts:</b> front HFC {mm(a.frontFoot.hfcMM)}mm / VFC {mm(a.frontFoot.vfcMM)}mm; sides HFC {mm(a.sideFoot.hfcMM)}mm / VFC {mm(a.sideFoot.vfcMM)}mm.</p>
  <p><b>Truss joint:</b> gusset vertical sides {mm(a.gusset.sideHeightMM)}mm; overall height {mm(a.gusset.blankHeightMM)}mm. Closure bottom {mm(a.closure.cutLengthMM)}mm / top {mm(a.closure.shortEdgeMM)}mm.</p>
  <details><summary>Current design assumptions</summary><ul>{a.assumptions.map(note=><li key={note}>{note}</li>)}</ul></details>
 </section>;
}
