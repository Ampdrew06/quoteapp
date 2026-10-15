import {buildEdwardianGeometry} from '../geometry/edwardianGeometry';
import {buildCentralBossTrussAudit} from '../geometry/centralBossTrussAudit';
// Shared Edwardian truss construction; Victorian layout controls quantities only.
export function buildVictorianTrussSchedule({geometry:g,materials={}}={}) {
 if(!g?.valid)return {valid:false,errors:['Valid Victorian plan required.']};
 const e=buildEdwardianGeometry({inputs:{widthMM:g.widthMM,projMM:g.projectionMM,pitchDeg:g.pitchDeg,frameThicknessMM:g.frameMM,soffitMM:g.soffitMM,ridgeMode:'automatic',sideSoffitMode:g.soffitMode==='specified'?'specified':'automatic',specifiedSideSoffitMM:g.soffitMM},materials});
 if(!e.valid)return {valid:false,errors:e.errors};
 const truss=buildCentralBossTrussAudit({widthMM:g.widthMM,projectionMM:g.projectionMM,frontPitchDeg:e.frontPitchDeg,trussPitchDeg:g.pitchDeg,memberDepthMM:220,flangeWidthMM:45,ringBeamHeightMM:Number(materials.ring_beam_height_mm??40),sideHfcMM:e.eaves.left.geometry.raw.manufacturedHorizontalFootCutMM,gussetWidthMM:595});
 if(!truss.valid)return {valid:false,errors:truss.errors};
 const n=g.layout.trussCount;
 return {valid:true,errors:[],geometry:g,truss,counts:{trusses:n,chevrons:n*2,gussets:n*2,closures:n}};
}
