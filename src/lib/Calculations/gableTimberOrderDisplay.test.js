import {buildGableTimberOrderDisplay} from './gableTimberOrderDisplay';
const model={sections:{timber:{lines:[{key:'gable_joists',qty:25.22,line:200},{key:'gable_pse',qty:8.65},{key:'gable_gussets',qty:2.97},{key:'gable_frontFace',qty:.86},{key:'gable_bases',qty:1.9},{key:'gable_upstands',qty:1.53},{key:'gable_chevrons',qty:1.22},{key:'gable_closures',qty:4.76},{key:'gable_laths',qty:40,used_m:182.99,stock_length_m:4.8}]}}};
test('used metres are separate from whole joist, PSE and lath stock orders',()=>{
 const d=buildGableTimberOrderDisplay(model);
 expect(d.gable_joists).toMatchObject({qty:25.22,orderQty:3,units:'m'});expect(d.gable_pse.orderQty).toBe(2);
 expect(d.gable_laths).toMatchObject({qty:182.99,orderQty:40,units:'m'});
});
test('pools 9mm sheet orders across components and orders 18mm independently',()=>{
 const d=buildGableTimberOrderDisplay(model);
 expect(d.gable_gussets.orderQty).toBe(3);expect(d.gable_frontFace.orderQty).toBe('Shared');expect(d.gable_upstands.orderQty).toBe('Shared');
 expect(d.gable_chevrons.orderQty).toBe(1);expect(d.gable_closures.orderQty).toBe('Offcuts');
});
test('uses configured stock lengths without changing costs or authoritative model quantities',()=>{
 const before=JSON.stringify(model),d=buildGableTimberOrderDisplay(model,{steico:{stock_len_m:6},pse30x90:{stock_len_m:3}});
 expect(d.gable_joists.orderQty).toBe(5);expect(d.gable_pse.orderQty).toBe(3);expect(JSON.stringify(model)).toBe(before);
});
test('empty geometry does not invent stock orders',()=>{expect(buildGableTimberOrderDisplay({})).toEqual({});});
