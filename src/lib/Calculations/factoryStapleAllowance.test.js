jest.mock('../supabaseClient',()=>({supabase:{}}));
import {buildFactoryStapleAllowance,integrateFactoryAllowances} from './factoryStapleAllowance';
import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {defaultMaterials} from '../materials';
test('practical Gable allowance charges consumed staples with exact pack rate',()=>{
 const a=buildFactoryStapleAllowance({trussCount:8,ringBeamLengthM:8.65});
 expect(a.qty).toBe(493);expect(a.cost).toBeCloseTo(1.7255,8);
});
test('allows explicit zero pricing and rejects invalid pack quantities',()=>{
 expect(buildFactoryStapleAllowance({trussCount:1,materials:{factory_staples_32mm_price_per_box:0}}).cost).toBe(0);
 expect(buildFactoryStapleAllowance({materials:{factory_staples_32mm_units_per_box:0}}).valid).toBe(false);
 expect(buildFactoryStapleAllowance({ringBeamLengthM:-1}).valid).toBe(false);
 expect(buildFactoryStapleAllowance({trussCount:1,materials:{factory_staples_32mm_price_per_box:null}}).cost).toBeNull();
});
test('integration is idempotent and keeps one glue tub and no supplied pack weight',()=>{
 const a=buildFactoryStapleAllowance({trussCount:1});
 const first=integrateFactoryAllowances(a,[],{d4_glue_price_per_tub:6.49});
 const twice=integrateFactoryAllowances(a,first,{d4_glue_price_per_tub:6.49});
 expect(twice).toEqual(first);expect(twice.filter(r=>r.key==='d4_glue')).toHaveLength(1);
 expect(twice.every(r=>r.usage==='factory'&&r.supplyToSite===false&&r.weight_kg===0)).toBe(true);
});
const base={widthMM:4050,projMM:2885,pitchDeg:15,eavesOverhangMM:150,tileSystem:'britmet',leftHip:true,rightHip:true,sideSoffitMode:'specified',specifiedSideSoffitMM:100};
test('shared pricing adds staples for ordinary, offset and central-boss roofs',()=>{
 for(const inputs of [{...base,roofStyle:'leanTo',leftHip:false,rightHip:false},{...base,roofStyle:'hippedLeanTo'},{...base,roofStyle:'hippedLeanTo',bossArrangement:'central'}]){
  const model=buildSummaryMaterialsModel({inputs,materials:{...defaultMaterials,d4_glue_price_per_tub:6.49}});
  const rows=model.sections.misc.lines,staple=rows.find(r=>r.key==='factory_staples_32mm');
  expect(staple.qty).toBeGreaterThan(0);expect(rows.filter(r=>r.key==='d4_glue')).toHaveLength(1);
  expect(staple.supplyToSite).toBe(false);
  const zero=buildSummaryMaterialsModel({inputs,materials:{...defaultMaterials,d4_glue_price_per_tub:6.49,factory_staples_32mm_price_per_box:0}});
  expect(Number((model.materialsCostForPricing-zero.materialsCostForPricing).toFixed(2))).toBe(staple.line);
  expect(model.sections.misc.totals.weight).toBe(zero.sections.misc.totals.weight);
  if(inputs.bossArrangement==='central')expect(staple.requirement_basis.startsWith('1 trusses × 40')).toBe(true);
 }
});
