import { calculateHippedLeanToGeometry } from './hippedLeanToGeometry';
import { solveLeanToPitchForMaximumFinishedHeight, computeLeanToManufactureGeometry } from '../leanToManufactureGeometry';
const inputs={widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,hippedSides:'both',leftHipWidthMM:1443,rightHipWidthMM:1443,sideSoffitMode:'specified',specifiedSideSoffitMM:100};
const build=extra=>calculateHippedLeanToGeometry({...inputs,...extra});
test('finished height includes vertical rafter, lath and covering build-up instead of wallplate top',()=>{
 const g=build(),theta=15*Math.PI/180;
 const expected=40+2885*Math.tan(theta)+(220+25+3)/Math.cos(theta);
 expect(g.designInternalWallplateHeightMM).toBeCloseTo(813.033420,5);
 expect(g.designExternalWallplateHeightMM).toBeCloseTo(1033.033420,5);
 expect(g.finishedRoofHeightMM).toBeCloseTo(expected,8);
 expect(g.finishedRoofHeightMM>g.designExternalWallplateHeightMM).toBe(true);
});
test('hipped and regular roof covering heights share the same projection and build-up datum',()=>{
 const g=build(),regular=computeLeanToManufactureGeometry({internalProjectionMM:2885,pitchDeg:15});
 expect(g.finishedRoofHeightMM).toBeCloseTo(regular.calculatedMaximumFinishedHeightMM,2);
});
test('height-driven front pitch stays within the requested height after downward tenth-degree rounding',()=>{
 const solved=solveLeanToPitchForMaximumFinishedHeight({internalProjectionMM:2885,maximumFinishedHeightMM:1000});
 const pitchDeg=Math.floor((solved+0.000001)*10)/10;
 const g=build({pitchDeg});
 expect(g.finishedRoofHeightMM<=1000).toBe(true);
 expect(g.wallplateAssembly.left.bossCentrePositionMM).toBeCloseTo(1442.5,6);
 expect(g.wallplateAssembly.valid).toBe(true);
});
test('one-sided variants share the same highest front covering height',()=>{
 const both=build();
 for(const hippedSides of ['left','right']) expect(build({hippedSides}).finishedRoofHeightMM).toBe(both.finishedRoofHeightMM);
});
test('custom ring-beam and member depths are respected by the restriction and displayed result',()=>{
 const maximumFinishedHeightMM=1100,ringBeamHeightMM=45,rafterDepthMM=240;
 const solved=solveLeanToPitchForMaximumFinishedHeight({internalProjectionMM:2885,maximumFinishedHeightMM,ringBeamHeightMM,rafterDepthMM});
 const g=build({pitchDeg:Math.floor(solved*10)/10,materials:{ring_beam_height_mm:45,wallplate_height_mm:240}});
 expect(g.finishedRoofHeightMM<=maximumFinishedHeightMM).toBe(true);
});
test('height below the physical build-up is rejected rather than selecting an unsafe pitch',()=>{
 expect(solveLeanToPitchForMaximumFinishedHeight({internalProjectionMM:2885,maximumFinishedHeightMM:280})).toBe(null);
});
