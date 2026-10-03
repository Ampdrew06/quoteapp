import { buildHippedMetalIntegrationAudit, buildWatercourseWallbarRequirement } from './metalIntegrationAudit';
const geometry={plainRafterCount:7,leftJackRafterCount:2,rightJackRafterCount:3,leftSideIntermediateJackCount:1,rightSideIntermediateJackCount:2,bossQty:2,sparHookQty:8};
const edgeResult={edgeModel:{valid:true,edges:[{kind:'rearWallplate'},{kind:'eaves'}]},bom:{valid:true,lines:[{key:'tile_starter',qty:13.626,order_qty:5,line:39.97,weight_kg:12.26}]}};
const run=extra=>buildHippedMetalIntegrationAudit({geometry,edgeResult,...extra});
test('counts plain hangers separately from every front and side jack fitting',()=>{
 const result=run(); expect(result.rows.find(row=>row.key==='joist_hangers').qty).toBe(7);
 expect(result.rows.find(row=>row.key==='jack_rafter_hooks').qty).toBe(8);
 expect(result.rows.find(row=>row.key==='jack_rafter_brackets').qty).toBe(8);
});
test('uses resolved boss and spar counts and existing fixed weights',()=>{
 const result=run(); expect(result.rows.find(row=>row.key==='boss_rafter_terminal').weightKg).toBe(1);
 expect(result.rows.find(row=>row.key==='spar_hook').weightKg).toBe(2);
});
test('retains consumed starter metres and supplied stock as distinct quantities',()=>{
 const row=run().rows[0];expect(row.qty).toBe(13.626);expect(row.orderQty).toBe(5);expect(row.cost).toBe(39.97);
});
test('accepts wall edges and rejects missing geometry',()=>{
 expect(run().valid).toBe(true);
 expect(run({edgeResult:{...edgeResult,edgeModel:{valid:true,edges:[{kind:'wallAbutment'}]}}}).valid).toBe(true);
 expect(buildHippedMetalIntegrationAudit().valid).toBe(false);
});

test('orders one aluminium length for each 1862mm accompanying wallbar, using installed EWBS weight',()=>{
 const row=buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:1862,rightExternalWallBarSlopeMM:1862},{watercourse_price_each:10});
 expect(row.qty).toBe(2);expect(row.cost).toBe(20);expect(Number(row.weightKg.toFixed(2))).toBe(0.67);
});
test('allows full first watercourse length and deducts overlap from further pieces',()=>{
 expect(buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:2500}).qty).toBe(1);
 expect(buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:4950}).qty).toBe(2);
 expect(buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:4951}).qty).toBe(3);
});

test('1846mm EWBS pair costs two lengths but contributes only 0.66kg installed weight',()=>{
 const row=buildWatercourseWallbarRequirement({leftExternalWallBarSlopeMM:1846,rightExternalWallBarSlopeMM:1846},{watercourse_price_each:5.15});
 expect(row.qty).toBe(2);expect(row.cost).toBe(10.3);expect(row.usedM).toBe(3.692);
 expect(Number(row.weightKg.toFixed(2))).toBe(0.66);
});
