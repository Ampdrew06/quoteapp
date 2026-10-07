import { buildChamferedLathHeightAudit } from './chamferedLathHeightAudit';
import { calculateHippedLeanToGeometry } from '../geometry/hippedLeanToGeometry';
const build = extra => calculateHippedLeanToGeometry({widthMM:4050,projectionMM:2885,pitchDeg:15,soffitDepthMM:150,
 hippedSides:'both',sideSoffitMode:'specified',specifiedSideSoffitMM:100,
 materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_thickness_mm:10},...extra});
test('factory roof aligns the lath outside face while preserving the controlled side',()=>{
 const geometry=build();
 geometry.frontTemplateDebug={...geometry.frontTemplateDebug,horizontalFootRunMM:223,plumbCutHeightMM:168.01};
 const before=JSON.stringify(geometry);
 const audit=buildChamferedLathHeightAudit({geometry});
 expect(audit.valid).toBe(true);
 const front=audit.rows.find(r=>r.id==='front'),side=audit.rows.find(r=>r.id==='left');
 expect(front.hfcMM).toBe(223);
 expect(front.lathVerticalHeightMM).toBeCloseTo(25/Math.cos(15*Math.PI/180),9);
 expect(side.lathVerticalHeightMM).toBeCloseTo(25/Math.cos(side.pitchDeg*Math.PI/180),9);
 expect(front.vfcChangeMM).toBeGreaterThan(2);
 expect(front.vfcChangeMM).toBeLessThan(3);
 expect(front.candidateHfcMM).toBeLessThan(front.hfcMM);
 expect(front.externalEdgeChangeMM).toBeLessThan(0);
 expect(side.hfcChangeMM).toBe(0);
 audit.rows.forEach(r=>expect(r.candidateFinishedHeightMM).toBeCloseTo(audit.targetFinishedHeightMM,9));
 expect(JSON.stringify(geometry)).toBe(before);
});
test('equal pitch and equal foot cuts require no correction',()=>{
 const p={pitchDeg:15,horizontalFootRunMM:223,plumbCutHeightMM:168};
 const audit=buildChamferedLathHeightAudit({geometry:{frontTemplateDebug:p,leftTemplateDebug:p,hasLeftHip:true}});
 expect(audit.currentHeightSpreadMM).toBe(0);
 audit.rows.forEach(r=>expect(r.hfcChangeMM).toBe(0));
});
test('front-led and right-controlled one-sided arrangements select the existing control',()=>{
 const automatic=buildChamferedLathHeightAudit({geometry:build({sideSoffitMode:'automatic'})});
 expect(automatic.controlId).toBe('front');
 const right=buildChamferedLathHeightAudit({geometry:build({hippedSides:'right',sideSoffitControlSide:'right'})});
 expect(right.controlId).toBe('right');expect(right.rows.length).toBe(2);
});
test('missing geometry, zero thickness and impossible cut do not invent requirements',()=>{
 expect(buildChamferedLathHeightAudit().valid).toBe(false);
 expect(buildChamferedLathHeightAudit({geometry:build(),thicknessMM:0}).valid).toBe(false);
 const geometry={sideSoffitMode:'specified',frontTemplateDebug:{pitchDeg:15,horizontalFootRunMM:1,plumbCutHeightMM:1},hasLeftHip:true,leftTemplateDebug:{pitchDeg:30,horizontalFootRunMM:100,plumbCutHeightMM:200}};
 expect(buildChamferedLathHeightAudit({geometry}).valid).toBe(false);
});
