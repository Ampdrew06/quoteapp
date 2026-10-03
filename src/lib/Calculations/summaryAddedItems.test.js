import { buildSummaryItemCatalog, buildSummaryAddedItemLines, addedItemsCost, readSummaryAddedItems, writeSummaryAddedItems, normalizeAddedItems } from './summaryAddedItems';
const materials={gutter_square_corner_90_ext_price:3.05,gutter_square_corner_135_ext_price:4.2,screws_2x8_price_per_box:3.22,duct_tape_roll_price_each:0,fascia_price_per_length_white_mm:{250:30},ringBeam:{timber_price_per_m:1.44,stock_len_m:4.8},pse30x90:{price_per_m:99}};
const entry={section:'gutters',catalogId:'square_corner135',qty:1};
test('catalog offers absent corner types and uses exact Materials prices, including zero',()=>{
 const catalog=buildSummaryItemCatalog(materials);
 expect(catalog.find(row=>row.id==='square_corner135').unitPrice).toBe(4.2);
 expect(catalog.find(row=>row.section==='misc'&&row.id==='duct').unitPrice).toBe(0);
 expect(catalog.find(row=>row.id==='pse').unitPrice).toBe(1.44*4.8);
 expect(catalog.some(row=>row.id==='fascia_white_250')).toBe(true);
 expect(catalog.find(row=>row.id==='round_corner135').unitPrice).toBe(null);
});
test('added extras price their supplied quantity without changing installed weight',()=>{
 const rows=buildSummaryAddedItemLines([{...entry,qty:3}],materials);
 expect(rows[0].qty).toBe(3);
 expect(rows[0].order_qty).toBe(3);
 expect(rows[0].line).toBe(12.6);
 expect(rows[0].weight_kg).toBe(0);
 expect(rows[0].isAddedItem).toBe(true);
 expect(addedItemsCost(rows)).toBe(12.6);
});
test('excluding an extra removes its cost while retaining the supply row',()=>{
 const rows=buildSummaryAddedItemLines([{...entry,excluded:true}],materials);
 expect(addedItemsCost(rows)).toBe(0);
 expect(rows[0].supplyToSite).toBe(true);
 expect(rows[0].qty).toBe(1);
});
test('extra screw quantities are boxes and zero quantity contributes no cost',()=>{
 const rows=buildSummaryAddedItemLines([{section:'misc',catalogId:'screw2',qty:2},{...entry,qty:0}],materials);
 expect(rows[0].units).toBe('Box');
 expect(rows[0].line).toBe(6.44);
 expect(rows[1].qty).toBe(0);
 expect(rows[1].line).toBe(0);
});
test('changing Materials prices recalculates existing extras',()=>{
 expect(buildSummaryAddedItemLines([entry],{...materials,gutter_square_corner_135_ext_price:5})[0].line).toBe(5);
});
test('invalid entries and duplicates cannot create phantom charges',()=>{
 expect(normalizeAddedItems([entry,entry,null,{section:'bad',catalogId:'x'}, {...entry,qty:-2}]).length).toBe(1);
 expect(buildSummaryAddedItemLines([{section:'misc',catalogId:'unknown',qty:99}],materials)).toEqual([]);
 expect(normalizeAddedItems(null)).toEqual([]);
});
test('extras persist inside quotation inputs and clear with a new or older quote',()=>{
 const values={leanToInputs:JSON.stringify({widthMM:4050,quoteRef:'test'})};
 const storage={getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=value;}};
 writeSummaryAddedItems([{...entry,qty:2,excluded:true}],storage);
 expect(JSON.parse(values.leanToInputs).widthMM).toBe(4050);
 const savedQuote=JSON.parse(values.leanToInputs);
 values.leanToInputs='{}';
 expect(readSummaryAddedItems(storage)).toEqual([]);
 values.leanToInputs=JSON.stringify(savedQuote);
 expect(readSummaryAddedItems(storage)).toEqual([{...entry,qty:2,excluded:true}]);
 writeSummaryAddedItems([],storage);
 expect(readSummaryAddedItems(storage)).toEqual([]);
});
test('malformed saved state is handled safely and configured zero is not a missing price',()=>{
 expect(readSummaryAddedItems({getItem:()=>'{bad'})).toEqual([]);
 const zero=buildSummaryAddedItemLines([{section:'misc',catalogId:'duct',qty:1}],materials)[0];
 expect(zero.price_unconfigured).toBe(false);
 const missing=buildSummaryAddedItemLines([{section:'gutters',catalogId:'round_corner135',qty:1}],materials)[0];
 expect(missing.price_unconfigured).toBe(true);
});
