import React,{useState,useEffect} from 'react';
import {NavLink} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildCombinationMaterialsModel} from '../../lib/Calculations/combinationMaterialsModel';
import CombinationNavigation from './CombinationNavigation';
const box={border:'1px solid #dce1e8',borderRadius:8,padding:14,marginBottom:16},cell={padding:'6px 8px',border:'1px solid #cbd5e1',textAlign:'left'},number=n=>Number.isFinite(Number(n))?Number(Number(n).toFixed(3)):'To confirm';
export default function CombinationTechnical(){
 const [materials,setMaterials]=useState(getMaterials);
 useEffect(()=>{const refresh=()=>setMaterials(getMaterials());window.addEventListener('materials_updated',refresh);return()=>window.removeEventListener('materials_updated',refresh);},[]);
 if(!isAdminUser())return <main style={{padding:20}}><NavLink to="/quote">Home</NavLink><p>This preview is available to admin.</p></main>;
 let inputs={};try{inputs=JSON.parse(localStorage.getItem('combinationGeometryDraft')||'{}');}catch{}
 const model=buildCombinationMaterialsModel({inputs,materials}),g=model.geometry;
 const reviews=[...new Set(model.supplyReviews||[])],labels={timber:'Timber Elements',tiles:'Tile Elements',plastics:'Plastic Elements',metal:'Metal Elements',gutters:'Guttering Elements',misc:'Insulation & Miscellaneous'};
 const laths=model.audits?.laths,stock=laths?.stockPlan?.qty??laths?.stockQty;
 return <><CombinationNavigation/><main style={{maxWidth:1100,margin:'0 auto',padding:16,fontFamily:'Inter,system-ui,Arial'}}><h1 style={{fontSize:24}}>Technical — Edwardian / Victorian</h1><p>Material quantities follow the current Design/Options draft, including applied rafter edits. Pricing and Save Quote are available on Design/Options and Summary. Manufacture Book includes the plan, member profiles, ringbeams and final checklist.</p>
 {!model.valid?<section style={box} role="status">{model.errors?.join(' ')} <NavLink to="/quote/combination">Return to Design/Options</NavLink></section>:<>
 <section style={box}><strong>{number(g.widthMM)} × {number(g.projectionMM)}mm · {number(g.pitchDeg)}°</strong><p>Left: {g.leftSide} · Right: {g.rightSide}</p><p>{model.comparisonStyle==='mixed'?'Mixed geometry: quantities calculated from its actual members, roof surfaces and perimeter.':`Comparison mode: the existing ${model.comparisonStyle==='edwardian'?'Edwardian':'3-facet Victorian'} material calculation is used, including manual positions.`}</p><p>External ringbeam perimeter: <strong>{number(g.facets.reduce((n,f)=>n+f.externalLengthMM,0))}mm</strong></p>{stock!=null&&<p>Pooled 25×50 lath order allowance: <strong>{stock} × {number(laths.stockM??4.8)}m lengths</strong></p>}</section>
 {reviews.length>0&&<section style={{...box,background:'#fffbeb'}}><h2 style={{fontSize:17}}>Items to confirm</h2><ul>{reviews.map(s=><li key={s}>{s}</li>)}</ul><p>Unconfirmed quantities are shown explicitly below. This review is not a complete order or a manufacture release.</p></section>}
 <p>Timber lengths and areas are net requirements unless the units state stock lengths, boards or sheets. Order allowances use the existing material rules. Unknown installed weights are shown as unconfigured.</p>
 {Object.entries(model.sections).map(([key,section])=><section key={key} style={box}><h2 style={{fontSize:18}}>{labels[key]||key}</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{['Item','Quantity','Units / basis','Installed weight'].map(t=><th key={t} style={{...cell,background:'#f3f4f6'}}>{t}</th>)}</tr></thead><tbody>{section.lines.map(row=>{const qty=row.qty,weight=row.installedWeightKg??(row.weight_unconfigured?null:row.weight_kg);return <tr key={row.key}><td style={cell}>{row.label}</td><td style={cell}>{qty==null?'To confirm':number(qty)}</td><td style={cell}>{row.unit??row.units}{row.basis&&<div style={{fontSize:11,color:'#475569'}}>{row.basis}</div>}</td><td style={cell}>{weight==null?'Unconfigured':`${number(weight)} kg`}</td></tr>;})}</tbody></table></div></section>)}
 <section style={box}><strong>Plasterboard — not supplied</strong><p>{number(model.plasterboard?.installedAreaM2??model.audits?.insulation?.plasterboard?.installedAreaM2)}m² installed ceiling area. This is a customer buying guide, not an additional supplied item.</p></section>
 </>}
 </main></>;
}
