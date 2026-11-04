const clean=value=>String(value??'').trim().toLocaleLowerCase('en-GB');
export function planCustomerImport(rows,customers){
 const codeCounts=new Map(),nameCounts=new Map();for(const row of rows){const c=clean(row.customerCode),n=clean(row.name);if(c)codeCounts.set(c,(codeCounts.get(c)||0)+1);if(n)nameCounts.set(n,(nameCounts.get(n)||0)+1);}
 return rows.map((row,index)=>{
  const code=clean(row.customerCode),name=clean(row.name),issues=[...(row.reviewReasons||[])];
  if(!name)issues.push('Missing customer name');
  if(!code)issues.push('Missing account code');
  if(codeCounts.get(code)>1)issues.push('Duplicate account code in import');
  if(nameCounts.get(name)>1)issues.push('Duplicate customer name in import');
  if(row.inactive)issues.push('Source says do not use');
  const matched=customers.filter(c=>(code&&(clean(c.customerCode)===code||clean(c.loginCode)===code))||clean(c.name)===name);
  const unique=[...new Map(matched.map(c=>[c.id,c])).values()];
  if(unique.length>1)issues.push('Multiple existing customer matches');
  const existing=unique.length===1?unique[0]:null;
  if(existing&&existing.role!=='trade')issues.push('Existing non-trade account: manual review required');
  return {index,row,existing,issues,action:issues.length?'review':existing?'update':'create'};
 });
}
export function mergeImportedCustomer(row,existing=null){
 const next={...(existing||{}),name:existing?.name||row.name,role:existing?.role||'trade',loginCode:existing?.loginCode||'',discountPct:existing?.discountPct??0};
 const fields=['customerCode','contactName','email','phone','mobile','address1','address2','town','county','postcode','paymentTerms','notes'];
 for(const key of fields)if(row[key]!=null&&String(row[key]).trim()!==''){const value=String(row[key]).trim();next[key]=key==='notes'&&existing?.notes&&!existing.notes.includes(value)?existing.notes+'\n'+value:value;}
 if(row.returnDistanceMiles!=null&&Number.isFinite(Number(row.returnDistanceMiles))&&Number(row.returnDistanceMiles)>=0){next.defaultDeliveryReturnMiles=Number(row.returnDistanceMiles);next.defaultDeliveryMilesOneWay=Number(row.returnDistanceMiles)/2;}
 next.legacyImport={...(existing?.legacyImport||{}),source:'Customer Database.xlsx',sourceRow:row.sourceRow,sourceName:row.name,additionalFields:row.additionalFields||{}};
 return next;
}
