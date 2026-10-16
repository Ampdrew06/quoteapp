export const VICTORIAN_DESIGN_KEY='victorianPlanPreviewInputs';
export const victorianDesignDefaults={widthMM:'',projMM:'',pitchDeg:25,frameThicknessMM:70,soffitMM:150,soffitMode:'standard',maxFinishedHeightMM:'',sideSoffitMode:'automatic',ridgeMode:'automatic',cornerAnglesDeg:[135,135,135,135],bossTopContinuationMM:160,tileProductId:'britmetShingle',tileColour:'Titanium',fasciaColour:'White',plasticsColour:'white',gutterProfile:'square',gutterColour:'White',deliveryPostcode:'',customerReference:'',selectedCustomerId:'retail',quoteDisplayed:false};
export function normalizeVictorianDesignInputs(saved={},customerId='retail'){
 const next={...victorianDesignDefaults,selectedCustomerId:customerId,...saved};
 next.cornerAnglesDeg=Array.isArray(saved.cornerAnglesDeg)&&saved.cornerAnglesDeg.length===4?[...saved.cornerAnglesDeg]:[135,135,135,135];
 next.soffitMode=saved.soffitMode??(Number(next.soffitMM)===150?'standard':'specified');
 next.fasciaColour=saved.fasciaColour||(saved.plasticsColour==='foiled'?'Foiled (unspecified)':saved.plasticsColour||'White');
 if(next.fasciaColour.toLowerCase()==='white')next.fasciaColour='White';
 next.plasticsColour=next.fasciaColour==='White'?'white':'foiled';
 return next;
}
export function updateVictorianDesignInputs(old,key,value){
 const next={...old,[key]:value};
 if(key==='deliveryPostcode'){next.deliveryDistanceMiles='';next.deliveryDistancePostcode='';}
 if(key==='fasciaColour')next.plasticsColour=value==='White'?'white':'foiled';
 if(key==='tileProductId')next.tileColour=value==='liteSlate'||value==='tapcoSlate'?'Slate':'Titanium';
 if(key==='pitchDeg')next.maxFinishedHeightMM='';
 if(key==='soffitMM')next.soffitMode=Number(value)===150?'standard':'specified';
 if(key==='soffitMode'&&value==='standard')next.soffitMM=150;
 return next;
}
