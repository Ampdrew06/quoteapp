import React,{useEffect,useMemo,useState} from 'react';
import {Link,Navigate} from 'react-router-dom';
import NavTabs from '../components/NavTabs';
import CustomerPicker from '../components/CustomerPicker';
import {isAdminUser} from '../lib/userRole';
import {getCustomersForAdministration} from '../lib/customers';
import {getScheduleJobs,getScheduleRecords,saveScheduleRecord,setJobScheduleIncluded} from '../lib/schedule';
import {blankScheduleEntry,combineSchedule,jobScheduleEntry,inScheduleMonth,localDate,moneyNumber,paymentState,scheduleListPaymentState,scheduleAmounts,scheduleStatuses,scheduleTotals,validateScheduleEntry} from '../lib/scheduleModel';
import ScheduleTilePicker from '../components/ScheduleTilePicker';
import {scheduleGrossFromNet,scheduleVatRate} from '../lib/scheduleEntryOptions';
import ScheduleCalendar from '../components/ScheduleCalendar';
import ScheduleSales from '../components/ScheduleSales';
import './Schedule.css';
const money=n=>n==null?'—':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const num=n=>n==null?'—':new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(n);
const date=v=>v?v.split('-').reverse().join('/'):'—';
const paymentLabels={paid:'Paid',overdue:'Overdue','not-due':'Not Delivered/Not Due','delivered-not-due':'Delivered — Not Due','needs-date':'Due date needed',unknown:'Details needed',cancelled:'Cancelled / archived'};
export function exportScheduleCSV(rows){
 const headers=['Customer','Reference','Job','Area m²','Style','Tiles','Delivered','Status','Delivery date','Net cost','Net sell','Gross sell','Contribution','Margin %','Invoiced','Due date','Book done','Glazing requirements','A-frame','Net £/m²','Labour','REGS','Deposit paid incl VAT','Other payments incl VAT','Outstanding incl VAT','Payment status','Notes'];
 // Prevent spreadsheet applications treating customer-entered text as formulas.
 const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
 const lines=rows.map(({data:e})=>{const a=scheduleAmounts(e);return [e.customerName,e.reference,e.jobNumber,e.areaM2,e.style,e.tiles,e.delivered?'Yes':'No',e.status,e.deliveryDate,e.netCost,e.netSell,e.grossSell,a.contribution,a.margin,e.invoiced?'Yes':'No',e.dueDate,e.bookDone?'Yes':'No',e.vent,e.aFrame,Number(e.areaM2)>0&&a.net!==null?a.net/Number(e.areaM2):'',e.labour,e.regs,e.deposit,e.otherPaid,a.outstanding,paymentLabels[paymentState(e)],e.notes];});
 return '\uFEFF'+[headers,...lines].map(line=>line.map(cell).join(',')).join('\r\n');
}
export default function Schedule(){return isAdminUser()?<ScheduleContent/>:<Navigate to="/quote" replace/>;}
export function ScheduleContent(){
 const [rows,setRows]=useState([]),[customers,setCustomers]=useState([]),[month,setMonth]=useState(()=>localDate().slice(0,7)),[year,setYear]=useState(()=>localDate().slice(0,4)),[search,setSearch]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[editor,setEditor]=useState(null),[dirty,setDirty]=useState(false),[showArchived,setShowArchived]=useState(false),[today,setToday]=useState(localDate());
 const [tab,setTab]=useState('list'),[calendarDirty,setCalendarDirty]=useState(false),[calendarBusy,setCalendarBusy]=useState(false),[calendarRevision,setCalendarRevision]=useState(0);
 const load=async()=>{
  setBusy(true);setError('');
  try{const [jobs,records,cs]=await Promise.all([getScheduleJobs(),getScheduleRecords(),getCustomersForAdministration()]);setRows(combineSchedule(jobs,records));setCalendarRevision(n=>n+1);setCustomers(cs);setLoaded(true);setToday(localDate());}
  catch(e){setLoaded(false);setError(e.message+' Nothing has been overwritten. If this is your first use, complete the supplied Schedule database setup.');}
  finally{setBusy(false);}
 };
 useEffect(()=>{load();},[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const timer=setInterval(()=>setToday(localDate()),60000);return ()=>clearInterval(timer);},[]);
 useEffect(()=>{const leave=e=>{if(dirty||calendarDirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return ()=>window.removeEventListener('beforeunload',leave);},[dirty,calendarDirty]);
 useEffect(()=>{const leave=e=>{const a=e.target.closest?.('a[href]');if((dirty||calendarDirty)&&a&&!a.hasAttribute('download')&&a.target!=='_blank'&&!window.confirm('Discard the unsaved Schedule edits?')){e.preventDefault();e.stopImmediatePropagation();}};document.addEventListener('click',leave,true);return()=>document.removeEventListener('click',leave,true);},[dirty,calendarDirty]);
 useEffect(()=>{if(editor){const el=document.getElementById('schedule-order-editor');el?.scrollIntoView({block:'start',behavior:'smooth'});el?.focus({preventScroll:true});}},[editor?.id,editor?.quoteId,!!editor]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(error&&editor){const el=document.getElementById('schedule-save-error');el?.scrollIntoView({block:'nearest',behavior:'smooth'});el?.focus({preventScroll:true});}},[error,!!editor]); // eslint-disable-line react-hooks/exhaustive-deps
 const discard=()=>!(dirty||calendarDirty)||window.confirm('Discard the unsaved Schedule edits?');
 const switchMonth=m=>{if(!discard())return;setEditor(null);setDirty(false);setCalendarDirty(false);setMonth(m);if(m==='unscheduled')setTab('list');if(m!=='unscheduled')setYear(m.slice(0,4));setNotice('');};
 const switchTab=value=>{if(value===tab||calendarBusy)return;if(!discard())return;setEditor(null);setDirty(false);setCalendarDirty(false);setTab(value);if(value==='calendar'&&month==='unscheduled')setMonth(localDate().slice(0,7));};
 const stepMonth=delta=>{const base=month==='unscheduled'?localDate().slice(0,7):month;const [y,m]=base.split('-').map(Number),d=new Date(y,m-1+delta,1);switchMonth(localDate(d).slice(0,7));};
 const showListUtilities=false; // Retained for possible reinstatement; not shown in the simplified List.
 const monthRows=useMemo(()=>rows.filter(r=>inScheduleMonth(r,month)),[rows,month]);
 const visible=monthRows.filter(r=>((showListUtilities&&showArchived)||(!r.data.archived&&r.data.status!=='Cancelled'))&&(!showListUtilities||[r.data.customerName,r.data.reference,r.data.jobNumber,r.data.style,r.data.tiles].join(' ').toLowerCase().includes(search.trim().toLowerCase()))).sort((a,b)=>String(a.data.deliveryDate).localeCompare(String(b.data.deliveryDate))||String(a.data.jobNumber).localeCompare(String(b.data.jobNumber),undefined,{numeric:true}));
 const jobNumbers=rows.map(r=>String(r.data.jobNumber||'').trim().toLowerCase()).filter(Boolean),duplicateNumbers=[...new Set(jobNumbers.filter((n,i)=>jobNumbers.indexOf(n)!==i))];
 const monthly=scheduleTotals(monthRows);
 const open=row=>{if(!discard())return;setEditor({...row,data:{...row.data}});setDirty(false);setNotice('');setError('');};
 const patch=p=>{setEditor(old=>{const next={...p};if(Object.prototype.hasOwnProperty.call(p,'netSell')&&!Object.prototype.hasOwnProperty.call(p,'grossSell')){const rate=scheduleVatRate(old.data,old.job);next.grossSell=scheduleGrossFromNet(p.netSell,rate);next.vatRate=rate;}return {...old,data:{...old.data,...next}};});setDirty(true);};
 const add=()=>{if(!discard())return;setCalendarDirty(false);setDirty(false);setTab('list');setEditor({id:null,quoteId:null,version:null,job:null,data:{...blankScheduleEntry,deliveryDate:''}});setNotice('');setError('');};
 const save=async e=>{
  e.preventDefault();const validation=validateScheduleEntry(editor.data);if(validation){setError(validation);return;}
  const jobKey=String(editor.data.jobNumber||'').trim().toLowerCase();
  if(jobKey&&rows.some(r=>(editor.id?r.id!==editor.id:r!==editor&&!(editor.quoteId&&r.quoteId===editor.quoteId))&&String(r.data.jobNumber||'').trim().toLowerCase()===jobKey)){setError('That job number already exists on the Schedule. Edit the existing entry to avoid counting an order twice.');return;}
  setBusy(true);setError('');try{const saved=await saveScheduleRecord(editor,{...editor.data,customerName:editor.data.customerName.trim(),jobNumber:String(editor.data.jobNumber||'').trim()});
   const updated={...editor,pendingLink:false,id:saved.id,quoteId:saved.quote_id,version:saved.version,data:{...blankScheduleEntry,...saved.entry_json}};
   setRows(old=>[...old.filter(r=>!(editor.id?r.id===editor.id:editor.quoteId&&r.quoteId===editor.quoteId)),updated]);setEditor(null);setDirty(false);setMonth(updated.data.deliveryDate?updated.data.deliveryDate.slice(0,7):'unscheduled');if(updated.data.deliveryDate)setYear(updated.data.deliveryDate.slice(0,4));setNotice('Schedule entry saved.');
  }catch(err){setError(err.message+' Your entered details are retained in this form.');}finally{setBusy(false);}
 };
 const changeSchedulePresence=async(row,restore=false)=>{
  if(busy||calendarBusy||!discard())return;
  const original=rows.find(r=>row.id?r.id===row.id:r.quoteId===row.quoteId);
  if(!original){setError('This order is no longer in the current Schedule. Refresh and review it.');return;}
  const label=[original.data.customerName,original.data.reference,'Job '+(original.data.jobNumber||'—')].filter(Boolean).join(' · ');
  const action=restore?'Restore this manual order to Schedule?':original.quoteId?'Remove this job from Schedule? The job and its saved Schedule details will be kept. You can include it again from Jobs.':'Remove this manual order from Schedule? It will be archived with all details retained. Use Show cancelled / archived to restore it.';
  if(!window.confirm(label+'\n\n'+action))return;
  setBusy(true);setError('');setNotice('');
  try{
   if(original.quoteId){
    // A matching manual row must be linked first, or it would return as a
    // standalone manual order after the app job is excluded.
    if(original.pendingLink){const linked=await saveScheduleRecord(original,original.data);setRows(old=>old.map(r=>r.id===original.id?{...r,version:linked.version,pendingLink:false,data:{...blankScheduleEntry,...linked.entry_json}}:r));}
    await setJobScheduleIncluded(original.job||{id:original.quoteId,schedule_included:true},false);
    setRows(old=>old.filter(r=>r.quoteId!==original.quoteId));
   }else{
    const saved=await saveScheduleRecord(original,{...original.data,archived:!restore});
    setRows(old=>old.map(r=>r.id===original.id?{...r,version:saved.version,data:{...blankScheduleEntry,...saved.entry_json}}:r));
   }
   setEditor(null);setDirty(false);setNotice(restore?'Manual order restored to Schedule.':'Removed from Schedule. Saved details have been retained.');
  }catch(err){setError('Schedule change not saved: '+err.message);}
  finally{setBusy(false);}
 };
 const download=()=>{const blob=new Blob([exportScheduleCSV(visible)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Timberlite-Schedule-${month}.csv`;a.click();URL.revokeObjectURL(url);};
 const financialFields=[['areaM2','Roof area (m²)'],['netCost','Net cost (£, incl labour + delivery)'],['netSell','Net sell (£, after discount)'],['grossSell','Total sale (£, incl VAT)'],['deposit','Deposit received (£, incl VAT)'],['otherPaid','Other payments received (£, incl VAT)'],['labour','Labour (£, already included in net cost)'],['materialsCost','Materials (£, already included in net cost)'],['deliveryCost','Delivery (£, already included in net cost)']];
 const financial=editor?scheduleAmounts(editor.data):null;
 return <><NavTabs/><main className={"schedule-page"+(tab==='calendar'?' schedule-calendar-active':'')}>
  <div className="schedule-toolbar"><h1>Schedule</h1><Link to="/jobs">Jobs</Link><Link to="/customers">Customers</Link><button disabled={busy||calendarBusy} onClick={()=>{if(discard()){setEditor(null);setDirty(false);setCalendarDirty(false);load();}}}>Refresh</button><button className="primary" disabled={!loaded||busy||calendarBusy} onClick={add}>+ Add manual order</button></div>
  <div className="schedule-view-tabs" role="tablist" aria-label="Schedule views">{[['list','List'],['calendar','Calendar'],['sales','Sales'],['order','To Order']].map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} disabled={busy||calendarBusy} className={tab===value?'active':''} onClick={()=>switchTab(value)}>{label}</button>)}</div>
  {(tab==='list'||tab==='calendar')&&<div className="schedule-toolbar schedule-month-controls" aria-label="Schedule month"><button disabled={busy||calendarBusy} onClick={()=>stepMonth(-1)}>← Previous</button><label>Delivery month <input aria-label="Delivery month" type="month" disabled={busy||calendarBusy} value={month==='unscheduled'?'':month} onChange={e=>{if(e.target.value)switchMonth(e.target.value);}}/></label><button disabled={busy||calendarBusy} onClick={()=>stepMonth(1)}>Next →</button><button disabled={busy||calendarBusy} onClick={()=>switchMonth(localDate().slice(0,7))}>This month</button><button disabled={busy||calendarBusy} onClick={()=>switchMonth('unscheduled')}>Unscheduled ({rows.filter(r=>!r.data.deliveryDate&&!r.data.archived&&r.data.status!=='Cancelled').length})</button></div>}
  {error&&!editor&&<p className="schedule-message" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{!loaded&&!error&&<p role="status">Loading Schedule…</p>}
  {loaded&&tab==='list'&&<>
   {duplicateNumbers.length>0&&<p className="schedule-message">Job-number conflicts: {duplicateNumbers.join(', ')}. Review these before relying on totals.</p>}
   {showListUtilities&&<div className="schedule-toolbar"><input className="schedule-search" aria-label="Search this month" placeholder="Search customer, reference, job or style…" value={search} onChange={e=>setSearch(e.target.value)}/><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Show cancelled / archived</label><span>{visible.length} shown · {monthly.count} active orders</span><button onClick={download}>Export visible rows (CSV)</button></div>}

  </>}
  {loaded&&tab==='calendar'&&<ScheduleCalendar key={calendarRevision} month={month} rows={rows} today={today} onDirty={setCalendarDirty} onBusy={setCalendarBusy} onEditOrder={row=>{setCalendarDirty(false);setEditor({...row,data:{...row.data}});setDirty(false);setTab('list');setError('');setNotice('');}}/>}
  {loaded&&tab==='sales'&&<ScheduleSales rows={rows} year={year} onYear={setYear}/>}
  {loaded&&tab==='order'&&<section className="schedule-placeholder"><h2>To Order</h2><p>This tab is ready for the purchasing reminders. We will add the order requirements and supplier tracking next.</p></section>}
  {editor&&<form id="schedule-order-editor" tabIndex={-1} className="schedule-editor" noValidate aria-describedby={error?'schedule-save-error':undefined} onSubmit={save}><h2>{editor.quoteId?'Edit app job':'Manual order'} {editor.data.jobNumber}{dirty?' · unsaved':''}</h2>
   <p className="schedule-help">{editor.quoteId?'Schedule values are kept separately from the saved roof design. Changes here do not alter the quote or manufacture book.':'Use this for orders designed outside the app. This does not create a roof design or reserve an app job number.'}</p>
   {editor.job&&<button type="button" disabled={busy||calendarBusy} onClick={()=>{if(window.confirm('Refresh customer, reference, style, price, cost, labour and delivery date from the saved job? Schedule payments and status will be retained.')){const j=jobScheduleEntry(editor.job);patch(Object.fromEntries(['customerId','customerName','reference','jobNumber','style','tiles','deliveryDate','netCost','netSell','grossSell','labour','materialsCost','deliveryCost'].map(k=>[k,j[k]])));}}}>Refresh details from saved job</button>}
   <fieldset disabled={busy||calendarBusy} style={{border:0,padding:0,margin:0}}><div className="schedule-fields">
    <div><span>Customer directory</span><CustomerPicker customers={customers} value={editor.data.customerId||'retail'} onChange={e=>{const c=customers.find(x=>x.id===e.target.value);patch({customerId:c?.id||'',customerName:c?.name||''});}}/></div>
    <label>Customer name<input required value={editor.data.customerName} onChange={e=>patch({customerName:e.target.value,customerId:''})}/></label>
    {[['reference','Customer reference'],['jobNumber','Job number'],['style','Roof style']].map(([key,label])=><label key={key}>{label}<input value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <ScheduleTilePicker value={editor.data.tiles} onChange={value=>patch({tiles:value})}/>
    <label>Production status<select value={editor.data.status} onChange={e=>patch({status:e.target.value,delivered:e.target.value==='Delivered'?true:false})}>{scheduleStatuses.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Delivered<select value={editor.data.delivered?'yes':'no'} onChange={e=>patch({delivered:e.target.value==='yes',status:e.target.value==='yes'?'Delivered':editor.data.status==='Delivered'?'Scheduled':editor.data.status})}><option value="no">No</option><option value="yes">Yes</option></select></label>
    {[['deliveryDate','Delivery date'],['dueDate','Payment due date']].map(([key,label])=><label key={key}>{label}<input type="date" value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    {financialFields.map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="0.01" value={editor.data[key]} readOnly={key==='grossSell'} title={key==='grossSell'?'Calculated automatically when net sell changes; stored totals are preserved when opening an order.':undefined} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <div><button type="button" disabled={financial.gross===null} onClick={()=>patch({otherPaid:Math.max(0,financial.gross-financial.deposit).toFixed(2)})}>Record balance paid in full</button></div>
    {[['provisional','Provisional booking'],['invoiced','Invoiced'],['bookDone','Manufacture book done'],['archived','Archive entry']].map(([key,label])=><label key={key}>{label}<select value={editor.data[key]?'yes':'no'} onChange={e=>patch({[key]:e.target.value==='yes'})}><option value="no">No</option><option value="yes">Yes</option></select></label>)}
    {[['vent','Glazing requirements'],['aFrame','A-frame · requirements / ordered'],['regs','REGS']].map(([key,label])=><label key={key}>{label}<input value={editor.data[key]} onChange={e=>patch({[key]:e.target.value})}/></label>)}
    <label className="wide">Order notes<textarea value={editor.data.notes} onChange={e=>patch({notes:e.target.value})}/></label>
   </div></fieldset><p>Contribution: <b>{money(financial.contribution)}</b> · Margin: <b>{financial.margin==null?'—':num(financial.margin)+'%'}</b> · Outstanding incl VAT: <b>{money(financial.outstanding)}</b>{financial.credit>0&&<> · Credit / overpayment: <b>{money(financial.credit)}</b></>}</p>
   {error&&<p id="schedule-save-error" tabIndex={-1} className="schedule-message" role="alert"><b>Entry not saved.</b> {error}</p>}
   <div className="schedule-toolbar"><button className="primary" disabled={busy||!loaded} type="submit">{busy?'Saving…':'Save Schedule entry'}</button>{(editor.id||editor.quoteId)&&<button type="button" className="schedule-remove" disabled={busy||calendarBusy} onClick={()=>changeSchedulePresence(editor,!!editor.data.archived&&!editor.quoteId)}>{editor.data.archived&&!editor.quoteId?'Restore to Schedule':'Remove from Schedule'}</button>}<button type="button" disabled={busy||calendarBusy} onClick={()=>{if(discard()){setEditor(null);setDirty(false);}}}>Cancel</button></div>
  </form>}
  {loaded&&tab==='list'&&<div className="schedule-table-wrap schedule-list-wrap"><table className="schedule-table schedule-list-table"><thead><tr>{['Customer / edit','Reference','Job number','Style','Delivery date / status','Book done','Invoiced','Payment status'].map(h=><th key={h} className={h==='Payment status'?'schedule-payment-heading':undefined}>{h}</th>)}</tr></thead><tbody>
   {visible.map(r=>{const e=r.data,state=scheduleListPaymentState(e,today);return <tr key={r.id||r.quoteId}><td><button onClick={()=>open(r)} disabled={busy}>{e.customerName||'Customer needed'}</button>{e.archived&&<small> Archived</small>}{e.status==='Cancelled'&&<small> Cancelled</small>}</td><td title={e.notes}>{e.reference}</td><td>{e.jobNumber}</td><td>{e.style}</td><td className={e.delivered?'schedule-delivery-delivered':''}><div>{date(e.deliveryDate)}</div><small className="schedule-delivery-status">{e.delivered?'Delivered':'Not delivered'}</small></td><td className={e.bookDone?'yes':'no'}>{e.bookDone?'Yes':'No'}</td><td className={e.invoiced?'yes':'no'}>{e.invoiced?'Yes':'No'}</td><td className={'schedule-payment-cell schedule-'+state}>{paymentLabels[state]}</td></tr>;})}
   {!visible.length&&<tr><td colSpan="8">No orders in this view. Add a manual order, or tick Include in Schedule on Jobs. Orders without delivery dates appear under Unscheduled.</td></tr>}
  </tbody></table></div>}
 </main></>;
}
