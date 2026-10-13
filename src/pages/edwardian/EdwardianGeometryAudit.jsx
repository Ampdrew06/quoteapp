import EdwardianNavigation from './EdwardianNavigation';
import {buildEdwardianMaterialsReconciliation} from '../../lib/Calculations/edwardianMaterialsReconciliation';
import {buildEdwardianMetalMiscAudit} from '../../lib/Calculations/edwardianMetalMiscAudit';
import {buildEdwardianLathReconciliation} from '../../lib/Calculations/edwardianLathReconciliation';
import {buildEdwardianPlasticsGutteringAudit} from '../../lib/Calculations/edwardianPlasticsGutteringAudit';
import {buildEdwardianTilingAudit} from '../../lib/Calculations/edwardianTilingAudit';
import {buildEdwardianInternalLathAudit} from '../../lib/Calculations/edwardianInternalLathAudit';
import {buildEdwardianInsulationAudit} from '../../lib/Calculations/edwardianInsulationAudit';
import {buildEdwardianTimberAudit} from '../../lib/Calculations/edwardianTimberAudit';
import {buildEdwardianRingBeamAudit} from '../../lib/Calculations/edwardianRingBeamAudit';
import {buildEdwardianMemberAudit} from '../../lib/Calculations/edwardianMemberAudit';
import React,{useState,useEffect} from 'react';
import {Link,Navigate,useLocation} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
const KEY='edwardianInputs';
const initial={widthMM:3560,projMM:3550,pitchDeg:25,frameThicknessMM:70,soffitMM:150,ridgeMode:'automatic',frontPitchDeg:25,ridgePositionMM:1770,sideSoffitMode:'automatic',specifiedSideSoffitMM:100,tileProductId:'britmetShingle',plasticsColour:'white',gutterProfile:'square',tileColour:'Titanium',gutterColour:'White',customerReference:'',deliveryPostcode:'',selectedCustomerId:'retail'};
const restore=()=>{try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('edwardianGeometryAuditInputs')||'{}')};}catch{return {...initial};}};
const mm=n=>Number(n).toFixed(1);
export default function EdwardianGeometryAudit(){
 const [inputs]=useState(restore),location=useLocation();
 useEffect(()=>{if(location.hash==='#edwardian-tiles-laths')document.getElementById('edwardian-tiles-laths')?.scrollIntoView();},[location.hash]);


 if(!isAdminUser())return <Navigate to="/quote" replace />;
 const g=buildEdwardianGeometry({inputs,materials:getMaterials()});
 const reconciliation=buildEdwardianMaterialsReconciliation({inputs,materials:getMaterials()});
 const metalMisc=buildEdwardianMetalMiscAudit({geometry:g,materials:getMaterials(),productId:inputs.tileProductId??'britmetShingle'});
 const lathPool=buildEdwardianLathReconciliation({geometry:g,materials:getMaterials(),productId:inputs.tileProductId??'britmetShingle'});
 const plasticsGutters=buildEdwardianPlasticsGutteringAudit({geometry:g,materials:getMaterials(),plasticsColour:inputs.plasticsColour??'white',gutterProfile:inputs.gutterProfile??'square'});
 const tiling=buildEdwardianTilingAudit({geometry:g,materials:getMaterials(),productId:inputs.tileProductId??'britmetShingle'});
 const internalLaths=buildEdwardianInternalLathAudit({geometry:g,materials:getMaterials()});
 const insulation=buildEdwardianInsulationAudit({geometry:g,materials:getMaterials()});
 const timberAudit=buildEdwardianTimberAudit({geometry:g,materials:getMaterials()});
 const ringAudit=buildEdwardianRingBeamAudit({geometry:g});
 const memberAudit=buildEdwardianMemberAudit({geometry:g});
 const scale=g.valid?Math.min(540/g.externalWidthMM,570/g.externalProjectionMM):1;
 const x=n=>140+(n+(g.externalLeftMM||0))*scale,y=n=>100+n*scale;
 const line=(x1,y1,x2,y2,props={})=><line x1={x(x1)} y1={y(y1)} x2={x(x2)} y2={y(y2)} {...props}/>;
 return <><EdwardianNavigation/>
 <main className="ed-audit" style={{maxWidth:1050,margin:'0 auto',padding:20,fontFamily:'Inter,system-ui,Arial'}}>
 <style>{`.ed-audit .ed-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16}.ed-audit label{display:grid;gap:6}.ed-audit input,.ed-audit select{padding:9px;border:1px solid #cbd5e1;border-radius:7px;font:inherit;width:100%;box-sizing:border-box}.ed-audit section{border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:18px 0}.ed-audit th,.ed-audit td{padding:9px;border:1px solid #cbd5e1;text-align:left}.ed-audit table{border-collapse:collapse;width:100%}.ed-audit button{padding:9px;font:inherit;margin-top:15px}`}</style>
 <h1>Edwardian — Technical</h1><p>Read-only audits of the current Edwardian design. Change dimensions and options on Design/Options.</p>
 <p><Link to="/quote/edwardian">Return to Design/Options</Link></p>
 {!g.valid?<p role="alert">{g.errors.join(' ')}</p>:<>
 <section><h2>Plan setting-out</h2><svg width="850" height="820" viewBox="0 0 850 820" role="img" aria-label="Edwardian ridge, terminal truss and front hip setting-out" style={{width:'100%',height:'auto'}}>
 <text x="425" y="35" textAnchor="middle" fontSize="18">House wall · internal width {mm(g.widthMM)}mm</text>
 <rect x={x(-g.externalLeftMM)} y={y(0)} width={g.externalWidthMM*scale} height={g.externalProjectionMM*scale} fill="#f8fafc" stroke="#64748b"/>
 <rect x={x(0)} y={y(0)} width={g.widthMM*scale} height={g.projectionMM*scale} fill="none" stroke="#111827" strokeDasharray="5 4"/>
 {line(g.widthMM/2,0,g.widthMM/2,g.ridgeEndYMM,{stroke:'#b91c1c',strokeDasharray:'6 4',strokeWidth:2})}
 {g.layout.centresMM.map((centre,i)=><g key={centre}>{line(0,centre,g.widthMM,centre,{stroke:'#2563eb',strokeWidth:2})}<text x={x(0)-12} y={y(centre)+5} textAnchor="end" fontSize="16">T{i+1}</text><text x={x(g.widthMM)+12} y={y(centre)+5} fontSize="16">{mm(centre)}</text></g>)}
 {g.sideJacks.map(r=><g key={r.id}>{line(r.side==='left'?0:g.widthMM,r.positionMM,r.side==='left'?r.hipMeetingXMM:g.widthMM-r.hipMeetingXMM,r.positionMM,{stroke:'#2563eb',strokeWidth:2})}<text x={r.side==='left'?x(0)-12:x(g.widthMM)+12} y={y(r.positionMM)+5} textAnchor={r.side==='left'?'end':'start'} fontSize="14">{Math.round(r.positionMM)}</text></g>)}
 {g.hips.map(h=><g key={h.side}>{line(h.start.xMM,h.start.yMM,h.end.xMM,h.end.yMM,{stroke:'#111827',strokeWidth:3})}</g>)}
 {g.frontRafters.map(r=><g key={r.id}>{line(r.centreMM,g.projectionMM,r.centreMM,r.hipMeetingYMM,{stroke:'#2563eb',strokeWidth:2})}<text x={x(r.centreMM)} y={y(g.projectionMM)+24} textAnchor="middle" fontSize="14">{Math.round(r.centreMM)}</text></g>)}
 <circle cx={x(g.ridge.xMM)} cy={y(g.ridge.yMM)} r="5" fill="#b91c1c"/>
 <text x="425" y="742" textAnchor="middle" fontSize="17">Ridge point {mm(g.ridgeEndYMM)}mm · terminal truss {mm(g.terminalTrussCentreMM)}mm</text>
 <text x="425" y="771" textAnchor="middle" fontSize="17">Internal projection {mm(g.projectionMM)}mm · front pitch {mm(g.frontPitchDeg)}°</text>
 <text x="425" y="800" textAnchor="middle" fontSize="14">Blue: truss members and jacks · black: hip centrelines</text>
 </svg></section>
 <section><h2>Geometry results</h2><table><tbody>{[
 ['Ridge setback from internal front frame',`${mm(g.ridgeSetbackMM)}mm`],['Ridge terminal from house wall',`${mm(g.ridgeEndYMM)}mm`],['Terminal truss centre',`${mm(g.terminalTrussCentreMM)}mm (33mm behind terminal)`],['Side / front pitches',`${mm(g.pitchDeg)}° / ${mm(g.frontPitchDeg)}°`],['Hip pitch',`${mm(g.hipPitchDeg)}°`],['Rear truss centres from house wall',g.layout.centresMM.map(mm).join(', ')+'mm'],['Rear centre spacings',g.layout.gapsMM.map(mm).join(', ')+'mm'],['Side jack centres from house wall',g.sideJacks.filter(r=>r.side==='left').map(r=>mm(r.positionMM)).join(', ')+'mm (both sides)'],['Side centre spacings, terminal to internal corner',g.sideLayout.gapsMM.map(mm).join(', ')+'mm'],['Rear truss count, including terminal',g.layout.trussCount],['Boss / hips / front boss rafter','1 / 2 / 1'],['Manufacturing external footprint',`${mm(g.externalWidthMM)} × ${mm(g.externalProjectionMM)}mm`],['Front HFC / VFC',`${mm(g.eaves.referenceGeometry.raw.manufacturedHorizontalFootCutMM)} / ${mm(g.eaves.referenceGeometry.raw.manufacturedPlumbCutHeightMM)}mm`],['Side HFC / VFC',`${mm(g.eaves.left.geometry.raw.manufacturedHorizontalFootCutMM)} / ${mm(g.eaves.left.geometry.raw.manufacturedPlumbCutHeightMM)}mm`],
 ].map(([k,v])=><tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table></section>
 <section><h2>Member cutting candidates — read only</h2><p>Compare the external slope column with the recorded factory lengths. Jack comparisons also require their actual installed centre positions.</p>
 {!memberAudit.valid&&<p role="alert">{memberAudit.errors.join(' ')}</p>}
 <div style={{overflowX:'auto'}}><table><thead><tr>{['Member','Internal slope (mm)','External slope (mm)','HFC (mm)','VFC (mm)','Top cut off square'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{memberAudit.members.map(m=><tr key={m.id}><th>{m.label}</th>{[m.profile.internalSlopeLengthMM,m.profile.externalSlopeLengthMM,m.profile.horizontalFootCutMM,m.profile.verticalFootCutMM].map((v,i)=><td key={i}>{v==null?'—':mm(v)}</td>)}<td>{m.profile.topCutOffSquareDeg==null?'—':mm(m.profile.topCutOffSquareDeg)+'°'}</td></tr>)}</tbody></table></div>
 <p><strong>Boss-rafter connection:</strong> working 118mm horizontal gap from the terminal truss front face. Current assembly: 63mm; spar-hook top cut follows the pitch up to 18°, then remains at 18°. Review through factory feedback.</p>
 <ul>{memberAudit.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></section>
 <section><h2>Ring-beam audit — shared builder</h2>
 {!ringAudit.valid?<p role="alert">{ringAudit.errors.join(' ')}</p>:<>
 <p>Three perimeter runs · 195mm upstands · 185mm PIR faces · 48mm member slots.</p>
 <div style={{overflowX:'auto'}}><table><thead><tr>{['Beam / layer','Internal edge (mm)','External edge (mm)','Width (mm)','Start / end square leg (mm)'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{ringAudit.ringBeams.flatMap(b=>Object.entries(b.layerProfiles).map(([key,p])=><tr key={b.id+key}><th>{b.manufactureRef} {b.side} — {key==='ply9Base'?'9mm ply base':key==='pse30x90'?'30×95 PSE':'25×50 outer fixing lath'}</th><td>{mm(p.internalEdgeLengthMM)}</td><td>{mm(p.externalEdgeLengthMM)}</td><td>{mm(p.widthMM)}</td><td>{mm(p.startSquareLegMM)} / {mm(p.endSquareLegMM)}</td></tr>))}</tbody></table></div>
 {ringAudit.ringBeams.map(b=><details key={b.id} open><summary>{b.manufactureRef} {b.side}: {b.upstandCount} upstands</summary>
 <p>Clear bay widths: {b.bayWidthsMM.map(mm).join(', ')}mm. Rear offset before first slot: {mm(b.startOffsetMM)}mm.</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>Member slot</th><th>Start (mm)</th><th>End (mm)</th></tr></thead><tbody>{b.slots.map((slot,i)=><tr key={i}><td>{i+1}: {slot.role}</td><td>{mm(slot.leftMM)}</td><td>{mm(slot.rightMM)}</td></tr>)}</tbody></table></div>
 <p>{b.side==='front'?'Front coordinates run left to right.':'Side coordinates run from house wall to front corner.'} Upstands fit between the end of each slot and the start of the next.</p></details>)}
 <h3>Net ring-beam material quantities</h3><table><tbody>{[
 ['30×95 PSE',ringAudit.schedule.totals.pse30x90LengthM,'m'],['9mm base ply',ringAudit.schedule.totals.ply9BaseAreaM2,'m²'],['9mm upstand ply',ringAudit.schedule.totals.ply9UpstandAreaM2,'m²'],['25×50 outer fixing laths',ringAudit.schedule.totals.outerFixingLath25x50LengthM,'m'],['25×50 finishing laths',ringAudit.schedule.totals.finishingLath25x50LengthM,'m'],['50mm PIR upstand faces',ringAudit.schedule.totals.pir50AreaM2,'m²']
 ].map(([label,value,unit])=><tr key={label}><th>{label}</th><td>{Number(value).toFixed(3)} {unit}</td></tr>)}</tbody></table>
 <ul>{ringAudit.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Timber and truss joint audit — read only</h2>
 {!timberAudit.valid?<p role="alert">{timberAudit.errors.join(' ')}</p>:<>
 <p>{timberAudit.componentCounts.joistMembers} joist members · {timberAudit.componentCounts.trusses} trusses · {timberAudit.componentCounts.gussets} gussets · {timberAudit.componentCounts.chevrons} chevrons · {timberAudit.componentCounts.closures} assembled closures.</p>
 <table><tbody>{[
 ['18mm chevron',`${mm(timberAudit.truss.chevron.armMM)}mm longest arm × ${mm(timberAudit.truss.chevron.widthMM)}mm strip; two per truss`],
 ['9mm gusset',`${mm(timberAudit.truss.gusset.widthMM)}mm flat bottom; vertical side ${mm(timberAudit.truss.gusset.sideHeightMM)}mm; overall height ${mm(timberAudit.truss.gusset.blankHeightMM)}mm`],
 ['Assembled offcut closure',`Bottom ${mm(timberAudit.truss.closure.cutLengthMM)}mm; top ${mm(timberAudit.truss.closure.shortEdgeMM)}mm; height 45mm`],
 ['Truss underside slope to closure',`${mm(timberAudit.trussToClosureSlopeMM)}mm — separate from full internal member length`],
 ['Rear wall packers',`9mm plywood. ${timberAudit.wallPackers.allocation}`]
 ].map(([label,value])=><tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table>
 <div style={{overflowX:'auto',marginTop:16}}><table><thead><tr>{['Timber material','Net quantity','Waste','Candidate cost','Installed weight allowance'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{timberAudit.lines.map(l=><tr key={l.key}><th title={l.basis}>{l.label}</th><td>{l.quantity.toFixed(3)} {l.unit}</td><td>{l.wastePercent==null?'Unconfigured':l.wastePercent+'%'}</td><td>{l.cost==null?'Unconfigured':'£'+l.cost.toFixed(2)}</td><td>{l.installedWeightKg==null?'Unconfigured':l.installedWeightKg.toFixed(2)+'kg'}</td></tr>)}</tbody></table></div>
 <p><strong>Known partial timber subtotal: £{timberAudit.knownCost.toFixed(2)} · {timberAudit.knownInstalledWeightKg.toFixed(2)}kg.</strong> Missing rates are excluded. This already contains the ring-beam materials above; do not add them again.</p>
 <ul>{timberAudit.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Insulation and finished ceiling audit — read only</h2>
 {!insulation.valid?<p role="alert">{insulation.errors.join(' ')}</p>:<>
 <p>Internal finished ceiling: <strong>{insulation.ceiling.areaM2.toFixed(3)}m²</strong>. SuperQuilt and plasterboard use this same area. The flat is {mm(insulation.ceiling.flat.widthMM)}mm wide, covering {insulation.ceiling.flat.areaM2.toFixed(3)}m².</p>
 <table><thead><tr><th>Ceiling surface</th><th>Installed area</th></tr></thead><tbody>{insulation.ceiling.facets.map(f=><tr key={f.id}><th>{f.id} slope</th><td>{f.areaM2.toFixed(3)}m²</td></tr>)}<tr><th>Central flat</th><td>{insulation.ceiling.flat.areaM2.toFixed(3)}m²</td></tr></tbody></table>
 <div style={{overflowX:'auto',marginTop:16}}><table><thead><tr>{['Material','Net installed area','Ordering candidate','Candidate cost','Installed weight'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{[
 ['50mm PIR — cradles and ring-beam faces',insulation.pir50.netAreaM2,insulation.pir50.sheets==null?'Unconfigured':insulation.pir50.sheets+' sheets',insulation.pir50.cost,insulation.pir50.installedWeightKg],
 ['100mm PIR — to apex/ridge',insulation.pir100.netAreaM2,insulation.pir100.sheets==null?'Unconfigured':insulation.pir100.sheets+' sheets',insulation.pir100.cost,insulation.pir100.installedWeightKg],
 ['SuperQuilt',insulation.superQuilt.installedAreaM2,insulation.superQuilt.rolls12+' × 12m² + '+insulation.superQuilt.rolls15+' × 15m² rolls',insulation.superQuilt.cost,insulation.superQuilt.installedWeightKg],
 ['Breather membrane',insulation.membrane.installedAreaM2,insulation.membrane.coverageReview?'1 roll — coverage review':'1 × 50m² roll',insulation.membrane.cost,insulation.membrane.installedWeightKg],
 ['Plasterboard — information only',insulation.plasterboard.installedAreaM2,insulation.plasterboard.sheets+' sheets if supplied',null,insulation.plasterboard.installedWeightKg]
 ].map(([label,area,order,cost,weight])=><tr key={label}><th>{label}</th><td>{area.toFixed(3)}m²</td><td>{order}</td><td>{label.startsWith('Plasterboard')?'Not supplied':cost==null?'Unconfigured':'£'+cost.toFixed(2)}</td><td>{weight==null?'Unconfigured':weight.toFixed(2)+'kg'}</td></tr>)}</tbody></table></div>
 <p>50mm cradle strips: {insulation.cradle.totalLengthM.toFixed(3)}m × 140mm = {insulation.cradle.netAreaM2.toFixed(3)}m², plus {insulation.cradle.ringPir50AreaM2.toFixed(3)}m² ring-beam PIR faces, pooled once.</p>
 <p>Truss cradle run to gusset: {mm(insulation.cradle.trussCradleRunMM)}mm; {insulation.cradle.trussFaceCount} member faces. 100mm PIR gross surface: {insulation.slab.surface.areaM2.toFixed(3)}m², less {insulation.slab.timberFootprintAreaM2.toFixed(3)}m² timber footprint allowance.</p>
 <details><summary>Finished ceiling plan outlines</summary><p>Coordinates are measured from the internal left frame and house wall.</p><ul>{[...insulation.ceiling.facets,{id:'flat',points:insulation.ceiling.flat.points}].map(f=><li key={f.id}>{f.id}: {f.points.map(p=>'('+mm(p.x)+', '+mm(p.y)+')').join(' · ')}</li>)}</ul></details>
 <ul>{insulation.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section id="edwardian-tiles-laths"><h2>Tiles, external laths and ridge/hip accessories — read only</h2>
 {!tiling.valid?<p role="alert">{tiling.errors.join(' ')}</p>:<>
 <p>Main tile ordering candidate: <strong>{tiling.mainTiles}</strong>{tiling.steel?' (includes two extra tiles per roof)':''}. Ridge: {mm(tiling.ridgeMM)}mm.</p>
 <table><thead><tr><th>Covering run</th><th>Full length</th><th>Hip/ridge tiles</th></tr></thead><tbody>{tiling.edges.map(e=><tr key={e.id}><th>{e.id}</th><td>{mm(e.lengthMM)}mm</td><td>{e.tileQty}</td></tr>)}</tbody></table>
 <p>External field laths: {tiling.fieldLathM.toFixed(3)}m, including {tiling.chamferM.toFixed(3)}m perimeter rows. Hip/ridge support laths: {tiling.support.quantities.additionalLathM.toFixed(3)}m. Combined external candidate: {tiling.externalLathM.toFixed(3)}m → {tiling.lathStockLengths} × {tiling.stockM}m lengths.</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>Material</th><th>Ordering candidate</th><th>Candidate cost</th></tr></thead><tbody>{tiling.lines.map(l=><tr key={l.key}><th>{l.label}</th><td>{l.quantity.toFixed(3)} {l.unit}</td><td>{l.cost==null?'Unconfigured':'£'+l.cost.toFixed(2)}</td></tr>)}</tbody></table></div>
 {tiling.result.facets.map(f=><details key={f.facet.id}><summary>{f.facet.label}: {mm(f.facet.heightMM)}mm tile slope · {f.courses.length} courses · {f.lathRows.length} lath rows</summary>
 <table><thead><tr><th>Course</th><th>Start / end width</th><th>Start / end slope position</th></tr></thead><tbody>{f.courses.map((r,i)=><tr key={i}><td>{i+1}</td><td>{mm(r.startWidthMM??r.widthMM)} / {mm(r.endWidthMM??r.widthMM)}mm</td><td>{mm(r.startYMM??r.yMM??0)} / {mm(r.endYMM??r.yMM??0)}mm</td></tr>)}</tbody></table></details>)}
 <ul>{tiling.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Internal fixing laths — read only</h2>
 {!internalLaths.valid?<p role="alert">{internalLaths.errors.join(' ')}</p>:<><p>{internalLaths.rowCount} runs, including {internalLaths.flatRows} across the flat · {internalLaths.totalLengthM.toFixed(3)}m total. Maximum row spacing approximately {internalLaths.maximumSpacingMM}mm.</p>
 <details><summary>Internal row lengths</summary><table><thead><tr><th>Surface</th><th>Plan position</th><th>Run length</th></tr></thead><tbody>{internalLaths.rows.map(r=><tr key={r.id}><th>{r.surface}</th><td>{mm(r.positionMM)}mm</td><td>{mm(r.lengthMM)}mm</td></tr>)}</tbody></table></details>
 <ul>{internalLaths.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Plastics and guttering audit — read only</h2>
 {!plasticsGutters.valid?<p role="alert">{plasticsGutters.errors.join(' ')}</p>:<>
 <p>Total open eaves: {plasticsGutters.plastics.totals.totalRunM.toFixed(3)}m. Gutters: {plasticsGutters.guttering.counts.lengths} × {plasticsGutters.guttering.stockM}m lengths · {plasticsGutters.guttering.counts.unions} unions · {plasticsGutters.guttering.counts.corners90} × 90° bends · {plasticsGutters.guttering.counts.brackets} brackets at approximately {plasticsGutters.guttering.spacingMM}mm.</p>
 <table><thead><tr>{['Run','Length','Fascia stock','External cut height','Coverage above lip','Finished soffit width'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{plasticsGutters.plastics.rows.map(r=><tr key={r.edgeId}><th>{r.side}</th><td>{mm(r.runM*1000)}mm</td><td>{r.fasciaWidthMM}mm</td><td>{mm(r.fasciaCut.externalCutHeightMM)}mm</td><td>{mm(r.fasciaCut.coverageHeightMM)}mm</td><td>{mm(r.soffitGeometryMM)}mm</td></tr>)}</tbody></table>
 <h3>Plastic requirements</h3><table><thead><tr><th>Material</th><th>Ordering candidate</th><th>Candidate cost</th></tr></thead><tbody>{plasticsGutters.plasticLines.map(l=><tr key={l.key}><th>{l.label}</th><td>{l.qty.toFixed(3)} {l.unit}</td><td>{l.cost==null?'Unconfigured':'£'+l.cost.toFixed(2)}</td></tr>)}</tbody></table>
 <p>J-trim follows {plasticsGutters.plastics.accessories.jRunM.toFixed(3)}m of external frame perimeter. H-trim consumed length: {plasticsGutters.plastics.accessories.hLengthMM}mm; {plasticsGutters.plastics.accessories.hPieces.map(p=>p.label+': '+p.lengthMM+'mm').join(' · ')}.</p>
 <h3>Guttering requirements</h3><table><thead><tr><th>Material</th><th>Ordering candidate</th><th>Candidate cost</th></tr></thead><tbody>{plasticsGutters.gutterLines.map(l=><tr key={l.key}><th>{l.label}</th><td>{l.qty} {l.unit}</td><td>{l.cost==null?'Unconfigured':'£'+l.cost.toFixed(2)}</td></tr>)}</tbody></table>
 <ul>{plasticsGutters.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Metal and miscellaneous audit — read only</h2>
 {!metalMisc.valid?<p role="alert">{metalMisc.errors.join(' ')}</p>:<>
 <p>{metalMisc.counts.bosses} boss · {metalMisc.counts.sparHooks} spar hooks ({metalMisc.counts.sparPairs} pairs) · {metalMisc.counts.jacks} jack hook/bracket sets · no joist hangers.</p>
 {[['Metal requirements',metalMisc.metalRows],['Loose site supplies',metalMisc.siteRows],['Factory consumption — excluded from loose Idiot List',metalMisc.factoryRows]].map(([title,rows])=><div key={title}><h3>{title}</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Material</th><th>Quantity</th><th>Candidate cost</th><th>Installed weight</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><th title={r.basis}>{r.label}</th><td>{r.qty.toFixed(3)} {r.unit}{r.orderQty!=null?' · order '+r.orderQty:''}</td><td>{r.cost==null?'Unconfigured':'£'+r.cost.toFixed(2)}</td><td>{r.installedWeightKg==null?'Unconfigured':r.installedWeightKg.toFixed(2)+'kg'}</td></tr>)}</tbody></table></div></div>)}
 <p>Loose site screws: {metalMisc.fixings.siteScrews} member-foot screws · {metalMisc.fixings.internalScrews} internal lath screws · {metalMisc.fixings.externalScrews} external lath screws ({metalMisc.fixings.externalFieldScrews} field + {metalMisc.fixings.supportScrews} support) · {metalMisc.fixings.tileScrews} tile/accessory screws.</p>
 <p>Secret gutter installed coverage: {metalMisc.watercourse.usedM.toFixed(3)}m across both rear wall members; {metalMisc.watercourse.qty} × 2.5m lengths ordered. Installed weight {metalMisc.watercourse.weightKg.toFixed(2)}kg.</p>
 <details><summary>Fixing allowance bases</summary><ul>{[...metalMisc.siteRows,...metalMisc.factoryRows].map(r=><li key={r.key}>{r.label}: {r.basis}</li>)}</ul></details>
 <ul>{metalMisc.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Pooled 25×50 lath stock — read only</h2>
 {!lathPool.valid?<p role="alert">{lathPool.errors.join(' ')}</p>:<>
 <table><tbody>{lathPool.lathUses.map(r=><tr key={r.label}><th>{r.label}</th><td>{r.lengthM.toFixed(3)}m</td></tr>)}</tbody></table>
 <p><strong>{lathPool.usedM.toFixed(3)}m used → {lathPool.stockQty} × {lathPool.stockM}m stock lengths ({lathPool.purchasedM.toFixed(3)}m purchased).</strong> Total metres alone would give {lathPool.linearMinimum} lengths; individual runs and fitting offcut reuse determine the stock candidate.</p>
 <p>Pooled lath cost: {lathPool.cost==null?'Unconfigured':'£'+lathPool.cost.toFixed(2)}. Installed lath weight: {lathPool.installedWeightKg==null?'Unconfigured':lathPool.installedWeightKg.toFixed(2)+'kg'}. This replaces separate lath charges at integration; do not add it to them.</p>
 <ul>{lathPool.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Reconciled materials totals — read only</h2>
 {!reconciliation.valid?<p role="alert">{reconciliation.errors.join(' ')}</p>:<>
 <p>This model removes overlapping audit charges. It is the base source for Edwardian Summary and pricing. Manual extras and adjustments are shown in Summary.</p>
 <table><thead><tr><th>Element</th><th>Known material cost</th><th>Known installed weight</th></tr></thead><tbody>{Object.entries(reconciliation.sections).map(([key,s])=><tr key={key}><th>{({timber:'Timber',tiles:'Tiles',plastics:'Plastics',metal:'Metal',gutters:'Guttering',misc:'Miscellaneous'})[key]} Elements</th><td>£{s.totals.cost.toFixed(2)}</td><td>{s.totals.weight.toFixed(2)}kg</td></tr>)}<tr><th>Materials total</th><td><strong>£{reconciliation.materialsCost.toFixed(2)}</strong></td><td><strong>{reconciliation.materialsWeightKg.toFixed(2)}kg</strong></td></tr><tr><th>Plasterboard — not supplied</th><td>No charge</td><td>{reconciliation.plasterboardWeightKg.toFixed(2)}kg</td></tr><tr><th>Known installed roof weight</th><td>Materials + plasterboard</td><td>{reconciliation.installedWeightKg.toFixed(2)}kg</td></tr></tbody></table>
 <p>{reconciliation.pricingReady?'All material prices are configured.':`Costing review: ${reconciliation.missingPrices.length} required price entries remain unconfigured; the total includes known prices only.`} {reconciliation.missingWeights.length} installed weight entries remain unconfigured.</p>
 {reconciliation.missingPrices.length>0&&<details open><summary>Unconfigured prices</summary><ul>{reconciliation.missingPrices.map(r=><li key={r.key}>{r.label}</li>)}</ul></details>}
 {reconciliation.missingWeights.length>0&&<details><summary>Unconfigured installed weights</summary><ul>{reconciliation.missingWeights.map(r=><li key={r.key}>{r.label}</li>)}</ul></details>}
 {reconciliation.supplyReviews.map(n=><p key={n} role="alert">{n}</p>)}
 <details><summary>Reconciled element rows</summary>{Object.entries(reconciliation.sections).map(([key,s])=><div key={key}><h3>{key} Elements</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Material</th><th>Quantity</th><th>Cost</th><th>Weight</th></tr></thead><tbody>{s.lines.map(r=><tr key={r.key}><th>{r.label}{r.usage==='factory'?' (factory)':''}</th><td>{r.qty.toFixed(3)} {r.units}{r.used_m2!=null?' · '+r.used_m2.toFixed(3)+'m² installed':''}{r.used_m!=null?' · '+r.used_m.toFixed(3)+'m used':''}{r.order_qty!==r.qty?' · order '+r.order_qty:''}</td><td>{r.price_unconfigured?'Unconfigured':'£'+r.line.toFixed(2)}</td><td>{r.weight_unconfigured?'Unconfigured':r.weight_kg.toFixed(2)+'kg'}</td></tr>)}</tbody></table></div></div>)}</details>
 <ul>{reconciliation.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></>}
 </section>
 <section><h2>Audit scope</h2><ul>{g.notes.filter(n=>!/^Read-only/.test(n)).map(n=><li key={n}>{n}</li>)}</ul></section>
 </>}
 </main></>;
}
