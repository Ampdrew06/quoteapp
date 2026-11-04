import {buildCombinationMaterialsModel,combinationReferenceInputs} from './combinationMaterialsModel';
import {buildEdwardianMaterialsReconciliation} from './edwardianMaterialsReconciliation';
import {buildVictorianMaterialsReconciliation} from './victorianMaterialsReconciliation';
import {buildVictorianGeometry} from '../geometry/victorianGeometry';
const inputs={widthMM:4000,projMM:3000,pitchDeg:25,soffitMM:150,tileProductId:'britmetShingle',gutterProfile:'square'};
const qty=(m,key)=>Object.values(m.sections).flatMap(s=>s.lines).find(r=>r.key===key)?.qty;
test('matching configurations preserve the established complete material sections',()=>{
 for(const side of ['edwardian','victorian']){
  const i={...inputs,leftSide:side,rightSide:side},referenceInputs=combinationReferenceInputs(i,side);
  const actual=buildCombinationMaterialsModel({inputs:i});
  const expected=side==='edwardian'?buildEdwardianMaterialsReconciliation({inputs:referenceInputs}):buildVictorianMaterialsReconciliation({geometry:buildVictorianGeometry({inputs:referenceInputs}),productId:'britmetShingle',gutterProfile:'square',plasticsColour:'white'});
  expect(actual.valid).toBe(true);expect(actual.sections).toEqual(expected.sections);
 }
});
test('mixed Britmet roofs supply actual corner types and one Universal adaptor',()=>{
 const a=buildCombinationMaterialsModel({inputs:{...inputs,leftSide:'edwardian',rightSide:'victorian'}}),b=buildCombinationMaterialsModel({inputs:{...inputs,leftSide:'victorian',rightSide:'edwardian'}});
 expect(a.valid&&b.valid).toBe(true);
 for(const m of [a,b]){
  expect(qty(m,'tiles_hipEndCaps90')).toBe(1);expect(qty(m,'tiles_hipEndCaps135')).toBe(2);
  expect(qty(m,'gutters_g_corner_90')).toBe(1);expect(qty(m,'gutters_g_corner_135')).toBe(2);
  expect(qty(m,'plastics_fascia_corners_90')).toBe(1);expect(qty(m,'plastics_fascia_corners_135')).toBe(2);
  expect(qty(m,'tiles_fiveWay')).toBeUndefined();expect(qty(m,'tiles_universal')).toBe(1);expect(qty(m,'tiles_mixedJunction')).toBeUndefined();expect(qty(m,'fixings_screws_tile_fixings')).not.toBeNull();
 }
 expect(a.audits.insulation.membrane.installedAreaM2).toBeCloseTo(b.audits.insulation.membrane.installedAreaM2,8);
});
test('member edits change timber, hardware and displaced insulation, not covering area',()=>{
 const i={...inputs,leftSide:'edwardian',rightSide:'victorian'},before=buildCombinationMaterialsModel({inputs:i}),after=buildCombinationMaterialsModel({inputs:{...i,combinationRafterPositionsMM:{'facet-2':[500,1000]},combinationRearTrussPositionsMM:[400]}});
 expect(after.valid).toBe(true);expect(after.audits.timber.totals.joistLengthM).not.toEqual(before.audits.timber.totals.joistLengthM);expect(after.audits.metal.counts.jacks).toBe(after.audits.timber.componentCounts.jacks);expect(after.audits.insulation.pir100.netAreaM2).not.toEqual(before.audits.insulation.pir100.netAreaM2);expect(after.audits.insulation.membrane.installedAreaM2).toBeCloseTo(before.audits.insulation.membrane.installedAreaM2,8);
});
test('LiteSlate fabricates the half/half cover from two extra ridge/hip tiles counted once',()=>{
 const m=buildCombinationMaterialsModel({inputs:{...inputs,tileProductId:'liteSlate'},materials:{liteslate_ridge_tile_price_each:9,liteslate_ridge_tile_weight_kg:0.4}});
 expect(m.valid).toBe(true);expect(qty(m,'tiles_junctionTiles')).toBe(2);expect(qty(m,'tiles_mixedJunction')).toBeUndefined();expect(qty(m,'tiles_universal')).toBeUndefined();
 const extra=m.sections.tiles.lines.find(r=>r.key==='tiles_junctionTiles');expect(extra.cost).toBe(18);expect(extra.installedWeightKg).toBe(0.8);
});
test('Metrotile junction records the mirrored configuration without inventing its hand or rate',()=>{
 for(const leftSide of ['edwardian','victorian']){
  const rightSide=leftSide==='edwardian'?'victorian':'edwardian',m=buildCombinationMaterialsModel({inputs:{...inputs,tileProductId:'metrotileShingle',leftSide,rightSide}});
  expect(m.valid).toBe(true);const r=m.sections.tiles.lines.find(r=>r.key==='tiles_mixedJunction');expect(r.qty).toBe(1);expect(r.cost).toBeNull();expect(r.label).toContain(`Edwardian ${leftSide==='edwardian'?'left':'right'}`);expect(r.basis).toContain('left/right designation');
 }
});
