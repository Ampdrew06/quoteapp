import {buildVictorianHippedMetalGutterSummary as build} from './victorianHippedMetalGutterSummary';
import {buildVictorianHippedTimberSummary} from './victorianHippedTimberSummary';
import {victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials=getMaterials();
test('hardware follows actual applied member roles',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials});
 expect(a.valid).toBe(true);expect(a.counts.sparHooks).toBe(2*timber.members.members.filter(p=>p.role==='hip'||p.role==='boss-rafter').length);
 expect(a.metal.rows.find(r=>r.key==='vh_m_jack_hooks').qty).toBe(timber.members.members.filter(p=>p.role==='jack').length);
 expect(a.metal.rows.find(r=>r.key==='vh_m_braces').qty).toBe(timber.geometry.hips.length);
});
test('mixed wall ends retain watercourse and use only actual gutter corners',()=>{
 const inputs={...victorianHippedDefaults,leftEndType:'wall',rightEndType:'victorian',requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials});
 expect(a.wallRuns[0].lengthMM).toBe(timber.members.members.find(p=>p.ref==='WL').topEdgeMM);
 expect(a.corners135).toBe(2);expect(a.corners90).toBe(0);
 expect(a.guttering.rows.find(r=>r.key==='vh_g_g_brkt').qty).toBe(Math.ceil(a.audit.totalRunM*1000/800)+1);
});
test('round profile omits adaptor and keeps the full downpipe assembly',()=>{
 const inputs={...victorianHippedDefaults,gutterProfile:'Round',requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials});
 expect(a.guttering.rows.some(r=>r.key==='vh_g_dp_adapt')).toBe(false);
 expect(a.guttering.rows.find(r=>r.key==='vh_g_dp_bend').qty).toBe(2);expect(a.guttering.rows.find(r=>r.key==='vh_g_dp_clip').qty).toBe(2);
});
test('supply adjustments and exclusions retain installed metal/gutter weights',()=>{
 const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},timber=buildVictorianHippedTimberSummary({inputs,materials}),a=build({timber,inputs,materials}),changed=build({timber,inputs:{...inputs,victorianHippedMetalGutterSummary:{adjustments:{vh_g_g_len:1},exclusions:{vh_m_spar:true}}},materials});
 expect(changed.guttering.rows.find(r=>r.key==='vh_g_g_len').qty).toBe(a.guttering.rows.find(r=>r.key==='vh_g_g_len').qty+1);
 expect(changed.metal.rows.find(r=>r.key==='vh_m_spar').chargeableCost).toBe(0);expect(changed.metal.totals.weight).toBe(a.metal.totals.weight);expect(changed.guttering.totals.weight).toBe(a.guttering.totals.weight);
});
