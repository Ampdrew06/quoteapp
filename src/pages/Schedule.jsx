import React,{useEffect,useMemo,useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import NavTabs from '../components/NavTabs';
import CustomerPicker from '../components/CustomerPicker';
import {isAdminUser} from '../lib/userRole';
import {getCustomersForAdministration} from '../lib/customers';
import {getScheduleJobs,getScheduleRecords,saveScheduleRecord} from '../lib/schedule';
import {blankScheduleEntry,combineSchedule,jobScheduleEntry,inScheduleMonth,localDate,moneyNumber,paymentState,scheduleAmounts,scheduleStatuses,scheduleTotals,validateScheduleEntry} from '../lib/scheduleModel';
import './Schedule.css';
const money=n=>n==null?'—':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const num=n=>n==null?'—':new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(n);
const date=v=>v?v.split('-').reverse().join('/'):'—';
const paymentLabels={paid:'Paid',overdue:'Overdue','not-due':'Not due / not delivered','delivered-not-due':'Delivered, not due','needs-date':'Due date needed',unknown:'Price needed',cancelled:'Cancelled / archived'};
export function exportScheduleCSV(rows){
 const headers=['Customer','Reference','Job','Area m²','Style','Tiles','Delivered','Status','Delivery date','Net cost','Net sell','Gross sell','Contribution','Margin %','Invoiced','Due date','Book done','Vent','A-frame','Net £/m²','Labour','REGS','Deposit paid incl VAT','Other payments incl VAT','Outstanding incl VAT','Payment status','Notes'];
 // Prevent spreadsheet applications treating customer-entered text as formulas.
 const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 const lines=rows.map(({data:e})=>{const a=scheduleAmounts(e);return [e.customerName,e.reference,e.jobNumber,e.areaM2,e.style,e.tiles,e.delivered?'Yes':'No',e.status,e.deliveryDate,e.netCost,e.netSell,e.grossSell,a.contribution,a.margin,e.invoiced?'Yes':'No',e.dueDate,e.bookDone?'Yes':'No',e.vent,e.aFrame,Number(e.areaM2)>0&&a.net!==null?a.net/Number(e.areaM2):'',e.labour,e.regs,e.deposit,e.otherPaid,a.outstanding,paymentLabels[paymentState(e)],e.notes];});
 return '\uFEFF'+[headers,...lines].map(line=>line.map(cell).join(',')).join('\r\n');
}
export default function Schedule(){return isAdminUser()?<ScheduleContent/>:<Navigate to="/quote" replace/>;}
export function ScheduleContent(){
 const [rows,setRows]=useState([]),[customers,setCustomers]=useState([]),[month,setMonth]=useState(()=>localDate().slice(0,7)),[year,setYear]=useState(()=>localDate().slice(0,4)),[search,setSearch]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[editor,setEditor]=useState(null),[dirty,setDirty]=useState(false),[showArchived,setShowArchived]=useState(false),[today,setToday]=useState(localDate());
 const load=async()=>{
  setBusy(true);setError('');
  try{const [jobs,records,cs]=await Promise.all([getScheduleJobs(),getScheduleRecords(),getCustomersForAdministration()]);setRows(combineSchedule(jobs,records));setCustomers(cs);setLoaded(true);setToday(localDate());}
  catch(e){setLoaded(false);setError(e.message+' Nothing has been overwritten. If this is your first use, complete the supplied Schedule database setup.');}
  finally{setBusy(false);}
 };
 useEffect(()=>{load();},[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const timer=setInterval(()=>setToday(localDate()),60000);return ()=>clearInterval(timer);},[]);
 useEffect(()=>{const leave=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return ()=>window.removeEventListener('beforeunload',leave);},[dirty]);
 useEffect(()=>{const leave=e=>{const a=e.target.closest?.('a[href]');if(dirty&&a&&!a.hasAttribute('download')&&a.target!=='_blank'&&!window.confirm('Discard the unsaved Schedule edits?')){e.preventDefault();e.stopImmediatePropagation();}};document.addEventListener('click',leave,true);return()=>document.removeEventListener('click',leave,true);},[dirty]);
 useEffect(()=>{if(editor){const el=document.getElementById('schedule-order-editor');el?.scrollIntoView({block:'start',behavior:'smooth'});el?.focus({preventScroll:true});}},[editor?.id,editor?.quoteId,!!editor]); // eslint-disable-line react-hooks/exhaustive-deps
 const discard=()=>!dirty||window.confirm('Discard the unsaved Schedule edits?');
 const switchMonth=m=>{if(!discard())return;setEditor(null);setDirty(false);setMonth(m);if(m!=='unscheduled')setYear(m.slice(0,4));setNotice('');};
 const stepMonth=delta=>{const base=month==='unscheduled'?localDate().slice(0,7):month;const [y,m]=base.split('-').map(Number),d=new Date(y,m-1+delta,1);switchMonth(localDate(d).slice(0,7));};
 const monthRows=useMemo(()=>rows.filter(r=>inScheduleMonth(r,month)),[rows,month]);
 const visible=monthRows.filter(r=>(showArchived||(!r.data.archived&&r.data.status!=='Cancelled'))&&[r.data.customerName,r.data.reference,r.data.jobNumber,r.data.style,r.data.tiles].join(' ').toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>String(a.data.deliveryDate).localeCompare(String(b.data.deliveryDate))||String(a.data.jobNumber).localeCompare(String(b.data.jobNumber),undefined,{numeric:true}));
 const jobNumbers=rows.map(r=>String(r.data.jobNumber||'').trim().toLowerCase()).filter(Boolean),duplicateNumbers=[...new Set(jobNumbers.filter((n,i)=>jobNumbers.indexOf(n)!==i))];
 const annual=scheduleTotals(rows.filter(r=>r.data.deliveryDate?.slice(0,4)===year)),monthly=scheduleTotals(monthRows),all=scheduleTotals(rows);
 const open=row=>{if(!discard())return;setEditor({...row,data:{...row.data}});setDirty(false);setNotice('');setError('');};
 const patch=p=>{setEditor(old=>({...old,data:{...old.data,...p}}));setDirty(true);};
 const add=()=>open({id:null,quoteId:null,version:null,job:null,data:{...blankScheduleEntry,deliveryDate:''}});
 const save=async e=>{
  e.preventDefault();const validation=validateScheduleEntry(editor.data);if(validation){setError(validation);return;}
  const jobKey=String(editor.data.jobNumber||'').trim().toLowerCase();
  if(jobKey&&rows.some(r=>(editor.id?r.id!==editor.id:r!==editor&&!(editor.quoteId&&r.quoteId===editor.quoteId))&&String(r.data.jobNumber||'').trim().toLowerCase()===jobKey)){setError('That job number already exists on the Schedule. Edit the existing entry to avoid counting an order twice.');return;}
  setBusy(true);setError('');try{const saved=await saveScheduleRecord(editor,{...editor.data,customerName:editor.data.customerName.trim(),jobNumber:String(editor.data.jobNumber||'').trim()});
   const updated={...editor,pendingLink:false,id:saved.id,quoteId:saved.quote_id,version:saved.version,data:{...blankScheduleEntry,...saved.entry_json}};
   setRows(old=>[...old.filter(r=>!(editor.id?r.id===editor.id:editor.quoteId&&r.quoteId===editor.quoteId)),updated]);setEditor(null);setDirty(false);setMonth(updated.data.deliveryDate?updated.data.deliveryDate.slice(0,7):'unscheduled');if(updated.data.deliveryDate)setYear(updated.data.deliveryDate.slice(0,4));setNotice('Schedule entry saved.');
  }catch(err){setError(err.message+' Your unsaved edits are still shown below.');}finally{setBusy(false);}
 };
 const download=()=>{const blob=new Blob([exportScheduleCSV(visible)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Timberlite-Schedule-${month}.csv`;a.click();URL.revokeObjectURL(url);};
 const financialFields=[['areaM2','Roof area (m²)'],['netCost','Net cost (£, incl labour + delivery)'],['netSell','Net sell (£, after discount)'],['grossSell','Total sale (£, incl VAT)'],['deposit','Deposit received (£, incl VAT)'],['otherPaid','Other payments received (£, incl VAT)'],['labour','Labour (£, already included in net cost)']];
 const financial=editor?scheduleAmounts(editor.data):null;
 return <><NavTabs/><main className="schedule-page">
  <div className="schedule-toolbar"><h1>Schedule</h1><Link to="/jobs">Jobs</Link><Link to="/customers">Customers</Link><button disabled={busy} onClick={()=>{if(discard()){setEditor(null);setDirty(false);load();}}}>Refresh</button><button className="primary" disabled={!loaded||busy} onClick={add}>+ Add manual order</button></div>
  <div className="schedule-toolbar" aria-label="Schedule month"><button disabled={busy} onClick={()=>stepMonth(-1)}>← Previous</button><label>Delivery month <input aria-label="Delivery month" type="month" disabled={busy} value={month==='unscheduled'?'':month} onChange={e=>{if(e.target.value)switchMonth(e.target.value);}}/></label><button disabled={busy} onClick={()=>stepMonth(1)}>Next →</button><button disabled={busy} onClick={()=>switchMonth(localDate().slice(0,7))}>This month</button><button disabled={busy} onClick={()=>switchMonth('unscheduled')}>Unscheduled ({rows.filter(r=>!r.data.deliveryDate&&!r.data.archived&&r.data.status!=='Cancelled').length})</button></div>
  {error&&<p className="schedule-message" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{!loaded&&!error&&<p role="status">Loading Schedule…</p>}
  {loaded&&<><p className="schedule-help">Select real orders using Include in Schedule on the Jobs page. Converted test jobs stay off this Schedule. Annual figures use the delivery year. Financial totals include active orders only. Monthly totals use the whole month, regardless of the search filter. Figures are estimates from the recorded order values, not an accounting ledger.</p>
   <div className="schedule-summary">{[[`${year} sales · ex VAT`,money(annual.net)],[`${year} average roof · ex VAT`,money(annual.average)],[`${year} contribution · ex VAT`,money(annual.contribution)],['All outstanding · incl VAT',money(all.outstanding)],[month==='unscheduled'?'Unscheduled margin':'Month contribution margin',monthly.margin==null?'—':num(monthly.margin)+'%'],['Month deposits received · incl VAT',money(monthly.deposits)],['Month balance · incl VAT',money(monthly.outstanding)],['All overdue · incl VAT',money(all.overdue)]].map(([label,value])=><div className="schedule-card" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
   {duplicateNumbers.length>0&&<p className="schedule-message">Job-number conflicts: {duplicateNumbers.join(', ')}. These records have different details and have not been merged. Review them before relying on totals.</p>}
   {(all.missingPrice>0||all.missingCost>0)&&<p className="schedule-message">Incomplete figures: {all.missingPrice} order(s) need sale totals; {all.missingCost} need cost/contribution figures. Missing amounts are excluded from their totals. Check imported job values before relying on the headline figures.</p>}
   <div className="schedule-legend" aria-label="Payment colour key">{Object.entries(paymentLabels).filter(([key])=>key!=='cancelled').map(([key,label])=><span key={key} className={'schedule-'+key}>{label}</span>)}</div>
   <p className="schedule-help">Undelivered orders stay yellow. Delivered orders turn red after their due date, purple until then, and green once paid. Deposits and other payments reduce each order’s balance once; overpayments stay as a separate credit. Cancelled and archived orders are excluded from totals.</p>
   <div className="schedule-toolbar"><input className="schedule-search" aria-label="Search this month" placeholder="Search customer, reference, job or style…" value={search} onChange={e=>setSearch(e.target.value)}/><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Show cancelled / archived</label><span>{visible.length} shown · {monthly.count} active orders</span><button onClick={download}>Export visible rows (CSV)</button></div>
  </>}
  {editor&&<form id="schedule-order-editor" tabIndex={-1} className="schedule-editor" onSubmit={save}><h2>{editor.quoteId?'Edit app job':'Manual order'} {editor.data.jobNumber}{dirty?' · unsaved':''}</h2>
   <p className="schedule-help">{editor.quoteId?'Schedule values are kept separately from the saved roof design. Changes here do not alter the quote or manufacture book.':'Use this for orders designed outside the app. This does not create a roof design or reserve an app job number.'}</p>
   {editor.job&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm('Refresh customer, reference, style, price, cost, labour and delivery date from the saved job? Schedule payments and status will be retained.')){const j=jobScheduleEntry(editor.job);patch(Object.fromEntries(['customerId','customerName','reference','jobNumber','style','tiles','deliveryDate','netCost','netSell','grossSell','labour'].map(k=>[k,j[k]])));}}}>Refresh details from saved job</button>}
   <fieldset disabled={busy} style={{border:0,padding:0,margin:0}}><div className="schedule-fields">
    <div><span>Customer directory</span><CustomerPicker customers={customers} value={editor.data.customerId||'retail'} onChange={e=>{const c=customers.find(x=>x.id===e.target.value);patch({customerId:c?.id||'',customerName:c?.name||''});}}/></div>
    <label>Customer name<input required value={editor.data.customerName} onChange={e=>patch({customerName:e.target.value,customerId:''})}/></label>
    {[['reference','Customer reference'],['jobNumber','Job number'],['style','Roof style'],['tiles','Tiles / colour']].map(([key,label])=><label key={key}>{label}<input value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <label>Production status<select value={editor.data.status} onChange={e=>patch({status:e.target.value,delivered:e.target.value==='Delivered'?true:false})}>{scheduleStatuses.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Delivered<select value={editor.data.delivered?'yes':'no'} onChange={e=>patch({delivered:e.target.value==='yes',status:e.target.value==='yes'?'Delivered':editor.data.status==='Delivered'?'Scheduled':editor.data.status})}><option value="no">No</option><option value="yes">Yes</option></select></label>
    {[['deliveryDate','Delivery date'],['dueDate','Payment due date']].map(([key,label])=><label key={key}>{label}<input type="date" value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    {financialFields.map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="0.01" value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <div><p className="schedule-help">Enter the actual VAT-inclusive order total. For a standard VAT rate you can fill it from net sell:</p><button type="button" disabled={moneyNumber(editor.data.netSell)===null} onClick={()=>patch({grossSell:(Number(editor.data.netSell)*1.2).toFixed(2)})}>Set total using 20% VAT</button><button type="button" disabled={financial.gross===null} onClick={()=>patch({otherPaid:Math.max(0,financial.gross-financial.deposit).toFixed(2)})}>Record balance paid in full</button></div>
    {[['invoiced','Invoiced'],['bookDone','Manufacture book done'],['archived','Archive entry']].map(([key,label])=><label key={key}>{label}<select value={editor.data[key]?'yes':'no'} onChange={e=>patch({[key]:e.target.value==='yes'})}><option value="no">No</option><option value="yes">Yes</option></select></label>)}
    {[['vent','Vent · requirements / ordered'],['aFrame','A-frame · requirements / ordered'],['regs','REGS']].map(([key,label])=><label key={key}>{label}<input value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <label className="wide">Order notes<textarea value={editor.data.notes} onChange={e=>patch({notes:e.target.value})}/></label>
   </div></fieldset><p>Contribution: <b>{money(financial.contribution)}</b> · Margin: <b>{financial.margin==null?'—':num(financial.margin)+'%'}</b> · Outstanding incl VAT: <b>{money(financial.outstanding)}</b>{financial.credit>0&&<> · Credit / overpayment: <b>{money(financial.credit)}</b></>}</p>
   <div className="schedule-toolbar"><button className="primary" disabled={busy||!loaded} type="submit">{busy?'Saving…':'Save Schedule entry'}</button><button type="button" disabled={busy} onClick={()=>{if(discard()){setEditor(null);setDirty(false);}}}>Cancel</button></div>
  </form>}
  {loaded&&<div className="schedule-table-wrap"><table className="schedule-table"><thead><tr>{['Customer / edit','Ref','No','Size m²','Style','Tiles','Delivered','Status','Delivery date','Net cost','Net sell','Contribution','Margin','Invoiced','Due','Book done','Vent','A-frame','£/m²','Labour','REGS','Deposit','Other paid','Balance incl VAT'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
   {visible.map(r=>{const e=r.data,a=scheduleAmounts(e),state=paymentState(e,today);return <tr key={r.id||r.quoteId}><td><button onClick={()=>open(r)} disabled={busy}>{e.customerName||'Customer needed'}</button><small> {r.pendingLink?'App job · matches manual number':r.quoteId?'App job':'Manual'}{e.archived?' · archived':''}</small></td><td title={e.notes}>{e.reference}</td><td>{e.jobNumber}</td><td className="number">{num(moneyNumber(e.areaM2))}</td><td>{e.style}</td><td>{e.tiles}</td><td>{e.delivered?'Yes':'No'}</td><td>{e.status}</td><td>{date(e.deliveryDate)}</td><td className="number">{money(a.cost)}</td><td className={'number schedule-'+state} title={paymentLabels[state]}>{money(a.net)}</td><td className="number">{money(a.contribution)}</td><td className="number">{a.margin==null?'—':num(a.margin)+'%'}</td><td className={e.invoiced?'yes':'no'}>{e.invoiced?'Yes':'No'}</td><td>{date(e.dueDate)}</td><td className={e.bookDone?'yes':'no'}>{e.bookDone?'Yes':'No'}</td><td>{e.vent}</td><td>{e.aFrame}</td><td className="number">{money(Number(e.areaM2)>0&&a.net!==null?a.net/Number(e.areaM2):null)}</td><td className="number">{money(moneyNumber(e.labour))}</td><td>{e.regs}</td><td className="number">{money(a.deposit)}</td><td className="number">{money(a.paid)}</td><td><span className={'schedule-payment schedule-'+state}>{money(a.outstanding)} · {paymentLabels[state]}</span>{a.credit>0&&<small> Credit {money(a.credit)}</small>}</td></tr>;})}
   {!visible.length&&<tr><td colSpan="24">No orders in this view. Add a manual order, or tick Include in Schedule on the Jobs page. Included jobs without delivery dates appear under Unscheduled.</td></tr>}
  </tbody></table></div>}
 </main></>;
}
