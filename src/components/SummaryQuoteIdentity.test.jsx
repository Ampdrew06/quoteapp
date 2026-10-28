import {getSummaryQuoteIdentity as identity} from './SummaryQuoteIdentity';
import {activateDesignRecord,clearActiveDesignRecord} from '../lib/activeDesignRecord';
const store=()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v,removeItem:k=>delete data[k]};};
test('saved identity uses the actual active quote and its saved customer/reference',()=>{
 const storage=store();activateDesignRecord({id:'q1',quote_number:'Q004780',customer_id:'c1',customer_name:'Glazerite',manual_reference:'HUTCHINSON',roof_style:'victorian-hipped',inputs_json:{}},storage);
 expect(identity({family:'victorian-hipped',storage}).line).toBe('Q004780 · Glazerite · HUTCHINSON · Victorian Hipped Lean-To');
});
test('other roof families and a fresh draft cannot inherit an old quote number',()=>{
 const storage=store();activateDesignRecord({id:'q1',quote_number:'Q004780',roof_style:'gable',inputs_json:{}},storage);
 expect(identity({family:'edwardian',storage}).quoteNumber).toBe('New quote');clearActiveDesignRecord(storage);expect(identity({family:'gable',storage}).quoteNumber).toBe('New quote');
});
test('current edits take precedence without falling back to the old customer or cleared reference',()=>{
 const storage=store();activateDesignRecord({id:'q1',quote_number:'42',customer_id:'old',customer_name:'Previous customer',manual_reference:'OLD',roof_style:'edwardian',inputs_json:{}},storage);
 const a=identity({family:'edwardian',inputs:{selectedCustomerId:'new',customerName:'New customer',customerReference:''},storage});
 expect(a.customerName).toBe('New customer');expect(a.reference).toBe('No reference');
 expect(identity({family:'edwardian',inputs:{selectedCustomerId:'retail'},storage}).customerName).toBe('Retail');
});
test('hipped and ordinary lean-to retain their own visible style within the shared record family',()=>{
 const storage=store();activateDesignRecord({id:'q1',quote_number:'99',roof_style:'lean-to',inputs_json:{roofStyle:'hippedLeanTo'}},storage);
 expect(identity({family:'hippedLeanTo',inputs:{roofStyle:'hippedLeanTo'},storage}).roofLabel).toBe('Hipped Lean-To');
 expect(identity({family:'leanTo',inputs:{roofStyle:'leanTo'},storage}).roofLabel).toBe('Lean-To');
});
