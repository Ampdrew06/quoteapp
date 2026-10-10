import React,{useState,useEffect} from 'react';
import {getCustomers} from '../../lib/customers';
import {getMaterials} from '../../lib/materials';
import {buildGableSummaryMaterialsModel} from '../../lib/Calculations/gableSummaryMaterialsModel';
import {buildGableManufactureSchedule} from '../../lib/Manufacturing/gableManufactureSchedule';
import SummaryIdiotList from '../../components/SummaryIdiotList';
export default function GableIdiotList(){
 const [inputs]=useState(()=>{try{return JSON.parse(localStorage.getItem('gableDesignPreviewInputs')||'{}');}catch{return {};}});
 const [customerName,setCustomerName]=useState('');
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomerName((rows||[]).find(c=>c.id===inputs.selectedCustomerId)?.name||(inputs.selectedCustomerId==='retail'?'Retail':'—'));}).catch(()=>{});return()=>{alive=false;};},[inputs]);
 const materials=getMaterials(),model=buildGableSummaryMaterialsModel({inputs,materials}),schedule=buildGableManufactureSchedule(model,materials);
 if(!schedule.valid)return <p role="status">{schedule.errors.join(' ')}</p>;
 return <main style={{maxWidth:1000,margin:'auto',padding:16}}><SummaryIdiotList model={model} materials={materials} checklist={schedule.checklist} inputs={{...inputs,customerName,quoteRef:inputs.customerReference,tileSystem:inputs.tileProductId,plasticsColor:inputs.fasciaColour,gutterColor:inputs.gutterColour}}/></main>;
}
