/* global globalThis */
import {normalizeCombinationInputs,COMBINATION_DESIGN_KEY} from './geometry/combinationDesignInputs';
import {readActiveDesignRecord,rememberActiveDesignRecord,draftDesignIdentity} from './activeDesignRecord';
const DRAFT='combinationBookDraft';
export function combinationBookIdentity(inputs){
 const i=normalizeCombinationInputs(inputs);
 return JSON.stringify(Object.fromEntries(['widthMM','projMM','pitchDeg','maxFinishedHeightMM','soffitMM','leftSide','rightSide','tileProductId','tileColour','fasciaColour','gutterProfile','gutterColour','selectedCustomerId','customerReference','combinationFacetGeometry','combinationRafterPositionsMM','combinationRearTrussPositionsMM','combinationSpacingOverride'].map(k=>[k,i[k]])));
}
function owner(storage){return readActiveDesignRecord('combination',storage)?.id||draftDesignIdentity(storage);}
export function readCombinationBookDetails(inputs,storage=globalThis.localStorage){
 const current=readActiveDesignRecord('combination',storage);
 try{const d=JSON.parse(storage.getItem(DRAFT)||'null');if(d?.owner===owner(storage)&&d.identity===combinationBookIdentity(inputs)&&(!current||d.unsynced))return d.details;}catch{}
 const details={...inputs.combinationBookDetails};
 for(const key of ['job_number','requested_delivery_date','order_notes','delivery_address_json'])if(current&&Object.prototype.hasOwnProperty.call(current,key))details[key]=current[key];
 return {...details,job_number:details.job_number||'',requested_delivery_date:details.requested_delivery_date||'',order_notes:details.order_notes||'',delivery_address_json:details.delivery_address_json||{deliveryAddress:inputs.deliveryPostcode||''}};
}
export async function saveCombinationBookDetails({inputs,details,updateQuote,storage=globalThis.localStorage,expectedOwner}){
 const identity=combinationBookIdentity(inputs),current=readActiveDesignRecord('combination',storage),actualOwner=owner(storage),bookOwner=expectedOwner??actualOwner,sameOwner=actualOwner===bookOwner;
 storage.setItem(DRAFT,JSON.stringify({owner:bookOwner,identity,details,unsynced:true}));
 // Keep the draft attached to the design so its next Save Quote includes it.
 let draft=inputs;try{draft=JSON.parse(storage.getItem(COMBINATION_DESIGN_KEY)||'null')||inputs;}catch{}
 if(sameOwner&&combinationBookIdentity(draft)===identity)storage.setItem(COMBINATION_DESIGN_KEY,JSON.stringify({...draft,combinationBookDetails:details}));
 if(!sameOwner||!current||combinationBookIdentity(current.inputs_json)!==identity)return {savedToQuote:false,message:'Draft book details saved on this device. Save the current design on Design/Options to keep them with the quote.'};
 const nextInputs={...current.inputs_json,combinationBookDetails:details};
 const patch={inputs_json:nextInputs,job_number:details.job_number||current.job_number||null,requested_delivery_date:details.requested_delivery_date||null,order_notes:details.order_notes||'',delivery_address_json:details.delivery_address_json||{}};
 try{
  const result=await updateQuote(current.id,patch);
  if(!result?.id)return {savedToQuote:false,message:'Book details saved on this device; the quote update failed. Please retry.'};
  storage.setItem(DRAFT,JSON.stringify({owner:current.id,identity,details,unsynced:false}));
  if(readActiveDesignRecord('combination',storage)?.id===current.id)rememberActiveDesignRecord({...current,...patch,...result,inputs_json:nextInputs},storage);
  return {savedToQuote:true,message:'Book details saved with the quote/job.'};
 }catch{return {savedToQuote:false,message:'Book details saved on this device; the quote update failed. Please retry.'};}
}
