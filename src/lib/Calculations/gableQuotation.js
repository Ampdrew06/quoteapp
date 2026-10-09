import {buildGableSummaryMaterialsModel} from './gableSummaryMaterialsModel';
import {computePricing,computeLabourPricing,computeDeliveryPricing} from '../pricing';
import {resolveCustomerDeliveryMiles} from '../customerRecords';
const postcode=value=>String(value||'').toUpperCase().replace(/\s/g,'');
export function buildGableQuotation({inputs={},materials={},customer=null,labourConfig={},deliveryConfig={},markupConfig={}}={}) {
 const model=buildGableSummaryMaterialsModel({inputs,materials});
 if(!model.valid)return {valid:false,ready:false,model,errors:model.errors};
 const area=Number(inputs.widthMM)*Number(inputs.projMM)/1e6;
 const baseDays=Math.ceil(Math.min(3,area>8.75?1+(area-8.75)*0.15:1)*10)/10;
 const base=computeLabourPricing({widthMM:inputs.widthMM,projectionMM:inputs.projMM,tileSystem:inputs.tileProductId==='liteSlate'?'liteslate':'britmet',config:{...labourConfig,minimumDays:Math.max(Number(labourConfig.minimumDays??1),baseDays)},features:{}});
 const override=Number(inputs.labourDaysOverride);
 const days=Number.isFinite(override)&&override>0?override:base.labourDays;
 const labour={...base,days,labourCost:days*Number(labourConfig.dayRate??300)};
 const selected=inputs.selectedCustomerId||'retail';
 const customerReady=selected==='retail'||customer?.id===selected;
 const hasPostcode=!!postcode(inputs.deliveryPostcode);
 const distanceReady=!hasPostcode||(postcode(inputs.deliveryDistancePostcode)===postcode(inputs.deliveryPostcode)&&Number.isFinite(Number(inputs.deliveryDistanceMiles))&&Number(inputs.deliveryDistanceMiles)>=0&&inputs.deliveryDistanceMiles!==''&&inputs.deliveryDistanceMiles!=null);
 const distanceMiles=hasPostcode&&distanceReady?Number(inputs.deliveryDistanceMiles):resolveCustomerDeliveryMiles(null,customer);
 const delivery=computeDeliveryPricing(distanceMiles,deliveryConfig);
 const pricing=computePricing(model.materialsCostForPricing,{...materials,profit_pct:markupConfig.profitPct??materials.profit_pct??50},{labourCost:labour.labourCost,deliveryCost:delivery.deliveryCost,discountPct:selected==='retail'?0:Number(customer?.discountPct??customer?.discount_pct??0)});
 return {valid:true,ready:model.pricingReady&&customerReady&&distanceReady,model,labour,delivery,pricing,customerReady,distanceReady,errors:[]};
}
export function buildGableQuoteRecord({inputs,materials,quotation:q,customer,quoteNumber}) {
 if(!q?.ready)throw new Error('Complete material prices, customer and delivery distance are required before saving.');
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const rounded=Object.fromEntries(Object.entries(q.pricing).map(([k,v])=>[k,typeof v==='number'?Number(v.toFixed(2)):v]));
 return {quote_number:quoteNumber,manual_reference:inputs.customerReference||'',customer_id:uuid.test(customer?.id||'')?customer.id:null,customer_name:customer?.name||'Retail',roof_style:'gable',status:'quote',
  inputs_json:{...inputs,roofStyle:'gable',quoteRef:inputs.customerReference||'',gablePricingSnapshot:{labourDays:q.labour.days,discountPct:q.pricing.discountPct,deliveryMiles:q.delivery.oneWayMiles}},
  pricing_json:{...rounded,materialSections:q.model.pricingSections,labourDays:q.labour.days,deliveryDistanceMiles:q.delivery.oneWayMiles,
   summary:{internalWidthMM:Number(inputs.widthMM),internalProjectionMM:Number(inputs.projMM),pitchDeg:q.model.audits.geometry.pitchDeg,extWidthMM:q.model.audits.geometry.externalWidthMM,extProjectionMM:q.model.audits.geometry.externalProjectionMM,installedWeightKg:q.model.installedWeightKg,net:rounded.net,gross:rounded.gross}},
  materials_snapshot_json:materials};
}
export const isGableQuote=record=>String(record?.inputs_json?.roofStyle||record?.roof_style||'').toLowerCase()==='gable';
