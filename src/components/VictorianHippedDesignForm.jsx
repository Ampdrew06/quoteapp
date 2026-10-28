import SoffitRequirementControl from './SoffitRequirementControl';
import {saveVictorianHippedDesign} from '../lib/victorianHippedQuotePersistence';
import {readActiveDesignRecord,activateDesignRecord,restoreActiveDesignRecord,clearActiveDesignRecord} from '../lib/activeDesignRecord';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../lib/pricing';
import {lookupDeliveryDistance} from '../lib/deliveryDistance';
import React,{useState,useEffect,useRef} from 'react';
import GableQuoteResults from '../pages/gable/GableQuoteResults';
import {buildVictorianHippedQuotation} from '../lib/Calculations/victorianHippedQuotation';
import {getCustomers} from '../lib/customers';
import {sortCustomerList} from '../lib/customerListOrder';
import {LITESLATE_COLOURS} from '../lib/tileColours';
import {victorianHippedDesignDefaults as victorianHippedDefaults} from '../lib/geometry/victorianHippedGeometry';
const steelColours=['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Smoked Oak','Rustic Red','Tartan Green'];
export default function VictorianHippedDesignForm({inputs,g,materials,Plan,tools,onChange}){
 const [customers,setCustomers]=useState([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [expanded,setExpanded]=useState(false);
 const collapsed=!!inputs.quoteDisplayed&&g.valid&&!expanded;
 const saving=useRef(false);
 const request=useRef(0),latest=useRef(inputs);latest.current=inputs;
 const currentRecord=readActiveDesignRecord('victorian-hipped');
 const customer=inputs.selectedCustomerId==='retail'?null:customers.find(c=>String(c.id)===String(inputs.selectedCustomerId))||null;
 const quotation=buildVictorianHippedQuotation({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()});
 const save=async(asNew=false)=>{
  if(busy||saving.current||!quotation.ready)return;
  if(!String(inputs.customerReference||'').trim()){setExpanded(true);setMessage('Enter a customer reference before saving.');return;}
  saving.current=true;const id=++request.current;setBusy(true);setMessage('Saving quotation…');
  try{
   const result=await saveVictorianHippedDesign({inputs,materials,quotation,customer,asNew});
   if(id!==request.current)return;
   activateDesignRecord(result.record);onChange(result.record.inputs_json);setExpanded(false);
   setMessage(`Quote ${result.quoteNumber} ${result.updating?'updated':'saved'}.`);
  }catch(error){if(id===request.current)setMessage(error.message||'Quote was not saved.');}
  finally{saving.current=false;if(id===request.current)setBusy(false);}
 };
 const newQuote=()=>{request.current++;setBusy(false);setMessage('');setExpanded(false);clearActiveDesignRecord();onChange({...victorianHippedDefaults});};
 const reset=()=>{request.current++;setBusy(false);setMessage('');setExpanded(false);if(restoreActiveDesignRecord('victorian-hipped'))onChange({...victorianHippedDefaults,...readActiveDesignRecord('victorian-hipped').inputs_json});else newQuote();};
 const postcode=value=>String(value||'').toUpperCase().replace(/\s/g,'');
 const sideMode=inputs.sideSoffitMode||'automatic',preferredSide=inputs.sideSoffitControlSide||'left',controlSide=inputs[preferredSide+'EndType']==='wall'?(preferredSide==='left'?'right':'left'):preferredSide;
 useEffect(()=>()=>{request.current++;},[]);
 const showQuote=snapshot=>{setExpanded(false);const next={...snapshot,quoteDisplayed:true};localStorage.setItem('victorianHippedPreviewInputs',JSON.stringify(next));onChange(next);};
 const quote=async()=>{
  if(busy||!g.valid)return;
  const code=String(inputs.deliveryPostcode||'').trim(),raw=inputs.deliveryDistanceMiles;
  if(!code||postcode(inputs.deliveryDistancePostcode)===postcode(code)&&raw!=null&&raw!==''&&Number.isFinite(Number(raw))&&Number(raw)>=0){showQuote(inputs);return;}
  const id=++request.current;setBusy(true);setMessage('Calculating delivery distance…');
  try{const result=await lookupDeliveryDistance(code);if(id!==request.current||postcode(latest.current.deliveryPostcode)!==postcode(code))return;showQuote({...latest.current,...result});}
  catch(error){if(id===request.current)setMessage(error.message||'Delivery lookup failed. Please try again.');}
  finally{if(id===request.current)setBusy(false);}
 };
 useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCustomers(sortCustomerList(Array.isArray(rows)?rows:[]));}).catch(()=>{});return()=>{alive=false;};},[]);
 const update=(key,value)=>{if(key==='deliveryPostcode'){request.current++;setBusy(false);setMessage('');}onChange(old=>({...old,[key]:value,...(key==='pitchDeg'?{maxFinishedHeightMM:''}:{}),...(key==='bossInsetMM'?{requestedSidePitchDeg:null}:{}),...(key==='deliveryPostcode'?{deliveryDistanceMiles:'',deliveryDistancePostcode:''}:{})}));};
 const number=(label,key,aria=label)=> <label>{label}<input aria-label={aria} type="number" min="0" step="0.1" placeholder={key==='specifiedSideSoffitMM'?'e.g. 80':key==='maxFinishedHeightMM'?'Optional':key==='widthMM'?'e.g. 4000':key==='projMM'?'e.g. 3000':undefined} disabled={key==='soffitMM'&&sideMode!=='automatic'} value={key==='pitchDeg'&&inputs.maxFinishedHeightMM&&g.valid?Number(g.pitchDeg.toFixed(4)):key==='soffitMM'&&sideMode!=='automatic'&&g.valid?Number(g.soffitMM.toFixed(1)):inputs[key]??''} onChange={e=>update(key,e.target.value)}/></label>;
 const select=(label,key,options,fallback)=> <label>{label}<select aria-label={label} value={inputs[key]??fallback??options[0]} onChange={e=>update(key,e.target.value)}>{options.map(v=><option key={v}>{v}</option>)}</select></label>;
 const slate=inputs.tileProductId==='liteSlate';
 return <><section className="vh-design-card">
 {inputs.quoteDisplayed&&g.valid&&<button className="vh-edit-bar" type="button" disabled={busy} aria-expanded={!collapsed} aria-controls="vh-design-fields" onClick={()=>setExpanded(open=>!open)}>Edit {collapsed?'▾':'▴'}</button>}
 <fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}><div id="vh-design-fields" hidden={collapsed}><div className="vh-design-grid">
 {number('Width (internal, mm)','widthMM','Internal width (mm)')}{number('Projection (internal, mm)','projMM','Internal projection (mm)')}
 <label>Tile system<select aria-label="Tile system" value={inputs.tileProductId??'britmetShingle'} onChange={e=>onChange(old=>({...old,tileProductId:e.target.value,tileColour:e.target.value==='liteSlate'?'Slate':'Titanium'}))}><option value="britmetShingle">Britmet</option><option value="liteSlate">LiteSlate</option></select></label>
 {select('Tile colour','tileColour',slate?LITESLATE_COLOURS:steelColours,slate?'Slate':'Titanium')}{select('Fascia / Soffit colour','fasciaColour',['White','Black','Anthracite','Rosewood','Golden Oak'])}
 {number('Soffit to Front (mm)','soffitMM','Soffit (mm)')}{select('Gutter profile','gutterProfile',['Square','Round','Ogee'])}{select('Gutter colour','gutterColour',['Black','White','Brown','Anthracite'])}{number('Pitch (degrees)','pitchDeg','Front pitch (°)')}{number('Max Finished Height (mm)','maxFinishedHeightMM')}
 </div><fieldset className="vh-hip-config"><legend>Side Configuration</legend><div className="vh-design-grid vh-hip-grid">
 {['left','right'].map(side=><label key={side}>{side==='left'?'Left Side':'Right Side'}<select aria-label={side==='left'?'Left Side':'Right Side'} value={inputs[side+'EndType']??'victorian'} onChange={e=>{const value=e.target.value;onChange(old=>{const next={...old,[side+'EndType']:value,victorianHippedFacetPositionsMM:undefined};if(next.leftEndType==='wall'&&next.rightEndType==='wall'&&next.sideSoffitMode==='specified')next.sideSoffitMode='automatic';else if(value==='wall'&&(old.sideSoffitControlSide||'left')===side)next.sideSoffitControlSide=side==='left'?'right':'left';return next;});}}><option value="victorian">Victorian — faceted side (135° template)</option><option value="edwardian">Edwardian — 90° corner</option><option value="wall">Against a wall</option></select></label>)}
 <label>Side pitch (°)<input aria-label="Side pitch (°)" placeholder="Optional" disabled={inputs.leftEndType==='wall'&&inputs.rightEndType==='wall'} type="number" min="0" max="60" step="0.1" value={inputs.requestedSidePitchDeg??''} onChange={e=>onChange(old=>({...old,bossInsetMM:g.valid?g.bossInsetMM:old.bossInsetMM,requestedSidePitchDeg:e.target.value}))}/></label>
 </div><div className="vh-design-grid vh-hip-grid vh-soffit-controls">
 <SoffitRequirementControl mode={sideMode} size={inputs.specifiedSideSoffitMM??''} allowSideRestriction={!(inputs.leftEndType==='wall'&&inputs.rightEndType==='wall')} onModeChange={value=>onChange(old=>({...old,sideSoffitMode:value,sideSoffitControlSide:controlSide,...(value==='automatic'?{soffitMode:'standard'}:{})}))} onSizeChange={v=>update('specifiedSideSoffitMM',v)}/>
 {sideMode!=='automatic'&&<p>Both open sides use this requirement. Front/faceted soffits adjust to keep the fascia aligned.</p>}
 </div>{sideMode!=='automatic'&&g.valid&&<p>Front soffit automatically adjusted to {g.soffitMM.toFixed(1)}mm to keep the fascia heights aligned.</p>}</fieldset>
 <div className="vh-design-grid vh-contact-grid"><label>Delivery postcode<input aria-label="Delivery postcode" value={inputs.deliveryPostcode??''} onChange={e=>update('deliveryPostcode',e.target.value)}/></label><label>Customer Reference<input aria-label="Customer Reference" placeholder="e.g. SMITH" value={inputs.customerReference??''} onChange={e=>update('customerReference',e.target.value)}/></label></div>
 <label className="vh-customer">Customer <select aria-label="Customer" value={inputs.selectedCustomerId??'retail'} onChange={e=>{const c=customers.find(row=>String(row.id)===e.target.value);onChange(old=>({...old,selectedCustomerId:e.target.value,customerName:c?.name||'Retail'}));}}><option value="retail">Retail (No Discount)</option>{customers.filter(c=>c.id!=='retail').map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <p className="vh-pricing-note">Quote calculates delivery from the postcode and displays your price below. Save Quote keeps the complete design, including measured facets and manual rafter positions.</p></div>
 <div className="vh-design-buttons"><button type="button" disabled={busy||!g.valid} onClick={quote}>{busy?'Calculating…':'Quote'}</button><button type="button" disabled={busy||!quotation.ready} onClick={()=>save(false)}>{currentRecord?'Update Quote':'Save Quote'}</button><button type="button" disabled={busy} onClick={reset}>Reset</button></div>
 {currentRecord&&<p><button type="button" disabled={busy||!quotation.ready} onClick={()=>save(true)}>Save as New Quote</button>{' '}<button type="button" disabled={busy} onClick={newQuote}>New Quote</button></p>}
 </fieldset>
 {sideMode==='none'&&g.valid&&<p>No soffit requested. The compulsory fascia lip remains; front projection {g.soffitMM.toFixed(1)}mm is resolved to align the fascia.</p>}
 {message&&<p role="status">{message}</p>}
 </section>
 <fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0}}>{tools}</fieldset>
 {inputs.quoteDisplayed&&g.valid&&<GableQuoteResults inputs={inputs} geometry={g} materials={materials} customers={customers} quotationBuilder={buildVictorianHippedQuotation} Plan={Plan} outletText="one outlet"/>}
 <style>{`.vh-design-card{border:1px solid #d1d5db;border-radius:12px;padding:12px;margin:12px 0}.vh-edit-bar{display:block;width:100%;padding:10px 14px;margin-bottom:12px;border:1px solid #0f766e;border-radius:10px;background:#0f766e;color:white;font-weight:600;cursor:pointer}.vh-design-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.vh-design-card label{font-size:13px;min-width:0}.vh-design-card input,.vh-design-card select{display:block;box-sizing:border-box;width:100%;height:34px;padding:5px 8px;font:13px Arial,sans-serif;border:1px solid #cbd5e1;border-radius:8px;background:white;margin-top:3px}.vh-hip-config{min-width:0;background:#f8fafc;border:1px solid #d1d5db;border-radius:8px;margin:18px 0 12px;padding:12px}.vh-hip-config legend{font-weight:700;padding:0 4px}.vh-hip-config p{font-size:12px;margin:0 0 10px}.vh-hip-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:12px}.vh-soffit-controls{border-top:1px solid #d1d5db;padding-top:12px}.vh-contact-grid{grid-template-columns:repeat(5,minmax(0,1fr));margin-bottom:12px}.vh-customer{display:flex;align-items:center;gap:10px}.vh-customer select{width:auto;max-width:100%;margin:0}.vh-pricing-note{font-size:12px;color:#64748b}.vh-design-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.vh-design-buttons button{padding:9px;border:0;border-radius:8px;color:white;background:#008dc2;font-weight:700}.vh-design-buttons button:nth-child(2){background:#10b981}.vh-design-buttons button:last-child{background:#64748b}.vh-design-buttons button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:700px){.vh-design-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:380px){.vh-design-grid{grid-template-columns:1fr}}@media print{.vh-design-card{display:none}}`}</style></>;
}
