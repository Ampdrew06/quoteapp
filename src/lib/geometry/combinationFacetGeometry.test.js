import {resolveCombinationFacetGeometry} from './combinationFacetGeometry';
import {buildCombinationGeometry} from './combinationGeometry';
import {buildCombinationSummaryMaterialsModel} from '../Calculations/combinationQuotation';
const dimensions={widthMM:4000,projectionMM:3000};
test('a mixed chamfer retains square corners and compensated angles',()=>{
 for(const leftSide of ['edwardian','victorian']){
  const rightSide=leftSide==='edwardian'?'victorian':'edwardian',g=resolveCombinationFacetGeometry({...dimensions,leftSide,rightSide,specification:{mode:'angles',cornerDeg:134.8}});
  expect(g.valid).toBe(true);expect(g.cornerAnglesDeg.reduce((a,b)=>a+b,0)).toBeCloseTo(360,8);expect(g.cornerAnglesDeg[leftSide==='victorian'?0:2]).toBeCloseTo(134.8,8);expect(g.cornerAnglesDeg[leftSide==='edwardian'?0:2]).toBeCloseTo(90,8);
  const measured=resolveCombinationFacetGeometry({...dimensions,leftSide,rightSide,specification:{mode:'lengths',lengthsMM:g.lengthsMM,toleranceMM:0}});expect(measured.valid).toBe(true);measured.lengthsMM.forEach((v,i)=>expect(v).toBeCloseTo(g.lengthsMM[i],7));
 }
});
test('inconsistent lengths and non-compensating square-base geometry are rejected',()=>{
 expect(resolveCombinationFacetGeometry({...dimensions,specification:{mode:'angles',cornerDeg:90}}).valid).toBe(false);
 expect(resolveCombinationFacetGeometry({...dimensions,specification:{mode:'lengths',lengthsMM:[3100,2828,1657,1828],toleranceMM:2}}).valid).toBe(false);
});
test('edited surfaces flow into material geometry without losing nominal stock fittings',()=>{
 const inputs={widthMM:4000,projMM:3000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian',tileProductId:'britmetShingle',combinationFacetGeometry:{mode:'angles',cornerDeg:134.8}},g=buildCombinationGeometry({inputs}),m=buildCombinationSummaryMaterialsModel({inputs});expect(g.valid&&m.valid).toBe(true);g.facets.forEach(f=>expect(f.pitchDeg).toBeCloseTo(25,8));expect(m.audits.geometry.cornerAnglesDeg[2]).toBeCloseTo(134.8,8);
 const qty=key=>Object.values(m.sections).flatMap(s=>s.lines).find(r=>r.key===key)?.qty;expect(qty('tiles_hipEndCaps90')).toBe(1);expect(qty('tiles_hipEndCaps135')).toBe(2);expect(qty('gutters_g_corner_135')).toBe(2);
});
test('both Victorian sides reuse the existing compensated-angle editor',()=>{
 const g=resolveCombinationFacetGeometry({...dimensions,leftSide:'victorian',rightSide:'victorian',specification:{mode:'angles',leftCornerDeg:134.8,rightCornerDeg:135.2}});expect(g.valid).toBe(true);expect(g.lengthsMM).toHaveLength(5);expect(g.cornerAnglesDeg[0]+g.cornerAnglesDeg[1]).toBeCloseTo(270,8);expect(g.cornerAnglesDeg[2]+g.cornerAnglesDeg[3]).toBeCloseTo(270,8);
});
