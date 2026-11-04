import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {britmetBenchmarkInputs} from './roofLabourPricing';
import {buildDoubleEdwardianMaterialsModel} from './doubleEdwardianMaterialsModel';
export function buildDoubleEdwardianQuotation(args={}){
 const options={...args,roofFamily:'double-edwardian',modelBuilder:buildDoubleEdwardianMaterialsModel};
 const q=buildGableQuotation(options);
 // Keep the selected slate material review accessible while its steel pricing
 // benchmark is incomplete. Never turn a partial benchmark into a selling price.
 if(!q.valid&&q.model?.valid){
  const benchmark=buildGableQuotation({...options,inputs:britmetBenchmarkInputs(args.inputs||{})});
  return {...benchmark,...q,valid:true,ready:false,labour:benchmark.labour,delivery:benchmark.delivery,model:{...q.model,supplyReviews:[...q.model.supplyReviews,...q.errors]}};
 }
 return q;
}

export function buildDoubleEdwardianQuoteRecord(args){
 const record=buildGableQuoteRecord({...args,family:'double-edwardian'});
 record.inputs_json={...record.inputs_json,quoteDisplayed:true};
 record.pricing_json={...record.pricing_json,provisional:true,scope:'roof-package-only',manufacture_ready:false,waterproofed_valley_included:false,weights_provisional:!args.quotation.model.weightComplete};
 return record;
}
export const isDoubleEdwardianQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'')==='double-edwardian';
