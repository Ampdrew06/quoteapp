import { calculateHipPerimeterIntersection, calculateSparHookEnd } from './hipPerimeterIntersection';
import { buildHipPerimeterCutAudit } from '../Calculations/hipPerimeterCutAudit';
import { calculateHippedLeanToGeometry } from './hippedLeanToGeometry';

test('symmetric corner includes its peak intersection inside the timber width',()=>{
 const p=calculateHipPerimeterIntersection({widthRunMM:1000,projectionRunMM:1000,
  sideBaseWidthMM:200,frontBaseWidthMM:200,timberWidthMM:45});
 expect(p.valid).toBe(true);
 expect(p.horizontalFootCutMM).toBeCloseTo(200*Math.sqrt(2),8);
 expect(p.trimLengthRangeMM).toBeCloseTo(22.5,8);
 expect(p.intersectionPoints).toHaveLength(3);
});
test('steeper plan trajectory exits the front face and covers both timber edges',()=>{
 const p=calculateHipPerimeterIntersection({widthRunMM:1500,projectionRunMM:3000,
  sideBaseWidthMM:153,frontBaseWidthMM:230,timberWidthMM:45});
 expect(p.horizontalFootCutMM).toBeCloseTo(230*Math.sqrt(5)/2+11.25,8);
 expect(p.trimLengthRangeMM).toBeCloseTo(22.5,8);
 expect(p.intersectionPoints.every(q=>q.face==='front')).toBe(true);
});
test('inner-corner edge datum changes the square toe without a fixed allowance',()=>{
 const input={widthRunMM:1500,projectionRunMM:3000,sideBaseWidthMM:300,
  frontBaseWidthMM:230,timberWidthMM:45};
 const p=calculateHipPerimeterIntersection({...input,centreOffsetMM:-22.5});
 expect(p.horizontalFootCutMM).toBeCloseTo(230*Math.sqrt(5)/2+22.5,8);
 const wide=calculateHipPerimeterIntersection({...input,timberWidthMM:60,centreOffsetMM:-30});
 expect(wide.horizontalFootCutMM-p.horizontalFootCutMM).toBeCloseTo(7.5,8);
});
test('rejects missing, invalid and already outside heel geometry',()=>{
 expect(calculateHipPerimeterIntersection({}).valid).toBe(false);
 expect(calculateHipPerimeterIntersection({widthRunMM:1000,projectionRunMM:1000,
  sideBaseWidthMM:1,frontBaseWidthMM:1,timberWidthMM:45}).valid).toBe(false);
});
test('hook end follows member pitch up to 18 degrees then changes external endpoint',()=>{
 for(const pitchDeg of [13.4,15,18]) {
  const p=calculateSparHookEnd({pitchDeg});
  expect(p.topCutOffSquareDeg).toBe(pitchDeg);
  expect(p.externalEdgeAdjustmentMM).toBeCloseTo(0,8);
 }
 const p=calculateSparHookEnd({pitchDeg:25});
 expect(p.topCutOffSquareDeg).toBe(18);
 expect(p.externalEdgeAdjustmentMM).toBeCloseTo(220*(Math.tan(18*Math.PI/180)-Math.tan(25*Math.PI/180)),8);
 expect(calculateSparHookEnd({pitchDeg:90}).valid).toBe(false);
});
test('live audit checks the confirmed centreline datum without altering geometry or Summary inputs',()=>{
 const geometry=calculateHippedLeanToGeometry({widthMM:4050,projectionMM:2885,pitchDeg:15,
  soffitDepthMM:150,hippedSides:'both',sideSoffitMode:'specified',specifiedSideSoffitMM:100,
  materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_thickness_mm:10}});
 const before=JSON.stringify(geometry);
 const a=buildHipPerimeterCutAudit({geometry});
 expect(a.valid).toBe(true);expect(a.errors).toHaveLength(0);expect(a.rows).toHaveLength(2);
 expect(JSON.stringify(geometry)).toBe(before);
 for(const r of a.rows) {
  expect(r.internalSlopeLengthMM).toBe(geometry[`${r.side}HipManufactureV2`].internalSlopeLengthMM);
  expect(r.externalSlopeLengthMM-r.internalSlopeLengthMM).toBeCloseTo(r.horizontalFootCutMM/Math.cos(r.pitchDeg*Math.PI/180),8);
 }
});
