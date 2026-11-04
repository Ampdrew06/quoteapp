import React from 'react';
import {Navigate,useNavigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {VictorianSummaryContent} from '../victorian/VictorianSummary';
import CombinationNavigation from './CombinationNavigation';
import GablePricingPanel from '../gable/GablePricingPanel';
import {buildCombinationSummaryMaterialsModel,buildCombinationQuotation,buildCombinationQuoteRecord} from '../../lib/Calculations/combinationQuotation';
import {clearActiveDesignRecord,readActiveDesignRecord} from '../../lib/activeDesignRecord';
import {combinationDesignDefaults,normalizeCombinationInputs} from '../../lib/geometry/combinationDesignInputs';
function Actions(props){
 const navigate=useNavigate();
 const reset=()=>{
  const record=readActiveDesignRecord('combination');
  if(record)props.onChange(normalizeCombinationInputs(record.inputs_json));
  else{clearActiveDesignRecord();localStorage.setItem('combinationGeometryDraft',JSON.stringify(combinationDesignDefaults));navigate('/quote/combination',{state:{fresh:true}});}
 };
 return <div className="combination-summary-actions"><GablePricingPanel {...props} family="combination" compact actionsOnly showQuote quotationBuilder={buildCombinationQuotation} recordBuilder={buildCombinationQuoteRecord} onSaved={()=>props.onChange({quoteDisplayed:true})} onQuote={()=>{localStorage.setItem('combinationGeometryDraft',JSON.stringify({...props.inputs,quoteDisplayed:true}));props.onChange({quoteDisplayed:true});navigate('/quote/combination');}} onReset={reset}/><style>{`.combination-summary-actions .gd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.combination-summary-actions .gd-actions button{padding:10px 14px;border-radius:10px;border:1px solid #0ea5e9;background:#0284c7;color:white;font-weight:600;cursor:pointer}.combination-summary-actions .gd-actions button:disabled{opacity:.5;cursor:default}.combination-summary-actions .gd-actions button:nth-child(2){background:#10b981;border-color:#10b981}.combination-summary-actions .gd-actions button:nth-child(3){background:#64748b;border-color:#64748b}`}</style></div>;
}

const configuration={storageKey:'combinationGeometryDraft',family:'combination',modelBuilder:buildCombinationSummaryMaterialsModel,quotationBuilder:buildCombinationQuotation,Navigation:CombinationNavigation,Footer:Actions};
export default function CombinationSummary(){return isAdminUser()?<VictorianSummaryContent configuration={configuration}/>:<Navigate to="/quote" replace/>;}
