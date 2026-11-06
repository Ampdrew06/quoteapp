import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {getScheduleJobs,getScheduleRecords} from '../lib/schedule';
import {combineSchedule,scheduleAmounts,paymentState} from '../lib/scheduleModel';
import {customerOrderHistory} from '../lib/customerOrderHistory';
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const date=v=>v?v.split('-').reverse().join('/'):'Unscheduled';
const statuses={paid:'Paid','not-due':'Not delivered / not due','delivered-not-due':'Delivered — not due',overdue:'Overdue','needs-date':'Due date needed',unknown:'Payment details needed'};
export default function CustomerOrderHistory({customer,customers}){
 const [rows,setRows]=useState([]),[year,setYear]=useState('all'),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=async()=>{setLoading(true);setError('');try{const [jobs,records]=await Promise.all([getScheduleJobs(),getScheduleRecords()]);setRows(combineSchedule(jobs,records));}catch(e){setError(e.message);}finally{setLoading(false);}};
 useEffect(()=>{let alive=true;setLoading(true);Promise.all([getScheduleJobs(),getScheduleRecords()]).then(([jobs,records])=>{if(alive)setRows(combineSchedule(jobs,records));}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
 useEffect(()=>{setYear('all');},[customer.id]);
 const history=customerOrderHistory(rows,customers,customer.id,year),t=history.totals;
 return <section className="cd-order-history"><div className="cd-history-toolbar"><h3>Order history & account</h3><label>Delivery year<select aria-label="Customer order year" value={year} onChange={e=>setYear(e.target.value)}><option value="all">All years</option>{history.years.map(y=><option key={y}>{y}</option>)}</select></label><button type="button" disabled={loading} onClick={refresh}>Refresh orders</button><Link to="/schedule">Open Schedule</Link></div>
  {loading?<p role="status">Loading saved Schedule orders…</p>:error?<p role="alert" className="cd-message">Order history could not be loaded: {error}. No totals are shown as zero in place of unavailable data.</p>:<>
   <p>{year==='all'?'All saved Schedule years, including undated orders':year+' scheduled deliveries'} · {customer.name}</p>
   <div className="cd-history-totals">{[['Total roofs',t.count],['Total spend · ex VAT',money(t.net)],['VAT',money(t.vat)],['Total spend · incl VAT',money(t.gross)],['Outstanding · incl VAT',money(t.outstanding)],['Overdue · incl VAT',money(t.overdue)],['Average roof · ex VAT',money(t.average)]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
   {(t.missingNet||t.missingGross)>0&&<p className="cd-message">Partial totals: {t.missingNet} order(s) have no net price and {t.missingGross} have no gross price. Unknown amounts are omitted.</p>}
   {history.nameMatched>0&&<p>{history.nameMatched} order(s) matched by a unique customer name/code because no customer ID was recorded. No saved entry has been changed.</p>}
   <div className="cd-history-table"><table><thead><tr>{['Delivery','Job','Reference','Roof style','Spend ex VAT','Spend incl VAT','Outstanding incl VAT','Payment status'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{history.rows.map(r=>{const a=scheduleAmounts(r.data);return <tr key={r.id||r.quoteId}><td>{date(r.data.deliveryDate)}</td><td>{r.data.jobNumber}</td><td>{r.data.reference}</td><td>{r.data.style}</td><td>{a.net===null?'Unknown':money(a.net)}</td><td>{a.gross===null?'Unknown':money(a.gross)}</td><td>{a.outstanding===null?'Unknown':money(a.outstanding)}</td><td>{statuses[paymentState(r.data)]}</td></tr>;})}{!history.rows.length&&<tr><td colSpan="8">No matching active Schedule orders for this period.</td></tr>}</tbody></table></div>
   {history.unassigned.length>0&&<details><summary>{history.unassigned.length} Schedule order(s) are not uniquely assigned to a customer</summary><p>These orders are not counted against any customer. Select the correct directory customer in the Schedule editor to link them.</p><ul>{history.unassigned.map(r=><li key={r.id||r.quoteId}>{r.data.customerName||'No customer'} · Job {r.data.jobNumber||'—'} · {r.data.reference} · {date(r.data.deliveryDate)}</li>)}</ul></details>}
   <p className="cd-history-note">Read directly from Schedule; cancelled, archived and excluded test jobs are omitted. Payments and deposits are deducted once from each order’s gross balance. Figures are order-based, not a separate invoice ledger. Year filters use delivery dates, matching Sales. No historical totals are added a second time.</p>
  </>}
 </section>;
}
