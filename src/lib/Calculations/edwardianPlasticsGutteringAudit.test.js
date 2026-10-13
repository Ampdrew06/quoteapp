import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianPlasticsGutteringAudit} from './edwardianPlasticsGutteringAudit';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25},g=buildEdwardianGeometry({inputs});
test('three open Edwardian runs share gutter stock and have two bends and one downpipe assembly',()=>{
 const a=buildEdwardianPlasticsGutteringAudit({geometry:g});expect(a.valid).toBe(true);expect(a.guttering.counts).toMatchObject({lengths:3,unions:0,corners90:2,stopEnds:2,outlets:1,pipes:1,offsetBends:2,clips:2,shoes:1,adaptors:1,brackets:16});
});
test('square and ogee retain adaptor while round omits it; no extra fitting brackets',()=>{for(const gutterProfile of ['square','ogee','round']){const a=buildEdwardianPlasticsGutteringAudit({geometry:g,gutterProfile});expect(a.valid).toBe(true);expect(a.guttering.counts.adaptors).toBe(gutterProfile==='round'?0:1);expect(a.guttering.counts.brackets).toBe(16);}});
test('fascia and soffit use existing stock, corners, mitre H-trim and one pin allowance',()=>{
 const a=buildEdwardianPlasticsGutteringAudit({geometry:g});expect(a.valid).toBe(true);expect(a.plastics.fasciaPlan.qty).toBe(3);expect(a.plastics.rows.every(r=>r.fasciaWidthMM===225)).toBe(true);expect(a.plastics.rows[0].fasciaCut.externalCutHeightMM).toBe(224);expect(a.plastics.soffitPlan.order).toEqual([{widthMM:150,qty:3}]);
 expect(a.plastics.accessories.jRunM).toBeCloseTo(10.94,8);expect(a.plastics.accessories.jQty).toBe(3);expect(a.plastics.accessories.hLengthMM).toBe(440);expect(a.plastics.totals.ventQtyM).toBe(12);expect(a.plasticLines.find(l=>l.key==='polytop_pins').qty).toBe(50);
});
test('front runs above stock length require unions and maintain correct corner allowances',()=>{
 const a=buildEdwardianPlasticsGutteringAudit({geometry:buildEdwardianGeometry({inputs:{...inputs,widthMM:4050}})});expect(a.valid).toBe(true);expect(a.guttering.counts.unions).toBe(1);expect(a.guttering.counts.corners90).toBe(2);
});
test('colour price band and requested side restrictions retain shared coverage rules',()=>{
 const materials={fascia_price_per_length_foiled_mm:{225:40},soffit_price_per_length_foiled_mm:{150:20},polytop_pins_price_per_box:1.19};
 const a=buildEdwardianPlasticsGutteringAudit({geometry:g,materials,plasticsColour:'Light Oak'});expect(a.band).toBe('foiled');expect(a.plasticLines.find(l=>l.key==='fascia-225').cost).toBe(120);expect(a.plasticLines.find(l=>l.key==='polytop_pins').cost).toBe(1.19);
 const restricted=buildEdwardianPlasticsGutteringAudit({geometry:buildEdwardianGeometry({inputs:{...inputs,sideSoffitMode:'specified',specifiedSideSoffitMM:100}})});expect(restricted.valid).toBe(true);expect(restricted.plastics.rows.find(r=>r.side==='left').soffitGeometryMM).toBe(85);
});
test('invalid geometry or bracket spacing does not yield a supply audit',()=>{expect(buildEdwardianPlasticsGutteringAudit({geometry:{valid:false}}).valid).toBe(false);expect(buildEdwardianPlasticsGutteringAudit({geometry:g,materials:{gutter_bracket_spacing_mm:0}}).valid).toBe(false);});
