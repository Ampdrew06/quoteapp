import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTimberAudit} from './gableTimberAudit';
import {buildGableInsulationAudit} from './gableInsulationAudit';
import {buildGableTilingAudit} from './gableTilingAudit';
import {buildGableLathMembraneAudit} from './gableLathMembraneAudit';
import {buildGableMiscellaneousAudit} from './gableMiscellaneousAudit';
const build=(productId='britmetShingle',materials={},inputs={})=>{
 const geometry=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25,...inputs},materials});
 const timberAudit=buildGableTimberAudit({geometry,materials}),insulationAudit=buildGableInsulationAudit({geometry,timberAudit,materials});
 const tilingAudit=buildGableTilingAudit({geometry,materials,productId});
 const lathAudit=buildGableLathMembraneAudit({geometry,timberAudit,insulationAudit,tilingAudit,materials});
 return buildGableMiscellaneousAudit({geometry,tilingAudit,lathAudit,materials});
};
test('uses truss feet and separate internal/external boxes with factory ring fixings excluded',()=>{
 const a=build();expect(a.valid).toBe(true);
 expect(a.siteFixings).toMatchObject({memberFeet:16,screws:32,boxes:1});
 expect(a.lathFixings).toMatchObject({internalScrews:112,externalFieldScrews:160,ridgeScrews:20,externalScrews:180,internalBoxes:1,externalBoxes:1,factoryLathScrews:58});
 expect(a.factoryRows.find(row=>row.key==='factory_ring_lath_screws').qty).toBe(58);
});
test('adds known ridge screws before box rounding and covers front accessories within the existing allowance',()=>{
 const a=build();expect(a.tileFixings).toMatchObject({mainTileScrews:222,ridgeTileScrews:16,knownScrews:238,boxes:2,accessoriesConfirmed:true});
 expect(a.pending).toHaveLength(0);expect(a.complete).toBe(true);
});
test('slate has no ridge support screws and receives slate tile and ridge allowances',()=>{
 const a=build('liteSlate');expect(a.lathFixings.ridgeScrews).toBe(0);
 expect(a.tileFixings).toMatchObject({mainTileScrews:960,ridgeTileScrews:96,knownScrews:1056,boxes:6});
 expect(a.pending.some(row=>row.key==='front_cap_vents')).toBe(false);
});
test('fixed cans, tape and factory glue allowances do not grow with roof area',()=>{
 const a=build('britmetShingle',{}, {widthMM:6500,projMM:6000});expect(a.valid).toBe(true);
 expect(a.siteRows.find(row=>row.key==='expanding_foam').qty).toBe(2);expect(a.siteRows.find(row=>row.key==='alu_roll_tape').qty).toBe(1);
 expect(a.factoryRows.find(row=>row.key==='d4_glue').qty).toBe(1);
 expect(a.excludedHardware).toEqual({bosses:0,sparHooks:0,jackSets:0,joistHangers:0,sparRivets:0});
});
test('costs consumed factory screws rather than whole boxes and retains zero prices',()=>{
 const a=build('britmetShingle',{screws_2x8_price_per_box:5,d4_glue_price_per_tub:0,expanding_foam_can_price_each:0});
 expect(a.factoryRows.find(row=>row.key==='factory_ring_lath_screws').cost).toBeCloseTo(58*5/250,8);
 expect(a.factoryRows.find(row=>row.key==='d4_glue').cost).toBe(0);expect(a.siteRows.find(row=>row.key==='expanding_foam').cost).toBe(0);
 expect(a.siteRows.find(row=>row.key==='screws_rafter_eaves').cost).toBeNull();
 expect(a.pending.some(row=>row.key==='truss_joints')).toBe(false);
 expect(a.factoryRows.find(row=>row.key==='factory_staples_32mm').qty).toBe(493);
 expect(a.factoryRows.find(row=>row.key==='factory_staples_32mm').cost).toBeCloseTo(1.7255,8);
 expect(a.siteRows.every(row=>row.installedWeightKg===null)).toBe(true);
});
test('invalid box size or absent audits do not invent a supply requirement',()=>{
 expect(build('britmetShingle',{tileFixings:{units_per_box:0}}).valid).toBe(false);
 expect(buildGableMiscellaneousAudit({}).valid).toBe(false);
});

test('supplies eight concrete screws at the saved full-box rate, preserving zero and missing prices',()=>{
 const a=build('britmetShingle',{concrete_screws_price_per_box:19.61,concrete_screws_units_per_box:100});
 const row=a.siteRows.find(r=>r.key==='concrete_screws');
 expect(row.qty).toBe(8);expect(row.cost).toBeCloseTo(1.5688,8);expect(row.usage).toBe('site');
 expect(build('britmetShingle',{concrete_screws_price_per_box:0}).siteRows.find(r=>r.key==='concrete_screws').cost).toBe(0);
 expect(build().siteRows.find(r=>r.key==='concrete_screws').cost).toBeNull();
 expect(build('britmetShingle',{concrete_screws_units_per_box:0}).valid).toBe(false);
});
