import {buildCombinationGeometry} from './combinationGeometry';
test('single-facet edits recalculate adjacent dimensions and pitch without skewing the base',()=>{
 const g=buildCombinationGeometry({inputs:{widthMM:3800,projMM:4000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian',combinationFacetGeometry:{mode:'adjust',facetIndex:2,targetMM:1400}}});
 expect(g.valid).toBe(true);
 expect(g.facets[2].internalLengthMM).toBeCloseTo(1400,6);
 expect(g.facets[1].internalLengthMM).toBeCloseTo(2950.739239,5);
 expect(g.facets[2].pitchDeg).toBeCloseTo(24.021976,5);
 expect(g.cornerAnglesDeg[1]+g.cornerAnglesDeg[2]).toBeCloseTo(270,6);
 expect(g.appliedFacetGeometry.requiresManufactureReview).toBe(true);
});
