import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {buildEdwardianSummaryMaterialsModel} from './edwardianSummaryMaterialsModel';
export const buildEdwardianQuotation=args=>buildGableQuotation({...args,roofFamily:'edwardian',modelBuilder:buildEdwardianSummaryMaterialsModel});
export const buildEdwardianQuoteRecord=args=>buildGableQuoteRecord({...args,family:'edwardian'});
export const isEdwardianQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='edwardian';
