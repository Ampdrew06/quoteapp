import {moneyNumber} from './scheduleModel';
import {LITESLATE_COLOURS} from './tileColours';
export const scheduleTileSystems={Britmet:['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Smoked Oak','Rustic Red','Tartan Green'],LiteSlate:LITESLATE_COLOURS,Metrotile:['Burnt Umber'],Tapco:[]};
export function parseScheduleTile(value){
 const text=String(value||'').trim();if(!text)return {system:'',colour:''};
 const match=text.match(/^(britmet(?:shingle)?|lite[ -]?slate|metrotile(?:shingle)?|tapco(?:slate)?)(?=$|\s|\/|—|–|-)/i);
 if(!match)return {system:'custom',colour:'',custom:text};
 const prefix=match[1].toLowerCase().replace(/[ -]/g,''),system=prefix.startsWith('britmet')?'Britmet':prefix.startsWith('lite')?'LiteSlate':prefix.startsWith('metro')?'Metrotile':'Tapco';
 return {system,colour:text.slice(match[0].length).replace(/^[\s/—–-]+/,'')};
}
export const scheduleTileText=(system,colour)=>[system,colour].filter(Boolean).join(' / ');
export function scheduleGrossFromNet(value,rate=.2){const n=moneyNumber(value);return n===null||n<0?'':(Math.round((n*(1+rate)+Number.EPSILON)*100)/100).toFixed(2);}
export function scheduleVatRate(entry={},job=null){const rate=moneyNumber(entry.vatRate??job?.pricing_json?.vatRate);return rate!==null&&rate>=0&&rate<=1?rate:.2;}
