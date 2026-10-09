import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableInternalLathAudit} from './gableInternalLathAudit';
const geometry=(extra={})=>buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25,...extra}});
test('uses the confirmed lower junction and two flat runs on the example roof',()=>{
 const a=buildGableInternalLathAudit({geometry:geometry()});
 expect(a.valid).toBe(true);expect(a.slopeRows).toBe(6);expect(a.flatRows).toBe(2);expect(a.rowCount).toBe(14);
 expect(a.rows[0].positionMM).toBe(0);expect(a.slopeGapMM).toBeLessThanOrEqual(400);expect(a.flatGapMM).toBeLessThanOrEqual(400);
 expect(a.totalLengthM).toBeCloseTo(60.55,8);expect(a.rows.every(r=>r.lengthMM===4325)).toBe(true);
});
test('side soffits do not extend the internal profile but front overhang lengthens every run',()=>{
 const original=buildGableInternalLathAudit({geometry:geometry()}),side=buildGableInternalLathAudit({geometry:geometry({leftSoffitMM:100,rightSoffitMM:200})}),front=buildGableInternalLathAudit({geometry:geometry({frontOverhangMM:250})});
 expect(side.totalLengthM).toBe(original.totalLengthM);expect(side.slopeRunMM).toBe(original.slopeRunMM);
 expect(front.rowCount).toBe(original.rowCount);expect(front.totalLengthM-original.totalLengthM).toBeCloseTo(1.4,8);
});
test('net weight excludes surplus and explicit zero rates remain configured',()=>{
 const a=buildGableInternalLathAudit({geometry:geometry(),materials:{lath25x50:{price_per_m:0},chamferLath:{weight_kg_per_m:0.65}}});
 expect(a.cost).toBe(0);expect(a.installedWeightKg).toBeCloseTo(60.55*0.65,8);
 expect(buildGableInternalLathAudit({geometry:geometry()}).cost).toBeNull();
});
test('wider flat sections add support runs instead of hard-coding two',()=>{
 const g=geometry();g.truss={...g.truss,closure:{...g.truss.closure,cutLengthMM:1600}};
 const a=buildGableInternalLathAudit({geometry:g});expect(a.valid).toBe(true);expect(a.flatRows).toBe(3);expect(a.flatGapMM).toBe(400);
 expect(buildGableInternalLathAudit({geometry:g,maximumSpacingMM:0}).valid).toBe(false);expect(buildGableInternalLathAudit({}).valid).toBe(false);
});
