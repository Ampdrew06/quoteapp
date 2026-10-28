import {buildVictorianHippedGeometry,victorianHippedDefaults as inputs} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedRingBeamProfiles as build} from './victorianHippedRingBeamProfiles';

const geometry=patch=>buildVictorianHippedGeometry({inputs:{...inputs,...patch}});
test('five ringbeam profiles match external ply geometry and partition each internal run',()=>{
 const g=geometry(),r=build({geometry:g,inputs:{...inputs,ringbeamJointMethod:'calculated'}});
 expect(r.valid).toBe(true);expect(r.beams).toHaveLength(5);expect(r.upstandHeightMM).toBe(195);
 r.beams.forEach((b,i)=>{
  expect(b.layers.ply9Base.widthMM).toBeCloseTo(g.facets[i].plyBaseWidthMM,7);expect(b.layers.pse30x90.widthMM).toBe(95);
  expect(b.layers.outerLath25x50.widthMM).toBe(50);
  expect(b.layers.ply9Base.externalEdgeLengthMM).toBeCloseTo(g.facets[i].externalLengthMM,6);
  expect(b.slots.reduce((sum,s)=>sum+s.widthMM,0)+b.upstands.reduce((sum,u)=>sum+u.widthMM,0)).toBeCloseTo(b.internalLengthMM,6);
 });
});
test('skew boss-rafter openings project the 48mm slot allowance along the beam',()=>{
 const r=build({geometry:geometry(),inputs});
 const fan=r.beams[1].slots.find(s=>s.kind==='boss-rafter');
 expect(fan.widthMM).toBeGreaterThan(48);expect(fan.skewDeg).toBeGreaterThan(0);
 expect(fan.widthMM*Math.cos(fan.skewDeg*Math.PI/180)).toBeCloseTo(48,7);
 r.beams[2].slots.forEach(s=>expect(s.widthMM).toBeCloseTo(48,7));
});
test('a specified 50mm envelope uses a 110mm front base and 210mm vertical upstands',()=>{
 const patch={soffitMode:'specified',soffitMM:50},r=build({geometry:geometry(patch),inputs:{...inputs,...patch}});
 expect(r.valid).toBe(true);expect(r.upstandArrangement).toBe('vertical');expect(r.upstandHeightMM).toBe(210);
 expect(r.beams[2].layers.ply9Base.widthMM).toBe(110);
 expect(build({geometry:geometry(),inputs:{upstandArrangement:'vertical'}}).upstandHeightMM).toBe(210);
 expect(build({geometry:geometry(),inputs:{upstandArrangement:'invalid'}}).valid).toBe(false);
});
test('projected slot collisions are rejected even when nominal centres clear 48mm',()=>{
 const base=geometry(),p=base.rafterLayout.facets[1].positionsMM[0];
 const changed=geometry({victorianHippedFacetPositionsMM:{F2:[p,p+48.1]}});
 expect(changed.valid).toBe(true);expect(build({geometry:changed,inputs}).valid).toBe(false);
});
test('manual positions feed actual slot centres and change clear upstand cuts',()=>{
 const base=build({geometry:geometry(),inputs}),g=geometry({victorianHippedFacetPositionsMM:{F2:[400,1000],F5:[900,1600]}}),r=build({geometry:g,inputs});
 expect(r.valid).toBe(true);expect(r.beams[1].slots.filter(s=>s.nominalWidthMM).map(s=>s.centreMM)).toEqual([400,1000]);
 expect(r.beams[1].upstands.length).toBe(3);
 expect(r.beams[4].slots.filter(s=>s.nominalWidthMM)[1].centreMM).toBeCloseTo(g.facets[4].internalLengthMM-900,7);
 expect(r.totals.upstands).toBeGreaterThan(base.totals.upstands);
});
