import {buildVictorianFiveGeometry} from '../geometry/victorianFiveGeometry';
import {buildVictorianMaterialsReconciliation} from './victorianMaterialsReconciliation';
import {buildVictorianSurfaceAreas} from '../geometry/victorianSurfaceAreas';
import {getMaterials} from '../materials';
const materials=getMaterials(),base={widthMM:3150,projMM:3300,pitchDeg:25,frameThicknessMM:70,soffitMM:150};
const model=(patch={},m=materials)=>buildVictorianMaterialsReconciliation({geometry:buildVictorianFiveGeometry({inputs:{...base,...patch},materials:m}),materials:m,productId:'britmetShingle',plasticsColour:'white',gutterProfile:'square'});
test('seven-plane material audits count all beams, hips and front supports once',()=>{
 for(const [patch,jacks] of [[{},0],[{widthMM:3800,projMM:4200},5]]){
  const a=model(patch);expect(a.valid).toBe(true);expect(a.audits.timber.componentCounts).toMatchObject({hips:6,intermediates:0,jacks,ringBeams:7});expect(a.audits.plastics.rows).toHaveLength(7);expect(a.audits.laths.facets).toHaveLength(7);expect(a.audits.metal.counts).toMatchObject({bosses:1,sparPairs:6,sparHooks:12,jacks});expect(a.audits.metal.metalRows.find(r=>r.key==='jack_rafter_hooks').qty).toBe(jacks);expect(a.audits.metal.metalRows.find(r=>r.key==='jack_rafter_brackets').qty).toBe(jacks);
  expect(a.sections.tiles.lines.find(r=>r.sourceKey==='universal').qty).toBe(1);expect(a.sections.tiles.lines.some(r=>r.sourceKey==='fiveWay')).toBe(false);expect(a.sections.tiles.lines.find(r=>r.sourceKey==='hipEndCaps').qty).toBe(6);expect(a.sections.gutters.lines.find(r=>r.sourceKey==='g_corner_135').qty).toBe(6);expect(a.audits.plastics.plasticLines.find(r=>r.key==='fascia_corners').qty).toBe(6);
  expect(new Set(a.lines.map(r=>r.key)).size).toBe(a.lines.length);expect(a.knownCost).toBeGreaterThan(0);
 }
});
test('confirmed135degree stock fittings and Universal Adaptor use existing Materials rates',()=>{
 const a=model({}, {...materials,fascia_corner_135_300_white_price:2,gutter_square_corner_135_ext_price:3,britmet_universal_ridge_adaptor_price_each:20,britmet_hip_end_cap_135_price_each:4,britmet_5way_adaptor_price_each:999,britmet_7way_adaptor_price_each:999,fascia_corner_150_300_white_price:999,gutter_square_corner_150_ext_price:999});
 expect(a.audits.plastics.plasticLines.find(r=>r.key==='fascia_corners').cost).toBe(12);expect(a.audits.plastics.gutterLines.find(r=>r.key==='g_corner_135').cost).toBe(18);expect(a.audits.tiles.lines.find(r=>r.key==='universal').cost).toBe(20);expect(a.audits.tiles.lines.find(r=>r.key==='hipEndCaps').cost).toBe(24);
 expect(a.audits.metal.fixings.tileScrews).toBe(a.audits.tiles.mainTiles*3+(a.audits.tiles.ridgeTiles+a.audits.tiles.hipTiles)*4+6*2+5);
 expect(a.supplyReviews.some(r=>r.includes('junction'))).toBe(false);expect(a.audits.plastics.gutterLines.find(r=>r.key==='g_corner_135').label.includes('factory')).toBe(true);
});
test('missing existing Universal Adaptor rate remains unconfigured, explicit zero is accepted',()=>{
 const a=model({}, {...materials,britmet_universal_ridge_adaptor_price_each:undefined});expect(a.audits.tiles.lines.find(r=>r.key==='universal').cost).toBeNull();expect(a.costComplete).toBe(false);
 const b=model({}, {...materials,britmet_universal_ridge_adaptor_price_each:0});expect(b.audits.tiles.lines.find(r=>r.key==='universal').cost).toBe(0);
});
test('five-facet insulation surface offsets leave the rear house-wall edge fixed',()=>{
 const g=buildVictorianFiveGeometry({inputs:base}),a=buildVictorianSurfaceAreas({geometry:g,eavesExtensionMM:275});expect(a.valid).toBe(true);expect(a.domain[0].y).toBeCloseTo(0,7);expect(a.domain[a.domain.length-1].y).toBeCloseTo(0,7);expect(a.partitionPlanAreaM2).toBeCloseTo(a.planAreaM2,7);
});
test('all seven ringbeams have correct house ends, mitres, slots and upstands',()=>{
 const a=model({widthMM:3800,projMM:4200});expect(a.valid).toBe(true);const beams=a.audits.timber.ringBeams;expect(beams[0].startMitreDeg).toBe(0);expect(beams[0].endMitreDeg).toBe(15);expect(beams[6].startMitreDeg).toBe(15);expect(beams[6].endMitreDeg).toBe(0);beams.slice(1,6).forEach(b=>{expect(b.startMitreDeg).toBe(15);expect(b.endMitreDeg).toBe(15);expect(b.upstands).toHaveLength(2);});expect(beams[6].upstands).toHaveLength(beams[0].upstands.length);
});
test('larger five-facet jack layouts and tighter soffits propagate finite material quantities',()=>{
 for(const widthMM of [3150,3800,4800,6000])for(const soffitMM of [50,150]){
  const a=model({widthMM,projMM:widthMM+1000,soffitMM,soffitMode:soffitMM===150?'standard':'specified'});expect(a.valid).toBe(true);expect(a.audits.timber.componentCounts.ringBeams).toBe(7);expect(a.audits.laths.facets).toHaveLength(7);
  a.lines.forEach(r=>{if(r.qty!=null)expect(Number.isFinite(r.qty)).toBe(true);});expect(a.audits.insulation.pir100.netAreaM2).toBeGreaterThan(0);
 }
});
