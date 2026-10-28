import {calculateWallplateAssemblyGeometry} from '../geometry/wallplateAssemblyGeometry';
import {calculateWallplateMitreGeometry} from '../geometry/wallplateMitreGeometry';
import {calculateHippedLeanToGeometry} from '../geometry/hippedLeanToGeometry';

// Reuse the regular offset-hipped assembly, including its single-ended case.
export function buildVictorianHippedWallplateSchedule({geometry:g,materials={}}={}) {
 const fail=errors=>({valid:false,errors,wallbars:[],horizontal:null});
 if(!g?.valid)return fail(g?.errors?.length?g.errors:['Valid Victorian Hipped geometry is required.']);
 const depth=220,floor=Number(materials.ring_beam_height_mm??40);
 if(!Number.isFinite(floor)||floor<0)return fail(['Valid ringbeam datum is required.']);
 const hasLeft=g.leftEndType!=='wall',hasRight=g.rightEndType!=='wall';
 const regular=calculateHippedLeanToGeometry({widthMM:g.widthMM,projectionMM:g.projectionMM,pitchDeg:g.pitchDeg,
  soffitDepthMM:g.soffitMM,leftHipWidthMM:g.bossInsetMM,rightHipWidthMM:g.bossInsetMM,
  materials:{...materials,wallplate_height_mm:depth,side_frame_thickness_mm:g.frameMM},bossArrangement:'offset',hippedSides:hasLeft?(hasRight?'both':'left'):(hasRight?'right':'none')});
 const joint=regular.leftBossGeometry||regular.rightBossGeometry||null;
 let assembly=regular.wallplateAssembly;
 if((g.soffitMode==='specified'||g.eaves?.sideSoffitControl)&&g.eaves?.valid){
  const footFor=(id,exists)=>{if(!exists)return null;const e=g.eaves.rows.find(row=>row.facetId===id),angle=joint.pitchDeg*Math.PI/180;
   return {pitchDeg:joint.pitchDeg,horizontalFootCutMM:e.horizontalFootCutMM,verticalFootCutMM:e.verticalFootCutMM,externalSlopeMM:(joint.topPositionMM+e.horizontalFootCutMM)/Math.cos(angle)};};
  assembly=calculateWallplateAssemblyGeometry({internalWidthMM:g.widthMM,memberDepthMM:depth,ringBeamHeightMM:floor,externalWallplateHeightMM:floor+g.riseMM+depth,left:footFor('F1',hasLeft),right:footFor('F5',hasRight)});
 }
 if(!assembly?.valid||((hasLeft||hasRight)&&!joint?.valid))return fail(['The regular hipped lean-to wallplate rules cannot resolve this assembly.']);
 const sides=['left','right'].filter(side=>assembly[side]);
 const mitres=Object.fromEntries(sides.map(side=>{const a=assembly[side];return [side,calculateWallplateMitreGeometry({sidePitchDeg:a.pitchDeg,memberDepthMM:depth,wallbarExternalSlopeMM:a.externalSlopeMM,wallbarHorizontalFootCutMM:Math.abs(a.externalFoot.xMM-a.internalFoot.xMM),wallbarVerticalFootCutMM:a.externalFoot.yMM-floor})];}));
 const mitre=mitres.left||mitres.right||calculateWallplateMitreGeometry({sidePitchDeg:0,memberDepthMM:depth});
 const wallbars=sides.map(side=>{
  const a=assembly[side],m=mitres[side],mirror=side==='right';
  const local=p=>({xMM:mirror?g.widthMM-p.xMM:p.xMM,yMM:p.yMM-floor});
  const points=[a.internalFoot,a.C,a.A,a.externalFoot,{xMM:a.externalFoot.xMM,yMM:floor}].map(local).map(p=>({...p,xMM:-p.xMM}));
  return {ref:mirror?'WB2':'WB1',side,pitchDeg:a.pitchDeg,topCutOffSquareDeg:m.wallbarTopCutOffSquareDeg,topCutLengthMM:m.cutFaceLengthMM,topEdgeMM:a.externalSlopeMM,bottomEdgeMM:a.internalSlopeMM,horizontalFootCutMM:Math.abs(a.externalFoot.xMM-a.internalFoot.xMM),verticalFootCutMM:a.externalFoot.yMM-floor,points};
 });
 const h=assembly.horizontal;
 const horizontal={ref:'WP1',quantity:1,topEdgeMM:assembly.externalLengthMM,bottomEdgeMM:assembly.internalLengthMM,depthMM:depth,leftCutOffSquareDeg:mitres.left?.horizontalWallplateCutOffSquareDeg??0,rightCutOffSquareDeg:mitres.right?.horizontalWallplateCutOffSquareDeg??0,cutFaceLengthMM:mitre.cutFaceLengthMM,points:[h.topLeft,h.topRight,h.bottomRight,h.bottomLeft].map(p=>({xMM:p.xMM-h.topLeft.xMM,yMM:p.yMM-assembly.bottomHeightMM}))};
 const pitch=joint?.pitchDeg??0,planSidePitchDeg=g.facets.find(f=>f.id==='F1'||f.id==='F5')?.pitchDeg??0;
 return {valid:true,errors:[],reviewRequired:true,requiresDatumReconciliation:false,wallplateRuleSource:'hippedLeanToGeometry',assembly,joint,mitre,mitres,wallbars,horizontal,planBossDistanceMM:g.horizontalWallplateMM,planSidePitchDeg,assemblySidePitchDeg:pitch,pitchDifferenceDeg:pitch-planSidePitchDeg,
  totals:{wallbars:wallbars.length,horizontalMembers:1,joistLengthM:(wallbars.reduce((sum,m)=>sum+m.topEdgeMM,0)+Math.max(horizontal.topEdgeMM,horizontal.bottomEdgeMM))/1000},
  datumNote:'Uses the regular offset hipped lean-to wallplate rules. A wall end has no sloping end wallbar or boss joint; WP1 ends square there. B is the physical boss centre; A and C are the joint endpoints. Wall-side rafters are listed with the roof members. Cutting profiles remain subject to factory comparison.'};
}
