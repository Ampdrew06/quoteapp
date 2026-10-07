const rate=value=>value==null || value==='' || !Number.isFinite(Number(value)) || Number(value)<0 ? null : Number(value);
export function buildCentralBossTrussCosts({geometry,materials={}}={}) {
 const truss=geometry?.centralTruss;
 if(geometry?.bossArrangement!=='central')return null;
 const pricePerM=rate(materials.truss_closure_45x45_price_per_m),weightPerM=rate(materials.truss_closure_45x45_weight_kg_per_m);
 const lengthM=truss?.valid ? truss.closure.cutLengthMM/1000 : 0;
 return {valid:!!truss?.valid,pricingReady:!!truss?.valid && pricePerM!=null,
  errors:truss?.valid ? pricePerM==null?['Enter the 45×45 truss closure price per metre on Materials.']:[] : truss?.errors || ['Valid central truss geometry is required.'],
  quantities:truss?.valid ? {steicoLengthM:truss.members.reduce((sum,m)=>sum+m.externalSlopeMM,0)/1000,
   ply9AreaM2:2*truss.gusset.areaEachM2,ply18AreaM2:2*truss.chevron.areaEachM2,closureLengthM:lengthM,
   trussMembers:2,gussets:2,chevrons:2,closures:1,bosses:1,sparHooks:6} : {},
  closureLine:{key:'truss_closure_45x45',label:'45×45 PSE truss closure (595mm factory-cut)'+(pricePerM==null?' — price unconfigured':'')+(weightPerM==null?' — weight unconfigured':''),
   qty:lengthM,order_qty:1,units:'m',unit:pricePerM??0,unitPrice:pricePerM??0,
   line:Number((lengthM*(pricePerM??0)).toFixed(2)),weight_kg:Number((lengthM*(weightPerM??0)).toFixed(2)),
   price_unconfigured:pricePerM==null,weight_unconfigured:weightPerM==null,
   usage:'factory',supplyToSite:false},
 };
}
