// The D/O option keeps its existing pricing key; the directory owns the account.
export const RETAIL_CUSTOMER_ID='c8d4d7f1-5c5d-4769-994b-940c9d70cba1';
export const isRetailName=value=>['retail','retail sale','retail sales','retail (no discount)'].includes(String(value||'').trim().replace(/\s+/g,' ').toLowerCase());
export function retailCustomer(customers){
 return customers.find(c=>c.id===RETAIL_CUSTOMER_ID)
  ||customers.find(c=>String(c.name||'').trim().toLowerCase()==='retail'&&c.role==='public'&&Number(c.discountPct)===0);
}
