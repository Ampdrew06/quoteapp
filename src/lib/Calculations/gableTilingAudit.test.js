import {buildGableGeometry} from '../geometry/gableGeometry';
import {buildGableTilingAudit} from './gableTilingAudit';
const geometry=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25}});
const build=(productId='britmetShingle',materials={})=>buildGableTilingAudit({geometry,productId,materials});
test('steel ridge uses paired laths, pooled vents and one front cap',()=>{
 const a=build();expect(a.valid).toBe(true);expect(a.ridgeMM).toBe(4325);expect(a.ridgeLathM).toBe(8.65);expect(a.ridgeTiles).toBe(4);
 expect(a.lines.find(l=>l.key==='vents').quantity).toBe(18);expect(a.lines.find(l=>l.key==='endCap').quantity).toBe(1);expect(a.sequence.staggerComplete).toBe(true);expect(a.mainTiles).toBe(a.sequence.staggerTiles+2);
 expect(build('metrotileShingle').ridgeTiles).toBe(4);
});
test('LiteSlate uses 5.5 ridges per metre and shared surplus polycarbonate strips',()=>{
 const a=build('liteSlate');expect(a.valid).toBe(true);expect(a.ridgeTiles).toBe(24);expect(a.ridgeLathM).toBe(0);expect(a.lines.filter(l=>l.key==='endCap')).toHaveLength(0);
 expect(a.lines.find(l=>l.key==='polycarbonate')).toMatchObject({quantity:3,cost:0});expect(a.lines.find(l=>l.key==='verge').quantity).toBeGreaterThan(0);
});
test('perimeter laths are counted once and ridge support is pooled for stock rounding',()=>{
 const a=build();expect(a.chamferM).toBeCloseTo(8.65,8);expect(a.lathM).toBeCloseTo(a.fieldLathM+8.65,8);expect(a.lathStockLengths).toBe(Math.ceil(a.lathM/4.8));
});
test('unequal eaves use distinct tile slopes including the 50mm starter extension',()=>{
 const g=buildGableGeometry({inputs:{widthMM:3800,projMM:4100,pitchDeg:25,leftSoffitMM:100,rightSoffitMM:150}});
 const a=buildGableTilingAudit({geometry:g});expect(a.valid).toBe(true);expect(a.facets[0].heightMM).toBeLessThan(a.facets[1].heightMM);
 expect(a.facets[0].heightMM).toBeCloseTo(g.feet[0].externalSlopeMM+50/Math.cos(25*Math.PI/180),8);
});
test('configured zero rates remain zero and absent accessory prices remain unconfigured',()=>{
 const a=build('britmetShingle',{britmet_vent_strip_price_each:0});expect(a.lines.find(l=>l.key==='vents').cost).toBe(0);expect(a.lines.find(l=>l.key==='endCap').cost).toBeNull();
 expect(buildGableTilingAudit({}).valid).toBe(false);expect(build('tapcoSlate').valid).toBe(false);
});

test('Gable LiteSlate omits the additional ridge finishing course and lath',()=>{
 const a=build('liteSlate');expect(a.mainTiles).toBe(480);expect(a.fieldLathM).toBeCloseTo(138.4,8);expect(a.lathStockLengths).toBe(29);
 a.result.facets.forEach(f=>{expect(f.standardSlateQuantityRaw).toBe(225);expect(f.starterSlateQuantityRaw).toBe(15);expect(f.ridgeFinishingSlateQuantityRaw).toBe(0);expect(f.lathRows).toHaveLength(16);});
 expect(a.ridgeTiles).toBe(24);expect(build().mainTiles).toBe(74);
});
