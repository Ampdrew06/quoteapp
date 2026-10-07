jest.mock('../supabaseClient', () => ({ supabase: {} }));
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { jest.restoreAllMocks(); });
import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {buildSummaryIdiotList} from './summaryIdiotList';
import {buildCentralBossTrussCosts} from './centralBossTrussCosts';
import {defaultMaterials} from '../materials';
const inputs={roofStyle:'hippedLeanTo',bossArrangement:'central',tileSystem:'britmet',widthMM:4050,projMM:2885,pitchDeg:15,eavesOverhangMM:150,sideSoffitMode:'specified',specifiedSideSoffitMM:100};
const materials={...defaultMaterials,truss_closure_45x45_price_per_m:10,truss_closure_45x45_weight_kg_per_m:2};
const build=(extra={})=>buildSummaryMaterialsModel({inputs,materials,...extra});
const row=(model,section,key)=>model.sections[section].lines.find(r=>r.key===key);
const round=value=>Math.round(value*100)/100;
test('central assembly replaces horizontal wallplate with two truss members and one boss rafter',()=>{
 const model=build(),g=model.manufactureGeometry,a=model.wallplateIntegrationAudit;
 expect(g.bossQty).toBe(1);expect(g.sparHookQty).toBe(6);
 expect(g.centralTruss.frontRafterLayout.bossRafterCount).toBe(1);
 expect(g.horizontalWallplateExternalLengthMM).toBe(0);
 expect(a.steico.manufacture).toBeCloseTo(g.centralTruss.members.reduce((sum,m)=>sum+m.externalSlopeMM,0)/1000,8);
 expect(a.ply9.manufacture).toBeCloseTo(2*g.centralTruss.gusset.areaEachM2,8);
 expect(a.ply18.manufacture).toBeCloseTo(2*g.centralTruss.chevron.areaEachM2,8);
 expect(a.ply9.rearPackerCount).toBe(0);expect(a.ply18.infillAreaM2).toBe(0);
});
test('closure price and installed weight enter canonical totals once and explicit zero remains valid',()=>{
 const base=build(),revised=build({materials:{...materials,truss_closure_45x45_price_per_m:20}});
 expect(row(base,'timber','truss_closure_45x45').qty).toBe(0.595);
 expect(row(base,'timber','truss_closure_45x45').line).toBe(5.95);
 expect(row(base,'timber','truss_closure_45x45').weight_kg).toBe(1.19);
 expect(round(revised.materialsCostForPricing-base.materialsCostForPricing)).toBe(6.54);
 expect(base.materialsCostForPricing).toBe(round(Object.values(base.sections).reduce((sum,s)=>sum+s.totals.chargeableCost,0)));
 const zero=build({materials:{...materials,truss_closure_45x45_price_per_m:0}});
 expect(zero.centralTrussCosts.pricingReady).toBe(true);expect(row(zero,'timber','truss_closure_45x45').line).toBe(0);
 expect(round(base.materialsCostForPricing-zero.materialsCostForPricing)).toBe(6.55);
});
test('missing closure rate prevents quotation readiness without inventing a price',()=>{
 for(const rate of [null,'',-1,NaN]) {
  const model=build({materials:{...materials,truss_closure_45x45_price_per_m:rate}});
  expect(model.centralTrussCosts.pricingReady).toBe(false);
  expect(row(model,'timber','truss_closure_45x45').price_unconfigured).toBe(true);
  expect(model.centralTrussCosts.errors).toHaveLength(1);
 }
 expect(buildCentralBossTrussCosts({geometry:{bossArrangement:'central',centralTruss:{valid:false,errors:['Invalid dimensions']}}}).pricingReady).toBe(false);
 expect(buildCentralBossTrussCosts({geometry:{bossArrangement:'offset'}})).toBeNull();
});
test('three spar-hook pairs and one boss drive metal and factory consumables',()=>{
 const model=build(),g=model.manufactureGeometry;
 const jacks=['leftJackRafterCount','rightJackRafterCount','leftSideIntermediateJackCount','rightSideIntermediateJackCount'].reduce((sum,key)=>sum+(g[key]||0),0);
 expect(row(model,'metal','boss_rafter_terminal').qty).toBe(1);expect(row(model,'metal','spar_hook').qty).toBe(6);
 expect(row(model,'misc','factory_spar_rivets').qty).toBe(12);
 expect(row(model,'misc','factory_screws_1_5x10').qty).toBe(48+jacks*10);
 expect(row(model,'metal','watercourse').qty).toBe(2);
 expect(row(model,'metal','watercourse').weight_kg).toBeCloseTo(0.84,2);
});
test('central tile order agrees with Summary and loading list while factory closure is omitted from loose supplies',()=>{
 const model=build(),list=buildSummaryIdiotList(model,materials);
 expect(model.tileOrderIntegration.applied).toBe(true);
 const tile=model.sections.tiles.lines.find(r=>r.key==='tile_britmet');
 expect(tile.qty).toBe(model.tileOrderIntegration.ordered);
 expect(list.sections.tiles.find(r=>r.key==='tile_britmet').qty).toBe(tile.qty);
 expect(list.sections.timber.some(r=>r.key==='truss_closure_45x45')).toBe(false);
});
test('central costing ignores stale offset controls and recalculates the displayed mobile roof',()=>{
 const base=build(),stale=build({inputs:{...inputs,leftHip:false,rightHip:false,leftHipWidthMM:900,rightHipWidthMM:1200,requestedLeftSidePitchDeg:40,requestedRightSidePitchDeg:45}});
 expect(stale.pricingSections).toEqual(base.pricingSections);
 const mobile=build({inputs:{...inputs,widthMM:4800,projMM:2500}});
 expect(mobile.centralTrussCosts.pricingReady).toBe(true);
 expect(mobile.manufactureGeometry.centralTruss.boss.xMM).toBe(2400);
 expect(mobile.tileOrderIntegration.applied).toBe(true);
});
