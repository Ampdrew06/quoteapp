import {getSlatePitchRule} from './tileProductConfig';
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
// Installed covering only. Whole order rounding and spare tiles add cost,
// but not roof load. Each caller supplies its actual developed roof surfaces.
export function installedMainTileWeight({productId,facets,materials:m={}}) {
 const steel=['britmetShingle','metrotileShingle'].includes(productId),prefix={britmetShingle:'britmet',metrotileShingle:'metrotile',liteSlate:'liteslate',tapcoSlate:'tapco'}[productId];
 if(!prefix||!facets?.length)return null;
 const group=m[productId]||{},kg=rate(m[steel?`tile_${prefix}_weight_kg`:`${prefix}_tile_weight_kg_each`]??m[`${prefix}_tile_weight_kg`]??group.weight_kg_per_tile),density=steel?rate(m[`tile_${prefix}_tiles_per_m2`]??3.2):null;
 if(kg===null||steel&&density===null)return null;
 let units=0;
 for(const f of facets){const area=rate(f.areaM2),perM2=steel?density:getSlatePitchRule(productId,f.pitchDeg)?.slatesPerM2;if(area===null||!Number.isFinite(perM2))return null;units+=area*perM2;}
 return units*kg;
}
export function installedHipTileWeight({steel,edges,kgEach}) {
 const kg=rate(kgEach);if(!edges?.length)return 0;if(kg===null)return null;
 const units=edges.map(e=>steel?(e.allocationTiles??e.qty??e.tileQty):e.tileQty??e.qty);
 return units.some(v=>rate(v)===null)?null:units.reduce((n,v)=>n+Number(v),0)*kg;
}
export function fixedInstalledWeight(row,weightKg) {
 const weight=weightKg??0;
 return {...row,installedWeightFixed:true,weight_unconfigured:weightKg===null,
  weight_kg:weight,weightKg:weight,totalWeightKg:weight,total_weight_kg:weight,
  ...(weight===0?{weight_kg_each:0,weightEachKg:0,weightPerUnitKg:0}:{}),
  weightBasis:'Installed covering only; supply adjustments and exclusions retain roof weight.'};
}
