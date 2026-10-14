import {defaultMaterials} from '../materials';
import {buildEdwardianSummaryMaterialsModel} from '../Calculations/edwardianSummaryMaterialsModel';
import {buildEdwardianManufactureSchedule} from './edwardianManufactureSchedule';
const inputs={roofStyle:'edwardian',widthMM:3560,projMM:3550,pitchDeg:25,frameThicknessMM:70,soffitMM:150,tileProductId:'britmetShingle'};
const make=(patch={})=>buildEdwardianManufactureSchedule(buildEdwardianSummaryMaterialsModel({inputs:{...inputs,...patch},materials:defaultMaterials}),defaultMaterials);
test('completed roof retains agreed factory geometry and a unique reference for each timber member',()=>{
 const s=make();expect(s.valid).toBe(true);expect(s.members).toHaveLength(19);expect(new Set(s.members.map(m=>m.ref)).size).toBe(19);expect(s.trusses.map(t=>t.centreMM)).toEqual([31.5,696.5,1216.75,1737]);expect(s.geometry.ridgeEndYMM).toBe(1770);
 expect(s.members.find(m=>m.ref==='R1').profile.externalSlopeLengthMM).toBeCloseTo(2044.9,0);
 expect(s.ringBeams.reduce((n,b)=>n+b.bays.length,0)).toBe(18);
});
test('absolute slots retain the rear lead-in and clear bay distances',()=>{
 const s=make();const left=s.ringBeams.find(b=>b.side==='left');expect(left.slots[0].leftMM).toBe(7.5);expect(left.bays[0].startMM).toBe(55.5);expect(left.bays[0].widthMM).toBe(617);expect(left.slots[0].rightMM-left.slots[0].leftMM).toBe(48);
});
test('supply amendments reach checklist without changing member cuts',()=>{
 const base=make(),changed=make({summaryAddedItems:[{section:'gutters',catalogId:'square_corner90',qty:1}]});expect(changed.members).toEqual(base.members);expect(changed.checklist.sections.gutters).not.toEqual(base.checklist.sections.gutters);
});
test('admin front pitch changes the front geometry and keeps terminal setback',()=>{
 const s=make({ridgeMode:'frontPitch',frontPitchDeg:30});expect(s.valid).toBe(true);expect(s.geometry.frontPitchDeg).toBe(30);expect(s.geometry.ridgeEndYMM-s.geometry.terminalTrussCentreMM).toBe(33);expect(s.members.find(m=>m.ref==='R1').profile.topCutOffSquareDeg).toBe(18);
});
test('invalid design cannot produce a book',()=>{expect(make({widthMM:0}).valid).toBe(false);});

test('despatch checklist contains loose laths and plasterboard guide, omitting fitted hardware and PIR',()=>{
 const base=make(),changed=make({summaryPricingState:{adjustments:{edwardian_laths:2,spar_hook:1,edwardian_pir50:1}}});
 expect(base.checklist.sections.laths[0].qty).toBeGreaterThan(0);
 expect(base.checklist.sections.metal.some(r=>r.key==='spar_hook')).toBe(false);
 expect(base.checklist.sections.misc.some(r=>r.key==='edwardian_pir50')).toBe(false);
 expect(base.checklist.sections.misc.find(r=>r.key==='plasterboard_guide').informational).toBe(true);
 expect(changed.checklist.sections.laths[0].qty).toBe(base.checklist.sections.laths[0].qty+2);
 expect(changed.checklist.sections.metal.find(r=>r.key==='spar_hook').qty).toBe(1);
 expect(changed.checklist.sections.misc.find(r=>r.key==='edwardian_pir50').qty).toBe(1);
 expect(changed.members).toEqual(base.members);
});

test('compact checklist quantities preserve supply counts with short display units',()=>{
 const s=make(),misc=s.checklist.sections.misc,gutters=s.checklist.sections.gutters;
 expect(misc.find(r=>r.key==='polytop_pins').displayQty).toBe('50');
 expect(misc.find(r=>r.key==='alu_roll_tape').units).toBe('Roll');
 expect(misc.find(r=>r.key==='edwardian_tile_tape').units).toBe('Rolls');
 expect(gutters.find(r=>r.key==='edwardian_gutter_g_len').units).toBe('×4m');
 expect(gutters.find(r=>r.key==='edwardian_gutter_dp_len').units).toBe('Ea');
});
