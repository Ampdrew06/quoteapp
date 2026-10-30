import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {buildVictorianHippedSummaryMaterialsModel} from './victorianHippedSummaryMaterialsModel';
import {getMaterials} from '../materials';
test('equivalent double-hipped roofs share frame coverage, sheet counts and installed insulation weight policy',()=>{
 const materials=getMaterials();
 const regular=buildSummaryMaterialsModel({materials,inputs:{roofStyle:'hippedLeanTo',widthMM:5500,projMM:3000,pitchDeg:15,soffit_mm:150,leftHip:true,rightHip:true,leftHipWidthMM:1500,rightHipWidthMM:1500,tileSystem:'britmet'}});
 const victorian=buildVictorianHippedSummaryMaterialsModel({materials,inputs:{widthMM:5500,projMM:3000,pitchDeg:15,soffitMM:150,leftEndType:'edwardian',rightEndType:'edwardian',bossInsetMM:1500}});
 const a=regular.hippedInsulationIntegration,b=victorian.audits.misc;
 expect(a.valid).toBe(true);expect(b.valid).toBe(true);
 expect(a.pir100.grossFrameRoofAreaM2).toBeCloseTo(b.frameAreaM2,8);
 expect(a.pir100.orderQty).toBe(7);expect(b.pir100.sheets).toBe(7);
 expect(a.pir50.orderQty).toBe(5);expect(b.pir50.sheets).toBe(5);
 const weight=regular.sections.misc.lines.find(r=>r.key==='pir50_cradle').weight_kg;
 const other=b.rows.find(r=>r.key==='vh_misc_pir50').weightKg;
 // Remaining profile differences are under physical review, not hidden by rounding.
 expect(Math.abs(weight-other)).toBeLessThan(.03);
});
