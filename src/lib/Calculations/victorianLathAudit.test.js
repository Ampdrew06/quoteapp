import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianSurfaceAreas} from '../geometry/victorianSurfaceAreas';
import {buildVictorianLathAudit,buildVictorianInternalLaths} from './victorianLathAudit';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'},materials={chamferLath:{price_per_m:0.6,weight_kg_per_m:0.5},lath25x50:{price_per_m:0.7},lath_stock_length_m:4.8};
const geometry=patch=>buildVictorianGeometry({inputs:{...base,...patch}}),build=(productId='britmetShingle',patch={},m=materials)=>buildVictorianLathAudit({geometry:geometry(patch),materials:m,productId});
test('Victorian external laths reuse five complete developed facets with steel225/255 set-out',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.facets).toHaveLength(5);
 a.result.facets.forEach(f=>{expect(f.lathRows[0].kind).toBe('chamferedPerimeter');expect(f.lathRows[1].yMM).toBe(225);expect(f.lathRows[2].yMM-f.lathRows[1].yMM).toBe(255);});
 const area=a.facets.reduce((n,f)=>n+(f.baseWidthMM+f.topWidthMM)*f.heightMM/2e6,0),actual=buildVictorianSurfaceAreas({geometry:geometry(),eavesExtensionMM:160});expect(area).toBeCloseTo(actual.areaM2,6);
 const rows=a.result.facets.flatMap(f=>f.lathRows).reduce((n,r)=>n+r.widthMM/1000,0);expect(a.lines.find(l=>l.key==='field').lengthM+a.lines.find(l=>l.key==='chamfer').lengthM).toBeCloseTo(rows,8);
});
test('steel full hip/ridge support includes boss region and is independent of timber allowance',()=>{
 const a=build(),b=build('britmetShingle',{bossTopContinuationMM:170});expect(a.support.rows).toHaveLength(5);expect(a.support.quantities.hipLathM).toBeCloseTo(4*2*2.1284885800775664,8);expect(a.support.quantities.ridgeLathM).toBeCloseTo(2*1.909,8);expect(a.support.quantities.tapeLengthM).toBe(a.support.quantities.hipLathM);expect(a.support.quantities.additionalLathM).toBeCloseTo(b.support.quantities.additionalLathM,8);
});
test('Metrotile shares steel set-out while both slate coverings omit support and foam tape',()=>{
 const a=build(),b=build('metrotileShingle');expect(a.newLathM).toBe(b.newLathM);
 for(const product of ['liteSlate','tapcoSlate']){const s=build(product);expect(s.valid).toBe(true);expect(s.support.quantities.additionalLathM).toBe(0);expect(s.support.quantities.tapeLengthM).toBe(0);expect(s.result.facets.some(f=>f.lathRows.some(r=>r.kind==='ridgeFinishing'))).toBe(false);s.facets.forEach(f=>expect(f.pitchDeg).toBe(25));s.result.facets.forEach(f=>expect(f.lathRows.some(r=>Math.abs(r.yMM-315)<1e-7)).toBe(true));expect(s.lines.find(l=>l.key==='hipSupport').cost).toBe(0);}
});
test('internal laths follow all ceiling slopes within400mm with two flat runs and no soffit growth',()=>{
 const a=buildVictorianInternalLaths({geometry:geometry()}),b=buildVictorianInternalLaths({geometry:geometry({soffitMM:150,soffitMode:'standard'})});expect(a.valid).toBe(true);expect(a.flatRows).toBe(2);expect(new Set(a.rows.map(r=>r.surface)).size).toBe(6);a.rows.forEach(r=>{expect(r.lengthMM).toBeGreaterThan(0);expect(r.slopeSpacingMM).toBeLessThanOrEqual(400+1e-6);});expect(a.totalLengthM).toBeCloseTo(b.totalLengthM,8);
});
test('ring-beam uses join pooled stock without being charged again',()=>{
 const a=build();expect(a.alreadyCounted).toHaveLength(2);expect(a.ringLathM).toBeCloseTo(9.802557549166476+8.511049614278154,8);expect(a.allLathM).toBeCloseTo(a.newLathM+a.ringLathM,8);expect(a.lines.some(l=>['outerLaths','finishingLaths'].includes(l.key))).toBe(false);expect(a.knownCost).toBeCloseTo(a.lines.reduce((n,l)=>n+l.cost,0),8);expect(a.stockPlan.qty).toBeGreaterThanOrEqual(a.linearMinimumLengths);
});
test('missing rates remain unconfigured and zero rates stay valid',()=>{
 const a=build('britmetShingle',{},{});expect(a.costComplete).toBe(false);expect(a.weightComplete).toBe(false);expect(a.lines.find(l=>l.key==='field').cost).toBeNull();
 const z=build('britmetShingle',{}, {...materials,lath25x50:{price_per_m:0},chamferLath:{price_per_m:0,weight_kg_per_m:0}});expect(z.costComplete).toBe(true);expect(z.knownCost).toBe(0);expect(z.knownInstalledWeightKg).toBe(0);
});
test('unsupported product, invalid spacing/stock and jack layouts are included; invalid configurations remain blocked',()=>{
 expect(build('unknown').valid).toBe(false);expect(build('britmetShingle',{}, {...materials,lath_stock_length_m:0}).valid).toBe(false);expect(build('britmetShingle',{widthMM:4000,projMM:6500}).valid).toBe(true);expect(buildVictorianInternalLaths({geometry:geometry(),maximumSpacingMM:0}).valid).toBe(false);
});
