import {buildVictorianHippedGeometry,victorianHippedDefaults} from '../geometry/victorianHippedGeometry';
import {buildVictorianHippedRingBeamProfiles as build} from './victorianHippedRingBeamProfiles';
import {buildVictorianHippedJointLayers} from './victorianHippedJointProfiles';
const inputs={...victorianHippedDefaults,requestedSidePitchDeg:25},geometry=buildVictorianHippedGeometry({inputs});
test('standard mitre with perimeter trim is the default and invalid methods are rejected',()=>{
 expect(build({geometry,inputs}).jointMethod).toBe('standard');
 expect(build({geometry,inputs:{ringbeamJointMethod:'unknown'}}).valid).toBe(false);
});
test('calculated joint angles are shared by every assembled layer',()=>{
 const r=build({geometry,inputs:{...inputs,ringbeamJointMethod:'calculated'}});expect(r.valid).toBe(true);
 r.beams.forEach(b=>Object.values(b.layers).forEach(p=>{
  expect(p.primaryStartMitreDeg).toBeCloseTo(b.layers.pse30x90.primaryStartMitreDeg,7);
  expect(p.primaryEndMitreDeg).toBeCloseTo(b.layers.pse30x90.primaryEndMitreDeg,7);
  expect(p.trims).toHaveLength(0);
 }));
});
test('the confirmed rectangular example produces two 77mm square trims',()=>{
 const g={externalOutline:[{xMM:-153,yMM:0},{xMM:-153,yMM:3115},{xMM:4203,yMM:3115},{xMM:4203,yMM:0}]};
 const facet={id:'front',start:{xMM:0,yMM:2885},end:{xMM:4050,yMM:2885},internalLengthMM:4050,plyBaseWidthMM:230,edgeIndex:1};
 const r=buildVictorianHippedJointLayers({geometry:g,facet,index:1,baseLayers:{pse30x90:{startMitreDeg:45,endMitreDeg:45}},method:'standard'});
 expect(r.ply9Base.externalEdgeLengthMM).toBeCloseTo(4356,7);expect(r.ply9Base.trims).toHaveLength(2);
 r.ply9Base.trims.forEach(t=>{expect(t.lengthMM).toBeCloseTo(77,7);expect(t.offSquareDeg).toBeCloseTo(0,7);});
});
test('switching methods retains the roof envelope and the rafter openings',()=>{
 const before=JSON.stringify(geometry),standard=build({geometry,inputs}),calculated=build({geometry,inputs:{ringbeamJointMethod:'calculated'}});
 expect(JSON.stringify(geometry)).toBe(before);
 expect(standard.beams.map(b=>b.slots)).toEqual(calculated.beams.map(b=>b.slots));
 expect(standard.beams.map(b=>b.upstands)).toEqual(calculated.beams.map(b=>b.upstands));
});
