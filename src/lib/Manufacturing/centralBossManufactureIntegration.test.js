import {calculateHippedLeanToGeometry} from '../geometry/hippedLeanToGeometry';
import {buildHippedLeanToManufacturingSequence} from './manufacturingSequenceBuilder';
import {buildFrontRafterManufactureProfiles} from './frontRafterManufactureProfiles';
import {buildJackRafterManufactureAudit} from '../Calculations/jackRafterManufactureAudit';
const geometry=()=>calculateHippedLeanToGeometry({widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,bossArrangement:'central',sideSoffitMode:'specified',specifiedSideSoffitMM:100,materials:{}});
test('central manufacture references contain two truss members, one boss rafter and no horizontal wallplate',()=>{
 const g=geometry(),members=buildHippedLeanToManufacturingSequence(g).members;
 expect(members.filter(m=>m.type==='wallbar')).toHaveLength(2);
 expect(members.filter(m=>m.type==='boss-rafter')).toHaveLength(1);
 expect(members.some(m=>m.id==='horizontal-wallplate')).toBe(false);
 expect(new Set(members.map(m=>m.id)).size).toBe(members.length);
 expect(new Set(members.map(m=>m.manufactureRef)).size).toBe(members.length);
});
test('central boss rafter uses the existing terminal deduction once and both hips have valid profiles',()=>{
 const g=geometry(),profiles=buildFrontRafterManufactureProfiles({geometry:g});
 expect(profiles).toHaveLength(1);expect(profiles[0].profile.bossTerminalAllowanceMM).toBe(150);
 expect(profiles[0].profile.externalSlopeLengthMM).toBeCloseTo(g.rafterExternalLength-150,5);
 expect(g.leftHipManufactureV2.valid).toBe(true);expect(g.rightHipManufactureV2.valid).toBe(true);
 expect(g.leftHipManufactureV2.externalSlopeLengthMM).toBeCloseTo(g.rightHipManufactureV2.externalSlopeLengthMM,5);
});
test('central jack profiles resolve for both front and side facets with continuous member references',()=>{
 const g=geometry(),audit=buildJackRafterManufactureAudit({geometry:g,roofInputs:{roofStyle:'hippedLeanTo',widthMM:4050,projMM:2885}});
 expect(audit.jacks.length).toBeGreaterThan(0);
 expect(audit.jacks.every(j=>j.profile.valid && !!j.manufactureRef)).toBe(true);
});
