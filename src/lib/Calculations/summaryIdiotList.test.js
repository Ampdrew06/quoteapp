jest.mock('../supabaseClient', () => ({ supabase: {} }));
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { jest.restoreAllMocks(); });
import { buildSummaryIdiotList } from './summaryIdiotList';
import { buildSummaryMaterialsModel } from './summaryMaterialsModel';
import { defaultMaterials } from '../materials';
const roof={roofStyle:'hippedLeanTo',tileSystem:'britmet',leftHip:true,rightHip:true,widthMM:4050,projMM:2885,pitchDeg:15,eavesOverhangMM:150,leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100,plasticsColor:'white',gutterProfile:'square',gutterColor:'white'};
const build=(extra={})=>buildSummaryMaterialsModel({inputs:roof,materials:defaultMaterials,...extra});
const row=(list,section,key)=>list.sections[section].find(r=>r.key===key);
test('hipped checklist consumes integrated plastics, gutters, tiles and watercourse exactly once',()=>{
 const model=build(),list=buildSummaryIdiotList(model,defaultMaterials);
 for(const section of ['tiles','plastics','gutters']) for(const item of model.sections[section].lines.filter(r=>r.qty>0&&r.key!=='vent')) {
  expect(row(list,section,item.key).qty).toBe(item.qty);
  expect(list.sections[section].filter(r=>r.key===item.key).length).toBe(1);
 }
 expect(row(list,'metal','watercourse').qty).toBe(2);
 expect(row(list,'gutters','g_corner_90').qty).toBe(2);
 expect(row(list,'gutters','dp_bend').qty).toBe(2);
 expect(list.installedWeightKg).toBe(model.installedWeightKg);
});
test('hipped checklist omits fitted raw stock and only lists loose PIR and laths',()=>{
 const model=build(),list=buildSummaryIdiotList(model,defaultMaterials);
 expect(list.sections.timber).toHaveLength(0);
 expect(list.sections.misc.some(r=>r.key==='pir50_cradle')).toBe(false);
 expect(row(list,'misc','slab100').qty).toBe(model.sections.misc.lines.find(r=>r.key==='slab100').order_qty);
 expect(row(list,'laths','loose_laths_external').qty).toBeGreaterThan(0);expect(row(list,'laths','loose_laths_internal').qty).toBeGreaterThan(0);
 expect(row(list,'laths','loose_laths_external').qty).toBeLessThan(model.sections.timber.lines.find(r=>r.key==='laths_25x50_lengths').order_qty);
 expect(row(list,'metal','tile_starter').qty).toBe(model.sections.metal.lines.find(r=>r.key==='tile_starter').order_qty);
 for(const key of ['joist_hangers','jack_rafter_hooks','jack_rafter_brackets','boss_rafter_terminal','spar_hook'])expect(list.sections.metal.some(r=>r.key===key)).toBe(false);
});
test('factory consumables and vent machining are omitted while site boxes and hip tape remain',()=>{
 const list=buildSummaryIdiotList(build(),defaultMaterials);
 expect(list.sections.misc.some(r=>/d4_glue|factory_/.test(r.key))).toBe(false);
 expect(list.sections.plastics.some(r=>r.key==='vent')).toBe(false);
 expect(row(list,'misc','screws_lath_fixings').qty).toBe(2);
 expect(row(list,'misc','expanding_foam_tape').qty>0).toBe(true);
 expect(row(list,'misc','plasterboard_guide').informational).toBe(true);
 expect(row(list,'misc','plasterboard_guide').qty).toBe(Math.ceil(build().hippedInsulationIntegration.superQuilt.geometricAreaM2/2.88));
});
test('adjustments and added items are included once; zero supplies disappear',()=>{
 const addedItems=[{section:'gutters',catalogId:'square_corner90',qty:2}];
 const model=build({adjustments:{g_corner_90:1,screws_lath_fixings:-2},addedItems});
 const list=buildSummaryIdiotList(model,defaultMaterials);
 expect(row(list,'gutters','g_corner_90').qty).toBe(3);
 expect(list.sections.misc.some(r=>r.key==='screws_lath_fixings')).toBe(false);
 expect(list.sections.gutters.filter(r=>r.isAddedItem).length).toBe(1);
 expect(list.sections.gutters.find(r=>r.isAddedItem).qty).toBe(2);
});
test('price exclusions retain required supplies and extra items as in Summary',()=>{
 const base=buildSummaryIdiotList(build(),defaultMaterials);
 const excluded=buildSummaryIdiotList(build({exclusions:{g_union:true}}),defaultMaterials);
 expect(row(excluded,'gutters','g_union').qty).toBe(row(base,'gutters','g_union').qty);
});
test('stock adjustments use authoritative qty rather than stale order aliases',()=>{
 const list=buildSummaryIdiotList({quantityAdjustments:{laths_25x50_lengths:5},sections:{timber:{lines:[{key:'laths_25x50_lengths',label:'Laths',qty:14.6,order_qty:2,units:'m'}]}}},{lath_stock_length_m:4.8});
 expect(row(list,'timber','laths_25x50_lengths').qty).toBe(4);
});
test('configured sheet dimensions and PSE stock are used when adjusting quantities',()=>{
 const list=buildSummaryIdiotList({quantityAdjustments:{ply9mm_strips_total_m2:1,pse30x90_ringbeam:1},sections:{timber:{lines:[{key:'ply9mm_strips_total_m2',qty:7,order_qty:2},{key:'pse30x90_ringbeam',qty:7,order_qty:2}]}}},{ply9mm:{sheet_len_m:3,sheet_width_m:1.5},pse30x90:{stock_len_m:3}});
 expect(row(list,'timber','ply9mm_strips_total_m2').qty).toBe(2);
 expect(row(list,'timber','pse30x90_ringbeam').qty).toBe(3);
});

