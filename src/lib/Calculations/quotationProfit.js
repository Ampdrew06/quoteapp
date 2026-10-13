// Quotation contribution after listed costs and discount, excluding VAT.
export function quotationProfit(pricing={},materialsCost=0,labourCost=0,deliveryCost=0){
 return Number((Number(pricing.net||0)-Number(materialsCost||0)-Number(labourCost||0)-Number(deliveryCost||0)).toFixed(2));
}
