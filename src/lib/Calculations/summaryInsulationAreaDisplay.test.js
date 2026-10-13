import {summaryInsulationAreaDisplay} from './summaryInsulationAreaDisplay';
test('Gable boards and rolls show required area without changing order quantity or cost',()=>{
 for(const key of ['gable_pir50','gable_pir100','gable_sq_12','gable_membrane']){
 const row={key,qty:4,order_qty:4,units:key.includes('pir')?'Sheets':'Rolls',used_m2:16.525,line:60};
 const display=summaryInsulationAreaDisplay(row);
 expect(display).toMatchObject({qty:16.525,units:'m²'});expect({...row,...display}.order_qty).toBe(4);expect(row.qty).toBe(4);expect(row.line).toBe(60);
 }
});
test('Lean-To and Hipped existing PIR area and covering used-area metadata are retained',()=>{
 expect(summaryInsulationAreaDisplay({key:'pir50_cradle',qty:6.7,units:'m²',order_qty:3}).qty).toBe(6.7);
 expect(summaryInsulationAreaDisplay({key:'slab100',qty:12.3,units:'m²',order_qty:5}).qty).toBe(12.3);
 expect(summaryInsulationAreaDisplay({key:'superquilt',qty:2,units:'Rolls',used_m2:15.2}).qty).toBe(15.2);
});
test('does not invent area or alter separately added supply extras',()=>{
 expect(summaryInsulationAreaDisplay({key:'superquilt',qty:2,units:'Rolls'})).toEqual({});
 expect(summaryInsulationAreaDisplay({key:'gable_pir50',used_m2:3,isAddedItem:true})).toEqual({});
 expect(summaryInsulationAreaDisplay({key:'gable_pir50',used_m2:NaN})).toEqual({});
});
