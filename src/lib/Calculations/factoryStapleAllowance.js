// Shared practical factory consumption allowance, not a box supplied to site.
export function buildFactoryStapleAllowance({trussCount=0,ringBeamLengthM=0,wallplateLengthM=0,materials={}}={}) {
 const values=[trussCount,ringBeamLengthM,wallplateLengthM].map(Number);
 const units=Number(materials.factory_staples_32mm_units_per_box??10000);
 const raw=materials.factory_staples_32mm_price_per_box;
 const price=raw===undefined?35:raw===null||raw===''?null:Number(raw);
 if(values.some(v=>!Number.isFinite(v)||v<0)||!Number.isInteger(values[0])||!Number.isInteger(units)||units<=0||price!==null&&(!Number.isFinite(price)||price<0))
  return {valid:false,qty:0,cost:null,errors:['Staple lengths, truss count and pack configuration must be valid.']};
 const [trusses,ring,wall]=values;
 const qty=Math.ceil(trusses*40+(ring+wall)*20-1e-9);
 return {valid:true,key:'factory_staples_32mm',label:'32mm staples — 14/32 NK HZ',qty,unit:'staples consumed',cost:price===null?null:qty*price/units,usage:'factory',installedWeightKg:null,
  unitsPerBox:units,pricePerBox:price,trussCount:trusses,ringBeamLengthM:ring,wallplateLengthM:wall,
  basis:`${trusses} trusses × 40 + ${ring.toFixed(3)}m ring-beam + ${wall.toFixed(3)}m wallplate at 20 staples/m. Closure covered by existing glue/fixings allowance.`};
}
export function integrateFactoryAllowances(audit,lines=[],materials={}) {
 if(!audit?.valid)return lines;
 const make=(key,label,qty,cost,basis,units)=>{
  const value=Number((cost??0).toFixed(2));
  return {key,_k:key,label,qty,order_qty:qty,qtyDisplay:qty,units,unit:qty?value/qty:0,unitPrice:qty?value/qty:0,
   line:value,total:value,cost:value,totalCost:value,weight_kg:0,weightKg:0,totalWeightKg:0,total_weight_kg:0,weight_kg_each:0,
   usage:'factory',supplyToSite:false,price_unconfigured:cost===null,weight_unconfigured:true,requirement_basis:basis};
 };
 const staple=make(audit.key,audit.label,audit.qty,audit.cost,audit.basis,'Ea');
 let replaced=false;
 const result=lines.flatMap(row=>{if(row.key!==audit.key)return [row];if(replaced)return [];replaced=true;return [staple];});
 if(!replaced)result.push(staple);
 // Existing hipped allowance is retained; ordinary Lean-To receives the same single tub.
 if(!result.some(row=>row.key==='d4_glue')){
  const raw=materials.d4_glue_price_per_tub;
  const price=raw==null||raw===''||!Number.isFinite(Number(raw))||Number(raw)<0?null:Number(raw);
  result.push(make('d4_glue','D4 glue (factory use)',1,price,'One tub per roof, including offcut closures.','Tub'));
 }
 return result;
}
