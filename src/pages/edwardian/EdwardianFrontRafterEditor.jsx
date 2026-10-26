import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
import React,{useEffect,useState} from 'react';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
import {resolveEdwardianFrontRafters} from '../../lib/geometry/edwardianFrontRafters';
export default function EdwardianFrontRafterEditor({inputs,materials,admin,onChange}){
 const automatic=buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:undefined,frontRafterSpacingOverride:false},materials});
 const positions=inputs.frontRafterPositionsMM??(automatic.valid?automatic.frontRafters.map(r=>r.centreMM):[]);
 const [draft,setDraft]=useState(()=>positions.map(String)),[message,setMessage]=useState('');
 const stored=JSON.stringify(positions);
 useEffect(()=>{setDraft(JSON.parse(stored).map(String));},[stored]);
 if(!admin||!automatic.valid)return null;
 const resolved=resolveEdwardianFrontRafters({positions:draft,widthMM:automatic.widthMM,ridgeEndYMM:automatic.ridgeEndYMM,projectionMM:automatic.projectionMM,allowWideGaps:true});
 const dirty=JSON.stringify(draft.map(v=>v===''?'':Number(v)))!==JSON.stringify(positions.map(Number));
 const apply=()=>{
  if(!resolved.valid){setMessage(resolved.errors.join(' '));return;}
  const patch={frontRafterPositionsMM:resolved.rafters.map(r=>r.centreMM),frontRafterSpacingOverride:true};
  // Validate actual cuts and ringbeam slots before changing the active design.
  const checked=buildEdwardianSummaryMaterialsModel({inputs:{...inputs,...patch},materials});
  if(!checked.valid){setMessage((checked.errors||['The layout does not leave valid cut profiles.']).join(' '));return;}
  onChange(patch);setMessage('Changes applied.');
 };
 const button={padding:'7px 12px',border:'1px solid #94a3b8',borderRadius:5,background:'#fff',cursor:'pointer'};
 return <div role="group" aria-label="Facet 2 rafter controls" style={{border:'1px solid #94a3b8',borderRadius:7,padding:12,margin:'14px 0'}}>
 {dirty&&<p role="status" style={{fontWeight:700,color:'#92400e'}}>Unapplied changes.</p>}
 <div style={{display:'grid',gap:8,maxWidth:840}}>{draft.map((value,i)=><div key={i} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><label>Rafter {i+1} centre <input aria-label={`Front rafter ${i+1} centre`} type="number" step="0.1" value={value} onChange={e=>{const value=e.target.value;setDraft(old=>old.map((v,n)=>n===i?value:v));setMessage('');}} style={{width:110,padding:6}}/></label><label>{i===0?'Gap from left corner':'Gap from previous'} <input aria-label={`Front rafter ${i+1} gap`} type="number" step="0.1" value={value===''||(i>0&&draft[i-1]==='')?'':Number((Number(value)-(i?Number(draft[i-1]):0)).toFixed(3))} disabled={i>0&&draft[i-1]===''} onChange={e=>{const gap=e.target.value;setDraft(old=>old.map((v,n)=>n===i?(gap===''?'':String(Number((Number(gap)+(i?Number(old[i-1]):0)).toFixed(3)))):v));setMessage('');}} style={{width:110,padding:6}}/></label><label>Gap to next <input aria-label={`Front rafter ${i+1} next gap`} type="number" step="0.1" value={value===''||(i<draft.length-1&&draft[i+1]==='')?'':Number(((i<draft.length-1?Number(draft[i+1]):automatic.widthMM)-Number(value)).toFixed(3))} disabled={i<draft.length-1&&draft[i+1]===''} onChange={e=>{const gap=e.target.value;setDraft(old=>old.map((v,n)=>n===i?(gap===''?'':String(Number(((i<old.length-1?Number(old[i+1]):automatic.widthMM)-Number(gap)).toFixed(3)))):v));setMessage('');}} style={{width:110,padding:6}}/></label><span>{value!==''&&Math.abs(Number(value)-automatic.widthMM/2)<0.001?'Boss rafter':'Jack rafter'}</span><button type="button" style={button} aria-label={`Remove front rafter ${i+1}`} onClick={()=>{setDraft(old=>old.filter((_,n)=>n!==i));setMessage('');}}>Remove</button><button type="button" style={button} aria-label={`Add rafter after ${i+1}`} onClick={()=>{setDraft(old=>[...old.slice(0,i+1),'',...old.slice(i+1)]);setMessage('');}}>Add after</button></div>)}</div>
 <p><button type="button" style={button} onClick={()=>setDraft(old=>[...old,''])}>Add rafter</button></p>
 {resolved.gapsMM&&<p>Centre spacings including corners: {resolved.gapsMM.map(v=>Number(v.toFixed(1))).join(', ')}mm.</p>}
 {!resolved.valid&&<div role="alert" style={{border:'1px solid #dc2626',background:'#fef2f2',color:'#991b1b',padding:10,marginTop:10}}><b>Layout cannot be applied yet.</b>{resolved.errors.map(error=><p key={error} style={{margin:'6px 0'}}>{error}</p>)}</div>}
 <p style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" style={{...button,background:resolved.valid?'#0f766e':'#64748b',color:'white'}} aria-disabled={!resolved.valid} onClick={apply}>Apply changes</button><button type="button" style={button} onClick={()=>{onChange({frontRafterPositionsMM:undefined,frontRafterSpacingOverride:false});setDraft(automatic.frontRafters.map(r=>String(r.centreMM)));setMessage('Automatic front layout restored.');}}>Restore automatic layout</button></p>
 {message&&<p role="status">{message}</p>}
 </div>;
}
