import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianTimberAudit} from './victorianTimberAudit';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
const materials={global_waste_percent:10,steico:{price_per_m:10,weight_kg_per_m:2,waste_percent:12},ply9mm:{price_per_m2:5,weight_kg_per_m2:4,waste_pct:15},ply18mm:{price_per_m2:9,weight_kg_per_m2:8},pse30x90:{price_per_m:2,weight_kg_per_m:1},chamferLath:{weight_kg_per_m:0.5},lath25x50:{price_per_m:0.6},lathFinish:{price_per_m:0.7},truss_closure_45x45_price_per_m:0.5,truss_closure_45x45_weight_kg_per_m:0.4};
const build=(patch={},m=materials)=>buildVictorianTimberAudit({geometry:buildVictorianGeometry({inputs:{...base,...patch}}),materials:m});
test('reference Victorian timber audit counts accepted member and plate geometry once',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.componentCounts).toEqual({trusses:4,trussMembers:8,hips:4,intermediates:3,joistMembers:15,gussets:8,chevrons:8,closures:4,ringBeams:5,upstands:14});
 expect(a.lines.find(l=>l.key==='trussJoists').quantity).toBeCloseTo(8*a.truss.members[0].externalSlopeMM/1000,7);
 expect(a.lines.find(l=>l.key==='hipJoists').quantity).toBeCloseTo(4*1968.4885800775664/1000,7);
 expect(a.lines.find(l=>l.key==='intermediateJoists').quantity).toBeCloseTo(3*1824.9768762135227/1000,7);
 expect(a.lines.find(l=>l.key==='gussets').quantity).toBeCloseTo(8*a.truss.gusset.areaEachM2,7);expect(a.lines.find(l=>l.key==='chevrons').quantity).toBeCloseTo(8*a.truss.chevron.areaEachM2,7);
 expect(a.costComplete).toBe(true);expect(a.weightComplete).toBe(true);
});
test('ply base area is exact polygon area and upstands are one per clear bay including groove insertion',()=>{
 const a=build(),line=key=>a.lines.find(l=>l.key===key),sum=a.ringBeams.flatMap(b=>b.upstands).reduce((n,b)=>n+b.widthMM,0);
 const baseArea=a.ringBeams.reduce((n,b)=>{const p=b.layers.ply9Base;return n+(p.internalEdgeLengthMM+p.externalEdgeLengthMM)/2*p.widthMM/1e6;},0);
 expect(line('bases').quantity).toBeCloseTo(baseArea,8);expect(line('upstands').quantity).toBeCloseTo(sum*210/1e6,8);expect(line('finishingLaths').quantity).toBeCloseTo(sum/1000,8);
 const pitched=build({upstandArrangement:'pitched'});expect(line('upstands').quantity-pitched.lines.find(l=>l.key==='upstands').quantity).toBeCloseTo(sum*15/1e6,8);
 expect(line('bases').quantity).toBe(pitched.lines.find(l=>l.key==='bases').quantity);
});
test('configured material waste is applied once to cost and never to installed weight',()=>{
 const a=build(),joist=a.lines.find(l=>l.key==='trussJoists'),ply=a.lines.find(l=>l.key==='upstands');
 expect(joist.cost).toBeCloseTo(joist.quantity*1.12*10,8);expect(joist.installedWeightKg).toBeCloseTo(joist.quantity*2,8);expect(ply.cost).toBeCloseTo(ply.quantity*1.15*5,8);expect(ply.installedWeightKg).toBeCloseTo(ply.quantity*4,8);
 expect(a.knownCost).toBeCloseTo(a.lines.reduce((n,l)=>n+l.cost,0),8);
});
test('missing rates do not turn into free material and explicit zero rates remain valid',()=>{
 const a=build({},{});expect(a.costComplete).toBe(false);expect(a.weightComplete).toBe(false);expect(a.lines.find(l=>l.key==='bases').cost).toBeNull();
 const z=build({}, {...materials,steico:{price_per_m:0,weight_kg_per_m:0}});expect(z.lines.find(l=>l.key==='trussJoists').cost).toBe(0);expect(z.lines.find(l=>l.key==='hipJoists').installedWeightKg).toBe(0);expect(z.costComplete).toBe(true);
});
test('threshold and geometry changes use actual members and incomplete wider roofs cannot produce a complete audit',()=>{
 const narrow=build({widthMM:750*(1+Math.SQRT2),projMM:6500});expect(narrow.valid).toBe(true);expect(narrow.componentCounts.intermediates).toBe(0);
 expect(build({widthMM:1501*(1+Math.SQRT2),projMM:6500}).valid).toBe(false);
 expect(build({cornerAnglesDeg:[134,136,135,135]}).valid).toBe(false);expect(build({widthMM:0}).valid).toBe(false);
});
test('audit is read-only, adds no arbitrary rear packer quantity and does not include other materials',()=>{
 const g=buildVictorianGeometry({inputs:base}),before=JSON.stringify(g),rates=JSON.stringify(materials),a=buildVictorianTimberAudit({geometry:g,materials});expect(JSON.stringify(g)).toBe(before);expect(JSON.stringify(materials)).toBe(rates);expect(a.wallPackers.quantity).toBe(undefined);expect(a.lines.some(l=>/PIR|tiles|gutters/i.test(l.label))).toBe(false);
});
