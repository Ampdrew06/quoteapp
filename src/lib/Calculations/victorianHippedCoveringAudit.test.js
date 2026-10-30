import {buildVictorianHippedCoveringAudit as build} from './victorianHippedCoveringAudit';
import {buildVictorianHippedGeometry,victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {calculateRoofTiling,widthAtFacetPosition} from './facetTilingCalc';
import {orderSteelHipRidgeRuns} from './steelHipRidgeOrder';
import {getMaterials} from '../materials';
const materials=getMaterials();
test('the adjusted 6200 x 2450 roof covers its full corners without altering timber geometry',()=>{
 const geometry=buildVictorianHippedGeometry({inputs:{widthMM:6200,projMM:2450,pitchDeg:15,soffitMM:150,leftEndType:'edwardian',rightEndType:'edwardian',requestedSidePitchDeg:27.7},materials});
 const before=JSON.stringify(geometry),a=build({geometry,materials});
 expect(a.valid).toBe(true);expect(a.hipTiles).toBe(6);
 expect(a.edges.every(e=>e.lengthMM>3135&&e.centreLineLengthMM<3135)).toBe(true);
 expect(JSON.stringify(geometry)).toBe(before);
});
test('all end combinations partition the roof and retain whole stock ordering',()=>{
 for(const leftEndType of ['victorian','edwardian','wall'])for(const rightEndType of ['victorian','edwardian','wall']){
  const geometry=buildVictorianHippedGeometry({inputs:{...victorianHippedDefaults,leftEndType,rightEndType,requestedSidePitchDeg:25},materials});
  for(const productId of ['britmetShingle','liteSlate']){
   const a=build({geometry,productId,materials});expect(a.valid).toBe(true);expect(a.facets.length).toBe(geometry.facets.length);expect(a.edges.length).toBe(geometry.hips.length);
   expect(a.internalRows.every(r=>r.spacingMM<=400+1e-7)).toBe(true);
   expect(a.result.tileQuantityOrdered).toBe(Math.ceil(a.result.tileQuantityRaw)+(productId==='britmetShingle'?2:0));
   if(productId==='liteSlate')expect(a.hipSupportM).toBe(0);
  }
 }
});
test('polygon sections preserve changes of width between corners',()=>{
 const facet={baseWidthMM:4000,topWidthMM:0,heightMM:1000,pitchDeg:20,outline:[{xMM:0,yMM:0},{xMM:4000,yMM:0},{xMM:4000,yMM:500},{xMM:0,yMM:1000}]};
 expect(widthAtFacetPosition(facet,250)).toBe(4000);expect(widthAtFacetPosition(facet,750)).toBe(2000);
 expect(calculateRoofTiling({facets:[facet],product:'britmetShingle'}).facetAreaM2).toBe(3);
});
test('steel hip tolerance and shared half allocations supply whole stock',()=>{
 const short=orderSteelHipRidgeRuns([{lengthMM:3753},{lengthMM:3753}]);expect(short.reduce((n,e)=>n+e.tileQty,0)).toBe(6);
 const longer=orderSteelHipRidgeRuns([{lengthMM:4280},{lengthMM:4280}]);expect(longer.reduce((n,e)=>n+e.tileQty,0)).toBe(7);
});
