import {buildVictorianHippedSummaryMaterialsModel as build} from './victorianHippedSummaryMaterialsModel';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},materials=getMaterials();
test('six section totals contribute once and only configured rates enable pricing',()=>{
 const a=build({inputs,materials});expect(a.valid).toBe(true);expect(a.sections.length).toBe(6);
 expect(a.knownMaterialsCost).toBeCloseTo(Math.round(a.sections.reduce((n,s)=>n+s.totals.cost,0)*100)/100,7);
 expect(new Set(a.allRows.map(r=>r.key)).size).toBe(a.allRows.length);expect(a.pricingReady).toBe(a.missingPrices.length===0);expect(a.materialsCostForPricing).toBe(a.pricingReady?a.knownMaterialsCost:null);
});
test('zero prices and missing prices are distinct and unknown weights do not invalidate costs',()=>{
 const a=build({inputs,materials:{...materials,britmet_ridge_tile_price_each:null,tile_britmet_price_each:0}});
 expect(a.missingPrices.some(r=>r.key==='vh_tiles_hips')).toBe(true);expect(a.zeroPrices.some(r=>r.key==='vh_tiles_main')).toBe(true);expect(a.materialRatesComplete).toBe(false);expect(a.valid).toBe(true);
});
test('tile exclusion changes only its section cost and preserves installed quantities',()=>{
 const a=build({inputs,materials}),b=build({inputs:{...inputs,victorianHippedTileSummary:{exclusions:{vh_tiles_main:true}}},materials});
 expect(b.pricingSections.timber).toBe(a.pricingSections.timber);expect(b.knownSuppliedWeightKg).toBe(a.knownSuppliedWeightKg);
 expect(b.knownMaterialsCost).toBeCloseTo(a.knownMaterialsCost-a.allRows.find(r=>r.key==='vh_tiles_main').cost,7);
});
