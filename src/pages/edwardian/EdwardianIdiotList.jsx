import EdwardianNavigation from './EdwardianNavigation';
import {Navigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import React,{useState,useEffect} from 'react';
import {getCustomers} from '../../lib/customers';
import {getMaterials} from '../../lib/materials';
import {buildEdwardianSummaryMaterialsModel} from '../../lib/Calculations/edwardianSummaryMaterialsModel';
import {buildEdwardianIdiotList} from '../../lib/Calculations/edwardianIdiotList';
import SummaryIdiotList from '../../components/SummaryIdiotList';
export default function EdwardianIdiotList(){
 const [inputs]=useState(()=>{try{return JSON.parse(localStorage.getItem('edwardianInputs')||'{}');}catch{return {};}});
 const [customerName,setCustomerName]=useState('');
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomerName((rows||[]).find(c=>c.id===inputs.selectedCustomerId)?.name||(inputs.selectedCustomerId==='retail'?'Retail':'—'));}).catch(()=>{});return()=>{alive=false;};},[inputs]);
 if(!isAdminUser())return <Navigate to="/quote" replace/>;
 const materials=getMaterials(),model=buildEdwardianSummaryMaterialsModel({inputs,materials}),checklist=buildEdwardianIdiotList(model,materials);
 if(!model.valid)return <p role="status">{model.errors.join(' ')}</p>;
 return <><EdwardianNavigation/><main style={{maxWidth:1000,margin:'auto',padding:16}}><SummaryIdiotList model={model} materials={materials} checklist={checklist} inputs={{...inputs,customerName,quoteRef:inputs.customerReference,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour||inputs.plasticsColour,gutterColor:inputs.gutterColour}}/></main></>;
}
