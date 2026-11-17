import React,{useState} from 'react';
import RafterPositionEditor from '../../components/RafterPositionEditor';
import {buildDoubleEdwardianGeometry} from '../../lib/geometry/doubleEdwardianGeometry';

export default function DoubleEdwardianMemberEditor({inputs,geometry:g,onChange}){
 const [selected,setSelected]=useState(''),[error,setError]=useState('');
 const group=g.valid?g.layout?.groups.find(f=>f.id===selected):null;
 const positions={...inputs.memberPositionsMM};
 delete positions[selected];
 const automatic=group?.manual?buildDoubleEdwardianGeometry({...inputs,memberPositionsMM:{}}).layout?.groups.find(f=>f.id===selected):group;
 const apply=centres=>{
  const next={...positions};
  if(centres!==null)next[selected]=centres.filter(n=>!group.lockedCentresMM.includes(n));
  const candidate=buildDoubleEdwardianGeometry({...inputs,memberPositionsMM:next});
  if(!candidate.valid){setError(candidate.error);return false;}
  setError('');onChange(next);return true;
 };
 const depth=Math.min(g.widthMM,g.projectionMM)/2;
 const ridgeFacet=group&&group.length>2*depth+1e-6;
 const labelMember=value=>{
  if(value==='')return 'New rafter';
  const centre=Number(value);
  return Math.min(centre,group.length-centre)>=depth-1e-6?(ridgeFacet?'Truss leg':'Boss rafter'):'Jack rafter';
 };
 return <section style={{margin:'14px 0'}}>
 <label style={{fontWeight:700}}>Edit Rafter Position <select disabled={!g.valid||!g.layout} value={selected} onChange={e=>{setSelected(e.target.value);setError('');}} style={{padding:7,marginLeft:8}}>
 <option value="">Select facet…</option>{g.layout?.groups.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
 {group&&<RafterPositionEditor key={group.id+':'+group.length+':'+g.ridgeLengthMM} admin widthMM={group.length} positions={group.centresMM} automaticPositions={automatic?.centresMM??group.centresMM}
  facetLabel={group.name} showFacetSelector={false}
  boundaryStartLabel="Start hip — locked" boundaryEndLabel="End hip — locked"
  lockedCentresMM={group.lockedCentresMM} lockedMemberLabel={ridgeFacet?'End truss leg — locked':'Boss rafter — locked'}
  labelMember={labelMember} restoreLabel="Restore automatic spacing" onApply={apply} onRestoreAutomatic={()=>apply(null)}
  extraControls={<p>Centres in mm, {group.origin}. Edit each facet separately.</p>}/>}
 {group&&error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
 </section>;
}
