import { buildHippedGutteringIntegrationAudit } from './gutteringIntegrationAudit';
const edgeModel={valid:true,edges:[['front',7356],['left',3135],['right',3135]].map(([side,lengthMM])=>({id:side,side,lengthMM,kind:'eaves'}))};
const run=extra=>buildHippedGutteringIntegrationAudit({edgeModel,...extra});
test('uses four stock lengths and one front union rather than joining around corners',()=>{
 const result=run();
 expect(result.counts.lengths).toBe(4); expect(result.counts.unions).toBe(1);
 expect(result.counts.corners90).toBe(2); expect(result.totalRunM).toBe(13.626);
});
test('uses spacing brackets only, without extras for unions or corners',()=>{
 expect(run().rows.map(row=>row.brackets)).toEqual([10,4,5]); expect(run().counts.brackets).toBe(19);
 expect(run({materials:{gutter_bracket_spacing_mm:1000}}).counts.brackets).toBe(15);
});
test('supplies complete single round downpipe assembly and two stop ends',()=>{
 const counts=run().counts;
 expect([counts.stopEnds,counts.outlets,counts.pipes,counts.offsetBends,counts.clips,counts.shoes]).toEqual([2,1,1,2,2,1]);
 expect(run().pipeM).toBe(2.5);
});
test('square and ogee include adaptor while round does not',()=>{
 expect(run({profile:'square'}).counts.adaptors).toBe(1); expect(run({profile:'ogee'}).counts.adaptors).toBe(1);
 expect(run({profile:'round'}).items.some(item=>item.key==='dp_adaptor')).toBe(false);
});
test('respects configured zero prices and reports unconfigured corner price',()=>{
 const result=run({materials:{gutter_square_union_price:0,dp_bend_price:3}});
 expect(result.items.find(item=>item.key==='g_union').cost).toBe(0);
 expect(result.items.find(item=>item.key==='dp_bend').cost).toBe(6);
 expect(result.items.find(item=>item.key==='g_corner_90').cost).toBe(null);
});
test('rejects missing geometry and invalid bracket spacing',()=>{
 expect(buildHippedGutteringIntegrationAudit().valid).toBe(false);
 expect(run({materials:{gutter_bracket_spacing_mm:0}}).valid).toBe(false);
});

test('shares a side offcut across the front of the 4050 by 2885 roof',()=>{
 const result=run({edgeModel:{valid:true,edges:[['front',4356],['left',3106],['right',3106]].map(([side,lengthMM])=>({id:side,side,lengthMM,kind:'eaves'}))}});
 expect(result.counts.lengths).toBe(3); expect(result.counts.unions).toBe(1);
 expect(result.rows.map(row=>row.brackets)).toEqual([6,4,5]);
 expect(result.counts.brackets).toBe(15);
 expect(result.stockPlan.boards.some(board=>board.pieces.length===2)).toBe(true);
});
