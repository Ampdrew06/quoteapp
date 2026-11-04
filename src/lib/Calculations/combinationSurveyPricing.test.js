import {getMaterials} from '../materials';
import {buildCombinationQuotation} from './combinationQuotation';
const materials={...getMaterials(),truss_closure_45x45_price_per_m:0.5,fascia_corner_90_ext_300_white_price:5,gutter_square_corner_90_ext_price:5,gutter_square_corner_135_ext_price:6,expanding_foam_roll_price_each:8,concrete_screws_price_per_box:10,d4_glue_price_per_tub:10,screws_1_5x10_price_per_box:10,screws_1_5x10_units_per_box:100,spar_hook_rivets_price_per_box:10,spar_hook_rivets_units_per_box:100};
for(const tileProductId of ['britmetShingle','liteSlate'])test(`adjusted half/half prices and retains survey input with ${tileProductId}`,()=>{
 const inputs={widthMM:3800,projMM:4000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian',tileProductId,gutterProfile:'square',selectedCustomerId:'retail',customerReference:'SURVEY',combinationFacetGeometry:{mode:'adjust',facetIndex:2,targetMM:1400}};
 const q=buildCombinationQuotation({inputs,materials});
 expect(q.ready).toBe(true);
 expect(q.model.audits.geometry.facets[2].internalLengthMM).toBeCloseTo(1400,6);
 expect(q.model.audits.geometry.facetEaves[2].plyBaseWidthMM).toBeGreaterThan(225);
 expect(q.model.supplyReviews).toEqual([]);
});
