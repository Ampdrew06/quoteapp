import React,{useState} from 'react';
import {buildVictorianHippedGeometry} from '../lib/geometry/victorianHippedGeometry';
import {buildVictorianHippedRingBeamProfiles} from '../lib/Manufacturing/victorianHippedRingBeamProfiles';
import {buildVictorianHippedMemberSchedule} from '../lib/Manufacturing/victorianHippedMemberSchedule';
import {buildVictorianHippedWallplateSchedule} from '../lib/Manufacturing/victorianHippedWallplateSchedule';
const mm=n=>Number(n).toFixed(3).replace(/\.?0+$/,'');
export default function VictorianHippedFacetGeometryEditor({inputs,materials,onChange}){
 const baseline=buildVictorianHippedGeometry({inputs:{...inputs,facetGeometry:undefined,victorianHippedFacetPositionsMM:undefined},materials});
 const p=Number(inputs.projMM)||0,c=Number(inputs.cornerInsetMM)||0;
 const seed={mode:'template',leftSideMM:baseline.facets?.find(f=>f.id==='F1')?.internalLengthMM??p-c,rightSideMM:baseline.facets?.find(f=>f.id==='F5')?.internalLengthMM??p-c,leftChamferMM:baseline.facets?.find(f=>f.id==='F2')?.internalLengthMM??Math.hypot(c,c),rightChamferMM:baseline.facets?.find(f=>f.id==='F4')?.internalLengthMM??Math.hypot(c,c),frontMM:baseline.facets?.find(f=>f.id==='F3')?.internalLengthMM??Number(inputs.widthMM)-2*c,leftCornerDeg:135,rightCornerDeg:135,toleranceMM:2};
 const [draft,setDraft]=useState(()=>({...seed,...inputs.facetGeometry})),[message,setMessage]=useState('');
 const current=buildVictorianHippedGeometry({inputs,materials}),resolved=current.facetGeometry;
 const change=(key,value)=>{setDraft(old=>({...old,[key]:value}));setMessage('');};
 const switchMode=mode=>{
  const candidate=buildVictorianHippedGeometry({inputs:{...inputs,facetGeometry:draft,victorianHippedFacetPositionsMM:undefined},materials}),r=candidate.facetGeometry||resolved;
  setDraft(old=>({...old,mode,...(r?{leftSideMM:r.left.sideLengthMM,rightSideMM:r.right.sideLengthMM,leftChamferMM:r.left.chamferLengthMM,rightChamferMM:r.right.chamferLengthMM,frontMM:r.frontLengthMM,leftCornerDeg:r.left.sideCornerDeg??135,rightCornerDeg:r.right.sideCornerDeg??135}:{})}));setMessage('');
 };
 const apply=()=>{
  const next={...inputs,facetGeometry:{...draft},victorianHippedFacetPositionsMM:undefined},g=buildVictorianHippedGeometry({inputs:next,materials});
  if(!g.valid){setMessage(g.errors.join(' '));return;}
  for(const build of [buildVictorianHippedRingBeamProfiles,buildVictorianHippedMemberSchedule,buildVictorianHippedWallplateSchedule]){
   const result=build({geometry:g,inputs:next,materials});if(!result.valid){setMessage(result.errors.join(' '));return;}
  }
  onChange(old=>({...old,facetGeometry:{...draft},victorianHippedFacetPositionsMM:undefined}));setMessage('Facet geometry applied. Automatic rafter positions have been recalculated.');
 };
 const field=(label,key,disabled=false)=><label>{label}<input aria-label={label} type="number" step="0.1" value={typeof draft[key]==='number'?Number(draft[key].toFixed(key.includes('Corner')?4:3)):draft[key]??''} disabled={disabled} onChange={e=>change(key,e.target.value)}/></label>;
 const active=side=>(inputs[side+'EndType']??'victorian')==='victorian';
 return <details className="vh-facet-editor"><summary>Edit facet geometry — admin</summary>
 <p>Internal plan dimensions. The front remains parallel to the rear wall and the side runs perpendicular to it. Left and right chamfers can differ. This editor does not yet model a skew front or a skew rear-wall corner.</p>
 <label>Geometry input method<select aria-label="Geometry input method" value={draft.mode} onChange={e=>switchMode(e.target.value)}><option value="template">Template corner inset</option><option value="lengths">Measured facet lengths</option><option value="angles">Side lengths and corner angles</option></select></label>
 {draft.mode!=='template'&&<div className="vh-facet-fields">{field('Facet 1 (mm)','leftSideMM',!active('left'))}{field('Facet 5 (mm)','rightSideMM',!active('right'))}
 {draft.mode==='lengths'?<>{field('Facet 2 (mm)','leftChamferMM',!active('left'))}{field('Facet 4 (mm)','rightChamferMM',!active('right'))}{field('Facet 3 (mm)','frontMM')}{field('Measurement tolerance per facet (mm)','toleranceMM')}</>:['left','right'].map(side=><React.Fragment key={side}>{field(`${side==='left'?'Left':'Right'} side corner angle (°)`,side+'CornerDeg',!active(side))}<label>{side==='left'?'Left':'Right'} front corner angle (°)<input aria-label={`${side==='left'?'Left':'Right'} front corner angle (°)`} type="number" step="0.1" disabled={!active(side)} value={draft[side+'CornerDeg']===''?'':Number((270-Number(draft[side+'CornerDeg'])).toFixed(4))} onChange={e=>change(side+'CornerDeg',e.target.value===''?'':270-Number(e.target.value))}/></label></React.Fragment>)}
 </div>}
 {draft.mode==='lengths'&&<p>Width, projection, side lengths and front length are held. Rounded small-facet measurements are fitted to close the outline only within the tolerance you enter; the resulting differences are shown below. Inconsistent measurements are rejected.</p>}
 {draft.mode==='angles'&&<p>Side lengths and corner angles control the outline; front and small-facet lengths are calculated. Editing either angle in a corner pair updates the other so the front remains parallel.</p>}
 <p>Edits take effect only when applied. Applying new facet geometry replaces manual rafter positions with a fresh automatic layout.</p>
 <button type="button" onClick={apply}>Apply facet geometry</button><p role="status">{message}</p>
 {resolved&&<div className="vh-table"><h3>Applied facet geometry</h3><table><thead><tr><th>End</th><th>Side</th><th>Small facet</th><th>Side corner</th><th>Front corner</th><th>Supplied small facet</th><th>Difference</th></tr></thead><tbody>{['left','right'].map(side=>{const r=resolved[side];return r.active?<tr key={side}><td>{side}</td><td>{mm(r.sideLengthMM)} mm</td><td>{mm(r.chamferLengthMM)} mm</td><td>{mm(r.sideCornerDeg)}°</td><td>{mm(r.frontCornerDeg)}°</td><td>{r.suppliedChamferMM===null?'—':`${mm(r.suppliedChamferMM)} mm`}</td><td>{mm(r.residualMM)} mm</td></tr>:null;})}</tbody></table><p>Front: <b>{mm(resolved.frontLengthMM)} mm</b>{resolved.mode==='lengths'&&<> · horizontal closure adjustment: {mm(resolved.closureAdjustmentMM)} mm · allowed difference per measured facet: {mm(resolved.toleranceMM)} mm</>}</p></div>}
 <style>{`.vh-facet-editor{padding:12px;margin:14px 0;border:1px solid #94a3b8;border-radius:8px;background:#f8fafc}.vh-facet-editor summary{font-weight:700;cursor:pointer}.vh-facet-editor p{font-size:12px}.vh-facet-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.vh-facet-editor input,.vh-facet-editor select{display:block;width:100%;box-sizing:border-box;padding:7px;border:1px solid #cbd5e1;border-radius:7px;margin-top:4px}.vh-facet-editor label{font-size:13px}.vh-facet-editor button{padding:8px 12px;background:#008dc2;color:white;border:0;border-radius:7px}@media(max-width:650px){.vh-facet-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{.vh-facet-editor{display:none}}`}</style>
 </details>;
}
