import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {buildVictorianSummaryMaterialsModel} from './victorianSummaryMaterialsModel';
import {buildVictorianFiveGeometry} from '../geometry/victorianFiveGeometry';
import {normalizeVictorianFiveDesignInputs} from '../geometry/victorianFiveDesignInputs';
export const buildVictorianFiveSummaryMaterialsModel=args=>buildVictorianSummaryMaterialsModel({...args,inputs:normalizeVictorianFiveDesignInputs(args?.inputs),geometryBuilder:buildVictorianFiveGeometry});
export const buildVictorianFiveQuotation=args=>buildGableQuotation({...args,roofFamily:'victorian-five',modelBuilder:buildVictorianFiveSummaryMaterialsModel});
export function buildVictorianFiveQuoteRecord(args){
 const record=buildGableQuoteRecord({...args,inputs:normalizeVictorianFiveDesignInputs(args.inputs),family:'victorian-five'});
 record.inputs_json={...record.inputs_json,quoteDisplayed:true,...(args.bookDetails?{victorianFiveBookDetails:args.bookDetails}:{})};record.pricing_json.weights_provisional=!args.quotation.model.weightComplete;return record;
}
export const isVictorianFiveQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='victorian-five';
