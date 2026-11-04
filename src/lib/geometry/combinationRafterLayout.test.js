import {buildCombinationGeometry} from './combinationGeometry';
import {buildEdwardianGeometry} from './edwardianGeometry';
import {buildVictorianGeometry} from './victorianGeometry';
const inputs={widthMM:4000,projMM:3000,pitchDeg:25};
test('matching styles retain their existing automatic trusses and rafter counts',()=>{
 for(const side of ['edwardian','victorian']){
  const g=buildCombinationGeometry({inputs:{...inputs,leftSide:side,rightSide:side}}),ref=(side==='edwardian'?buildEdwardianGeometry:buildVictorianGeometry)({inputs});
  expect(g.valid).toBe(true);expect(g.layout.centresMM).toEqual(ref.layout.centresMM);
  expect(g.rafters).toHaveLength(side==='edwardian'?ref.frontRafters.length+ref.sideJacks.length:ref.intermediateBars.length+ref.jackRafters.length);
 }
});
test('mixed facet jacks are perpendicular to their ringbeam',()=>{
 const g=buildCombinationGeometry({inputs});expect(g.valid).toBe(true);
 for(const r of g.rafters){const f=g.facets.find(f=>f.id===r.facetId);expect((r.start.xMM-r.end.xMM)*(f.end.xMM-f.start.xMM)+(r.start.yMM-r.end.yMM)*(f.end.yMM-f.start.yMM)).toBeCloseTo(0,6);}
});
test('manual positions survive serialization, reject overlaps and warn on large gaps',()=>{
 const edited={...inputs,combinationRafterPositionsMM:{'facet-2':[500,1000]},combinationRearTrussPositionsMM:[400]};
 const g=buildCombinationGeometry({inputs:edited});expect(g.valid).toBe(true);expect(g.rafterGroups[1].centresMM).toEqual([500,1000]);expect(buildCombinationGeometry({inputs:JSON.parse(JSON.stringify(edited))}).rafters).toEqual(g.rafters);
 expect(buildCombinationGeometry({inputs:{...inputs,combinationRafterPositionsMM:{'facet-2':[500,510]}}}).valid).toBe(false);
 const empty=buildCombinationGeometry({inputs:{...inputs,combinationRafterPositionsMM:{'facet-2':[]}}});expect(empty.valid).toBe(true);expect(empty.rafterGroups[1].centresMM).toEqual([]);expect(empty.rafterWarnings.length).toBeGreaterThan(0);
});
