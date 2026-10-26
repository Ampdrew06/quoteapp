import React,{useEffect,useState} from 'react';
import {resolveLeanToRafterLayout} from '../lib/geometry/leanToRafterLayout';
const button={padding:'7px 12px',border:'1px solid #94a3b8',borderRadius:5,background:'white',cursor:'pointer'};
const mm=n=>Number(Number(n).toFixed(3));
export default function RafterPositionEditor({widthMM,positions,materials={},admin,onApply,automaticPositions=null,boundaryStartMM=0,boundaryEndMM=widthMM,facetLabel="Lean-To",showFacetSelector=true,boundaryStartLabel=null,boundaryEndLabel=null,memberLabel="Rafter",lockedCentresMM=[],lockedMemberLabel="Locked member"}){
 const [facet,setFacet]=useState(''),[message,setMessage]=useState('');
 const automatic=resolveLeanToRafterLayout({widthMM,firstCentreMM:materials.rafter_first_center_mm??690,spacingMM:materials.rafter_spacing_mm??665});
 const automaticInterior=automaticPositions??automatic.interiorMM;
 const initial=positions??automaticInterior,stored=JSON.stringify(initial);
 const [draft,setDraft]=useState(()=>initial.map(String));
 useEffect(()=>{setDraft(JSON.parse(stored).map(String));},[stored]);
 if(!admin||!(Number(widthMM)>0))return null;
 const all=[String(boundaryStartMM),...draft,String(boundaryEndMM)];
 const resolved=resolveLeanToRafterLayout({widthMM,positions:draft,boundaryStartMM,boundaryEndMM});
 const edit=(index,value)=>{setDraft(old=>old.map((p,i)=>i===index?value:p));setMessage('');};
 const apply=()=>{if(!resolved.valid){setMessage(resolved.errors.join(' '));return;}if(onApply(resolved.interiorMM)===false)return;setMessage('Changes applied.');};
 return <section style={{margin:'14px 0'}}>{showFacetSelector&&<label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={facet} onChange={e=>setFacet(e.target.value)} style={{padding:7,marginLeft:8}}><option value="">Select facet…</option><option value="1">Facet 1 — Lean-To</option></select></label>}
 {(!showFacetSelector||facet)&&<div role="group" aria-label={`${facetLabel} rafter controls`} style={{border:'1px solid #94a3b8',borderRadius:7,padding:12,marginTop:12}}>
 <div style={{display:'grid',gap:8}}>{all.map((value,i)=>{const boundary=i===0||i===all.length-1,locked=boundary||lockedCentresMM.some(p=>draft.findIndex(v=>v!==''&&Math.abs(Number(v)-p)<0.01)===i-1),previous=i?all[i-1]:'0',next=i<all.length-1?all[i+1]:String(widthMM),field={width:105,padding:6};return <div key={i} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span>{locked&&!boundary?lockedMemberLabel:locked&&(i===0?boundaryStartLabel:boundaryEndLabel)?(i===0?boundaryStartLabel:boundaryEndLabel):`${memberLabel} ${i+1}${locked?' — edge locked':''}`}</span>
 <label>Centre <input aria-label={`${facetLabel} rafter ${i+1} centre`} style={field} type="number" step="0.1" disabled={locked} value={value} onChange={e=>edit(i-1,e.target.value)}/></label>
 <label>Gap from previous <input aria-label={`${facetLabel} rafter ${i+1} gap`} style={field} type="number" step="0.1" disabled={locked||previous===''} value={value===''||previous===''?'':mm(Number(value)-Number(previous))} onChange={e=>{const gap=e.target.value;edit(i-1,gap===''?'':String(mm(Number(previous)+Number(gap))));}}/></label>
 <label>Gap to next <input aria-label={`${facetLabel} rafter ${i+1} next gap`} style={field} type="number" step="0.1" disabled={locked||next===''} value={value===''||next===''?'':mm(Number(next)-Number(value))} onChange={e=>{const gap=e.target.value;edit(i-1,gap===''?'':String(mm(Number(next)-Number(gap))));}}/></label>
 {!locked&&<button type="button" style={button} aria-label={`Remove ${facetLabel} rafter ${i+1}`} onClick={()=>{setDraft(old=>old.filter((_,n)=>n!==i-1));setMessage('');}}>Remove</button>}
 {i<all.length-1&&<button type="button" style={button} aria-label={`Add after ${facetLabel} rafter ${i+1}`} onClick={()=>{setDraft(old=>[...old.slice(0,i),'',...old.slice(i)]);setMessage('');}}>Add after</button>}
 </div>;})}</div>
 <p style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" style={{...button,background:'#0f766e',color:'white'}} onClick={apply}>Apply changes</button><button type="button" style={button} onClick={()=>{if(onApply(null)===false)return;setDraft(automaticInterior.map(String));setMessage('Automatic layout restored.');}}>Restore automatic layout</button></p>
 {!resolved.valid&&<p role="alert">{resolved.errors.join(' ')}</p>}{message&&<p role="status">{message}</p>}
 </div>}
 </section>;
}
