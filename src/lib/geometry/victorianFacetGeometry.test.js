import {resolveVictorianFacetGeometry as solve} from './victorianFacetGeometry';
import {buildVictorianGeometry} from './victorianGeometry';
import {normalizeVictorianDesignInputs,updateVictorianDesignInputs} from './victorianDesignInputs';
import {buildVictorianSummaryMaterialsModel} from '../Calculations/victorianSummaryMaterialsModel';
const spec={mode:'lengths',leftSideMM:2425,leftChamferMM:1380,frontMM:1375,rightChamferMM:1380,rightSideMM:2425,toleranceMM:2};
const inputs={widthMM:3332,projMM:3399,pitchDeg:25,soffitMM:150,victorianFacetGeometry:spec};
test('Tartan survey fits with explicit residuals and equal pitches',()=>{
 const g=buildVictorianGeometry({inputs});expect(g.valid).toBe(true);
 expect(g.customFacetGeometry.lengthsMM[2]).toBe(1375);
 expect(g.customFacetGeometry.lengthsMM[0]).toBeCloseTo(2425.6624176758,7);
 expect(g.customFacetGeometry.lengthsMM[1]).toBeCloseTo(1380.1624176758,7);
 expect(g.cornerAnglesDeg[0]).toBeCloseTo(134.848458674,7);
 g.facets.forEach(f=>expect(f.pitchDeg).toBeCloseTo(25,9));
 expect(buildVictorianSummaryMaterialsModel({inputs}).valid).toBe(true);
});
test('inconsistent measurements are rejected rather than silently forced',()=>{
 for(const patch of [{toleranceMM:.1},{leftChamferMM:1500},{leftSideMM:''},{frontMM:4000},{toleranceMM:-1}])expect(solve({widthMM:3332,projectionMM:3399,specification:{...spec,...patch}}).valid).toBe(false);
});
test('independent corner inputs derive compensating angles and unequal closed lengths',()=>{
 const g=buildVictorianGeometry({inputs:{...inputs,victorianFacetGeometry:{mode:'angles',leftCornerDeg:133,rightCornerDeg:137}}});
 expect(g.valid).toBe(true);g.cornerAnglesDeg.forEach((a,n)=>expect(a).toBeCloseTo([133,137,133,137][n],9));
 expect(g.facets[0].internalLengthMM).not.toBeCloseTo(g.facets[4].internalLengthMM,1);
 g.facets.forEach(f=>expect(f.pitchDeg).toBeCloseTo(25,9));
});
test('saved inputs retain measured geometry; changing width clears geometry and old supports',()=>{
 const saved=normalizeVictorianDesignInputs(JSON.parse(JSON.stringify(inputs)));
 expect(saved.victorianFacetGeometry).toEqual(spec);
 const resized=updateVictorianDesignInputs({...saved,victorianFacetPositionsMM:{'facet-2':[300]}},'widthMM',3500);
 expect(resized.victorianFacetGeometry).toBeNull();expect(resized.victorianFacetPositionsMM).toBeNull();
});
