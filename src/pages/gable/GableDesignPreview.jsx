import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {getMaterials} from '../../lib/materials';
import {isAdminUser} from '../../lib/userRole';
import {buildGablePlasticsGutteringAudit} from '../../lib/Calculations/gablePlasticsGutteringAudit';
import {buildGableTilingAudit} from '../../lib/Calculations/gableTilingAudit';
import {buildGableInsulationAudit} from '../../lib/Calculations/gableInsulationAudit';
import {buildGableTimberAudit} from '../../lib/Calculations/gableTimberAudit';
import {buildGableGeometry} from '../../lib/geometry/gableGeometry';
const KEY='gableDesignPreviewInputs';
const initial={widthMM:'',projMM:'',pitchDeg:25,frameThicknessMM:70,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,separateSideSoffits:false,maxFinishedHeightMM:'',tileProductId:'britmetShingle',plasticsColour:'white',gutterProfile:'square'};
const restore=()=>{try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return initial;}};
const mm=value=>Number(value).toFixed(1);
export default function GableDesignPreview() {
 const [inputs,setInputs]=useState(restore),admin=isAdminUser();
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 const resolved={...inputs,rightSoffitMM:admin&&inputs.separateSideSoffits?inputs.rightSoffitMM:inputs.leftSoffitMM};
 const materials=getMaterials();
 const geometry=buildGableGeometry({inputs:resolved,materials});
 const update=(key,value)=>setInputs(old=>({...old,[key]:value,...(key==='pitchDeg'?{maxFinishedHeightMM:''}:{})}));
 const field=(label,key)=><label style={{display:'grid',gap:5}}>{label}<input type="number" min="0" step="0.1" value={inputs[key]} onChange={e=>update(key,e.target.value)} style={{padding:8,width:'100%',boxSizing:'border-box'}} /></label>;
 const g=geometry;
 const audit=buildGableTimberAudit({geometry:g,materials});
 const insulation=buildGableInsulationAudit({geometry:g,timberAudit:audit,materials});
 const tiling=buildGableTilingAudit({geometry:g,materials,productId:inputs.tileProductId});
 const plastics=buildGablePlasticsGutteringAudit({geometry:g,materials,plasticsColour:inputs.plasticsColour,gutterProfile:inputs.gutterProfile});
 const amount=value=>value==null?"Unconfigured":Number(value).toFixed(2);
 const manufacturingProjection=g.manufacturingProjectionMM??g.externalProjectionMM;
 const scale=g.valid?Math.min(620/g.externalWidthMM,430/manufacturingProjection):1;
 const x=value=>100+(value+g.frameMM+g.leftSoffitMM)*scale,y=value=>60+value*scale;
 const elevationScale=g.valid?Math.min(620/g.externalWidthMM,240/(g.finishedHeightMM)):1;
 const ex=value=>100+(value+g.frameMM+g.leftSoffitMM)*elevationScale,ey=value=>310-(value-g.truss.ringBeamHeightMM)*elevationScale;
 return <main style={{maxWidth:1050,margin:'0 auto',padding:20,fontFamily:'Arial,sans-serif'}}>
 <Link to="/quote">Back to roof styles</Link><h1>Gable — geometry preview</h1>
 <p>Two straight side ring-beams with repeated trusses. This draft is remembered separately; quotation pricing and manufacture-book outputs will follow after geometry review.</p>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>
  {field('Internal width (mm)','widthMM')}{field('Internal projection (mm)','projMM')}{field('Pitch (degrees)','pitchDeg')}{field('Frame thickness (mm)','frameThicknessMM')}
  {field(admin&&inputs.separateSideSoffits?'Left side soffit (mm)':'Both side soffits (mm)','leftSoffitMM')}
  {admin&&inputs.separateSideSoffits&&field('Right side soffit (mm)','rightSoffitMM')}
  {field('Front overhang (mm)','frontOverhangMM')}{field('Optional maximum finished height (mm)','maxFinishedHeightMM')}
 </div>
 {admin&&<p><label><input type="checkbox" checked={inputs.separateSideSoffits} onChange={e=>update('separateSideSoffits',e.target.checked)} /> Set side soffits separately (admin)</label></p>}
 <p><button onClick={()=>setInputs({...initial,widthMM:3800,projMM:4200})}>Load 3800 × 4200 example</button> <button onClick={()=>setInputs(initial)}>Clear draft</button></p>
 {!g.valid?<p role="status">{g.errors.join(' ')}</p>:<>
 <h2>Plan</h2><p><strong>Includes 5mm front soffit clearance—do not add again.</strong> Manufacturing projection: {mm(manufacturingProjection)}mm. Requested external projection remains {mm(g.externalProjectionMM)}mm.</p><p>Requested external {mm(g.externalWidthMM)} × {mm(g.externalProjectionMM)}mm · resolved pitch {mm(g.pitchDeg)}° · {g.layout.trussCount} trusses.</p>
 <svg viewBox="0 0 820 590" role="img" aria-label="Gable truss plan" style={{width:'100%',maxHeight:620,background:'#fff',border:'1px solid #94a3b8'}}>
  <rect x={x(-g.frameMM-g.leftSoffitMM)} y={y(0)} width={g.externalWidthMM*scale} height={manufacturingProjection*scale} fill="#f1f5f9" stroke="#64748b" />
  <rect x={x(0)} y={y(0)} width={g.widthMM*scale} height={g.projectionMM*scale} fill="none" stroke="#64748b" strokeDasharray="5 4" />
  <line x1={x(g.ridgeXMM)} y1={y(0)} x2={x(g.ridgeXMM)} y2={y(manufacturingProjection)} stroke="#b91c1c" strokeDasharray="7 4" strokeWidth="2" />
  <text x="100" y="28" fontSize="18">House wall · ridge centred on internal span</text>
  {g.layout.centresMM.map((centre,i)=><g key={i}><line x1={x(-g.frameMM-g.leftSoffitMM)} y1={y(centre)} x2={x(g.widthMM+g.frameMM+g.rightSoffitMM)} y2={y(centre)} stroke="#1d4ed8" strokeWidth="2" /><text x="65" y={y(centre)+6} fontSize="18">T{i+1}</text>{i>0&&<text x={x(g.widthMM+g.frameMM+g.rightSoffitMM)+12} y={y((centre+g.layout.centresMM[i-1])/2)+5} fontSize="17">{mm(g.layout.gapsMM[i-1])}</text>}</g>)}
  <text x="100" y="545" fontSize="18">Front truss flush with external ring-beam edge · gaps shown in mm</text>
 </svg>
 <h2>Truss elevation</h2>
 <svg viewBox="0 0 820 380" role="img" aria-label="Gable truss elevation" style={{width:'100%',background:'#fff',border:'1px solid #94a3b8'}}>
  {g.feet.map((foot,i)=>{const half=g.widthMM/2,base=g.truss.ringBeamHeightMM,top=base+half*Math.tan(g.pitchDeg*Math.PI/180)+g.truss.memberDepthMM/Math.cos(g.pitchDeg*Math.PI/180);const pts=[[0,base],[half,base+half*Math.tan(g.pitchDeg*Math.PI/180)],[half,top],[-foot.hfcMM,base+foot.vfcMM],[-foot.hfcMM,base]];return <polygon key={foot.side} points={pts.map(([xx,yy])=>`${ex(i?g.widthMM-xx:xx)},${ey(yy)}`).join(' ')} fill="#e7c994" stroke="#111827" strokeWidth="2" />;})}
  <polygon points={g.truss.gusset.points.map(p=>`${ex(p.xMM)},${ey(p.yMM)}`).join(' ')} fill="#bfdbfe" fillOpacity="0.85" stroke="#1d4ed8" strokeWidth="2" />
  <polygon points={g.truss.closure.points.map(p=>`${ex(p.xMM)},${ey(p.yMM)}`).join(' ')} fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
  <text x={ex(g.widthMM/2)} y="325" textAnchor="middle" fontSize="17">595mm closure bottom · 45mm high</text>
  <text x="100" y="52" fontSize="16" fill="#1d4ed8">Blue: 9mm gusset · amber: assembled closure</text>
  <text x="100" y="25" fontSize="18">Equal pitch {mm(g.pitchDeg)}° · centred ridge · flat bottom 595mm</text>
  <text x="100" y="350" fontSize="18">Left HFC / VFC {mm(g.feet[0].hfcMM)} / {mm(g.feet[0].vfcMM)}mm</text>
  <text x="100" y="375" fontSize="18">Right HFC / VFC {mm(g.feet[1].hfcMM)} / {mm(g.feet[1].vfcMM)}mm</text>
 </svg>
 <table style={{width:'100%',marginTop:15,borderCollapse:'collapse'}}><tbody>{[
 ['Side ring-beams',`2 × ${mm(manufacturingProjection)}mm, square ends (includes 5mm front clearance)`],['Truss members',`${2*g.layout.trussCount} members (${g.layout.trussCount} trusses)`],['Left / right external slopes',`${mm(g.feet[0].externalSlopeMM)} / ${mm(g.feet[1].externalSlopeMM)}mm`],['Gusset side / overall height',`${mm(g.truss.gusset.sideHeightMM)} / ${mm(g.truss.gusset.blankHeightMM)}mm`],['Closure bottom / top',`${mm(g.truss.closure.cutLengthMM)} / ${mm(g.truss.closure.shortEdgeMM)}mm`],['Calculated finished height',`${mm(g.finishedHeightMM)}mm above ring-beam underside (ridge cap excluded)`],['Spacing limits','400–700mm centres, targeting 665mm'],['Second centre',g.layout.secondCentreRetained?'690mm retained':'Redistributed to satisfy spacing limits'],
 ].map(([label,value])=><tr key={label}><th style={{textAlign:'left',padding:8,border:'1px solid #94a3b8'}}>{label}</th><td style={{padding:8,border:'1px solid #94a3b8'}}>{value}</td></tr>)}</tbody></table>
 <h2>Timber and ring-beam audit — read only</h2>
 <p>{audit.componentCounts.trussMembers} truss members · {audit.componentCounts.gussets} gussets · {audit.componentCounts.chevrons} chevrons · {audit.componentCounts.closures} assembled closures · {audit.componentCounts.upstands} upstands.</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Component','Net requirement','Waste','Estimated cost','Installed weight allowance'].map(label=><th key={label} style={{textAlign:'left',padding:8,border:'1px solid #94a3b8'}}>{label}</th>)}</tr></thead><tbody>
 {audit.lines.map(line=><tr key={line.key}>{[line.label,`${line.quantity.toFixed(3)} ${line.unit}`,`${amount(line.wastePercent)}%`,line.cost==null?'Unconfigured':`£${amount(line.cost)}`,line.installedWeightKg==null?'Unconfigured':`${amount(line.installedWeightKg)}kg`].map((value,i)=><td key={i} style={{padding:8,border:'1px solid #94a3b8'}}>{value}</td>)}</tr>)}
 </tbody></table></div>
 <p><strong>Known partial subtotal: £{amount(audit.knownCost)} · {amount(audit.knownInstalledWeightKg)}kg.</strong> Unconfigured entries are excluded. Remaining roof materials are not included.</p>
 <h3>Ring-beam cut requirements</h3>
 {audit.ringBeams.map(beam=><div key={beam.id}><strong>{beam.label}: {mm(beam.lengthMM)}mm × {mm(beam.baseWidthMM)}mm base, square ends</strong><p>30×95 PSE and outer 25×50 lath: {mm(beam.lengthMM)}mm each. Upstands: {beam.upstandCount} at {beam.dimensions.upstandHeightMM}mm height. Clear bay widths, house to front: {beam.bayWidthsMM.map(mm).join(', ')}mm.</p></div>)}
 <details open><summary>Audit scope and workshop assumptions</summary><ul>{audit.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 <h2>Insulation and coverings audit — read only</h2>
 {!insulation.valid?<p role="status">{insulation.errors.join(' ')}</p>:<>
 <p>Cradle faces per member: rear 1 · intermediate 2 · front 1. The front retains its truss joint arrangement and receives the full outer 9mm plywood face.</p>
 <p>Front outer face: {audit.frontFace.fullAreaM2.toFixed(3)}m² total coverage; {audit.frontFace.additionalAreaM2.toFixed(3)}m² beyond its already-counted outer gusset. Single-layer plywood coverage is assumed.</p>
 <p>Finished internal ceiling: {insulation.ceiling.areaM2.toFixed(3)}m², including the {mm(insulation.ceiling.flatWidthMM)}mm flat. External membrane face area: {insulation.membrane.installedAreaM2.toFixed(3)}m².</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Material','Installed area','Ordering candidate','Candidate cost','Installed weight'].map(label=><th key={label} style={{textAlign:'left',padding:8,border:'1px solid #94a3b8'}}>{label}</th>)}</tr></thead><tbody>{[
 ['50mm PIR cradles + ring-beam faces',insulation.pir50.netAreaM2,`${insulation.pir50.sheets??'Unconfigured'} sheets`,insulation.pir50.cost,insulation.pir50.installedWeightKg],
 ['100mm PIR between trusses',insulation.pir100.netAreaM2,`${insulation.pir100.sheets??'Unconfigured'} sheets`,insulation.pir100.cost,insulation.pir100.installedWeightKg],
 ['SuperQuilt',insulation.superQuilt.installedAreaM2,`${insulation.superQuilt.rolls12} × 12m² + ${insulation.superQuilt.rolls15} × 15m² rolls`,insulation.superQuilt.cost,insulation.superQuilt.installedWeightKg],
 ['Breather membrane',insulation.membrane.installedAreaM2,insulation.membrane.coverageReview?'1 roll — coverage needs review':'1 × 50m² roll',insulation.membrane.cost,insulation.membrane.installedWeightKg],
 ['Plasterboard — information only',insulation.plasterboard.installedAreaM2,`${insulation.plasterboard.sheets} sheets if supplied`,null,insulation.plasterboard.installedWeightKg],
 ].map(([label,area,order,cost,weight])=><tr key={label}>{[label,`${area.toFixed(3)}m²`,order,label.startsWith('Plasterboard')?'Supply not included':cost==null?'Unconfigured':`£${amount(cost)}`,weight==null?'Unconfigured':`${amount(weight)}kg`].map((value,i)=><td key={i} style={{padding:8,border:'1px solid #94a3b8'}}>{value}</td>)}</tr>)}</tbody></table></div>
 <p>Cradle strips: {mm(insulation.cradle.totalLengthM)}m × 140mm = {insulation.cradle.netAreaM2.toFixed(3)}m². Cradle run per member to gusset: {mm(insulation.cradle.runMM)}mm. 100mm PIR slope run per side to apex: {mm(insulation.slab.runMM)}mm. Slab clear bay widths: {insulation.slab.clearBayWidthsMM.map(mm).join(', ')}mm.</p>
 <p><strong>These are separate audit comparisons. Do not add their costs to the timber subtotal: ring-beam PIR is represented in both.</strong></p>
 <details open><summary>Insulation scope and assumptions</summary><ul>{insulation.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 </>}
 <h2>Tiles, external laths and ridge audit — read only</h2>
 <p><label>Roof covering <select value={inputs.tileProductId} onChange={e=>update('tileProductId',e.target.value)}><option value="britmetShingle">Britmet Shingle</option><option value="metrotileShingle">Metrotile Shingle</option><option value="liteSlate">LiteSlate</option></select></label></p>
 {!tiling.valid?<p role="status">{tiling.errors.join(' ')}</p>:<>
 <p>Ridge: {mm(tiling.ridgeMM)}mm. External tile-covered area: {tiling.result.facetAreaM2.toFixed(3)}m². Main tile ordering candidate: <strong>{tiling.mainTiles}</strong>{tiling.steel?' (includes two additional tiles per roof)':''}.</p>
 <p>External field laths: {tiling.fieldLathM.toFixed(3)}m, including {tiling.chamferM.toFixed(3)}m chamfered perimeter laths. Ridge support laths: {tiling.ridgeLathM.toFixed(3)}m. Combined candidate: {tiling.lathM.toFixed(3)}m → {tiling.lathStockLengths} × {tiling.stockM}m stock lengths.</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Material','Ordering candidate','Candidate cost'].map(label=><th key={label} style={{textAlign:'left',padding:8,border:'1px solid #94a3b8'}}>{label}</th>)}</tr></thead><tbody>{tiling.lines.map(line=><tr key={line.key}>{[line.label,`${line.quantity.toFixed(3)} ${line.unit}`,line.key==='polycarbonate'?'Surplus — no cost allowance':line.cost==null?'Unconfigured':`£${amount(line.cost)}`].map((value,i)=><td key={i} style={{padding:8,border:'1px solid #94a3b8'}}>{value}</td>)}</tr>)}</tbody></table></div>
 {tiling.result.facets.map(f=><details key={f.facet.id}><summary>{f.facet.label}: {mm(f.facet.heightMM)}mm tile slope · {f.courses.length} courses · {f.lathRows.length} lath rows</summary><table style={{width:'100%'}}><thead><tr><th>Row</th><th>Slope position (mm)</th><th>Lath run (mm)</th><th>Use</th></tr></thead><tbody>{f.lathRows.map((r,i)=><tr key={i}><td>{i+1}</td><td>{mm(r.yMM)}</td><td>{mm(r.widthMM)}</td><td>{r.kind}</td></tr>)}</tbody></table></details>)}
 <details open><summary>Tiling scope and assumptions</summary><ul>{tiling.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 </>}
 <h2>Plastics and guttering audit — read only</h2>
 <p><label>Plastics price band <select value={inputs.plasticsColour} onChange={e=>update('plasticsColour',e.target.value)}><option value="white">White</option><option value="foiled">Foiled</option></select></label> <label>Gutter profile <select value={inputs.gutterProfile} onChange={e=>update('gutterProfile',e.target.value)}><option value="square">Square with round downpipes</option><option value="ogee">Ogee with round downpipes</option><option value="round">Round</option></select></label></p>
 {!plastics.valid?<p role="status">{plastics.errors.join(' ')}</p>:<>
 <p>Each side eaves: {mm(manufacturingProjection)}mm. Gutters: {plastics.counts.lengths} stock lengths · {plastics.counts.unions} unions · {plastics.bracketsPerSide} brackets per side at approximately {plastics.spacingMM}mm spacing. Two independent downpipe assemblies.</p>
 <h3>Side fascia preparation</h3><ul>{plastics.sideRows.map(r=><li key={r.edgeId}>{r.side}: {r.widthMM}mm stock; external cut height {mm(r.fasciaCut.externalCutHeightMM)}mm, coverage above lip {mm(r.fasciaCut.coverageHeightMM)}mm; soffit finished width {mm(r.soffitGeometryMM)}mm.</li>)}</ul>
 <p>Front slopes to gusset: {plastics.frontRows.map(r=>`${mm(r.runM*1000)}mm`).join(' / ')}. Front soffit width: {mm(g.frontOverhangMM)}mm; central flat: {mm(g.truss.closure.cutLengthMM)}mm. One central 400 × 1000mm box-end blank; exact cut shape pending workshop drawing.</p>
 <p>J-trim frame profile: {plastics.jRunM.toFixed(3)}m. Factory venting: {plastics.ventM.toFixed(3)}m along side eaves.</p>
 {[['Plastic requirements',plastics.plasticLines],['Guttering requirements',plastics.gutterLines]].map(([title,lines])=><div key={title} style={{overflowX:'auto'}}><h3>{title}</h3><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Material','Ordering candidate','Candidate cost'].map(label=><th key={label} style={{textAlign:'left',padding:8,border:'1px solid #94a3b8'}}>{label}</th>)}</tr></thead><tbody>{lines.map(line=><tr key={line.key}>{[line.label,`${line.qty.toFixed(3)} ${line.unit}`,line.cost==null?'Unconfigured':`£${amount(line.cost)}`].map((value,i)=><td key={i} style={{padding:8,border:'1px solid #94a3b8'}}>{value}</td>)}</tr>)}</tbody></table></div>)}
 <details open><summary>Plastics and guttering scope</summary><ul>{plastics.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 </>}
 <details><summary>Geometry notes</summary><ul>{g.assumptions.map(note=><li key={note}>{note}</li>)}</ul></details>
 </>}
 </main>;
}
