import { calculateHippedLeanToGeometry } from './hippedLeanToGeometry';
import { calculateJackHipSetback } from './hipPerimeterIntersection';
import { buildJackRafterManufactureAudit } from '../Calculations/jackRafterManufactureAudit';
import { buildFrontRafterManufactureProfiles } from '../Manufacturing/frontRafterManufactureProfiles';
import { buildHipPerimeterCutAudit } from '../Calculations/hipPerimeterCutAudit';
import { buildProvisionalHippedLeanToTimber } from '../Calculations/provisionalHippedLeanToTimber';
const input={widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,hippedSides:'both',
 sideSoffitMode:'specified',specifiedSideSoffitMM:100,
 materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_thickness_mm:10}};
const roofInputs={...input,roofStyle:'hippedLeanTo',projMM:2885};

test('square jack ends clear the closest hip face by five plan millimetres across angles and widths',()=>{
 for(const [x,y] of [[1442.5,2885],[1000,1000],[2100,2800]]) {
  for(const facet of ['front','side']) {
   for(const [hipWidth,jackWidth] of [[45,45],[60,45],[45,60]]) {
    const c=calculateJackHipSetback({hipWidthRunMM:x,hipProjectionRunMM:y,facet,
      hipTimberWidthMM:hipWidth,jackTimberWidthMM:jackWidth});
    expect(c.valid).toBe(true);
    const L=Math.hypot(x,y),u=x/L,v=y/L;
    // End corners on each side of the jack centreline, tested against the
    // hip's side-face normal. This checks full-width clearance, not just axes.
    const gaps=[-jackWidth/2,jackWidth/2].map(s=>facet==='front'
      ? (c.hipCentrelineSetbackMM*u+s*v-hipWidth/2)/u
      : (c.hipCentrelineSetbackMM*v+s*u-hipWidth/2)/v);
    expect(Math.min(...gaps)).toBeCloseTo(5,8);
    expect(Math.max(...gaps)).toBeCloseTo(c.farCornerGapMM,8);
   }
  }
 }
});
test('physical jack feedback is approached within ten millimetres without fitting constants to each member',()=>{
 const g=calculateHippedLeanToGeometry(input);
 const a=buildJackRafterManufactureAudit({roofInputs,geometry:g});
 const expected={R2:1357,R14:1357,R3:985,R13:985,R4:610,R12:610,R6:1690,R10:1690};
 expect(a.jacks).toHaveLength(8);
 for(const j of a.jacks) {
  expect(Math.abs(j.profile.externalSlopeLengthMM-expected[j.manufactureRef])).toBeLessThan(10);
 }
 expect(a.jacks.find(j=>j.manufactureRef==='R2').profile.externalSlopeLengthMM).toBeCloseTo(1366.152618,5);
 expect(a.jacks.find(j=>j.manufactureRef==='R6').profile.externalSlopeLengthMM).toBeCloseTo(1692.226776,5);
});
test('side positions use the house-wall plan while front profiles retain their verified wallplate-face run',()=>{
 const g=calculateHippedLeanToGeometry(input);
 const a=buildJackRafterManufactureAudit({roofInputs,geometry:g});
 const side=a.jacks.find(j=>j.manufactureRef==='R2');
 const front=a.jacks.find(j=>j.manufactureRef==='R6');
 expect(side.profile.hipCentrelinePlanRunMM).toBeCloseTo(1442.5*(2885-690)/2885,8);
 expect(front.profile.hipCentrelinePlanRunMM).toBeCloseTo(2822*777.5/1442.5,8);
 expect(side.profile.connectionGeometry.farCornerGapMM).toBeCloseTo(27.5,8);
 expect(front.profile.connectionGeometry.farCornerGapMM).toBeCloseTo(95,8);
});
test('hip keeps its confirmed internal edge and clips the centred footprint against actual outside faces',()=>{
 const g=calculateHippedLeanToGeometry(input),p=g.leftHipManufactureV2;
 expect(p.internalSlopeLengthMM).toBeCloseTo(3097.881239,5);
 expect(p.horizontalFootCutMM).toBeCloseTo(258.149637,5);
 expect(p.externalSlopeLengthMM).toBeCloseTo(3363.276571,5);
 expect(p.verticalFootCutMM).toBeCloseTo(164.583951,5);
 expect(p.perimeterFootprint.centreOffsetMM).toBe(0);
 expect(p.perimeterFootprint.projectionDirection/p.perimeterFootprint.acrossWidthDirection).toBeCloseTo(2885/1442.5,8);
 expect(p.perimeterFootprint.intersectionPoints.every(point=>Math.abs(point.yMM+g.externalProjectionMM-g.projectionMM)<1e-8)).toBe(true);
 const a=buildHipPerimeterCutAudit({geometry:g});
 expect(a.rows[0].externalSlopeLengthMM).toBeCloseTo(p.externalSlopeLengthMM,8);
});
test('steeper hook cuts cap at 18 degrees without capping plain rafters or jack cuts',()=>{
 const g=calculateHippedLeanToGeometry({...input,pitchDeg:25});
 const profiles=buildFrontRafterManufactureProfiles({geometry:g});
 const boss=profiles.find(j=>j.type==='boss-rafter').profile;
 const plain=profiles.find(j=>j.type==='rafter').profile;
 expect(boss.topCutOffSquareDeg).toBe(18);
 expect(boss.topCutDepartsFromPlumb).toBe(true);
 expect(boss.internalSlopeLengthMM).toBeCloseTo(g.rafterInternalLength-150,8);
 expect(boss.externalSlopeLengthMM).toBeCloseTo(g.rafterExternalLength-150+220*(Math.tan(18*Math.PI/180)-Math.tan(25*Math.PI/180)),8);
 expect(plain.topCutOffSquareDeg).toBe(25);
 expect(plain.externalSlopeLengthMM).toBe(g.rafterExternalLength);
 expect(g.leftHipManufactureV2.topCutOffSquareDeg).toBe(18);
});
test('timber schedule consumes the same hip and jack external cuts as manufacture',()=>{
 const g=calculateHippedLeanToGeometry(input);
 const a=buildJackRafterManufactureAudit({roofInputs,geometry:g});
 const timber=buildProvisionalHippedLeanToTimber({roofInputs,geometry:g});
 for(const jack of a.jacks) expect(timber.members.find(m=>m.id===jack.id).externalLengthMM).toBe(jack.profile.externalSlopeLengthMM);
 expect(timber.members.find(m=>m.id==='left-hip').externalLengthMM).toBe(g.leftHipManufactureV2.externalSlopeLengthMM);
});
test('single-sided and asymmetric roofs derive their own connections and remain valid',()=>{
 for(const hippedSides of ['left','right','both']) {
  const g=calculateHippedLeanToGeometry({...input,hippedSides,
    requestedLeftSidePitchDeg:25,requestedRightSidePitchDeg:30});
  const a=buildJackRafterManufactureAudit({roofInputs:{...roofInputs,hippedSides},geometry:g});
  expect(a.valid).toBe(true);
  expect(a.jacks.every(j=>j.profile.valid && j.profile.connectionGeometry.valid)).toBe(true);
  expect(g.wallplateAssembly.valid).toBe(true);
 }
});
