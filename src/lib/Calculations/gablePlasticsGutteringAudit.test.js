import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGablePlasticsGutteringAudit} from './gablePlasticsGutteringAudit';
const geometry=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25}});
const build=(extra={})=>buildGablePlasticsGutteringAudit({geometry,...extra});
test('independent eaves share three gutter lengths but retain two unions and two downpipe assemblies',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.counts).toMatchObject({lengths:3,unions:2,brackets:14,corners:0,outlets:2,stopEnds:4,pipes:2,offsetBends:4,clips:4,shoes:2,adaptors:2});
 expect(a.bracketsPerSide).toBe(7);expect(build({gutterProfile:'round'}).counts.adaptors).toBe(0);expect(build({gutterProfile:'ogee'}).counts.adaptors).toBe(2);
});
test('front has one central blank, paired slopes, four corners and two box joints',()=>{
 const a=build();expect(a.plasticLines.find(l=>l.key==='boxEnd').qty).toBe(1);expect(a.frontRows).toHaveLength(2);expect(a.frontRows.every(r=>r.widthMM===300&&r.soffitGeometryMM===150)).toBe(true);
 expect(a.plasticLines.find(l=>l.key==='corners').qty).toBe(4);expect(a.plasticLines.find(l=>l.key==='joints').qty).toBe(2);expect(a.frontJRunMM).toBeGreaterThan(3800);
});
test('box price uses white or foiled Materials entry and preserves zero',()=>{
 const materials={gable_box_end_400x1000_white_price:0,gable_box_end_400x1000_foiled_price:18};
 expect(build({materials}).plasticLines.find(l=>l.key==='boxEnd').cost).toBe(0);
 expect(build({materials,plasticsColour:'light oak'}).plasticLines.find(l=>l.key==='boxEnd').cost).toBe(18);
 expect(build().plasticLines.find(l=>l.key==='boxEnd').cost).toBeNull();
});
test('five millimetre clearance affects eaves length but leaves front soffit width unchanged',()=>{
 const a=build();expect(a.sideRows[0].runM).toBe(4.325);expect(a.frontRows[0].soffitGeometryMM).toBe(150);
 const g=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25,frontOverhangMM:100}});const b=buildGablePlasticsGutteringAudit({geometry:g});expect(g.manufacturingProjectionMM).toBe(4275);expect(b.frontRows[0].soffitGeometryMM).toBe(100);
});
test('invalid stock, profile or geometry produces an explicit audit error',()=>{
 expect(build({materials:{gutter_length_m:0}}).valid).toBe(false);expect(build({gutterProfile:'unknown'}).valid).toBe(false);expect(buildGablePlasticsGutteringAudit({}).valid).toBe(false);
});
