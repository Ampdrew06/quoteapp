import {buildVictorianHippedTileSummary as build} from './victorianHippedTileSummary';
import {buildVictorianHippedTimberSummary} from './victorianHippedTimberSummary';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials={...getMaterials(),tile_britmet_price_each:6.12,britmet_ridge_tile_price_each:6.18};
test('prices accepted whole stock without another waste percentage',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),m=build({timber,inputs,materials});
 expect(m.rows[0].qty).toBe(timber.covering.result.tileQuantityOrdered);
 expect(m.rows[1].qty).toBe(timber.covering.hipTiles);
 expect(m.rows[0].cost).toBeCloseTo(Math.round(m.rows[0].qty*6.12*100)/100,7);
 expect(m.rows[1].cost).toBeCloseTo(Math.round(m.rows[1].qty*6.18*100)/100,7);
 expect(m.pricingReady).toBe(false);
});
test('mixed ends retain appropriate cap families and no caps at wall ends',()=>{
 for(const left of ['victorian','edwardian','wall'])for(const right of ['victorian','edwardian','wall']){
  const inputs={...victorianHippedDefaults,leftEndType:left,rightEndType:right,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),m=build({timber,inputs,materials});
  expect(m.rows.find(r=>r.key==='vh_tiles_cap135').qty).toBe((left==='victorian'?2:0)+(right==='victorian'?2:0));
  expect(m.rows.find(r=>r.key==='vh_tiles_cap90').qty).toBe((left==='edwardian'?1:0)+(right==='edwardian'?1:0));
 }
});
test('supply changes and exclusions preserve installed weight',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),m=build({timber,inputs,materials}),changed=build({timber,inputs:{...inputs,victorianHippedTileSummary:{adjustments:{vh_tiles_main:2},exclusions:{vh_tiles_main:true}}},materials});
 expect(changed.rows[0].qty).toBe(m.rows[0].qty+2);expect(changed.rows[0].chargeableCost).toBe(0);expect(changed.totals.weight).toBe(m.totals.weight);
});
