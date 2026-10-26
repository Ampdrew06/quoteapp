/* global globalThis */
import {useEffect} from 'react';
export const ROOF_NAVIGATION_KEY='quoteapp_navigation_roof';
const families=['lean-to','gable','edwardian','victorian','victorian-five','victorian-hipped'];
export function rememberRoofNavigation(family,storage=globalThis.localStorage){
 try{if(families.includes(family))storage.setItem(ROOF_NAVIGATION_KEY,family);}catch{}
}
export function readRoofNavigation(storage=globalThis.localStorage){
 try{const family=storage.getItem(ROOF_NAVIGATION_KEY);return families.includes(family)?family:'lean-to';}catch{return 'lean-to';}
}
export function useRememberRoofNavigation(family){useEffect(()=>{rememberRoofNavigation(family);},[family]);}
export function roofFamilyFromPath(pathname){return families.find(f=>pathname==='/quote/'+f||pathname.startsWith('/quote/'+f+'/'))||null;}
