import {buildCombinationQuotation,buildCombinationQuoteRecord,buildCombinationSummaryMaterialsModel} from './combinationQuotation';
import {activateDesignRecord,readActiveDesignRecord,clearActiveDesignRecord} from '../activeDesignRecord';
const inputs={widthMM:4000,projMM:3000,pitchDeg:25,leftSide:'edwardian',rightSide:'victorian',tileProductId:'britmetShingle',gutterProfile:'square',selectedCustomerId:'retail'};
test('half/half begins with the Victorian baseline and supports a separate override',()=>{
 const q=buildCombinationQuotation({inputs});expect(q.valid).toBe(true);expect(q.labour.days).toBeCloseTo(2.09,8);
 const labourConfig={styleBaselines:{victorian:{days:1.5,areaM2:8,incrementDaysPerM2:.04}}};
 expect(buildCombinationQuotation({inputs,labourConfig}).labour.days).toBeCloseTo(1.66,8);
 expect(buildCombinationQuotation({inputs:{...inputs,labourDaysOverride:1.25},labourConfig}).labour.days).toBe(1.25);
});
test('unconfigured quotations cannot be saved',()=>{
 const quotation=buildCombinationQuotation({inputs});expect(quotation.ready).toBe(false);
 expect(()=>buildCombinationQuoteRecord({inputs,quotation})).toThrow();
 expect(buildCombinationQuotation({inputs:{...inputs,tileProductId:'metrotileShingle'}}).ready).toBe(false);
});
test('supply adjustments and exclusions preserve installed geometry and weight',()=>{
 const base=buildCombinationSummaryMaterialsModel({inputs}),changed=buildCombinationSummaryMaterialsModel({inputs:{...inputs,summaryPricingState:{adjustments:{tiles_main:2},exclusions:{tiles_main:true}}}});
 expect(base.valid&&changed.valid).toBe(true);expect(changed.sections.tiles.lines.find(r=>r.key==='tiles_main').qty).toBe(base.sections.tiles.lines.find(r=>r.key==='tiles_main').qty+2);
 expect(changed.installedWeightKg).toBe(base.installedWeightKg);expect(changed.audits.geometry).toEqual(base.audits.geometry);
});
test('activation restores complete combination inputs to its own draft',()=>{
 const storage=(()=>{const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;},removeItem:k=>{delete data[k];}};})();
 const saved={...inputs,combinationRafterPositionsMM:{'facet-2':[500,1000]},combinationRearTrussPositionsMM:[400],summaryPricingState:{adjustments:{tiles_main:2}},quoteDisplayed:true};
 activateDesignRecord({id:'combination-test',roof_style:'combination',inputs_json:saved},storage);
 expect(JSON.parse(storage.getItem('combinationGeometryDraft'))).toEqual(saved);expect(readActiveDesignRecord('combination',storage).id).toBe('combination-test');clearActiveDesignRecord(storage);expect(readActiveDesignRecord('combination',storage)).toBeNull();
});
