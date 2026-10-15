import {buildVictorianGeometry} from '../geometry/victorianGeometry';
import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildCentralBossTrussAudit} from '../geometry/centralBossTrussAudit';
import {buildVictorianTrussSchedule} from './victorianTrussSchedule';
test('Victorian truss components exactly reuse Edwardian construction across sizes pitches and soffit modes',()=>{
 for(const patch of [{},{widthMM:4500,projMM:5000,pitchDeg:15},{soffitMM:150,soffitMode:'standard'},{pitchDeg:30}]){
 const inputs={widthMM:3392,projMM:3605,pitchDeg:25,frameThicknessMM:70,soffitMM:50,soffitMode:'specified',...patch};
 const g=buildVictorianGeometry({inputs}),s=buildVictorianTrussSchedule({geometry:g});expect(s.valid).toBe(true);
 const e=buildEdwardianGeometry({inputs:{...inputs,sideSoffitMode:inputs.soffitMode==='specified'?'specified':'automatic',specifiedSideSoffitMM:inputs.soffitMM}});
 const t=buildCentralBossTrussAudit({widthMM:g.widthMM,projectionMM:g.projectionMM,frontPitchDeg:e.frontPitchDeg,trussPitchDeg:g.pitchDeg,memberDepthMM:220,flangeWidthMM:45,ringBeamHeightMM:40,sideHfcMM:e.eaves.left.geometry.raw.manufacturedHorizontalFootCutMM,gussetWidthMM:595});
 expect(s.truss).toEqual(t);expect(s.counts.trusses).toBe(g.layout.centresMM.length);expect(s.counts.chevrons).toBe(g.layout.trussCount*2);expect(s.counts.gussets).toBe(g.layout.trussCount*2);expect(s.counts.closures).toBe(g.layout.trussCount);
 }
});
test('invalid Victorian plan does not produce truss cutting diagrams',()=>{expect(buildVictorianTrussSchedule({geometry:{valid:false}}).valid).toBe(false);});