test('manufactured member checks use the shared geometry and update for one hip',()=>{
 const both=buildSummaryIdiotList(build(),defaultMaterials);
 expect(row(both,'assemblies','hip').qty).toBe(2);
 expect(row(both,'assemblies','ring-beam').qty).toBe(3);
 const left=buildSummaryIdiotList(build({inputs:{...roof,hippedSides:'left',rightHip:false}}),defaultMaterials);
 expect(row(left,'assemblies','hip').qty).toBe(1);
 expect(row(left,'assemblies','wallbar').qty).toBe(1);
 expect(row(left,'assemblies','ring-beam').qty).toBe(2);
});

test('central roof lists one assembled truss and checklist leaves the cost model untouched',()=>{
 const model=build({inputs:{...roof,bossArrangement:'central'}}),before=JSON.stringify(model);const list=buildSummaryIdiotList(model,defaultMaterials);
 expect(row(list,'assemblies','truss').qty).toBe(1);expect(list.sections.assemblies.some(r=>r.key==='wallbar')).toBe(false);expect(JSON.stringify(model)).toBe(before);
});

test('explicit extra fitted hardware is supplied loose and price exclusions retain it',()=>{
 const list=buildSummaryIdiotList(build({adjustments:{spar_hook:2},exclusions:{spar_hook:true}}),defaultMaterials);
 expect(row(list,'metal','spar_hook').qty).toBe(2);expect(row(list,'metal','spar_hook').item.includes('extra, supplied loose')).toBe(true);
});

test('regular Lean-To manufacture model splits internal/external laths and omits its pooled row',()=>{
 const model=buildSummaryMaterialsModel({inputs:{roofStyle:'leanTo',widthMM:3500,projMM:2200,pitchDeg:15,eavesOverhangMM:150,tileSystem:'britmet',leftWall:false,rightWall:false},materials:defaultMaterials});
 const before=JSON.stringify({sections:model.sections,price:model.materialsCostForPricing,weight:model.installedWeightKg});
 const list=buildSummaryIdiotList(model,defaultMaterials),uses=model.lathUseBreakdown,stock=defaultMaterials.lath_stock_length_m||4.8;
 expect(row(list,'laths','loose_laths_internal').qty).toBe(Math.ceil((uses.internalM-1e-9)/stock));
 expect(row(list,'laths','loose_laths_external').qty).toBe(Math.ceil((uses.externalM-1e-9)/stock));
 expect(list.sections.timber.some(r=>r.key==='laths_25x50_lengths')).toBe(false);
 expect(JSON.stringify({sections:model.sections,price:model.materialsCostForPricing,weight:model.installedWeightKg})).toBe(before);
});
