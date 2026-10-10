jest.mock('../supabaseClient',()=>({supabase:{}}));
import {buildGableSummaryMaterialsModel} from '../Calculations/gableSummaryMaterialsModel';
import {buildGableManufactureSchedule} from './gableManufactureSchedule';
import {defaultMaterials} from '../materials';
const inputs={widthMM:3800,projMM:4100,pitchDeg:25,leftSoffitMM:150,rightSoffitMM:150,frontOverhangMM:150,tileProductId:'britmetShingle'};
const build=(patch={})=>{const model=buildGableSummaryMaterialsModel({inputs:{...inputs,...patch},materials:defaultMaterials});return {model,s:buildGableManufactureSchedule(model,defaultMaterials)};};
test('manufacture schedule shares live geometry and paired ring-beam bays',()=>{
 const {model,s}=build();expect(s.valid).toBe(true);expect(s.geometry).toBe(model.audits.geometry);
 expect(s.trusses).toHaveLength(8);expect(s.trusses[1].centreMM).toBe(696.5);
 expect(s.geometry.manufacturingProjectionMM).toBe(4325);expect(s.ringBeamGroups).toHaveLength(1);
 expect(s.bays[0]).toMatchObject({id:'B1',pairedId:'B14',upstandWidthMM:617,slabWidthMM:620,startMM:55.5});
 expect(s.componentCounts.chevrons).toBe(16);
});
test('unequal soffits use separate member foot cuts and ring-beam groups',()=>{
 const {s}=build({rightSoffitMM:100,separateSideSoffits:true});expect(s.ringBeamGroups).toHaveLength(2);
 expect(s.members[0].hfcMM).toBe(220);expect(s.members[1].hfcMM).toBe(170);
 expect(s.members[0].externalSlopeMM).toBeGreaterThan(s.members[1].externalSlopeMM);
 expect(s.members[1].points[3].xMM).toBe(-170);
});
test('checklist keeps authoritative adjusted supply quantities and omits factory consumption',()=>{
 const {model,s}=build({summaryPricingState:{adjustments:{gable_gutter_unions:1},exclusions:{gable_gutter_unions:true}}});
 expect(s.checklist.sections.gutters.find(r=>r.key==='gable_gutter_unions').qty).toBe(model.sections.gutters.lines.find(r=>r.key==='gable_gutter_unions').qty);
 expect(s.checklist.sections.assemblies[0].qty).toBe(8);
 expect(s.checklist.sections.misc.some(r=>/staple|D4/i.test(r.item))).toBe(false);
 expect(s.checklist.sections.timber.find(r=>r.key==='gable_laths').qty).toBe(40);
});
test('invalid designs have no manufacture schedule',()=>{expect(buildGableManufactureSchedule({valid:false}).valid).toBe(false);});
