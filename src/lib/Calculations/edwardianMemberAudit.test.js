import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianMemberAudit} from './edwardianMemberAudit';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25};
test('Edwardian side jacks continue from the fixed terminal with standard centres',()=>{const g=buildEdwardianGeometry({inputs});expect(g.valid).toBe(true);expect(g.sideJacks.filter(r=>r.side==='left').map(r=>r.positionMM)).toEqual([2402,3067]);expect(g.sideLayout.gapsMM).toEqual([665,665,483]);});
test('member audit counts each truss, hip, boss rafter and jack once',()=>{const a=buildEdwardianMemberAudit({geometry:buildEdwardianGeometry({inputs})});expect(a.valid).toBe(true);expect(a.members).toHaveLength(19);expect(a.members.filter(r=>r.type==='truss-member')).toHaveLength(8);expect(a.members.filter(r=>r.type==='hip')).toHaveLength(2);expect(a.members.filter(r=>r.type==='boss-rafter')).toHaveLength(1);expect(a.members.filter(r=>r.type==='side-jack')).toHaveLength(4);expect(a.members.filter(r=>r.type==='front-jack')).toHaveLength(4);});
test('hook top cuts cap at 18 while truss apex cuts retain 25 degrees',()=>{const a=buildEdwardianMemberAudit({geometry:buildEdwardianGeometry({inputs})});expect(a.members.find(r=>r.type==='boss-rafter').profile.topCutOffSquareDeg).toBe(18);expect(a.members.find(r=>r.type==='truss-member').profile.topCutOffSquareDeg).toBe(25);expect(a.members.filter(r=>r.type==='hip').every(r=>r.profile.topCutOffSquareDeg===18)).toBe(true);});
test('manual ridge moves side jack origin and recomputes independent front member profiles',()=>{const g=buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'manual',ridgePositionMM:2000}});const a=buildEdwardianMemberAudit({geometry:g});expect(a.valid).toBe(true);expect(g.terminalTrussCentreMM).toBe(1967);expect(a.members.find(r=>r.type==='boss-rafter').profile.facetPitchDeg).toBe(g.frontPitchDeg);expect(g.sideLayout.gapsMM.every(n=>n>=400&&n<=700)).toBe(true);});
test('invalid geometry never produces cutting candidates',()=>{expect(buildEdwardianMemberAudit({geometry:{valid:false}}).valid).toBe(false);});

test('boss rafter uses measured connection face datum without a second slope deduction',()=>{
 const a=buildEdwardianMemberAudit({geometry:buildEdwardianGeometry({inputs})});const p=a.members.find(r=>r.type==='boss-rafter').profile;
 expect(p.terminalFrontFaceMM).toBe(1768.5);expect(p.bossLowerEndpointMM).toBe(1886.5);expect(p.bossConnectionHorizontalGapMM).toBe(118);
 expect(p.internalSlopeLengthMM).toBeCloseTo(1835.469168,5);expect(p.externalSlopeLengthMM).toBeCloseTo(2044.900203,5);
 expect(a.members.find(r=>r.type==='hip').profile.externalSlopeLengthMM).toBeCloseTo(2816.568,0);
 expect(a.members.find(r=>r.type==='side-jack').profile.externalSlopeLengthMM).toBeCloseTo(1441.8,0);
});
test('boss rafter at or below 18 degrees retains a plumb top without edge correction',()=>{
 const a=buildEdwardianMemberAudit({geometry:buildEdwardianGeometry({inputs:{...inputs,pitchDeg:18}})});expect(a.valid).toBe(true);
 const p=a.members.find(r=>r.type==='boss-rafter').profile;expect(p.topCutOffSquareDeg).toBe(18);expect(p.sparHookExternalEdgeAdjustmentMM).toBe(0);
 expect(p.externalSlopeLengthMM-p.internalSlopeLengthMM).toBeCloseTo(p.horizontalFootCutMM/Math.cos(Math.PI/10),8);
});
