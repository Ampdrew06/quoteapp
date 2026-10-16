import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianMetalFixingsAudit} from './victorianMetalFixingsAudit';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
const materials={boss_rafter_terminal_price_each:10,spar_hook_price_each:2,watercourse_price_each:12,concrete_screws_price_per_box:19.61,expanding_foam_can_price_each:4,aluminium_tape_roll_price_each:6,screws_3x10_price_per_box:5,screws_2x8_price_per_box:3,screws_1x8_price_per_box:2,d4_glue_price_per_tub:7,screws_1_5x10_price_per_box:10,screws_1_5x10_units_per_box:1000,spar_hook_rivets_price_per_box:5,spar_hook_rivets_units_per_box:500};
const geometry=patch=>buildVictorianGeometry({inputs:{...base,...patch}}),build=(patch={},m=materials,productId='britmetShingle')=>buildVictorianMetalFixingsAudit({geometry:geometry(patch),materials:m,productId});
test('Victorian boss serves all four hips and three intermediates with seven complete spar pairs',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.counts).toEqual({bosses:1,sparPairs:7,sparHooks:14,jacks:0,joistHangers:0,trusses:4,memberFeet:15});expect(a.metalRows.find(r=>r.key==='spar_hook').qty).toBe(14);expect(a.metalRows.find(r=>r.key==='boss_rafter_terminal').qty).toBe(1);expect(a.metalRows.find(r=>r.key==='spar_hook').supplyToSite).toBe(false);
});
test('rear watercourse orders per sloping member and uses actual installed coverage weight',()=>{
 const a=build();expect(a.watercourse.orderQty).toBe(2);expect(a.watercourse.usedM).toBeCloseTo(2*1.9849768762135227,8);expect(a.watercourse.weightKg).toBeCloseTo(a.watercourse.usedM*0.18,8);const r=a.metalRows.find(r=>r.key==='watercourse');expect(r.cost).toBe(24);expect(r.supplyToSite).toBe(true);
});
test('factory consumption is prorated and never supplied as loose boxes',()=>{
 const a=build();expect(a.fixings.factoryScrews).toBe(104);expect(a.fixings.rivets).toBe(28);expect(a.factoryRows.find(r=>r.key==='factory_screws_1_5x10').cost).toBeCloseTo(1.04,8);expect(a.factoryRows.find(r=>r.key==='factory_spar_rivets').cost).toBeCloseTo(0.28,8);expect(a.factoryRows.find(r=>r.key==='factory_staples_32mm').qty).toBe(357);expect(a.factoryRows.every(r=>r.supplyToSite===false&&r.usage==='factory')).toBe(true);
});
test('site screw boxes include15feet and the Victorian ten-fixing five-way adaptor allowance',()=>{
 const a=build(),r=key=>a.siteRows.find(r=>r.key===key);expect(a.fixings.siteScrews).toBe(30);expect(a.fixings.tileScrews).toBe(54*3+10*4+4*2+10);expect(r('screws_tile_fixings').qty).toBe(2);expect(r('screws_rafter_eaves').qty).toBe(1);expect(r('concrete_screws').cost).toBeCloseTo(8*19.61/100,8);expect(r('screws_lath_internal').qty).toBe(Math.ceil(a.fixings.internalScrews/250));expect(r('screws_lath_external').qty).toBe(Math.ceil(a.fixings.externalScrews/250));expect(a.fixings.supportScrews).toBe(58);
});
test('starter and foam tape are reference allocations and add no second charge',()=>{
 const a=build();expect(a.existingAllocations.map(r=>r.key)).toEqual(['hipTape','starter']);expect(a.existingAllocations.every(r=>r.alreadyCounted)).toBe(true);expect([...a.metalRows,...a.siteRows,...a.factoryRows].some(r=>['starter','hipTape'].includes(r.key))).toBe(false);expect(a.knownCost).toBeCloseTo([...a.metalRows,...a.siteRows,...a.factoryRows].reduce((n,r)=>n+r.cost,0),8);expect(a.costComplete).toBe(true);
});
test('actual intermediate thresholds alter hook/factory counts and unresolved slate fixings stay pending',()=>{
 const a=build({widthMM:750*(1+Math.SQRT2),projMM:6500});expect(a.valid).toBe(true);expect(a.counts.sparPairs).toBe(4);expect(a.counts.sparHooks).toBe(8);expect(a.fixings.factoryScrews).toBe(62);const slate=build({},materials,'liteSlate');expect(slate.valid).toBe(true);expect(slate.fixings.tileScrews).toBeNull();expect(slate.siteRows.find(r=>r.key==='screws_tile_fixings').qty).toBeNull();expect(slate.costComplete).toBe(false);
});
test('missing and zero prices remain distinct; invalid pack and unresolved geometry cannot produce a full audit',()=>{
 const a=build({},{});expect(a.costComplete).toBe(false);expect(a.metalRows.find(r=>r.key==='spar_hook').cost).toBeNull();expect(build({}, {...materials,spar_hook_price_each:0}).metalRows.find(r=>r.key==='spar_hook').cost).toBe(0);expect(build({}, {...materials,tileFixings:{units_per_box:0}}).valid).toBe(false);expect(build({widthMM:4000,projMM:6500}).valid).toBe(false);
});
test('audit does not mutate geometry or rates',()=>{const g=geometry(),before=JSON.stringify(g),rates=JSON.stringify(materials);buildVictorianMetalFixingsAudit({geometry:g,materials});expect(JSON.stringify(g)).toBe(before);expect(JSON.stringify(materials)).toBe(rates);});
