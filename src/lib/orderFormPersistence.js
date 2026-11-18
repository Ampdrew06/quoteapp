/* global globalThis */
import {getQuoteById,updateQuote,getQuoteSaveError} from './quotes';
import {designFamily,readActiveDesignRecord,rememberActiveDesignRecord} from './activeDesignRecord';
export function activeOrderRecord(quoteNumber,storage=globalThis.localStorage) {
 try {
  const value=JSON.parse(storage.getItem('activeDesignRecord')||'null');
  const record=value?.record;
  return record?.id&&String(record.quote_number)===String(quoteNumber)?record:null;
 }catch{return null;}
}
export function readOrderFormFields(data,storage=globalThis.localStorage) {
 const record=activeOrderRecord(data.quote,storage),address=record?.delivery_address_json??{};
 const saved=address.orderFormFields??{};
 return {contact:saved.contact??data.contactName??'',phone:saved.phone??(data.phone==='—'?'':data.phone??''),
  email:saved.email??data.email??'',billing:saved.billing??data.billing??'',
  address:address.deliveryAddress??data.deliveryAddress??'',siteContact:address.contactName??data.siteContact??'',
  sitePhone:address.contactPhone??data.sitePhone??'',date:record?.requested_delivery_date??data.deliveryDate??''};
}
export async function saveOrderFormFields({recordId,quoteNumber,fields},{storage=globalThis.localStorage,api={getQuoteById,updateQuote,getQuoteSaveError}}={}) {
 const active=activeOrderRecord(quoteNumber,storage);
 if(!recordId||active?.id!==recordId)throw new Error('Reopen this saved quote before saving delivery details.');
 const current=await api.getQuoteById(recordId);
 if(current?.id!==recordId)throw new Error('The saved quote could not be loaded. Your entries are still on this form; please retry.');
 if(activeOrderRecord(quoteNumber,storage)?.id!==recordId)throw new Error('The active quote changed. Reopen this order form before saving.');
 const patch={requested_delivery_date:fields.date||null,
  delivery_address_json:{...(current.delivery_address_json??{}),deliveryAddress:fields.address??'',
   contactName:fields.siteContact??'',contactPhone:fields.sitePhone??'',
   orderFormFields:{contact:fields.contact??'',phone:fields.phone??'',email:fields.email??'',billing:fields.billing??''}}};
 const saved=await api.updateQuote(recordId,patch);
 if(!saved?.id)throw new Error(api.getQuoteSaveError?.()||'Order details could not be saved. Please check the connection and retry.');
 const record={...current,...saved,...patch};
 const family=designFamily(current);
 if(readActiveDesignRecord(family,storage)?.id===recordId)rememberActiveDesignRecord(record,storage);
 return record;
}
