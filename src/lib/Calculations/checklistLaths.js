import {planPlasticsStock} from './plasticsIntegrationAudit';
// Separate use-group allowances for checking/packing. Summary retains pooled stock.
export function checklistLaths(externalRuns,internalRuns,stockM=4.8,extra=0){
 const length=Number(stockM)>0?Number(stockM):4.8;
 const rows=[['external','External tiling laths',externalRuns],['internal','Internal fixing laths',internalRuns]].map(([key,item,runs])=>({key:`loose_laths_${key}`,item:`${item} (${length}m)`,qty:planPlasticsStock(runs,length).qty,units:'Lengths'})).concat(Number(extra)>0?[{key:'loose_laths_extra',item:`Extra 25×50 laths (${length}m)`,qty:Number(extra),units:'Lengths'}]:[]).filter(r=>r.qty>0);
 let remove=Math.max(0,-Number(extra)||0);for(const row of rows){const take=Math.min(remove,row.qty);row.qty-=take;remove-=take;}
 return rows.filter(r=>r.qty>0);
}
