import {summaryOrderQuantity} from './summaryOrderQuantity';
import {summaryInsulationAreaDisplay} from './summaryInsulationAreaDisplay';
test('roll area and original supplied quantity remain distinct',()=>{
 const row={key:'superquilt',qty:1,used_m2:9.72};
 const display={orderQty:summaryOrderQuantity(row),...summaryInsulationAreaDisplay(row)};
 expect(display.qty).toBe(9.72);expect(display.orderQty).toBe(1);
});
test('legacy cans and screw boxes retain order quantities without a separate order field',()=>{
 expect(summaryOrderQuantity({qty:2})).toBe(2);expect(summaryOrderQuantity({qty:1})).toBe(1);
 expect(summaryOrderQuantity({orderQty:4,qty:10.2})).toBe(4);
 expect(summaryOrderQuantity({qty_order:3,qty:8})).toBe(3);
});
test('explicit zero is retained and invalid/missing aliases use the original quantity',()=>{
 expect(summaryOrderQuantity({order_qty:0,qty:3})).toBe(0);
 expect(summaryOrderQuantity({order_qty:NaN,qty:2})).toBe(2);
 expect(summaryOrderQuantity({},5)).toBe(5);
});
