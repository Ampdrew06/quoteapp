/* global globalThis */
import {getNextQuoteNumber,saveQuote,updateQuote} from './quotes';
import {readActiveDesignRecord,designRecordPatch} from './activeDesignRecord';
import {buildVictorianHippedQuoteRecord} from './Calculations/victorianHippedQuotation';

// Keep API calls injectable so full design round-trips can be checked without
// creating test quotations in the customer's database.
export async function saveVictorianHippedDesign({inputs,materials,quotation,customer,asNew=false},{api={getNextQuoteNumber,saveQuote,updateQuote},storage=globalThis.localStorage}={}){
 if(!quotation?.ready)throw new Error('Complete material prices, customer details and delivery before saving.');
 if(!String(inputs.customerReference||'').trim())throw new Error('Enter a customer reference before saving.');
 const current=readActiveDesignRecord('victorian-hipped',storage),updating=!!current&&!asNew;
 const quoteNumber=updating?current.quote_number:await api.getNextQuoteNumber();
 const record=buildVictorianHippedQuoteRecord({inputs,materials,quotation,customer,quoteNumber});
 const saved=updating?await api.updateQuote(current.id,designRecordPatch(record)):await api.saveQuote(record);
 if(!saved?.id)throw new Error('Quote was not saved. Your design is still open; check the connection and try again.');
 return {record:{...(updating?current:{}),...record,...saved,inputs_json:record.inputs_json},quoteNumber,updating};
}
