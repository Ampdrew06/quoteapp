import {calculateWallplateAssemblyGeometry} from '../geometry/wallplateAssemblyGeometry';
import {calculateWallplateMitreGeometry} from '../geometry/wallplateMitreGeometry';
import {calculateHippedLeanToGeometry} from '../geometry/hippedLeanToGeometry';

// Share the complete established offset-hipped wallplate and eaves solve.
export function buildVictorianHippedWallplateSchedule({geometry:g,materials={}}={}) {
 const fail=errors=>({valid:false,errors,wallbars:[],horizontal:null});
 if(!g?.valid)return fail(g?.errors?.length?g.errors:['Valid Victorian Hipped geometry is required.']);
 const depth=220,floor=Number(materials.ring_beam_height_mm??40);
 if(!Number.isFinite(floor)||floor<0)return fail(['Valid ringbeam datum is required.']);
 const regular=calculateHippedLeanToGeometry({widthMM:g.widthMM,projectionMM:g.projectionMM,pitchDeg:g.pitchDeg,
  soffitDepthMM:g.soffitMM,leftHipWidthMM:g.bossInsetMM,rightHipWidthMM:g.bossInsetMM,
  materials:{...materials,wallplate_height_mm:depth,side_frame_thickness_mm:g.frameMM},bossArrangement:'offset',hippedSides:'both'});
 const joint=regular.leftBossGeometry;
 let assembly=regular.wallplateAssembly;
 if(g.soffitMode==='specified'&&g.eaves?.valid){
  const e=g.eaves.rows[0],angle=joint.pitchDeg*Math.PI/180;
  const foot={pitchDeg:joint.pitchDeg,horizontalFootCutMM:e.horizontalFootCutMM,verticalFootCutMM:e.verticalFootCutMM,externalSlopeMM:(joint.topPositionMM+e.horizontalFootCutMM)/Math.cos(angle)};
  assembly=calculateWallplateAssemblyGeometry({internalWidthMM:g.widthMM,memberDepthMM:depth,ringBeamHeightMM:floor,externalWallplateHeightMM:floor+g.riseMM+depth,left:foot,right:foot});
 }
 const mitre=calculateWallplateMitreGeometry({sidePitchDeg:regular.leftSidePitchDeg,memberDepthMM:depth,
  wallbarExternalSlopeMM:assembly?.left?.externalSlopeMM,wallbarHorizontalFootCutMM:Math.abs((assembly?.left?.externalFoot.xMM??0)-(assembly?.left?.internalFoot.xMM??0)),
  wallbarVerticalFootCutMM:assembly?.left?.externalFoot.yMM-floor});
 if(!assembly?.valid||!joint?.valid)return fail(['The regular hipped lean-to wallplate rules cannot resolve this assembly.']);
 const pitch=joint.pitchDeg,externalSlope=assembly.left.externalSlopeMM;
 const wallbars=['left','right'].map((side,i)=>{
  const a=assembly[side],mirror=side==='right';
  const local=p=>({xMM:mirror?g.widthMM-p.xMM:p.xMM,yMM:p.yMM-floor});
  const outsideBottom={xMM:a.externalFoot.xMM,yMM:floor};
  const points=[a.internalFoot,a.C,a.A,a.externalFoot,outsideBottom].map(local).map(p=>({...p,xMM:-p.xMM}));
  return {ref:i?'WB2':'WB1',side,pitchDeg:pitch,topCutOffSquareDeg:mitre.wallbarTopCutOffSquareDeg,topCutLengthMM:mitre.cutFaceLengthMM,topEdgeMM:a.externalSlopeMM,bottomEdgeMM:a.internalSlopeMM,horizontalFootCutMM:Math.abs(a.externalFoot.xMM-a.internalFoot.xMM),verticalFootCutMM:a.externalFoot.yMM-floor,points};
 });
 const h=assembly.horizontal;
 const horizontal={ref:'WP1',quantity:1,topEdgeMM:assembly.externalLengthMM,bottomEdgeMM:assembly.internalLengthMM,depthMM:depth,leftCutOffSquareDeg:mitre.horizontalWallplateCutOffSquareDeg,rightCutOffSquareDeg:mitre.horizontalWallplateCutOffSquareDeg,cutFaceLengthMM:mitre.cutFaceLengthMM,points:[h.topLeft,h.topRight,h.bottomRight,h.bottomLeft].map(p=>({xMM:p.xMM-h.topLeft.xMM,yMM:p.yMM-assembly.bottomHeightMM}))};
 const planSidePitchDeg=g.facets[0].pitchDeg,pitchDifferenceDeg=pitch-planSidePitchDeg;
 return {valid:true,errors:[],reviewRequired:true,requiresDatumReconciliation:false,wallplateRuleSource:'hippedLeanToGeometry',assembly,joint,mitre,wallbars,horizontal,planBossDistanceMM:g.horizontalWallplateMM,planSidePitchDeg,assemblySidePitchDeg:pitch,pitchDifferenceDeg,
  totals:{wallbars:2,horizontalMembers:1,joistLengthM:(2*externalSlope+Math.max(horizontal.topEdgeMM,horizontal.bottomEdgeMM))/1000},
  datumNote:'Uses the same offset hipped lean-to wallplate, matched-eaves and equal-depth mitre calculation. B is the physical boss centre; A and C are the cut endpoints. The simple plan slope is a layout reference, not the finished wallbar cutting pitch. Victorian hip and rafter profiles remain provisional and are not recalculated by this wallplate schedule.'};
}
