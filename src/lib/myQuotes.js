import {supabase} from './supabaseClient';
import {getCurrentCustomer} from './customers';
import {isTradeUser} from './userRole';
import {activateDesignRecord,designFamily} from './activeDesignRecord';
export function ownsTradeQuote(record,customer=getCurrentCustomer()){
 return Boolean(isTradeUser()&&customer?.id&&record?.customer_id===customer.id);
}
// Customer-code login is not Supabase Auth. This query scopes ordinary app use;
// database RLS tied to authenticated users is still required before public launch.
export async function getMyQuotes(){
 const customer=getCurrentCustomer();
 if(!isTradeUser()||!customer?.id)return [];
 const {data,error}=await supabase.from('quotes')
  .select('id,quote_number,manual_reference,customer_id,customer_name,roof_style,status,created_at,inputs_json')
  .eq('customer_id',customer.id).order('created_at',{ascending:false});
 if(error)throw new Error('Your quotes could not be loaded. Please try again.');
 return (Array.isArray(data)?data:[]).filter(row=>ownsTradeQuote(row,customer));
}
export function openMyQuote(record,navigate){
 if(!ownsTradeQuote(record)||record.status==='converted_to_job')return false;
 const family=designFamily(record);
 if(!['lean-to','gable','edwardian','victorian'].includes(family))return false;
 activateDesignRecord(record);
 if(family==='lean-to')localStorage.setItem('auto_show_quote','1');
 navigate('/quote/'+family);return true;
}
