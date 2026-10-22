import React,{useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {getCurrentCustomer} from '../../lib/customers';
import {isTradeUser} from '../../lib/userRole';
import {getMyQuotes,openMyQuote,ownsTradeQuote} from '../../lib/myQuotes';
import {designFamily} from '../../lib/activeDesignRecord';
const styleName=row=>row.inputs_json?.roofStyle==='hippedLeanTo'?'Hipped Lean-To':({ 'lean-to':'Lean-To',gable:'Gable',edwardian:'Edwardian',victorian:'3 Facet Victorian','victorian-five':'5 Facet Victorian'})[designFamily(row)]||'Roof';
export default function MyQuotesSection({compact=false}){
 const navigate=useNavigate(),[rows,setRows]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0),[search,setSearch]=useState('');
 const accountId=getCurrentCustomer()?.id;
 useEffect(()=>{let alive=true;setRows([]);setBusy(true);setError('');
  getMyQuotes().then(data=>{if(alive)setRows(data);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setBusy(false);});
  const reload=()=>setRefresh(n=>n+1);
  window.addEventListener('quoteapp_quotes_updated',reload);window.addEventListener('quoteapp_customer_updated',reload);window.addEventListener('quoteapp_user_role_updated',reload);
  return()=>{alive=false;window.removeEventListener('quoteapp_quotes_updated',reload);window.removeEventListener('quoteapp_customer_updated',reload);window.removeEventListener('quoteapp_user_role_updated',reload);};
 },[accountId,refresh]);
 if(!isTradeUser())return null;
 const matches=rows.filter(r=>ownsTradeQuote(r)).filter(r=>(String(r.quote_number)+' '+String(r.manual_reference||'')+' '+styleName(r)).toLowerCase().includes(search.toLowerCase().trim())),visible=compact?matches.slice(0,3):matches;
 return <section className="th-myquotes" aria-labelledby="myquotes-title"><div className="th-section-heading"><div><span className="th-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2 id="myquotes-title">My Quotes</h2></div>{compact?<Link to="/my-quotes">View all quotes →</Link>:<button className="th-secondary" type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh</button>}</div>
 {!compact&&<label className="th-search">Find a quote<input type="search" placeholder="Quote number, reference or roof style" value={search} onChange={e=>setSearch(e.target.value)}/></label>}
 {busy?<p role="status">Loading your quotes…</p>:error?<p role="alert">{error} <button type="button" onClick={()=>setRefresh(n=>n+1)}>Try again</button></p>:visible.length?<div className="th-quote-list">{visible.map(row=><article className="th-quote-row" key={row.id}><div><strong>{row.manual_reference||'Quote '+row.quote_number}</strong><p>{styleName(row)} · Quote {row.quote_number}{row.created_at?' · '+new Date(row.created_at).toLocaleDateString('en-GB'):''}</p></div>{row.status==='converted_to_job'?<span className="th-order-status">Converted to job</span>:<button className="th-secondary" type="button" onClick={()=>{if(!openMyQuote(row,navigate))setError('This quotation could not be opened for this account.');}}>Open quote →</button>}</article>)}</div>:<p>{search?'No matching quotes.':'No saved quotes yet. Choose a roof shape and save your first quote.'}</p>}
 </section>;
}
