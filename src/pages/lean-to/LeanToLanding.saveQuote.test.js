import fs from 'fs';
import path from 'path';

// Exercise the actual D/O callback with cloud/UI boundaries stubbed. This
// catches name-shadowing recursion without requiring a browser or live database.
const source = fs.readFileSync(path.join(__dirname, 'LeanToLanding.jsx'), 'utf8');
const body = source.split('const handleSaveQuote = async () => {')[1].split('\n};\n  /*')[0];
function fixture(overrides = {}) {
  return {
    readActiveDesignRecord:()=>null, activateDesignRecord:jest.fn(), setEditingRecord:jest.fn(),
    designRecordPatch:record=>record,updateQuote:jest.fn().mockResolvedValue({id:'existing'}),
    localStorage:{getItem:()=>null},setQuoteInputsExpanded:jest.fn(),missingPostcode:false,
    quoteRef: '  Factory test  ', isAdmin: true, canQuote: true,isCentralBoss:false,centralPricingReady:true,bossArrangement:'offset',
    leftHipWidthManual:false,rightHipWidthManual:false,normalizeBossArrangementInputs:inputs=>inputs,
    getNextQuoteNumber: jest.fn().mockResolvedValue('123'),
    saveQuoteToCloud: jest.fn().mockResolvedValue({id:'saved'}),
    readSummaryAddedItems: () => [{key:'extra',qty:2}],
    readSummaryPricingState: () => ({labourDays:1.8}),
    widthMM:4050, projMM:2885, pitchDeg:15, maximumFinishedHeightMM:'',
    roofStyle:'hippedLeanTo', activeHippedSides:'both', leftHip:true,rightHip:true,
    leftHipWidthMM:1442.5,rightHipWidthMM:1442.5,
    requestedLeftSidePitchDeg:'',requestedRightSidePitchDeg:'',
    sideSoffitMode:'specified',sideSoffitControlSide:'left',specifiedSideSoffitMM:100,
    leftWall:false,rightWall:false,eavesOverhangMM:150,leftOverhangMM:0,rightOverhangMM:0,
    tileSystem:'britmet',tileColor:'titanium',plasticsColor:'white',
    gutterProfile:'square',gutterColor:'white',gutterOutlet:'left',
    selectedCustomerId:'retail',deliveryPostcode:'',deliveryDistanceMiles:10,
    selectedCustomer:{id:'retail',name:'Retail'},getCurrentCustomer:()=>null,
    extWidthMM:4356,extProjectionMM:3106,riseMM:773,
    pricing:{net:2000,vat:400,gross:2400},
    summaryMaterials:{materialsCostForPricing:1230,pricingSections:{timber:350}},
    getMaterials:()=>({rate:6.4}),alert:jest.fn(),console:{error:jest.fn()},
    ...overrides,
  };
}
const run = context => new Function(...Object.keys(context), `return (async () => {${body}\n})();`)(...Object.values(context));

test('D/O save writes one hipped quote with current Summary pricing and extras',async()=>{
 const context=fixture();await run(context);
 expect(context.getNextQuoteNumber).toHaveBeenCalledTimes(1);
 expect(context.saveQuoteToCloud).toHaveBeenCalledTimes(1);
 const record=context.saveQuoteToCloud.mock.calls[0][0];
 expect(record.manual_reference).toBe('Factory test');
 expect(record.inputs_json.roofStyle).toBe('hippedLeanTo');
 expect(record.inputs_json.summaryAddedItems).toEqual([{key:'extra',qty:2}]);
 expect(record.pricing_json.materialsCost).toBe(1230);
 expect(context.alert).toHaveBeenCalledWith('Quote 123 saved.');
});
test('missing dimensions or trade reference do not allocate a number or write a quote',async()=>{
 for(const overrides of [{canQuote:false},{isAdmin:false,quoteRef:''}]) {
  const context=fixture(overrides);await run(context);
  expect(context.getNextQuoteNumber).not.toHaveBeenCalled();
  expect(context.saveQuoteToCloud).not.toHaveBeenCalled();
 }
});
test('failed cloud save reports failure without a success message',async()=>{
 const context=fixture({saveQuoteToCloud:jest.fn().mockResolvedValue(null)});await run(context);
 expect(context.alert).toHaveBeenCalledWith('Quote was not saved. Check the console for details.');
});
test('unexpected save error reports failure instead of leaving the button silent',async()=>{
 const context=fixture({getNextQuoteNumber:jest.fn().mockRejectedValue(new Error('connection'))});await run(context);
 expect(context.saveQuoteToCloud).not.toHaveBeenCalled();
 expect(context.console.error).toHaveBeenCalledTimes(1);
 expect(context.alert.mock.calls[0][0]).toContain('Quote was not saved.');
});

test('central design with missing material rate cannot allocate or save a quotation',async()=>{
 const context=fixture({isCentralBoss:true,centralPricingReady:false});await run(context);
 expect(context.getNextQuoteNumber).not.toHaveBeenCalled();
 expect(context.saveQuoteToCloud).not.toHaveBeenCalled();
 expect(context.alert.mock.calls[0][0]).toContain('material rates');
});

test('central quotation saves the explicit arrangement and canonical Summary price',async()=>{
 const context=fixture({isCentralBoss:true,centralPricingReady:true,bossArrangement:'central'});await run(context);
 expect(context.saveQuoteToCloud).toHaveBeenCalledTimes(1);
 expect(context.saveQuoteToCloud.mock.calls[0][0].inputs_json.bossArrangement).toBe('central');
 expect(context.saveQuoteToCloud.mock.calls[0][0].pricing_json.materialsCost).toBe(1230);
});

for (const roofStyle of ['leanTo','hippedLeanTo']) {
 test(roofStyle+' saves and updates the active record without creating a second quote',async()=>{
  const context=fixture({roofStyle,readActiveDesignRecord:()=>({id:'existing',quote_number:'123',status:'converted_to_job',job_number:'J1'})});await run(context);
  expect(context.updateQuote).toHaveBeenCalledTimes(1);expect(context.saveQuoteToCloud).not.toHaveBeenCalled();
  expect(context.getNextQuoteNumber).not.toHaveBeenCalled();expect(context.activateDesignRecord).toHaveBeenCalledTimes(1);
 });
}
test('trade missing reference reopens Edit rather than silently disabling Save',async()=>{
 const context=fixture({isAdmin:false,quoteRef:''});await run(context);
 expect(context.setQuoteInputsExpanded).toHaveBeenCalledWith(true);expect(context.saveQuoteToCloud).not.toHaveBeenCalled();
});
test('trade missing postcode reopens Edit and explains the missing input',async()=>{
 const context=fixture({isAdmin:false,canQuote:false,missingPostcode:true});await run(context);
 expect(context.setQuoteInputsExpanded).toHaveBeenCalledWith(true);expect(context.alert.mock.calls[0][0]).toContain('postcode');
});
