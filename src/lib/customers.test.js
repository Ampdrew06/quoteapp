jest.mock('./supabaseClient',()=>({supabase:{}}));
import { supabase } from './supabaseClient';
import { saveCustomerRecord, getCustomers, findCustomerByLoginCode } from './customers';
const row={id:'11111111-1111-4111-8111-111111111111',name:'Trade',username:'trade',login_code:'1234',discount_pct:20,default_miles:10};
test('saving updates a single customer and includes distance without deleting records',async()=>{
 let submitted;
 supabase.from=()=>({upsert:(record)=>{submitted=record;return {select:()=>({single:async()=>({data:record,error:null})})};}});
 const result=await saveCustomerRecord({id:row.id,name:row.name,username:row.username,loginCode:row.login_code,discountPct:20,defaultDeliveryMilesOneWay:10});
 expect(submitted.default_miles).toBe(10);
 expect(result.customer.defaultDeliveryMilesOneWay).toBe(10);
 expect(result.error).toBe(null);
});
test('a failed save reports the database error without deleting any customer',async()=>{
 supabase.from=()=>({upsert:()=>({select:()=>({single:async()=>({data:null,error:{message:'Could not save default_miles'}})})})});
 const result=await saveCustomerRecord({id:row.id,name:'Trade'});
 expect(result.customer).toBe(null);
 expect(result.error).toBe('Could not save default_miles');
});
test('customer listing and login lookup both retain the saved default distance',async()=>{
 supabase.from=()=>({select:()=>({order:async()=>({data:[row],error:null}),eq:()=>({maybeSingle:async()=>({data:row,error:null})})})});
 expect((await getCustomers())[0].defaultDeliveryMilesOneWay).toBe(10);
 expect((await findCustomerByLoginCode('1234')).defaultDeliveryMilesOneWay).toBe(10);
});
