import EdwardianFrontRafterEditor from './EdwardianFrontRafterEditor';
import React,{useState,useEffect} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {getMaterials} from '../../lib/materials';
import {getCustomers,getCurrentCustomer} from '../../lib/customers';
import {isAdminUser} from '../../lib/userRole';
import {clearActiveDesignRecord,readActiveDesignRecord,restoreActiveDesignRecord} from '../../lib/activeDesignRecord';
import {EDWARDIAN_DESIGN_KEY as KEY,edwardianDesignDefaults,normalizeEdwardianDesignInputs,updateEdwardianDesignInputs} from '../../lib/geometry/edwardianDesignInputs';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
import {buildEdwardianQuotation} from '../../lib/Calculations/edwardianQuotation';
import EdwardianNavigation from './EdwardianNavigation';
import EdwardianDesignForm from './EdwardianDesignForm';
import EdwardianCustomerPlan from './EdwardianCustomerPlan';
import GableQuoteResults from '../gable/GableQuoteResults';
const bindCustomer=inputs=>isAdminUser()?inputs:{...inputs,selectedCustomerId:getCurrentCustomer()?.id||'retail',customerName:getCurrentCustomer()?.name||'Retail',trussMinimumSpacingMM:undefined};
const restore=()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('edwardianGeometryAuditInputs')||'{}');if(!isAdminUser()&&saved.selectedCustomerId&&saved.selectedCustomerId!==(getCurrentCustomer()?.id||'retail'))clearActiveDesignRecord();return bindCustomer(normalizeEdwardianDesignInputs(saved,getCurrentCustomer()?.id||'retail'));}catch{return bindCustomer(normalizeEdwardianDesignInputs({},getCurrentCustomer()?.id||'retail'));}};
export default function EdwardianDesign(){
 const location=useLocation(),navigate=useNavigate(),admin=isAdminUser();
 const [inputs,setInputs]=useState(()=>{if(location.state?.fresh){clearActiveDesignRecord();return bindCustomer(normalizeEdwardianDesignInputs({},getCurrentCustomer()?.id||'retail'));}return restore();});
 const [customers,setCustomers]=useState([]),[materials,setMaterials]=useState(getMaterials),[showQuote,setShowQuote]=useState(()=>!location.state?.fresh&&Boolean(restore().quoteDisplayed));
 useEffect(()=>{if(location.state?.fresh)navigate(location.pathname,{replace:true,state:{...location.state,fresh:false}});},[location.pathname,location.state,navigate]);
 useEffect(()=>{let alive=true;const load=async()=>{const rows=await getCustomers();if(alive)setCustomers(Array.isArray(rows)?rows:[]);};const refresh=()=>setMaterials(getMaterials());load();window.addEventListener('quoteapp_customers_updated',load);window.addEventListener('materials_updated',refresh);return()=>{alive=false;window.removeEventListener('quoteapp_customers_updated',load);window.removeEventListener('materials_updated',refresh);};},[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify({...inputs,quoteDisplayed:showQuote}));},[inputs,showQuote]);
 const account=getCurrentCustomer(),visibleCustomers=admin?customers:customers.filter(c=>c.id===account?.id).length?customers.filter(c=>c.id===account?.id):account?[account]:[];
 const g=buildEdwardianGeometry({inputs,materials});
 const update=(key,value)=>setInputs(old=>updateEdwardianDesignInputs(old,key,value,admin));
 const reset=()=>{if(restoreActiveDesignRecord('edwardian')){setInputs(bindCustomer(normalizeEdwardianDesignInputs(readActiveDesignRecord('edwardian').inputs_json)));setShowQuote(true);}else{clearActiveDesignRecord();setInputs({...edwardianDesignDefaults,selectedCustomerId:getCurrentCustomer()?.id||'retail'});setShowQuote(false);}};
 return <><EdwardianNavigation/><main style={{maxWidth:1100,margin:'0 auto',padding:16,fontFamily:'Inter,system-ui,Arial'}}>
 <h1 style={{fontSize:24,fontWeight:700,margin:'12px 0 8px'}}>Timberlite Edwardian</h1><p style={{color:'#555',marginTop:0,marginBottom:14}}>Enter your sizes and options below. We’ll show a plan preview and your price. Frame thickness is defaulted to 70mm, please confirm this when ordering.</p>
 <EdwardianDesignForm inputs={inputs} update={update} materials={materials} customers={visibleCustomers} admin={admin} onChange={patch=>setInputs(old=>({...old,...patch}))} onQuote={()=>setShowQuote(true)} onReset={reset} showQuote={showQuote} validDesign={g.valid}/>
 <EdwardianFrontRafterEditor inputs={inputs} materials={materials} admin={admin} onChange={patch=>setInputs(old=>({...old,...patch}))}/>
 {g.valid&&(g.frontRafterWarnings||[]).map(w=><p key={w} role="status" style={{color:'#92400e'}}>{w}</p>)}
 {g.valid&&g.frontPitchAutoAdjusted&&<p role="status">Sides {g.pitchDeg.toFixed(1)}° · Front automatically adjusted to {g.frontPitchDeg.toFixed(1)}° to place the boss truss 200mm from the wall.</p>}
 {showQuote&&(g.valid?<GableQuoteResults inputs={inputs} geometry={g} materials={materials} customers={visibleCustomers} quotationBuilder={buildEdwardianQuotation} Plan={EdwardianCustomerPlan} frontPitch={inputs.ridgeMode==='frontPitch'||g.frontPitchAutoAdjusted} outletText="one outlet"/>:<p role="status">{g.errors.join(' ')}</p>)}
 </main></>;
}
