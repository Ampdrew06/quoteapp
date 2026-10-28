/* global globalThis */
import React from 'react';
import {readActiveDesignRecord} from '../lib/activeDesignRecord';
const text=value=>value==null?'':String(value).trim();
const aliases={leanTo:'lean-to',hippedLeanTo:'hipped-lean-to'};
const labels={'lean-to':'Lean-To','hipped-lean-to':'Hipped Lean-To',gable:'Gable',edwardian:'Edwardian',victorian:'3 Facet Victorian','victorian-five':'5 Facet Victorian','victorian-hipped':'Victorian Hipped Lean-To',combination:'Edwardian / Victorian','double-edwardian':'Double Hipped Edwardian','edwardian-p':'Edwardian P-Shape','victorian-p':'Victorian P-Shape'};
export function getSummaryQuoteIdentity({inputs={},family,customer=null,storage=globalThis.localStorage}={}){
 const requested=aliases[family]||family||aliases[inputs.roofStyle]||inputs.roofStyle||'lean-to',bucket=requested==='hipped-lean-to'?'lean-to':requested;
 const record=readActiveDesignRecord(bucket,storage),rawStyle=bucket==='lean-to'?(inputs.roofStyle??record?.inputs_json?.roofStyle??requested):requested,style=aliases[rawStyle]||rawStyle;
 const explicit=text(inputs.selectedCustomerId),selected=explicit||text(record?.customer_id)||(record?.customer_name?'saved-customer':'retail'),matchesRecord=!explicit||selected===text(record?.customer_id??record?.inputs_json?.selectedCustomerId);
 const name=selected==='retail'?'Retail':text(inputs.customerName)||(customer&&String(customer.id)===selected?text(customer.name):'')||(matchesRecord?text(record?.customer_name):'')||'Customer unavailable';
 const number=text(record?.quote_number)||'New quote',reference=text(inputs.customerReference??inputs.quoteRef??record?.manual_reference)||'No reference',roofLabel=labels[style]||text(style).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/-/g,' ');
 return {quoteNumber:number,customerName:name,reference,roofLabel,line:[number,name,reference,roofLabel].join(' · ')};
}
export default function SummaryQuoteIdentity(props){
 const identity=getSummaryQuoteIdentity(props);
 return <p aria-label="Current quote" className="summary-quote-identity" style={{fontSize:14,fontWeight:600,lineHeight:1.5,margin:'0 0 14px',overflowWrap:'anywhere'}}>{identity.line}</p>;
}
