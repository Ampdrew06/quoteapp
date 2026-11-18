import React from 'react';
import {withRoofFrameMaterials} from '../../lib/roofFrameThickness';
import {buildGableGeometry} from '../../lib/geometry/gableGeometry';
import {buildEdwardianGeometry} from '../../lib/geometry/edwardianGeometry';
import {buildVictorianGeometry} from '../../lib/geometry/victorianGeometry';
import {buildVictorianFiveGeometry} from '../../lib/geometry/victorianFiveGeometry';
import {buildVictorianHippedGeometry} from '../../lib/geometry/victorianHippedGeometry';
import {calculateHippedLeanToGeometry} from '../../lib/geometry/hippedLeanToGeometry';
import {buildCentralBossDesign} from '../../lib/geometry/centralBossDesign';
import {computeLeanToManufactureGeometry} from '../../lib/leanToManufactureGeometry';
import {GableCustomerPlan} from '../gable/GableQuoteResults';
import EdwardianCustomerPlan from '../edwardian/EdwardianCustomerPlan';
import VictorianCustomerPlan from '../victorian/VictorianCustomerPlan';
import VictorianHippedCustomerPlan from '../victorian-hipped/VictorianHippedCustomerPlan';
import PlanDiagramHippedLeanTo from '../../components/PlanDiagramHippedLeanTo';
import PlanDiagramLeanTo from '../../components/PlanDiagramLeanTo';

const builders={gable:[buildGableGeometry,GableCustomerPlan],edwardian:[buildEdwardianGeometry,EdwardianCustomerPlan],victorian:[buildVictorianGeometry,VictorianCustomerPlan],'victorian-five':[buildVictorianFiveGeometry,VictorianCustomerPlan],'victorian-hipped':[buildVictorianHippedGeometry,VictorianHippedCustomerPlan]};
export function documentPlan(family,inputs,materials) {
 if (builders[family]) {
  const [build,Plan]=builders[family];
  const geometry=build({inputs,materials});
  return {geometry, drawing:geometry.valid?<Plan geometry={geometry}/>:null};
 }
 if(family!=='lean-to')return {};
 const i=inputs,m=withRoofFrameMaterials(i,materials);
 const iw=Number(i.internalWidthMM??i.widthMM),ip=Number(i.internalProjectionMM??i.projMM),pitchDeg=Number(i.pitchDeg);
 if(!(iw>0&&ip>0&&pitchDeg>0))return {};
 const soffit=Number(i.eavesOverhangMM??i.soffit_mm??150);
 const leftWall=i.leftWall??i.left_exposed===false,rightWall=i.rightWall??i.right_exposed===false;
 const leftOH=Number(i.leftOverhangMM??0),rightOH=Number(i.rightOverhangMM??0);
 const common={iw,ip,pitchDeg,leftWall,rightWall,rafterSpacing:Number(m.rafter_spacing_mm??665),firstCentre:Number(m.rafter_first_center_mm??690)};
 const sft=m.side_frame_thickness_mm;
 if(i.roofStyle!=='hippedLeanTo'){
  const geometry=computeLeanToManufactureGeometry({internalProjectionMM:ip,pitchDeg,soffitDepthMM:soffit,frameThicknessMM:sft});
  return {geometry,drawing:<PlanDiagramLeanTo {...common} sft={sft}
   rafterPositionsMM={i.leanToRafterPositionsMM} leftSupportDepthMM={Number(i.leftSupportDepthMM??70)} rightSupportDepthMM={Number(i.rightSupportDepthMM??70)}
   lip={Number(m.fascia_lip_mm??25)} soffit={soffit} frameOn={Number(m.frame_on_mm??70)} leftOH={leftOH} rightOH={rightOH}
   outlet={i.gutterOutlet??i.gutter_outlet} gutterColor={i.gutterColor??i.gutter_color}/>};
 }
 const bossArrangement=i.bossArrangement??'offset',central=bossArrangement==='central';
 const hippedSides=central?'both':i.hippedSides??(i.leftHip===false?(i.rightHip===false?'none':'right'):(i.rightHip===false?'left':'both'));
 const geometry=calculateHippedLeanToGeometry({...i,widthMM:iw,projectionMM:ip,pitchDeg,soffitDepthMM:soffit,bossArrangement,hippedSides,
  leftHipWidthMM:Number(i.leftHipWidthMM??1000),rightHipWidthMM:Number(i.rightHipWidthMM??1000),
  leftWall,rightWall,leftOverhangMM:leftOH,rightOverhangMM:rightOH,materials:m});
 const c=central?buildCentralBossDesign({inputs:{...i,widthMM:iw,projMM:ip,pitchDeg,soffit_mm:soffit},materials:m}):null;
 const externalWidthMM=c?.valid?c.externalWidthMM:geometry.externalWidthMM;
 return {geometry,drawing:<PlanDiagramHippedLeanTo {...common} isAdmin bossArrangement={bossArrangement} hippedSides={hippedSides}
  leftHipWidth={central?iw/2:geometry.leftPitchDerivedHipWidthMM??Number(i.leftHipWidthMM??1000)}
  rightHipWidth={central?iw/2:geometry.rightPitchDerivedHipWidthMM??Number(i.rightHipWidthMM??1000)}
  frontRafterLayout={geometry.frontRafterLayoutV2} leftSidePitchDeg={central?c?.sidePitchDeg:geometry.leftSidePitchDeg}
  rightSidePitchDeg={central?c?.sidePitchDeg:geometry.rightSidePitchDeg} soffitDepthMM={soffit}
  tileSystem={i.tileSystem??i.tile_system} externalWidthMM={externalWidthMM}
  externalProjectionMM={c?.valid?c.externalProjectionMM:geometry.externalProjectionMM}
  leftExternalAllowanceMM={central?(externalWidthMM-iw)/2:geometry.leftExternalAllowanceMM}
  rightExternalAllowanceMM={central?(externalWidthMM-iw)/2:geometry.rightExternalAllowanceMM}
  leftSideRingBeamLayout={geometry.leftSideRingBeamLayout} rightSideRingBeamLayout={geometry.rightSideRingBeamLayout}
  leftBoundaryType={geometry.leftBoundaryType} rightBoundaryType={geometry.rightBoundaryType}/>};
}
