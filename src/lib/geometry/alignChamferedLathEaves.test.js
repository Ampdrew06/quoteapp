import { calculateHippedLeanToGeometry } from './hippedLeanToGeometry';
import { calculateLeanToGeometry } from './leanToGeometry';
import { buildFrontRafterManufactureProfiles } from '../Manufacturing/frontRafterManufactureProfiles';
import { buildChamferedLathHeightAudit } from '../Calculations/chamferedLathHeightAudit';
const inputs={widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,hippedSides:'both',
 sideSoffitMode:'specified',specifiedSideSoffitMM:100,
 materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_thickness_mm:10}};
test('confirmed factory baseline integrates the analytic outside-face alignment',()=>{
 const g=calculateHippedLeanToGeometry(inputs);
 const p=g.frontTemplateDebug;
 const side=g.leftTemplateDebug;
 const target=side.plumbCutHeightMM+25/Math.cos(side.pitchDeg*Math.PI/180);
 expect(p.plumbCutHeightMM+25/Math.cos(15*Math.PI/180)).toBeCloseTo(target,9);
 expect(p.horizontalFootRunMM).toBeCloseTo(213.83374875377,6);
 expect(p.plumbCutHeightMM).toBeCloseTo(170.466089619,6);
 expect(g.externalProjectionMM).toBeCloseTo(3115-(223-p.horizontalFootRunMM),6);
 expect(p.plyBaseWidthMM).toBeCloseTo(g.externalProjectionMM-inputs.projectionMM,6);
 expect(g.wallplateAssembly.valid).toBe(true);
 expect(g.resolvedLeftBossXMM).toBe(1442.5);
 const profiles=buildFrontRafterManufactureProfiles({geometry:g});
 expect(profiles.find(r=>r.type==='rafter').profile.externalSlopeLengthMM).toBeCloseTo(3142.93,2);
 expect(profiles.find(r=>r.type==='boss-rafter').profile.externalSlopeLengthMM).toBeCloseTo(2992.93,2);
 expect(g.rafterInternalLength).toBeCloseTo(2921.55,2);
 expect(buildChamferedLathHeightAudit({geometry:g}).currentHeightSpreadMM).toBeCloseTo(0,9);
});
test('one-sided and asymmetric roofs align each existing facet and close wallplate joints',()=>{
 for(const hippedSides of ['left','right','both']){
  for(const sideSoffitMode of ['automatic','specified','none']){
   const g=calculateHippedLeanToGeometry({...inputs,hippedSides,sideSoffitMode,
    sideSoffitControlSide:hippedSides==='right'?'right':'left',
    requestedLeftSidePitchDeg:25,requestedRightSidePitchDeg:30});
   expect(g.wallplateAssembly.valid).toBe(true);
   expect(buildChamferedLathHeightAudit({geometry:g}).currentHeightSpreadMM).toBeCloseTo(0,8);
  }
 }
});
test('ordinary Lean-To manufacture calculation retains its previous cut dimensions',()=>{
 const g=calculateLeanToGeometry({...inputs,soffitDepthMM:155});
 expect(g.raw.manufacturedHorizontalFootCutMM).toBe(223);
 expect(g.raw.manufacturedExternalSlopeLengthMM).toBeCloseTo(3152.42,2);
});
