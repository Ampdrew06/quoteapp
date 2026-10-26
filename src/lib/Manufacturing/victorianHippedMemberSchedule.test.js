import {buildVictorianHippedGeometry,victorianHippedDefaults as inputs} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedMemberSchedule as build} from './victorianHippedMemberSchedule';
const geometry=buildVictorianHippedGeometry({inputs});
const distance=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);

test('review schedule includes every hip and applied rafter with positive cut dimensions',()=>{
 const r=build({geometry,inputs});expect(r.valid).toBe(true);
 expect(r.counts).toEqual({hips:4,bossRafters:4,rafters:3,jacks:6});expect(r.members).toHaveLength(17);
 r.members.forEach(m=>{
  expect(m.topEdgeMM).toBeGreaterThan(0);expect(m.bottomEdgeMM).toBeGreaterThan(0);expect(m.verticalFootCutMM).toBeGreaterThan(0);
  expect(distance(m.points[0],m.points[1])).toBeCloseTo(m.bottomEdgeMM,6);
  expect(distance(m.points[2],m.points[3])).toBeCloseTo(m.topEdgeMM,6);
  expect(distance(m.points[1],m.points[2])).toBeCloseTo(m.topCutLengthMM,6);
 });
});
test('hip plan allowance and boss-rafter slope allowance are deducted exactly once',()=>{
 const base=build({geometry,inputs}),hip=base.members.find(m=>m.ref==='H1'),changed=build({geometry,inputs:{...inputs,hipBossPlanMM:166}}).members.find(m=>m.ref==='H1');
 expect(hip.bottomEdgeMM-changed.bottomEdgeMM).toBeCloseTo(10/Math.cos(hip.pitchDeg*Math.PI/180),6);
 expect(hip.topEdgeMM-changed.topEdgeMM).toBeCloseTo(10/Math.cos(hip.pitchDeg*Math.PI/180),6);
 const boss=base.members.find(m=>m.role==='boss-rafter'),changedBoss=build({geometry,inputs:{...inputs,bossRafterSlopeMM:160}}).members.find(m=>m.ref===boss.ref);
 expect(boss.bottomEdgeMM-changedBoss.bottomEdgeMM).toBeCloseTo(10,6);expect(boss.topEdgeMM-changedBoss.topEdgeMM).toBeCloseTo(10,6);
});
test('jack profiles use their supporting hip and no boss or wallplate deduction',()=>{
 const r=build({geometry,inputs});r.members.filter(m=>m.role==='jack').forEach(m=>{
  expect(m.jackConnection.valid).toBe(true);expect(m.jackConnection.closestCornerGapMM).toBe(5);
  expect(m.wallplateFacePlanMM).toBe(0);expect(m.bossAllowancePlanMM).toBe(0);expect(m.bossAllowanceSlopeMM).toBe(0);
 });
});
test('mirrored hips and skewed boss rafters retain matching cutting lengths',()=>{
 const r=build({geometry,inputs});for(const [a,b] of [['H1','H4'],['H2','H3'],['R3','R11']]){
  const first=r.members.find(m=>m.ref===a),second=r.members.find(m=>m.ref===b);
  expect(first.topEdgeMM).toBeCloseTo(second.topEdgeMM,6);expect(first.horizontalFootCutMM).toBeCloseTo(second.horizontalFootCutMM,6);
 }
});
test('invalid connection allowances do not produce cutting profiles',()=>{
 for(const patch of [{hipBossPlanMM:100000},{bossRafterSlopeMM:-1},{memberWallplateFaceMM:''},{hipBossPlanMM:Infinity}])expect(build({geometry,inputs:{...inputs,...patch}}).valid).toBe(false);
});
