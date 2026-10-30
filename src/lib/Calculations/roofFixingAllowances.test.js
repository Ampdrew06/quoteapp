import {lathFixingSupply,tileFixingSupply,concreteScrewAllowance,installedFixingWeight} from './roofFixingAllowances';
test('lath boxes round separately and do not duplicate factory ringbeam fixings',()=>{
 const a=lathFixingSupply({internalScrews:100,externalRowScrews:200,supportScrews:36});
 expect(a.totalBoxes).toBe(2);expect(a.externalScrews).toBe(236);expect(a.perimeterScrews).toBe(0);
});
test('tile fixings use shared material rates and concrete is prorated',()=>{
 expect(tileFixingSupply({mainQty:60,hipQty:8,capQty:2,steel:true,materials:{}}).totalScrews).toBe(216);
 const c=concreteScrewAllowance({concrete_screws_price_per_box:19.61,concrete_screws_units_per_box:100});
 expect(c.qty).toBe(8);expect(c.cost).toBeCloseTo(1.5688,8);
 expect(installedFixingWeight({count:100,unitsPerBox:250,boxWeightKg:1})).toBe(.4);
 expect(installedFixingWeight({count:100,unitsPerBox:250})).toBeNull();
});
