import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTimberAudit} from './gableTimberAudit';
import {buildGableInsulationAudit} from './gableInsulationAudit';
import {buildGableTilingAudit} from './gableTilingAudit';
import {buildGablePlasticsGutteringAudit} from './gablePlasticsGutteringAudit';
import {buildGableLathMembraneAudit} from './gableLathMembraneAudit';
import {buildGableMiscellaneousAudit} from './gableMiscellaneousAudit';
import {buildSummaryAddedItemLines} from './summaryAddedItems';
import {apportionInstalledWeight,coveringWeightRates} from './installedCoveringWeights';
const round=v=>Number(Number(v).toFixed(2));
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const first=(...values)=>values.map(rate).find(v=>v!==null)??null;
export function buildGableSummaryMaterialsModel({inputs={},materials:m={},exclusions=inputs.summaryPricingState?.exclusions||{},adjustments=inputs.summaryPricingState?.adjustments||{},addedItems=inputs.summaryAddedItems||[]}={}) {
 const resolved={...inputs,rightSoffitMM:inputs.separateSideSoffits?inputs.rightSoffitMM:inputs.leftSoffitMM};
 const geometry=buildGableGeometry({inputs:resolved,materials:m});
 const timber=buildGableTimberAudit({geometry,materials:m});
 const insulation=buildGableInsulationAudit({geometry,timberAudit:timber,materials:m});
 const tiling=buildGableTilingAudit({geometry,materials:m,productId:inputs.tileProductId||'britmetShingle'});
 const plastics=buildGablePlasticsGutteringAudit({geometry,materials:m,plasticsColour:inputs.plasticsColour||'white',gutterProfile:inputs.gutterProfile||'square'});
 const laths=buildGableLathMembraneAudit({geometry,timberAudit:timber,insulationAudit:insulation,tilingAudit:tiling,materials:m});
 const misc=buildGableMiscellaneousAudit({geometry,tilingAudit:tiling,lathAudit:laths,materials:m});
 const audits={geometry,timber,insulation,tiling,plastics,laths,misc};
 const errors=Object.values(audits).flatMap(a=>a.valid?[]:a.errors||['A Gable requirement is unavailable.']);
 if(errors.length)return {valid:false,errors,sections:{},audits,materialsCostForPricing:0};
 const sections=Object.fromEntries(['timber','tiles','plastics','metal','gutters','misc'].map(k=>[k,{lines:[]}]));
 const add=(section,key,label,qty,units,cost,weight,extra={})=>{
  const c=cost==null?null:round(cost),w=weight==null?null:round(weight);
  const row={key,_k:key,label,qty,order_qty:qty,units,unit:qty?(c??0)/qty:0,unitPrice:qty?(c??0)/qty:0,
   line:c??0,total:c??0,cost:c??0,totalCost:c??0,weight_kg:w??0,totalWeightKg:w??0,total_weight_kg:w??0,
   price_unconfigured:c===null&&qty>0,weight_unconfigured:w===null&&qty>0,supplyToSite:true,...extra};
  sections[section].lines.push(row);return row;
 };
 // Source timber audit already includes configured waste. PIR and all laths are pooled below.
 for(const row of timber.lines.filter(r=>!['outerLaths','finishingLaths','upstandPir'].includes(r.key)))
  add('timber','gable_'+row.key,row.label,row.quantity,row.unit,row.cost,row.installedWeightKg,{used_qty:row.quantity,wastePercent:row.wastePercent,supplyToSite:false});
 const lathPrice=first(m.lath25x50?.price_per_m,m.chamferLath?.price_per_m);
 add('timber','gable_laths','25×50 laths — all uses, pooled stock',laths.knownStockLengths,'Lengths',lathPrice==null?null:laths.knownStockLengths*laths.stockM*lathPrice,
  rate(m.chamferLath?.weight_kg_per_m)==null?null:laths.knownLathM*Number(m.chamferLath.weight_kg_per_m),{used_m:laths.knownLathM,stock_length_m:laths.stockM,requirement_basis:'Purchased stock cost; installed metres for weight. No second waste uplift.'});
 const area=insulation.membrane.installedAreaM2;
 for(const row of tiling.lines.filter(r=>r.key!=='ridgeLaths')){
  const qty=row.quantity;
  let weight=null;
  if(row.key==='main'){
   const kg=tiling.steel?first(m.tile_britmet_weight_kg,m.britmetShingle?.weight_kg_per_tile):first(m.liteslate_tile_weight_kg_each,m.liteslate_tile_weight_kg);
   const perM2=tiling.steel?first(m.tile_britmet_tiles_per_m2,3.2):(geometry.pitchDeg<25?22:geometry.pitchDeg<27.5?20:geometry.pitchDeg<30?19:18);
   weight=kg==null?null:area*perM2*kg;
  }else if(row.key==='ridge'){
   const kg=tiling.steel?first(m.britmet_ridge_tile_weight_kg,m.ridge_tile_britmet_weight_kg):first(m.liteslate_ridge_tile_weight_kg,m.ridge_tile_liteslate_weight_kg);
   weight=kg==null?null:qty*kg;
  }else if(row.key==='starter'){
   const kg=first(m.tile_starter_weight_kg_each,m.metal?.tile_starter?.weight_kg_each,m.eaves_guard_weight_kg);
   weight=kg==null?null:2*tiling.ridgeMM/3000*kg;
  }else if(row.key==='verge'){
   const kg=tiling.steel?first(m.verge_trim_weight_kg,m.vergeTrim2Part?.weight_kg_per_piece):first(m.liteslate_dry_verge_weight_kg_each,m.liteslate_dry_verge_weight_kg);
   const coverage=tiling.steel?Number(m.verge_trim_piece_cover_mm??1150):2000;
   weight=kg==null?null:tiling.facets.reduce((s,f)=>s+f.heightMM,0)/coverage*kg;
  }else if(row.key==='vents'){
   const kg=first(m.vent_strip_weight_kg,m.tile_vent_strip_weight_kg);weight=kg==null?null:qty*kg;
  }else if(row.key==='endCap'){
   const kg=first(m.britmet_gable_end_cap_weight_kg,m.gable_end_cap_weight_kg);weight=kg==null?null:qty*kg;
  }
  add(row.key==='starter'?'metal':'tiles','gable_tile_'+row.key,row.label,qty,row.unit,row.cost,weight,{used_m:row.key==='starter'?2*tiling.ridgeMM/1000:undefined});
 }
 if(tiling.steel){
  const price=first(m.touchup_kit_britmet_price_each,m.touchUpKitBritmet?.price_each);
  add('tiles','gable_touchup','Steel tile touch-up kit',1,'Kit',price,0,{weight_unconfigured:false,requirement_basis:'Loose site kit; excluded from installed roof weight.'});
 }
 const band=plastics.band,fasciaKg=rate(m['fascia_weight_kg_per_m_'+band]),soffitKg=rate(m['soffit_weight_kg_per_m_'+band]);
 for(const row of plastics.plasticLines){
  if(row.key==='pins') {add('misc','polytop_pins',row.label,row.qty,row.unit,row.cost,null);continue;}
  let weight=null;
  if(row.key.startsWith('fascia-')){
   const width=Number(row.key.split('-')[1]);const used=plastics.fasciaPlan.boards.filter(b=>b.widthMM===width).reduce((s,b)=>s+b.pieces.reduce((t,p)=>t+p.lengthM,0),0);
   weight=fasciaKg==null?null:used*fasciaKg;
  }else if(row.key.startsWith('soffit-')){
   const width=Number(row.key.split('-')[1]);const used=plastics.soffitPlan.boards.filter(b=>b.widthMM===width).reduce((s,b)=>s+b.strips.reduce((t,strip)=>t+strip.pieces.reduce((u,p)=>u+p.lengthM,0),0),0);
   weight=soffitKg==null?null:used*soffitKg;
  }else if(row.key==='corners'||row.key==='joints'){
   const kg=rate(m[row.key==='corners'?'fascia_corner_weight_kg_each':'fascia_joint_weight_kg_each']);weight=kg==null?null:row.qty*kg;
  }else if(row.key==='jTrim'){
   const kg=rate(m['j_section_weight_kg_each_'+band]);weight=kg==null?null:plastics.jRunM/5*kg;
  }else if(row.key==='venting')weight=0;
  add('plastics','gable_plastic_'+row.key,row.label,row.qty,row.unit,row.cost,weight,{usage:row.key==='venting'?'factory':'site',supplyToSite:row.key!=='venting'});
 }
 const gutterWeightKeys={unions:['gutter_union_weight_kg','gutter_union_weight_kg_each'],brackets:['gutter_bracket_weight_kg','gutter_bracket_weight_kg_each'],outlets:['gutter_outlet_weight_kg','running_outlet_weight_kg_each'],stopEnds:['gutter_stop_end_weight_kg','stop_end_weight_kg_each'],pipes:['dp_length_weight_kg_each','downpipe_length_weight_kg'],offsetBends:['downpipe_bend_weight_kg','dp_bend_weight_kg_each'],clips:['downpipe_clip_weight_kg','dp_clip_weight_kg_each'],shoes:['downpipe_shoe_weight_kg','dp_shoe_weight_kg_each'],adaptors:['downpipe_adaptor_weight_kg','dp_adaptor_weight_kg_each','dp_adapt_weight_kg_each']};
 for(const row of plastics.gutterLines){
  const kg=row.key==='lengths'?rate(m['gutter_'+(inputs.gutterProfile||'square')+'_weight_kg_per_m']):first(...(gutterWeightKeys[row.key]||[]).map(k=>m[k]));
  const used=row.key==='lengths'?2*tiling.ridgeMM/1000:row.qty;
  add('gutters','gable_gutter_'+row.key,row.label,row.qty,row.unit,row.cost,kg==null?null:used*kg);
 }
 for(const [key,board] of [['pir50',insulation.pir50],['pir100',insulation.pir100]])
  add('misc','gable_'+key,key==='pir50'?'50mm PIR — cradles and ring-beam faces':'100mm PIR — between trusses to apex',board.sheets,'Sheets',board.cost,board.installedWeightKg,{used_m2:board.netAreaM2});
 const sq=insulation.superQuilt,covers=[sq.rolls12*12,sq.rolls15*15];
 const weights=apportionInstalledWeight(sq.installedAreaM2,coveringWeightRates(m).superQuiltKgPerM2,covers);
 [12,15].forEach((size,n)=>{const qty=n?sq.rolls15:sq.rolls12;if(qty>0){const p=first(m['superquilt_'+size+'m_price_each'],(m.superquilt_options||[]).find(o=>Number(o.coverage_m2)===size)?.price_per_roll);add('misc','gable_sq_'+size,'SuperQuilt — '+size+'m² roll',qty,'Rolls',p==null?null:qty*p,weights[n],{used_m2:sq.installedAreaM2*covers[n]/sq.coverageM2});}});
 add('misc','gable_membrane','Breather membrane — 50m² roll',insulation.membrane.rolls,'Rolls',insulation.membrane.cost,insulation.membrane.installedWeightKg,{used_m2:area});
 for(const row of [...misc.siteRows,...misc.factoryRows])add('misc',row.key,row.label,row.qty,row.unit,row.cost,row.installedWeightKg,{usage:row.usage,supplyToSite:row.usage!=='factory',requirement_basis:row.basis});
 const extras=buildSummaryAddedItemLines(addedItems,m);
 for(const row of extras)sections[row.section].lines.push({...row,weight_unconfigured:false});
 for(const section of Object.values(sections)){
  section.lines=section.lines.map(row=>{
   if(row.isAddedItem)return {...row,excluded:!!row.extraExcluded};
   const delta=Number(adjustments[row.key]);const qty=Math.max(0,row.qty+(Number.isFinite(delta)?delta:0));
   return {...row,qty,order_qty:qty,line:round(qty*row.unitPrice),total:round(qty*row.unitPrice),cost:round(qty*row.unitPrice),totalCost:round(qty*row.unitPrice),excluded:!!exclusions[row.key]};
  });
  // Supply extras and +/- changes do not change the roof's installed geometry or weight.
  const cost=round(section.lines.reduce((s,r)=>s+(r.excluded?0:r.line),0));
  section.totals={cost,chargeableCost:cost,weight:round(section.lines.reduce((s,r)=>s+r.weight_kg,0))};
 }
 const pricingSections=Object.fromEntries(Object.entries(sections).map(([k,s])=>[k,s.totals.cost]));
 const materialsCostForPricing=round(Object.values(pricingSections).reduce((s,v)=>s+v,0));
 const missingPrices=Object.values(sections).flatMap(s=>s.lines).filter(r=>r.qty>0&&!r.excluded&&r.price_unconfigured);
 const supplyReviews=[];
 const membraneLine=sections.misc.lines.find(r=>r.key==='gable_membrane');
 if((membraneLine?.qty??0)*50+1e-9<area)supplyReviews.push('Membrane area exceeds supplied roll coverage. Increase the roll quantity in Summary.');
 const missingWeights=Object.values(sections).flatMap(s=>s.lines).filter(r=>r.weight_unconfigured&&!r.isAddedItem);
 const materialsWeightKg=round(Object.values(sections).reduce((s,v)=>s+v.totals.weight,0));
 const plasterboardWeightKg=round(insulation.plasterboard.installedWeightKg);
 return {valid:true,errors:[],sections,pricingSections,materialsCostForPricing,materialsBaseCost:materialsCostForPricing,
  materialsWeightKg,plasterboardWeightKg,installedWeightKg:round(materialsWeightKg+plasterboardWeightKg),
  missingPrices,missingWeights,supplyReviews,pricingReady:missingPrices.length===0&&supplyReviews.length===0,audits,quantityAdjustments:adjustments,
  plasterboard:insulation.plasterboard,notes:['Timber audit waste is already included. All 25×50 uses are pooled into purchased stock; PIR50 is pooled once.','Plasterboard weight is included once; boards are not supplied. Extras and quantity overrides affect supply and cost, not installed geometry.','Rear wall packers remain covered by the existing practical ply/waste allowance; no detailed packer cut list is claimed.','Installed tile weight is an area-based estimate; surplus and the two extra steel tiles are excluded. Box-end and unconfigured consumable weights remain outside the known weight.']};
}
