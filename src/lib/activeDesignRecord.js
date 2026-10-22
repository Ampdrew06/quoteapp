/* global globalThis */
import {restoreSummaryPricingState} from './Calculations/summaryPricingState';
const KEY='activeDesignRecord';
export const designFamily=record=>{
 const style=record?.inputs_json?.roofStyle||record?.roof_style||'lean-to';
 return ['leanTo','hippedLeanTo','lean-to','hipped-lean-to'].includes(style)?'lean-to':style;
};
const inputKey=family=>family==='victorian-five'?'victorianFiveInputs':family==='victorian'?'victorianPlanPreviewInputs':family==='gable'?'gableDesignPreviewInputs':family==='lean-to'?'leanToInputs':family+'Inputs';
export function readActiveDesignRecord(family,storage=globalThis.localStorage){
 try{const value=JSON.parse(storage.getItem(KEY)||'null');return value?.record?.id&&value.family===family?value.record:null;}catch{return null;}
}
export function clearActiveDesignRecord(storage=globalThis.localStorage){
 for(const key of [KEY,'activeDesignDraft','active_job_id','active_gable_job_id','gableBookDetails','leanBookDetails','edwardianBookDetails','victorianBookDetails','victorianFiveBookDetails'])storage.removeItem(key);
}
export function rememberActiveDesignRecord(record,storage=globalThis.localStorage){
 if(record?.id)storage.setItem(KEY,JSON.stringify({family:designFamily(record),record}));
}
export function activateDesignRecord(record,storage=globalThis.localStorage){
 clearActiveDesignRecord(storage);
 if(!record?.id)return;
 const family=designFamily(record);
 rememberActiveDesignRecord(record,storage);
 storage.setItem(inputKey(family),JSON.stringify(record.inputs_json||{}));
 if(family==='lean-to'){
  restoreSummaryPricingState(record.inputs_json,storage);
 }
}
export function restoreActiveDesignRecord(family,storage=globalThis.localStorage){
 const record=readActiveDesignRecord(family,storage);
 if(!record)return false;
 activateDesignRecord(record,storage);return true;
}
// Update design/pricing only: retain job status, number, dates and delivery details.
export function designRecordPatch(record){
 const {status,job_number,requested_delivery_date,delivery_address_json,order_notes,id,created_at,...patch}=record;
 return patch;
}

export function draftDesignIdentity(storage=globalThis.localStorage){
 let id=storage.getItem('activeDesignDraft');
 if(!id){id=String(Date.now())+'-'+Math.random().toString(36).slice(2);storage.setItem('activeDesignDraft',id);}
 return id;
}
