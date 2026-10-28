import {buildVictorianHippedGeometry as build,victorianHippedDefaults} from './victorianHippedGeometry';
const design=(leftEndType,rightEndType)=>build({inputs:{...victorianHippedDefaults,requestedSidePitchDeg:25,leftEndType,rightEndType}});

test('end choices independently determine facet, hip and boss topology',()=>{
 for(const left of ['victorian','edwardian','wall'])for(const right of ['victorian','edwardian','wall']){
  const g=design(left,right),ends=[left,right],v=ends.filter(e=>e==='victorian').length,e=ends.filter(x=>x==='edwardian').length;
  expect(g.valid).toBe(true);expect(g.hips).toHaveLength(2*v+e);expect(g.facets).toHaveLength(2*v+e+1);expect(g.bosses).toHaveLength(ends.filter(x=>x!=='wall').length);
  expect(g.facets.reduce((s,f)=>s+f.planAreaM2,0)).toBeCloseTo(g.internalPlanAreaM2,8);
  expect(g.internalPlanAreaM2).toBeCloseTo((g.widthMM*g.projectionMM-v*g.cornerInsetMM*g.cornerInsetMM/2)/1e6,8);
 }
});
test('a wall end removes its hip and eaves facet and supplies a fixed wall member',()=>{
 const g=design('wall','victorian');expect(g.wallMembers).toHaveLength(1);expect(g.wallMembers[0].id).toBe('WL');
 expect(g.facets.some(f=>f.id==='F1')).toBe(false);expect(g.bosses.some(b=>b.id==='BL')).toBe(false);
 expect(g.externalOutline[0].xMM).toBeCloseTo(0,8);
 expect(g.endConfigurationReviewRequired).toBe(false);
});
test('the existing double Victorian remains the default',()=>{
 const g=build({inputs:victorianHippedDefaults});expect(g.valid).toBe(true);expect(g.facets).toHaveLength(5);expect(g.hips).toHaveLength(4);
 expect(g.bossInsetMM).toBe(victorianHippedDefaults.bossInsetMM);
});
test('unknown end selections are rejected',()=>{
 expect(design('unknown','victorian').valid).toBe(false);
});
