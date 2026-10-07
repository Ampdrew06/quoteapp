import React, {useState} from 'react';
import {buildSteelTileCourseAudit} from '../lib/Calculations/steelTileCourseAudit';
const cell={border:'1px solid #cbd5e1',padding:7,textAlign:'left'};
const mm=value=>Number(value).toFixed(1);
export default function SteelTileCourseAudit({automaticRoofTiling,roofInputs={}}) {
 const [minimumStarter,setMinimumStarter]=useState('295');
 if(!['britmetShingle','metrotileShingle'].includes(automaticRoofTiling?.productId))return null;
 const comparison=automaticRoofTiling.areaEstimateResult ? {...automaticRoofTiling,result:automaticRoofTiling.areaEstimateResult} : automaticRoofTiling;
 const a=buildSteelTileCourseAudit({automaticRoofTiling:comparison,tileOverhangMM:roofInputs.eaves_overhang_mm ?? 50,minimumStarterMM:minimumStarter===''?200:Number(minimumStarter)-95});
 return <section style={{padding:14,marginBottom:16,border:'2px solid #2563eb',borderRadius:8,background:'#fff'}}>
  <h3 style={{marginTop:0}}>Steel tile courses and remainder audit — read-only</h3>
  <p>Full tile: 1340mm; Britmet full depth: 300mm; coverage: 1245mm; rib overlap: 95mm. Factory minimum: 295mm overall = 200mm visible coverage with an intact rib. Length checks alone do not verify rib retention after an angled cut.</p>
  <label>Minimum physical starter including 95mm rib (mm) <input type="number" min="95" max="1340" value={minimumStarter} style={{width:100}} onChange={e=>setMinimumStarter(e.target.value)} /></label>
  <p style={{fontSize:13}}>A blank value uses the confirmed 295mm physical minimum. This input affects only this read-only audit.</p>
  {!a.valid?<p>{a.errors.join(' ')}</p>:<>
   <p><b>Previous area-based order:</b> {Number(a.currentRawTiles).toFixed(4)} raw → {a.currentRoundedTiles} rounded + {a.allowanceTiles} spare = <b>{a.currentOrderedTiles}</b>.</p>
   {automaticRoofTiling.tileOrderIntegration?.applied && <p><b>Integrated Summary order:</b> {automaticRoofTiling.tileOrderIntegration.tilesUsed} sequence tiles + {automaticRoofTiling.tileOrderIntegration.spares} spare = <b>{automaticRoofTiling.tileOrderIntegration.ordered}</b>. The minimum input compares alternatives only; the integrated factory minimum is fixed at 295mm overall.</p>}
   {a.staggerComplete?<p><b>Nominal stagger-and-carry comparison:</b> {a.staggerTiles} tiles opened + {a.allowanceTiles} spare = <b>{a.staggerOrder}</b>. Adjacent rows are checked for aligned joint positions. If no suitable starter is available, the model tries the row above and uses its remainder for the skipped row. If reuse and the row-above alternative fail, a starter is cut from a new tile and the whole tile is counted. The confirmed minimum is applied to nominal coverage; angled cuts and retained ribs still need validation; this diagnostic layout is not yet a manufacture cutting list.</p>:<p><b>Stagger comparison unresolved:</b> a complete total is withheld because a suitable starter or alternate row sequence could not be established. Review the facet notes below.</p>}
   <p>Width-only carry comparison before stagger checks: {a.rectangularCarryTiles} opened, or {a.rectangularCarryOrder} including spares. This comparison does not override the integrated order.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Facet','Courses','Current raw tiles','Tiles opened in carry comparison','Final remainder','Tiles if every row starts fresh'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{a.facets.map(f=><tr key={f.id}>{[f.label,f.rows.length,Number(f.currentRawTiles).toFixed(4),f.newTiles,`${mm(f.finalRemainderMM)}mm`,f.independentTiles].map((v,i)=><td key={i} style={cell}>{v}</td>)}</tr>)}</tbody></table></div>
   <p>Effective tile cover: {a.coverWidthMM}mm. Starting every row fresh would use {a.independentCourseTiles} tiles before the spare allowance; it is shown only as a comparison.</p>
   <details><summary>Staggered joints, starter sources and fitting sequence</summary>{a.facets.map(f=><div key={f.id} style={{overflowX:'auto',marginTop:12}}>
    <h4>{f.label}</h4>
    <p>Fitting sequence: {f.stagger.sequence.join(' → ') || 'Unresolved'}. {f.stagger.complete?'Nominal joint check complete.':'Incomplete; no tile total supplied.'}</p>
    {f.stagger.errors.map(message=><p key={message} style={{color:'#b91c1c'}}>{message}</p>)}
    <p>{f.stagger.rows.some(r=>r.starterSourceRow!==null) && <>Smallest available offcut coverage: <b>{mm(Math.min(...f.stagger.rows.filter(r=>r.starterSourceRow!==null).map(r=>r.carriedInMM)))}mm</b>. </>}{f.stagger.alternateStarts} row-above starts. Orange shows a starter from an offcut; blue shows new-tile coverage. Bars show the lower-edge cover lengths, not the angled tile shapes.</p>
    <svg viewBox={`0 0 940 ${Math.max(90,f.stagger.rows.length*42+40)}`} style={{width:'100%',minWidth:620,background:'#f8fafc'}} aria-label={`${f.label} nominal tile joints`}>
     {f.stagger.rows.map((r,i)=>{
      const base=Math.max(...f.stagger.rows.map(row=>row.rightEdgeMM));
      const scale=800/base,x=value=>90+value*scale,y=25+i*42;
      const left=r.rightEdgeMM-r.requiredWidthMM;
      const starterLeft=r.rightEdgeMM-r.starterLengthMM;
      return <g key={r.index}>
       <text x="8" y={y+17} fontSize="16">Row {r.index}</text>
       <rect x={x(left)} y={y} width={r.requiredWidthMM*scale} height="24" fill="#bfdbfe" stroke="#334155" />
       {r.starterSourceRow!==null && <rect x={x(starterLeft)} y={y} width={r.starterLengthMM*scale} height="24" fill="#fdba74" stroke="#334155" />}
       {r.jointsMM.map(j=><line key={j} x1={x(j)} y1={y} x2={x(j)} y2={y+24} stroke="#111827" strokeWidth="2" />)}
      </g>;
     })}
    </svg>
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Row','Starter source','Available starter coverage','Fitted starter coverage','New tiles','Remainder coverage','Nominal joints from left datum'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{f.stagger.rows.map(r=><tr key={r.index}>{[r.index,r.starterSourceRow===null?r.source:`${r.source}: row ${r.starterSourceRow}`,`${mm(r.carriedInMM>0?r.carriedInMM:a.coverWidthMM)}mm`,`${mm(r.starterLengthMM)}mm`,r.newTiles,`${mm(r.carriedOutMM)}mm`,r.jointsMM.length?r.jointsMM.map(mm).join(', ')+'mm':'None'].map((v,i)=><td key={i} style={cell}>{v}</td>)}</tr>)}</tbody></table>
    {f.stagger.heldRemainders.map((piece,i)=><p key={i}>Held offcut from row {piece.fromRow}: {mm(piece.lengthMM)}mm — {piece.reason}.</p>)}
   </div>)}</details>
   {a.facets.some(f=>f.physicalOffcuts.length>0) && <details style={{marginTop:12}}><summary>Squared mitred offcuts — Britmet 300mm depth</summary>
    <p>Green is the square retained piece; grey is its 95mm rib; red is the triangular material discarded when squaring. Reuse requires at least 295mm overall, including 200mm visible coverage. These diagrams project the existing nominal tile positions: they do not change the tile total.</p>
    <p>The earlier full-width envelope may already reserve the shortest usable length. Do not subtract the red triangle again from an already squared remainder. This is a cut-geometry check; first-course placement, top trimming and actual rib retention still need checking.</p>
    {a.facets.map(f=><div key={f.id} style={{overflowX:'auto',marginTop:12}}><h4>{f.label}</h4>
     {(()=>{const p=f.physicalOffcuts.find(r=>r.valid && r.discardedAreaMM2>0) || f.physicalOffcuts.find(r=>r.valid);if(!p)return null;
      const scale=650/p.tileLengthMM,x=v=>160+v*scale,y=v=>50+v*0.5;
      const points=poly=>poly.map(q=>`${x(q.x)},${y(q.y)}`).join(' ');
      return <svg viewBox="0 0 900 265" style={{width:'100%',minWidth:600,background:'#f8fafc'}} aria-label={`${f.label} row ${p.index} squared offcut`}>
       <text x="20" y="26" fontSize="17">Row {p.index}: face-up; original rib on left</text>
       <polygon points={points(p.polygon)} fill="#fecaca" stroke="#334155" />
       {p.squarePolygon.length>0 && <polygon points={points(p.squarePolygon)} fill="#bbf7d0" stroke="#334155" />}
       {p.ribIntact && <rect x={x(0)} y={y(0)} width={95*scale} height={150} fill="#cbd5e1" stroke="#334155" />}
       <text x="20" y="225" fontSize="17">Square {mm(p.squareLengthMM)}mm overall → {mm(p.visibleCoverageMM)}mm visible; {p.usable?'length suitable for reuse':'below reuse minimum'}.</text>
       <text x="20" y="252" fontSize="15">Red is discarded. Diagram includes the full 300mm depth; top-course trimming is unverified.</text>
      </svg>;
     })()}
     <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Row','Mitred long edge','Square overall','Visible after 95mm rib','Reuse length check','Difference from nominal coverage','Top trim needs checking'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{f.physicalOffcuts.map(p=><tr key={p.index}>{[p.index,p.valid?`${mm(p.longestLengthMM)}mm`:'Invalid',p.valid?`${mm(p.squareLengthMM)}mm`:'Invalid',p.valid?`${mm(p.visibleCoverageMM)}mm`:'Invalid',p.valid && p.usable?'Meets minimum':'Do not reuse',p.valid?`${mm(p.coverageDifferenceMM)}mm`:'Invalid',p.topCourse?'Yes':'No'].map((v,i)=><td key={i} style={cell}>{v}</td>)}</tr>)}</tbody></table>
    </div>)}
   </details>}
   <details><summary>Course-by-course widths and remainder</summary>{a.facets.map(f=><div key={f.id} style={{overflowX:'auto',marginTop:12}}><h4>{f.label}</h4><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Row','Slope interval','Lower width','Upper width','Average used today','Full-width envelope','Remainder in','New tiles','Remainder out'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{f.rows.map(r=><tr key={r.index}>{[r.index,`${mm(r.startYMM)}–${mm(r.endYMM)}mm`,`${mm(r.startWidthMM)}mm`,`${mm(r.endWidthMM)}mm`,`${mm(r.averageWidthMM)}mm`,`${mm(r.requiredWidthMM)}mm`,`${mm(r.carriedInMM)}mm`,r.newTiles,`${mm(r.carriedOutMM)}mm`].map((v,i)=><td key={i} style={cell}>{v}</td>)}</tr>)}</tbody></table></div>)}</details>
   {a.endpointChecks.length>0 && <details style={{marginTop:12}}><summary>Wallbar top-joint versus tiled-height reference</summary><p>The factory measurement ends at top joint A, not boss centre B. These structural-edge references exclude the chamfered-lath and covering offsets; they must not be used as replacement tile dimensions.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Side','Wallbar upper edge','Gutter slope extension','Combined reference','Current tiled height','Difference'].map(t=><th key={t} style={cell}>{t}</th>)}</tr></thead><tbody>{a.endpointChecks.map(r=><tr key={r.side}>{[r.side,...[r.wallbarExternalSlopeMM,r.tileExtensionSlopeMM,r.wallbarPlusExtensionMM,r.currentTilingHeightMM,r.differenceMM].map(v=>`${mm(v)}mm`)].map((v,i)=><td key={i} style={cell}>{v}</td>)}</tr>)}</tbody></table></div></details>}
   <details style={{marginTop:12}}><summary>Calculation limits</summary><ul>{a.limitations.map(t=><li key={t}>{t}</li>)}</ul></details>
  </>}
 </section>;
}
