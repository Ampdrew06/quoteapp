import {quoteStyleLabel} from './quoteStyleLabel';
export const scheduleStatuses=['Not Started','In Production','Complete','Scheduled','Delivered','On Hold','Cancelled'];
export const blankScheduleEntry={customerId:'',customerName:'',reference:'',jobNumber:'',areaM2:'',widthMM:'',projectionMM:'',fasciaColour:'',soffitColour:'',gutterDescription:'',deliveryAddress:'',deliveryContact:'',aFrameNet:'',style:'',tiles:'',provisional:false,delivered:false,status:'Not Started',deliveryDate:'',netCost:'',netSell:'',grossSell:'',deposit:'',otherPaid:'',invoiced:false,dueDate:'',bookDone:false,vent:'',aFrame:'',labour:'',materialsCost:'',deliveryCost:'',regs:'',notes:'',archived:false};
export const moneyNumber=v=>v===''||v==null||!Number.isFinite(Number(v))?null:Number(v);
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;}
export function jobScheduleEntry(job){
 const p=job.pricing_json||{},s=p.summary||{},i=job.inputs_json||{};
 const address=job.delivery_address_json||{};
 const materials=moneyNumber(p.materialsCost),labour=moneyNumber(p.labourCost),delivery=moneyNumber(p.delivery);
 const base=moneyNumber(p.baseCost),net=moneyNumber(p.net??s.net),gross=moneyNumber(p.gross??s.gross);
 return {...blankScheduleEntry,widthMM:i.widthMM??'',projectionMM:i.projMM??'',fasciaColour:i.fasciaColour||i.plasticsColour||'',soffitColour:i.soffitColour||i.fasciaColour||i.plasticsColour||'',gutterDescription:[i.gutterColour,i.gutterProfile].filter(Boolean).join(' / '),deliveryAddress:address.deliveryAddress||i.deliveryPostcode||'',deliveryContact:[address.contactName,address.contactPhone].filter(Boolean).join(' · '),customerId:job.customer_id||'',customerName:job.customer_name||'',reference:job.manual_reference||i.customerReference||'',jobNumber:String(job.job_number||''),style:quoteStyleLabel(job),tiles:[i.tileProductId||i.tileSystem,i.tileColour||i.tileColor].filter(Boolean).join(' / '),deliveryDate:validDate(job.requested_delivery_date)?job.requested_delivery_date:'',netSell:net??'',grossSell:gross??'',netCost:base!==null&&delivery!==null?round(base+delivery):materials!==null&&labour!==null&&delivery!==null?round(materials+labour+delivery):'',labour:labour??'',materialsCost:materials??'',deliveryCost:delivery??''};
}
export function combineSchedule(jobs,records){
 const saved=new Map(records.filter(r=>r.quote_id).map(r=>[r.quote_id,r]));
 const manual=records.filter(r=>!r.quote_id);
 const result=jobs.filter(j=>j.status==='converted_to_job'&&j.schedule_included===true).map(job=>{const same=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();const matches=manual.filter(r=>same(r.entry_json?.customerName,job.customer_name)&&same(r.entry_json?.reference,job.manual_reference||job.inputs_json?.customerReference)&&String(r.entry_json?.jobNumber||'').trim().toLowerCase()===String(job.job_number||'').trim().toLowerCase()&&String(job.job_number||'').trim());const stored=saved.get(job.id)||(matches.length===1?matches[0]:null);return {id:stored?.id||null,quoteId:job.id,version:stored?.version??null,job,pendingLink:!!stored&&!stored.quote_id,data:{...jobScheduleEntry(job),...(stored?.entry_json||{})}};});
 const ids=new Set(result.map(r=>r.id).filter(Boolean));
 for(const r of records)if(!r.quote_id&&!ids.has(r.id))result.push({id:r.id,quoteId:r.quote_id,version:r.version,job:null,data:{...blankScheduleEntry,...r.entry_json}});
 return result;
}
export function scheduleAmounts(e){
 const net=moneyNumber(e.netSell),cost=moneyNumber(e.netCost),gross=moneyNumber(e.grossSell),deposit=moneyNumber(e.deposit)||0,paid=moneyNumber(e.otherPaid)||0;
 const contribution=net===null||cost===null?null:round(net-cost);
 return {net,cost,gross,contribution,margin:net>0&&contribution!==null?contribution/net*100:null,outstanding:gross===null?null:round(Math.max(0,gross-deposit-paid)),deposit,paid,credit:gross===null?null:round(Math.max(0,deposit+paid-gross))};
}
export function paymentState(e,today=localDate()){
 const a=scheduleAmounts(e);
 if(e.status==='Cancelled'||e.archived)return 'cancelled';
 if(a.outstanding===null)return 'unknown';
 if(a.outstanding===0)return 'paid';
 if(!e.delivered)return 'not-due';
 if(!validDate(e.dueDate))return 'needs-date';
 return e.dueDate<today?'overdue':'delivered-not-due';
}
// The List always identifies an undelivered order, even before prices are entered.
export function scheduleListPaymentState(entry,today=localDate()){
 const state=paymentState(entry,today);
 return state==='unknown'&&!entry.delivered?'not-due':state;
}
export function inScheduleMonth(row,month){return month==='unscheduled'?!validDate(row.data.deliveryDate):validDate(row.data.deliveryDate)&&row.data.deliveryDate.slice(0,7)===month;}
export function scheduleTotals(rows){
 const t={count:0,net:0,contribution:0,gross:0,deposits:0,outstanding:0,overdue:0,missingPrice:0,missingCost:0,contributionSales:0,pricedNetCount:0};
 for(const {data:e} of rows){if(e.archived||e.status==='Cancelled')continue;const a=scheduleAmounts(e);t.count++;if(a.net===null||a.gross===null)t.missingPrice++;if(a.net!==null)t.pricedNetCount++;t.net+=a.net||0;t.gross+=a.gross||0;t.deposits+=a.deposit;t.outstanding+=a.outstanding||0;if(a.contribution===null)t.missingCost++;else{t.contribution+=a.contribution;t.contributionSales+=a.net;}if(paymentState(e)==='overdue')t.overdue+=a.outstanding;}
 return {...t,average:t.pricedNetCount>0?t.net/t.pricedNetCount:0,margin:t.contributionSales>0?t.contribution/t.contributionSales*100:null};
}
export function validateScheduleEntry(e){
 if(moneyNumber(e.aFrameNet)!==null&&moneyNumber(e.netSell)!==null&&Number(e.aFrameNet)>Number(e.netSell))return 'A-frame net sale must not exceed the total net sell.';
 if(!String(e.customerName||'').trim())return 'Choose or enter a customer.';
 if(!scheduleStatuses.includes(e.status))return 'Choose a valid production status.';
 for(const key of ['deliveryDate','dueDate'])if(e[key]&&!validDate(e[key]))return 'Enter valid delivery and due dates.';
 for(const key of ['widthMM','projectionMM','aFrameNet','areaM2','netCost','netSell','grossSell','deposit','otherPaid','labour','materialsCost','deliveryCost'])if(e[key]!==''&&e[key]!=null&&(moneyNumber(e[key])===null||Number(e[key])<0))return 'Amounts and area must be blank or non-negative numbers.';
 if(e.delivered&&e.status!=='Delivered')return 'Delivered Yes requires production status Delivered.';
 if(!e.delivered&&e.status==='Delivered')return 'Status Delivered requires Delivered Yes.';
 return '';
}
