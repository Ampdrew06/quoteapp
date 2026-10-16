/* global globalThis */
import {normalizeVictorianDesignInputs} from './geometry/victorianDesignInputs';
export function victorianBookIdentity(inputs){
 const value=normalizeVictorianDesignInputs(inputs);
 return JSON.stringify(Object.fromEntries(['widthMM','projMM','pitchDeg','maxFinishedHeightMM','frameThicknessMM','soffitMM','soffitMode','cornerAnglesDeg','bossTopContinuationMM','upstandArrangement','selectedCustomerId','customerReference','tileProductId','tileColour','fasciaColour','gutterProfile','gutterColour'].map(k=>[k,value[k]])));
}
export function readVictorianBookDraft(inputs,storage=globalThis.localStorage){
 try{const saved=JSON.parse(storage.getItem('victorianBookDetails')||'null');if(!saved)return inputs.victorianBookDetails||null;let same=saved.design===victorianBookIdentity(inputs);try{same=same||victorianBookIdentity(JSON.parse(saved.design))===victorianBookIdentity(inputs);}catch{}return same?saved.details||{}:inputs.victorianBookDetails||null;}catch{return inputs.victorianBookDetails||null;}
}
