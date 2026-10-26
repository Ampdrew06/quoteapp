import {buildVictorianFiveGeometry} from '../lib/geometry/victorianFiveGeometry';
import {buildVictorianFiveSummaryMaterialsModel} from '../lib/Calculations/victorianFiveQuotation';
import React,{useState} from 'react';
import RafterPositionEditor from './RafterPositionEditor';
import {buildVictorianGeometry} from '../lib/geometry/victorianGeometry';
import {buildVictorianSummaryMaterialsModel} from '../lib/Calculations/victorianSummaryMaterialsModel';

export default function VictorianRafterPositionEditor({inputs,materials,admin,onChange,five=false}) {
 const [facet,setFacet]=useState(''),[message,setMessage]=useState('');
 const geometryBuilder=five?buildVictorianFiveGeometry:buildVictorianGeometry,modelBuilder=five?buildVictorianFiveSummaryMaterialsModel:buildVictorianSummaryMaterialsModel;
 const automatic=geometryBuilder({inputs:{...inputs,victorianRearTrussPositionsMM:undefined,victorianSideJackPositionsMM:undefined,victorianFacetPositionsMM:undefined},materials});
 if(!admin||!automatic.valid)return null;
 const f=automatic.facets.find(f=>f.id===facet),i=automatic.facets.indexOf(f);
 const side=i===0?'left':i===automatic.facets.length-1?'right':null;
 const sidePositions=(g,side)=>g.jackRafters.filter(r=>r.facetId===(side==='left'?g.facets[0].id:g.facets[g.facets.length-1].id)).map(r=>side==='left'?r.positionMM:g.facets[g.facets.length-1].internalLengthMM-r.positionMM).sort((a,b)=>a-b);
 const automaticPositions=f?(side?[...automatic.layout.centresMM.slice(1,-1),automatic.terminalTrussCentreMM,...sidePositions(automatic,side)]:[...automatic.intermediateBars,...automatic.jackRafters].filter(r=>r.facetId===facet).map(r=>r.positionMM).sort((a,b)=>a-b)):[];
 const positions=f?(side?[...(inputs.victorianRearTrussPositionsMM??automatic.layout.centresMM.slice(1,-1)),automatic.terminalTrussCentreMM,...(inputs.victorianSideJackPositionsMM?.[side]??sidePositions(automatic,side))]:inputs.victorianFacetPositionsMM?.[facet]??null):null;
 const apply=value=>{
  let patch;
  if(side){
   if(value!=null&&!value.some(p=>Math.abs(p-automatic.terminalTrussCentreMM)<0.01)){setMessage('The boss truss must remain at its fixed centre.');return false;}
   patch={victorianRearTrussPositionsMM:value==null?null:value.filter(p=>p<automatic.terminalTrussCentreMM-0.01),victorianSideJackPositionsMM:{...inputs.victorianSideJackPositionsMM,[side]:value==null?null:value.filter(p=>p>automatic.terminalTrussCentreMM+0.01)}};
  }else patch={victorianFacetPositionsMM:{...inputs.victorianFacetPositionsMM,[facet]:value}};
  const checked=modelBuilder({inputs:{...inputs,...patch},materials});
  if(!checked.valid){setMessage(checked.errors.join(' '));return false;}
  onChange(patch);setMessage('');return true;
 };
 return <section style={{margin:'14px 0'}}>
  <label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={facet} onChange={e=>{setFacet(e.target.value);setMessage('');}} style={{padding:7,marginLeft:8}}>
   <option value="">Select facet…</option>{automatic.facets.map((f,n)=><option key={f.id} value={f.id}>Facet {n+1} — RB{n+1}</option>)}
  </select></label>
  {f&&<RafterPositionEditor key={facet} admin widthMM={f.internalLengthMM}
   positions={positions} automaticPositions={automaticPositions} facetLabel={`Victorian facet ${i+1}`}
   boundaryStartMM={side?31.5:24} boundaryEndMM={f.internalLengthMM-24}
   boundaryStartLabel={side?'Wall truss — locked':'Hip — locked'} boundaryEndLabel="Hip — locked"
   lockedCentresMM={side?[automatic.terminalTrussCentreMM]:[]} lockedMemberLabel="Boss truss — locked"
   memberLabel={side?'Member':'Rafter'} showFacetSelector={false} onApply={apply}/>}
  {message&&<p role="alert">{message}</p>}
 </section>;
}
