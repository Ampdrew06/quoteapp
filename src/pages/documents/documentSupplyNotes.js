import {buildDoubleEdwardianMaterialsModel} from '../../lib/Calculations/doubleEdwardianMaterialsModel';
import {buildCombinationSummaryMaterialsModel} from '../../lib/Calculations/combinationQuotation';
import {buildSummaryMaterialsModel} from '../../lib/Calculations/summaryMaterialsModel';
import {buildGableSummaryMaterialsModel} from '../../lib/Calculations/gableSummaryMaterialsModel';
import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
import {buildVictorianSummaryMaterialsModel} from '../../lib/Calculations/victorianSummaryMaterialsModel';
import {buildVictorianFiveSummaryMaterialsModel} from '../../lib/Calculations/victorianFiveQuotation';
import {buildVictorianHippedSummaryMaterialsModel} from '../../lib/Calculations/victorianHippedSummaryMaterialsModel';

const builders={'lean-to':buildSummaryMaterialsModel,gable:buildGableSummaryMaterialsModel,edwardian:buildEdwardianSummaryMaterialsModel,
 victorian:buildVictorianSummaryMaterialsModel,'victorian-five':buildVictorianFiveSummaryMaterialsModel,'victorian-hipped':buildVictorianHippedSummaryMaterialsModel,
 'double-edwardian':buildDoubleEdwardianMaterialsModel,combination:buildCombinationSummaryMaterialsModel};
