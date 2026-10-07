jest.mock('../supabaseClient', () => ({ supabase: {} }));
beforeAll(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { jest.restoreAllMocks(); });
import {buildAutomaticRoofTiling} from './automaticRoofTiling';
import {buildIntegratedAutomaticRoofTiling,integrateSteelTileOrdering} from './integratedAutomaticRoofTiling';
import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {buildSummaryIdiotList} from './summaryIdiotList';
import {defaultMaterials} from '../materials';
const inputs={roofStyle:'hippedLeanTo',widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,leftHip:true,rightHip:true,leftHipWidthMM:1442.5,rightHipWidthMM:1442.5,sideSoffitMode:'specified',specifiedSideSoffitMM:100,tileSystem:'britmet'};
const materials={...defaultMaterials,side_frame_thickness_mm:70,fascia_lip_mm:25,frame_on_mm:70,tile_britmet_price_each:6.12};
test('accepted hipped layout orders 54 consumed tiles plus two spares and preserves Home calculation',()=>{
 const args={roofInputs:inputs,materials};
 const original=buildAutomaticRoofTiling(args),integrated=buildIntegratedAutomaticRoofTiling(args);
 expect(original.result.tileQuantityOrdered).toBe(51);
 expect(integrated.tileOrderIntegration.tilesUsed).toBe(54);
 expect(integrated.result.tileQuantityOrdered).toBe(56);
 expect(integrated.areaEstimateResult).toEqual(original.result);
 expect(buildAutomaticRoofTiling(args)).toEqual(original);
});
test('ordinary Lean-To and slate ordering remain unchanged; invalid layouts retain original result',()=>{
 for(const roofInputs of [{...inputs,roofStyle:'leanTo'},{...inputs,tileSystem:'liteslate'}]){
  const original=buildAutomaticRoofTiling({roofInputs,materials});expect(integrateSteelTileOrdering(original)).toBe(original);
 }
 const original={roofStyle:'hippedLeanTo',productId:'britmetShingle',result:{errors:['Invalid geometry']}};
 const integrated=integrateSteelTileOrdering(original);expect(integrated.result).toBe(original.result);expect(integrated.tileOrderIntegration.applied).toBe(false);
});
test('Summary costs and final Idiot List share integrated stock, with adjustments counted once',()=>{
 const model=buildSummaryMaterialsModel({inputs,materials});
 expect(model.tileOrderIntegration.ordered).toBe(56);
 const tile=model.sections.tiles.lines.find(r=>r.key==='tile_britmet');
 expect(tile.qty).toBe(56);expect(tile.line).toBeCloseTo(56*6.12);
 const list=buildSummaryIdiotList(model,materials);
 expect(list.sections.tiles.find(r=>r.key===tile.key).qty).toBe(56);
 const adjusted=buildSummaryMaterialsModel({inputs,materials,adjustments:{[tile.key]:1}});
 expect(adjusted.sections.tiles.lines.find(r=>r.key===tile.key).qty).toBe(57);
 expect(adjusted.materialsCostForPricing-model.materialsCostForPricing).toBeCloseTo(6.12);
 expect(buildSummaryIdiotList(adjusted,materials).sections.tiles.find(r=>r.key===tile.key).qty).toBe(57);
});
