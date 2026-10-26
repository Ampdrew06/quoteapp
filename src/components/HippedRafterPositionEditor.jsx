import React,{useState} from 'react';
import RafterPositionEditor from './RafterPositionEditor';

export default function HippedRafterPositionEditor({geometry,widthMM,projectionMM,positions,admin,onApply}) {
 const [facet,setFacet]=useState('');
 if(!admin||!geometry||!(Number(widthMM)>0&&Number(projectionMM)>0))return null;
 const facets=[
  ...(geometry.hasLeftHip?[{key:'left',label:'Facet 1 — Left',length:projectionMM,automatic:geometry.leftSideRingBeamLayout?.intermediateJackRafters?.map(r=>r.centreMM)??[]}]:[]),
  {key:'front',label:'Facet 2 — Front',length:widthMM,automatic:geometry.frontRafterLayoutV2?.allRafters?.map(r=>r.centreMM)??[]},
  ...(geometry.hasRightHip?[{key:'right',label:'Facet 3 — Right',length:projectionMM,automatic:geometry.rightSideRingBeamLayout?.intermediateJackRafters?.map(r=>r.centreMM)??[]}]:[]),
 ];
 const selected=facets.find(f=>f.key===facet);
 return <section style={{margin:'14px 0'}}>
  <label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={selected?facet:''} onChange={e=>setFacet(e.target.value)} style={{padding:7,marginLeft:8}}>
   <option value="">Select facet…</option>{facets.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}
  </select></label>
  {selected&&<RafterPositionEditor key={selected.key} admin widthMM={selected.length}
   positions={positions?.[selected.key]??null} automaticPositions={selected.automatic}
   boundaryStartMM={24} boundaryEndMM={Number(selected.length)-24}
   facetLabel={selected.label} showFacetSelector={false}
   boundaryStartLabel={facet==='front'?'Left corner — locked':'Wall member — locked'}
   boundaryEndLabel={facet==='front'?'Right corner — locked':'Hip seat — locked'}
   onApply={value=>onApply({...positions,[selected.key]:value})}/>}
 </section>;
}
