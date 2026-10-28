import {resolveVictorianHippedFacetGeometry as resolve} from './victorianHippedFacetGeometry';
const base={widthMM:7304,projectionMM:3371,cornerInsetMM:1135,leftEndType:'victorian',rightEndType:'victorian'};
const measured={mode:'lengths',leftSideMM:2235,rightSideMM:2235,leftChamferMM:1615,rightChamferMM:1615,frontMM:5007,toleranceMM:2};
test('the supplied roof resolves the rounded small facets and Windows Designer angles',()=>{
 const r=resolve({...base,specification:measured});expect(r.valid).toBe(true);
 expect(r.frontLengthMM).toBeCloseTo(5007,7);expect(r.left.sideLengthMM).toBe(2235);
 expect(r.left.chamferLengthMM).toBeCloseTo(1615.4096229749282,7);
 expect(r.left.sideCornerDeg).toBeCloseTo(134.68650028600334,7);expect(r.left.frontCornerDeg).toBeCloseTo(135.31349971399666,7);
 expect(r.left.residualMM).toBeCloseTo(0.4096229749282,7);
});
test('angle mode reproduces the measured outline and supports independent ends',()=>{
 const r=resolve({...base,specification:measured});
 const a=resolve({...base,specification:{mode:'angles',leftSideMM:2235,rightSideMM:2235,leftCornerDeg:r.left.sideCornerDeg,rightCornerDeg:r.right.sideCornerDeg}});
 expect(a.valid).toBe(true);expect(a.frontLengthMM).toBeCloseTo(5007,7);
 const b=resolve({...base,specification:{mode:'angles',leftSideMM:2100,rightSideMM:2250,leftCornerDeg:133,rightCornerDeg:137}});
 expect(b.valid).toBe(true);expect(b.left.sideCornerDeg).toBeCloseTo(133,7);expect(b.right.sideCornerDeg).toBeCloseTo(137,7);
});
test('inconsistent measurements and impossible corner angles are rejected',()=>{
 for(const patch of [{frontMM:4500},{leftSideMM:4000},{leftChamferMM:1000},{toleranceMM:0},{toleranceMM:''}])expect(resolve({...base,specification:{...measured,...patch}}).valid).toBe(false);
 expect(resolve({...base,specification:{mode:'angles',leftSideMM:2235,rightSideMM:2235,leftCornerDeg:90,rightCornerDeg:135}}).valid).toBe(false);
});
test('template geometry remains the exact original 135 degree construction',()=>{
 const r=resolve(base);expect(r.valid).toBe(true);expect(r.left.widthRunMM).toBe(1135);expect(r.left.projectionRunMM).toBe(1135);expect(r.left.sideCornerDeg).toBeCloseTo(135,7);
});
