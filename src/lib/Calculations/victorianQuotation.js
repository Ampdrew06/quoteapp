import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {buildVictorianSummaryMaterialsModel} from './victorianSummaryMaterialsModel';
// Retain established rectangular width/projection labour allowance used by Edwardian.
export const buildVictorianQuotation=args=>buildGableQuotation({...args,roofFamily:'victorian',modelBuilder:buildVictorianSummaryMaterialsModel});

export function buildVictorianQuoteRecord(args){
 const record=buildGableQuoteRecord({...args,family:'victorian'});
 record.inputs_json={...record.inputs_json,quoteDisplayed:true,...(args.bookDetails?{victorianBookDetails:args.bookDetails}:{})};
 record.pricing_json.weights_provisional=!args.quotation.model.weightComplete;
 return record;
}
export const isVictorianQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='victorian';
