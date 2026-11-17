import {calculateJackHipSetback,calculateSparHookEnd} from '../geometry/hipPerimeterIntersection';
import {calculateHipManufactureGeometryV2} from '../geometry/hipManufactureGeometryV2';
import {EDWARDIAN_BOSS_LOWER_GAP_MM,EDWARDIAN_TERMINAL_TRUSS_ASSEMBLY_MM} from '../Calculations/edwardianMemberAudit';

// Compare timber endpoints without changing the roof outline, take-off or cut list.
export function buildDoubleEdwardianMemberReview(geometry, members) {
 const half=Math.min(geometry.widthMM,geometry.projectionMM)/2;
 const pitch=geometry.pitchDeg;
 const cos=Math.cos(pitch*Math.PI/180);
 const hip=calculateHipManufactureGeometryV2({hipWidthMM:half,effectivePitchRunMM:half,frontPitchDeg:pitch});
 const hipCos=Math.cos(hip.hipPitchDeg*Math.PI/180);
 const jack=calculateJackHipSetback({hipWidthRunMM:half,hipProjectionRunMM:half});
 const boss=calculateSparHookEnd({pitchDeg:pitch});
 return members.map(member=>{
  const {id,kind,lengthMM,rearSupport}=member;
  const valleyHip=kind==='Hip'&&rearSupport;
  const lowerEnd=valleyHip?'Valley plate long point':rearSupport?'Valley plate face':'Open eaves';
  let adjustmentMM=0;
  let basis='Truss apex';
  if(kind==='Jack rafter'){
   adjustmentMM=jack.hipCentrelineSetbackMM/cos;
   basis='Square end at hip bracket';
  }else if(kind==='Hip'||kind==='Boss rafter'){
   if(!geometry.layout.ridge)return {id,kind,lowerEnd,lengthMM,basis:'Apex connection pending'};
   if(kind==='Hip'){
    adjustmentMM=hip.bossAllowancePlanMM/hipCos-hip.sparHookExternalEdgeAdjustmentMM;
    basis='Regular Edwardian hip connection';
   }else{
    const bossSetback=EDWARDIAN_BOSS_LOWER_GAP_MM+EDWARDIAN_TERMINAL_TRUSS_ASSEMBLY_MM/2-33;
    adjustmentMM=bossSetback/cos-boss.externalEdgeAdjustmentMM;
    basis='Regular Edwardian boss connection';
   }
  }
  // At the 45° plan intersection, the long point adds half the 45 mm
  // timber width along the hip in plan. Convert using the true hip pitch.
  const longPointMM=valleyHip?22.5/hipCos:0;
  const candidate=lengthMM-adjustmentMM+longPointMM;
  return {id,kind,lowerEnd,lengthMM,reviewLengthMM:candidate>0?candidate:undefined,basis:candidate>0?basis:'Check connection clearance'};
 });
}
