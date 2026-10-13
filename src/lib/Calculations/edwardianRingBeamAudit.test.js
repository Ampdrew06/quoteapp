import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianRingBeamAudit} from './edwardianRingBeamAudit';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25};
test('Edwardian ring-beams use shared layer cuts and full side fixing laths',()=>{
 const a=buildEdwardianRingBeamAudit({geometry:buildEdwardianGeometry({inputs})});expect(a.valid).toBe(true);expect(a.ringBeams).toHaveLength(3);
 const left=a.ringBeams[0],front=a.ringBeams[1];expect(left.layerProfiles.outerLath25x50.externalEdgeLengthMM).toBe(3775);expect(front.layerProfiles.outerLath25x50.externalEdgeLengthMM).toBeCloseTo(3900,1);
 expect(left.layerProfiles.pse30x90.externalEdgeLengthMM).toBe(3645);expect(front.layerProfiles.pse30x90.externalEdgeLengthMM).toBe(3750);expect(front.layerProfiles.ply9Base.endSquareLegMM).toBeCloseTo(5,1);
});
test('upstands follow actual slots including rear datum and corner hip seats',()=>{
 const a=buildEdwardianRingBeamAudit({geometry:buildEdwardianGeometry({inputs})});const left=a.ringBeams[0],front=a.ringBeams[1];
 expect(left.startOffsetMM).toBe(7.5);expect(left.bayWidthsMM).toEqual([617,472.25,472.25,617,617,411]);expect(front.bayWidthsMM).toEqual([378,617,617,617,617,378]);
 expect(left.upstandRuns[0].startMM).toBe(55.5);expect(left.upstandRuns[left.upstandRuns.length-1].endMM).toBe(3502);expect(left.dimensions.upstandHeightMM).toBe(195);expect(left.dimensions.pirHeightMM).toBe(185);
});
test('schedule totals count all three beams once',()=>{
 const a=buildEdwardianRingBeamAudit({geometry:buildEdwardianGeometry({inputs})});expect(a.schedule.members).toHaveLength(3);expect(a.schedule.totals.pse30x90LengthM).toBeCloseTo(11.04,8);
 expect(a.schedule.totals.outerFixingLath25x50LengthM).toBeCloseTo(11.45,4);expect(a.ringBeams.reduce((n,b)=>n+b.upstandCount,0)).toBe(18);
});
test('different front pitch retains shared unequal-base joint construction',()=>{const a=buildEdwardianRingBeamAudit({geometry:buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'frontPitch',frontPitchDeg:30}})});expect(a.valid).toBe(true);expect(a.ringBeams.every(b=>b.jointRule==='rectangular-independent-layers')).toBe(true);expect(a.ringBeams[1].layerProfiles.outerLath25x50.externalEdgeLengthMM).toBeCloseTo(a.ringBeams[1].externalLengthMM-100,8);});
test('invalid geometry produces no ring-beam cuts',()=>{expect(buildEdwardianRingBeamAudit({geometry:{valid:false}}).valid).toBe(false);});
