import {buildEdwardianGeometry} from './edwardianGeometry';
import {edwardianSideEditorPatch,resolveEdwardianRearTrusses,resolveEdwardianSideJacks} from './edwardianSideLayout';
const inputs={widthMM:4700,projMM:3200,pitchDeg:20};
test('moving boss truss updates front pitch while preserving side pitch and height',()=>{
 const g=buildEdwardianGeometry({inputs});
 const result=edwardianSideEditorPatch({inputs,geometry:g,side:'left',rows:[
  {role:'wall-truss',centreMM:31.5},{role:'truss',centreMM:650},{role:'boss-truss',centreMM:900},
  {role:'jack',centreMM:1482},{role:'jack',centreMM:2147},{role:'jack',centreMM:2800},
 ]});
 expect(result.valid).toBe(true);
 const next=buildEdwardianGeometry({inputs:{...inputs,...result.patch}});
 expect(next.valid).toBe(true);expect(next.terminalTrussCentreMM).toBeCloseTo(900,7);
 expect(next.ridgeEndYMM).toBeCloseTo(933,7);expect(next.pitchDeg).toBe(20);
 expect(next.finishedHeightMM).toBe(g.finishedHeightMM);
 expect(next.layout.centresMM[1]).toBe(650);
 const pitchEdit=buildEdwardianGeometry({inputs:{...inputs,...result.patch,frontPitchDeg:21}});
 expect(pitchEdit.valid).toBe(true);expect(pitchEdit.terminalTrussCentreMM).not.toBe(next.terminalTrussCentreMM);
});
test('wall truss remains fixed and truss slots cannot overlap',()=>{
 expect(resolveEdwardianRearTrusses([60],817).valid).toBe(false);
 expect(edwardianSideEditorPatch({inputs,geometry:buildEdwardianGeometry({inputs}),side:'left',rows:[{role:'wall-truss',centreMM:40},{role:'boss-truss',centreMM:900}]}).valid).toBe(false);
});
test('side jacks clear boss truss and hip seats',()=>{
 const args={side:'left',terminalMM:817,projectionMM:3200,widthMM:4700,ridgeEndYMM:850};
 expect(resolveEdwardianSideJacks([850],args).valid).toBe(false);
 expect(resolveEdwardianSideJacks([3150],args).valid).toBe(false);
 expect(resolveEdwardianSideJacks([1482,2147,2800],args).valid).toBe(true);
});
