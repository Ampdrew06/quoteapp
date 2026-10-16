import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianMaterialsReconciliation} from './victorianMaterialsReconciliation';
import {buildSummaryAddedItemLines} from './summaryAddedItems';
const round=n=>Number(n.toFixed(2));
const rate=n=>n==null||n===''||!Number.isFinite(Number(n))||Number(n)<0?null:Number(n);
export function buildVictorianSummaryMaterialsModel({inputs={},materials={},adjustments=inputs.summaryPricingState?.adjustments||{},exclusions=inputs.summaryPricingState?.exclusions||{},addedItems=inputs.summaryAddedItems||[]}={}){
 const geometry=buildVictorianGeometry({inputs,materials}),base=buildVictorianMaterialsReconciliation({geometry,materials,productId:inputs.tileProductId??'britmetShingle',plasticsColour:inputs.plasticsColour??'white',gutterProfile:inputs.gutterProfile??'ogee'});
 if(!base.valid)return {...base,materialsCostForPricing:0};
 const band=base.audits.plastics.band;
 const zeroRates={plastics_fascia_joints:materials[`fascia_joint_300_${band}_price`]??materials[`fascia_joint_price_each_${band}`],metal_jack_rafter_hooks:materials.jack_rafter_hook_price_each??materials.metal?.jack_rafter_hook?.price_each,metal_jack_rafter_brackets:materials.jack_rafter_bracket_price_each??materials.metal?.jack_rafter_bracket?.price_each};
 const sections=Object.fromEntries(Object.entries(base.sections).map(([key,s])=>[key,{lines:s.lines.map(r=>{
  const delta=Number(adjustments[r.key]),qty=r.qty==null?null:Math.max(0,r.qty+(Number.isFinite(delta)?delta:0));
  const unitPrice=r.qty>0&&r.cost!=null?r.cost/r.qty:rate(zeroRates[r.key]);
  const line=qty===0?0:unitPrice==null||qty==null?0:round(qty*unitPrice);
  const source=base.audits.insulation[r.sourceKey],used_m2=r.source==='insulation'?(source?.netAreaM2??source?.installedAreaM2):undefined;
  return {...r,_k:r.key,qty,order_qty:qty,units:r.unit,unit:unitPrice,unitPrice,line,total:line,cost:line,totalCost:line,price_unconfigured:qty!==0&&(qty==null||unitPrice==null),weight_kg:r.installedWeightKg??0,weight_unconfigured:r.installedWeightKg==null&&r.qty!==0,totalWeightKg:r.installedWeightKg??0,excluded:!!exclusions[r.key],used_m2};
 })}]));
 for(const row of buildSummaryAddedItemLines(addedItems,materials))sections[row.section].lines.push({...row,excluded:!!row.extraExcluded,weight_unconfigured:false});
 Object.values(sections).forEach(s=>{s.totals={cost:round(s.lines.reduce((n,r)=>n+(r.excluded?0:r.line),0)),chargeableCost:round(s.lines.reduce((n,r)=>n+(r.excluded?0:r.line),0)),weight:round(s.lines.reduce((n,r)=>n+(r.isAddedItem?0:r.weight_kg),0))};});
 const all=Object.values(sections).flatMap(s=>s.lines),pricingSections=Object.fromEntries(Object.entries(sections).map(([k,s])=>[k,s.totals.cost])),materialsCostForPricing=round(Object.values(pricingSections).reduce((n,v)=>n+v,0)),missingPrices=all.filter(r=>!r.excluded&&r.price_unconfigured),membrane=all.find(r=>r.key==='insulation_membrane');
 const supplyReviews=[...base.audits.tiles.supplyReviews,...base.audits.metal.supplyReviews];
 if((membrane?.qty??0)*base.audits.insulation.membrane.rollCoverageM2+1e-9<base.audits.insulation.membrane.installedAreaM2)supplyReviews.push('Membrane area exceeds supplied roll coverage. Increase the roll quantity in Summary.');
 const materialsWeightKg=round(base.knownInstalledWeightKg),plasterboardWeightKg=round(base.plasterboard.installedWeightKg);
 return {...base,readOnly:false,audits:{...base.audits,geometry},sections,pricingSections,materialsCostForPricing,materialsCost:materialsCostForPricing,materialsBaseCost:materialsCostForPricing,materialsWeightKg,plasterboardWeightKg,installedWeightKg:round(materialsWeightKg+plasterboardWeightKg),weightComplete:base.deferredWeights.length===0,missingPrices,supplyReviews,pricingReady:missingPrices.length===0&&supplyReviews.length===0,notes:[...base.notes.slice(0,-1),'Victorian Summary uses these reconciled costs with existing labour, delivery, markup, discount and VAT helpers. Supply adjustments/exclusions do not alter installed geometry. Known weights are partial until the final weight review.']};
}
