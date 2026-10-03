import { buildHippedMiscellaneousIntegrationAudit } from './miscellaneousIntegrationAudit';
const run=extra=>buildHippedMiscellaneousIntegrationAudit({geometry:{widthMM:7040,projectionMM:2910,plainRafterCount:5,leftJackRafterCount:1,rightJackRafterCount:1,leftSideIntermediateJackCount:3,rightSideIntermediateJackCount:3},internalAreaM2:22.126,externalAreaM2:25,tileQuantity:100,...extra});
test('leaves lath allowance unconfigured when resolved rows are unavailable',()=>{
 const result=run();expect(result.memberCounts.jacks).toBe(8);
 expect(result.rows.find(row=>row.key==='screws_lath_fixings').candidateQty).toBe(null);
});
test('calculates main tile candidate by product rate and box rounding',()=>{
 expect(run().rows[4].candidateQty).toBe(2);
 expect(run({tileSystem:'tapco'}).rows[4].candidateQty).toBe(1);
});
test('keeps confirmed foam and tape allowances fixed on larger roofs',()=>{
 expect(run().rows[0].candidateQty).toBe(2);
 expect(run({internalAreaM2:100}).rows[0].candidateQty).toBe(2);
 expect(run({internalAreaM2:100}).rows[1].candidateQty).toBe(1);
});
test('compares plasterboard plan and facet area without adding a supply row',()=>{
 const result=run();expect(result.plasterboard.legacyBoards).toBe(8);expect(result.plasterboard.facetBoards).toBe(8);
 expect(result.plasterboard.facetWeightKg).toBe(22.126*8.5);
 expect(buildHippedMiscellaneousIntegrationAudit().valid).toBe(false);
});

test('costs factory consumption separately from loose site fixings',()=>{
 const result=run({geometry:{widthMM:7040,projectionMM:2910,plainRafterCount:5,leftJackRafterCount:8,bossQty:2,sparHookQty:8},materials:{d4_glue_price_per_tub:12,screws_1_5x10_price_per_box:5,screws_1_5x10_units_per_box:500}});
 const rows=result.rows;
 expect(rows.find(r=>r.key==='factory_screws_1_5x10').candidateQty).toBe(148);
 expect(rows.find(r=>r.key==='factory_screws_1_5x10').cost).toBe(1.48);
 expect(rows.find(r=>r.key==='factory_spar_rivets').candidateQty).toBe(16);
 expect(rows.find(r=>r.key==='factory_drywall_32mm').candidateQty).toBe(140);
 expect(rows.find(r=>r.key==='factory_drywall_32mm').cost).toBe(null);
 expect(rows.find(r=>r.key==='d4_glue').cost).toBe(12);
 expect(rows.find(r=>r.key==='d4_glue').usage).toBe('factory');
});

test('uses confirmed site member counts and Materials prices, including zero',()=>{
 const result=run({geometry:{plainRafterCount:1,bossRafterCount:2,leftJackRafterCount:1,rightJackRafterCount:1,leftSideIntermediateJackCount:3,rightSideIntermediateJackCount:3,hasLeftHip:true,hasRightHip:true},materials:{screws_3x10_price_per_box:2.46,screws_1x8_price_per_box:0,tileFixings:{price_per_box:1.47}}});
 expect(result.siteFixings.screws).toBe(26);
 expect(result.rows[2].candidateQty).toBe(1);
 expect(result.rows[2].cost).toBe(2.46);
 expect(result.rows[4].cost).toBe(0);
});
test('adds hip and cap fixings before rounding whole tile screw boxes',()=>{
 const extra={edgeLines:[{key:'hip_ridge',qty:8},{key:'hip_end_cap_90',qty:2}],materials:{screws_1x8_price_per_box:1.54}};
 const result=run({tileQuantity:51,...extra});
 expect(result.tileFixings.totalScrews).toBe(189);
 expect(result.rows[4].candidateQty).toBe(1);
 expect(result.rows[4].cost).toBe(1.54);
 expect(run({tileQuantity:60,...extra}).rows[4].candidateQty).toBe(2);
 expect(run({tileSystem:'tapcoSlate',tileQuantity:51}).tileFixings.mainScrews).toBe(102);
});
