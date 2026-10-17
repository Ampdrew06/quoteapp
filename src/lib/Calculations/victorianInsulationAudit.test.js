import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianSurfaceAreas} from '../geometry/victorianSurfaceAreas';
import {buildVictorianInsulationAudit} from './victorianInsulationAudit';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
const materials={pir50:{price_per_sheet:20,weight_kg_per_m2:1.6,sheet_w_m:1.2,sheet_h_m:2.4,waste_pct:5},pir100:{price_per_sheet:30},slab100:{pack_coverage_m2:2.88,weight_kg_per_pack:9,wastage_pct:5},superquilt_12m_price_each:60,superquilt_15m_price_each:70,superquilt_12m_weight_kg_each:7.5,breather_roll_price_each:25,breather_roll_weight_kg:9};
const geometry=patch=>buildVictorianGeometry({inputs:{...base,...patch}}),build=(patch={},m=materials)=>buildVictorianInsulationAudit({geometry:geometry(patch),materials:m});
test('five Victorian planes partition the actual chamfered plan and uniform roof slope area',()=>{
 const g=geometry(),a=buildVictorianSurfaceAreas({geometry:g}),chamfer=(g.widthMM-g.frontLengthMM)/2,expected=(g.widthMM*g.projectionMM-chamfer*chamfer)/1e6;
 expect(a.valid).toBe(true);expect(a.facets).toHaveLength(5);expect(a.planAreaM2).toBeCloseTo(expected,8);expect(a.partitionPlanAreaM2).toBeCloseTo(expected,8);expect(a.areaM2).toBeCloseTo(expected/Math.cos(25*Math.PI/180),8);
 const ext=buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM:110});const expectedOuter=Math.abs(g.externalOutline.reduce((n,p,i)=>{const q=g.externalOutline[(i+1)%6];return n+p.xMM*q.yMM-q.xMM*p.yMM;},0))/2e6;
 expect(ext.planAreaM2).toBeCloseTo(expectedOuter,8);
});
test('finished ceiling partitions five slopes and closure flat, excluding soffit',()=>{
 const a=build(),b=build({soffitMM:150,soffitMode:'standard'});expect(a.valid).toBe(true);expect(a.ceiling.flat.widthMM).toBe(595);expect(a.ceiling.flat.areaM2).toBeGreaterThan(0);
 expect(a.ceiling.partitionPlanAreaM2).toBeCloseTo(a.ceiling.planAreaM2,8);expect(a.ceiling.areaM2).toBeLessThan(buildVictorianSurfaceAreas({geometry:geometry()}).areaM2);
 expect(a.superQuilt.installedAreaM2).toBe(a.plasterboard.installedAreaM2);expect(a.ceiling.areaM2).toBeCloseTo(b.ceiling.areaM2,8);expect(b.membrane.installedAreaM2).toBeGreaterThan(a.membrane.installedAreaM2);
});
test('PIR50 counts rear and terminal truss faces correctly and pools one ring face before sheet rounding',()=>{
 const a=build();expect(a.cradle.trussFaceCount).toBe(14);expect(a.cradle.stripWidthMM).toBe(140);expect(a.cradle.ringPirFaceCount).toBe(1);expect(a.cradle.ringPirHeightMM).toBe(185);
 expect(a.cradle.ringPir50AreaM2).toBeCloseTo(8.511049614278154*0.185,8);
 expect(a.pir50.netAreaM2).toBeCloseTo(a.cradle.netAreaM2+a.cradle.ringPir50AreaM2,8);expect(a.pir50.sheets).toBe(Math.ceil(a.pir50.netAreaM2*1.05/2.88));expect(a.pir50.cost).toBe(a.pir50.sheets*20);expect(a.pir50.installedWeightKg).toBeCloseTo(a.pir50.netAreaM2*1.6,8);
 const pitched=build({upstandArrangement:'pitched'});expect(a.pir50.netAreaM2).toBeCloseTo(pitched.pir50.netAreaM2,8);
});
test('PIR100 reaches the ridge and frame but excludes timber footprint; installed weight uses pack density without waste',()=>{
 const a=build();expect(a.pir100.netAreaM2).toBeCloseTo(a.slab.surface.areaM2-a.slab.timberFootprintAreaM2,8);expect(a.pir100.sheets).toBe(Math.ceil(a.pir100.netAreaM2*1.05/2.88));expect(a.pir100.installedWeightKg).toBeCloseTo(a.pir100.netAreaM2*9/2.88,8);
 expect(build({soffitMM:150,soffitMode:'standard'}).pir100.netAreaM2).toBeCloseTo(a.pir100.netAreaM2,8);
});
test('quilt installed weight is independent of order mix and plasterboard is not supplied or costed',()=>{
 const a=build(),b=build({}, {...materials,superquilt_12m_price_each:999,superquilt_15m_price_each:1});expect(a.superQuilt.installedWeightKg).toBeCloseTo(a.ceiling.areaM2*7.5/12,8);expect(a.superQuilt.installedWeightKg).toBe(b.superQuilt.installedWeightKg);
 expect(a.plasterboard.supplyIncluded).toBe(false);expect(a.plasterboard.installedWeightKg).toBeCloseTo(a.ceiling.areaM2*8.5,8);expect(a.lines.some(l=>l.key==='plasterboard')).toBe(false);
 expect(a.knownInstalledWeightKg).toBeCloseTo(a.lines.reduce((n,l)=>n+l.installedWeightKg,0),8);
});
test('missing costs and weights remain unconfigured and explicit zero weights are preserved',()=>{
 const a=build({},{});expect(a.valid).toBe(true);expect(a.pir50.cost).toBeNull();expect(a.pir100.installedWeightKg).toBeNull();expect(a.superQuilt.installedWeightKg).toBeNull();expect(a.membrane.installedWeightKg).toBeNull();expect(a.costComplete).toBe(false);expect(a.weightComplete).toBe(false);
 expect(build({}, {...materials,pir100_weight_kg_per_m2:0}).pir100.installedWeightKg).toBe(0);
});
test('invalid order inputs, jack layouts and insufficient membrane coverage remain visible',()=>{
 expect(build({}, {...materials,superquilt_overlap_mm:1200}).valid).toBe(false);expect(build({}, {...materials,pir50:{sheet_w_m:-1}}).valid).toBe(false);expect(build({widthMM:4000,projMM:6500}).valid).toBe(true);
 const big=build({projMM:20000});expect(big.valid).toBe(true);expect(big.membrane.coverageReview).toBe(false);expect(big.membrane.rolls).toBeGreaterThan(1);expect(big.membrane.rolls*big.membrane.rollCoverageM2).toBeGreaterThanOrEqual(big.membrane.installedAreaM2);
});
test('insulation audit does not mutate geometry or configured rates',()=>{
 const g=geometry(),before=JSON.stringify(g),rates=JSON.stringify(materials);buildVictorianInsulationAudit({geometry:g,materials});expect(JSON.stringify(g)).toBe(before);expect(JSON.stringify(materials)).toBe(rates);
});
