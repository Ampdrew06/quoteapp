import {buildVictorianHippedMiscSummary as build} from './victorianHippedMiscSummary';
import {buildVictorianHippedTimberSummary} from './victorianHippedTimberSummary';
import {chooseSuperQuiltMix} from './insulationIntegrationAudit';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials=getMaterials(),inputs={...victorianHippedDefaults,requestedSidePitchDeg:25};
const timber=buildVictorianHippedTimberSummary({inputs,materials});
test('PIR areas pool and receive their waste allowance once before sheet rounding',()=>{
 const a=build({timber,inputs,materials});expect(a.valid).toBe(true);
 expect(a.pir50.area).toBeCloseTo(a.cradleAreaM2+a.ringAreaM2,7);
 expect(a.pir100.area).toBeCloseTo(a.frameAreaM2-a.footprintAreaM2,7);
 expect(a.pir50.sheets).toBe(Math.ceil(a.pir50.area*(1+a.pir50.wastePct/100)/a.pir50.sheetArea));
});
test('half roll selection retained and quilt weight is independent of the15m roll weight',()=>{
 const mix=chooseSuperQuiltMix({requiredNominalM2:17.67,price12:80,price15:100});expect(mix.rolls12).toBe(1.5);
 const a=build({timber,inputs,materials}),b=build({timber,inputs,materials:{...materials,superquilt_15m_weight_kg_each:999}});
 expect(a.quilt.installedWeightKg).toBe(b.quilt.installedWeightKg);
});
test('factory fixings use consumed unit prices and no additional full boxes',()=>{
 const a=build({timber,inputs,materials:{...materials,screws_1_5x10_price_per_box:20,screws_1_5x10_units_per_box:1000}});
 expect(a.rows.find(r=>r.key==='vh_misc_factory_screws').cost).toBeCloseTo(Math.round(a.fixings.factoryScrews/1000*20*100)/100,7);
 expect(a.fixings.rivets).toBe(a.fixings.sparPairs*4);
});
test('sheet supply changes retain area and installed weight; invalid pack/overlap is rejected',()=>{
 const a=build({timber,inputs,materials}),b=build({timber,inputs:{...inputs,victorianHippedMiscSummary:{adjustments:{vh_misc_pir100:1},exclusions:{vh_misc_pir50:true}}},materials});
 expect(b.rows.find(r=>r.key==='vh_misc_pir100').orderQty).toBe(a.pir100.sheets+1);expect(b.rows.find(r=>r.key==='vh_misc_pir100').qty).toBe(a.pir100.area);expect(b.totals.weight).toBe(a.totals.weight);
 expect(build({timber,inputs,materials:{...materials,superquilt_overlap_mm:1200}}).valid).toBe(false);
});
