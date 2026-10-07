import {buildCentralBossTrussAudit} from './centralBossTrussAudit';
test('central apex independently closes both sloping edges at the retained boss height',()=>{
 const a=buildCentralBossTrussAudit();
 expect(a.valid).toBe(true);
 const p=a.sidePitchDeg*Math.PI/180;
 expect(a.boss.xMM).toBe(2025);
 expect(a.boss.yMM).toBeCloseTo(40+2885*Math.tan(15*Math.PI/180)+110,8);
 expect(a.apexBottom.yMM).toBeCloseTo(40+2025*Math.tan(p),8);
 expect(a.apexTop.yMM-a.apexBottom.yMM).toBeCloseTo(220/Math.cos(p),8);
 expect((a.apexBottom.yMM+a.apexTop.yMM)/2).toBeCloseTo(a.boss.yMM,8);
 expect(a.sidePitchDeg).toBeCloseTo(20.7062785967,8);
});
test('external and internal edges follow the stated pitch and foot cuts',()=>{
 const a=buildCentralBossTrussAudit(),m=a.members[0],p=m.pitchDeg*Math.PI/180;
 const heel=m.points[0],toe=m.points[3];
 expect(Math.hypot(a.apexBottom.xMM-heel.xMM,a.apexBottom.yMM-heel.yMM)).toBeCloseTo(m.internalSlopeMM,8);
 expect(Math.hypot(a.apexTop.xMM-toe.xMM,a.apexTop.yMM-toe.yMM)).toBeCloseTo(m.externalSlopeMM,8);
 expect(m.hfcMM*Math.tan(p)+m.vfcMM).toBeCloseTo(220/Math.cos(p),8);
 expect(m.externalSlopeMM).toBeCloseTo(2328.4024815,6);
 expect(m.topCutOffSquareDeg).toBe(m.pitchDeg);
});
test('mirrored members share exactly one plumb apex joint',()=>{
 const a=buildCentralBossTrussAudit();
 a.members[0].points.forEach((point,i)=>{
  expect(a.members[1].points[i].xMM).toBe(a.widthMM-point.xMM);
  expect(a.members[1].points[i].yMM).toBe(point.yMM);
 });
 expect(a.members[1].points[1]).toEqual(a.apexBottom);
 expect(a.members[1].points[2]).toEqual(a.apexTop);
});
test('chevron uses its longest outer edge and gusset uses the controlling flat width',()=>{
 const a=buildCentralBossTrussAudit(),plate=a.chevron;
 const upper=plate.points[1],lower=plate.points[2];
 expect(Math.hypot(upper.xMM-lower.xMM,upper.yMM-lower.yMM)).toBeCloseTo(143,8);
 expect(Math.hypot(upper.xMM-plate.points[0].xMM,upper.yMM-plate.points[0].yMM)).toBeCloseTo(300,8);
 expect(a.gusset.points.length).toBe(5);
 expect(a.gusset.blankWidthMM).toBe(595);
 expect(a.gusset.points[2].yMM).toBe(a.gusset.points[3].yMM);
 expect(a.gusset.points[1].xMM).toBe(a.gusset.points[2].xMM);
 expect(a.gusset.quantity).toBe(2);
 expect(a.gusset.bottomDatumConfirmed).toBe(true);
 expect(a.closure.cutLengthMM).toBe(595);
 expect(a.closure.shortEdgeMM).toBeCloseTo(595-90/Math.tan(a.sidePitchDeg*Math.PI/180),8);
});
test('adjusting the shared width leaves member geometry and chevron lengths unchanged',()=>{
 const a=buildCentralBossTrussAudit(),b=buildCentralBossTrussAudit({gussetWidthMM:700});
 expect(b.members).toEqual(a.members);
 expect(b.chevron).toEqual(a.chevron);
 expect(b.gusset.blankWidthMM).toBe(700);
 expect(b.closure.cutLengthMM).toBe(700);
});
test('obsolete stiffeners excluded and confirmed closure geometry does not mutate inputs',()=>{
 const input={widthMM:4050,projectionMM:2885,frontPitchDeg:15};const original={...input};
 const a=buildCentralBossTrussAudit(input);
 expect(input).toEqual(original);expect(a.flangeWidthMM).toBe(45);
 expect(a.eavesStiffenerQuantity).toBe(0);expect(a.closure.shortEdgeMM).toBeCloseTo(595-90/Math.tan(a.sidePitchDeg*Math.PI/180),8);
 expect(a.readOnly).toBe(true);
});
test('supports other valid spans and pitches and rejects invalid geometry',()=>{
 for(const [widthMM,projectionMM,frontPitchDeg] of [[5000,3000,20],[3500,2600,12],[6000,4000,25]])expect(buildCentralBossTrussAudit({widthMM,projectionMM,frontPitchDeg}).valid).toBe(true);
 for(const input of [{widthMM:0},{frontPitchDeg:90},{projectionMM:NaN},{sideHfcMM:10000}])expect(buildCentralBossTrussAudit(input).valid).toBe(false);
});

test('closure bottom corners share gusset corners and both end cuts lie on joist undersides',()=>{
 const a=buildCentralBossTrussAudit(),p=a.sidePitchDeg*Math.PI/180;
 const points=a.closure.points;
 expect(points[0]).toEqual(a.gusset.points[3]);expect(points[1]).toEqual(a.gusset.points[2]);
 for(const point of points){
  expect(point.yMM).toBeCloseTo(a.apexBottom.yMM-Math.abs(point.xMM-a.boss.xMM)*Math.tan(p),8);
 }
 expect(points[2].yMM-points[1].yMM).toBe(45);
 expect(points[2].xMM-points[3].xMM).toBeCloseTo(a.closure.shortEdgeMM,8);
 expect(a.closure.endAngleToLongEdgeDeg+a.closure.endCutOffSquareDeg).toBe(90);
});
test('25 degree reference gives approximately 328mm gusset slopes and calculated side height',()=>{
 const pitch=25*Math.PI/180;
 const projectionMM=(2025*Math.tan(pitch)+110/Math.cos(pitch)-110)/Math.tan(15*Math.PI/180);
 const a=buildCentralBossTrussAudit({projectionMM});
 expect(a.sidePitchDeg).toBeCloseTo(25,8);
 expect(a.gusset.slopeEdgeMM).toBeCloseTo(328.2549308913413,8);
 expect(a.gusset.sideHeightMM).toBeCloseTo(220/Math.cos(pitch),8);
 expect(a.gusset.blankHeightMM).toBeCloseTo(220/Math.cos(pitch)+297.5*Math.tan(pitch),8);
 expect(a.closure.shortEdgeMM).toBeCloseTo(595-90/Math.tan(pitch),8);
});
test('rejects gussets wider than the span and closures that cannot fit at shallow pitch',()=>{
 expect(buildCentralBossTrussAudit({gussetWidthMM:5000}).valid).toBe(false);
 expect(buildCentralBossTrussAudit({gussetWidthMM:100}).valid).toBe(false);
});
