import React from 'react';
import {buildVictorianHippedMemberSchedule} from '../lib/Manufacturing/victorianHippedMemberSchedule';
import {buildVictorianHippedWallplateSchedule} from '../lib/Manufacturing/victorianHippedWallplateSchedule';
const mm=n=>Number(n).toFixed(1);

export function buildVictorianHippedCheckRows({geometry,inputs,materials}){
 const members=buildVictorianHippedMemberSchedule({geometry,inputs,materials});
 const wallplate=buildVictorianHippedWallplateSchedule({geometry,materials});
 if(!members.valid||!wallplate.valid)return {valid:false,errors:[...members.errors,...wallplate.errors],rows:[]};
 const rows=members.members.map(m=>({reference:m.ref,type:m.type,location:m.role==='wall-rafter'?(m.id==='WL'?'Left wall':'Right wall'):m.facetId||`${m.bossId} · hip`,connection:m.jackConnection?.supportingHipRef||(m.bossId?`${m.bossId} boss`:wallplate.horizontal.ref),topEdgeMM:m.topEdgeMM,bottomEdgeMM:m.bottomEdgeMM,pitchDeg:m.pitchDeg,topCutDeg:m.topCutOffSquareDeg,footRunMM:m.horizontalFootCutMM,footHeightMM:m.verticalFootCutMM}));
 wallplate.wallbars.forEach(m=>rows.push({reference:m.ref,type:'Sloping wallbar',location:m.side==='left'?'House wall · left':'House wall · right',connection:wallplate.horizontal.ref,topEdgeMM:m.topEdgeMM,bottomEdgeMM:m.bottomEdgeMM,pitchDeg:m.pitchDeg,topCutDeg:m.topCutOffSquareDeg,footRunMM:m.horizontalFootCutMM,footHeightMM:m.verticalFootCutMM}));
 const h=wallplate.horizontal;
 rows.push({reference:h.ref,type:'Horizontal wallplate',location:'House wall · centre',connection:wallplate.wallbars.map(m=>m.ref).join(' / ')||'Wall ends',topEdgeMM:h.topEdgeMM,bottomEdgeMM:h.bottomEdgeMM,pitchDeg:0,topCutDeg:h.leftCutOffSquareDeg,rightCutDeg:h.rightCutOffSquareDeg,footRunMM:null,footHeightMM:null});
 rows.sort((a,b)=>Number(a.reference.slice(1))-Number(b.reference.slice(1)));
 return {valid:true,errors:[],rows};
}

export default function VictorianHippedCutCheckSheet(props){
 const result=buildVictorianHippedCheckRows(props);
 if(!result.valid)return <section><h2>Factory cut-length check sheet</h2><p role="alert">{result.errors.join(' ')}</p></section>;
 const g=props.geometry;
 return <section className="vh-check-sheet"><h2>Factory cut-length check sheet · review</h2>
 <p><b>{mm(g.widthMM)} × {mm(g.projectionMM)}mm internal</b> · front {mm(g.pitchDeg)}° · sides {mm(g.sidePitchDeg)}° · boss inset {mm(g.bossInsetMM)}mm</p>
 <p>Dimensions in mm. References match the plan and cutting profiles. Record each mirrored member separately. These are provisional comparison values; this sheet does not approve the design for manufacture.</p>
 <p><b>Top edge:</b> straight edge from the upper end cut to the outer toe. <b>Bottom edge:</b> straight edge from the lower end cut to the internal heel. Measure the finished timber edges shown on the profiles; exclude metal hooks. The horizontal wallplate uses its upper and lower horizontal edges.</p>
 <p>Roof / job reference: ________________________ &nbsp; Date: ______________ &nbsp; Measured by: ________________________</p>
 <div className="vh-table"><table><thead><tr><th>Ref</th><th>Member / position</th><th>Connects to</th><th>Calculated top</th><th>Measured top</th><th>Calculated bottom</th><th>Measured bottom</th><th>Notes</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.reference}><td><b>{r.reference}</b></td><td>{r.type}<br/>{r.location}</td><td>{r.connection}</td><td>{mm(r.topEdgeMM)}</td><td className="vh-record-cell"> </td><td>{mm(r.bottomEdgeMM)}</td><td className="vh-record-cell"> </td><td className="vh-record-cell"> </td></tr>)}</tbody></table></div>
 <details><summary>Angle and foot-cut reference</summary><p>Angles are degrees. Top cuts are measured off square. Foot run is horizontal; foot height is vertical. Use the cutting profiles to identify the points.</p><div className="vh-table"><table><thead><tr><th>Ref</th><th>Member pitch</th><th>Top saw setting</th><th>Horizontal foot run</th><th>Vertical foot height</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.reference}><td>{r.reference}</td><td>{mm(r.pitchDeg)}°</td><td>{r.rightCutDeg===undefined?`${mm(r.topCutDeg)}°`:`L ${mm(r.topCutDeg)}° / R ${mm(r.rightCutDeg)}°`}</td><td>{r.footRunMM===null?'—':mm(r.footRunMM)}</td><td>{r.footHeightMM===null?'—':mm(r.footHeightMM)}</td></tr>)}</tbody></table></div></details>
 <style>{`.vh-check-sheet{margin-top:24px;border-top:2px solid #94a3b8;padding-top:12px}.vh-record-cell{min-width:80px}.vh-check-sheet td{height:36px}.vh-check-sheet th{background:#f1f5f9}@media print{.vh-check-sheet{break-before:page}.vh-check-sheet .vh-table{overflow:visible}.vh-check-sheet table{font-size:10px}.vh-check-sheet td,.vh-check-sheet th{padding:5px}.vh-record-cell{min-width:45px}.vh-check-sheet tr{break-inside:avoid}.vh-check-sheet thead{display:table-header-group}}`}</style>
 </section>;
}
