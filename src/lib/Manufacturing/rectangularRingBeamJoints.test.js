import { applyRectangularRingBeamJoints } from './rectangularRingBeamJoints';
import { calculateHippedLeanToGeometry } from '../geometry/hippedLeanToGeometry';
import { buildHippedLeanToRingBeamSchedule } from './ringBeamManufactureSchedule';
const build=(extra={})=>calculateHippedLeanToGeometry({widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,hippedSides:'both',leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100,materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_lip_mm:25},...extra});
const beam=(g,id)=>g.facets.find(f=>f.id===`facet-${id}`).ringBeam;
test('factory CAD envelope is retained and PSE has genuine 45 degree cuts across 95mm',()=>{
 const g=build(),side=beam(g,'left-side'),front=beam(g,'front');
 expect(g.externalWidthMM).toBe(4356);expect(g.externalProjectionMM).toBeCloseTo(3105.83374875377,6);
 expect(side.layerProfiles.pse30x90.internalEdgeLengthMM).toBe(2885);
 expect(side.layerProfiles.pse30x90.externalEdgeLengthMM).toBe(2980);
 expect(front.layerProfiles.pse30x90.internalEdgeLengthMM).toBe(4050);
 expect(front.layerProfiles.pse30x90.externalEdgeLengthMM).toBe(4240);
});
test('side laths run full projection and square front lath fits between their 50mm widths',()=>{
 const g=build(),left=beam(g,'left-side').layerProfiles.outerLath25x50,front=beam(g,'front').layerProfiles.outerLath25x50;
 expect(left.externalEdgeLengthMM).toBe(g.externalProjectionMM);expect(front.externalEdgeLengthMM).toBe(4256);
 expect(left.internalEdgeLengthMM).toBe(left.externalEdgeLengthMM);
 expect(front.startMitreDeg).toBe(0);expect(front.endMitreDeg).toBe(0);
 expect(front.externalEdgeLengthMM+100).toBe(g.externalWidthMM);
});
test('unequal ply bases retain 45 degrees then square clipping at the adjoining side ply',()=>{
 const g=build(),side=beam(g,'left-side').layerProfiles.ply9Base,front=beam(g,'front').layerProfiles.ply9Base;
 expect(side.widthMM).toBe(153);expect(side.externalEdgeLengthMM).toBe(3038);
 expect(front.widthMM).toBeCloseTo(220.83374875377,6);expect(front.externalEdgeLengthMM).toBe(4356);
 expect(front.startSquareLegMM).toBeCloseTo(67.83374875377,6);
 expect(front.startSquareLegMM).toBe(g.externalProjectionMM-side.externalEdgeLengthMM);expect(front.endSquareLegMM).toBeCloseTo(67.83374875377,6);
 // Independently locate the clip at the full 153mm side ply width.
 expect(front.outline[2].xMM).toBe(4203);
 expect(front.outline[2].yMM).toBeCloseTo(153,6);
 expect(front.outline[3].xMM).toBe(4203);
 expect(front.outline[3].yMM).toBe(front.widthMM);
 // Rectangular blank less two 45-degree corner triangles (153 x 153 / 2).
 expect(front.areaM2).toBeCloseTo((4356*front.widthMM-153*153)/1e6,9);
 expect(side.areaM2).toBeCloseTo((2885*153+153*153/2)/1e6,9);
});
test('mirrored sides group together while preserving the individual handed outlines',()=>{
 const g=build(),schedule=buildHippedLeanToRingBeamSchedule({geometry:g});
 expect(schedule.groups).toHaveLength(2);
 const sides=schedule.groups.find(group=>group.sides.includes('left'));
 expect(sides.quantity).toBe(2);
 expect(beam(g,'left-side').layerProfiles.pse30x90.endMitreDeg).toBe(45);
 expect(beam(g,'right-side').layerProfiles.pse30x90.startMitreDeg).toBe(45);
});
test('material totals follow the actual cut polygons and square laths',()=>{
 const g=build(),schedule=buildHippedLeanToRingBeamSchedule({geometry:g});
 expect(schedule.totals.pse30x90LengthM).toBeCloseTo((2*2980+4240)/1000,9);
 expect(schedule.totals.outerFixingLath25x50LengthM).toBeCloseTo((2*g.externalProjectionMM+4256)/1000,9);
 expect(schedule.totals.ply9BaseAreaM2).toBeCloseTo(2*0.4531095+(4356*(g.externalProjectionMM-2885)-153*153)/1e6,9);
});
test('one-sided roofs deduct only the existing side lath and do not add a phantom beam',()=>{
 for(const hippedSides of ['left','right']){
  const g=build({hippedSides}),schedule=buildHippedLeanToRingBeamSchedule({geometry:g});
  expect(schedule.members.length).toBe(2);
  expect(beam(g,'front').layerProfiles.outerLath25x50.externalEdgeLengthMM).toBe(g.externalWidthMM-50);
 }
});
test('different side widths keep their respective clipping limits and separate cut groups',()=>{
 const g=build({sideSoffitMode:'automatic',requestedLeftSidePitchDeg:25,requestedRightSidePitchDeg:30});
 const front=beam(g,'front').layerProfiles.ply9Base;
 expect(front.startOuterExtensionMM).toBeCloseTo(Math.min(front.widthMM,g.leftExternalAllowanceMM),6);
 expect(front.endOuterExtensionMM).toBeCloseTo(Math.min(front.widthMM,g.rightExternalAllowanceMM),6);
 expect(buildHippedLeanToRingBeamSchedule({geometry:g}).groups.length).toBe(3);
});
test('invalid dimensions leave the source geometry untouched',()=>{
 const facets=[{id:'test'}];expect(applyRectangularRingBeamJoints({facets,widthMM:0}).length).toBe(1);
 expect(applyRectangularRingBeamJoints({facets,widthMM:0})===facets).toBe(true);
});
