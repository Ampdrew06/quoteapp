import {buildCombinationManufactureSchedule} from './combinationManufactureSchedule';
import {buildCombinationSummaryMaterialsModel} from '../Calculations/combinationQuotation';
import {saveCombinationBookDetails,readCombinationBookDetails} from '../combinationBookDetails';
import {activateDesignRecord,readActiveDesignRecord} from '../activeDesignRecord';
const inputs={widthMM:4000,projMM:3000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian',tileProductId:'britmetShingle',gutterProfile:'square'};
test('all four side configurations use the material engine member profiles and ringbeam counts',()=>{
 for(const leftSide of ['edwardian','victorian'])for(const rightSide of ['edwardian','victorian']){
  const i={...inputs,leftSide,rightSide},s=buildCombinationManufactureSchedule({inputs:i}),model=buildCombinationSummaryMaterialsModel({inputs:i});expect(s.valid).toBe(true);expect(s.model.sections).toEqual(model.sections);
  expect(s.ringBeams).toHaveLength(leftSide===rightSide?(leftSide==='edwardian'?3:5):4);
  if(s.family!=='edwardian'){expect(s.members.filter(m=>m.type==='Hip')).toHaveLength(s.geometry.hips.length);expect(s.members.filter(m=>m.type==='Jack rafter')).toHaveLength(s.geometry.jackRafters.length);}
 }
});
test('manual centres remain in the manufacturing geometry',()=>{
 const s=buildCombinationManufactureSchedule({inputs:{...inputs,combinationRafterPositionsMM:{'facet-2':[500,1000]},combinationRearTrussPositionsMM:[400]}});expect(s.valid).toBe(true);expect(s.geometry.layout.centresMM).toEqual([31.5,400,967]);expect(s.geometry.rafterGroups[1].centresMM).toEqual([500,1000]);
});
const makeStorage=()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;},removeItem:k=>{delete data[k];}};};
test('book details persist with a saved quote without changing pricing or job status',async()=>{
 const storage=makeStorage(),record={id:'book-test',roof_style:'combination',status:'converted_to_job',job_number:'J123',pricing_json:{net:999},inputs_json:inputs};activateDesignRecord(record,storage);
 const details={job_number:'J123',requested_delivery_date:'2026-11-27',order_notes:'Keep this instruction',delivery_address_json:{deliveryAddress:'Address'}};
 let sent;const result=await saveCombinationBookDetails({inputs,details,storage,updateQuote:async(id,patch)=>{sent=patch;return {id,...patch};}});
 expect(result.savedToQuote).toBe(true);expect(sent.status).toBeUndefined();expect(sent.pricing_json).toBeUndefined();expect(readActiveDesignRecord('combination',storage).pricing_json.net).toBe(999);expect(readCombinationBookDetails(JSON.parse(storage.getItem('combinationGeometryDraft')),storage)).toEqual(details);
});
test('an old book cannot update another active quote',async()=>{
 const storage=makeStorage();activateDesignRecord({id:'new-owner',roof_style:'combination',inputs_json:inputs},storage);let calls=0;
 const result=await saveCombinationBookDetails({inputs,details:{order_notes:'Old book'},storage,expectedOwner:'old-owner',updateQuote:async()=>{calls++;}});expect(result.savedToQuote).toBe(false);expect(calls).toBe(0);
});
