import React,{useEffect,useState} from 'react';
import EdwardianFrontRafterEditor from './EdwardianFrontRafterEditor';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
import {edwardianSideEditorPatch} from '../../lib/geometry/edwardianSideLayout';
import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
const button={padding:'7px 12px',border:'1px solid #94a3b8',borderRadius:5,background:'white',cursor:'pointer'};
const field={width:105,padding:6};
const mm=v=>Number(Number(v).toFixed(3));
export function EdwardianSideFacetEditor({inputs,materials,side,onChange}){
 const fallback=buildEdwardianGeometry({inputs:{...inputs,frontRafterPositionsMM:undefined,rearTrussPositionsMM:undefined,sideJackPositionsMM:undefined},materials});
 const current=buildEdwardianGeometry({inputs,materials}),g=current.valid?current:fallback;
 const initial=g.valid?[
  {role:'wall-truss',centreMM:'31.5'},
  ...(inputs.rearTrussPositionsMM??g.layout.centresMM.slice(1,-1)).map(p=>({role:'truss',centreMM:String(p)})),
  {role:'boss-truss',centreMM:String(g.terminalTrussCentreMM)},
  ...(inputs.sideJackPositionsMM?.[side]??g.sideJacks.filter(r=>r.side===side).map(r=>r.positionMM)).map(p=>({role:'jack',centreMM:String(p)})),
 ]:[];
 const stored=JSON.stringify(initial);
 const [rows,setRows]=useState(initial),[message,setMessage]=useState('');
 useEffect(()=>{setRows(JSON.parse(stored));},[stored]);
 if(!g.valid)return null;
 const dirty=JSON.stringify(rows)!==stored;
 const edit=(i,value)=>{setRows(old=>old.map((r,n)=>n===i?{...r,centreMM:value}:r));setMessage('');};
 const apply=()=>{
  const resolved=edwardianSideEditorPatch({rows,side,inputs,geometry:g});
  if(!resolved.valid){setMessage(resolved.errors.join(' '));return;}
  const checked=buildEdwardianSummaryMaterialsModel({inputs:{...inputs,...resolved.patch},materials});
  if(!checked.valid){setMessage((checked.errors||[]).join(' '));return;}
  onChange(resolved.patch);setMessage('Changes applied.');
 };
 const restore=()=>{const sides={...inputs.sideJackPositionsMM};delete sides[side];onChange({rearTrussPositionsMM:undefined,sideJackPositionsMM:Object.keys(sides).length?sides:undefined});setMessage('Automatic spacing restored. Front pitch retained.');};
 return <div role="group" aria-label={`Facet ${side==='left'?1:3} rafter controls`} style={{border:'1px solid #94a3b8',borderRadius:7,padding:12,margin:'12px 0'}}>
 <p>Centres from the house wall (mm). Trusses are shared by facets 1 and 3.</p>
 {dirty&&<p role="status" style={{color:'#92400e',fontWeight:700}}>Unapplied changes.</p>}
 <div style={{display:'grid',gap:8}}>{rows.map((r,i)=>{const locked=r.role==='wall-truss',previous=i?rows[i-1].centreMM:0,next=i<rows.length-1?rows[i+1].centreMM:g.projectionMM;
 return <div key={i} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span style={{minWidth:105}}>{({'wall-truss':'Wall truss — locked','boss-truss':'Boss truss',truss:'Truss',jack:'Jack rafter'})[r.role]}</span>
 <label>Centre <input style={field} aria-label={`${side} member ${i+1} centre`} type="number" step="0.1" disabled={locked} value={r.centreMM} onChange={e=>edit(i,e.target.value)}/></label>
 <label>Gap from previous <input style={field} aria-label={`${side} member ${i+1} gap`} type="number" step="0.1" disabled={locked||previous===''} value={r.centreMM===''||previous===''?'':mm(Number(r.centreMM)-Number(previous))} onChange={e=>{const gap=e.target.value;edit(i,gap===''?'':String(mm(Number(previous)+Number(gap))));}}/></label>
 <label>Gap to next <input style={field} aria-label={`${side} member ${i+1} next gap`} type="number" step="0.1" disabled={locked||next===''} value={r.centreMM===''||next===''?'':mm(Number(next)-Number(r.centreMM))} onChange={e=>{const gap=e.target.value;edit(i,gap===''?'':String(mm(Number(next)-Number(gap))));}}/></label>
 {!locked&&r.role!=='boss-truss'&&<button type="button" style={button} aria-label={`Remove ${side} member ${i+1}`} onClick={()=>{setRows(old=>old.filter((_,n)=>n!==i));setMessage('');}}>Remove</button>}
 <button type="button" style={button} aria-label={`Add after ${side} member ${i+1}`} onClick={()=>{setRows(old=>[...old.slice(0,i+1),{role:r.role==='jack'||r.role==='boss-truss'?'jack':'truss',centreMM:''},...old.slice(i+1)]);setMessage('');}}>Add after</button>
 </div>;})}</div>
 <p style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" style={{...button,background:'#0f766e',color:'white'}} onClick={apply}>Apply changes</button><button type="button" style={button} onClick={restore}>Restore automatic spacing</button></p>
 {message&&<p role="status">{message}</p>}
 </div>;
}
export default function EdwardianFacetEditor({inputs,materials,admin,onChange}){
 const [facet,setFacet]=useState('');
 if(!admin)return null;
 return <section style={{margin:'14px 0'}}><label style={{fontWeight:700}}>Edit Rafter Position <select aria-label="Edit Rafter Position" value={facet} onChange={e=>setFacet(e.target.value)} style={{padding:7,marginLeft:8}}><option value="">Select facet…</option><option value="1">Facet 1 — RB1</option><option value="2">Facet 2 — RB2</option><option value="3">Facet 3 — RB3</option></select></label>
 {facet&&(facet==='2'?<EdwardianFrontRafterEditor inputs={inputs} materials={materials} admin={admin} onChange={onChange}/>:<EdwardianSideFacetEditor key={facet} inputs={inputs} materials={materials} side={facet==='1'?'left':'right'} onChange={onChange}/>)}
 </section>;
}
