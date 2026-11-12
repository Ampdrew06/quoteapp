import {countsAsScheduleSale,historicalOrderNeedsReview,localDate,moneyNumber,scheduleTotals,validDate} from './scheduleModel';
// England and Wales dates checked against GOV.UK, 5 November 2026.
// Other years may be marked manually; no recurring rules are guessed.
const holidayDates={
 '2026-01-01':"New Year's Day",'2026-04-03':'Good Friday','2026-04-06':'Easter Monday','2026-05-04':'Early May bank holiday','2026-05-25':'Spring bank holiday','2026-08-31':'Summer bank holiday','2026-12-25':'Christmas Day','2026-12-28':'Boxing Day (substitute)',
 '2027-01-01':"New Year's Day",'2027-03-26':'Good Friday','2027-03-29':'Easter Monday','2027-05-03':'Early May bank holiday','2027-05-31':'Spring bank holiday','2027-08-30':'Summer bank holiday','2027-12-27':'Christmas Day (substitute)','2027-12-28':'Boxing Day (substitute)'};
export const calendarColours={auto:'Automatic',green:'Green',red:'Pale red',yellow:'Yellow',blue:'Pale blue',orange:'Orange',purple:'Purple',grey:'Grey',white:'White'};
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
export function salesYearForDate(date,basis){
 const year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
 return String(year-(basis==='financial'&&month<3?1:0));
}
export function salesYearRange(year,basis){
 if(basis!=='financial')return {start:`${year}-01-01`,end:`${year}-12-31`};
 const next=Number(year)+1;
 const lastDay=next%4===0&&(next%100!==0||next%400===0)?29:28;
 return {start:`${year}-03-01`,end:`${next}-02-${lastDay}`};
}
export function scheduleYearSales(rows,year,basis='calendar'){
 const {start,end}=salesYearRange(year,basis);
 const entries=rows.filter(({data:e})=>countsAsScheduleSale(e)&&validDate(e.deliveryDate)&&e.deliveryDate>=start&&e.deliveryDate<=end);
 const missingOrders={};
 const missing=(key,row)=>(missingOrders[key]||=[]).push(row);
 const t=scheduleTotals(entries);let vat=0,missingVat=0,materials=0,labour=0,delivery=0,missingMaterials=0,missingLabour=0,missingDelivery=0,totalCost=0,missingNetCost=0,missingNet=0,missingGross=0;
 for(const row of entries){const e=row.data,c=moneyNumber(e.netCost);
  if(c===null){missingNetCost++;missing('missingNetCost',row);}else totalCost+=c;
  const n=moneyNumber(e.netSell),g=moneyNumber(e.grossSell);
  if(n===null){missingNet++;missing('missingNet',row);}
  if(g===null){missingGross++;missing('missingGross',row);}
  if(n===null||g===null){missingVat++;missing('missingVat',row);}else vat+=g-n;
  if(n===null||c===null)missing('missingCost',row);
  for(const [key,apply,increment,metric] of [['materialsCost',v=>materials+=v,()=>missingMaterials++,'missingMaterials'],['labour',v=>labour+=v,()=>missingLabour++,'missingLabour'],['deliveryCost',v=>delivery+=v,()=>missingDelivery++,'missingDelivery']]){const value=moneyNumber(e[key]);if(value===null){increment();missing(metric,row);}else apply(value);}
 }
 return {...t,missingOrders,vat,missingVat,materials,labour,delivery,missingMaterials,missingLabour,missingDelivery,totalCost,missingNetCost,missingNet,missingGross};
}
export const calendarStaff=['CB','RS'];
export function annualLeaveBalances(days,year,today=localDate()){
 const result=Object.fromEntries(calendarStaff.map(staff=>[staff,{allowance:25,taken:0,booked:0,used:0,remaining:25}]));
 for(const [date,record] of Object.entries(days)){
  if(date.slice(0,4)!==String(year))continue;
  const details=record.details_json||record,weekday=new Date(date+'T12:00:00').getDay();
  if(weekday===0||weekday===6||calendarDay(date,[],details,today).holiday)continue;
  for(const staff of calendarStaff){const amount=Number(details.staffLeave?.[staff]||0);if(![0,.5,1].includes(amount))continue;result[staff][date<=today?'taken':'booked']+=amount;result[staff].used+=amount;result[staff].remaining-=amount;}
 }
 return result;
}
export function adminCalendarStatus(entry,today=localDate()){
 if(historicalOrderNeedsReview(entry))return {colour:'amber',label:'To Review'};
 if(entry.historicalImport&&moneyNumber(entry.grossSell)===null)return {colour:'grey',label:'Payment details unknown'};
 if(entry.provisional||(!entry.jobNumber&&!entry.reference&&!entry.style))return {colour:'grey',label:'Provisional'};
 const gross=moneyNumber(entry.grossSell),paid=(moneyNumber(entry.deposit)||0)+(moneyNumber(entry.otherPaid)||0);
 if(gross!==null&&gross-paid<=.001&&(gross>0||entry.invoiced))return {colour:'green',label:'Paid'};
 if(!entry.invoiced)return {colour:'orange',label:'Not invoiced'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate||''))return {colour:'amber',label:'Invoiced · due date needed'};
 return entry.dueDate<today?{colour:'red',label:'Invoice overdue'}:{colour:'purple',label:'Invoiced · not due'};
}
