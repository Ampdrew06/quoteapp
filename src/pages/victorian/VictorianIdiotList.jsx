import {buildVictorianFiveSummaryMaterialsModel} from '../../lib/Calculations/victorianFiveQuotation';
import React,{useState,useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {getCustomers} from '../../lib/customers';
import {buildVictorianSummaryMaterialsModel} from '../../lib/Calculations/victorianSummaryMaterialsModel';
import {buildVictorianIdiotList} from '../../lib/Calculations/victorianIdiotList';
import VictorianNavigation from './VictorianNavigation';
import SummaryIdiotList from '../../components/SummaryIdiotList';
export default function VictorianIdiotList({five=false}={}){return isAdminUser()?<VictorianChecklistContent five={five} key={five?'five':'three'}/>:<Navigate to="/quote" replace/>;}
export function VictorianChecklistContent({five=false}={}){
 const key=five?'victorianFiveInputs':'victorianPlanPreviewInputs',modelBuilder=five?buildVictorianFiveSummaryMaterialsModel:buildVictorianSummaryMaterialsModel;
 const [inputs]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{return {};}}),[customerName,setCustomerName]=useState(inputs.customerName||'');
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomerName((rows||[]).find(c=>c.id===inputs.selectedCustomerId)?.name||inputs.customerName||(inputs.selectedCustomerId==='retail'?'Retail':'—'));}).catch(()=>{});return()=>{alive=false;};},[inputs]);
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const materials=getMaterials(),model=modelBuilder({inputs,materials}),checklist=buildVictorianIdiotList(model,materials);
 if(!model.valid)return <><VictorianNavigation five={five}/><p role="status">{model.errors.join(' ')}</p></>;
 return <><VictorianNavigation five={five}/><main className="vi-checklist"><SummaryIdiotList compact model={model} materials={materials} checklist={checklist} inputs={{...inputs,pitchDeg:model.audits.geometry.pitchDeg,customerName,quoteRef:inputs.customerReference,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour||inputs.plasticsColour,gutterColor:inputs.gutterColour}}/></main><style>{`.vi-checklist{box-sizing:border-box;max-width:194mm;margin:16px auto;padding:4mm}.vi-print{margin-bottom:12px}@media print{@page{size:A4;margin:6mm}.nav-strip,.vi-print{display:none!important}.vi-checklist{width:194mm;margin:0;padding:4mm}}`}</style></>;
}
