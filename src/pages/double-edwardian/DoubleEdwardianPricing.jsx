import React from 'react';
import {Link} from 'react-router-dom';
import {buildDoubleEdwardianQuotation} from '../../lib/Calculations/doubleEdwardianQuotation';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../../lib/pricing';
const money=n=>'£'+Number(n||0).toFixed(2);
export default function DoubleEdwardianPricing({inputs,materials,customers,onChange}){
 const customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null;
 const q=buildDoubleEdwardianQuotation({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()});
 const model=q.model;
 const adjustment=(key,delta)=>{
  const row=Object.values(model.sections||{}).flatMap(s=>s.lines).find(r=>r.key===key);
  if(row?.isAddedItem){onChange({summaryAddedItems:(inputs.summaryAddedItems||[]).map(item=>item.section===row.section&&item.catalogId===row.catalogId?{...item,qty:Math.max(0,Number(item.qty??1)+delta)}:item)});return;}
  onChange({summaryPricingState:{...inputs.summaryPricingState,adjustments:{...inputs.summaryPricingState?.adjustments,[key]:Number(inputs.summaryPricingState?.adjustments?.[key]||0)+delta}}});
 };
 const toggleExclude=(row,value)=>row.isAddedItem?onChange({summaryAddedItems:(inputs.summaryAddedItems||[]).map(item=>item.section===row.section&&item.catalogId===row.catalogId?{...item,excluded:value}:item)}):onChange({summaryPricingState:{...inputs.summaryPricingState,exclusions:{...inputs.summaryPricingState?.exclusions,[row.key]:value}}});
 return <section style={{border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginTop:16}}><h2 style={{fontSize:18}}>Provisional roof-package estimate</h2><p>Excludes the external OSB valley, EPDM/adhesives, valley starter and rear hip weathering. Cutting allowances and manufacture reconciliation remain pending.</p>
 {!q.valid?<p role="status">{q.errors?.join(' ')}</p>:<><p>Known materials cost: <strong>{money(model.materialsCostForPricing)}</strong> · Labour: {money(q.labour.labourCost)} ({q.labour.days.toFixed(2)} days) · Delivery: {money(q.delivery.deliveryCost)} ({q.delivery.oneWayMiles.toFixed(1)} miles).</p>
 <label>Labour days override <input type="number" min="0.1" step="0.1" value={inputs.labourDaysOverride??''} placeholder={q.labour.days.toFixed(2)} onChange={e=>onChange({labourDaysOverride:e.target.value})}/></label>
 <p>Roof-package weight: {model.installedWeightKg.toFixed(1)} kg including {model.plasterboardWeightKg.toFixed(1)} kg plasterboard.{!model.weightComplete&&' Known weight only: some fitting/consumable weights are unconfigured.'}</p>
 {model.missingPrices.length>0&&<p role="status">Configure these <Link to="/materials">Materials</Link> prices before a selling price is shown: {model.missingPrices.map(r=>r.label).join('; ')}.</p>}
 {model.supplyReviews.map(note=><p key={note} role="alert">{note}</p>)}
 {!q.customerReady&&<p role="status">Selected customer details are not available.</p>}{!q.distanceReady&&<p role="status">Enter the delivery distance for the current postcode.</p>}
 {q.ready&&<p><strong>Provisional price: {money(q.pricing.net)} + VAT · {money(q.pricing.gross)} including VAT</strong></p>}
 <p>Save or update this provisional design using the controls above. The manufacture book remains pending.</p>
 <p><Link to="/quote/double-edwardian/summary">Summary — costs, weights and supply adjustments</Link></p><details><summary>Materials quantities, costs and weights</summary>{Object.entries(model.sections).map(([name,section])=><section key={name}><h3 style={{textTransform:'capitalize'}}>{name} — {money(section.totals.cost)}</h3><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr>{['Item','Supply / charge qty','Cost','Installed kg','Adjust supply'].map(h=><th key={h} style={{textAlign:'left',borderBottom:'1px solid #cbd5e1',padding:5}}>{h}</th>)}</tr></thead><tbody>{section.lines.filter(r=>r.qty>0||r.used_qty>0||Number(inputs.summaryPricingState?.adjustments?.[r.key])!==0&&inputs.summaryPricingState?.adjustments?.[r.key]!=null).map(r=><tr key={r.key}><td style={{padding:5}}>{r.label}{r.wastePercent!=null&&` (+${r.wastePercent}% cost allowance)`}</td><td>{Number(r.qty.toFixed(3))} {r.units}</td><td>{r.excluded?'Excluded':r.price_unconfigured?'Unconfigured':money(r.line)}</td><td>{r.weight_unconfigured?'Unconfigured':r.weight_kg.toFixed(2)}</td><td><button type="button" aria-label={'Remove supply '+r.label} onClick={()=>adjustment(r.key,-1)}>−</button>{' '}<button type="button" aria-label={'Add supply '+r.label} onClick={()=>adjustment(r.key,1)}>+</button>{' '}<label><input type="checkbox" checked={r.excluded} onChange={e=>toggleExclude(r,e.target.checked)}/> Exclude cost</label></td></tr>)}</tbody></table></div></section>)}<button type="button" onClick={()=>onChange({summaryPricingState:{}})}>Restore calculated supply quantities</button><p>Supply changes affect cost; installed roof weight remains based on geometry.</p>{model.notes.map(note=><p key={note}>{note}</p>)}</details>
 </>}
 </section>;
}
