import {buildVictorianFiveGeometry as build} from './victorianFiveGeometry';
import {fiveFacetJackPositions} from './victorianSupportRules';
const geometry=patch=>build({inputs:{widthMM:3150,projMM:3300,pitchDeg:25,frameThicknessMM:70,soffitMM:150,...patch}});
test('3150 by3300 reference has seven planes, six hips, no intermediate or jack rafters',()=>{
 const g=geometry();expect(g.valid).toBe(true);expect(g.facets).toHaveLength(7);expect(g.hips).toHaveLength(6);expect(g.frontLengthMM).toBeCloseTo(844.039956,4);expect(g.facets[0].internalLengthMM).toBeCloseTo(2147.019978,4);expect(g.ridgeEndYMM).toBe(1725);expect(g.terminalTrussCentreMM).toBe(1692);expect(g.intermediateBars).toHaveLength(0);expect(g.jackRafters).toHaveLength(0);
 expect(g.cornerAnglesDeg).toEqual([150,150,150,150,150,150]);expect(g.mitresDeg).toEqual([15,15,15,15,15,15]);
});
test('3800 by4200 reference has five hip-connected front jacks and no extra boss members',()=>{
 const g=geometry({widthMM:3800,projMM:4200});expect(g.valid).toBe(true);expect(g.frontLengthMM).toBeCloseTo(1018.206931,4);expect(g.facets[0].internalLengthMM).toBeCloseTo(2809.103466,4);expect(g.ridgeEndYMM).toBe(2300);expect(g.intermediateBars).toHaveLength(0);expect(g.jackRafters).toHaveLength(5);
 for(const j of g.jackRafters){expect(j.positionMM).toBe(665);expect(Math.hypot(j.start.xMM-g.ridge.xMM,j.start.yMM-g.ridge.yMM)).toBeGreaterThan(1);expect(g.hips.some(h=>{const dx=h.end.xMM-h.start.xMM,dy=h.end.yMM-h.start.yMM,qx=j.start.xMM-h.start.xMM,qy=j.start.yMM-h.start.yMM;return Math.abs(dx*qy-dy*qx)<1e-5&&qx*dx+qy*dy>0&&qx*dx+qy*dy<dx*dx+dy*dy;})).toBe(true);}
});
test('regular five-facet roof planes retain equal pitch and equal front runs',()=>{
 const g=geometry({widthMM:3800,projMM:4200});g.facets.forEach(f=>expect(f.pitchDeg).toBeCloseTo(25,7));g.facets.slice(1,6).forEach(f=>expect(f.internalLengthMM).toBeCloseTo(g.frontLengthMM,7));expect(g.layout.centresMM.slice(0,3)).toEqual([31.5,697,1362]);
});
test('external ringbeam plan edges use the geometric150degree mitre offset',()=>{
 const g=geometry();expect(g.plyBaseWidthMM).toBe(225);expect(g.facets[0].externalLengthMM-g.facets[0].internalLengthMM).toBeCloseTo(225*Math.tan(Math.PI/12),7);g.facets.slice(1,6).forEach(f=>expect(f.externalLengthMM-f.internalLengthMM).toBeCloseTo(450*Math.tan(Math.PI/12),7));
 const tight=geometry({soffitMM:50,soffitMode:'specified'});expect(tight.plyBaseWidthMM).toBe(110);expect(tight.internalOutline).toEqual(g.internalOutline);expect(tight.externalWidthMM).toBeCloseTo(3370,7);
});
test('front jack bays never exceed850mm and never hit the boss centreline',()=>{
 for(const length of [850,850.01,1018.2069,1330,1515,1515.1,1610,1700,1700.1,2550,3400,5100]){
  const positions=fiveFacetJackPositions(length),all=[0,...positions,length];
  if(length<=850)expect(positions).toHaveLength(0);
  for(let i=1;i<all.length;i++)expect(all[i]-all[i-1]).toBeLessThanOrEqual(850+1e-6);
  for(const n of positions){expect(n).toBeGreaterThan(0);expect(n).toBeLessThan(length);expect(Math.abs(n-length/2)).toBeGreaterThan(1e-6);}
  const g=geometry({widthMM:length*(2+Math.sqrt(3)),projMM:length*4+3000});expect(g.valid).toBe(true);expect(g.intermediateBars).toHaveLength(0);expect(g.jackRafters.length).toBeGreaterThanOrEqual(positions.length*5);
 }
});
test('invalid five-facet inputs fail without returning malformed plans',()=>{
 for(const patch of [{widthMM:0},{projMM:1000},{pitchDeg:0},{cornerAnglesDeg:[135,135,135,135]},{cornerAnglesDeg:[150,150,150,150,150,151]}])expect(geometry(patch).valid).toBe(false);
});
