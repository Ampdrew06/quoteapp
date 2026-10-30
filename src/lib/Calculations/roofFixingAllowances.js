const rate=v=>v==null||v===''||!Number.isFinite(Number(v))||Number(v)<0?null:Number(v);
export function lathRowFixingCount(reachesMM,positionMM) {
return 2+reachesMM.filter(v=>Number(v)+24>=positionMM).length;
}
export function lathFixingSupply({internalScrews,externalRowScrews,supportScrews}) {
 const externalScrews=externalRowScrews+supportScrews;
 return {internalScrews,externalRowScrews,supportScrews,perimeterScrews:0,externalScrews,internalBoxes:Math.ceil(internalScrews/250),externalBoxes:Math.ceil(externalScrews/250),totalBoxes:Math.ceil(internalScrews/250)+Math.ceil(externalScrews/250),unitsPerBox:250};
}
export function tileFixingSupply({mainQty,hipQty,capQty,steel,materials:m={}}) {
 const mainRate=rate(steel?m.tileFixings?.per_tile_britmet??3:m.tileFixings?.per_tile_liteslate??2),hipRate=rate(m.tileFixings?.per_ridge_cap??4),capRate=rate(m.tileFixings?.per_hip_end_cap??2),unitsPerBox=Number(m.tileFixings?.units_per_box??200);
 if([mainQty,hipQty,capQty,mainRate,hipRate,capRate].some(v=>rate(v)===null)||!Number.isInteger(unitsPerBox)||unitsPerBox<=0)return null;
 const mainScrews=mainQty*mainRate,accessoryScrews=hipQty*hipRate+capQty*capRate,totalScrews=mainScrews+accessoryScrews;
 return {mainScrews,accessoryScrews,totalScrews,boxes:Math.ceil(totalScrews/unitsPerBox),unitsPerBox};
}
export function concreteScrewAllowance(materials={}) {
 const qty=8,pack=Number(materials.concrete_screws_units_per_box??100),price=rate(materials.concrete_screws_price_per_box),unitPrice=Number.isInteger(pack)&&pack>0&&price!==null?price/pack:null;
 return {qty,unitPrice,cost:unitPrice===null?null:qty*unitPrice,unitsPerBox:pack};
}
// Use an explicit box-weight rate, not ambiguous legacy per-item aliases.
export function installedFixingWeight({count,unitsPerBox,boxWeightKg}) {
 const kg=rate(boxWeightKg);return kg===null||!(unitsPerBox>0)?null:count/unitsPerBox*kg;
}
