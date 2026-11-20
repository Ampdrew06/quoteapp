import React,{useState} from 'react';
import RoofVentOptions from './RoofVentOptions';
import {buildHippedLeanToVentLayout} from '../lib/geometry/hippedLeanToVentLayout';

export default function HippedLeanToVentOptions({geometry,byFacet,onChange,layout,pricing}){
 const [chosen,setChosen]=useState('');
 const [error,setError]=useState('');
 const setCentre=(index,centre)=>{
  const next={...byFacet,frontCentresMM:{...byFacet.frontCentresMM,[index]:centre}};
  const result=buildHippedLeanToVentLayout(geometry,next);
  if(result.errors.length){setError(result.errors.join(' '));return;}
  setError('');onChange(next);
 };
 const frontVents=layout.openings.filter(item=>item.facet==='front'&&item.centreMM!=null);
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
    if(facet==='front'){delete next.frontCentresMM;delete next.frontCentreSpacingMM;}
    const result=buildHippedLeanToVentLayout(geometry,next);
    const previous=Object.values(byFacet[facet]??{}).reduce((sum,value)=>sum+Number(value),0);
    const count=Object.values(quantities).reduce((sum,value)=>sum+Number(value),0);
    if(count>previous&&result.errors.length){setError(result.errors.join(' '));return;}
    setError('');onChange(next);
   }}/>}
  {frontVents.map((vent,index)=><div key={`${vent.id}-${vent.centreMM}`}>
   <label>Front vent {index+1} centre (mm from left internal corner){' '}
    <input type="number" step="0.1" defaultValue={vent.centreMM}
     onBlur={event=>{const value=event.target.value;if(value!==''&&Number(value)!==vent.centreMM){setCentre(index,Number(value));event.target.value=vent.centreMM;}}}
     onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();event.currentTarget.blur();}}}/>
   </label>
   <button type="button" aria-label={`Move front vent ${index+1} left`} disabled={vent.previousCentreMM==null} onClick={()=>setCentre(index,vent.previousCentreMM)}>‹</button>
   <button type="button" aria-label={`Move front vent ${index+1} right`} disabled={vent.nextCentreMM==null} onClick={()=>setCentre(index,vent.nextCentreMM)}>›</button>
  </div>)}
  {byFacet.frontCentresMM&&<button type="button" onClick={()=>{const next={...byFacet};delete next.frontCentresMM;setError('');onChange(next);}}>Reset front vent positions</button>}
  {Object.entries(byFacet).filter(([id,items])=>!['frontCentresMM','frontCentreSpacingMM'].includes(id)&&!layout.facets.some(item=>item.id===id)&&Object.keys(items).length>0).map(([id])=>
   <button key={id} type="button" onClick={()=>onChange({...byFacet,[id]:{}})}>Remove vents from unavailable {id} facet</button>)}
  {(error||layout.errors.length>0||pricing.error)&&<p role="alert">{[error,...layout.errors,pricing.error].filter(Boolean).join(' ')}</p>}
  {pricing.net>0&&<p>Roof vents included: £{pricing.net.toFixed(2)} ex VAT, including slate flashing, one pole and carriage.</p>}
 </fieldset>;
}
