import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianTilingAudit} from './victorianTilingAudit';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
const materials={tile_britmet_price_each:6,tile_britmet_weight_kg:2.19,britmet_ridge_tile_price_each:10,britmet_5way_adaptor_price_each:20,britmet_5way_adaptor_weight_kg:0.5,britmet_hip_end_cap_135_price_each:5,britmet_vent_strip_price_each:1,vent_strip_weight_kg:0.1,expanding_foam_roll_price_each:8,expanding_foam_roll_weight_kg_each:0.2,touchup_kit_britmet_price_each:10,tile_starter_price_each:12,tile_starter_weight_kg_each:2.7};
const geometry=patch=>buildVictorianGeometry({inputs:{...base,...patch}}),build=(productId='britmetShingle',patch={},m=materials)=>buildVictorianTilingAudit({geometry:geometry(patch),materials:m,productId});
test('reference Victorian steel roof uses independent oriented stagger sequences plus two roof spares',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.mainTiles).toBe(54);expect(a.extraTiles).toBe(2);expect(a.sequence.facets.map(f=>f.stagger.newTiles)).toEqual([17,6,6,6,17]);expect(new Set(a.result.facets.map(f=>f.facet.id)).size).toBe(5);expect(a.sequence.facets.map(f=>f.id)).toEqual(['facet-left-side','facet-front','facet-front','facet-front','facet-right-side']);expect(a.lines.find(l=>l.key==='main').cost).toBe(54*6);
});
test('four full hips and ridge require ten caps with correct Victorian junction end caps ventilation and starter',()=>{
 const a=build(),line=key=>a.lines.find(l=>l.key===key);expect(a.ridgeTiles).toBe(2);expect(a.hipTiles).toBe(8);expect(line('fiveWay').quantity).toBe(1);expect(line('hipEndCaps').quantity).toBe(4);expect(line('vents').quantity).toBe(8);expect(line('hipTape').quantity).toBe(4);expect(a.starterQty).toBe(4);expect(a.starterUsedM).toBeCloseTo(9.802557549166476,8);expect(a.lines.some(l=>['yAdaptor','fieldLaths','supportLaths'].includes(l.key))).toBe(false);expect(a.costComplete).toBe(true);expect(a.weightComplete).toBe(true);
});
test('covering lengths do not inherit timber-end allowance or stock waste',()=>{
 const a=build(),b=build('britmetShingle',{bossTopContinuationMM:175});expect(a.mainTiles).toBe(b.mainTiles);a.edges.forEach((e,i)=>expect(e.lengthMM).toBeCloseTo(b.edges[i].lengthMM,8));expect(a.edges[1].lengthMM).toBeCloseTo(2128.48858,4);expect(a.lines.find(l=>l.key==='main').installedWeightKg).toBeCloseTo(a.roofAreaM2*3.2*2.19,8);expect(a.lines.find(l=>l.key==='starter').installedWeightKg).toBeCloseTo(a.starterUsedM/3*2.7,8);expect(a.lines.find(l=>l.key==='hipEndCaps').installedWeightKg).toBeCloseTo(0.8,8);
});
test('slate retains shared course rules and135deg caps but requires its own junction fitting',()=>{
 const a=build('liteSlate',{}, {liteslate_tile_price_each:2,liteslate_tile_weight_kg_each:0.575,liteslate_ridge_tile_price_each:3,liteslate_hip_end_cap_135_price:4});expect(a.valid).toBe(true);expect(a.ridgeTiles).toBe(11);expect(a.hipTiles).toBe(48);expect(a.lines.find(l=>l.key==='hipEndCaps').cost).toBe(16);expect(a.lines.find(l=>l.key==='slateJunction').quantity).toBe(1);expect(a.costComplete).toBe(false);expect(a.supplyReviews.length).toBeGreaterThan(0);expect(a.lines.some(l=>l.key==='hipTape')).toBe(false);expect(a.lines.find(l=>l.key==='polycarbonate').quantity).toBe(2);
});
test('Metrotile and Tapco cannot silently borrow other product prices or edge coverage',()=>{
 const m=build('metrotileShingle');expect(m.mainTiles).toBe(54);expect(m.lines.find(l=>l.key==='main').cost).toBeNull();expect(m.costComplete).toBe(false);
 const t=build('tapcoSlate');expect(t.valid).toBe(true);expect(t.ridgeTiles).toBeNull();expect(t.hipTiles).toBeNull();expect(t.lines.find(l=>l.key==='main').cost).toBeNull();
});
test('missing rates remain visible, zero values are preserved and invalid designs fail',()=>{
 const a=build('britmetShingle',{},{});expect(a.lines.find(l=>l.key==='main').cost).toBeNull();expect(a.costComplete).toBe(false);expect(a.weightComplete).toBe(false);
 const z=build('britmetShingle',{}, {...materials,tile_britmet_price_each:0});expect(z.lines.find(l=>l.key==='main').cost).toBe(0);
 expect(build('unknown').valid).toBe(false);expect(build('britmetShingle',{widthMM:0}).valid).toBe(false);expect(build('britmetShingle',{}, {...materials,eaves_guard_piece_cover_mm:0}).valid).toBe(false);
});
test('audit preserves source geometry and material settings',()=>{
 const g=geometry(),before=JSON.stringify(g),rates=JSON.stringify(materials);buildVictorianTilingAudit({geometry:g,materials});expect(JSON.stringify(g)).toBe(before);expect(JSON.stringify(materials)).toBe(rates);
});
