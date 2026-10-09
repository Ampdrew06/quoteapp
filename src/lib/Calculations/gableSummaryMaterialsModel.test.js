jest.mock('../supabaseClient',()=>({supabase:{}}));
import {buildGableSummaryMaterialsModel} from './gableSummaryMaterialsModel';
import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {buildGableQuotation,buildGableQuoteRecord,isGableQuote} from './gableQuotation';
import {buildSummaryIdiotList} from './summaryIdiotList';
import {defaultMaterials} from '../materials';
const inputs={roofStyle:'gable',widthMM:3800,projMM:4100,pitchDeg:25,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,tileProductId:'britmetShingle',plasticsColour:'white',gutterProfile:'square',selectedCustomerId:'retail',customerReference:'Gable test'};
const materials={...defaultMaterials,truss_closure_45x45_price_per_m:0.5,truss_closure_45x45_weight_kg_per_m:0.4,gable_box_end_400x1000_white_price:20,gable_box_end_400x1000_foiled_price:40,concrete_screws_price_per_box:19.61,d4_glue_price_per_tub:6.49,
 gutter_square_corner_90_ext_price:3.05};
const build=(extra={})=>buildGableSummaryMaterialsModel({inputs,materials,...extra});
const row=(m,section,key)=>m.sections[section].lines.find(r=>r.key===key);
const round=n=>Number(n.toFixed(2));
test('Gable integrates each source once and prices pooled lath stock rather than duplicate audit subtotals',()=>{
 const m=build();expect(m.valid).toBe(true);expect(m.pricingReady).toBe(true);
 expect(row(m,'timber','gable_laths').qty).toBe(40);
 expect(row(m,'timber','gable_laths').line).toBe(round(40*4.8*materials.lath25x50.price_per_m));
 expect(m.sections.timber.lines.some(r=>['gable_outerLaths','gable_finishingLaths','gable_upstandPir'].includes(r.key))).toBe(false);
 expect(row(m,'misc','gable_pir50').qty).toBe(m.audits.insulation.pir50.sheets);
 expect(row(m,'misc','gable_pir100').qty).toBe(m.audits.insulation.pir100.sheets);
 expect(row(m,'tiles','gable_tile_main').qty).toBe(74);
 expect(row(m,'metal','gable_tile_starter').qty).toBe(3);
 expect(row(m,'misc','factory_staples_32mm').qty).toBe(493);
 expect(m.sections.misc.lines.filter(r=>r.key==='d4_glue')).toHaveLength(1);
 expect(row(m,'misc','concrete_screws').qty).toBe(8);expect(row(m,'misc','concrete_screws').line).toBe(1.57);
});
test('all six displayed subtotals are the single pricing total without another timber waste uplift',()=>{
 const m=build();expect(Object.keys(m.sections)).toEqual(['timber','tiles','plastics','metal','gutters','misc']);
 expect(m.materialsCostForPricing).toBe(round(Object.values(m.sections).reduce((s,v)=>s+v.totals.cost,0)));
 expect(row(m,'timber','gable_joists').line).toBe(round(m.audits.timber.lines.find(r=>r.key==='joists').cost));
 expect(buildSummaryMaterialsModel({inputs,materials}).pricingSections).toEqual(m.pricingSections);
});
test('plasterboard weight is included once and supply changes and exclusions preserve installed weight',()=>{
 const m=build(),altered=build({adjustments:{concrete_screws:2,gable_tile_main:2},exclusions:{gable_gutter_pipes:true}});
 expect(altered.installedWeightKg).toBe(m.installedWeightKg);
 expect(m.installedWeightKg).toBe(round(m.materialsWeightKg+m.plasterboardWeightKg));
 expect(m.sections.misc.lines.some(r=>r.key.includes('plasterboard'))).toBe(false);
 expect(row(altered,'misc','concrete_screws').qty).toBe(10);
 expect(row(altered,'misc','concrete_screws').line).toBe(1.96);
 expect(altered.pricingSections.gutters).toBe(round(m.pricingSections.gutters-row(m,'gutters','gable_gutter_pipes').line));
});
test('extras use the shared catalog, persist with the draft and are charged once',()=>{
 const extra={section:'gutters',catalogId:'square_corner90',qty:2};
 const m=build(),added=build({inputs:{...inputs,summaryAddedItems:[extra]}});
 expect(round(added.materialsCostForPricing-m.materialsCostForPricing)).toBe(6.1);
 expect(added.installedWeightKg).toBe(m.installedWeightKg);
 const excluded=build({addedItems:[{...extra,excluded:true}]});expect(excluded.materialsCostForPricing).toBe(m.materialsCostForPricing);
 expect(excluded.sections.gutters.lines.find(r=>r.isAddedItem).qty).toBe(2);
 const saved=JSON.parse(JSON.stringify({...inputs,summaryAddedItems:[extra],summaryPricingState:{adjustments:{concrete_screws:1},exclusions:{gable_tile_ridge:true}}}));
 const reloaded=build({inputs:saved});expect(row(reloaded,'misc','concrete_screws').qty).toBe(9);expect(row(reloaded,'tiles','gable_tile_ridge').excluded).toBe(true);
});
test('steel and slate retain their audited ordering and round gutter removes adaptors',()=>{
 const m=build({inputs:{...inputs,tileProductId:'liteSlate',gutterProfile:'round'}});
 expect(row(m,'tiles','gable_tile_main').qty).toBe(480);expect(row(m,'tiles','gable_tile_ridge').qty).toBe(24);
 expect(row(m,'timber','gable_laths').qty).toBe(50);
 expect(m.sections.tiles.lines.some(r=>r.key==='gable_tile_endCap')).toBe(false);
 expect(m.sections.gutters.lines.some(r=>r.key==='gable_gutter_adaptors')).toBe(false);
});
test('missing active prices block quotations while explicit zero and price exclusion are respected',()=>{
 const missing={...materials,gable_box_end_400x1000_white_price:null};
 expect(build({materials:missing}).pricingReady).toBe(false);
 expect(build({materials:{...missing,gable_box_end_400x1000_white_price:0}}).pricingReady).toBe(true);
 expect(build({materials:missing,exclusions:{gable_plastic_boxEnd:true}}).pricingReady).toBe(true);
 expect(build({inputs:{...inputs,widthMM:0}}).valid).toBe(false);
});
const quote=(extra={})=>buildGableQuotation({inputs,materials,labourConfig:{dayRate:300},markupConfig:{profitPct:50},...extra});
test('D/O quotation uses the same live material total and current markup, VAT and discount helper',()=>{
 const q=quote();expect(q.ready).toBe(true);expect(q.pricing.materialsCost).toBe(build().materialsCostForPricing);
 const customer={id:'trade',name:'Trade test',discountPct:10,defaultDeliveryMilesOneWay:25};
 const trade=quote({inputs:{...inputs,selectedCustomerId:'trade',labourDaysOverride:1.8},customer});
 expect(trade.ready).toBe(true);expect(trade.labour.labourCost).toBe(540);expect(trade.delivery.oneWayMiles).toBe(25);
 expect(trade.pricing.net).toBeCloseTo(((trade.model.materialsCostForPricing+540)*1.5+trade.delivery.deliveryCost)*0.9,6);
 expect(trade.pricing.gross).toBeCloseTo(trade.pricing.net*1.2,6);
});
test('postcode route overrides default and stale distances or unloaded customers cannot be issued',()=>{
 const customer={id:'trade',discountPct:10,defaultDeliveryMilesOneWay:25};
 const entered={...inputs,selectedCustomerId:'trade',deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'hu11aa',deliveryDistanceMiles:12};
 const q=quote({inputs:entered,customer});expect(q.ready).toBe(true);expect(q.delivery.oneWayMiles).toBe(12);
 expect(quote({inputs:{...entered,deliveryPostcode:'HU2 2BB'},customer}).ready).toBe(false);
 expect(quote({inputs:entered}).ready).toBe(false);
 expect(quote({inputs:{...entered,deliveryDistanceMiles:0},customer}).delivery.oneWayMiles).toBe(0);
});
test('saved Gable quote carries material totals, adjustments, extras and its own routing identity',()=>{
 const savedInputs={...inputs,summaryPricingState:{adjustments:{concrete_screws:1}},summaryAddedItems:[{section:'gutters',catalogId:'square_corner90',qty:1}]};
 const q=quote({inputs:savedInputs});const record=buildGableQuoteRecord({inputs:savedInputs,materials,quotation:q,quoteNumber:'123'});
 expect(record.roof_style).toBe('gable');expect(isGableQuote(record)).toBe(true);expect(record.inputs_json.summaryPricingState).toEqual(savedInputs.summaryPricingState);
 expect(record.pricing_json.materialSections).toEqual(q.model.pricingSections);
 expect(build({inputs:record.inputs_json}).materialsCostForPricing).toBe(q.model.materialsCostForPricing);
 expect(isGableQuote({roof_style:'lean-to'})).toBe(false);
});
test('factory consumption stays out of loose supplies while eight wall screws are retained',()=>{
 const list=buildSummaryIdiotList(build(),materials);
 expect(list.sections.misc.some(r=>r.key==='factory_staples_32mm'||r.key==='d4_glue')).toBe(false);
 expect(list.sections.misc.find(r=>r.key==='concrete_screws').qty).toBe(8);
});

test('larger roofs require enough membrane rolls while retaining installed-area weight',()=>{
 const large={...inputs,widthMM:6500,projMM:6500};
 const m=build({inputs:large});expect(m.valid).toBe(true);expect(m.audits.insulation.membrane.installedAreaM2).toBeGreaterThan(50);
 expect(m.supplyReviews).toHaveLength(1);
 const enough=build({inputs:{...large,summaryPricingState:{adjustments:{gable_membrane:1}}}});
 expect(enough.supplyReviews).toHaveLength(0);expect(enough.installedWeightKg).toBe(m.installedWeightKg);
});
test('SuperQuilt ordering changes do not change internal-area installed weight',()=>{
 const a=build(),b=build({materials:{...materials,superquilt_wastage_pct:100}});
 const weight=m=>round(m.sections.misc.lines.filter(r=>r.key.startsWith('gable_sq_')).reduce((s,r)=>s+r.weight_kg,0));
 expect(weight(a)).toBe(weight(b));expect(a.audits.insulation.ceiling.areaM2).toBe(b.audits.insulation.ceiling.areaM2);
});
