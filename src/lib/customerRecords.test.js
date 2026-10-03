import { customerFromRecord, customerToRecord, resolveCustomerDeliveryMiles } from './customerRecords';
const id='11111111-1111-4111-8111-111111111111';
test('customer default distance round-trips through its database column',()=>{
 const row=customerToRecord({id,name:'Trade',username:'trade',loginCode:'1234',discountPct:20,defaultDeliveryMilesOneWay:9.5},()=>{throw Error('Must preserve existing UUID');});
 expect(row.default_miles).toBe(9.5);
 expect(row.id).toBe(id);
 expect(customerFromRecord(row).defaultDeliveryMilesOneWay).toBe(9.5);
 expect(customerFromRecord(row).discountPct).toBe(20);
});
test('legacy alternate distance column and missing values load safely',()=>{
 expect(customerFromRecord({default_delivery_miles_one_way:12}).defaultDeliveryMilesOneWay).toBe(12);
 expect(customerFromRecord({}).defaultDeliveryMilesOneWay).toBe(0);
 expect(customerFromRecord({default_miles:0}).defaultDeliveryMilesOneWay).toBe(0);
});
test('entered delivery distance takes precedence and absent distance uses customer default',()=>{
 const customer={defaultDeliveryMilesOneWay:10};
 expect(resolveCustomerDeliveryMiles(24,customer)).toBe(24);
 expect(resolveCustomerDeliveryMiles(0,customer)).toBe(10);
 expect(resolveCustomerDeliveryMiles(null,customer)).toBe(10);
 expect(resolveCustomerDeliveryMiles(0,null)).toBe(0);
});
test('new customers get a UUID while existing usernames remain intact',()=>{
 const row=customerToRecord({id:'local',name:'Trade',username:'original',defaultDeliveryMilesOneWay:-5},()=>id);
 expect(row.id).toBe(id);
 expect(row.username).toBe('original');
 expect(row.default_miles).toBe(0);
});
