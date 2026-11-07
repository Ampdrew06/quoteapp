import {buildVictorianFiveGeometry} from '../lib/geometry/victorianFiveGeometry';
import {buildVictorianFiveSummaryMaterialsModel} from '../lib/Calculations/victorianFiveQuotation';
import React,{useState} from 'react';
import {buildVictorianGeometry} from '../lib/geometry/victorianGeometry';
import {buildVictorianSummaryMaterialsModel} from '../lib/Calculations/victorianSummaryMaterialsModel';

const mm=v=>Number(v).toFixed(3).replace(/\.?0+$/,'');
export default function VictorianFacetGeometryEditor({inputs,materials,onChange,five=false}) {
 const g=(five?buildVictorianFiveGeometry:buildVictorianGeometry)({inputs,materials});
 const initial=()=>inputs.victorianFacetGeometry??(five?{mode:'survey',lengthsMM:g.facets?.map(f=>f.internalLengthMM)??Array(7).fill(''),toleranceMM:2}:{mode:'lengths',leftSideMM:g.facets?.[0]?.internalLengthMM??'',leftChamferMM:g.facets?.[1]?.internalLengthMM??'',frontMM:g.facets?.[2]?.internalLengthMM??'',rightChamferMM:g.facets?.[3]?.internalLengthMM??'',rightSideMM:g.facets?.[4]?.internalLengthMM??'',leftCornerDeg:g.cornerAnglesDeg?.[0]??135,rightCornerDeg:g.cornerAnglesDeg?.[3]??135,toleranceMM:2});
 const [draft,setDraft]=useState(initial),[message,setMessage]=useState('');
 const update=(name,value)=>{setDraft(old=>({...old,[name]:value}));setMessage('');};
 const field=(name,label)=><label key={name}>{label}<input aria-label={label} type="number" step="0.001" value={draft[name]??''} onChange={e=>update(name,e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',padding:7,border:'1px solid #cbd5e1',borderRadius:6}}/></label>;
 const apply=template=>{
  const patch={victorianFacetGeometry:template?null:{...draft},cornerAnglesDeg:Array(five?6:4).fill(five?150:135),victorianRearTrussPositionsMM:null,victorianSideJackPositionsMM:null,victorianFacetPositionsMM:null};
  const checked=(five?buildVictorianFiveSummaryMaterialsModel:buildVictorianSummaryMaterialsModel)({inputs:{...inputs,...patch},materials});
  if(!checked.valid){setMessage(checked.errors.join(' '));return;}
  onChange(patch);setMessage(template?'Standard template restored.':'Facet geometry applied. Review dimensional differences, angles and pitches. Best-fit survey cutting details require workshop review before manufacture.');
 };
 const fit=g.customFacetGeometry;
 return <details style={{margin:'14px 0',padding:12,border:'1px solid #94a3b8',borderRadius:8,background:'#f8fafc'}}>
  <summary style={{fontWeight:700,cursor:'pointer'}}>Edit facet geometry — admin</summary>
  <p>Internal plan dimensions. Rear corners stay square, sides stay parallel and the front stays parallel to the house wall. Best-fit survey mode allows individual facet pitches to change. {five?'All seven measured lengths are fitted; a solution close to the standard outline is preferred where the survey permits several shapes.':'Equal-pitch modes remain available.'}</p>
  <label>Geometry input method<select aria-label="Geometry input method" value={draft.mode} onChange={e=>update('mode',e.target.value)} style={{display:'block',width:'100%',padding:7,margin:'6px 0 12px'}}><option value="survey">Best-fit survey — allow different pitches</option>{!five&&<><option value="lengths">Measured facet lengths</option><option value="angles">Side corner angles</option></>}</select></label>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
   {five?<>{Array.from({length:7},(_,i)=><label key={i}>Facet {i+1} (mm)<input aria-label={`Facet ${i+1} (mm)`} type="number" step="0.001" value={draft.lengthsMM?.[i]??''} onChange={e=>{const ls=[...(draft.lengthsMM??Array(7).fill(''))];ls[i]=e.target.value;update('lengthsMM',ls);}} style={{display:'block',width:'100%',boxSizing:'border-box',padding:7}}/></label>)}{field('toleranceMM','Measurement tolerance per facet (mm)')}</>:draft.mode!=='angles'?<>{field('leftSideMM','Facet 1 (mm)')}{field('leftChamferMM','Facet 2 (mm)')}{field('frontMM','Facet 3 (mm)')}{field('rightChamferMM','Facet 4 (mm)')}{field('rightSideMM','Facet 5 (mm)')}{field('toleranceMM','Measurement tolerance per facet (mm)')}</>:<>{field('leftCornerDeg','Corner between facets 1 and 2 (°)')}{field('rightCornerDeg','Corner between facets 4 and 5 (°)')}</>}
  </div>
  <p>{draft.mode==='survey'?'Width and projection are held. All supplied facet lengths are fitted as closely as possible. Tolerance flags differences for review; it does not change your measurements. Side pitches retain the selected roof pitch.':draft.mode!=='angles'?'Width, projection and facet 3 are held. The other four lengths are fitted within your tolerance to retain equal pitches; all differences are shown below. Inconsistent measurements are rejected.':'Width and projection are held. The two front corner angles compensate automatically; all facet lengths are calculated to retain equal pitches.'}</p>
  <p>Applying geometry or restoring the template replaces manual rafter positions with an automatic layout. Changing width or projection clears the custom geometry. Save the quote after applying.</p>
  <button type="button" onClick={()=>apply(false)}>Apply facet geometry</button><button type="button" onClick={()=>apply(true)}>Restore standard template</button>
  {message&&<p role="status">{message}</p>}
  {fit&&<><h3>Applied facet geometry</h3>{fit.requiresManufactureReview&&<p role="alert">Best-fit survey: {fit.outsideTolerance?"some differences exceed your measurement tolerance. Customer acceptance or a more detailed survey is required.":"differences are within the entered tolerance; review before customer acceptance."} Cutting details require workshop review.</p>}<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>Facet</th><th>Applied length</th><th>Supplied length</th><th>Difference</th><th>Pitch</th></tr></thead><tbody>{fit.lengthsMM.map((v,n)=><tr key={n}><td>{n+1}</td><td>{mm(v)} mm</td><td>{fit.suppliedMM?`${mm(fit.suppliedMM[n])} mm`:'—'}</td><td>{fit.differencesMM?`${mm(fit.differencesMM[n])} mm`:'—'}</td><td>{g.facets[n].pitchDeg.toFixed(3)}°</td></tr>)}</tbody></table></div><p>Corner angles: {fit.cornerAnglesDeg.map(v=>`${mm(v)}°`).join(' / ')}.</p><p>{five?'150° roof joints retain the existing adapted 135° stock corner allowance.':'135° stock corners and hip end caps remain in the allowance.'} Check their fit or adaptation to the displayed angles before manufacture.</p></>}
 </details>;
}
