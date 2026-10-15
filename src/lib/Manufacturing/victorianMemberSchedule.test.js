import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildVictorianMemberSchedule} from './victorianMemberSchedule';
const base={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified'};
const make=patch=>buildVictorianMemberSchedule({geometry:buildVictorianGeometry({inputs:{...base,...patch}})});
test('Leah hips and intermediates use the agreed top-edge allowance and retain equal mirrored profiles',()=>{
 const s=make();expect(s.valid).toBe(true);expect(s.members).toHaveLength(7);expect(s.groups).toHaveLength(2);
 const hips=s.members.filter(m=>m.type==='Hip'),rafters=s.members.filter(m=>m.type!=='Hip');
 hips.forEach(m=>{expect(m.topEdgeMM).toBeCloseTo(1968.48858,4);expect(m.bottomEdgeMM).toBeCloseTo(1862.14275,3);expect(m.topCutLengthMM).toBeCloseTo(231.32169,4);});
 rafters.forEach(m=>{expect(m.topEdgeMM).toBeCloseTo(1824.97688,4);expect(m.bottomEdgeMM).toBeGreaterThan(1734);expect(m.bottomEdgeMM).toBeLessThan(1750);});
});
test('profile polygons preserve 220mm depth, both edge lengths and actual hook end length',()=>{
 for(const patch of [{},{pitchDeg:15},{pitchDeg:30},{soffitMM:150,soffitMode:'standard'}]){
 const s=make(patch);expect(s.valid).toBe(true);
 s.members.forEach(m=>{const p=m.points,dist=(a,b)=>Math.hypot(a.xMM-b.xMM,a.yMM-b.yMM);expect(dist(p[1],p[2])).toBeCloseTo(m.topCutLengthMM,6);expect(dist(p[2],p[3])).toBeCloseTo(m.topEdgeMM,6);expect(dist(p[0],p[1])).toBeCloseTo(m.bottomEdgeMM,6);
 const pitch=m.pitchDeg*Math.PI/180;expect(p[2].xMM*Math.sin(pitch)+p[2].yMM*Math.cos(pitch)).toBeCloseTo(220,6);expect(m.topCutOffSquareDeg).toBeLessThanOrEqual(18);});
 }
});
test('allowance adjustments change each edge once, and not the roof footprint or truss setting out',()=>{
 const a=make(),b=make({bossTopContinuationMM:170});a.members.forEach((m,i)=>{expect(m.topEdgeMM-b.members[i].topEdgeMM).toBeCloseTo(10,6);expect(m.bottomEdgeMM-b.members[i].bottomEdgeMM).toBeCloseTo(10,6);});
 const g=buildVictorianGeometry({inputs:base}),h=buildVictorianGeometry({inputs:{...base,bossTopContinuationMM:170}});expect(g.externalOutline).toEqual(h.externalOutline);expect(g.layout).toEqual(h.layout);
});
test('invalid allowance and unreviewed adjusted angles do not produce cutting profiles',()=>{
 expect(make({bossTopContinuationMM:-1}).valid).toBe(false);expect(make({bossTopContinuationMM:99999}).valid).toBe(false);expect(make({cornerAnglesDeg:[134,136,135,135]}).valid).toBe(false);
});
