import {buildGableSummaryMaterialsModel} from './Calculations/gableSummaryMaterialsModel';
import {buildEdwardianSummaryMaterialsModel} from './Calculations/edwardianSummaryMaterialsModel';
import {buildVictorianSummaryMaterialsModel} from './Calculations/victorianSummaryMaterialsModel';
import {buildVictorianFiveSummaryMaterialsModel} from './Calculations/victorianFiveQuotation';
import {buildCombinationSummaryMaterialsModel} from './Calculations/combinationQuotation';
// Explicit draft import from the saved design and its saved material settings.
// Never regenerate an existing checklist automatically or use today's prices.
export function importPurchaseDraft(job){
 const builders={gable:buildGableSummaryMaterialsModel,edwardian:buildEdwardianSummaryMaterialsModel,victorian:buildVictorianSummaryMaterialsModel,'victorian-five':buildVictorianFiveSummaryMaterialsModel,combination:buildCombinationSummaryMaterialsModel};
 const inputs=job?.inputs_json||{},builder=builders[inputs.roofStyle||job?.roof_style];
 if(!builder||!job?.materials_snapshot_json)return {error:'Automatic draft is unavailable for this saved roof. Enter requirements manually.'};
 const model=builder({inputs,materials:job.materials_snapshot_json});
 if(!model.valid)return {error:'The saved material model cannot be resolved. Enter requirements manually.'};
 const items=[];
 for(const [section,data] of Object.entries(model.sections||{}))for(const r of data.lines||[]){
  if(r.excluded||r.usage==='factory'||r.price_unconfigured&&r.qty==null)continue;
  const label=String(r.label||r.name||''),qty=r.order_qty??r.qty;
  const group=section==='timber'?(/joist|9mm|18mm|plywood|ply/i.test(label)?'Timber':null):section==='gutters'?'Gutters':section==='plastics'?'Plastics':section==='metal'?'Metal items':/PIR|SuperQuilt|insulation/i.test(label)?'Insulation':/foam|membrane|rubber|deck adhesive|bond adhesive/i.test(label)?'Miscellaneous':null;
  if(!group||!(Number(qty)>0))continue;
  items.push({id:'source-'+items.length,group,description:label,specification:'',qty:String(qty),unit:typeof r.units==='string'?r.units:typeof r.unit==='string'?r.unit:'each',status:'needed'});
 }
 // Manufactured timber is commonly marked factory-fitted: use its raw purchase
 // allowance only where present, without duplicating the above source key.
 const timber=model.sections?.timber?.lines||[];
 for(const r of timber){if(!r.excluded&&/I-joist|9mm.*ply|18mm.*ply/i.test(String(r.label))&&Number(r.order_qty??r.qty)>0&&!items.some(i=>i.description===r.label))items.push({id:'source-'+items.length,group:'Timber',description:r.label,specification:'Check stock lengths / sheet conversion',qty:String(r.order_qty??r.qty),unit:typeof r.units==='string'?r.units:'m',status:'needed'});}
 if(!items.length)return {error:'No suitable purchasing lines found. Enter requirements manually.'};
 return {items};
}
