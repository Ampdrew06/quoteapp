import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianRingBeamProfiles} from './victorianRingBeamProfiles';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
test('five Victorian ply profiles match the resolved polygon edges exactly',()=>{
 for(const inputs of [base,{...base,soffitMM:150,soffitMode:'standard'},{...base,cornerAnglesDeg:[134,136,135,135]}]){
  const g=buildVictorianGeometry({inputs}),s=buildVictorianRingBeamProfiles(g);expect(s.valid).toBe(true);expect(s.beams).toHaveLength(5);
  s.beams.forEach((b,i)=>{expect(b.layers.ply9Base.externalEdgeLengthMM).toBeCloseTo(g.facets[i].externalLengthMM,6);expect(b.layers.ply9Base.internalEdgeLengthMM).toBeCloseTo(g.facets[i].internalLengthMM,6);});
 }
});
test('PSE and outer laths have their own aligned lengths and correct mitre angles',()=>{
 const g=buildVictorianGeometry({inputs:base}),s=buildVictorianRingBeamProfiles(g),b=s.beams[1],t=Math.tan(Math.PI/8),L=g.frontLengthMM;
 expect(b.layers.pse30x90.externalEdgeLengthMM).toBeCloseTo(L+190*t,6);
 expect(b.layers.outerLath25x50.internalEdgeLengthMM).toBeCloseTo(L+120*t,6);
 expect(b.layers.outerLath25x50.externalEdgeLengthMM).toBeCloseTo(L+220*t,6);
 expect(b.startMitreDeg).toBe(22.5);expect(s.beams[0].startMitreDeg).toBe(0);expect(s.beams[4].endMitreDeg).toBe(0);
});
test('profiles do not mutate geometry and fail for a base narrower than PSE',()=>{
 const g=buildVictorianGeometry({inputs:base}),before=JSON.stringify(g);buildVictorianRingBeamProfiles(g);expect(JSON.stringify(g)).toBe(before);
 expect(buildVictorianRingBeamProfiles({...g,plyBaseWidthMM:90}).valid).toBe(false);
});

test('upstands are 195mm high and clear widths allow for 48mm slots on both faces',()=>{
 const g=buildVictorianGeometry({inputs:base}),r=buildVictorianRingBeamProfiles(g);expect(r.valid).toBe(true);
 r.beams.forEach(b=>b.upstands.forEach((u,i)=>{expect(u.heightMM).toBe(195);expect(u.thicknessMM).toBe(9);expect(u.widthMM).toBeCloseTo(b.slots[i+1].left-b.slots[i].right,6);}));
 expect(r.beams[1].upstands[0].widthMM).toBeCloseTo(g.frontLengthMM/2-72,6);
 r.beams[0].upstands.forEach((u,i)=>expect(u.widthMM).toBeCloseTo([...r.beams[4].upstands].reverse()[i].widthMM,6));
});
