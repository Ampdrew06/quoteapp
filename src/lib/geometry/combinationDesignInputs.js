export const COMBINATION_DESIGN_KEY='combinationGeometryDraft';
export const combinationDesignDefaults={widthMM:'',projMM:'',pitchDeg:25,frameThicknessMM:70,soffitMM:150,maxFinishedHeightMM:'',leftSide:'edwardian',rightSide:'victorian',tileProductId:'britmetShingle',tileColour:'Titanium',plasticsColour:'white',fasciaColour:'White',gutterProfile:'square',gutterColour:'Black',customerReference:'',deliveryPostcode:'',selectedCustomerId:'retail',customerName:'Retail',quoteDisplayed:false,deliveryDistanceMiles:'',deliveryDistancePostcode:'',labourDaysOverride:'',combinationFacetGeometry:undefined,combinationRafterPositionsMM:undefined,combinationRearTrussPositionsMM:undefined,combinationSpacingOverride:false,summaryPricingState:undefined,summaryAddedItems:[]};
export function normalizeCombinationInputs(saved={}){
 return {...combinationDesignDefaults,...saved,fasciaColour:saved.fasciaColour||(saved.plasticsColour==='foiled'?'Foiled (unspecified)':'White')};
}
