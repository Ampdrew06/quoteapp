import {buildVictorianHippedGeometry,victorianHippedDefaults as inputs} from '../geometry/victorianHippedGeometry';
import {calculateHippedLeanToGeometry} from '../geometry/hippedLeanToGeometry';
import {buildVictorianHippedWallplateSchedule as build} from './victorianHippedWallplateSchedule';
const geometry=buildVictorianHippedGeometry({inputs});
const distance=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);

test('joint-centred wallplate retains both plan boss positions and closes at the factory-floor heights',()=>{
 const s=build({geometry}),a=s.assembly;
 expect(s.valid).toBe(true);expect(a.left.B.xMM).toBeCloseTo(inputs.bossInsetMM,7);
 expect(a.right.B.xMM).toBeCloseTo(inputs.widthMM-inputs.bossInsetMM,7);
 expect(a.left.B.yMM).toBeCloseTo((a.topHeightMM+a.bottomHeightMM)/2,7);
 expect(a.left.topHeightErrorMM).toBeCloseTo(0,7);expect(a.left.internalHeightErrorMM).toBeCloseTo(0,7);
 expect(a.right.topHeightErrorMM).toBeCloseTo(0,7);expect(a.right.internalHeightErrorMM).toBeCloseTo(0,7);
});
test('wallbars share matching cuts and all drawn edge lengths match the schedule',()=>{
 const s=build({geometry});expect(s.wallbars).toHaveLength(2);
 expect(s.wallbars[0].topEdgeMM).toBeCloseTo(s.wallbars[1].topEdgeMM,7);
 s.wallbars.forEach(w=>{
  expect(distance(w.points[0],w.points[1])).toBeCloseTo(w.bottomEdgeMM,7);
  expect(distance(w.points[1],w.points[2])).toBeCloseTo(w.topCutLengthMM,7);
  expect(distance(w.points[2],w.points[3])).toBeCloseTo(w.topEdgeMM,7);
 });
 expect(distance(s.horizontal.points[0],s.horizontal.points[1])).toBeCloseTo(s.horizontal.topEdgeMM,7);
 expect(distance(s.horizontal.points[2],s.horizontal.points[3])).toBeCloseTo(s.horizontal.bottomEdgeMM,7);
 expect(s.horizontal.topEdgeMM-s.horizontal.bottomEdgeMM).toBeCloseTo(2*s.mitre.mitreOffsetMM,7);
});
test('wallplate matches the complete regular hipped lean-to calculation',()=>{
 for(const patch of [{},{widthMM:5000,projMM:3000,cornerInsetMM:800,bossInsetMM:1500,pitchDeg:15}]){
 const i={...inputs,...patch},g=buildVictorianHippedGeometry({inputs:i}),before=JSON.stringify(g),s=build({geometry:g});
 const regular=calculateHippedLeanToGeometry({widthMM:i.widthMM,projectionMM:i.projMM,pitchDeg:i.pitchDeg,soffitDepthMM:i.soffitMM,leftHipWidthMM:i.bossInsetMM,rightHipWidthMM:i.bossInsetMM,materials:{wallplate_height_mm:220,side_frame_thickness_mm:70}});
 expect(s.valid).toBe(true);expect(s.assembly).toEqual(regular.wallplateAssembly);
 expect(s.wallbars[0].topEdgeMM).toBeCloseTo(regular.leftExternalWallBarSlopeMM,7);
 expect(s.wallbars[0].bottomEdgeMM).toBeCloseTo(regular.leftInternalWallBarSlopeMM,7);
 expect(s.requiresDatumReconciliation).toBe(false);expect(s.reviewRequired).toBe(true);
 expect(JSON.stringify(g)).toBe(before);
 }
});
test('specified 50mm soffits change the wallbar foot without shifting boss centres',()=>{
 const g=buildVictorianHippedGeometry({inputs:{...inputs,soffitMode:'specified',soffitMM:50}}),s=build({geometry:g});
 expect(s.valid).toBe(true);expect(s.wallbars[0].horizontalFootCutMM).toBeGreaterThan(0);
 expect(s.assembly.left.B.xMM).toBeCloseTo(inputs.bossInsetMM,7);
});
test('insufficient horizontal joint space and invalid floor datums do not produce profiles',()=>{
 expect(build({geometry:{...geometry,widthMM:2*inputs.bossInsetMM+10}}).valid).toBe(false);
 expect(build({geometry,materials:{ring_beam_height_mm:-1}}).valid).toBe(false);
 expect(build({geometry:{valid:false,errors:['Invalid roof']}}).valid).toBe(false);
});
