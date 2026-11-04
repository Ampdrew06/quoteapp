export const customerDetailFields=['customerCode','contactName','email','phone','mobile','address1','address2','town','county','postcode','deliveryAddress','paymentTerms','notes','active','defaultSpec','defaultExclusions','defaultDeliveryReturnMiles','legacyImport'];
export const customerMiles = value => Math.max(0, Number(value) || 0);
export function customerFromRecord(row) {
  const details=Object.fromEntries(customerDetailFields.filter(key=>Object.prototype.hasOwnProperty.call(row.details_json||{},key)).map(key=>[key,row.details_json[key]]));
  return { ...row,...details, id:row.id, name:row.name||'', username:row.username||'',
    loginCode:row.login_code||'', role:row.role||'trade',discountPct:Number(row.discount_pct)||0,
    defaultDeliveryMilesOneWay:customerMiles(row.default_miles ?? row.default_delivery_miles_one_way),
  };
}
export function customerToRecord(customer, newId) {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {id:uuid.test(customer.id||'')?customer.id:newId(),
    name:customer.name||'',username:customer.username||customer.name||'',
    login_code:customer.loginCode||null,role:customer.role||'trade',discount_pct:Number(customer.discountPct)||0,
    default_miles:customerMiles(customer.defaultDeliveryMilesOneWay),details_json:{...(customer.details_json||{}),...Object.fromEntries(customerDetailFields.filter(key=>customer[key]!==undefined).map(key=>[key,customer[key]]))}};
}
export function resolveCustomerDeliveryMiles(enteredDistance, customer) {
  const entered=customerMiles(enteredDistance);
  return entered>0?entered:customerMiles(customer?.defaultDeliveryMilesOneWay);
}
