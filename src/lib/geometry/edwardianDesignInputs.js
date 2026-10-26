// Form adapter: retain saved geometry, but offer pitch controls rather than manual ridge coordinates.
export const EDWARDIAN_DESIGN_KEY='edwardianInputs';
export const edwardianDesignDefaults={widthMM:'',projMM:'',pitchDeg:25,frameThicknessMM:70,soffitMM:150,maxFinishedHeightMM:'',ridgeMode:'automatic',frontPitchDeg:25,sideSoffitMode:'automatic',specifiedSideSoffitMM:100,tileProductId:'britmetShingle',tileColour:'Titanium',plasticsColour:'white',fasciaColour:'White',gutterProfile:'square',gutterColour:'White',customerReference:'',deliveryPostcode:'',selectedCustomerId:'retail'};
export function normalizeEdwardianDesignInputs(saved={},customerId='retail'){
 const inputs={...edwardianDesignDefaults,selectedCustomerId:customerId,...saved};
 if(saved.ridgeMode==='manual'){
  const run=Number(saved.projMM)-Number(saved.ridgePositionMM),rise=Number(saved.widthMM)/2*Math.tan(Number(saved.pitchDeg)*Math.PI/180);
  if(run>0&&rise>0){inputs.ridgeMode='frontPitch';inputs.frontPitchDeg=Math.atan2(rise,run)*180/Math.PI;}
 }
 inputs.fasciaColour=saved.fasciaColour||(saved.plasticsColour==='white'?'White':saved.plasticsColour==='foiled'?'Foiled (unspecified)':saved.plasticsColour||'White');
 if(inputs.fasciaColour==='white')inputs.fasciaColour='White';
 inputs.tileColour=saved.tileColour||(inputs.tileProductId==='liteSlate'?'Slate':'Titanium');
 return inputs;
}
export function updateEdwardianDesignInputs(old,key,value,admin=false){
 if((key==='frontRafterPositionsMM'||key==='frontRafterSpacingOverride')&&!admin)return old;
 if((key==='trussMinimumSpacingMM'||key==='allowCloserRearTrusses')&&!admin)return old;
 const next={...old,[key]:value};
 if(key==='allowCloserRearTrusses'){if(value)next.trussMinimumSpacingMM=350;else delete next.trussMinimumSpacingMM;delete next.allowCloserRearTrusses;}
 if(key==='pitchDeg'){next.maxFinishedHeightMM='';if(!admin)next.ridgeMode='automatic';}
 if(key==='fasciaColour')next.plasticsColour=value==='White'?'white':'foiled';
 if(key==='tileProductId')next.tileColour=value==='liteSlate'?'Slate':'Titanium';
 if(key==='adjustFrontPitch'){next.ridgeMode=admin&&value?'frontPitch':'automatic';if(value&&old.ridgeMode!=='frontPitch')next.frontPitchDeg=old.pitchDeg;delete next.adjustFrontPitch;}
 return next;
}
