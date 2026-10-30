import React,{useState} from 'react';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildVictorianHippedSummaryMaterialsModel} from '../../lib/Calculations/victorianHippedSummaryMaterialsModel';
import SummaryIdiotList from '../../components/SummaryIdiotList';
import VictorianHippedNavigation from './VictorianHippedNavigation';

export function buildVictorianHippedChecklist(model,{groupAssemblies=false}={}){
 const sections={};
 if(!model.valid)return {valid:false,sections,installedWeightKg:0};
 const {timber,misc}=model.audits;
 sections.assemblies=timber.geometry.manufactureNumbering.entries.map(r=>({key:r.id,item:`${r.reference} — ${r.type}`,qty:1,units:'Ea'}));
 if(groupAssemblies){
  const labels={'Left wallbar':'Sloping wallbars','Right wallbar':'Sloping wallbars','Left wall-side rafter':'Wall-side rafters','Right wall-side rafter':'Wall-side rafters',hip:'Hips',Hip:'Hips',jack:'Jack rafters',rafter:'Rafters','boss-rafter':'Boss rafters','Horizontal wallplate':'Horizontal wallplate','Ring-beam':'Ring-beams'},groups=new Map();
  for(const r of timber.geometry.manufactureNumbering.entries){const label=labels[r.type]||r.type;if(!groups.has(label))groups.set(label,[]);groups.get(label).push(r.reference);}
  sections.assemblies=[...groups].map(([label,refs])=>({key:label,item:`${label} — ${refs.join(' / ')}`,qty:refs.length,units:'Ea'}));
 }
 const factory=new Set(['vh_misc_glue','vh_misc_factory_screws','vh_misc_rivets','vh_misc_staples','vh_venting']);
 for(const section of model.sections.filter(s=>s.key!=='timber')){
  sections[section.key==='guttering'?'gutters':section.key]=section.rows.filter(r=>r.usage!=='factory'&&r.supplyToSite!==false&&!factory.has(r.key)&&!r.label.startsWith('Factory fascia venting')&&Number(r.orderQty)>0).map(r=>({key:r.key,item:r.label,qty:Number(r.orderQty),units:r.adjustmentUnit||r.units}));
 }
 const loose=timber.rows.filter(r=>['vh_field_laths','vh_chamfer_laths','vh_internal_laths','vh_hip_laths'].includes(r.key));
 sections.laths=loose.filter(r=>r.qty>0).map(r=>({key:r.key,item:r.label,qty:r.qty,units:'m — cut schedule'}));
 sections.misc.push({key:'plasterboard_guide',item:'Plasterboard 2400×1200mm — NOT SUPPLIED',qty:misc.plasterboard.sheets,units:'Sheets',informational:true});
 return {valid:true,sections,installedWeightKg:model.knownSuppliedWeightKg+misc.plasterboard.weightKg,weightProvisional:!model.weightComplete,despatchOnly:true};
}
// Reuse the same physical supply list in the book, without a nested page/nav.
export function VictorianHippedChecklist({inputs,materials,groupAssemblies=false}){
 const model=buildVictorianHippedSummaryMaterialsModel({inputs,materials}),checklist=buildVictorianHippedChecklist(model,{groupAssemblies});
 return model.valid?<SummaryIdiotList compact model={model} materials={materials} checklist={checklist} inputs={{...inputs,pitchDeg:model.audits.geometry.pitchDeg,quoteRef:inputs.customerReference,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour,gutterColor:inputs.gutterColour}}/>:<p role="status">Enter valid roof dimensions on Design/Options before opening the checklist.</p>;
}
export default function VictorianHippedIdiotList(){
 const [inputs]=useState(()=>{try{return JSON.parse(localStorage.getItem('victorianHippedPreviewInputs')||'{}');}catch{return {};}});
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 return <><VictorianHippedNavigation/><main className="app-page-content" style={{paddingTop:16}}><VictorianHippedChecklist inputs={inputs} materials={getMaterials()}/></main></>;
}
