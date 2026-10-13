import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianTimberAudit} from './edwardianTimberAudit';
import {buildEdwardianInsulationAudit} from './edwardianInsulationAudit';
import {buildEdwardianTilingAudit} from './edwardianTilingAudit';
import {buildEdwardianPlasticsGutteringAudit} from './edwardianPlasticsGutteringAudit';
import {buildEdwardianMetalMiscAudit} from './edwardianMetalMiscAudit';
import {buildEdwardianLathReconciliation} from './edwardianLathReconciliation';
import {apportionInstalledWeight,coveringWeightRates} from './installedCoveringWeights';
import {getFixedProductWeightKg} from '../utils/weights';
const round=v=>Number(Number(v).toFixed(2));
const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const first=(...v)=>v.map(rate).find(n=>n!==null)??null;
export function buildEdwardianMaterialsReconciliation({inputs={},materials:m={}}={}){
 const geometry=buildEdwardianGeometry({inputs,materials:m}),productId=inputs.tileProductId??'britmetShingle';
 const timber=buildEdwardianTimberAudit({geometry,materials:m}),insulation=buildEdwardianInsulationAudit({geometry,materials:m}),tiling=buildEdwardianTilingAudit({geometry,materials:m,productId}),plastics=buildEdwardianPlasticsGutteringAudit({geometry,materials:m,plasticsColour:inputs.plasticsColour??'white',gutterProfile:inputs.gutterProfile??'square'}),metalMisc=buildEdwardianMetalMiscAudit({geometry,materials:m,productId}),laths=buildEdwardianLathReconciliation({geometry,materials:m,productId});
 const audits={geometry,timber,insulation,tiling,plastics,metalMisc,laths},errors=Object.values(audits).flatMap(a=>a.valid?[]:a.errors);
 if(errors.length)return {valid:false,readOnly:true,errors,sections:{},audits};
 if([insulation.pir50.sheets,insulation.pir100.sheets].some(q=>q==null))return {valid:false,readOnly:true,errors:['Valid PIR sheet dimensions and waste allowances are required.'],sections:{},audits};
 const sections=Object.fromEntries(['timber','tiles','plastics','metal','gutters','misc'].map(k=>[k,{lines:[]}]));
 const add=(section,key,label,qty,units,cost,weight,extra={})=>{
  const c=cost==null?null:round(cost),w=weight==null?null:round(weight);
  const row={key,label,qty,order_qty:qty,units,line:c??0,cost:c??0,weight_kg:w??0,price_unconfigured:c===null&&qty>0,weight_unconfigured:w===null&&qty>0,supplyToSite:true,...extra};sections[section].lines.push(row);return row;
 };
 timber.lines.filter(r=>!['outerLaths','finishingLaths'].includes(r.key)).forEach(r=>add('timber',`edwardian_${r.key}`,r.label,r.quantity,r.unit,r.cost,r.installedWeightKg,{supplyToSite:false,wastePercent:r.wastePercent}));
 add('timber','edwardian_laths','25×50 laths — all uses, pooled stock',laths.stockQty,'Lengths',laths.cost,laths.installedWeightKg,{used_m:laths.usedM,stock_length_m:laths.stockM,supplyToSite:false});
 const area=insulation.membrane.installedAreaM2;
 tiling.lines.filter(r=>!['starter','fieldLaths','supportLaths'].includes(r.key)).forEach(r=>{
  let weight=null;
  if(r.key==='main'){
   const kg=tiling.steel?first(m.tile_britmet_weight_kg,m.britmetShingle?.weight_kg_per_tile):first(m.liteslate_tile_weight_kg_each,m.liteslate_tile_weight_kg);
   const density=tiling.steel?first(m.tile_britmet_tiles_per_m2,3.2):null;
   // Different front pitch may place slate facets in different density bands.
   const slateAreaTiles=insulation.membrane.surface.facets.reduce((n,f)=>n+f.areaM2*(f.pitchDeg<25?22:f.pitchDeg<27.5?20:f.pitchDeg<30?19:18),0);
   weight=kg==null?null:kg*(tiling.steel?area*density:slateAreaTiles);
  }else if(r.key==='ridge'||r.key==='hips'){
   const kg=tiling.steel?getFixedProductWeightKg('hip_ridge'):first(m.liteslate_ridge_tile_weight_kg,m.ridge_tile_liteslate_weight_kg);weight=kg==null?null:r.quantity*kg;
  }else if(r.key==='hipEndCaps'){
   const kg=tiling.steel?getFixedProductWeightKg('hip_end_cap_90'):first(m.liteslate_hip_end_cap_weight_kg_each,m.liteslate_hip_end_cap_weight_kg);weight=kg==null?null:r.quantity*kg;
  }else if(r.key==='yAdaptor'){const kg=(tiling.steel?rate(m.britmet_y_adaptor_weight_kg):rate(m.liteslate_ridge_hip_adaptor_weight_kg));weight=kg==null?null:r.quantity*kg;}
  else if(r.key==='vents'){const kg=first(m.vent_strip_weight_kg,m.tile_vent_strip_weight_kg);weight=kg==null?null:r.quantity*kg;}
  else if(r.key==='tape')weight=tiling.support.tapeInstalledWeightKg;
  add(r.key==='tape'?'misc':'tiles',`edwardian_tile_${r.key}`,r.label,r.quantity,r.unit,r.cost,weight);
 });
 if(tiling.steel)add('tiles','edwardian_touchup','Steel tile touch-up kit',1,'Kit',first(m.touchup_kit_britmet_price_each,m.touchUpKitBritmet?.price_each),0,{requirement_basis:'Loose site kit, excluded from installed roof weight.'});
 const band=plastics.band,pa=plastics.plastics;
 plastics.plasticLines.forEach(r=>{
  if(r.key==='polytop_pins'){add('misc','polytop_pins',r.label,1,'50-pin allowance',r.cost,null);return;}
  let weight=null;
  if(r.key.startsWith('fascia-')){const width=Number(r.key.split('-')[1]),used=pa.fasciaPlan.boards.filter(b=>b.widthMM===width).reduce((n,b)=>n+b.pieces.reduce((s,p)=>s+p.lengthM,0),0),kg=rate(m[`fascia_weight_kg_per_m_${band}`]);weight=kg==null?null:used*kg;}
  else if(r.key.startsWith('soffit-')){const width=Number(r.key.split('-')[1]),used=pa.soffitPlan.boards.filter(b=>b.widthMM===width).reduce((n,b)=>n+b.strips.reduce((s,strip)=>s+strip.pieces.reduce((u,p)=>u+p.lengthM,0),0),0),kg=rate(m[`soffit_weight_kg_per_m_${band}`]);weight=kg==null?null:used*kg;}
  else if(r.key==='fascia_corners'||r.key==='fascia_joints'){const kg=rate(m[r.key==='fascia_corners'?'fascia_corner_weight_kg_each':'fascia_joint_weight_kg_each']);weight=kg==null?null:r.qty*kg;}
  else if(r.key==='j_trim'){const kg=rate(m[`j_section_weight_kg_each_${band}`]);weight=kg==null?null:pa.accessories.jRunM/pa.accessories.jStockM*kg;}
  else if(r.key==='factory_venting')weight=0;
  add('plastics',`edwardian_plastic_${r.key}`,r.label,r.qty,r.unit,r.cost,weight,{usage:r.key==='factory_venting'?'factory':'site',supplyToSite:r.key!=='factory_venting'});
 });
 const gutterKeys={g_union:['gutter_union_weight_kg','gutter_union_weight_kg_each'],g_brkt:['gutter_bracket_weight_kg','gutter_bracket_weight_kg_each'],g_corner_90:['gutter_corner_weight_kg','gutter_corner_weight_kg_each'],g_outlet:['gutter_outlet_weight_kg','running_outlet_weight_kg_each'],g_stop:['gutter_stop_end_weight_kg','stop_end_weight_kg_each'],dp_len:['dp_length_weight_kg_each','downpipe_length_weight_kg'],dp_bend:['downpipe_bend_weight_kg','dp_bend_weight_kg_each'],dp_clip:['downpipe_clip_weight_kg','dp_clip_weight_kg_each'],dp_shoe:['downpipe_shoe_weight_kg','dp_shoe_weight_kg_each'],dp_adaptor:['downpipe_adaptor_weight_kg','dp_adaptor_weight_kg_each','dp_adapt_weight_kg_each']};
 plastics.gutterLines.forEach(r=>{const kg=r.key==='g_len'?rate(m[`gutter_${inputs.gutterProfile??'square'}_weight_kg_per_m`]):first(...(gutterKeys[r.key]??[]).map(k=>m[k]));add('gutters',`edwardian_gutter_${r.key}`,r.label,r.qty,r.unit,r.cost,kg==null?null:kg*(r.key==='g_len'?plastics.guttering.totalRunM:r.qty));});
 metalMisc.metalRows.forEach(r=>add('metal',r.key,r.label,r.qty,r.unit,r.cost,r.installedWeightKg,{order_qty:r.orderQty??r.qty,usage:'installed',requirement_basis:r.basis,used_m:r.key==='tile_starter'?r.qty:undefined}));
 for(const [key,b] of [['pir50',insulation.pir50],['pir100',insulation.pir100]])add('misc',`edwardian_${key}`,key==='pir50'?'50mm PIR — cradles and ring-beam faces':'100mm PIR — to apex/ridge',b.sheets,'Sheets',b.cost,b.installedWeightKg,{used_m2:b.netAreaM2});
 const sq=insulation.superQuilt,covers=[sq.rolls12*12,sq.rolls15*15],weights=apportionInstalledWeight(sq.installedAreaM2,coveringWeightRates(m).superQuiltKgPerM2,covers);
 [12,15].forEach((size,i)=>{const qty=i?sq.rolls15:sq.rolls12;if(qty>0){const p=first(m[`superquilt_${size}m_price_each`],(m.superquilt_options??[]).find(o=>Number(o.coverage_m2)===size)?.price_per_roll);add('misc',`edwardian_sq_${size}`,`SuperQuilt — ${size}m² roll`,qty,'Rolls',p==null?null:qty*p,weights[i],{used_m2:sq.installedAreaM2*covers[i]/sq.coverageM2});}});
 add('misc','edwardian_membrane','Breather membrane — 50m² roll',insulation.membrane.rolls,'Rolls',insulation.membrane.cost,insulation.membrane.installedWeightKg,{used_m2:area});
 [...metalMisc.siteRows,...metalMisc.factoryRows].forEach(r=>add('misc',r.key,r.label,r.qty,r.unit,r.cost,r.installedWeightKg,{usage:r.usage,supplyToSite:r.usage!=='factory',requirement_basis:r.basis}));
 Object.values(sections).forEach(s=>{s.totals={cost:round(s.lines.reduce((n,r)=>n+r.line,0)),weight:round(s.lines.reduce((n,r)=>n+r.weight_kg,0))};});
 const all=Object.values(sections).flatMap(s=>s.lines),materialsCost=round(Object.values(sections).reduce((n,s)=>n+s.totals.cost,0)),materialsWeightKg=round(Object.values(sections).reduce((n,s)=>n+s.totals.weight,0)),plasterboardWeightKg=round(insulation.plasterboard.installedWeightKg);
 const missingPrices=all.filter(r=>r.price_unconfigured),missingWeights=all.filter(r=>r.weight_unconfigured),supplyReviews=insulation.membrane.coverageReview?['Membrane area exceeds the current one-roll allowance.']:[];
 return {valid:true,readOnly:true,errors:[],sections,audits,materialsCost,materialsWeightKg,plasterboardWeightKg,installedWeightKg:round(materialsWeightKg+plasterboardWeightKg),missingPrices,missingWeights,supplyReviews,pricingReady:missingPrices.length===0&&supplyReviews.length===0,notes:[
 'Six element subtotals sum to the reconciled materials total. Each line is rounded to pennies once before section sums.',
 'Tile starter is charged only in Metal. All field/support/internal/ring-beam laths are replaced by the pooled stock line in Timber; separate audit lath subtotals are excluded.',
 '50mm PIR cradles and ring-beam faces are pooled in one Miscellaneous sheet order. SuperQuilt and membrane each appear once. Hip foam tape appears once in Miscellaneous.',
 'Factory consumption is costed in Miscellaneous but excluded from loose site supplies. Installed fixing/consumable weights remain unconfigured rather than becoming full-box/tub weights.',
 'Plasterboard is not supplied or priced; its installed weight is added exactly once after materials weight.',
 'Main tile weight follows installed roof-face area, not purchased surplus or the two extra steel tiles. Existing plastic/gutter weight rates are retained.',
 'Missing prices remain explicit, including newly required accessories. The displayed subtotal is the known cost until these are configured.',
 'Read-only reconciliation: live quotation pricing, Summary, manufacture and Idiot List are not yet connected.'
 ]};
}
