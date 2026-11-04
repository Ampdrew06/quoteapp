import {fullCornerHipCoveringAllowance} from './fullCornerHipCoveringAllowance';
import {buildRoofPlaneCoveringGeometry} from './roofPlaneCoveringGeometry';

// Covering-only adapter. Timber profiles retain their established machining
// datums; roof planes use the exact internal boss centres and design rise.
export function buildHippedRoofPlaneCovering({geometry:g,tileOverhangMM=50}={}){
 if(!g?.hasLeftHip||!g?.hasRightHip)return null;
 const w=g.widthMM,p=g.projectionMM,rise=g.designRiseMM,overhang=Number(tileOverhangMM);
 const left=g.resolvedLeftHipWidthMM,right=g.resolvedRightHipWidthMM;
 const pt=(xMM,yMM)=>({xMM,yMM}),internalOutline=[pt(0,0),pt(0,p),pt(w,p),pt(w,0)];
 if(![w,p,rise,left,right,overhang].every(Number.isFinite)||Math.min(w,p,rise,left,right)<=0||overhang<0)return {valid:false,errors:['Valid double-hipped dimensions, boss positions and tile overhang are required.']};
 const sides=[g.leftFacet,g.frontFacet,g.rightFacet];
 const facets=sides.map((f,i)=>({id:f.id,label:f.label,start:internalOutline[i],end:internalOutline[i+1],internalLengthMM:i===1?w:p,pitchDeg:i===1?g.frontPitchDeg:Math.atan2(rise,i===0?left:right)*180/Math.PI}));
 const offsetsMM=[...sides.map(f=>Number(f.ringBeam.baseWidthMM)+overhang),0];
 const surface=buildRoofPlaneCoveringGeometry({internalOutline,facets,offsetsMM});
 if(!surface.valid)return surface;
 const hipRuns=[{side:'left',start:pt(left,0),end:pt(0,p)},{side:'right',start:pt(w-right,0),end:pt(w,p)}].map(hip=>{
  const dx=hip.end.xMM-hip.start.xMM,dy=hip.end.yMM-hip.start.yMM,t=Math.min(...surface.lines.map(l=>{const advance=l.nx*dx+l.ny*dy;return advance>1e-8?(l.c-l.nx*hip.start.xMM-l.ny*hip.start.yMM)/advance:Infinity;}));
  return {side:hip.side,...fullCornerHipCoveringAllowance({hip,facets,internalOutline,externalOutline:surface.domain,centreLineLengthMM:Math.hypot(dx,dy,rise)*t})};
 });
 if(hipRuns.some(r=>!Number.isFinite(r.lengthMM)||r.lengthMM<=0))return {valid:false,errors:['The full outside hip covering allowance could not be resolved.']};
 return {...surface,hipRuns,method:'roofPlanePolygons',internalOutline,offsetsMM,
  notes:['Covering uses exact boss-centre roof-plane pitches and manufactured ply-base edges plus the tile overhang. Small strips at unequal soffit junctions remain part of the polygon. Timber machining pitches and cut lists are unchanged.']};
}
