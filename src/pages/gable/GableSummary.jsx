import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {getMaterials} from '../../lib/materials';
import {getCustomers} from '../../lib/customers';
import {buildGableSummaryMaterialsModel} from '../../lib/Calculations/gableSummaryMaterialsModel';
import {buildSummaryItemCatalog,normalizeAddedItems} from '../../lib/Calculations/summaryAddedItems';
import GablePricingPanel from './GablePricingPanel';
const KEY='gableDesignPreviewInputs';
const labels={timber:'Timber Elements',tiles:'Tile Elements',plastics:'Plastic Elements',metal:'Metal Elements',gutters:'Guttering Elements',misc:'Miscellaneous Elements'};
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}};
const money=value=>'£'+Number(value||0).toFixed(2);
export default function GableSummary(){
 const [inputs,setInputs]=useState(read),[materials,setMaterials]=useState(getMaterials),[customers,setCustomers]=useState([]);
 useEffect(()=>{
  let alive=true;const refresh=()=>setMaterials(getMaterials());
  const load=async()=>{const rows=await getCustomers();if(alive)setCustomers(Array.isArray(rows)?rows:[]);};load();
  window.addEventListener('materials_updated',refresh);window.addEventListener('quoteapp_customers_updated',load);
  return ()=>{alive=false;window.removeEventListener('materials_updated',refresh);window.removeEventListener('quoteapp_customers_updated',load);};
 },[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 const model=buildGableSummaryMaterialsModel({inputs,materials});
 const patch=value=>setInputs(old=>({...old,...value}));
 const addItems=items=>patch({summaryAddedItems:normalizeAddedItems(items)});
 const changeQty=(row,qty)=>{
  const value=Math.max(0,Number(qty)||0);
  if(row.isAddedItem){addItems((inputs.summaryAddedItems||[]).map(item=>item.section===row.section&&item.catalogId===row.catalogId?{...item,qty:value}:item));return;}
  setInputs(old=>({...old,summaryPricingState:{...old.summaryPricingState,adjustments:{...old.summaryPricingState?.adjustments,[row.key]:(Number(old.summaryPricingState?.adjustments?.[row.key])||0)+value-row.qty}}}));
 };
 const exclude=(row,value)=>{
  if(row.isAddedItem){addItems((inputs.summaryAddedItems||[]).map(item=>item.section===row.section&&item.catalogId===row.catalogId?{...item,excluded:value}:item));return;}
  setInputs(old=>({...old,summaryPricingState:{...old.summaryPricingState,exclusions:{...old.summaryPricingState?.exclusions,[row.key]:value}}}));
 };
 const catalog=buildSummaryItemCatalog(materials);
 return <main style={{fontFamily:'Arial,sans-serif',maxWidth:1120,margin:'0 auto',padding:18}}>
 <h1>Gable — Summary</h1>
 <p>{inputs.customerReference||'No reference'} · {inputs.widthMM||'—'} × {inputs.projMM||'—'}mm internal · {inputs.tileProductId||'britmetShingle'} · {inputs.fasciaColour||'White'} fascia/soffit · {inputs.gutterColour||'White'} {inputs.gutterProfile||'square'} gutter.</p>
 {!model.valid?<p role="status">{model.errors.join(' ')} <Link to="/quote/gable">Return to Design/Options</Link></p>:<>
 {Object.entries(model.sections).map(([section,data])=>{
  const choices=catalog.filter(item=>item.section===section&&!(inputs.summaryAddedItems||[]).some(added=>added.section===section&&added.catalogId===item.id));
  return <section key={section} style={{margin:'24px 0'}}><h2>{labels[section]}</h2><div style={{overflowX:'auto'}}>
  <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Material','Quantity','Unit','Cost','Installed kg','Exclude price'].map(label=><th key={label} style={{textAlign:'left',padding:8,borderBottom:'2px solid #64748b'}}>{label}</th>)}</tr></thead>
  <tbody>{data.lines.map(row=><tr key={row.key} style={{background:row.excluded?'#f1f5f9':'white'}}>
  <td style={{padding:8}}>{row.label}{row.usage==='factory'?' (factory use)':''}{row.isAddedItem&&<button type="button" aria-label={'Remove '+row.label} onClick={()=>addItems((inputs.summaryAddedItems||[]).filter(item=>!(item.section===section&&item.catalogId===row.catalogId)))}>Remove</button>}</td>
  <td style={{whiteSpace:'nowrap'}}><button type="button" aria-label={'Reduce '+row.label} onClick={()=>changeQty(row,row.qty-1)}>−</button> <input aria-label={'Quantity '+row.label} type="number" min="0" step={row.units==='m'||row.units==='m²'?0.1:1} value={Number(row.qty.toFixed(3))} onChange={e=>changeQty(row,e.target.value)} style={{width:80}} /> <button type="button" aria-label={'Increase '+row.label} onClick={()=>changeQty(row,row.qty+1)}>+</button></td>
  <td style={{padding:8}}>{row.units}</td><td style={{padding:8}}>{row.price_unconfigured&&row.qty>0?'Unconfigured':money(row.line)}</td><td style={{padding:8}}>{row.isAddedItem?'Supply extra':row.weight_unconfigured?'Unconfigured':row.weight_kg.toFixed(2)}</td>
  <td style={{padding:8}}><input type="checkbox" aria-label={'Exclude price '+row.label} checked={!!row.excluded} onChange={e=>exclude(row,e.target.checked)} /></td>
  </tr>)}
  <tr><td colSpan="6" style={{padding:10}}><select aria-label={'Add item to '+labels[section]} value="" onChange={e=>{if(e.target.value)addItems([...(inputs.summaryAddedItems||[]),{section,catalogId:e.target.value,qty:1}]);}} style={{padding:8,maxWidth:'100%'}}><option value="">Add item…</option>{choices.map(item=><option key={item.id} value={item.id}>{item.label}{item.unitPrice==null?' — price unconfigured':''}</option>)}</select></td></tr>
  </tbody><tfoot><tr><td colSpan="3" style={{padding:8}}>Section total</td><td><strong>{money(data.totals.cost)}</strong></td><td>{data.totals.weight.toFixed(2)}</td><td /></tr></tfoot></table></div></section>;
 })}
 <p style={{fontSize:20}}>Materials total: <strong>{money(model.materialsCostForPricing)}</strong></p>
 <p>Plasterboard: {model.plasterboard.installedAreaM2.toFixed(3)}m² · {model.plasterboard.sheets} sheets for information · {model.plasterboardWeightKg.toFixed(2)}kg included once. Supply is excluded.</p>
 <p>Known installed roof weight including plasterboard: <strong>{model.installedWeightKg.toFixed(2)}kg</strong>. Rows marked Unconfigured have no weight added. Supply extras and quantity changes do not alter the installed roof geometry.</p>
 <details><summary>Calculation notes</summary><ul>{model.notes.map(note=><li key={note}>{note}</li>)}</ul></details>
 <GablePricingPanel inputs={inputs} materials={materials} customers={customers} onChange={patch} summary />
 </>}
 </main>;
}
