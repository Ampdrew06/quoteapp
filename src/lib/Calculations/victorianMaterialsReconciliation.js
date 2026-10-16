import {buildVictorianTimberAudit} from './victorianTimberAudit';
import {buildVictorianInsulationAudit} from './victorianInsulationAudit';
import {buildVictorianLathAudit} from './victorianLathAudit';
import {buildVictorianTilingAudit} from './victorianTilingAudit';
import {buildVictorianMetalFixingsAudit} from './victorianMetalFixingsAudit';
import {buildVictorianPlasticsGutteringAudit} from './victorianPlasticsGutteringAudit';
const pennies=n=>Math.round((n+Number.EPSILON)*100)/100;
export function buildVictorianMaterialsReconciliation({geometry,materials={},productId='britmetShingle',plasticsColour='white',gutterProfile='ogee'}={}){
 const args={geometry,materials,productId};
 const audits={timber:buildVictorianTimberAudit(args),insulation:buildVictorianInsulationAudit(args),laths:buildVictorianLathAudit(args),tiles:buildVictorianTilingAudit(args),metal:buildVictorianMetalFixingsAudit(args),plastics:buildVictorianPlasticsGutteringAudit({...args,plasticsColour,gutterProfile})};
 const errors=[...new Set(Object.values(audits).flatMap(a=>a.valid?[]:a.errors))];
 if(errors.length)return {valid:false,readOnly:true,errors,sections:{},audits};
 const sections=Object.fromEntries(['timber','tiles','plastics','metal','gutters','misc'].map(key=>[key,{lines:[]}]));
 const add=(section,source,r,qty=r.qty??r.quantity,unit=r.unit,extra={})=>sections[section].lines.push({key:`${source}_${r.key}`,source,sourceKey:r.key,label:r.label,qty,unit,cost:r.cost==null?null:pennies(r.cost),installedWeightKg:r.installedWeightKg??null,supplyToSite:true,...extra});
 audits.timber.lines.forEach(r=>add('timber','timber',r,r.quantity,r.unit,{supplyToSite:false}));
 audits.laths.lines.forEach(r=>add('timber','laths',r,r.lengthM,'m',{supplyToSite:true}));
 audits.tiles.lines.forEach(r=>add(r.key==='starter'?'metal':r.key==='hipTape'?'misc':'tiles','tiles',r,r.quantity,r.unit));
 audits.plastics.plasticLines.forEach(r=>add(r.key==='polytop_pins'?'misc':'plastics','plastics',r,r.qty,r.unit,{supplyToSite:r.key!=='factory_venting',usage:r.key==='factory_venting'?'factory':'site'}));
 audits.plastics.gutterLines.forEach(r=>add('gutters','gutters',r));
 audits.metal.metalRows.forEach(r=>add('metal','metal',r,r.qty,r.unit,{supplyToSite:r.supplyToSite,usage:r.usage}));
 [...audits.metal.siteRows,...audits.metal.factoryRows].forEach(r=>add('misc','fixings',r,r.qty,r.unit,{supplyToSite:r.supplyToSite,usage:r.usage}));
 audits.insulation.lines.forEach(r=>{
  const qty=r.sheets??(r.key==='superQuilt'?r.rolls12+r.rolls15:r.rolls);
  add('misc','insulation',r,qty,r.sheets!=null?'sheets':'rolls',{supplyToSite:r.key!=='pir50',usage:r.key==='pir50'?'fitted':'site',basis:r.key==='superQuilt'?`${r.rolls12} ×12m² + ${r.rolls15} ×15m² rolls`:undefined});
 });
 const all=Object.values(sections).flatMap(s=>s.lines),keys=all.map(r=>r.key);
 if(new Set(keys).size!==keys.length)return {valid:false,readOnly:true,errors:['Duplicate material allocation keys.'],sections:{},audits};
 Object.values(sections).forEach(s=>{s.knownCost=pennies(s.lines.reduce((n,r)=>n+(r.cost??0),0));s.missingPrices=s.lines.filter(r=>r.cost==null&&(r.qty==null||r.qty>0));});
 const missingPrices=all.filter(r=>r.cost==null&&(r.qty==null||r.qty>0));
 const supplyReviews=[...audits.tiles.supplyReviews,...audits.metal.supplyReviews,...(audits.insulation.membrane.coverageReview?['Breather membrane exceeds current roll coverage.']:[])];
 const knownCost=pennies(Object.values(sections).reduce((n,s)=>n+s.knownCost,0));
 const rawAuditCost=Object.values(audits).reduce((n,a)=>n+a.knownCost,0);
 const knownInstalledWeightKg=all.reduce((n,r)=>n+(r.installedWeightKg??0),0),deferredWeights=all.filter(r=>r.installedWeightKg==null&&(r.qty==null||r.qty>0));
 return {valid:true,readOnly:true,errors:[],audits,sections,lines:all,knownCost,rawAuditCost,roundingDifference:pennies(knownCost-rawAuditCost),missingPrices,supplyReviews,costComplete:missingPrices.length===0&&supplyReviews.length===0,knownInstalledWeightKg,deferredWeights,plasterboard:{...audits.insulation.plasterboard,label:'Plasterboard — NOT SUPPLIED',cost:0},notes:[
 'Each source audit line is allocated once. Displayed line costs are rounded to pennies before section totals.',
 'Timber includes ring-beam laths once; the five additional lath uses are added once. Pooled stock quantities remain an order allowance, with no second charge or change to the accepted net-metre costing.',
 'Tile starter moves from the covering audit to Metal; hip foam tape moves to Miscellaneous. Metal audit reference copies and lath tape references are excluded.',
 '50mm PIR,100mm PIR, SuperQuilt and membrane each appear once. Plasterboard is a separate customer buying guide with no supplied cost.',
 'Factory consumables are charged once and excluded from loose site supplies. Manufactured timber components and fitted hardware are not duplicated as loose raw stock.',
 'Weights remain a known partial allowance pending the agreed final review; missing weights do not block the cost reconciliation.',
 'Read-only review: no labour, delivery, markup or VAT included. Live Summary/customer quotation pricing is not connected.'
 ]};
}
