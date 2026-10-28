import {buildVictorianHippedTimberSummary as build} from './victorianHippedTimberSummary';
import {victorianHippedDefaults as inputs} from '../geometry/victorianHippedGeometry';
import {getMaterials} from '../materials';
const materials=getMaterials();
test('timber uses each scheduled joist member once and remains a partial Summary',()=>{
 const m=build({inputs,materials});expect(m.valid).toBe(true);expect(m.rows).toHaveLength(12);
 expect(new Set(m.joists.map(p=>p.reference)).size).toBe(m.joists.length);
 expect(m.joists.length).toBe(m.members.members.length+m.wallplate.wallbars.length+1);
 expect(m.rows[0].netQty).toBeCloseTo(m.joists.reduce((s,p)=>s+p.lengthMM/1000,0),7);
 expect(m.pricingReady).toBe(false);expect(m.materialsCostForPricing).toBe(null);
});
test('waste is charged once and whole-stock allowances are not charged again',()=>{
 const m=build({inputs,materials});m.rows.forEach(r=>{
  expect(r.qty).toBeCloseTo(r.netQty*(1+r.wastePct/100),7);
  expect(r.cost).toBeCloseTo(Math.round(r.qty*r.unitPrice*100)/100,6);
 });
 expect(m.rows.find(r=>r.key==='vh_upstands').orderQty).toBe('Shared');
 expect(m.rows.find(r=>r.key==='vh_finishing_laths').orderQty).toBe('Shared');
});
test('supplied quantity changes and exclusions retain installed weight',()=>{
 const m=build({inputs,materials}),changed=build({inputs:{...inputs,victorianHippedTimberSummary:{adjustments:{vh_joists:2},exclusions:{vh_joists:true}}},materials});
 expect(changed.rows[0].qty).toBeCloseTo(m.rows[0].qty+2,7);
 expect(changed.rows[0].chargeableCost).toBe(0);expect(changed.totals.weight).toBe(m.totals.weight);
});
test('Materials stock length and metre price control the joist row',()=>{
 const m=build({inputs,materials:{...materials,steico:{...materials.steico,stock_len_m:10,price_per_m:9}}});
 expect(m.rows[0].unitPrice).toBe(9);expect(m.rows[0].orderQty).toBe(Math.ceil(m.rows[0].qty/10));
});

test('wallplate ply follows actual active joints including a wall at either end',()=>{
 for(const left of ['victorian','edwardian','wall'])for(const right of ['victorian','edwardian','wall']){
  const m=build({inputs:{...inputs,leftEndType:left,rightEndType:right},materials});
  const joints=Number(left!=='wall')+Number(right!=='wall'),wp=m.wallplate.horizontal.topEdgeMM;
  const packers=[Math.max(0,wp-joints*350),...m.wallplate.wallbars.map(p=>Math.max(0,p.topEdgeMM-350))].reduce((n,l)=>n+Math.ceil(l/800),0);
  expect(m.rows.find(r=>r.key==='vh_wallplate_ply9').netQty).toBeCloseTo(((wp+joints*1050)*220+packers*75*220)/1e6,7);
  expect(m.rows.find(r=>r.key==='vh_wallplate_ply18').netQty).toBeCloseTo((wp*143+joints*2*600*143)/1e6,7);
  expect(m.wallplateMaterials.ply18.chevronCount).toBe(joints*2);
  const pooled=m.rows.filter(r=>['vh_bases','vh_upstands','vh_wallplate_ply9'].includes(r.key));
  expect(pooled[0].orderQty).toBe(Math.ceil(pooled.reduce((n,r)=>n+r.qty,0)/pooled[0].stockSize-1e-9));
 }
});
