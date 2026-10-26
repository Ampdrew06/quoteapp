import React,{useState} from 'react';
import RafterPositionEditor from './RafterPositionEditor';
import {buildGableTrussLayout} from '../lib/geometry/gableGeometry';

export default function GableTrussPositionEditor({geometry:g,inputs={},admin,onApply}) {
 const [facet,setFacet]=useState('');
 // Keep the editor available to repair a manual layout after dimensions change.
 const length=Number(g?.manufacturingProjectionMM);
 if(!admin||!(length>0))return null;
 const automatic=buildGableTrussLayout({externalProjectionMM:length});
 const start=31.5,end=length-22.5;
 if(end-start<=48)return null;
 return <section style={{margin:'14px 0'}}>
  <label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={facet} onChange={e=>setFacet(e.target.value)} style={{padding:7,marginLeft:8}}>
   <option value="">Select facet…</option><option value="left">Facet 1 — Left</option><option value="right">Facet 2 — Right</option>
  </select></label>
  {facet&&<RafterPositionEditor key={facet} admin widthMM={length}
   positions={inputs.gableTrussPositionsMM??null} automaticPositions={automatic.centresMM.slice(1,-1)}
   boundaryStartMM={start} boundaryEndMM={end} memberLabel="Truss"
   boundaryStartLabel="Wall truss — locked" boundaryEndLabel="Front truss — locked"
   facetLabel={`Gable ${facet}`} showFacetSelector={false} onApply={onApply}/>}
 </section>;
}
