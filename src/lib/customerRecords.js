export const customerMiles = value => Math.max(0, Number(value) || 0);
export function customerFromRecord(row) {
  return { ...row, id:row.id, name:row.name||'', username:row.username||'',
    loginCode:row.login_code||'', role:row.role||'trade',discountPct:Number(row.discount_pct)||0,
    defaultDeliveryMilesOneWay:customerMiles(row.default_miles ?? row.default_delivery_miles_one_way),
  };
}
export function customerToRecord(customer, newId) {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return {id:uuid.test(customer.id||'')?customer.id:newId(),
    name:customer.name||'',username:customer.username||customer.name||'',
    login_code:customer.loginCode||'',role:customer.role||'trade',discount_pct:Number(customer.discountPct)||0,
    default_miles:customerMiles(customer.defaultDeliveryMilesOneWay)};
}
export function resolveCustomerDeliveryMiles(enteredDistance, customer) {
  const entered=customerMiles(enteredDistance);
  return entered>0?entered:customerMiles(customer?.defaultDeliveryMilesOneWay);
}
