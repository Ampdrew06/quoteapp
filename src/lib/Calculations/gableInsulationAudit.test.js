import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTimberAudit} from './gableTimberAudit';
import {buildGableInsulationAudit} from './gableInsulationAudit';
const materials={pir50:{sheet_w_m:1.2,sheet_h_m:2.4,price_per_sheet:20,weight_kg_per_m2:1.6,waste_pct:5},pir100:{sheet_w_m:1.2,sheet_h_m:2.4,price_per_sheet:30,weight_kg_per_m2:3},superquilt_options:[{coverage_m2:12,price_per_roll:80},{coverage_m2:15,price_per_roll:100}],superquilt_weight_kg_per_m2:0.6,breather_weight_kg_per_m2:0.18,breather_roll_price_each:30};
const build=(extra={})=>{const g=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25,...extra}});const t=buildGableTimberAudit({geometry:g,materials});return {g,t,a:buildGableInsulationAudit({geometry:g,timberAudit:t,materials})};};
test('front full face retains joint components while charging only plywood beyond the existing outer gusset',()=>{
 const {g,t}=build();expect(t.componentCounts.gussets).toBe(16);
 expect(t.frontFace.fullAreaM2).toBeGreaterThan(g.truss.gusset.areaEachM2);
 expect(t.frontFace.additionalAreaM2+g.truss.gusset.areaEachM2).toBeCloseTo(t.frontFace.fullAreaM2,8);
 expect(t.lines.find(l=>l.key==='frontFace').quantity).toBe(t.frontFace.additionalAreaM2);
});
test('rear/front cradles have one face and intermediate cradles two, ending at gusset edges',()=>{
 const {g,a}=build();expect(a.valid).toBe(true);expect(a.cradle.facesPerSide).toBe(14);
 const run=(1900+70-595/2)/Math.cos(25*Math.PI/180);expect(a.cradle.runMM).toBeCloseTo(run,8);
 expect(a.slab.runMM).toBeCloseTo((1900+70)/Math.cos(25*Math.PI/180),8);
 expect(a.cradle.runMM).toBeLessThan(a.slab.runMM);
 expect(a.cradle.netAreaM2).toBeCloseTo(28*run/1000*0.14,8);
 expect(build({leftSoffitMM:100}).a.cradle.netAreaM2).toBeCloseTo(a.cradle.netAreaM2,8);
 expect(a.slab.clearBayWidthsMM).toEqual(g.layout.gapsMM.map(gap=>gap-45));
});
test('PIR50 pools ring-beam faces and cradles once before sheet rounding; PIR100 uses actual bays',()=>{
 const {g,t,a}=build();expect(a.pir50.netAreaM2).toBeCloseTo(a.cradle.netAreaM2+t.schedule.totals.pir50AreaM2,8);
 expect(a.pir50.sheets).toBe(Math.ceil(a.pir50.netAreaM2*1.05/2.88));expect(a.pir50.cost).toBe(a.pir50.sheets*20);
 expect(a.pir100.netAreaM2).toBeCloseTo(g.layout.gapsMM.reduce((s,gap)=>s+gap-45,0)*2*a.slab.runMM/1e6,8);
 expect(a.pir100.installedWeightKg).toBeCloseTo(a.pir100.netAreaM2*3,8);
});
test('ceiling includes the flat once while membrane follows independent external faces',()=>{
 const {g,a}=build();expect(a.ceiling.areaM2).toBeCloseTo(((3800-595)/Math.cos(25*Math.PI/180)+595)*4100/1e6,8);
 expect(a.superQuilt.installedWeightKg).toBeCloseTo(a.ceiling.areaM2*0.6,8);
 expect(a.superQuilt.coverageM2).toBeGreaterThanOrEqual(a.superQuilt.nominalM2);
 expect(a.plasterboard.installedWeightKg).toBeCloseTo(a.ceiling.areaM2*8.5,8);expect(a.plasterboard.supplyIncluded).toBe(false);
 expect(a.membrane.installedAreaM2).toBeCloseTo(g.manufacturingProjectionMM*g.feet.reduce((s,f)=>s+f.externalSlopeMM+50/Math.cos(g.pitchDeg*Math.PI/180),0)/1e6,8);expect(a.membrane.rolls).toBe(1);
});
test('invalid inputs produce no audit and invalid quilt overlap is flagged',()=>{
 expect(buildGableInsulationAudit({}).valid).toBe(false);const {g,t}=build();
 expect(buildGableInsulationAudit({geometry:g,timberAudit:t,materials:{...materials,superquilt_overlap_mm:1200}}).valid).toBe(false);
});

test('PIR100 uses the same flat Materials weight rate as Summary, preserving explicit zero',()=>{
 const {g,t}=build();
 const a=buildGableInsulationAudit({geometry:g,timberAudit:t,materials:{...materials,pir100_weight_kg_per_m2:3.125}});
 expect(a.pir100.installedWeightKg).toBeCloseTo(a.pir100.netAreaM2*3.125,8);
 const zero=buildGableInsulationAudit({geometry:g,timberAudit:t,materials:{...materials,pir100_weight_kg_per_m2:0}});
 expect(zero.pir100.installedWeightKg).toBe(0);
 const pack=buildGableInsulationAudit({geometry:g,timberAudit:t,materials:{...materials,pir100:{...materials.pir100,weight_kg_per_m2:null},pir100_pack_coverage_m2:2.88,pir100_weight_kg_per_pack:9}});
 expect(pack.pir100.installedWeightKg).toBeCloseTo(pack.pir100.netAreaM2*9/2.88,8);
});
test('front overhang changes external coverage but never extends the internal ceiling',()=>{
 const normal=build().a,extended=build({frontOverhangMM:300}).a;
 expect(extended.superQuilt.installedAreaM2).toBe(normal.superQuilt.installedAreaM2);
 expect(extended.plasterboard.installedAreaM2).toBe(normal.plasterboard.installedAreaM2);
 expect(extended.membrane.installedAreaM2).toBeGreaterThan(normal.membrane.installedAreaM2);
});
