export function summaryOrderQuantity(row={},fallback){
 for(const value of [row.order_qty,row.orderQty,row.qty_order,row.qty,fallback]){
 if(value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value)))return Math.max(0,Number(value));
 }
 return undefined;
}
