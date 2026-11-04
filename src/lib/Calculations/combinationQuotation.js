import {buildGableQuotation,buildGableQuoteRecord} from './gableQuotation';
import {buildEdwardianSummaryMaterialsModel} from './edwardianSummaryMaterialsModel';
import {buildVictorianSummaryMaterialsModel} from './victorianSummaryMaterialsModel';
import {buildCombinationMaterialsModel,combinationReferenceInputs} from './combinationMaterialsModel';
export function buildCombinationSummaryMaterialsModel(args={}){
 const {inputs={},materials={}}=args;
 const base=buildCombinationMaterialsModel({inputs,materials});
 if(!base.valid)return {...base,materialsCostForPricing:0};
 const family=base.comparisonStyle;
 const model=family==='edwardian'?buildEdwardianSummaryMaterialsModel({...args,inputs:combinationReferenceInputs(inputs,family)}):family==='victorian'?buildVictorianSummaryMaterialsModel({...args,inputs:combinationReferenceInputs(inputs,family)}):buildVictorianSummaryMaterialsModel({...args,geometryBuilder:()=>base.geometry});
 return {...model,weightComplete:model.weightComplete??(model.missingWeights?.length===0),notes:[...(model.notes||[]),...(base.geometry?.variablePitchPricingValidated?['Survey-adjusted quotation: quantities use actual facet pitches and aligned eaves. Nominal corner fittings require adaptation review. Manufacture cut release remains pending; no fabrication surcharge has been invented.']:[]),'Half/half quotations use the Victorian labour baseline initially. Side choices, manual rafters and Summary supply adjustments are retained with the quotation.'],comparisonStyle:family};
}
export function buildCombinationQuotation(args={}){
 const q=buildGableQuotation({...args,roofFamily:'combination',modelBuilder:buildCombinationSummaryMaterialsModel});
 if(q.valid&&['metrotileShingle','tapcoSlate'].includes(args.inputs?.tileProductId))return {...q,ready:false,model:{...q.model,pricingReady:false,supplyReviews:[...q.model.supplyReviews,'This tile system is not offered on the half/half roof. Choose Britmet or LiteSlate.']}};
 return q;
}
export function buildCombinationQuoteRecord(args){
 const record=buildGableQuoteRecord({...args,family:'combination'});
 record.inputs_json={...record.inputs_json,quoteDisplayed:true};
 const book=args.inputs.combinationBookDetails;
 if(book){record.requested_delivery_date=book.requested_delivery_date||null;record.order_notes=book.order_notes||'';record.delivery_address_json=book.delivery_address_json||{};}
 // A new quotation never inherits a job number from a copied book draft.
 record.pricing_json.weights_provisional=!args.quotation.model.weightComplete;
 return record;
}
export const isCombinationQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='combination';
