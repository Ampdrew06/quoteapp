import React,{useState,useEffect} from 'react';
import {buildDoubleEdwardianGeometry} from '../../lib/geometry/doubleEdwardianGeometry';
export default function DoubleEdwardianMemberEditor({inputs,geometry:g,onChange}){
 const [selected,setSelected]=useState(''),[value,setValue]=useState(''),[error,setError]=useState('');
 const group=g.layout?.groups.find(f=>f.id===selected);
 const signature=JSON.stringify(group?.editableCentresMM||[]);
 useEffect(()=>{setValue(group?.editableCentresMM.map(n=>Number(n.toFixed(6))).join(', ')||'');setError('');},[selected,signature]); // eslint-disable-line react-hooks/exhaustive-deps
 const apply=restore=>{
  const values=value.trim()===''?[]:value.split(',').map(v=>v.trim()===''?NaN:Number(v));
  const positions={...inputs.memberPositionsMM};if(restore)delete positions[selected];else positions[selected]=values;
  const candidate=buildDoubleEdwardianGeometry({...inputs,memberPositionsMM:positions});
  if(!candidate.valid){setError(candidate.error);return;}onChange(positions);setError('');
 };
 return <section style={{border:'1px solid #dce1e8',borderRadius:8,padding:12,marginTop:16}}><label><strong>Edit Rafter Position</strong>{' '}<select disabled={!g.valid||!g.layout} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select facet…</option>{g.layout?.groups.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>{group&&<div><p>Positions along the internal facet, {group.origin}. Range: 0–{group.length} mm. Members remain perpendicular to the support and terminate at a hip or ridge.</p><p>Fixed ridge-end centres: {group.lockedCentresMM.map(n=>Number(n.toFixed(1))).join(', ')} mm. Hips and ridge-end supports remain fixed.</p><label>Editable centres (mm, separated by commas)<input style={{display:'block',width:'100%',boxSizing:'border-box',padding:7,marginTop:5}} value={value} onChange={e=>setValue(e.target.value)}/></label><p>Add, move or remove centres. A blank list removes the intermediate members. Opposite truss legs are edited on their respective facets.</p><button type="button" onClick={()=>apply(false)}>Apply positions</button>{' '}<button type="button" onClick={()=>apply(true)}>Restore automatic positions</button><p>Current gaps: {group.gapsMM.map(n=>Number(n.toFixed(1))).join(' · ')} mm.</p>{error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}</div>}</section>;
}
