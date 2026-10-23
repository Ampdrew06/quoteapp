import {readActiveDesignRecord,activateDesignRecord,designRecordPatch} from '../../lib/activeDesignRecord';
import React,{useState,useRef} from 'react';
import {Link} from 'react-router-dom';
import {buildGableQuotation,buildGableQuoteRecord} from '../../lib/Calculations/gableQuotation';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../../lib/pricing';
import {getNextQuoteNumber,saveQuote,updateQuote} from '../../lib/quotes';
import {isAdminUser} from '../../lib/userRole';
const money=value=>'£'+Number(value||0).toFixed(2);
export default function GablePricingPanel({inputs,materials,customers=[],onChange,summary=false,compact=false,actionsOnly=false,showQuote=true,onQuote,onReset,family='gable',quotationBuilder=buildGableQuotation,recordBuilder=buildGableQuoteRecord}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const request=useRef(0),latest=useRef(inputs);latest.current=inputs;
 const customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null,admin=isAdminUser();
 const q=quotationBuilder({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()});
 const lookup=async()=>{
  const code=String(inputs.deliveryPostcode||'').trim();if(!code)return;
  const id=++request.current;setBusy(true);setMessage('Checking delivery distance…');
  try{
   const response=await fetch('/api/delivery-distance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({destinationPostcode:code})});
   const data=await response.json(),miles=Number(data.distanceMiles);
   if(!response.ok||!Number.isFinite(miles)||miles<0)throw new Error(data.error||'Delivery distance could not be calculated.');
   if(id!==request.current||String(latest.current.deliveryPostcode||'').trim()!==code)return;
   onChange({deliveryDistanceMiles:miles,deliveryDistancePostcode:code});setMessage('Delivery distance updated.');
  }catch(error){if(id===request.current)setMessage(error.message||'Delivery lookup failed.');}
  finally{if(id===request.current)setBusy(false);}
 };
 const save=async(asNew=false)=>{
  asNew=asNew===true;
  if(!q.ready||busy)return;
  if(!String(inputs.customerReference||'').trim()){setMessage('Enter a customer reference on Design/Options before saving.');return;}
  setBusy(true);setMessage('Saving quotation…');
  try{
   const current=readActiveDesignRecord(family);
   const updating=current&&!asNew;
   const quoteNumber=updating?current.quote_number:await getNextQuoteNumber();
   const record=recordBuilder({inputs,materials,quotation:q,customer,quoteNumber});
   const saved=updating?await updateQuote(current.id,designRecordPatch(record)):await saveQuote(record);
   if(!saved?.id)throw new Error('Quote was not saved. Please check the connection and try again.');
   activateDesignRecord({...updating&&current,...record,...saved,inputs_json:record.inputs_json,status:updating?(current.status||saved.status||'quote'):'quote'});
   setMessage(`Quote ${quoteNumber} ${updating?'updated':'saved'}.`);
  }catch(error){setMessage(error.message||'Quote was not saved.');}
  finally{setBusy(false);}
 };
 const actions=compact?<div className="gd-actions"><button type="button" disabled={busy} onClick={()=>{if(!admin&&!String(inputs.deliveryPostcode||'').trim()){setMessage('Enter a delivery postcode before quoting.');return;}onQuote();if(q.valid&&!q.distanceReady&&String(inputs.deliveryPostcode||'').trim())lookup();}}>Quote</button><button type="button" onClick={save} disabled={!q.ready||busy}>{readActiveDesignRecord(family)?'Update Quote':'Save Quote'}</button><button type="button" onClick={onReset} disabled={busy}>Reset</button></div>:null;
 return <>{actions}{compact&&readActiveDesignRecord(family)&&<button type="button" disabled={!q.ready||busy} onClick={()=>save(true)} style={{marginTop:10,padding:'10px 18px',border:'1px solid #0f766e',borderRadius:6,color:'#0f766e',background:'white'}} title="Create a new quote number and keep the original quotation">Save as New Quote</button>}{(!compact||showQuote)&&!actionsOnly&&<section style={{padding:18,margin:'20px 0',border:'1px solid #94a3b8',borderRadius:8}} aria-label={family+" quotation pricing"}>
 <h2>Quotation pricing</h2>
 {!q.valid?<p role="status">{q.errors.join(' ')}</p>:<>
 {admin&&<p>Materials: <strong>{money(q.model.materialsCostForPricing)}</strong> · Labour: {money(q.labour.labourCost)} ({q.labour.days.toFixed(1)} days) · Delivery: {money(q.delivery.deliveryCost)} ({q.delivery.oneWayMiles.toFixed(1)} miles one way).</p>}
 {admin&&<label>Labour days override <input type="number" min="0.1" step="0.1" value={inputs.labourDaysOverride??''} placeholder={q.labour.days.toFixed(1)} onChange={e=>onChange({labourDaysOverride:e.target.value})} /></label>}
 {String(inputs.deliveryPostcode||'').trim()?<p>Delivery postcode: {inputs.deliveryPostcode}. <button type="button" disabled={busy} onClick={lookup}>Calculate delivery distance</button>{!q.distanceReady&&' Calculate distance before saving or issuing this quotation.'}</p>:<p>{admin?'Delivery uses the customer’s saved default distance. Add a postcode on Design/Options to calculate its route.':'Enter a delivery postcode on Design/Options before quoting or saving.'}</p>}
 {admin&&String(inputs.deliveryPostcode||'').trim()&&<label>One-way delivery miles (manual override) <input type="number" min="0" step="0.1" value={q.distanceReady?inputs.deliveryDistanceMiles:''} onChange={e=>onChange({deliveryDistanceMiles:e.target.value,deliveryDistancePostcode:inputs.deliveryPostcode})} /></label>}
 {!q.customerReady&&<p role="status">Selected customer details are loading or unavailable; a confirmed discount is required.</p>}
 {q.model.supplyReviews.map(note=><p key={note} role="status">{note}</p>)}
 {q.model.missingPrices.length>0&&<p role="status">Configure these Materials prices before quoting: {q.model.missingPrices.map(r=>r.label).join('; ')}.</p>}
 {q.ready&&<><p style={{fontSize:22}}><strong>{money(q.pricing.net)} + VAT</strong> · {money(q.pricing.gross)} including VAT</p>{admin&&<p>Markup: {q.pricing.profitPct}% · Customer discount: {q.pricing.discountPct}% · VAT: {money(q.pricing.vat)}.</p>}</>}
 <p>{!summary&&admin&&<Link className="nav-tab" to={"/quote/"+family+"/summary"}>Review Summary</Link>} {!compact&&<button type="button" onClick={save} disabled={!q.ready||busy}>{readActiveDesignRecord(family)?'Update Quote':'Save Quote'}</button>} {!compact&&readActiveDesignRecord(family)&&<button type="button" disabled={!q.ready||busy} onClick={()=>save(true)}>Save as New Quote</button>}</p>
 </>}
 {message&&<p role="status">{message}</p>}
 </section>}{compact&&(!showQuote||actionsOnly)&&message&&<p role="status">{message}</p>}</>;
}
