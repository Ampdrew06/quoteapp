import React,{useEffect,useState,useRef} from 'react';
import {supplyOmissionNotes} from './documentSupplyNotes';
import logo from '../../timberlite-logo-small.jpg';
import './modernOrderForm.css';
import './orderFormPersistence.css';
import {activeOrderRecord,readOrderFormFields,saveOrderFormFields} from '../../lib/orderFormPersistence';
const money=value=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(Number(value));
const toInput=value=>{
 const s=String(value??''),m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
 return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s.slice(0,10);
};
const displayDate=value=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(value??'');return m?`${m[3]}/${m[2]}/${m[1]}`:value;};
const Heading=({number,children})=><h2><span>{number}</span> {children}</h2>;
function Field({label,value='',multiline=false,type='text',onChange}){
 return <label className={'mof-field'+(multiline?' mof-address':'')}>
  <span>{label}</span>
  {multiline?<textarea aria-label={label} value={value} rows={5} onChange={e=>onChange(e.target.value)}/>:
   <input aria-label={label} type={type} value={value} onChange={e=>onChange(e.target.value)}/>}
  <span className="mof-print-field">{type==='date'?displayDate(value)||'____ / ____ / ________':value||'\u00a0'}</span>
 </label>;
}
export default function ModernOrderForm({data:d}){
 const initial={...readOrderFormFields(d),date:toInput(readOrderFormFields(d).date)};
 const [fields,setFields]=useState(initial);
 const dirty=useRef(false);
 const [recordId]=useState(()=>activeOrderRecord(d.quote)?.id??null);
 const [saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if(!dirty.current){setFields(initial);setMessage('');}},[d.contactName,d.phone,d.email,d.billing,d.deliveryAddress,d.siteContact,d.sitePhone,d.deliveryDate]);
 const save=async()=>{
  setSaving(true);setMessage('');
  try {await saveOrderFormFields({recordId,quoteNumber:d.quote,fields});setMessage('Order details saved to this quote / job.');}
  catch(error){setMessage(error.message||'Order details could not be saved.');}
  finally{setSaving(false);}
 };
 const field=(key,label,options={})=><Field label={label} value={fields[key]} onChange={value=>{dirty.current=true;setFields(old=>({...old,[key]:value}));setMessage('Unsaved changes.');}} {...options}/>;
 const notes=[...(d.supplyNotes??[]),...supplyOmissionNotes(d.notIncluded),...(d.notes?[d.notes]:[])];
 const spec=[
  ['Roof style',d.roof],['Internal size',`${d.width} × ${d.projection}`],['Tile system',d.product],['Tile colour',d.colour],
  ['Fascia / soffit',d.fascia],['Guttering',d.gutter],['Downpipes',d.gutter==='Not Included'||d.gutter==='None'?'Not included':'Round'],
  ['Roof pitch',d.pitch!=null?`${Number(d.pitch).toFixed(1)}°`:'—'],['Frame thickness',d.frame],['Internal roof cover',d.orderCover??d.cover],
  ['Roof vents',d.vents??'—'],['Fixed glazing',d.glazing??'—'],
  ...(d.ventSpec?[['Vent specification',d.ventSpec]]:[]),...(d.glassSpec?[['Glass specification',d.glassSpec]]:[]),...(d.uValue?[['U-value',d.uValue]]:[])
 ];
 return <article className="rd-sheet mof">
  <div className="mof-save-controls"><button type="button" disabled={saving||!recordId} onClick={save}>{saving?'Saving…':'Save order details'}</button><span role="status">{message||'Save changes here before leaving this page.'}</span></div>
  <header className="mof-header"><img src={logo} alt="Timberlite"/>
   <div><h1>ORDER FORM</h1><div>{d.job?'Order '+d.job+' / ':''}Quote {d.quote}</div><div>Date: {d.processed}</div></div>
  </header>
  <p className="mof-company">Timberlite Ltd · Unit 2, The Sidings Business Park, Freightliner Road, Hull, HU3 4XA<br/>01482 609310 · andrew@timberlite.biz · www.timberlite.biz</p>
  <div className="mof-columns mof-top">
   <section><Heading number="01">CUSTOMER &amp; ORDER</Heading>
    <dl className="mof-identity"><dt>Customer</dt><dd>{d.name}</dd><dt>Customer reference</dt><dd>{d.reference}</dd></dl>
    {field('contact','Contact name')}{field('phone','Telephone')}{field('email','Email')}
    {field('billing','Billing address',{multiline:true})}
   </section>
   <section><Heading number="02">DELIVERY</Heading>
    {field('address','Delivery / site address (including postcode)',{multiline:true})}
    {field('siteContact','Site contact')}{field('sitePhone','Contact telephone')}
    {field('date','Required delivery date',{type:'date'})}
    <p className="mof-date-note">Requested date subject to confirmation.</p>
   </section>
  </div>
  <div className="mof-columns mof-middle">
   <section><Heading number="03">ROOF SPECIFICATION</Heading><table><tbody>{spec.map(([label,value])=><tr key={label}><th>{label}</th><td>{value??'—'}</td></tr>)}</tbody></table></section>
   <section className="mof-notes"><Heading number="04">EXTRAS &amp; SUPPLY NOTES</Heading><div className="mof-notes-body">{notes.map((note,index)=><p key={index}>{note}</p>)}</div></section>
  </div>
  <section className="mof-payment"><Heading number="05">PRICE &amp; PAYMENT</Heading>
   <div className="mof-totals"><div>Subtotal <b>{money(d.net)}</b></div><div>VAT ({Number((d.vatRate*100).toFixed(2))}%) <b>{money(d.vat)}</b></div><div>TOTAL <strong>{money(d.gross)}</strong></div></div>
   <p><b>Payment terms:</b> {d.paymentTerms||'________________________'}</p>
  </section>
  <section className="mof-accept"><Heading number="06">CUSTOMER ACCEPTANCE</Heading>
   <p>Please check the specification, dimensions and delivery details before signing. I confirm the details and the accompanying CAD drawing for Quote {d.quote}{d.reference!=='—'?' / '+d.reference:''} are correct and accept Timberlite’s standard terms and conditions.</p>
   <p>No work will be carried out until this form is signed and returned. Lead time varies with the complexity of the order.</p>
   <div className="mof-signatures"><div>Signature <span/></div><div>Print name <span/></div><div>Date <span/></div></div>
  </section>
  <footer>Please sign and return this form to confirm your order.</footer>
 </article>;
}
