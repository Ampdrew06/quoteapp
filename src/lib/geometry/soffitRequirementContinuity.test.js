import {buildGableSummaryMaterialsModel} from '../Calculations/gableSummaryMaterialsModel';
import {buildEdwardianSummaryMaterialsModel} from '../Calculations/edwardianSummaryMaterialsModel';
import {buildVictorianHippedSummaryMaterialsModel} from '../Calculations/victorianHippedSummaryMaterialsModel';
const base={widthMM:7304,projMM:3371,pitchDeg:17,requestedSidePitchDeg:25,soffitMM:150,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,specifiedSideSoffitMM:80};

test.each([buildGableSummaryMaterialsModel,buildEdwardianSummaryMaterialsModel,buildVictorianHippedSummaryMaterialsModel])('soffit options rebuild consistently from stored inputs',build=>{
 for(const sideSoffitMode of ['automatic','specified','none']){
  const inputs={...base,sideSoffitMode},saved=JSON.stringify(inputs),a=build({inputs}),b=build({inputs:JSON.parse(saved)});
  expect(a.valid).toBe(true);
  expect(b.materialsCostForPricing??b.knownMaterialsCost).toBe(a.materialsCostForPricing??a.knownMaterialsCost);
  expect(JSON.stringify(inputs)).toBe(saved);
 }
});
test('Gable none retains a 95mm timber foot; front overhang is independent',()=>{
 const m=buildGableSummaryMaterialsModel({inputs:{...base,sideSoffitMode:'none'}});
 expect(m.audits.geometry.feet.map(f=>f.hfcMM)).toEqual([95,95]);
 expect(m.audits.geometry.frontOverhangMM).toBe(150);
 expect(m.audits.plastics.sideRows.every(r=>r.soffitGeometryMM===0)).toBe(true);
 expect(m.audits.plastics.frontRows.every(r=>r.soffitGeometryMM===150)).toBe(true);
 expect(m.audits.plastics.soffitPlan.order.length).toBeGreaterThan(0);
 expect(m.audits.plastics.jRunM).toBeCloseTo(m.audits.plastics.frontJRunMM/1000,6);
});
test('VH none retains both side fascia lips and rejects impossible PSE clearance',()=>{
 const m=buildVictorianHippedSummaryMaterialsModel({inputs:{...base,sideSoffitMode:'none'}});
 const rows=m.audits.geometry.eaves.rows.filter(r=>r.facetId==='F1'||r.facetId==='F5');
 expect(rows.map(r=>r.plyBaseWidthMM)).toEqual([95,95]);
 expect(rows.map(r=>r.soffitStripWidthMM)).toEqual([0,0]);
 const invalid=buildVictorianHippedSummaryMaterialsModel({inputs:{...base,projMM:4371,pitchDeg:15,requestedSidePitchDeg:35,sideSoffitMode:'none'}});
 expect(invalid.valid).toBe(false);
 expect(invalid.errors.join(' ')).toContain('95mm');
});
