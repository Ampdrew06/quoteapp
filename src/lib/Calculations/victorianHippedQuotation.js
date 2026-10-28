import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {buildVictorianHippedSummaryMaterialsModel} from './victorianHippedSummaryMaterialsModel';
// Reuse discount/delivery/VAT and the established slate contribution benchmark.
export const buildVictorianHippedQuotation=args=>buildGableQuotation({...args,roofFamily:'victorian-hipped',modelBuilder:buildVictorianHippedSummaryMaterialsModel});

// Store design data, not rendered CAD: existing quotes use future book layouts.
export function buildVictorianHippedQuoteRecord(args){
 const record=buildGableQuoteRecord({...args,family:'victorian-hipped'});
 record.inputs_json=JSON.parse(JSON.stringify({...record.inputs_json,designFormVersion:args.inputs.designFormVersion??224,quoteDisplayed:true}));
 record.materials_snapshot_json=JSON.parse(JSON.stringify(args.materials));
 record.pricing_json.summary.installedWeightKg=args.quotation.model.knownSuppliedWeightKg+(args.quotation.model.audits.misc.plasterboard?.weightKg||0);
 record.pricing_json.weights_provisional=!args.quotation.model.weightComplete;
 return record;
}
export const isVictorianHippedQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='victorian-hipped';
