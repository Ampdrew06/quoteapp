import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildEdwardianTilingAudit} from './edwardianTilingAudit';
import {buildEdwardianInternalLathAudit} from './edwardianInternalLathAudit';
import {buildEdwardianMemberAudit} from './edwardianMemberAudit';
const inputs={widthMM:3560,projMM:3550,pitchDeg:25},g=buildEdwardianGeometry({inputs});
test('Edwardian hip covering follows full external length rather than shortened timber',()=>{
 const a=buildEdwardianTilingAudit({geometry:g});expect(a.valid).toBe(true);expect(a.ridgeMM).toBe(1770);expect(a.edges[1].lengthMM).toBeGreaterThan(2970);expect(a.edges[1].lengthMM).toBeLessThan(2990);
 const timber=buildEdwardianMemberAudit({geometry:g}).members.find(m=>m.type==='hip').profile.externalSlopeLengthMM;expect(a.edges[1].lengthMM-timber).toBeGreaterThan(150);expect(a.ridgeTiles).toBe(2);expect(a.hipTiles).toBe(6);
});
test('both coverings supply two 90 degree hip caps and one Y adaptor, without Gable end cap',()=>{for(const productId of ['britmetShingle','metrotileShingle','liteSlate']){const a=buildEdwardianTilingAudit({geometry:g,productId});expect(a.valid).toBe(true);expect(a.lines.find(l=>l.key==='hipEndCaps').quantity).toBe(2);expect(a.lines.find(l=>l.key==='yAdaptor').quantity).toBe(1);expect(a.lines.some(l=>l.key==='endCap'||l.key==='verge')).toBe(false);}});
test('steel ridge uses vents and hip-only tape; slate uses surplus polycarbonate',()=>{
 const steel=buildEdwardianTilingAudit({geometry:g}),slate=buildEdwardianTilingAudit({geometry:g,productId:'liteSlate'});
 expect(steel.lines.find(l=>l.key==='vents').quantity).toBe(8);expect(steel.support.quantities.ridgeLathM).toBe(3.54);expect(steel.support.rows.find(r=>r.kind==='ridge').tapeLengthM).toBe(0);
 expect(slate.lines.find(l=>l.key==='polycarbonate').quantity).toBe(2);expect(slate.lines.find(l=>l.key==='polycarbonate').cost).toBe(0);expect(slate.support.quantities.additionalLathM).toBe(0);expect(slate.ridgeTiles).toBe(10);expect(slate.hipTiles).toBe(34);
});
test('steel order adds two extra tiles once and all three eaves get field perimeter laths',()=>{const a=buildEdwardianTilingAudit({geometry:g});expect(a.valid).toBe(true);expect(a.sequence.staggerComplete).toBe(true);expect(a.result.orderAllowanceTiles).toBe(2);expect(a.result.facets).toHaveLength(3);expect(a.chamferM).toBeGreaterThan(11);expect(a.externalLathM).toBeCloseTo(a.fieldLathM+a.support.quantities.additionalLathM,8);});
test('internal laths include two flat runs and rows clipped at actual hip boundaries',()=>{const a=buildEdwardianInternalLathAudit({geometry:g});expect(a.valid).toBe(true);expect(a.flatRows).toBe(2);expect(a.rows.filter(r=>r.surface==='flat').map(r=>r.lengthMM)).toEqual([2067.5,2067.5]);expect(a.rows.find(r=>r.surface==='left').lengthMM).toBe(3550);expect(a.totalLengthM).toBeGreaterThan(40);});
test('invalid geometry and missing accessory prices remain explicit',()=>{expect(buildEdwardianTilingAudit({geometry:{valid:false}}).valid).toBe(false);const a=buildEdwardianTilingAudit({geometry:g});expect(a.lines.find(l=>l.key==='yAdaptor').cost).toBeNull();expect(buildEdwardianInternalLathAudit({geometry:g,maximumSpacingMM:0}).valid).toBe(false);});
