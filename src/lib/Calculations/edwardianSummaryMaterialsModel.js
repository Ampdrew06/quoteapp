import {buildEdwardianMaterialsReconciliation} from './edwardianMaterialsReconciliation';
import {buildSummaryAddedItemLines} from './summaryAddedItems';
const round=n=>Number(Number(n).toFixed(2));
export function buildEdwardianSummaryMaterialsModel({inputs={},materials={},exclusions=inputs.summaryPricingState?.exclusions||{},adjustments=inputs.summaryPricingState?.adjustments||{},addedItems=inputs.summaryAddedItems||[]}={}){
 const base=buildEdwardianMaterialsReconciliation({inputs,materials});
 if(!base.valid)return {...base,materialsCostForPricing:0};
 const sections=Object.fromEntries(Object.entries(base.sections).map(([key,s])=>[key,{lines:s.lines.map(source=>{
  // Starter is ordered in 3m lengths; installed metres remain its weight basis.
  const r=source.key==='tile_starter'?{...source,key:'edwardian_tile_starter',qty:source.order_qty,units:'Lengths'}:{...source};
  const band=base.audits.plastics.band;
  const emptyPrice=r.key==='edwardian_plastic_fascia_joints'?(materials[`fascia_joint_300_${band}_price`]??materials[`fascia_joint_price_each_${band}`]):null;
  const hasEmptyPrice=emptyPrice!=null&&emptyPrice!==''&&Number.isFinite(Number(emptyPrice))&&Number(emptyPrice)>=0;
  const unitPrice=r.qty?r.line/r.qty:hasEmptyPrice?Number(emptyPrice):0,delta=Number(adjustments[r.key]),qty=Math.max(0,r.qty+(Number.isFinite(delta)?delta:0)),line=round(qty*unitPrice);
  const priceMissing=qty>0&&(r.qty?r.price_unconfigured:!hasEmptyPrice);
  return {...r,_k:r.key,qty,order_qty:qty,price_unconfigured:priceMissing,unit:unitPrice,unitPrice,line,total:line,cost:line,totalCost:line,totalWeightKg:r.weight_kg,total_weight_kg:r.weight_kg,excluded:!!exclusions[r.key]};
 })}]));
 for(const row of buildSummaryAddedItemLines(addedItems,materials))sections[row.section].lines.push({...row,excluded:!!row.extraExcluded,weight_unconfigured:false});
 for(const s of Object.values(sections))s.totals={cost:round(s.lines.reduce((n,r)=>n+(r.excluded?0:r.line),0)),chargeableCost:round(s.lines.reduce((n,r)=>n+(r.excluded?0:r.line),0)),weight:round(s.lines.reduce((n,r)=>n+(r.isAddedItem?0:r.weight_kg),0))};
 const pricingSections=Object.fromEntries(Object.entries(sections).map(([k,s])=>[k,s.totals.cost])),materialsCostForPricing=round(Object.values(pricingSections).reduce((n,v)=>n+v,0));
 const all=Object.values(sections).flatMap(s=>s.lines),missingPrices=all.filter(r=>r.qty>0&&!r.excluded&&r.price_unconfigured);
 const membrane=all.find(r=>r.key==='edwardian_membrane'),supplyReviews=[];
 if((membrane?.qty??0)*50+1e-9<base.audits.insulation.membrane.installedAreaM2)supplyReviews.push('Membrane area exceeds supplied roll coverage. Increase the roll quantity in Summary.');
 return {...base,readOnly:false,sections,pricingSections,materialsCost:materialsCostForPricing,materialsCostForPricing,materialsBaseCost:materialsCostForPricing,missingPrices,supplyReviews,pricingReady:missingPrices.length===0&&supplyReviews.length===0,quantityAdjustments:adjustments,plasterboard:base.audits.insulation.plasterboard,notes:[...base.notes.slice(0,-1),'Summary, quotation pricing and Idiot List share these requirements. Manual supply changes affect cost and despatch, not installed geometry.']};
}
