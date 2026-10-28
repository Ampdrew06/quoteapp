import {buildVictorianHippedPlasticsSummary as build} from './victorianHippedPlasticsSummary';
import {buildVictorianHippedTimberSummary} from './victorianHippedTimberSummary';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials=getMaterials();
test('all equal pitches keep the requested standard150 soffit despite wider ply bases',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:17},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials});
 expect(a.valid).toBe(true);expect(a.runs.find(r=>r.edgeId==='F3').soffitGeometryMM).toBe(150);
 expect(a.runs.filter(r=>r.edgeId==='F1'||r.edgeId==='F5').every(r=>Math.abs(r.soffitGeometryMM-150)<0.05)).toBe(true);
});
test('mixed ends count their actual stock corner families and exclude a wall end',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25,leftEndType:'wall',rightEndType:'victorian'},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials});
 expect(a.valid).toBe(true);expect(a.runs.length).toBe(3);
 expect(a.rows.find(r=>r.key==='vh_fascia_corner_135').qty).toBe(2);expect(a.rows.find(r=>r.key==='vh_fascia_corner_90').qty).toBe(0);
});
test('H-trim is charged by consumption and excludes extra percentage waste',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials:{...materials,fascia_h_section_white_price:8,global_waste_percent:50}}),h=a.rows.find(r=>r.key==='vh_htrim');
 expect(h.qty).toBe(a.hMM);expect(h.cost).toBeCloseTo(Math.round(a.hMM/5000*8*100)/100,7);
});
test('reducing a joint count and excluding fascia retain installed weights',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials}),changed=build({timber,inputs:{...inputs,victorianHippedPlasticsSummary:{adjustments:{vh_fascia_joint:-1},exclusions:{vh_fascia:true}}},materials});
 expect(changed.rows.find(r=>r.key==='vh_fascia_joint').qty).toBe(a.rows.find(r=>r.key==='vh_fascia_joint').qty-1);
 expect(changed.rows[0].chargeableCost).toBe(0);expect(changed.totals.weight).toBe(a.totals.weight);
});
