import { buildAutomaticRoofTiling } from './automaticRoofTiling';
import { buildAutomaticRoofEdgeBOM } from './automaticRoofEdgeBOM';
import { buildHippedLeanToInsulationAudit } from './insulationIntegrationAudit';
import { buildHippedMiscellaneousIntegrationAudit } from './miscellaneousIntegrationAudit';
import { integrateMiscellaneousSummary, miscellaneousPricingDelta, miscellaneousSiteSupplyLines } from './miscellaneousSummaryIntegration';
const audit = { valid:true, lathAudit:{valid:true}, rows:[
  {key:'expanding_foam',label:'Foam',candidateQty:2,cost:7.56},
  {key:'screws_lath_fixings',label:'Lath screws',candidateQty:2,cost:6.44},
  {key:'d4_glue',label:'D4 glue',candidateQty:1,cost:6.49,usage:'factory'},
  {key:'factory_screws_1_5x10',label:'Factory screws',candidateQty:148,cost:1.987,usage:'factory'},
]};
const legacy = [
  {key:'expanding_foam',qty:2,line:7.56,weight_kg:1.6},
  {key:'screws_lath_fixings',qty:1,line:3.22,weight_kg:0.8},
  {key:'superquilt_15m',qty:1,line:99.5,weight_kg:7.82},
];
test('replaces site boxes, prices factory consumption and preserves other materials',()=>{
  const result=integrateMiscellaneousSummary(audit,legacy);
  expect(result.find(row=>row.key==='screws_lath_fixings').qty).toBe(2);
  expect(result.find(row=>row.key==='screws_lath_fixings').line).toBe(6.44);
  expect(result.find(row=>row.key==='screws_lath_fixings').weight_kg).toBe(1.6);
  expect(result.find(row=>row.key==='factory_screws_1_5x10').line).toBe(1.99);
  expect(result.find(row=>row.key==='d4_glue').weight_kg).toBe(0);
  expect(result.find(row=>row.key==='superquilt_15m')).toBe(legacy[2]);
});
test('does not duplicate factory rows on repeated integration',()=>{
  const once=integrateMiscellaneousSummary(audit,legacy);
  expect(integrateMiscellaneousSummary(audit,once)).toEqual(once);
});
test('leaves legacy rows intact until the complete lath audit resolves',()=>{
  expect(integrateMiscellaneousSummary(null,legacy)).toBe(legacy);
  expect(integrateMiscellaneousSummary({...audit,lathAudit:{valid:false}},legacy)).toBe(legacy);
  expect(integrateMiscellaneousSummary({...audit,rows:[{candidateQty:null}]},legacy)).toBe(legacy);
});
test('reconciles quote pricing and respects excluded rows',()=>{
  const result=integrateMiscellaneousSummary(audit,legacy);
  expect(miscellaneousPricingDelta(audit,result,legacy)).toBe(11.7);
  expect(miscellaneousPricingDelta(audit,result,legacy,key=>key==='d4_glue')).toBe(5.21);
  expect(miscellaneousPricingDelta(null,result,legacy)).toBe(0);
});
test('Idiot List supplies site allowances and manual extras without factory items',()=>{
  const result=miscellaneousSiteSupplyLines(integrateMiscellaneousSummary(audit,legacy),{screws_lath_fixings:1});
  expect(result.some(row=>row.usage==='factory')).toBe(false);
  expect(result.find(row=>row.key==='screws_lath_fixings').qtyDisplay).toBe(3);
  expect(result.find(row=>row.key==='superquilt_15m')).toBe(legacy[2]);
});
test('configured zero prices remain zero and missing factory prices remain explicit',()=>{
  const result=integrateMiscellaneousSummary({...audit,rows:[
    {key:'d4_glue',candidateQty:1,cost:0,usage:'factory'},
    {key:'factory_spar_rivets',candidateQty:16,cost:null,usage:'factory'},
  ]},legacy);
  expect(result.find(row=>row.key==='d4_glue').price_unconfigured).toBe(false);
  expect(result.find(row=>row.key==='factory_spar_rivets').price_unconfigured).toBe(true);
});

test('ordered roof flows from geometry through audit into Summary and loose loading quantities',()=>{
  const roofInputs={roofStyle:'hippedLeanTo',tileSystem:'britmet',leftHip:true,rightHip:true,widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100};
  const automatic=buildAutomaticRoofTiling({roofInputs});
  const insulation=buildHippedLeanToInsulationAudit({roofInputs,geometry:automatic.geometry});
  const edge=buildAutomaticRoofEdgeBOM({roofInputs,automaticRoofTiling:automatic});
  const materials={expanding_foam_can_price_each:3.78,aluminium_tape_roll_price_each:3.88,screws_3x10_price_per_box:2.46,screws_2x8_price_per_box:3.22,screws_1x8_price_per_box:1.54,d4_glue_price_per_tub:6.49,screws_1_5x10_price_per_box:3.36,screws_1_5x10_units_per_box:250,spar_hook_rivets_price_per_box:4,spar_hook_rivets_units_per_box:250,drywall_screws_32mm_price_per_box:6.36,drywall_screws_32mm_units_per_box:1000};
  const resolved=buildHippedMiscellaneousIntegrationAudit({geometry:automatic.geometry,roofInputs,materials,internalAreaM2:insulation.superQuilt.geometricAreaM2,tileQuantity:automatic.result.tileQuantityOrdered,tileSystem:automatic.productId,automaticResult:automatic.result,insulationAudit:insulation,edgeModel:edge.edgeModel,edgeLines:edge.bom.lines});
  expect(resolved.lathAudit.valid).toBe(true);
  const result=integrateMiscellaneousSummary(resolved,legacy);
  expect(result.find(row=>row.key==='screws_lath_fixings').qty).toBe(2);
  expect(result.find(row=>row.key==='screws_tile_fixings').qty).toBe(1);
  expect(result.find(row=>row.key==='factory_screws_1_5x10').qty).toBe(148);
  expect(result.find(row=>row.key==='factory_spar_rivets').qty).toBe(16);
  expect(result.find(row=>row.key==='factory_drywall_32mm').qty).toBe(28);
  expect(miscellaneousSiteSupplyLines(result).some(row=>row.key==='d4_glue')).toBe(false);
  // Centre-driven side pitch changes this specimen's installed facet area.
  expect(Number(resolved.plasterboard.facetWeightKg.toFixed(2))).toBe(106.17);
  expect(resolved.plasterboard.facetBoards).toBe(5);
});
