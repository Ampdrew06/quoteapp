import {buildGableGeometry,buildGableTrussLayout} from './gableGeometry';
const inputs={widthMM:3800,projMM:4200,pitchDeg:25};
test('factory Gable defaults resolve external dimensions, two straight ring-beams and centred equal-pitch trusses',()=>{
 const g=buildGableGeometry({inputs});expect(g.valid).toBe(true);
 expect(g.externalWidthMM).toBe(4240);expect(g.externalProjectionMM).toBe(4420);
 expect(g.ridgeXMM).toBe(1900);expect(g.pitchDeg).toBe(25);
 expect(g.ringBeams.map(r=>r.lengthMM)).toEqual([4425,4425]);
 expect(g.truss.sidePitchDeg).toBeCloseTo(25,8);
 expect(g.layout.centresMM[0]).toBe(31.5);expect(g.layout.centresMM[1]).toBe(696.5);
 expect(g.layout.frontCentreMM).toBe(4402.5);expect(g.layout.trussCount).toBe(8);
 expect(g.layout.gapsMM.every(gap=>gap>=400&&gap<=700)).toBe(true);
});
test('last bay is redistributed instead of leaving a 5mm gap or an 800mm bay',()=>{
 for(const projection of [1380,1490,2020,3000,4200,6700]) {
  const layout=buildGableTrussLayout({externalProjectionMM:projection});
  expect(layout.valid).toBe(true);expect(layout.gapsMM.every(gap=>gap>=400-1e-8&&gap<=700+1e-8)).toBe(true);
  expect(layout.centresMM[layout.centresMM.length-1]).toBe(projection-22.5);
 }
});
test('short roofs redistribute the second centre when necessary and flag impossible layouts',()=>{
 const short=buildGableTrussLayout({externalProjectionMM:950});
 expect(short.valid).toBe(true);expect(short.secondCentreRetained).toBe(false);
 expect(short.gapsMM).toEqual([448,448]);
 expect(buildGableTrussLayout({externalProjectionMM:300}).valid).toBe(false);
 expect(buildGableTrussLayout({externalProjectionMM:2000,minSpacingMM:0}).valid).toBe(false);
});
test('unequal soffits change individual feet without moving the ridge or changing pitches',()=>{
 const g=buildGableGeometry({inputs:{...inputs,leftSoffitMM:100,rightSoffitMM:150}});
 expect(g.valid).toBe(true);expect(g.externalWidthMM).toBe(4190);expect(g.ridgeXMM).toBe(1900);
 expect(g.feet[0].hfcMM).toBe(170);expect(g.feet[1].hfcMM).toBe(220);
 expect(g.feet[0].vfcMM).toBeGreaterThan(g.feet[1].vfcMM);
 expect(g.feet[0].internalSlopeMM).toBe(g.feet[1].internalSlopeMM);
});
test('maximum height resolves a lower pitch with a five millimetre margin',()=>{
 const normal=buildGableGeometry({inputs});
 const limited=buildGableGeometry({inputs:{...inputs,maxFinishedHeightMM:1000}});
 expect(limited.valid).toBe(true);expect(limited.pitchDeg).toBeLessThan(normal.pitchDeg);
 expect(limited.finishedHeightMM).toBeCloseTo(995,6);
 expect(buildGableGeometry({inputs:{...inputs,maxFinishedHeightMM:200}}).valid).toBe(false);
});
test('invalid dimensions, overhangs and oversized soffits do not produce cut geometry',()=>{
 for(const extra of [{widthMM:0},{projMM:0},{pitchDeg:90},{leftSoffitMM:-1},{frontOverhangMM:-1},{leftSoffitMM:1000}])expect(buildGableGeometry({inputs:{...inputs,...extra}}).valid).toBe(false);
});

test('front clearance is applied once to manufacturing without changing customer dimensions or soffit',()=>{
 const g=buildGableGeometry({inputs});expect(g.externalProjectionMM).toBe(4420);expect(g.manufacturingProjectionMM).toBe(4425);expect(g.frontSoffitClearanceMM).toBe(5);expect(g.frontOverhangMM).toBe(150);expect(g.ridgeLengthMM).toBe(4425);
});

test('retains standard centres and adjusts only the final two gaps on the example roof',()=>{
 const layout=buildGableTrussLayout({externalProjectionMM:4325});
 expect(layout.gapsMM).toEqual([665,665,665,665,665,473,473]);
 expect(layout.centresMM[1]).toBe(696.5);
});
test('setting out follows joist width and rear packer without changing slot tolerance',()=>{
 const layout=buildGableTrussLayout({externalProjectionMM:4325,joistWidthMM:47});
 expect(layout.rearCentreMM).toBe(32.5);expect(layout.centresMM[1]).toBe(697.5);
});
