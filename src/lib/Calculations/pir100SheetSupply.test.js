import {resolvePir100SheetRate,pricePir100SheetAllowance} from './pir100SheetSupply';
import {buildSummaryMaterialsModel} from './summaryMaterialsModel';
import {buildVictorianHippedSummaryMaterialsModel} from './victorianHippedSummaryMaterialsModel';
import {defaultMaterials} from '../materials';

test('PIR100 Materials sheet price takes precedence over stale pack prices, including zero',()=>{
 const materials={pir100:{sheet_w_m:1.2,sheet_h_m:2.4,price_per_sheet:35.5},slab100_pack_price_each:28.5};
 expect(resolvePir100SheetRate(materials).sheetPrice).toBe(35.5);
 expect(resolvePir100SheetRate({...materials,pir100:{...materials.pir100,price_per_sheet:0}}).sheetPrice).toBe(0);
 expect(resolvePir100SheetRate({slab100_pack_coverage_m2:5.76,slab100_pack_price_each:60}).sheetPrice).toBe(30);
});
test('whole-sheet charging follows the required supply area and legacy area allowances',()=>{
 const rate=resolvePir100SheetRate({pir100:{price_per_sheet:35.5}});
 expect(pricePir100SheetAllowance({areaM2:15.44,rate})).toMatchObject({sheets:6,cost:213});
 expect(pricePir100SheetAllowance({areaM2:15.44,extraAreaM2:3,rate})).toMatchObject({sheets:7,cost:248.5});
 expect(pricePir100SheetAllowance({areaM2:15.44,extraAreaM2:-100,rate})).toMatchObject({sheets:0,cost:0});
});
test('equivalent Hipped routes charge the same six sheets without changing installed weight on supply edits',()=>{
 const materials={...defaultMaterials,pir100:{...defaultMaterials.pir100,price_per_sheet:35.5},slab100_pack_price_each:28.5};
 const inputs={roofStyle:'hippedLeanTo',widthMM:6200,projMM:2450,pitchDeg:15,soffit_mm:150,leftHip:true,rightHip:true,leftHipWidthMM:1225,rightHipWidthMM:1225,tileSystem:'britmet'};
 const a=buildSummaryMaterialsModel({inputs,materials}),row=a.sections.misc.lines.find(r=>r.key==='slab100');
 expect([row.orderQty,row.order_qty,row.qty_order,row.line]).toEqual([6,6,6,213]);
 const b=buildVictorianHippedSummaryMaterialsModel({inputs:{widthMM:6200,projMM:2450,pitchDeg:15,soffitMM:150,leftEndType:'edwardian',rightEndType:'edwardian',requestedSidePitchDeg:27.7},materials});
 expect(b.sections.find(s=>s.key==='misc').rows.find(r=>r.key==='vh_misc_pir100').cost).toBe(row.line);
 const edited=buildSummaryMaterialsModel({inputs,materials,adjustments:{slab100:3}}),changed=edited.sections.misc.lines.find(r=>r.key==='slab100');
 expect(changed.orderQty).toBe(7);expect(changed.line).toBe(248.5);
 expect(edited.installedWeightKg).toBe(a.installedWeightKg);
});
