import React,{useState} from 'react';
import RoofVentOptions from './RoofVentOptions';
import {buildHippedLeanToVentLayout} from '../lib/geometry/hippedLeanToVentLayout';

export default function HippedLeanToVentOptions({geometry,byFacet,onChange,layout,pricing}){
 const [chosen,setChosen]=useState('');
 const [error,setError]=useState('');
 const facet=layout.facets.some(item=>item.id===chosen)?chosen:'';
 return <fieldset>
  <legend>Hipped Lean-To roof vents</legend>
  <label>Facet{' '}<select value={facet} onChange={event=>{setChosen(event.target.value);setError('');}}>
   <option value="">Select a facet</option>
   {layout.facets.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
  </select></label>
  {facet&&<RoofVentOptions key={facet} quantities={byFacet[facet]??{}} pricing={{count:Object.values(byFacet[facet]??{}).reduce((sum,value)=>sum+Number(value),0)}} showPrice={false}
   onChange={quantities=>{
    const next={...byFacet,[facet]:quantities};
    const result=buildHippedLeanToVentLayout(geometry,next);
    const previous=Object.values(byFacet[facet]??{}).reduce((sum,value)=>sum+Number(value),0);
    const count=Object.values(quantities).reduce((sum,value)=>sum+Number(value),0);
    if(count>previous&&result.errors.length){setError(result.errors.join(' '));return;}
    setError('');onChange(next);
   }}/>}
  {Object.entries(byFacet).filter(([id,items])=>!layout.facets.some(item=>item.id===id)&&Object.keys(items).length>0).map(([id])=>
   <button key={id} type="button" onClick={()=>onChange({...byFacet,[id]:{}})}>Remove vents from unavailable {id} facet</button>)}
  {(error||layout.errors.length>0||pricing.error)&&<p role="alert">{[error,...layout.errors,pricing.error].filter(Boolean).join(' ')}</p>}
  {pricing.net>0&&<p>Roof vents included: £{pricing.net.toFixed(2)} ex VAT, including slate flashing, one pole and carriage.</p>}
  {pricing.count>0&&<p>Vent positions show the available facet space. Check the rafter layout separately before manufacture.</p>}
 </fieldset>;
}
