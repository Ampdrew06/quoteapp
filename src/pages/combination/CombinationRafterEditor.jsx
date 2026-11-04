import React,{useState,useEffect} from 'react';
import {buildCombinationGeometry} from '../../lib/geometry/combinationGeometry';
const field={padding:7,border:'1px solid #cbd5e1',borderRadius:5};
const round=n=>Number(n.toFixed(1));
export default function CombinationRafterEditor({inputs,geometry:g,materials,onChange}){
 const [selected,setSelected]=useState(''),[value,setValue]=useState(''),[error,setError]=useState('');
 const valid=g.valid,group=g.rafterGroups?.find(f=>f.id===selected);
 const positions=selected==='rear'?(g.layout?.centresMM||[]).slice(1,-1):group?.centresMM||[];
 const signature=JSON.stringify(positions);
 useEffect(()=>{if(selected&&selected!=='rear'&&!g.rafterGroups?.some(f=>f.id===selected))setSelected('');},[selected,g.rafterGroups]);
 useEffect(()=>{setValue(positions.map(n=>Number(n.toFixed(3))).join(', '));setError('');},[selected,signature]); // eslint-disable-line react-hooks/exhaustive-deps
 const patchFor=restore=>selected==='rear'?{combinationRearTrussPositionsMM:restore?undefined:parse()}:{combinationRafterPositionsMM:{...inputs.combinationRafterPositionsMM,[selected]:restore?undefined:parse()}};
 const parse=()=>value.trim()===''?[]:value.split(',').map(s=>s.trim()===''?NaN:Number(s.trim()));
 const apply=restore=>{const patch=patchFor(restore),candidate=buildCombinationGeometry({inputs:{...inputs,...patch},materials});if(!candidate.valid){setError(candidate.errors.join(' '));return;}onChange(patch);setError('');};
 return <section className="print:hidden" style={{border:'1px solid #dce1e8',borderRadius:8,padding:12,marginBottom:14}}><label><strong>Edit Rafter Position</strong>{' '}<select style={field} disabled={!valid} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select facet…</option><option value="rear">Rear trusses — shared across both sides</option>{g.rafterGroups?.map(f=><option key={f.id} value={f.id}>Facet {f.number}</option>)}</select></label>
 {!valid&&<p>Enter valid roof dimensions to edit rafter positions.</p>}
 {valid&&selected&&<div><p>{selected==='rear'?`Intermediate truss centres from the house wall. The first truss (31.5mm) and boss truss (${round(g.terminalTrussCentreMM)}mm) remain fixed.`: `Centres measured along the internal facet from ${group?.origin}. Editable range: ${round(group?.boundaryStartMM||0)}–${round(group?.boundaryEndMM||0)}mm. Hips remain fixed.`}</p><label>Member centres (mm, separated by commas)<input style={{...field,display:'block',width:'100%',boxSizing:'border-box',marginTop:5}} value={value} onChange={e=>setValue(e.target.value)} placeholder="e.g. 665, 1330"/></label><p style={{fontSize:13}}>Add a centre to add a member; remove a centre to remove it. Leave blank to remove all editable members in this group. Edited facet members run perpendicular to the ringbeam and meet a hip or the boss.</p>{g.leftSide==='edwardian'&&g.rightSide==='edwardian'&&selected==='facet-2'&&<p><label><input type="checkbox" checked={inputs.combinationSpacingOverride===true} onChange={e=>onChange({combinationSpacingOverride:e.target.checked})}/> Acknowledge front rafter gaps over 750mm (admin spacing override)</label></p>}<button style={field} type="button" onClick={()=>apply(false)}>Apply positions</button>{' '}<button style={field} type="button" onClick={()=>apply(true)}>Restore automatic positions</button>{error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}<p style={{fontSize:13}}>Current gaps: {(selected==='rear'?g.layout?.gapsMM||[]:group?.gapsMM||[]).map(round).join(' · ')} mm</p></div>}
 </section>;
}
