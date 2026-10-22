import {normalizeVictorianFiveDesignInputs} from './geometry/victorianFiveDesignInputs';
/* global globalThis */
import {normalizeVictorianDesignInputs} from './geometry/victorianDesignInputs';
export const victorianBookDraftKey=inputs=>inputs?.roofStyle==='victorian-five'||inputs?.frontFacetCount===5?'victorianFiveBookDetails':'victorianBookDetails';
export function victorianBookIdentity(inputs){
 const value=(victorianBookDraftKey(inputs)==='victorianFiveBookDetails'?normalizeVictorianFiveDesignInputs:normalizeVictorianDesignInputs)(inputs);
 return JSON.stringify(Object.fromEntries(['widthMM','projMM','pitchDeg','maxFinishedHeightMM','frameThicknessMM','soffitMM','soffitMode','cornerAnglesDeg','bossTopContinuationMM','upstandArrangement','selectedCustomerId','customerReference','tileProductId','tileColour','fasciaColour','gutterProfile','gutterColour'].map(k=>[k,value[k]])));
}
export function readVictorianBookDraft(inputs,storage=globalThis.localStorage){
 const key=victorianBookDraftKey(inputs);
 try{const saved=JSON.parse(storage.getItem(key)||'null');if(!saved)return inputs[key]||null;let same=saved.design===victorianBookIdentity(inputs);try{same=same||victorianBookIdentity(JSON.parse(saved.design))===victorianBookIdentity(inputs);}catch{}return same?saved.details||{}:inputs[key]||null;}catch{return inputs[key]||null;}
}
