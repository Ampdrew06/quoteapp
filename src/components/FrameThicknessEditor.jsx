import React,{useState,useEffect} from 'react';
import {isAdminUser} from '../lib/userRole';
export default function FrameThicknessEditor({value=70,onApply,admin=isAdminUser()}){
 const [draft,setDraft]=useState(String(value)),[error,setError]=useState('');
 useEffect(()=>{setDraft(String(value));setError('');},[value]);
 if(!admin)return null;
 const apply=()=>{const next=Number(draft);if(draft.trim()===''||!Number.isFinite(next)||next<=0){setError('Enter a frame thickness greater than zero.');return;}onApply(next);setError('');};
 return <details className="print:hidden" style={{border:'1px solid #dce1e8',borderRadius:8,padding:12,margin:'14px 0',font:'13px Inter,system-ui,Arial'}}><summary style={{cursor:'pointer',fontWeight:700}}>Edit frame thickness — admin · {value} mm</summary><p>Applies to this roof only. Internal width and projection stay as entered; external dimensions and material quantities are recalculated.</p><label>Frame thickness (mm)<input aria-label="Frame thickness (mm)" type="number" min="0.1" step="any" value={draft} onChange={e=>setDraft(e.target.value)} style={{display:'block',padding:7,border:'1px solid #cbd5e1',borderRadius:5,margin:'6px 0'}}/></label><button type="button" onClick={apply}>Apply frame thickness</button>{' '}<button type="button" onClick={()=>{onApply(70);setDraft('70');setError('');}}>Restore 70mm default</button>{error&&<p role="alert" style={{color:'#b91c1c'}}>{error}</p>}<p>Existing facet geometry and manual rafter positions are retained. Review the updated preview before saving the quote.</p></details>;
}
