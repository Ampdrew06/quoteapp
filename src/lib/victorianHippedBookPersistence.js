/* global globalThis */
import {getQuoteById,updateQuote} from './quotes';
import {readActiveDesignRecord,rememberActiveDesignRecord} from './activeDesignRecord';

export function readVictorianHippedBookDetails(inputs,record){
 return {requested_delivery_date:record?.requested_delivery_date||'',delivery_address_json:record?.delivery_address_json||{deliveryAddress:inputs.deliveryPostcode||''},order_notes:record?.order_notes||'',...inputs.bookDetails,job_number:inputs.bookDetails?.job_number||record?.job_number||''};
}

// Book edits must update the saved record, not just the temporary design cache.
// Merge into fresh saved inputs so this button never saves unquoted design edits.
export async function saveVictorianHippedBookDetails({inputs,details},{storage=globalThis.localStorage,api={getQuoteById,updateQuote}}={}){
 storage.setItem('victorianHippedPreviewInputs',JSON.stringify({...inputs,bookDetails:details}));
 const active=readActiveDesignRecord('victorian-hipped',storage);
 if(!active)return {draft:true};
 const current=await api.getQuoteById(active.id);
 if(!current?.id)throw new Error('Unable to load the saved roof. Book details remain in this draft; please try again.');
 const patch={inputs_json:{...current.inputs_json,bookDetails:details},requested_delivery_date:details.requested_delivery_date||null,delivery_address_json:details.delivery_address_json||{},order_notes:details.order_notes||''};
 if(current.job_number)patch.job_number=details.job_number||current.job_number;
 const saved=await api.updateQuote(current.id,patch);
 if(!saved?.id)throw new Error('Book details were not saved to the quote/job. Please check the connection and try again.');
 // Do not replace the active roof if the user navigated away during the request.
 if(readActiveDesignRecord('victorian-hipped',storage)?.id===active.id)rememberActiveDesignRecord({...current,...saved,...patch},storage);
 return {draft:false,record:{...current,...saved,...patch}};
}
