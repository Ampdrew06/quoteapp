import {DEFAULT_METROTILE_CARRIAGE_GBP} from '../doubleEdwardianTileOptions';
export function metrotileCarriageAmount(inputs){
 const value=inputs.metrotileCarriageGBP;
 if(value==null||value==='')return DEFAULT_METROTILE_CARRIAGE_GBP;
 const n=Number(value);
 return Number.isFinite(n)&&n>=0?Number(n.toFixed(2)):null;
}
export function metrotileCarriageLine(inputs){
 if(inputs.tileProductId!=='metrotileShingle')return null;
 const amount=metrotileCarriageAmount(inputs),key='metrotile_supplier_carriage';
 return {key,_k:key,label:'Metrotile supplier carriage',qty:1,order_qty:1,units:'Order',unit:amount,unitPrice:amount,
  line:amount??0,total:amount??0,cost:amount??0,totalCost:amount??0,price_unconfigured:amount==null,
  weight_kg:0,totalWeightKg:0,total_weight_kg:0,supplyToSite:false};
}
