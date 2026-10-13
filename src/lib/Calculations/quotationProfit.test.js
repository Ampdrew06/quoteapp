import {quotationProfit} from './quotationProfit';
test('shows profit remaining after the screenshot customer discount and listed costs',()=>{
 expect(quotationProfit({net:3191.64,vat:638.33},1843.41,630,32.09)).toBe(686.14);
});
test('VAT does not affect quotation profit and losses remain visible',()=>{
 expect(quotationProfit({net:100,vat:20},60,30,15)).toBe(-5);
 expect(quotationProfit({net:100,vat:0},60,30,15)).toBe(-5);
});
test('customer discount reduces profit by the discount amount',()=>{
 expect(quotationProfit({net:120},60,20,10)).toBe(30);
 expect(quotationProfit({net:96},60,20,10)).toBe(6);
});
