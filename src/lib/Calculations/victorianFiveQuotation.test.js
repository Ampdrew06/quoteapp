import {buildVictorianFiveQuotation,buildVictorianFiveSummaryMaterialsModel,buildVictorianFiveQuoteRecord,isVictorianFiveQuote} from './victorianFiveQuotation';
import {getMaterials} from '../materials';
import {activateDesignRecord,readActiveDesignRecord,restoreActiveDesignRecord,designRecordPatch} from '../activeDesignRecord';
const m={...getMaterials(),boss_rafter_terminal_price_each:2.2,jack_rafter_bracket_price_each:1,truss_closure_45x45_price_per_m:1,gutter_square_corner_135_ext_price:3.82,expanding_foam_roll_price_each:13,concrete_screws_price_per_box:1.97,d4_glue_price_per_tub:6.49,screws_1_5x10_price_per_box:3.2,screws_1_5x10_units_per_box:200,spar_hook_rivets_price_per_box:16,spar_hook_rivets_units_per_box:500};
const base={widthMM:3800,projMM:4200,pitchDeg:25,soffitMM:150,soffitMode:'standard',tileProductId:'britmetShingle',selectedCustomerId:'retail',customerReference:'FIVE',gutterProfile:'square',quoteDisplayed:true};
const build=(patch={},extra={})=>buildVictorianFiveQuotation({inputs:{...base,...patch},materials:m,labourConfig:{dayRate:300},deliveryConfig:{hourlyRate:17.96},markupConfig:{profitPct:50},requirePostcode:false,...extra});
const storage=()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};};
test('five-facet D/O and Summary share material, labour and selling prices',()=>{
 const q=build(),s=buildVictorianFiveSummaryMaterialsModel({inputs:base,materials:m});expect(q.valid).toBe(true);expect(q.ready).toBe(true);expect(q.model.materialsCostForPricing).toBe(s.materialsCostForPricing);expect(q.model.audits.geometry.frontFacetCount).toBe(5);expect(q.model.audits.geometry.hips).toHaveLength(6);expect(q.pricing.gross).toBeGreaterThan(q.pricing.net);
});
test('five-facet Summary adjustments feed quote cost without moving members',()=>{
 const a=build(),b=build({summaryPricingState:{adjustments:{tiles_main:2},exclusions:{fixings_d4_glue:true}}});expect(b.ready).toBe(true);expect(b.model.audits.geometry).toEqual(a.model.audits.geometry);expect(b.model.sections.tiles.lines.find(r=>r.sourceKey==='main').qty).toBe(a.model.sections.tiles.lines.find(r=>r.sourceKey==='main').qty+2);expect(b.model.materialsCostForPricing).not.toBe(a.model.materialsCostForPricing);
});
test('trade postcode and matching verified route are required while admin can omit postcode',()=>{
 expect(build({}, {requirePostcode:true}).ready).toBe(false);expect(build({deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'HU2 2BB',deliveryDistanceMiles:10},{requirePostcode:true}).ready).toBe(false);expect(build({deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'hu11aa',deliveryDistanceMiles:0},{requirePostcode:true}).ready).toBe(true);expect(build().ready).toBe(true);
});
test('saved five-facet snapshot restores to its own draft and preserves adjusted pricing',()=>{
 const inputs={...base,summaryPricingState:{adjustments:{tiles_main:1}},deliveryPostcode:'HU1 1AA',deliveryDistancePostcode:'HU1 1AA',deliveryDistanceMiles:7},q=buildVictorianFiveQuotation({inputs,materials:m,requirePostcode:false}),r={...buildVictorianFiveQuoteRecord({inputs,materials:m,quotation:q,quoteNumber:'F158'}),id:'five-id'};
 const s=storage();s.setItem('victorianPlanPreviewInputs','three-keep');activateDesignRecord(r,s);expect(isVictorianFiveQuote(r)).toBe(true);expect(r.inputs_json.frontFacetCount).toBe(5);expect(r.inputs_json.cornerAnglesDeg).toEqual([150,150,150,150,150,150]);expect(readActiveDesignRecord('victorian-five',s).id).toBe('five-id');expect(readActiveDesignRecord('victorian',s)).toBeNull();expect(s.getItem('victorianPlanPreviewInputs')).toBe('three-keep');
 const restored=JSON.parse(s.getItem('victorianFiveInputs'));expect(buildVictorianFiveSummaryMaterialsModel({inputs:restored,materials:m}).materialsCostForPricing).toBe(q.model.materialsCostForPricing);s.setItem('victorianFiveInputs','{}');expect(restoreActiveDesignRecord('victorian-five',s)).toBe(true);expect(JSON.parse(s.getItem('victorianFiveInputs')).customerReference).toBe('FIVE');
 expect(designRecordPatch({...r,status:'converted_to_job',job_number:'J1'}).status).toBe(undefined);
});
test('missing rates still block five-facet saving',()=>{const q=build({}, {materials:{...m,britmet_universal_ridge_adaptor_price_each:undefined}});expect(q.ready).toBe(false);let rejected=false;try{buildVictorianFiveQuoteRecord({inputs:base,materials:m,quotation:q,quoteNumber:'F158'});}catch{rejected=true;}expect(rejected).toBe(true);});
