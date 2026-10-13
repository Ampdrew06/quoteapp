import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianSurfaceAreas} from '../geometry/edwardianSurfaceAreas';
import {buildEdwardianInsulationAudit} from './edwardianInsulationAudit';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25};
const g=buildEdwardianGeometry({inputs});
const materials={pir50:{price_per_sheet:20,weight_kg_per_m2:1},pir100:{price_per_sheet:30},slab100:{pack_coverage_m2:5,weight_kg_per_pack:10},superquilt_12m_price_each:60,superquilt_15m_price_each:70,superquilt_weight_kg_per_m2:0.5,breather_weight_kg_per_m2:0.1};
test('three pitched surfaces partition the roof plan without overlaps or missing area',()=>{
 const a=buildEdwardianSurfaceAreas({geometry:g});expect(a.valid).toBe(true);expect(a.partitionPlanAreaM2).toBeCloseTo(3560*3550/1e6,8);expect(a.areaM2).toBeCloseTo(3560*3550/1e6/Math.cos(25*Math.PI/180),8);
});
test('ceiling includes the closure flat and matches SuperQuilt and plasterboard exactly',()=>{
 const a=buildEdwardianInsulationAudit({geometry:g,materials});expect(a.valid).toBe(true);
 const halfSlope=(3560-595)/2,cos=Math.cos(25*Math.PI/180);
 const expected=2*halfSlope*(3550-halfSlope/2)/1e6/cos+(3560+595)/2*halfSlope/1e6/cos+595*(3550-halfSlope)/1e6;
 expect(a.ceiling.areaM2).toBeCloseTo(expected,8);expect(a.ceiling.flat.areaM2).toBeCloseTo(595*2067.5/1e6,8);
 expect(a.superQuilt.installedAreaM2).toBe(a.plasterboard.installedAreaM2);expect(a.plasterboard.supplyIncluded).toBe(false);expect(a.plasterboard.installedWeightKg).toBeCloseTo(expected*8.5,8);
});
test('PIR100 reaches the apex and uses pack-based weight while PIR50 pools ring faces once',()=>{
 const a=buildEdwardianInsulationAudit({geometry:g,materials});expect(a.valid).toBe(true);expect(a.pir100.netAreaM2).toBeCloseTo(a.slab.surface.areaM2-a.slab.timberFootprintAreaM2,8);expect(a.pir100.installedWeightKg).toBeCloseTo(a.pir100.netAreaM2*2,8);
 expect(a.pir50.netAreaM2).toBeCloseTo(a.cradle.netAreaM2+a.cradle.ringPir50AreaM2,8);expect(a.cradle.trussFaceCount).toBe(14);
});
test('soffit extensions change membrane coverage but not the internal finished ceiling',()=>{
 const original=buildEdwardianInsulationAudit({geometry:g,materials});const other=buildEdwardianInsulationAudit({geometry:buildEdwardianGeometry({inputs:{...inputs,soffitMM:100}}),materials});expect(other.valid).toBe(true);expect(other.ceiling.areaM2).toBeCloseTo(original.ceiling.areaM2,8);expect(other.membrane.installedAreaM2).toBeLessThan(original.membrane.installedAreaM2);
});
test('unequal front pitch preserves plan partition and current ridge affects areas',()=>{
 const manual=buildEdwardianGeometry({inputs:{...inputs,ridgeMode:'manual',ridgePositionMM:2000}});const a=buildEdwardianInsulationAudit({geometry:manual,materials});expect(a.valid).toBe(true);expect(a.ceiling.partitionPlanAreaM2).toBeCloseTo(3560*3550/1e6,8);expect(a.superQuilt.installedAreaM2).toBe(a.plasterboard.installedAreaM2);
});
test('missing prices and weights remain unconfigured; invalid overlap is rejected',()=>{
 const a=buildEdwardianInsulationAudit({geometry:g});expect(a.pir100.installedWeightKg).toBeNull();expect(a.pir100.cost).toBeNull();expect(buildEdwardianInsulationAudit({geometry:g,materials:{superquilt_overlap_mm:1200}}).valid).toBe(false);
});