const names={tiles:'Tiles',gutters:'Gutters',plastics:'Fascia / soffit materials',timber:'Timber',metal:'Metal elements',misc:'Miscellaneous materials'};
const vhStates=['victorianHippedTimberSummary','victorianHippedTileSummary','victorianHippedPlasticsSummary','victorianHippedMetalGutterSummary','victorianHippedMiscSummary'];
const quantity=row=>Math.max(0,Number(row.qty??row.baseQty??row.netQty??0)||0);
const text=row=>String(row.label??row.name??row.key).replace(/^Extra\s*[—–-]\s*/i,'');
const number=value=>Number(value.toFixed(3)).toLocaleString('en-GB',{maximumFractionDigits:3});
const amount=(qty,row)=>`${number(qty)}${row.units?' '+row.units:''} × ${text(row)}`;
export function supplyModelRows(model={}) {
 const sections=Array.isArray(model.sections)?model.sections:Object.entries(model.sections??{}).map(([key,section])=>({key,...section}));
 return sections.flatMap(section=>(section.lines??section.rows??[]).map(row=>({...row,section:section.key==='guttering'?'gutters':section.key})));
}
// Compare saved Summary supply choices against the unmodified roof requirement.
// Prices, internal cost breakdowns and installed weights never enter customer notes.
export function describeSupplyChanges({rows=[],baseRows=[],exclusions={},adjustments={}}={}) {
 const base=new Map(baseRows.map(row=>[row.key,row]));
 const excluded=row=>row.excluded===true||row.extraExcluded===true||exclusions[row.key]===true;
 const required=row=>Math.max(quantity(row),quantity(base.get(row.key)??{}))>0;
 const omitted=row=>excluded(row)||quantity(row)===0;
 const notIncluded=[];
 for(const [section,label] of Object.entries(names)){
  const standard=rows.filter(row=>row.section===section&&!row.isAddedItem&&row.supplyToSite!==false&&required(row));
  const extras=rows.filter(row=>row.section===section&&row.isAddedItem&&!excluded(row)&&quantity(row)>0);
  if(standard.length&&standard.every(omitted)&&!extras.length)notIncluded.push({section,label});
 }
 const entire=new Set(notIncluded.map(item=>item.section));
 const notes=[];
 for(const row of rows){
  if(row.supplyToSite===false)continue;
  if(row.isAddedItem){
   // Removing or excluding an optional extra simply removes it from the offer.
   if(!excluded(row)&&quantity(row)>0)notes.push('Extra supplied: '+amount(quantity(row),row)+'.');
   continue;
  }
  const original=base.get(row.key);
  if(!required(row)||entire.has(row.section))continue;
  if(omitted(row)){
   // Only explicit supply decisions are described, not optional items disabled by default.
   if(exclusions[row.key]===true||Number(adjustments[row.key])<0)notes.push('Not included: '+text(row)+'.');
  }else{
   const delta=quantity(row)-quantity(original??row);
   if(Number(adjustments[row.key])!==0&&Number.isFinite(Number(adjustments[row.key]))&&Math.abs(delta)>0.000001)
    notes.push((delta>0?'Extra supplied: ':'Supply reduced by: ')+amount(Math.abs(delta),row)+'.');
  }
 }
 return {notes:[...new Set(notes)],notIncluded};
}
// The quotation and order form both show these omissions in the roof specification.
export function customerOrderNotes(notes, excludedSections) {
 const lines=String(notes??'').split(/\r?\n/);
 return lines.filter(line=>{
  const text=line.trim().replace(/[.!]$/, '');
  return !(excludedSections.has('gutters')&&/^no gutters$/i.test(text))
   && !(excludedSections.has('tiles')&&/^(?:no tiles|tile colou?r tbc)$/i.test(text));
 }).join('\n').trim();
}
export function supplyOmissionNotes(notIncluded = []) {
 return notIncluded.filter(({section})=>section!=='tiles'&&section!=='gutters')
  .map(({label})=>label+' — Not Included.');
}
export function orderFormInternalCover(cover, plasterboard) {
 const required=plasterboard?.required;
 const supplied=plasterboard?.supplied;
 const sheets=count=>`${count} plasterboard sheet${count===1?'':'s'} (2400 × 1200 mm)`;
 if(supplied>0){
  const remaining=Math.max(0,(required??0)-supplied);
  return `Included — ${sheets(supplied)}${remaining>0?` · ${remaining} more required`:''}`;
 }
 return /^not included$/i.test(cover.trim())&&required>0
  ? `Not Included - ${required} required`
  : cover;
}
export function documentSupplyNotes(record={},family,{includePlasterboard=false}={}) {
 const inputs=record.inputs_json??{},materials=record.materials_snapshot_json??{};
 const states=[inputs.summaryPricingState??{},...(family==='victorian-hipped'?vhStates.map(key=>inputs[key]??{}):[])];
 const exclusions=Object.assign({},...states.map(state=>state.exclusions??{}));
 const adjustments=Object.assign({},...states.map(state=>state.adjustments??{}));
 const changed=states.some(state=>Object.values(state.exclusions??{}).some(Boolean)||Object.values(state.adjustments??{}).some(value=>Number(value)!==0))||(inputs.summaryAddedItems??[]).some(item=>!item.excluded&&Number(item.qty)>0);
 if(!changed&&!includePlasterboard)
  return {notes:[],notIncluded:[]};
 const build=builders[family];
 if(!build)return {notes:[],notIncluded:[]};
 const model=build({inputs,materials,exclusions,adjustments,addedItems:inputs.summaryAddedItems??[]});
 const rows=supplyModelRows(model);
 const plasterboard=includePlasterboard?{
  required:model.plasterboard?.sheets??model.audits?.misc?.plasterboard?.sheets,
  supplied:rows.filter(row=>row.isAddedItem&&!row.excluded&&!row.extraExcluded&&!exclusions[row.key]
   && /plasterboard/i.test(text(row))&&/^sheets?$/i.test(row.units??'')).reduce((sum,row)=>sum+quantity(row),0),
 }:undefined;
 if(!changed)return {notes:[],notIncluded:[],plasterboard};
 const baseline={...inputs,summaryPricingState:{exclusions:{},adjustments:{}},summaryAddedItems:[]};
 for(const key of vhStates)if(baseline[key])baseline[key]={...baseline[key],exclusions:{},adjustments:{}};
 const baseRows=supplyModelRows(build({inputs:baseline,materials,exclusions:{},adjustments:{},addedItems:[]}));
 const supply=describeSupplyChanges({rows,baseRows,exclusions,adjustments});
 return includePlasterboard?{...supply,plasterboard}:supply;
}

export function manufactureFrontSupply(inputs, materials, family) {
 const {notIncluded, notes}=documentSupplyNotes({inputs_json:inputs,materials_snapshot_json:materials},family);
 return {
  excludedSections:notIncluded.map(item=>item.section),
  omissions:[
   ...notIncluded.filter(({section})=>!['tiles','gutters','plastics'].includes(section)).map(({label})=>label),
   ...notes.filter(note=>note.startsWith('Not included: ')).map(note=>note.slice('Not included: '.length,-1)),
  ],
 };
}
