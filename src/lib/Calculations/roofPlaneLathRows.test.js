import {buildRoofPlaneLathRows} from './roofPlaneLathRows';
import {calculateHippedLeanToGeometry} from '../geometry/hippedLeanToGeometry';
import {buildHippedLeanToInsulationAudit} from './insulationIntegrationAudit';
import {buildVictorianHippedGeometry} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedCoveringAudit} from './victorianHippedCoveringAudit';
test('boundary rows and maximum spacing give independent rectangular and triangular totals',()=>{
 const f={id:'f',heightMM:1000,baseWidthMM:1000,topWidthMM:1000};
 const rectangle=buildRoofPlaneLathRows({facets:[f]});
 expect(rectangle.rows).toHaveLength(4);expect(rectangle.totalM).toBe(4);
 rectangle.rows.forEach(r=>expect(r.spacingMM).toBeLessThanOrEqual(400));
 expect(buildRoofPlaneLathRows({facets:[{...f,topWidthMM:0}]}).totalM).toBe(2);
 expect(buildRoofPlaneLathRows({facets:[f],maximumSpacingMM:0}).valid).toBe(false);
});
test('equivalent double-hipped routes have equal internal laths and ceiling area',()=>{
 const geometry=calculateHippedLeanToGeometry({widthMM:5500,projectionMM:3000,pitchDeg:15,leftHipWidthMM:1500,rightHipWidthMM:1500,hippedSides:'both',soffitDepthMM:150});
 const regular=buildHippedLeanToInsulationAudit({geometry,roofInputs:{widthMM:5500,projMM:3000,pitchDeg:15,leftHip:true,rightHip:true}});
 const other=buildVictorianHippedCoveringAudit({geometry:buildVictorianHippedGeometry({inputs:{widthMM:5500,projMM:3000,pitchDeg:15,bossInsetMM:1500,leftEndType:'edwardian',rightEndType:'edwardian',soffitMM:150}})});
 expect(regular.valid).toBe(true);expect(other.valid).toBe(true);
 expect(regular.internalLaths.totalM).toBe(54);expect(other.internalM).toBe(54);
 expect(regular.superQuilt.geometricAreaM2).toBeCloseTo(other.internal.reduce((n,f)=>n+f.areaM2,0),9);
});
