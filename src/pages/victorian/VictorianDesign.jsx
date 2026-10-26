import VictorianRafterPositionEditor from '../../components/VictorianRafterPositionEditor';
import {buildVictorianFiveGeometry} from '../../lib/geometry/victorianFiveGeometry';
import {VICTORIAN_FIVE_DESIGN_KEY,normalizeVictorianFiveDesignInputs,updateVictorianFiveDesignInputs} from '../../lib/geometry/victorianFiveDesignInputs';
import {buildVictorianFiveQuotation,buildVictorianFiveQuoteRecord} from '../../lib/Calculations/victorianFiveQuotation';
import {getNextQuoteNumber,saveQuote,updateQuote} from '../../lib/quotes';
import {readActiveDesignRecord,activateDesignRecord,restoreActiveDesignRecord,clearActiveDesignRecord,designRecordPatch} from '../../lib/activeDesignRecord';
import {readVictorianBookDraft} from '../../lib/victorianBookDraft';
import React,{useState,useEffect,useRef} from 'react';
import {Navigate,useLocation,useNavigate} from 'react-router-dom';
import {isAdminUser,isTradeUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {getCustomers,getCurrentCustomer} from '../../lib/customers';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../../lib/pricing';
import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';
import {VICTORIAN_DESIGN_KEY as KEY,normalizeVictorianDesignInputs,updateVictorianDesignInputs} from '../../lib/geometry/victorianDesignInputs';
import {buildVictorianQuotation,buildVictorianQuoteRecord} from '../../lib/Calculations/victorianQuotation';
import {LITESLATE_COLOURS} from '../../lib/tileColours';
import GableQuoteResults from '../gable/GableQuoteResults';
import VictorianCustomerPlan from './VictorianCustomerPlan';
import VictorianNavigation from './VictorianNavigation';
const bindCustomer=inputs=>isAdminUser()?inputs:{...inputs,selectedCustomerId:getCurrentCustomer()?.id||'retail',customerName:getCurrentCustomer()?.name||'Retail'};
const restore=(key=KEY,normalize=normalizeVictorianDesignInputs)=>{try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(!isAdminUser()&&saved.selectedCustomerId&&saved.selectedCustomerId!==(getCurrentCustomer()?.id||'retail'))clearActiveDesignRecord();return bindCustomer(normalize(saved,getCurrentCustomer()?.id||'retail'));}catch{return bindCustomer(normalize());}};
const fieldStyle={width:'100%',height:34,padding:'5px 8px',fontSize:13,border:'1px solid #d1d5db',borderRadius:8,boxSizing:'border-box'};
export default function VictorianDesign({five=false}={}){return isAdminUser()||isTradeUser()?<VictorianDesignContent five={five} key={five?'five':'three'}/>:<Navigate to="/quote" replace/>;}
export function VictorianDesignContent({five=false}={}){
 const family=five?'victorian-five':'victorian',KEY=five?VICTORIAN_FIVE_DESIGN_KEY:'victorianPlanPreviewInputs',normalize=five?normalizeVictorianFiveDesignInputs:normalizeVictorianDesignInputs,updateInputs=five?updateVictorianFiveDesignInputs:updateVictorianDesignInputs,geometryBuilder=five?buildVictorianFiveGeometry:buildVictorianGeometry,quotationBuilder=five?buildVictorianFiveQuotation:buildVictorianQuotation,recordBuilder=five?buildVictorianFiveQuoteRecord:buildVictorianQuoteRecord;
 const restoreInputs=()=>restore(KEY,normalize);
 const location=useLocation(),navigate=useNavigate(),admin=isAdminUser();
 const [inputs,setInputs]=useState(()=>{if(location.state?.fresh){clearActiveDesignRecord();return bindCustomer(normalize({},getCurrentCustomer()?.id||'retail'));}return restoreInputs();}),[materials,setMaterials]=useState(getMaterials),[customers,setCustomers]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[quoteInputsExpanded,setQuoteInputsExpanded]=useState(false);
 useEffect(()=>{if(location.state?.fresh)navigate(location.pathname,{replace:true,state:{...location.state,fresh:false}});},[location.pathname,location.state,navigate]);
 const latest=useRef(inputs),request=useRef(0),result=useRef(null);latest.current=inputs;
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(inputs));},[inputs]);
 useEffect(()=>{let alive=true;const load=async()=>{const rows=await getCustomers();if(alive)setCustomers(Array.isArray(rows)?rows:[]);};const refresh=()=>setMaterials(getMaterials());load();window.addEventListener('materials_updated',refresh);window.addEventListener('quoteapp_customers_updated',load);return()=>{alive=false;request.current++;window.removeEventListener('materials_updated',refresh);window.removeEventListener('quoteapp_customers_updated',load);};},[]);
 const update=(name,value)=>{if(name==='deliveryPostcode'){request.current++;setBusy(false);setMessage('');}setInputs(old=>updateInputs(old,name,value));};
 const g=geometryBuilder({inputs,materials}),customer=customers.find(c=>c.id===inputs.selectedCustomerId)||(!admin&&getCurrentCustomer()?.id===inputs.selectedCustomerId?getCurrentCustomer():null);
 const q=quotationBuilder({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()});
 const lookup=async()=>{
  const code=String(inputs.deliveryPostcode||'').trim();if(!code){setMessage('Enter a delivery postcode first.');return;}
  const id=++request.current;setBusy(true);setMessage('Checking delivery distance…');
  try{
   const response=await fetch('/api/delivery-distance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({destinationPostcode:code})});
   const data=await response.json(),miles=Number(data.distanceMiles);
   if(!response.ok||data.distanceMiles==null||data.distanceMiles===''||!Number.isFinite(miles)||miles<0)throw new Error(data.error||'Delivery distance could not be calculated.');
   if(id!==request.current||String(latest.current.deliveryPostcode||'').trim()!==code)return;
   setInputs(old=>String(old.deliveryPostcode||'').trim()===code?{...old,deliveryDistanceMiles:miles,deliveryDistancePostcode:code}:old);setMessage('Delivery distance updated.');
  }catch(error){if(id===request.current)setMessage(error.message||'Delivery lookup failed.');}
  finally{if(id===request.current)setBusy(false);}
 };
 const quote=()=>{if(!admin&&!String(inputs.deliveryPostcode||'').trim()){setQuoteInputsExpanded(true);setMessage('Enter a delivery postcode before quoting.');return;}setQuoteInputsExpanded(!(g.valid&&q.valid));setInputs(old=>({...old,quoteDisplayed:true}));if(q.valid&&!q.distanceReady&&String(inputs.deliveryPostcode||'').trim())lookup();if(g.valid&&q.valid)setTimeout(()=>document.getElementById('victorian-quote-edit-toggle')?.scrollIntoView({behavior:'smooth',block:'start'}),0);};
 const newQuote=()=>{setQuoteInputsExpanded(false);request.current++;setBusy(false);setMessage('');clearActiveDesignRecord();setInputs(bindCustomer(normalize({},getCurrentCustomer()?.id||'retail')));};
 const reset=()=>{setQuoteInputsExpanded(false);request.current++;setBusy(false);setMessage('');if(restoreActiveDesignRecord(family))setInputs(bindCustomer(normalize(readActiveDesignRecord(family).inputs_json)));else newQuote();};
 const save=async(asNew=false)=>{
  asNew=asNew===true;
  if(!q.ready||busy)return;
  if(!String(inputs.customerReference||'').trim()){setMessage('Enter a customer reference before saving.');return;}
  setBusy(true);setMessage('Saving quotation…');
  try{
   const current=readActiveDesignRecord(family);
   if(!admin&&current&&current.customer_id!==getCurrentCustomer()?.id)throw new Error('Reopen your quote from My Quotes before saving.');
   const updating=current&&!asNew;
   const quoteNumber=updating?current.quote_number:await getNextQuoteNumber();
   const record=recordBuilder({inputs,materials,quotation:q,customer,quoteNumber,bookDetails:readVictorianBookDraft(inputs)});
   const saved=updating?await updateQuote(current.id,designRecordPatch(record)):await saveQuote(record);
   if(!saved?.id)throw new Error('Quote was not saved. Please check the connection and try again.');
   activateDesignRecord({...updating&&current,...record,...saved,inputs_json:record.inputs_json,status:updating?(current.status||saved.status||'quote'):'quote'});
   setInputs(record.inputs_json);setMessage(`Quote ${quoteNumber} ${updating?'updated':'saved'}.`);
  }catch(error){setMessage(error.message||'Quote was not saved.');}
  finally{setBusy(false);}
 };

 const collapsed=inputs.quoteDisplayed&&g.valid&&q.valid&&(admin||!!String(inputs.deliveryPostcode||'').trim())&&!quoteInputsExpanded;
 const field=(label,name,type='number',placeholder)=><label>{label}<input aria-label={label} placeholder={placeholder} type={type} min={type==='number'?0:undefined} step={type==='number'?'0.1':undefined} value={name==='pitchDeg'&&g.valid&&inputs.maxFinishedHeightMM?Number(g.pitchDeg.toFixed(3)):inputs[name]??''} onChange={e=>update(name,e.target.value)} style={fieldStyle}/></label>;
 const select=(label,name,options)=><label>{label}<select aria-label={label} value={inputs[name]} onChange={e=>update(name,e.target.value)} style={fieldStyle}>{options.map(o=><option key={Array.isArray(o)?o[0]:o} value={Array.isArray(o)?o[0]:o}>{Array.isArray(o)?o[1]:o}</option>)}</select></label>;
 return <><VictorianNavigation five={five}/><main className="vd"><h1>Timberlite {five?'5 Facet Victorian':'Victorian'}</h1><p style={{color:'#555',marginTop:0,marginBottom:14}}>Enter your sizes and options below. We’ll show a plan preview and your price. Frame thickness is defaulted to 70mm, please confirm this when ordering.</p>
 <section className="vd-card"><fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}>{inputs.quoteDisplayed&&g.valid&&q.valid&&(admin||!!String(inputs.deliveryPostcode||'').trim())&&<button id="victorian-quote-edit-toggle" type="button" aria-expanded={quoteInputsExpanded} aria-controls="victorian-quote-input-fields" onClick={()=>setQuoteInputsExpanded(open=>!open)} style={{width:'100%',background:'#0f766e',border:'1px solid #0f766e',borderRadius:10,color:'#fff',padding:'10px 14px',fontWeight:600,cursor:'pointer',marginBottom:quoteInputsExpanded?14:0}}>Edit {quoteInputsExpanded?'▴':'▾'}</button>}
 <div id="victorian-quote-input-fields" hidden={collapsed}><div className="vd-grid">
 {field('Width (internal, mm)','widthMM','number','e.g. 3800')}{field('Projection (internal, mm)','projMM','number','e.g. 4200')}
 {select('Tile system','tileProductId',[['britmetShingle','Britmet'],['metrotileShingle','Metrotile'],['liteSlate','LiteSlate'],['tapcoSlate','TapcoSlate']])}
 {inputs.tileProductId==='tapcoSlate'?field('Tile colour','tileColour','text'):select('Tile colour','tileColour',inputs.tileProductId==='liteSlate'?LITESLATE_COLOURS:['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Smoked Oak','Rustic Red','Tartan Green'])}
 {select('Fascia / Soffit colour','fasciaColour',['White','Rosewood','Black','Anthracite','Light Oak','Cream','Foiled (unspecified)'])}
 {field('Soffit to Front (mm)','soffitMM')}
 {select('Gutter profile','gutterProfile',[['square','Square'],['ogee','Ogee'],['round','Round']])}{select('Gutter colour','gutterColour',['White','Black','Anthracite','Brown'])}
 {field('Pitch (degrees)','pitchDeg')}{field('Max Finished Height (mm)','maxFinishedHeightMM','number','Optional')}
 <section className="vd-specific"><h2>Victorian Configuration</h2><div className="vd-grid">{field('Frame thickness (mm)','frameThicknessMM')}
 <label>Side soffit requirement<select style={fieldStyle} value="automatic" disabled title="Independent side soffits require further Victorian geometry work"><option value="automatic">Automatic · matches front</option></select></label>
 {select('Soffit basis','soffitMode',[['standard','Standard stock board'],['specified','Specified site envelope']])}</div>
 {admin&&<p><label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" disabled style={{display:'inline',width:'auto'}}/> Adjust front pitch (admin) · pending</label></p>}
 <p style={{fontSize:12,color:'#555'}}>{five?'5-facet Victorian · standard150° corners. Six hips at the boss; additional front supports are jack rafters. The soffit value applies to all seven facets;':'3-facet Victorian · standard135° corners. The soffit value currently applies to all five facets;'} separate side soffits and front-pitch adjustment are pending.</p></section>
 {field('Delivery postcode','deliveryPostcode','text')}{field('Customer reference','customerReference','text','e.g. SMITH')}
 </div><div style={{marginTop:12}}>

 {admin&&<label>Customer<select aria-label="Customer" value={inputs.selectedCustomerId} style={fieldStyle} onChange={e=>{const selected=customers.find(c=>c.id===e.target.value);setInputs(old=>({...old,selectedCustomerId:e.target.value,customerName:selected?.name||'Retail'}));}}><option value="retail">Retail (No Discount)</option>{inputs.selectedCustomerId!=='retail'&&!customers.some(c=>c.id===inputs.selectedCustomerId)&&<option value={inputs.selectedCustomerId}>Selected customer (loading)</option>}{customers.filter(c=>c.id!=='retail').map(c=><option key={c.id} value={c.id}>{c.name} ({Number(c.discountPct??c.discount_pct??0)}%)</option>)}</select></label>}
 </div>
 </div><div className="vd-actions"><button type="button" disabled={busy} onClick={quote}>Quote</button><button type="button" disabled={busy||!q.ready} onClick={save}>{readActiveDesignRecord(family)?'Update Quote':'Save Quote'}</button><button type="button" disabled={busy} onClick={reset}>Reset</button></div>{readActiveDesignRecord(family)&&<button type="button" disabled={busy||!q.ready} onClick={()=>save(true)} style={{marginTop:10,padding:'10px 18px',border:'1px solid #0f766e',borderRadius:6,color:'#0f766e',background:'white'}} title="Create a new quote number and keep the original quotation">Save as New Quote</button>}{message&&<p role="status">{message}</p>}<div hidden={collapsed}><details style={{marginTop:12}}><summary>Delivery and quote tools</summary><button type="button" disabled={busy||!String(inputs.deliveryPostcode||'').trim()} onClick={lookup}>Calculate delivery distance</button><button type="button" disabled={busy} onClick={newQuote}>New Quote</button>
 {admin&&String(inputs.deliveryPostcode||'').trim()&&<label>One-way delivery miles (admin override)<input aria-label="One-way delivery miles (admin override)" type="number" min="0" step="0.1" value={q.distanceReady?inputs.deliveryDistanceMiles??'':''} onChange={e=>{request.current++;setBusy(false);setMessage('');setInputs(old=>({...old,deliveryDistanceMiles:e.target.value,deliveryDistancePostcode:old.deliveryPostcode}));}} style={{...fieldStyle,maxWidth:180,display:'block'}}/></label>}
 <p>Reset restores the opened quote; New Quote starts a separate design.{admin&&' Advanced geometry controls are on Technical.'}</p></details></div></fieldset></section>
 {admin&&<VictorianRafterPositionEditor five={five} inputs={inputs} materials={materials} admin={admin} onChange={patch=>setInputs(old=>({...old,...patch}))}/>}
 {inputs.quoteDisplayed&&<div ref={result}>{g.valid?<GableQuoteResults inputs={inputs} geometry={g} materials={materials} customers={customer?[customer]:[]} quotationBuilder={quotationBuilder} Plan={VictorianCustomerPlan} outletText="one outlet"/>:<p role="alert">{g.errors.join(' ')}</p>}</div>}
 <style>{`.vd{max-width:1100px;margin:0 auto;padding:16px;font:14px Inter,system-ui,Arial;color:#111827}.vd h1{font-size:24px;font-weight:700;margin:12px 0 8px}.vd h2{font-size:18px}.vd-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}.vd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.vd-grid label{min-width:0}.vd-grid input,.vd-grid select{display:block}.vd-specific{grid-column:1/-1;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0 0}.vd-specific h2{font-size:18px;font-weight:600;margin:0 0 8px}.vd-specific p{margin-bottom:0}.vd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.vd-actions button{padding:10px 14px;border-radius:10px;border:1px solid #0ea5e9;background:#0284c7;color:white;font-weight:600;width:100%;cursor:pointer}.vd-actions button:nth-child(2){background:#10b981;border-color:#10b981}.vd-actions button:nth-child(3){background:#64748b;border-color:#64748b}.vd-actions button:disabled{opacity:.5;cursor:default}.vd svg{display:block;width:100%;max-height:800px}.vd details button{margin:8px 8px 8px 0;padding:7px 10px}@media(max-width:600px){.vd-grid{grid-template-columns:1fr 1fr;gap:8px}}`}</style>
 </main></>;
}
