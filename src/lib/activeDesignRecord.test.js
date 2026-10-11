import {activateDesignRecord,clearActiveDesignRecord,readActiveDesignRecord,restoreActiveDesignRecord,designRecordPatch,draftDesignIdentity,rememberActiveDesignRecord} from './activeDesignRecord';
const storage=()=>{const values={};return {getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=value;},removeItem:key=>{delete values[key];}};};
test('new design clears old job identities and draft manufacture details',()=>{
 const s=storage();s.setItem('active_job_id','old-job');s.setItem('active_gable_job_id','old-gable');s.setItem('gableBookDetails','old details');
 activateDesignRecord({id:'quote',roof_style:'gable',inputs_json:{widthMM:3800}},s);
 clearActiveDesignRecord(s);expect(readActiveDesignRecord('gable',s)).toBeNull();
 expect(s.getItem('active_job_id')).toBeNull();expect(s.getItem('active_gable_job_id')).toBeNull();expect(s.getItem('gableBookDetails')).toBeNull();
});
test('opened quote identity is isolated by design family and restores saved choices',()=>{
 const s=storage(),record={id:'q1',quote_number:'42',roof_style:'gable',inputs_json:{tileProductId:'britmetShingle',summaryAddedItems:[{qty:2}],summaryPricingState:{adjustments:{tile:1}}}};
 activateDesignRecord(record,s);s.setItem('gableDesignPreviewInputs',JSON.stringify({tileProductId:'liteSlate'}));
 expect(readActiveDesignRecord('lean-to',s)).toBeNull();expect(restoreActiveDesignRecord('gable',s)).toBe(true);
 expect(JSON.parse(s.getItem('gableDesignPreviewInputs'))).toEqual(record.inputs_json);
});
test('Lean-To and Hipped reset restores saved extras, exclusions and quantity adjustments',()=>{
 for(const roofStyle of ['leanTo','hippedLeanTo']){
 const s=storage(),inputs={roofStyle,tileSystem:'britmet',summaryAddedItems:[{qty:1}],summaryPricingState:{exclusions:{tile:true},adjustments:{foam:2}}};
 activateDesignRecord({id:'q',roof_style:'lean-to',inputs_json:inputs},s);s.setItem('summary_adjustments','{}');s.setItem('leanToInputs','{}');
 expect(restoreActiveDesignRecord('lean-to',s)).toBe(true);expect(JSON.parse(s.getItem('leanToInputs'))).toEqual(inputs);
 expect(JSON.parse(s.getItem('summary_adjustments'))).toEqual({foam:2});expect(JSON.parse(s.getItem('summary_exclusions'))).toEqual({tile:true});
 }
});
test('design update patch preserves saved-job lifecycle and delivery metadata',()=>{
 const patch=designRecordPatch({id:'q',quote_number:'42',status:'quote',job_number:'J1',requested_delivery_date:'2026-10-12',delivery_address_json:{},order_notes:'keep',created_at:'old',inputs_json:{tileSystem:'liteslate'},pricing_json:{net:100}});
 expect(patch).toEqual({quote_number:'42',inputs_json:{tileSystem:'liteslate'},pricing_json:{net:100}});
});
test('draft manufacture details have a stable identity until a new design starts',()=>{
 const s=storage(),id=draftDesignIdentity(s);expect(draftDesignIdentity(s)).toBe(id);clearActiveDesignRecord(s);expect(s.getItem('activeDesignDraft')).toBeNull();
});
test('malformed or missing identity cannot activate an old job',()=>{
 const s=storage();s.setItem('activeDesignRecord','bad JSON');expect(readActiveDesignRecord('gable',s)).toBeNull();expect(restoreActiveDesignRecord('gable',s)).toBe(false);
});

test('future roof styles receive independent shared record identities',()=>{
 const s=storage();activateDesignRecord({id:'e1',roof_style:'edwardian',inputs_json:{roofStyle:'edwardian',widthMM:4200}},s);
 expect(readActiveDesignRecord('edwardian',s).id).toBe('e1');expect(readActiveDesignRecord('lean-to',s)).toBeNull();
 expect(JSON.parse(s.getItem('edwardianInputs')).widthMM).toBe(4200);
});

test('legacy last-opened job IDs alone never identify the current design',()=>{
 const s=storage();s.setItem('active_job_id','previous-job');s.setItem('active_gable_job_id','previous-gable');
 expect(readActiveDesignRecord('lean-to',s)).toBeNull();expect(readActiveDesignRecord('gable',s)).toBeNull();
});

test('saving manufacture metadata does not overwrite unsaved design amendments',()=>{
 const s=storage();activateDesignRecord({id:'q',roof_style:'gable',inputs_json:{widthMM:3800}},s);
 s.setItem('gableDesignPreviewInputs',JSON.stringify({widthMM:4200}));
 rememberActiveDesignRecord({id:'q',roof_style:'gable',inputs_json:{widthMM:3800},order_notes:'Updated notes'},s);
 expect(JSON.parse(s.getItem('gableDesignPreviewInputs')).widthMM).toBe(4200);expect(readActiveDesignRecord('gable',s).order_notes).toBe('Updated notes');
});
