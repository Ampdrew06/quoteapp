import {buildVictorianHippedGeometry} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedMemberSchedule} from '../Manufacturing/victorianHippedMemberSchedule';
import {buildVictorianHippedWallplateSchedule} from '../Manufacturing/victorianHippedWallplateSchedule';
import {buildVictorianHippedRingBeamProfiles} from '../Manufacturing/victorianHippedRingBeamProfiles';
import {buildVictorianHippedCoveringAudit} from './victorianHippedCoveringAudit';
import {buildHippedWallplateIntegrationAudit} from './wallplateIntegrationAudit';
const rate=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
export function buildVictorianHippedTimberSummary({inputs={},materials:m={}}={}){
 const geometry=buildVictorianHippedGeometry({inputs,materials:m}),members=buildVictorianHippedMemberSchedule({geometry,inputs,materials:m}),wallplate=buildVictorianHippedWallplateSchedule({geometry,materials:m}),ring=buildVictorianHippedRingBeamProfiles({geometry,inputs});
 if(!geometry.valid||!members.valid||!wallplate.valid||!ring.valid)return {valid:false,errors:[...new Set([...(geometry.errors||[]),...(members.errors||[]),...(wallplate.errors||[]),...(ring.errors||[])])],rows:[],pricingReady:false};
 const joists=[...members.members,...wallplate.wallbars,{ref:wallplate.horizontal.ref,type:'Horizontal wallplate',topEdgeMM:wallplate.horizontal.topEdgeMM,bottomEdgeMM:wallplate.horizontal.bottomEdgeMM}].map(p=>({reference:p.ref,type:p.type||'Sloping wallbar',lengthMM:Math.max(p.topEdgeMM,p.bottomEdgeMM)}));
 // Use the physical assembly lengths, not the front plan width, for the established wallplate allowances.
 const wallplateMaterials=buildHippedWallplateIntegrationAudit({geometry:{
  horizontalWallplateExternalLengthMM:wallplate.horizontal.topEdgeMM,
  leftExternalWallBarSlopeMM:wallplate.wallbars.find(p=>p.side==='left')?.topEdgeMM??0,
  rightExternalWallBarSlopeMM:wallplate.wallbars.find(p=>p.side==='right')?.topEdgeMM??0,
 },currentSummaryExternalWidthMM:geometry.widthMM});
 if(!wallplateMaterials.valid)return {valid:false,errors:['Wallplate material allowances could not be resolved.'],rows:[],pricingReady:false};
 const covering=buildVictorianHippedCoveringAudit({geometry,materials:m,productId:inputs.tileProductId||'britmetShingle'});
 if(!covering.valid)return {valid:false,errors:covering.errors,rows:[],pricingReady:false};
 const state=inputs.victorianHippedTimberSummary||{},adjustments=state.adjustments||{},exclusions=state.exclusions||{},rows=[];
 const add=(key,label,netQty,units,config,price,weight,stock,basis)=>{
  const wastePct=rate(config?.waste_percent??config?.waste_pct??m.global_waste_percent??10),unitPrice=rate(price),unitWeight=rate(weight),rawDelta=Number(adjustments[key]??0),delta=Number.isFinite(rawDelta)?rawDelta:0;
  const suppliedQty=wastePct===null?null:Math.max(0,netQty*(1+wastePct/100)+delta),cost=suppliedQty===null||unitPrice===null?null:round(suppliedQty*unitPrice),installedWeight=unitWeight===null?null:netQty*unitWeight,excluded=!!exclusions[key];
  rows.push({key,label,qty:suppliedQty,netQty,units,stockSize:rate(stock),wastePct,unitPrice,unitWeight,cost:cost??0,chargeableCost:excluded?0:cost??0,weightKg:installedWeight,weightText:installedWeight===null?'Unconfigured':installedWeight.toFixed(2)+' kg',priceMissing:cost===null&&suppliedQty!==0,excluded,adjustment:adjustments[key]??'',adjustmentUnit:units,qtyBasis:`Net ${netQty.toFixed(3)} ${units}; ${wastePct??'unconfigured'}% waste, then supplied-quantity adjustment.`,basis});
 };
 add('vh_joists','220 i-joist — hips, rafters, wallbars and wallplate',joists.reduce((s,p)=>s+p.lengthMM/1000,0),'m',m.steico,m.steico?.price_per_m,m.steico?.weight_kg_per_m,m.steico?.stock_len_m,'Each roof member, fixed wall-side rafter, sloping wallbar and horizontal wallplate counted once; longer cutting edge per piece.');
 add('vh_pse','30×95 PSE — ringbeam runs',ring.totals.pseLengthM,'m',m.pse30x90,m.ringbeam_pse90x30_per_m??m.pse30x90?.price_per_m,m.pse30x90?.weight_kg_per_m,m.pse30x90?.stock_len_m,'Actual selected-joint PSE blank spans, once per ringbeam.');
 const sheet=Number(m.ply9mm?.sheet_len_m??2.4)*Number(m.ply9mm?.sheet_width_m??1.2);
 add('vh_bases','9mm ply — ringbeam bases',ring.totals.plyBaseAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,sheet,'Net area of the selected joint-method polygons.');
 add('vh_upstands','9mm ply — ringbeam upstands',ring.totals.upstandAreaM2,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,sheet,`${ring.totals.upstands} actual clear-bay cuts at ${ring.upstandHeightMM}mm height.`);
 add('vh_outer_laths','25×50 laths — ringbeam fixing only',ring.totals.outerLathLengthM,'m',m.chamferLath,m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'Selected-joint blank span of each outer ringbeam fixing lath. External covering and hip laths are separate rows.');
 add('vh_finishing_laths','25×50 laths — upstand finishing only',ring.totals.finishingLathLengthM,'m',m.chamferLath,m.lathFinish?.price_per_m??m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'Sum of the finishing lath over the actual upstand bays.');
 add('vh_wallplate_ply9','9mm ply — wallplate faceplates and packers',wallplateMaterials.ply9.manufacture,'m²',m.ply9mm,m.ply9mm?.price_per_m2,m.ply9mm?.weight_kg_per_m2,sheet,`Regular hipped wallplate allowances: front cover at 220mm depth, 350mm cover onto each active wallbar; rear joint covers and ${wallplateMaterials.ply9.rearPackerCount} packers, 75×220mm, at up to 800mm spacing.`);
 const sheet18=Number(m.ply18mm?.sheet_len_m??2.4)*Number(m.ply18mm?.sheet_width_m??1.2);
 add('vh_wallplate_ply18','18mm ply — wallplate infill and joint chevrons',wallplateMaterials.ply18.manufacture,'m²',m.ply18mm,m.ply18mm?.price_per_m2,m.ply18mm?.weight_kg_per_m2,sheet18,`143mm web-height infill along WP1 plus ${wallplateMaterials.ply18.chevronCount} joint chevron blanks, 600×143mm. Established workshop allowances; verify during factory trial.`);
 add('vh_field_laths','25×50 laths — external tile fixing',covering.fieldM,'m',m.chamferLath,m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'Actual developed-facet lath widths using the shared tile set-out; excludes chamfered perimeter rows.');
 add('vh_chamfer_laths','Chamfered eaves laths',covering.chamferM,'m',m.chamferLath,m.chamferLath?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'One chamfered perimeter row per eaves facet, counted separately from ringbeam fixing laths.');
 add('vh_internal_laths','25×50 laths — internal ceiling',covering.internalM,'m',m.chamferLath,m.lath25x50?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'Internal slope intersections at up to 400mm centres, including boundary rows; no ridge flat. Review factory fixing positions.');
 add('vh_hip_laths','25×50 laths — steel hip supports',covering.hipSupportM,'m',m.chamferLath,m.chamferLath?.price_per_m,m.chamferLath?.weight_kg_per_m,m.lath_stock_length_m,'Two full covering-length runs per steel hip, including boss region and eaves extension; none for slate.');
 for(const row of rows){row.orderQty=row.stockSize>0&&row.qty!==null?Math.ceil(row.qty/row.stockSize-1e-9):'Unconfigured';row.orderBasis=`Whole-stock allowance using ${row.stockSize??'unconfigured'} ${row.units} stock; not a cutting optimisation.`;}
 for(const keys of [['vh_bases','vh_upstands','vh_wallplate_ply9'],['vh_outer_laths','vh_finishing_laths','vh_field_laths','vh_chamfer_laths','vh_internal_laths','vh_hip_laths']]){
  const group=keys.map(key=>rows.find(r=>r.key===key)),a=group[0];
  a.orderQty=a.stockSize>0&&group.every(r=>r.qty!==null)?Math.ceil(group.reduce((sum,r)=>sum+r.qty,0)/a.stockSize-1e-9):'Unconfigured';
  a.orderBasis='Whole-stock allowance pooled across '+group.map(r=>r.label).join('; ')+'. Not a cutting optimisation.';
  for(const row of group.slice(1)){row.orderQty='Shared';row.orderBasis='Uses the pooled stock allowance shown on '+a.label+'.';}
 }
 const missingPrices=rows.filter(r=>r.priceMissing&&!r.excluded),knownSubtotal=round(rows.reduce((s,r)=>s+r.chargeableCost,0)),weight=round(rows.reduce((s,r)=>s+(r.weightKg??0),0));
 return {valid:true,errors:[],geometry,members,wallplate,wallplateMaterials,covering,ring,joists,rows,partial:true,pricingReady:false,materialsCostForPricing:null,missingPrices,totals:{cost:knownSubtotal,chargeableCost:knownSubtotal,weight},notes:['The integrated timber rows are not a complete roof cost or installed roof weight.','Quantities include the Materials waste allowance once. Cost uses the configured metre/area rate; whole-stock counts are informational and do not add a second charge.','Exclusions and supplied-quantity changes retain the geometry-based installed weight.','Main and hip tile quantities are shown for review; tile pricing/accessories, plastics, metalwork, guttering, insulation and fixings remain to be integrated.','Cut lengths remain subject to the planned factory comparison.']};
}
