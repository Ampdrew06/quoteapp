import {buildVictorianHippedGeometry,victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedRingBeamProfiles} from './victorianHippedRingBeamProfiles';
import {buildVictorianHippedMemberSchedule} from './victorianHippedMemberSchedule';
import {buildVictorianHippedWallplateSchedule} from './victorianHippedWallplateSchedule';

test('all nine end combinations build matching ringbeam, member and wallplate schedules',()=>{
 for(const left of ['victorian','edwardian','wall'])for(const right of ['victorian','edwardian','wall']){
  const inputs={...victorianHippedDefaults,leftEndType:left,rightEndType:right,requestedSidePitchDeg:25},geometry=buildVictorianHippedGeometry({inputs});
  const r=buildVictorianHippedRingBeamProfiles({geometry,inputs}),m=buildVictorianHippedMemberSchedule({geometry,inputs}),w=buildVictorianHippedWallplateSchedule({geometry});
  const walls=[left,right].filter(v=>v==='wall').length;
  expect(r.valid).toBe(true);expect(m.valid).toBe(true);expect(w.valid).toBe(true);
  expect(r.beams).toHaveLength(geometry.facets.length);expect(m.members).toHaveLength(geometry.hips.length+geometry.rafterLayout.members.length+walls);
  expect(w.wallbars).toHaveLength(2-walls);
  expect(w.horizontal.leftCutOffSquareDeg===0).toBe(left==='wall');expect(w.horizontal.rightCutOffSquareDeg===0).toBe(right==='wall');
 }
});
test('a mixed Victorian and Edwardian perimeter has both PSE mitre settings',()=>{
 const inputs={...victorianHippedDefaults,leftEndType:'victorian',rightEndType:'edwardian'},geometry=buildVictorianHippedGeometry({inputs}),r=buildVictorianHippedRingBeamProfiles({geometry,inputs});
 const angles=r.beams.flatMap(b=>[b.layers.pse30x90.startMitreDeg,b.layers.pse30x90.endMitreDeg]);
 expect(angles.some(a=>Math.abs(a-22.5)<1e-6)).toBe(true);expect(angles.some(a=>Math.abs(a-45)<1e-6)).toBe(true);
});
test('wall-side rafters use the front foot and have no hip/boss allowance',()=>{
 const inputs={...victorianHippedDefaults,leftEndType:'wall',rightEndType:'victorian',soffitMode:'specified',soffitMM:50},geometry=buildVictorianHippedGeometry({inputs}),m=buildVictorianHippedMemberSchedule({geometry,inputs});
 const wall=m.members.find(r=>r.ref==='WL'),foot=geometry.eaves.rows.find(e=>e.facetId==='F3');
 expect(wall.ruleSource).toBe('leanToGeometry');expect(wall.bossAllowancePlanMM).toBe(0);expect(wall.bossAllowanceSlopeMM).toBe(0);
 expect(wall.horizontalFootCutMM).toBeCloseTo(foot.horizontalFootCutMM,7);expect(wall.verticalFootCutMM).toBeCloseTo(foot.verticalFootCutMM,7);
});
