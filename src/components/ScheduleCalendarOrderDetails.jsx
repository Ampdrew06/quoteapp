import React from 'react';
import {scheduleAmounts,moneyNumber} from '../lib/scheduleModel';
import {adminCalendarStatus} from '../lib/scheduleCalendar';
const money=n=>n==null?'Not recorded':new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
const date=v=>v?new Date(v+'T12:00:00').toLocaleDateString('en-GB'):'Not recorded';
export default function ScheduleCalendarOrderDetails({row,today,saving,onEdit}){
 const e=row.data,a=scheduleAmounts(e),status=adminCalendarStatus(e,today),vat=a.net!==null&&a.gross!==null?Math.round((a.gross-a.net)*100)/100:null;
 const af=moneyNumber(e.aFrameNet),split=af!==null&&a.net!==null&&af<=a.net;
 const dimensions=[e.widthMM?`${e.widthMM} mm wide`:null,e.projectionMM?`${e.projectionMM} mm projection`:null].filter(Boolean).join(' × ');
 return <article className="calendar-order-detail"><header><h3>{e.customerName||'Customer not recorded'} · {e.reference||'No reference'} · Job {e.jobNumber||'—'}</h3><span className={'calendar-order-status calendar-admin-'+status.colour}>{status.label}</span></header>
 <div className="calendar-order-columns"><section><h4>Roof specification</h4><p><strong>{dimensions||'Dimensions not recorded'} · {e.style||'Style not recorded'}</strong></p><p>{e.tiles||'Tiles / colour not recorded'}</p><p>Fascia: {e.fasciaColour||'Not recorded'} · Soffit: {e.soffitColour||'Not recorded'}</p><p>Guttering: {e.gutterDescription||'Not recorded'}</p><p>Glazing: {e.vent||'None recorded'}</p><p>A-frame: {e.aFrame||'None recorded'}</p></section>
 <section><h4>Delivery</h4><p className="calendar-delivery-address">{e.deliveryAddress||'Delivery address not recorded'}</p>{e.deliveryContact&&<p>{e.deliveryContact}</p>}<p>{date(e.deliveryDate)} · {e.delivered?'Delivered':'Not delivered'} · {e.status}</p><p>Manufacture book: {e.bookDone?'Done':'Not done'} · Invoiced: {e.invoiced?'Yes':'No'}</p></section></div>
 <div className="calendar-order-finance">{split?<p>Roof net {money(a.net-af)} + A-frame net {money(af)} = Net {money(a.net)}</p>:<p>Net sale: <b>{money(a.net)}</b></p>}<p>VAT: {money(vat)} · <strong>Total incl VAT: {money(a.gross)}</strong></p><p>Deposit: {money(a.deposit)} · Other payments: {money(a.paid)} · <strong>Outstanding: {money(a.outstanding)}</strong></p><p>Payment due: {date(e.dueDate)}</p></div>
 {e.notes&&<section><h4>Order notes</h4><p className="calendar-delivery-address">{e.notes}</p></section>}<button type="button" disabled={saving} onClick={()=>onEdit(row)}>Edit Schedule order</button></article>;
}
