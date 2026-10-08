import React from 'react';
const mm=value=>Number(value).toFixed(1);
function Shape({points=[],fill='#e2e8f0',caption}) {
 const xs=points.map(p=>p.xMM),ys=points.map(p=>p.yMM);
 const left=Math.min(...xs),right=Math.max(...xs),bottom=Math.min(...ys),top=Math.max(...ys);
 const width=right-left,height=top-bottom;
 const scale=Math.min(840/width,200/height);
 const coords=points.map(p=>`${80+(p.xMM-left)*scale},${50+(top-p.yMM)*scale}`).join(' ');
 return <svg viewBox="0 0 1000 310" role="img" aria-label={caption} style={{width:'100%',height:'auto',display:'block'}}>
  <polygon points={coords} fill={fill} stroke="#111827" strokeWidth="2" />
  <text x="80" y="290" fontSize="23" fill="#111827">{caption}</text>
 </svg>;
}
function Data({rows}) {return <table style={{width:'100%',borderCollapse:'collapse',fontSize:15}}><tbody>{rows.map(([label,value])=><tr key={label}><th style={{textAlign:'left',border:'1px solid #94a3b8',padding:7}}>{label}</th><td style={{border:'1px solid #94a3b8',padding:7}}>{value}</td></tr>)}</tbody></table>;}
export default function ManufacturingCentralTrussDrawing({truss,memberRefs=[]}) {
 if(!truss?.valid)return null;
 const member=truss.members[0],g=truss.gusset,c=truss.chevron,closure=truss.closure;
 const panel={padding:'4mm',border:'1px solid #94a3b8',background:'white'};
 const bounds=truss.members.flatMap(m=>m.points),minX=Math.min(...bounds.map(p=>p.xMM)),maxX=Math.max(...bounds.map(p=>p.xMM)),maxY=Math.max(...bounds.map(p=>p.yMM)),minY=Math.min(...bounds.map(p=>p.yMM));
 const scale=Math.min(870/(maxX-minX),320/(maxY-minY));
 const map=p=>`${65+(p.xMM-minX)*scale},${55+(maxY-p.yMM)*scale}`;
 return <>
 <section className="pm-page pm-truss-page"><div style={panel}><h2 style={{fontSize:18,margin:'0 0 12px'}}>Rear truss — single central boss</h2>
  <svg viewBox="0 0 1000 470" role="img" aria-label="Rear truss assembly" style={{width:'100%',height:'auto'}}>
   {truss.members.map(m=><polygon key={m.side} points={m.points.map(map).join(' ')} fill="#e7c994" stroke="#111827" strokeWidth="2" />)}
   <polygon points={g.points.map(map).join(' ')} fill="#dbeafe" fillOpacity="0.75" stroke="#1d4ed8" strokeWidth="2" />
   <polygon points={c.points.map(map).join(' ')} fill="none" stroke="#0f766e" strokeWidth="2" />
   <polygon points={closure.points.map(map).join(' ')} fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
   <circle cx={65+(truss.boss.xMM-minX)*scale} cy={55+(maxY-truss.boss.yMM)*scale} r="5" fill="#dc2626" />
   <text x="500" y="24" textAnchor="middle" fontSize="24">Boss centre — {mm(truss.boss.xMM)}mm from internal left frame</text>
   <text x="500" y="420" textAnchor="middle" fontSize="24">Internal span {mm(truss.widthMM)}mm · side pitch {mm(truss.sidePitchDeg)}°</text>
   <text x="500" y="454" textAnchor="middle" fontSize="23">Flat gusset / closure bottom {mm(g.widthMM)}mm</text>
  </svg>
  <h3 style={{fontSize:17}}>Truss members — {memberRefs.join(' / ') || 'left and right'} · quantity 2, mirrored</h3>
  <Shape points={member.points} fill="#e7c994" caption={`External slope ${mm(member.externalSlopeMM)}mm · internal slope ${mm(member.internalSlopeMM)}mm`} />
  <Data rows={[
   ['Member section','220mm I-joist · 45mm flanges'],
   ['HFC / VFC',`${mm(member.hfcMM)} / ${mm(member.vfcMM)}mm`],
   ['Apex cut',`${mm(member.topCutLengthMM)}mm · ${mm(member.topCutOffSquareDeg)}° off square`],
   ['Boss centre height',`${mm(truss.boss.yMM)}mm above ring-beam underside datum`],
   ['Joint components','2 × 18mm chevrons; 2 × 9mm gussets; 1 × assembled closure'],
  ]} />
 </div></section>
 <section className="pm-page pm-truss-page"><div style={panel}><h2 style={{fontSize:18,margin:'0 0 8px'}}>Truss joint components</h2>
  <h3 style={{fontSize:16,margin:'8px 0'}}>9mm gussets / faceplates — quantity 2</h3>
  <Shape points={g.points} fill="#dbeafe" caption={`Bottom ${mm(g.widthMM)}mm · sides ${mm(g.sideHeightMM)}mm · slopes ${mm(g.slopeEdgeMM)}mm`} />
  <p style={{fontSize:15,margin:4}}>Overall height {mm(g.blankHeightMM)}mm. Bottom corners meet the underside edges of both truss members.</p>
  <h3 style={{fontSize:16,margin:'8px 0'}}>18mm chevrons — quantity 2</h3>
  <Shape points={c.points} fill="#ccfbf1" caption={`Longest slope ${mm(c.armMM)}mm · perpendicular strip width ${mm(c.widthMM)}mm`} />
  <p style={{fontSize:15,margin:4}}>Overall blank {mm(c.blankWidthMM)} × {mm(c.blankHeightMM)}mm. Both arms follow {mm(truss.sidePitchDeg)}° pitch.</p>
  <h3 style={{fontSize:16,margin:'8px 0'}}>Truss closure — assembled from rafter offcuts</h3>
  <Shape points={closure.points} fill="#cbd5e1" caption={`Bottom ${mm(closure.cutLengthMM)}mm · top ${mm(closure.shortEdgeMM)}mm · height 45mm`} />
  <p style={{fontSize:15,margin:4}}>Finished closure envelope: 45mm between faceplates. Ends {mm(closure.endLengthMM)}mm at {mm(closure.endAngleToLongEdgeDeg)}° to the bottom edge ({mm(closure.endCutOffSquareDeg)}° off square). Internal offcut joints are not dimensioned.</p>
 </div></section>
 </>;
}
