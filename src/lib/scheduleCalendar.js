import {localDate,moneyNumber,scheduleTotals} from './scheduleModel';
// England and Wales dates checked against GOV.UK, 5 November 2026.
// Other years may be marked manually; no recurring rules are guessed.
const holidayDates={
 '2026-01-01':"New Year's Day",'2026-04-03':'Good Friday','2026-04-06':'Easter Monday','2026-05-04':'Early May bank holiday','2026-05-25':'Spring bank holiday','2026-08-31':'Summer bank holiday','2026-12-25':'Christmas Day','2026-12-28':'Boxing Day (substitute)',
 '2027-01-01':"New Year's Day",'2027-03-26':'Good Friday','2027-03-29':'Easter Monday','2027-05-03':'Early May bank holiday','2027-05-31':'Spring bank holiday','2027-08-30':'Summer bank holiday','2027-12-27':'Christmas Day (substitute)','2027-12-28':'Boxing Day (substitute)'};
export const calendarColours={auto:'Automatic',green:'Green',red:'Pale red',yellow:'Yellow',blue:'Pale blue',grey:'Grey',white:'White'};
export function monthCalendar(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''))return [];
 const [y,m]=month.split('-').map(Number),first=new Date(y,m-1,1,12),offset=(first.getDay()+6)%7,count=new Date(y,m,0).getDate(),cells=Math.ceil((offset+count)/7)*7;
 return Array.from({length:cells/7},(_,week)=>Array.from({length:7},(_,day)=>{const n=week*7+day-offset+1;return n<1||n>count?null:`${month}-${String(n).padStart(2,'0')}`;}));
}
export const calendarMonthLabel=month=>/^\d{4}-\d{2}$/.test(month||'')?new Date(month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'Select a month';
export function calendarDay(date,rows,stored={},today=localDate()){
 const jobs=rows.filter(r=>r.data.deliveryDate===date&&!r.data.archived&&r.data.status!=='Cancelled').sort((a,b)=>String(a.data.jobNumber).localeCompare(String(b.data.jobNumber),undefined,{numeric:true}));
 const holiday=stored.bankHoliday===false?'':stored.bankHoliday===true?(holidayDates[date]||'Bank holiday'):(holidayDates[date]||'');
 const colour=stored.colour&&stored.colour!=='auto'?stored.colour:holiday?'yellow':jobs.length?(date<today?'green':'red'):'white';
 return {jobs,holiday,colour,note:stored.note||''};
}
export function scheduleYearSales(rows,year){
 const entries=rows.filter(r=>!r.data.archived&&r.data.status!=='Cancelled'&&r.data.deliveryDate?.slice(0,4)===String(year));
 const t=scheduleTotals(entries);let vat=0,missingVat=0,materials=0,labour=0,delivery=0,missingMaterials=0,missingLabour=0,missingDelivery=0,totalCost=0,missingNetCost=0,missingNet=0,missingGross=0;
 for(const {data:e} of entries){const c=moneyNumber(e.netCost);if(c===null)missingNetCost++;else totalCost+=c;const n=moneyNumber(e.netSell),g=moneyNumber(e.grossSell);if(n===null)missingNet++;if(g===null)missingGross++;if(n===null||g===null)missingVat++;else vat+=g-n;
  for(const [key,apply,missing] of [['materialsCost',v=>materials+=v,()=>missingMaterials++],['labour',v=>labour+=v,()=>missingLabour++],['deliveryCost',v=>delivery+=v,()=>missingDelivery++]]){const value=moneyNumber(e[key]);if(value===null)missing();else apply(value);}
 }
 return {...t,vat,missingVat,materials,labour,delivery,missingMaterials,missingLabour,missingDelivery,totalCost,missingNetCost,missingNet,missingGross};
}
