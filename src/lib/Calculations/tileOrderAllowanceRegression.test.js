import { buildAutomaticRoofTiling } from './automaticRoofTiling';
import { calculateRoofTiling } from './facetTilingCalc';
import { applyUniversalTilingToSummaryLines } from './summaryTilingBOM';

const roofInputs={widthMM:4050,projMM:2885,pitchDeg:15,soffit_mm:150,
 roofStyle:'hippedLeanTo',hippedSides:'both',leftHip:true,rightHip:true,
 leftHipWidthMM:1442.5,rightHipWidthMM:1442.5,
 sideSoffitMode:'specified',specifiedSideSoffitMM:100,tileSystem:'britmet'};
const materials={side_frame_thickness_mm:70,fascia_lip_mm:25,frame_on_mm:70};
test('factory test roof includes two spare steel tiles once and matches manual entry of the same facets',()=>{
 const automatic=buildAutomaticRoofTiling({roofInputs,materials});
 const manual=calculateRoofTiling({product:'britmetShingle',facets:automatic.geometry.facets.map(f=>({...f.geometry.tiling,pitchDeg:f.geometry.pitchDeg}))});
 expect(automatic.errors).toEqual([]);
 expect(automatic.result.tileQuantityRaw).toBeCloseTo(48.531659,5);
 expect(automatic.result.tileQuantityRounded).toBe(49);
 expect(automatic.result.orderAllowanceTiles).toBe(2);
 expect(automatic.result.tileQuantityOrdered).toBe(51);
 expect(manual.tileQuantityOrdered).toBe(automatic.result.tileQuantityOrdered);
 const summary=applyUniversalTilingToSummaryLines({lines:[{key:'tile_britmet',qty:0,unitPrice:6.12}],automaticResult:automatic.result});
 expect(summary.lines[0].qty).toBe(51);
 expect(summary.lines[0].line).toBeCloseTo(51*6.12,8);
});
