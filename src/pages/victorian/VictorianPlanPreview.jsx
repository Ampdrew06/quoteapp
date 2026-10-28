import {updateVictorianDesignInputs} from '../../lib/geometry/victorianDesignInputs';
import VictorianNavigation from './VictorianNavigation';
import VictorianMaterialsReconciliation from '../../components/VictorianMaterialsReconciliation';
import VictorianPlasticsGutteringAudit from '../../components/VictorianPlasticsGutteringAudit';
import VictorianMetalFixingsAudit from '../../components/VictorianMetalFixingsAudit';
import VictorianTilingAudit from '../../components/VictorianTilingAudit';
import VictorianLathAudit from '../../components/VictorianLathAudit';
import VictorianInsulationAudit from '../../components/VictorianInsulationAudit';
import VictorianTimberAudit from '../../components/VictorianTimberAudit';
import VictorianMemberCutPages from '../../components/VictorianMemberCutPages';
import VictorianTrussPreview from '../../components/VictorianTrussPreview';
import VictorianRingBeamPreview from '../../components/VictorianRingBeamPreview';
import {buildVictorianSoffitSupply} from '../../lib/Manufacturing/victorianSoffitSupply';
import React,{useState,useEffect} from 'react';
import {Navigate,useLocation} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';

const defaults={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified',cornerAnglesDeg:[135,135,135,135]};
const key='victorianPlanPreviewInputs';
function read(){try{const saved=JSON.parse(localStorage.getItem(key)||'{}');return {...defaults,...saved,cornerAnglesDeg:Array.isArray(saved.cornerAnglesDeg)&&saved.cornerAnglesDeg.length===4?saved.cornerAnglesDeg:defaults.cornerAnglesDeg};}catch{return {...defaults};}}
const mm=n=>Number(n).toFixed(1).replace(/\.0$/,'');
export function VictorianPlan({geometry:g}) {
  const xs=g.externalOutline.map(p=>p.xMM),minX=Math.min(...xs),maxX=Math.max(...xs),scale=Math.min(650/(maxX-minX),740/g.externalProjectionMM);
  const map=p=>({x:160+(p.xMM-minX)*scale,y:80+p.yMM*scale});
  const poly=ps=>ps.map(p=>{const a=map(p);return `${a.x},${a.y}`;}).join(' ');
  const line=(a,b,stroke,width=2,dash)=>{a=map(a);b=map(b);return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width} strokeDasharray={dash}/>;};
  const dim=(a,b,label,offset=30)=>{a=map(a);b=map(b);const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l*offset,ny=dx/l*offset;let angle=Math.atan2(dy,dx)*180/Math.PI;if(angle>90)angle-=180;if(angle<-90)angle+=180;const x=(a.x+b.x)/2+nx,y=(a.y+b.y)/2+ny;return <g><path d={`M${a.x},${a.y}L${a.x+nx*1.25},${a.y+ny*1.25} M${b.x},${b.y}L${b.x+nx*1.25},${b.y+ny*1.25} M${a.x+nx},${a.y+ny}L${b.x+nx},${b.y+ny}`} fill="none" stroke="#64748b"/><text x={x} y={y-6} transform={`rotate(${angle} ${x} ${y})`} textAnchor="middle" fontSize="17" fontWeight="700">{label}</text></g>;};
  return <svg viewBox="0 0 1000 980" role="img" fontFamily="Arial,sans-serif" aria-label={g.style+" internal and external plan"}>
    <text x="500" y="28" textAnchor="middle" fontSize="20">HOUSE WALL</text>
    <polygon points={poly(g.externalOutline)} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
    <polygon points={poly(g.internalOutline)} fill="none" stroke="#111827" strokeWidth="3"/>
    {line({xMM:g.widthMM/2,yMM:0},g.ridge,'#64748b',2,'8 6')}
    {g.layout.centresMM.map((y,i)=><g key={i}>{line({xMM:0,yMM:y},{xMM:g.widthMM,yMM:y},'#2563eb')}<text x={map({xMM:0,yMM:y}).x+14} y={map({xMM:0,yMM:y}).y+(i===0?19:-8)} fontSize="15" fontWeight="700">T{i+1} · {mm(y)}</text></g>)}
    {g.hips.map(h=>{const a=map({xMM:(h.start.xMM+h.end.xMM)/2,yMM:(h.start.yMM+h.end.yMM)/2});return <g key={h.id}>{line(h.start,h.end,'#111827',3)}<text x={a.x+(h.end.xMM<g.widthMM/2?-9:9)} y={a.y-7} textAnchor={h.end.xMM<g.widthMM/2?'end':'start'} fontSize="17" fontWeight="700">{h.id} · {h.pitchDeg.toFixed(1)}°</text></g>;})}
    {[...g.intermediateBars,...g.jackRafters].map(r=>{const a=map({xMM:r.start.xMM*.12+r.end.xMM*.88,yMM:r.start.yMM*.12+r.end.yMM*.88});return <g key={r.id}>{line(r.start,r.end,'#2563eb',2)}<text x={a.x+7} y={a.y-5} fontSize="16" fill="#2563eb" fontWeight="700">{r.id}</text></g>;})}
    {g.facets.map((f,i)=>{const a=map({xMM:(f.start.xMM+f.end.xMM+g.ridge.xMM)/3,yMM:(f.start.yMM+f.end.yMM+g.ridge.yMM)/3});return <g key={f.id}>{dim(f.start,f.end,`${mm(f.internalLengthMM)} mm`,i===0||i===g.facets.length-1?35:28)}<text x={a.x} y={a.y+22} textAnchor="middle" fontSize="19" fontWeight="700" fill="#16a34a">{f.pitchDeg.toFixed(1)}°</text></g>;})}
    {dim({xMM:0,yMM:0},{xMM:g.widthMM,yMM:0},`IW ${mm(g.widthMM)} mm`,-30)}
    {dim({xMM:g.widthMM,yMM:0},{xMM:g.widthMM,yMM:g.projectionMM},`IP ${mm(g.projectionMM)} mm`,-115)}
    <text x="500" y="935" textAnchor="middle" fontSize="18">Ply-base EW {mm(g.externalWidthMM)} mm · EP {mm(g.externalProjectionMM)} mm</text>
  </svg>;
}
export default function VictorianPlanPreview(){
  const [inputs,setInputs]=useState(read),[materials]=useState(getMaterials),location=useLocation();
  useEffect(()=>{if(location.hash==='#victorian-tiles-laths')document.getElementById('victorian-tiles-laths')?.scrollIntoView();},[location.hash]);
  useEffect(()=>{if(isAdminUser())localStorage.setItem(key,JSON.stringify(inputs));},[inputs]);
  if(!isAdminUser())return <Navigate to="/quote" replace/>;
  const g=buildVictorianGeometry({inputs,materials});
  const supply=buildVictorianSoffitSupply(g,materials);
  const update=(name,value)=>setInputs(old=>updateVictorianDesignInputs(old,name,value));
  return <><VictorianNavigation/><main className="vp"><h1>Victorian · Technical</h1>
    <details className="vp-settings"><summary>Technical settings</summary>
    <label>Soffit basis<select disabled={!!g.soffitRequirement} value={inputs.soffitMode} onChange={e=>setInputs(old=>({...old,soffitMode:e.target.value,...(e.target.value==='standard'?{soffitMM:150}:{})}))}><option value="standard">Standard stock board · fitting tolerance</option><option value="specified">Specified site envelope · includes fascia</option></select></label>
    <div className="vp-inputs">{[['Internal width (mm)','widthMM'],['Internal projection (mm)','projMM'],['Pitch (°)','pitchDeg'],['Frame thickness (mm)','frameThicknessMM'],[inputs.soffitMode==='standard'?'Soffit board width (mm)':'Available soffit envelope (mm)','soffitMM']].map(([label,name])=><label key={name}>{label}<input type="number" min="0" step="0.1" disabled={name==='soffitMM'&&(inputs.soffitMode==='standard'||!!g.soffitRequirement)} value={name==='soffitMM'&&g.soffitRequirement?g.soffitMM:inputs[name]} onChange={e=>update(name,e.target.value)}/></label>)}</div>
    <label>Roof covering<select value={inputs.tileProductId??'britmetShingle'} onChange={e=>update('tileProductId',e.target.value)}><option value="britmetShingle">Britmet Shingle</option><option value="metrotileShingle">Metrotile Shingle</option><option value="liteSlate">LiteSlate</option><option value="tapcoSlate">TapcoSlate</option></select></label>
    <label>Boss top-edge continuation to ridge (mm)<input type="number" min="0" step="1" value={inputs.bossTopContinuationMM??160} onChange={e=>update('bossTopContinuationMM',e.target.value)}/></label>
    <label>Ring-beam upstand arrangement<select value={inputs.upstandArrangement??(inputs.soffitMode==='specified'&&Number(inputs.soffitMM)===50?'vertical':'pitched')} onChange={e=>update('upstandArrangement',e.target.value)}><option value="pitched">Pitched groove · 195mm cut</option><option value="vertical">Vertical groove · 210mm cut (195 visible + 15 groove)</option></select></label>
    <details><summary>Admin front corner angles</summary><p>Three front facets remain equal in length. Side frames remain parallel; the fourth corner follows the other three. Facet pitches update around the existing ridge point.</p><div className="vp-inputs">{inputs.cornerAnglesDeg.map((angle,n)=><label key={n}>Corner {n+1} (°){n===3?' · calculated':''}<input type="number" min="90.1" max="179.9" step="0.1" disabled={n===3} value={angle} onChange={e=>{const next=inputs.cornerAnglesDeg.map(Number);next[n]=Number(e.target.value);next[3]=Number((540-next[0]-next[1]-next[2]).toFixed(6));update('cornerAnglesDeg',next);}}/></label>)}</div></details>
    <button onClick={()=>setInputs({...defaults,cornerAnglesDeg:[135,135,135,135]})}>Load Leah reference</button></details>
    {!g.valid?<p role="alert">{g.errors.join(' ')}</p>:<><VictorianPlan geometry={g}/><div className="vp-values"><b>Ridge from wall:</b> {mm(g.ridgeEndYMM)}mm · <b>Terminal truss:</b> {mm(g.terminalTrussCentreMM)}mm · {g.layout.trussCount} trusses · 4 hips · {g.intermediateBars.length} intermediate bars · {g.jackRafters.length} jack rafters</div>
      <table><thead><tr><th>Run</th><th>Internal</th><th>External</th><th>Pitch</th></tr></thead><tbody>{g.facets.map(f=><tr key={f.id}><td>{f.label}</td><td>{mm(f.internalLengthMM)}mm</td><td>{mm(f.externalLengthMM)}mm</td><td>{f.pitchDeg.toFixed(1)}°</td></tr>)}</tbody></table>
      {g.soffitRequirement?<p>{g.soffitNote} Ply base {mm(g.plyBaseWidthMM)}mm; timber foot {mm(g.eaves.left.matchedHorizontalFootRunMM)}mm. Change the requirement on Design/Options.</p>:<p>Corner angles {g.cornerAnglesDeg.map(mm).join(' / ')}° · mitres {g.mitresDeg.map(mm).join(' / ')}°. Ply base {mm(g.plyBaseWidthMM)}mm = frame {mm(g.frameMM)} + {inputs.soffitMode==='standard'?`board ${mm(g.soffitMM)} + fitting tolerance ${mm(g.fittingToleranceMM)}`:`site envelope ${mm(g.soffitMM)} − fascia ${mm(g.fasciaThicknessMM)}`}mm.</p> }
      <VictorianMaterialsReconciliation geometry={g} materials={materials} plasticsColour={inputs.plasticsColour??'white'} gutterProfile={inputs.gutterProfile??'ogee'} productId={inputs.tileProductId??'britmetShingle'}/><VictorianTimberAudit geometry={g} materials={materials}/><VictorianInsulationAudit geometry={g} materials={materials}/><div id="victorian-tiles-laths"><VictorianLathAudit geometry={g} materials={materials} productId={inputs.tileProductId??'britmetShingle'}/><VictorianTilingAudit geometry={g} materials={materials} productId={inputs.tileProductId??'britmetShingle'}/></div><VictorianMetalFixingsAudit geometry={g} materials={materials} productId={inputs.tileProductId??'britmetShingle'}/><VictorianPlasticsGutteringAudit geometry={g} materials={materials} plasticsColour={inputs.plasticsColour??'white'} gutterProfile={inputs.gutterProfile??'ogee'}/><VictorianTrussPreview geometry={g} materials={materials}/><VictorianMemberCutPages geometry={g} materials={materials}/><VictorianRingBeamPreview geometry={g}/>
      <section><h2>Soffit stock &amp; ripping allowance</h2>{supply.valid?<><p>Total external run {mm(supply.totalRunMM)}mm · {supply.stripCount} full {mm(supply.stockLengthMM/1000)}m strips at {mm(supply.stripWidthMM)}mm.</p><p><b>Order:</b> {supply.order.map(r=>`${r.qty} × ${r.widthMM}mm × ${mm(supply.stockLengthMM/1000)}m`).join(' + ')||'None'}</p>{supply.ripInstructions.map((r,n)=><p key={n}><b>Board {n+1}:</b> {r.strips} × {mm(r.lengthMM/1000)}m at {mm(r.stripWidthMM)}mm from {r.boardWidthMM}mm stock.</p>)}{g.soffitMode==='specified'&&g.soffitRequirement!=='none'&&<p>Practical strip target: envelope {mm(g.soffitMM)} − fascia {mm(g.fasciaThicknessMM)} − trimming allowance {mm(g.stripTrimAllowanceMM)}mm. Saw kerf {mm(supply.kerfMM)}mm. Check the strip target on assembly; final facet mitres, lengths and numbering are deferred.</p>}</>:<p role="alert">{supply.errors.join(' ')}</p>}</section>
      {g.adjustedAngles&&<p>Adjusted-angle external outline is a plan offset only; eaves height alignment for the changed facet pitches still needs checking.</p>}
      <p>2258mm is the Windows Designer hip reference only. These plan lines are not timber cut lengths. Hip and intermediate cuts use the editable top-edge boss allowance; jack cuts remain deferred.</p></>}
    <style>{`.vp{max-width:1100px;margin:0 auto;padding:16px;font:14px Inter,system-ui,Arial;color:#111827}.vp h1{font-size:24px;margin:12px 0 8px}.vp-settings>summary{cursor:pointer;font-weight:600}.vp-inputs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0}.vp label{font-weight:700;font-size:12px}.vp input{display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:5px}.vp svg{display:block;width:100%;max-height:900px;background:white;border:1px solid #cbd5e1;margin:16px 0}.vp table{border-collapse:collapse;width:100%;margin:12px 0}.vp th,.vp td{border:1px solid #cbd5e1;padding:7px;text-align:left}.vp button{padding:8px 12px;margin-top:12px}.vp details{margin:12px 0}.vp-values{padding:10px;background:#f1f5f9}`}</style>
  </main></>;
}
