import {planPlasticsStock} from './plasticsIntegrationAudit';
import {buildEdwardianInternalLathAudit} from './edwardianInternalLathAudit';
import {buildSummaryIdiotList} from './summaryIdiotList';
export function buildEdwardianIdiotList(model,materials={}){
 const list=buildSummaryIdiotList(model,materials);if(!model.valid)return list;
 const members=model.audits.timber.memberAudit.members;
 list.sections.assemblies=[{key:'trusses',item:'Assembled trusses',qty:model.audits.geometry.layout.centresMM.length,units:'Ea'},{key:'ringbeams',item:'Ring-beams',qty:3,units:'Ea'},...['hip','boss-rafter','jack-rafter'].map(type=>({key:type,item:({'hip':'Hips','boss-rafter':'Boss rafter','jack-rafter':'Jack rafters'})[type],qty:members.filter(m=>type==='jack-rafter'?m.type.endsWith('-jack'):m.type===type).length,units:'Ea'}))].filter(r=>r.qty>0);
 const a=model.audits,g=a.geometry,runs=[];
 a.tiling.result.facets.forEach(f=>f.lathRows.forEach((r,n)=>runs.push({edgeId:f.facet.id+'-'+n,runM:r.widthMM/1000,widthMM:50})));
 if(a.tiling.steel)a.tiling.edges.forEach(e=>{for(const side of [1,2])runs.push({edgeId:e.id+'-'+side,runM:e.lengthMM/1000,widthMM:50});});
 buildEdwardianInternalLathAudit({geometry:g,materials}).rows.forEach(r=>runs.push({edgeId:'internal-'+r.id,runM:r.lengthMM/1000,widthMM:50}));
 const looseQty=planPlasticsStock(runs,a.laths.stockM).qty+Number(model.quantityAdjustments?.edwardian_laths||0);
 list.sections.laths=[{key:'edwardian_laths',item:'Loose 25×50 laths',qty:Math.max(0,looseQty),units:'Lengths'}].filter(r=>r.qty>0);
 list.sections.timber=(list.sections.timber||[]).filter(r=>r.key!=='edwardian_laths'||r.isAddedItem);
 const fitted=['boss_rafter_terminal','spar_hook','jack_rafter_hooks','jack_rafter_brackets'];
 list.sections.metal=(list.sections.metal||[]).flatMap(r=>{
   if(r.isAddedItem||!fitted.includes(r.key))return [r];
   const delta=Number(model.quantityAdjustments?.[r.key]||0);
   return delta>0?[{...r,qty:delta,item:r.item+' — extra, supplied loose'}]:[];
 });
 list.sections.misc=(list.sections.misc||[]).filter(r=>r.key!=='edwardian_pir50'||r.isAddedItem);
 const extraPir=Number(model.quantityAdjustments?.edwardian_pir50||0);
 if(extraPir>0)list.sections.misc.push({key:'edwardian_pir50',item:'Extra 50mm PIR — supplied loose',qty:extraPir,units:'Sheets'});
 list.sections.misc.push({key:'plasterboard_guide',item:'Plasterboard 2400 × 1200mm — NOT SUPPLIED (customer to purchase)',qty:Math.ceil(a.insulation.ceiling.areaM2/2.88),units:'Sheets',informational:true});
 for(const rows of Object.values(list.sections))for(const row of rows){
   if(row.key==='polytop_pins')row.displayQty=String(Number((row.qty*50).toFixed(3)));
   if(row.key==='edwardian_tile_tape')row.units=row.qty===1?'Roll':'Rolls';
   if(row.key==='alu_roll_tape')row.units=row.qty===1?'Roll':'Rolls';
   if(row.key==='edwardian_gutter_g_len')row.units='×4m';
   if(row.key==='edwardian_gutter_dp_len')row.units='Ea';
   if(row.key==='plasterboard_guide')row.item='Plasterboard 2400×1200mm — NOT SUPPLIED';
 }
 list.despatchOnly=true;
 return list;
}
