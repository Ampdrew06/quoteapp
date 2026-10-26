import {buildVictorianHippedMemberSchedule} from '../lib/Manufacturing/victorianHippedMemberSchedule';
import {buildVictorianHippedRingBeamProfiles} from '../lib/Manufacturing/victorianHippedRingBeamProfiles';
import React,{useState} from 'react';
import RafterPositionEditor from './RafterPositionEditor';
import {buildVictorianHippedGeometry} from '../lib/geometry/victorianHippedGeometry';

export default function VictorianHippedRafterEditor({inputs,materials,admin,onChange}) {
 const [facet,setFacet]=useState(''),[message,setMessage]=useState('');
 const auto=buildVictorianHippedGeometry({inputs:{...inputs,victorianHippedFacetPositionsMM:undefined},materials});
 if(!admin||!auto.valid)return null;
 const i=auto.facets.findIndex(f=>f.id===facet),f=auto.facets[i],side=i===0||i===4;
 const apply=value=>{
  const positions={...inputs.victorianHippedFacetPositionsMM,[facet]:value};
  const checked=buildVictorianHippedGeometry({inputs:{...inputs,victorianHippedFacetPositionsMM:positions},materials});
  if(!checked.valid){setMessage(checked.errors.join(' '));return false;}
  const beams=buildVictorianHippedRingBeamProfiles({geometry:checked,inputs});
  if(!beams.valid){setMessage(beams.errors.join(' '));return false;}
  const members=buildVictorianHippedMemberSchedule({geometry:checked,inputs,materials});
  if(!members.valid){setMessage(members.errors.join(' '));return false;}
  onChange({victorianHippedFacetPositionsMM:positions});setMessage('');return true;
 };
 return <section style={{margin:'14px 0'}}>
  <label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={facet} onChange={e=>{setFacet(e.target.value);setMessage('');}} style={{padding:7,marginLeft:8}}>
   <option value="">Select facet…</option>{auto.facets.map((f,n)=><option key={f.id} value={f.id}>Facet {n+1} — RB{n+1}</option>)}
  </select></label>
  {f&&<RafterPositionEditor key={facet} admin widthMM={f.internalLengthMM}
   positions={inputs.victorianHippedFacetPositionsMM?.[facet]??null}
   automaticPositions={auto.rafterLayout.facets.find(r=>r.facetId===facet)?.positionsMM??[]}
   boundaryStartMM={24} boundaryEndMM={f.internalLengthMM-24}
   boundaryStartLabel={side?'Wall slot — locked':'Hip seat — locked'} boundaryEndLabel="Hip seat — locked"
   facetLabel={`Victorian hipped facet ${i+1}`} showFacetSelector={false} onApply={apply}/>}
  {message&&<p role="alert">{message}</p>}
 </section>;
}
