import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTimberAudit} from './gableTimberAudit';
const inputs={widthMM:3800,projMM:4100,pitchDeg:25};
const materials={global_waste_percent:10,steico:{price_per_m:6,weight_kg_per_m:3,waste_percent:10},ply9mm:{price_per_m2:5,weight_kg_per_m2:5,waste_pct:10},ply18mm:{price_per_m2:8,weight_kg_per_m2:10,waste_pct:10},pse30x90:{price_per_m:1,weight_kg_per_m:1,waste_percent:10},chamferLath:{weight_kg_per_m:0.6,waste_percent:10},lath25x50:{price_per_m:0.6},lathFinish:{price_per_m:0.6},pir50:{price_per_m2:5,weight_kg_per_m2:1.6,waste_pct:5},truss_closure_45x45_price_per_m:0.5,truss_closure_45x45_weight_kg_per_m:0.4};
const build=(extra={},rates=materials)=>{const geometry=buildGableGeometry({inputs:{...inputs,...extra},materials:rates});return {g:geometry,a:buildGableTimberAudit({geometry,materials:rates})};};
const line=(a,key)=>a.lines.find(l=>l.key===key);
test('eight Gable trusses supply all truss joint components once and two square-ended ring-beams',()=>{
 const {g,a}=build();expect(a.valid).toBe(true);expect(a.readOnly).toBe(true);
 expect(a.componentCounts).toEqual({trusses:8,trussMembers:16,gussets:16,chevrons:16,closures:8,ringBeams:2,upstands:14});
 expect(line(a,'gussets').quantity).toBeCloseTo(16*g.truss.gusset.areaEachM2,8);
 expect(line(a,'chevrons').quantity).toBeCloseTo(16*g.truss.chevron.areaEachM2,8);
 expect(line(a,'closures').quantity).toBeCloseTo(4.76,8);
 for(const beam of a.ringBeams){expect(beam.internalLengthMM).toBe(4325);expect(beam.externalLengthMM).toBe(4325);expect(beam.layerProfiles.pse30x90.widthMM).toBe(95);expect(beam.endGeometry.endExtensionMM).toBe(0);}
 expect(line(a,'bases').quantity).toBeCloseTo(2*4.325*0.22,8);
});
test('ring-beam clear bays use 48mm slots and both PIR faces without a front beam',()=>{
 const {g,a}=build();expect(a.bayWidthsMM).toEqual(g.layout.gapsMM.map(gap=>gap-48));
 const clearM=a.bayWidthsMM.reduce((s,v)=>s+v,0)/1000;
 expect(line(a,'upstands').quantity).toBeCloseTo(2*clearM*0.195,8);
 expect(line(a,'upstandPir').quantity).toBeCloseTo(2*clearM*0.185*2,8);
 expect(line(a,'pse').quantity).toBeCloseTo(8.65,8);expect(a.schedule.groups).toHaveLength(1);
});
test('unequal side soffits keep distinct base widths and member lengths',()=>{
 const {g,a}=build({leftSoffitMM:100,rightSoffitMM:150});
 expect(a.ringBeams.map(b=>b.baseWidthMM)).toEqual([170,220]);expect(a.schedule.groups).toHaveLength(2);
 expect(line(a,'joists').quantity).toBeCloseTo(8*(g.feet[0].externalSlopeMM+g.feet[1].externalSlopeMM)/1000,8);
 expect(line(a,'bases').quantity).toBeCloseTo(4.325*(0.17+0.22),8);
});
test('cost adds configured waste while weight uses installed quantity and explicit zero stays configured',()=>{
 const {a}=build();const closure=line(a,'closures');
 expect(closure.cost).toBeCloseTo(4.76*1.1*0.5,8);expect(closure.installedWeightKg).toBeCloseTo(4.76*0.4,8);
 expect(a.knownCost).toBeCloseTo(a.lines.reduce((s,l)=>s+l.cost,0),8);
 const zero=build({}, {...materials,truss_closure_45x45_price_per_m:0}).a;expect(line(zero,'closures').cost).toBe(0);expect(zero.allPricesConfigured).toBe(true);
});
test('missing rates stay unconfigured and invalid geometry does not invent timber requirements',()=>{
 const a=build({}, {...materials,truss_closure_45x45_price_per_m:null,truss_closure_45x45_weight_kg_per_m:null}).a;
 expect(line(a,'closures').cost).toBeNull();expect(line(a,'closures').installedWeightKg).toBeNull();expect(a.allPricesConfigured).toBe(false);
 expect(build({widthMM:0}).a.valid).toBe(false);expect(build({widthMM:0}).a.lines).toEqual([]);
});
