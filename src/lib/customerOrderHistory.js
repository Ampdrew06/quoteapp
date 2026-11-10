import {isRetailName,retailCustomer} from './retailCustomer';
import {moneyNumber,scheduleTotals} from './scheduleModel';
const name=v=>String(v||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB');
export function scheduleCustomerMatch(entry,customers){
 if(entry.customerId&&entry.customerId!=='retail'){const exact=customers.find(c=>c.id===entry.customerId);return {id:exact?.id||null,method:exact?'id':'unmatched'};}
 if(entry.customerId==='retail'||isRetailName(entry.customerName)){const retail=retailCustomer(customers);if(retail)return {id:retail.id,method:'retail'};}
 const key=name(entry.customerName);if(!key)return {id:null,method:'unmatched'};
 const matches=customers.filter(c=>[c.name,c.customerCode].filter(Boolean).some(v=>name(v)===key));
 return matches.length===1?{id:matches[0].id,method:'name'}:{id:null,method:'unmatched'};
}
export function customerOrderHistory(rows,customers,customerId,year='all'){
 const active=rows.filter(r=>!r.data.archived&&r.data.status!=='Cancelled'),matched=active.map(r=>({...r,customerMatch:scheduleCustomerMatch(r.data,customers)})),own=matched.filter(r=>r.customerMatch.id===customerId);
 const selected=own.filter(r=>year==='all'||r.data.deliveryDate?.slice(0,4)===String(year)).sort((a,b)=>String(b.data.deliveryDate||'').localeCompare(String(a.data.deliveryDate||''))||String(b.data.jobNumber||'').localeCompare(String(a.data.jobNumber||''),undefined,{numeric:true}));
 let vat=0,missingNet=0,missingGross=0;for(const r of selected){const n=moneyNumber(r.data.netSell),g=moneyNumber(r.data.grossSell);if(n===null)missingNet++;if(g===null)missingGross++;if(n!==null&&g!==null)vat+=g-n;}
 return {rows:selected,totals:{...scheduleTotals(selected),vat,missingNet,missingGross},years:[...new Set(own.map(r=>r.data.deliveryDate?.slice(0,4)).filter(Boolean))].sort().reverse(),nameMatched:selected.filter(r=>r.customerMatch.method==='name').length,unassigned:matched.filter(r=>!r.customerMatch.id)};
}
