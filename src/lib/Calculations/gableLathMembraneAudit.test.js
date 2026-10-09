import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTimberAudit} from './gableTimberAudit';
import {buildGableInsulationAudit} from './gableInsulationAudit';
import {buildGableTilingAudit} from './gableTilingAudit';
import {buildGableLathMembraneAudit} from './gableLathMembraneAudit';
const build=(productId='britmetShingle',extra={})=>{
 const materials={breather_weight_kg_per_m2:0.18,...extra};
 const geometry=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25},materials});
 const timberAudit=buildGableTimberAudit({geometry,materials});
 const insulationAudit=buildGableInsulationAudit({geometry,timberAudit,materials});
 const tilingAudit=buildGableTilingAudit({geometry,materials,productId});
 return {result:buildGableLathMembraneAudit({geometry,timberAudit,insulationAudit,tilingAudit,materials}),insulationAudit,tilingAudit};
};
test('pools the five lath uses once without duplicating the chamfered rows',()=>{
 const {result:r,tilingAudit:t}=build();expect(r.valid).toBe(true);
 expect(r.knownLathM).toBeCloseTo(t.fieldLathM+t.ridgeLathM+8.65+7.87+60.55,8);
 expect(r.knownStockLengths).toBe(40);expect(r.linearMinimumLengths).toBe(36);expect(r.complete).toBe(true);expect(r.internalLathsConfirmed).toBe(true);
});
test('slate has no ridge laths and still includes the ring-beam laths',()=>{
 const {result:r}=build('liteSlate');expect(r.lathUses[1].lengthM).toBe(0);
 expect(r.knownLathM).toBeCloseTo(138.4+8.65+7.87+60.55,8);expect(r.knownStockLengths).toBe(50);
});
test('compares member faces with the confirmed full roof membrane boundary',()=>{
 const {result:r,insulationAudit:i}=build();
 expect(r.membrane.tileFaceAreaM2).toBe(i.membrane.installedAreaM2);
 expect(r.membrane.edgeAreaM2).toBeCloseTo(2*4325*50/Math.cos(25*Math.PI/180)/1e6,5);
 expect(r.membrane.tileFaceWeightKg).toBeCloseTo(r.membrane.tileFaceAreaM2*0.18,8);
 expect(r.membrane.tileFaceWeightKg).toBe(i.membrane.installedWeightKg);
 expect(r.membrane.rolls).toBe(1);
});
test('retains a configured zero membrane rate and rejects invalid inputs',()=>{
 expect(build('britmetShingle',{breather_weight_kg_per_m2:0}).result.membrane.tileFaceWeightKg).toBe(0);
 expect(build('britmetShingle',{lath_stock_length_m:0}).result.valid).toBe(false);
 expect(buildGableLathMembraneAudit({}).valid).toBe(false);
});
