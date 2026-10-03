import { integrateMetalSummaryWatercourse } from './metalSummaryIntegration';
const geometry={leftExternalWallBarSlopeMM:1846,rightExternalWallBarSlopeMM:1846};
const materials={watercourse_price_each:5.15};
test('replaces legacy watercourse with two ordered lengths and installed 0.66kg',()=>{
 const hardware={key:'joist_hangers',qty:5};
 const result=integrateMetalSummaryWatercourse([{key:'watercourse',qty:1,weight_kg:0.9},hardware],geometry,materials);
 const row=result.find(item=>item.key==='watercourse');
 expect(row.qty).toBe(2);expect(row.order_qty).toBe(2);expect(row.line).toBe(10.3);expect(row.weight_kg).toBe(0.66);
 expect(result.find(item=>item.key==='joist_hangers')).toBe(hardware);
});
test('recalculates without duplicates and keeps stable key for saved adjustments',()=>{
 const first=integrateMetalSummaryWatercourse([],geometry,materials);
 expect(integrateMetalSummaryWatercourse(first,geometry,materials)).toEqual(first);
 expect(first[0].key).toBe('watercourse');
});
test('preserves legacy when wallbar geometry is unavailable',()=>{
 const legacy=[{key:'watercourse'}];
 expect(integrateMetalSummaryWatercourse(legacy,null,materials)).toBe(legacy);
 expect(integrateMetalSummaryWatercourse(legacy,{},materials)).toBe(legacy);
});
