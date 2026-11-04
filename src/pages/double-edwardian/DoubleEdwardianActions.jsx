import React from 'react';
import {useNavigate} from 'react-router-dom';
import GablePricingPanel from '../gable/GablePricingPanel';
import {buildDoubleEdwardianQuotation,buildDoubleEdwardianQuoteRecord} from '../../lib/Calculations/doubleEdwardianQuotation';
import {readActiveDesignRecord,clearActiveDesignRecord} from '../../lib/activeDesignRecord';
import {doubleEdwardianDefaults} from '../../lib/geometry/doubleEdwardianGeometry';
export default function DoubleEdwardianActions(props){
 const navigate=useNavigate();
 const reset=()=>{
  const record=readActiveDesignRecord('double-edwardian');
  const next=record?{...doubleEdwardianDefaults,...record.inputs_json}:{...doubleEdwardianDefaults};
  if(!record)clearActiveDesignRecord();
  localStorage.setItem('doubleEdwardianGeometryDraft',JSON.stringify(next));
  // Summary's patch callback must also remove fields absent from the reset record.
  props.onChange(Object.fromEntries([...new Set([...Object.keys(props.inputs),...Object.keys(next)])].map(key=>[key,next[key]])));
 };
 return <section className="double-edwardian-actions"><p><strong>Provisional roof package:</strong> saving retains this design and its price scope. Cutting integration and external valley waterproofing remain pending.</p><GablePricingPanel {...props} compact actionsOnly family="double-edwardian" quotationBuilder={buildDoubleEdwardianQuotation} recordBuilder={buildDoubleEdwardianQuoteRecord} showQuote onQuote={()=>{props.onChange({quoteDisplayed:true});localStorage.setItem('doubleEdwardianGeometryDraft',JSON.stringify({...props.inputs,quoteDisplayed:true}));navigate('/quote/double-edwardian');}} onReset={reset}/><style>{`.double-edwardian-actions .gd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.double-edwardian-actions .gd-actions button{padding:10px 14px;border-radius:10px;border:0;background:#0284c7;color:#fff;font-weight:600;cursor:pointer}.double-edwardian-actions .gd-actions button:nth-child(2){background:#10b981}.double-edwardian-actions .gd-actions button:nth-child(3){background:#64748b}.double-edwardian-actions .gd-actions button:disabled{opacity:.5;cursor:default}`}</style></section>;
}
