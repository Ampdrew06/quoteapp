/* global globalThis */
const KEY='quoteapp_favourite_customers_v1';
function favourites(storage=globalThis.localStorage){try{const list=JSON.parse(storage.getItem(KEY)||'[]');return new Set(Array.isArray(list)?list.map(String):[]);}catch{return new Set();}}
export function isCustomerFavourite(id,storage=globalThis.localStorage){return favourites(storage).has(String(id));}
export function sortCustomerList(customers,{favouritesFirst=true,storage=globalThis.localStorage}={}){
 const ids=favourites(storage),name=c=>String(c?.name||'').trim();
 return [...(customers||[])].sort((a,b)=>(favouritesFirst?(Number(ids.has(String(b.id)))-Number(ids.has(String(a.id)))):0)||name(a).localeCompare(name(b),'en-GB',{sensitivity:'base',numeric:true})||String(a.id).localeCompare(String(b.id)));
}
export function toggleCustomerFavourite(id,storage=globalThis.localStorage){
 const ids=favourites(storage),key=String(id);if(ids.has(key))ids.delete(key);else ids.add(key);
 storage.setItem(KEY,JSON.stringify([...ids]));
 if(typeof window!=='undefined')window.dispatchEvent(new Event('quoteapp_customers_updated'));
 return ids.has(key);
}
