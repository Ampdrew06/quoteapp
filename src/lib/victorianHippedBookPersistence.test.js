import {saveVictorianHippedBookDetails,readVictorianHippedBookDetails} from './victorianHippedBookPersistence';
import {activateDesignRecord,readActiveDesignRecord} from './activeDesignRecord';

const memory=()=>{const data={};return {getItem:k=>data[k]||null,setItem:(k,v)=>{data[k]=v;},removeItem:k=>{delete data[k];}};};
test.each([null,'J701'])('book details survive reopening a saved roof (job %s)',async job_number=>{
 const storage=memory();let record={id:'roof',roof_style:'victorian-hipped',job_number,status:job_number?'converted_to_job':'quote',inputs_json:{widthMM:7304,victorianHippedRafterPositions:{F2:[500,1000]}},pricing_json:{net:5000}};
 activateDesignRecord(record,storage);
 const details={job_number:job_number||'',requested_delivery_date:'2026-11-09',delivery_address_json:{deliveryAddress:'Site address',contactPhone:'123'},order_notes:'Factory instructions'};
 const api={getQuoteById:async()=>record,updateQuote:async(id,patch)=>{record={...record,...patch};return record;}};
 await saveVictorianHippedBookDetails({inputs:{...record.inputs_json,widthMM:9999},details},{storage,api});
 expect(record.inputs_json.widthMM).toBe(7304);
 expect(record.inputs_json.victorianHippedRafterPositions.F2).toEqual([500,1000]);
 expect(record.pricing_json.net).toBe(5000);
 expect(record.job_number).toBe(job_number);
 activateDesignRecord(record,storage);
 expect(readVictorianHippedBookDetails(JSON.parse(storage.getItem('victorianHippedPreviewInputs')),readActiveDesignRecord('victorian-hipped',storage))).toEqual(details);
 const before=storage.getItem('activeDesignRecord');
 await expect(saveVictorianHippedBookDetails({inputs:record.inputs_json,details},{storage,api:{...api,updateQuote:async()=>null}})).rejects.toThrow('not saved');
 expect(storage.getItem('activeDesignRecord')).toBe(before);
});
