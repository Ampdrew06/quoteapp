jest.mock('../supabaseClient', () => ({ supabase: {} }));
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { jest.restoreAllMocks(); });
import { buildSummaryMaterialsModel } from './summaryMaterialsModel';
import { defaultMaterials } from '../materials';
import { computePricing } from '../pricing';
import { readSummaryPricingState, persistSummaryPricingState, restoreSummaryPricingState } from './summaryPricingState';
const roof={roofStyle:'hippedLeanTo',tileSystem:'britmet',leftHip:true,rightHip:true,widthMM:4050,projMM:2885,pitchDeg:15,eavesOverhangMM:150,leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100,plasticsColor:'white',gutterProfile:'square',gutterColor:'white'};
const materials={...defaultMaterials,
 gutter_square_length_4m_price:9.63,gutter_square_union_price:2.32,gutter_square_bracket_price:0.78,gutter_square_corner_90_ext_price:3.05,gutter_square_stop_end_price:1.62,gutter_square_running_outlet_price:3.02,dp_length_2_5m_price:7.14,dp_bend_price:2.06,dp_clip_price:0.67,dp_shoe_price:2.3,dp_adaptor_price:2.79,
 tile_britmet_price_each:6.12,britmet_ridge_tile_price_each:6.18,britmet_hip_end_cap_90_price_each:10.5,touchup_kit_britmet_price_each:5.1,
 d4_glue_price_per_tub:6.49,screws_1_5x10_price_per_box:3.36,screws_1_5x10_units_per_box:250,spar_hook_rivets_price_per_box:4,spar_hook_rivets_units_per_box:250,drywall_screws_32mm_price_per_box:6.36,drywall_screws_32mm_units_per_box:1000,
 expanding_foam_can_price_each:3.78,aluminium_tape_roll_price_each:3.88,screws_3x10_price_per_box:2.46,screws_2x8_price_per_box:3.22,screws_1x8_price_per_box:1.54,
};
const build=(extra={})=>buildSummaryMaterialsModel({inputs:roof,materials,...extra});
const round=value=>Number(value.toFixed(2));
const displaySum=model=>round(Object.entries(model.sections).reduce((sum,[key,section])=>sum+round(key==='timber'?section.totals.chargeableCost:section.totals.cost),0));
test('quotation materials equal all six displayed sections using timber chargeable cost',()=>{
 const model=build();
 expect(Object.keys(model.sections)).toEqual(['timber','tiles','plastics','metal','gutters','misc']);
 expect(model.materialsCostForPricing).toBe(displaySum(model));
 expect(model.pricingSections.tiles).toBe(418.26);
 expect(model.pricingSections.gutters).toBe(72.96);
 expect(model.materialsCostForPricing>model.materialsBaseCost).toBe(true);
});
test('exclusions remove exact current rows once, retaining material weight',()=>{
 const base=build(),excluded=build({exclusions:{screws_lath_fixings:true,g_union:true}});
 expect(round(base.materialsCostForPricing-excluded.materialsCostForPricing)).toBe(6.44+2.32);
 expect(excluded.sections.misc.totals.weight).toBe(base.sections.misc.totals.weight);
 expect(excluded.materialsCostForPricing).toBe(displaySum(excluded));
});
test('quantity adjustments reprice rows once and a reduced-to-zero allowance costs zero',()=>{
 const base=build(),adjusted=build({adjustments:{screws_lath_fixings:1}});
 expect(round(adjusted.materialsCostForPricing-base.materialsCostForPricing)).toBe(3.22);
 const removed=build({adjustments:{screws_lath_fixings:-2}});
 expect(removed.sections.misc.lines.find(row=>row.key==='screws_lath_fixings').qty).toBe(0);
 expect(round(base.materialsCostForPricing-removed.materialsCostForPricing)).toBe(6.44);
 expect(build({adjustments:{screws_lath_fixings:1},exclusions:{screws_lath_fixings:true}}).materialsCostForPricing).toBe(build({exclusions:{screws_lath_fixings:true}}).materialsCostForPricing);
});
test('extras, factory consumption and configured zero prices flow directly into pricing',()=>{
 const base=build(),added=build({addedItems:[{section:'gutters',catalogId:'square_corner90',qty:2}]});
 expect(round(added.materialsCostForPricing-base.materialsCostForPricing)).toBe(6.1);
 expect(added.materialsCostForPricing).toBe(displaySum(added));
 expect(base.sections.misc.lines.find(row=>row.key==='factory_screws_1_5x10').line).toBe(1.99);
 const zero=build({materials:{...materials,screws_2x8_price_per_box:0}});
 expect(zero.sections.misc.lines.find(row=>row.key==='screws_lath_fixings').line).toBe(0);
 expect(round(base.materialsCostForPricing-zero.materialsCostForPricing)).toBe(6.44);
});
test('Summary and Design input aliases produce the same live pricing and quantities',()=>{
 const summary={...roof,internalWidthMM:roof.widthMM,internalProjectionMM:roof.projMM,tile_system:'britmet',plastics_color:'white',left_exposed:true,right_exposed:true};
 delete summary.widthMM;delete summary.projMM;delete summary.tileSystem;delete summary.plasticsColor;
 const design=build(),same=build({inputs:summary});
 expect(same.pricingSections).toEqual(design.pricingSections);
 for(const key of Object.keys(design.sections))expect(same.sections[key].lines.map(row=>[row.key,row.qty,row.line])).toEqual(design.sections[key].lines.map(row=>[row.key,row.qty,row.line]));
});
test('both one-sided hipped variants and ordinary Lean-To use their displayed section sum',()=>{
 for(const inputs of [{...roof,hippedSides:'left',rightHip:false},{...roof,hippedSides:'right',leftHip:false},{...roof,roofStyle:'leanTo',leftHip:false,rightHip:false}]) {
  const model=build({inputs});expect(model.materialsCostForPricing).toBe(displaySum(model));
 }
});
test('live dimensions and Materials changes recalculate rather than reusing a Summary snapshot',()=>{
 const base=build(),resized=build({inputs:{...roof,widthMM:5000}});
 expect(resized.materialsCostForPricing!==base.materialsCostForPricing).toBe(true);
 const revised=build({materials:{...materials,gutter_square_length_4m_price:10.63}});
 expect(round(revised.materialsCostForPricing-base.materialsCostForPricing)).toBe(3);
});
test('markup, discount and VAT apply once after the reconciled material total',()=>{
 const model=build();
 const priced=computePricing(model.materialsCostForPricing,{profit_pct:60,vat_rate:0.2},{labourCost:450,deliveryCost:17.96,discountPct:20});
 expect(priced.materialsCost).toBe(model.materialsCostForPricing);
 expect(round(priced.net)).toBe(round(((displaySum(model)+450)*1.6+17.96)*0.8));
 expect(round(priced.gross)).toBe(round(priced.net*1.2));
});
test('saved quotations retain pricing controls, and opening an older quote clears stale controls',()=>{
 const data={leanToInputs:JSON.stringify({...roof,summaryAddedItems:[]}),summary_exclusions:JSON.stringify({g_union:true}),summary_adjustments:JSON.stringify({screws_lath_fixings:1})};
 const storage={getItem:key=>data[key]??null,setItem:(key,value)=>{data[key]=value;},removeItem:key=>{delete data[key];}};
 persistSummaryPricingState(storage);const saved=JSON.parse(data.leanToInputs);
 const state=readSummaryPricingState(storage);
 const before=build({...state});
 restoreSummaryPricingState({},storage);expect(readSummaryPricingState(storage)).toEqual({exclusions:{},adjustments:{}});
 restoreSummaryPricingState(saved,storage);expect(readSummaryPricingState(storage)).toEqual(state);
 expect(build({...readSummaryPricingState(storage)}).materialsCostForPricing).toBe(before.materialsCostForPricing);
});

test('manufacture fascia coverage and Summary ordering use the same lip convention',()=>{
 const model=build();
 const audit=model.integratedPlasticsAudit;
 expect(audit.rows[0].structuralFasciaHeightMM).toBe(model.manufactureGeometry.frontFinishedFasciaHeightMM);
 expect(audit.rows[0].fasciaWidthMM).toBe(250);
 expect(model.manufactureGeometry.commonFasciaOrderSizeMM).toBe(250);
 expect(model.sections.plastics.lines.find(row=>row.key==='fascia').label.includes('250')).toBe(true);
 expect(model.sections.gutters.lines.find(row=>row.key==='g_len').qty).toBe(3);
 expect(model.sections.gutters.lines.find(row=>row.key==='g_brkt').qty).toBe(15);
});
