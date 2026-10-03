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
test('laths, PIR and starter use supplied stock counts instead of installed metres or area',()=>{
 const model=build(),list=buildSummaryIdiotList(model,defaultMaterials);
 for(const [section,key] of [['timber','laths_25x50_lengths'],['misc','pir50_cradle'],['misc','slab100'],['metal','tile_starter']])
  expect(row(list,section,key).qty).toBe(model.sections[section].lines.find(r=>r.key===key).order_qty);
 expect(row(list,'misc','slab100').units).toBe('Sheets');
 expect(row(list,'timber','laths_25x50_lengths').units).toBe('Lengths');
});
test('factory consumables and vent machining are omitted while site boxes and hip tape remain',()=>{
 const list=buildSummaryIdiotList(build(),defaultMaterials);
 expect(list.sections.misc.some(r=>/d4_glue|factory_/.test(r.key))).toBe(false);
 expect(list.sections.plastics.some(r=>r.key==='vent')).toBe(false);
 expect(row(list,'misc','screws_lath_fixings').qty).toBe(2);
 expect(row(list,'misc','expanding_foam_tape').qty>0).toBe(true);
 expect(list.sections.misc.some(r=>/plasterboard/i.test(r.item))).toBe(false);
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
