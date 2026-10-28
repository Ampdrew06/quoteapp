import {getSlatePitchRule} from './tileProductConfig';
import {getFixedProductWeightKg} from '../utils/weights';
const rate=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
// Consume the accepted covering quantities. Do not recalculate roof geometry here.
export function buildVictorianHippedTileSummary({timber,inputs={},materials:m={}}={}){
 if(!timber?.valid)return {valid:false,errors:timber?.errors||['Valid timber/covering model required.'],rows:[]};
 const a=timber.covering,g=timber.geometry,steel=a.steel,id=a.productId,prefix={britmetShingle:'britmet',metrotileShingle:'metrotile',liteSlate:'liteslate',tapcoSlate:'tapco'}[id],group=m[id]||{};
 const state=inputs.victorianHippedTileSummary||{},rows=[];
 const add=(key,label,quantity,unitPrice,installedWeight,basis)=>{
  const p=rate(unitPrice),raw=Number(state.adjustments?.[key]??0),delta=Number.isFinite(raw)?raw:0,qty=quantity===null?null:Math.max(0,Math.ceil(quantity+delta-1e-9)),excluded=!!state.exclusions?.[key],cost=qty===0?0:qty===null||p===null?null:round(qty*p),weight=installedWeight===null?null:installedWeight;
  rows.push({key,label,qty,orderQty:qty,units:'each',cost:cost??0,chargeableCost:excluded?0:cost??0,excluded,unitPrice:p,weightKg:weight,weightText:weight===null?'Unconfigured':weight.toFixed(2)+' kg',priceMissing:cost===null&&qty!==0,adjustment:state.adjustments?.[key]??'',adjustmentUnit:'whole items',qtyBasis:'Calculated whole-stock quantity, then supply adjustment; always rounded up to whole items. No additional percentage waste.',orderBasis:'Only whole stock is supplied.',basis,baseQty:quantity});
 };
 const price=rate(m[steel?`tile_${prefix}_price_each`:`${prefix}_tile_price_each`]??group.price_each),kg=rate(m[steel?`tile_${prefix}_weight_kg`:`${prefix}_tile_weight_kg_each`]??m[`${prefix}_tile_weight_kg`]??group.weight_kg_per_tile);
 const density=steel?rate(m[`tile_${prefix}_tiles_per_m2`]??3.2):null;
 const installedUnits=steel?(density===null?null:a.roofAreaM2*density):a.facets.reduce((n,f)=>n+f.areaM2*getSlatePitchRule(id,f.pitchDeg).slatesPerM2,0);
 add('vh_tiles_main','Main tiles — shared roof-wide calculation',a.result.tileQuantityOrdered,price,kg===null||installedUnits===null?null:kg*installedUnits,steel?`${a.result.tileQuantityRounded} roof-wide rounded + ${a.result.orderAllowanceTiles} allowance tiles.`:'Shared slate courses including doubled first rows.');
 const hipKg=steel?getFixedProductWeightKg('hip_ridge'):rate(m[`${prefix}_ridge_tile_weight_kg`]??m[`ridge_tile_${prefix}_weight_kg`]),hipUnits=steel?a.edges.reduce((n,e)=>n+e.allocationTiles,0):a.hipTiles;
 add('vh_tiles_hips','Hip tiles — pooled whole stock',a.hipTiles,m[`${prefix}_ridge_tile_price_each`],a.edges.length===0?0:hipKg===null||hipUnits===null?null:hipKg*hipUnits,steel?'1230mm nominal cover plus up to 30mm per full piece; compatible halves pooled into whole stock. No extra waste applied.':'Configured slate hip units per metre, rounded per hip.');
 // Stock cap angle follows the corner family, retaining surveyed-angle edits.
 const cap135=g.hips.filter(h=>{const adjacent=g.facets.filter(f=>Math.hypot(f.start.xMM-h.end.xMM,f.start.yMM-h.end.yMM)<1e-5||Math.hypot(f.end.xMM-h.end.xMM,f.end.yMM-h.end.yMM)<1e-5);return adjacent.some(f=>f.id==='F2'||f.id==='F4');}).length,cap90=g.hips.length-cap135;
 for(const [angle,qty] of [[90,cap90],[135,cap135]]){
  const unit=steel?getFixedProductWeightKg(`hip_end_cap_${angle}`):rate(m[`${prefix}_hip_end_cap_${angle}_weight_kg`]);
  add(`vh_tiles_cap${angle}`,`${angle}° hip end caps`,qty,m[`${prefix}_hip_end_cap_${angle}_price_each`]??m[`${prefix}_hip_end_cap_${angle}_price`],qty===0?0:unit===null?null:qty*unit,'One cap per hip toe, using 90° or 135° stock for the selected end family; minor survey-angle differences do not create custom cap products.');
 }
 if(steel)add('vh_tiles_touchup','Steel tile touch-up kit',1,m[`${prefix}_touchup_kit_price_each`]??m[`touchup_kit_${prefix}_price_each`]??(id==='britmetShingle'?m.touchUpKitBritmet?.price_each:null),0,'Loose kit; no installed roof weight.');
 const totals={cost:round(rows.reduce((n,r)=>n+r.chargeableCost,0)),chargeableCost:round(rows.reduce((n,r)=>n+r.chargeableCost,0)),weight:round(rows.reduce((n,r)=>n+(r.weightKg??0),0))};
 return {valid:true,errors:[],rows,totals,missingPrices:rows.filter(r=>r.priceMissing&&!r.excluded),partial:true,pricingReady:false,notes:['The app geometry is accepted provisionally for integration, pending measured build comparisons.','Hip tops finish under lead flashing, with no top caps/adaptors. Bottom end caps remain in this table. There is no horizontal ridge or ridge ventilation strip.','Foam tape is allocated to Miscellaneous and tile starters to Metal, without duplicate charges.','Slate selling-price contribution matching uses the Britmet benchmark in the quotation calculation.']};
}
