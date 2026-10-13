import {buildEdwardianGeometry} from './edwardianGeometry';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25};
test('completed Edwardian reference roof sets its ridge and terminal independently',()=>{
 const g=buildEdwardianGeometry({inputs});expect(g.valid).toBe(true);expect(g.ridgeEndYMM).toBe(1770);expect(g.terminalTrussCentreMM).toBe(1737);expect(g.ridgeSetbackMM).toBe(1780);expect(g.frontPitchDeg).toBe(25);expect(g.hipPitchDeg).toBeCloseTo(18.25,1);
 expect(g.layout.frontCentreMM).toBe(1737);expect(g.layout.gapsMM.every(n=>n>=400&&n<=700)).toBe(true);expect(g.frontRafters.filter(r=>r.role==='boss-rafter')).toHaveLength(1);
});
test('equal-pitch long roof retains half-width front setback',()=>{const g=buildEdwardianGeometry({inputs:{widthMM:3000,projMM:6000}});expect(g.valid).toBe(true);expect(g.ridgeEndYMM).toBe(4500);expect(g.terminalTrussCentreMM).toBe(4467);});
test('manual ridge derives front pitch and changing front pitch reproduces the same ridge',()=>{
 const manual=buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'manual',ridgePositionMM:2000}});expect(manual.valid).toBe(true);expect(manual.frontPitchDeg).toBeGreaterThan(25);expect(manual.terminalTrussCentreMM).toBe(1967);
 const pitch=buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'frontPitch',frontPitchDeg:manual.frontPitchDeg}});expect(pitch.ridgeEndYMM).toBeCloseTo(2000,8);
});
test('restricted soffit uses shared eaves without moving ridge setting-out',()=>{const g=buildEdwardianGeometry({inputs:{...inputs,sideSoffitMode:'specified',specifiedSideSoffitMM:100}});expect(g.valid).toBe(true);expect(g.ridgeEndYMM).toBe(1770);expect(g.eaves.sideSoffitControl.requestedProjectionMM).toBe(100);});
test('invalid and impossible ridge layouts produce no usable geometry',()=>{for(const extra of [{widthMM:0},{pitchDeg:90},{projMM:1000},{ridgeMode:'manual',ridgePositionMM:3550},{ridgeMode:'frontPitch',frontPitchDeg:0}])expect(buildEdwardianGeometry({inputs:{...inputs,...extra}}).valid).toBe(false);});
