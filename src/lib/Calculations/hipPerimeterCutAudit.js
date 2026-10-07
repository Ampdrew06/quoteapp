import { calculateHipPerimeterIntersection, calculateSparHookEnd } from '../geometry/hipPerimeterIntersection';
import { buildFrontRafterManufactureProfiles } from '../Manufacturing/frontRafterManufactureProfiles';

export function buildHipPerimeterCutAudit({geometry, timberWidthMM=45}={}) {
  const rows=[],errors=[],hookRows=[];
  if(!geometry) return {valid:false,rows,errors:['Resolved hipped geometry is required.'],hookRows};
  const frontBaseWidthMM=Number(geometry.externalProjectionMM)-Number(geometry.projectionMM);
  for(const side of ['left','right']) {
    const current=geometry[`${side}HipManufactureV2`];
    if(!current?.valid) continue;
    const sideBaseWidthMM=Number(geometry[`${side}ExternalAllowanceMM`]);
    const hook=calculateSparHookEnd({pitchDeg:current.hipPitchDeg});
    hookRows.push({id:`${side}-hip`,label:`${side} hip`,pitchDeg:current.hipPitchDeg,...hook});
    const rad=current.hipPitchDeg*Math.PI/180;
    for(const [datum,offset] of [['Centreline at inner corner',0]]) {
      const footprint=calculateHipPerimeterIntersection({widthRunMM:current.hipWidthMM,
        projectionRunMM:geometry.projectionMM,sideBaseWidthMM,frontBaseWidthMM,
        timberWidthMM,centreOffsetMM:offset});
      if(!footprint.valid) { errors.push(`${side}: ${datum}: ${footprint.error}`); continue; }
      const hfc=footprint.horizontalFootCutMM;
      // VFC depends on the foot and timber pitch, independently of top cut.
      const vfc=220/Math.cos(rad)-hfc*Math.tan(rad);
      if(vfc<=0) {errors.push(`${side}: ${datum}: HFC passes through the full timber depth.`);continue;}
      rows.push({id:`${side}-${offset}`,side,datum,...footprint,
        frontBaseWidthMM,sideBaseWidthMM,pitchDeg:current.hipPitchDeg,
        internalSlopeLengthMM:current.internalSlopeLengthMM,
        verticalFootCutMM:vfc,
        maximumTrimmedVfcMM:220/Math.cos(rad)-footprint.firstTrimDistanceMM*Math.tan(rad),
        externalSlopeLengthMM:current.internalSlopeLengthMM+hfc/Math.cos(rad)+hook.externalEdgeAdjustmentMM,
        currentHfcMM:current.horizontalFootCutMM,currentVfcMM:current.verticalFootCutMM,
        currentExternalMM:current.externalSlopeLengthMM});
    }
  }
  for(const member of buildFrontRafterManufactureProfiles({geometry}).filter(m=>m.type==='boss-rafter')) {
    hookRows.push({id:member.id,label:member.manufactureRef || member.id,
      pitchDeg:member.profile.facetPitchDeg,...calculateSparHookEnd({pitchDeg:member.profile.facetPitchDeg})});
  }
  return {valid:rows.length>0,rows,errors,hookRows,timberWidthMM,
    assumptions:['45mm hip width unless explicitly overridden.',
      'Internal hip endpoint and pitch retained from the current calculation.',
      'Confirmed centreline-at-inner-corner datum; outside clipping uses the full internal plan.',
      'Square initial toe, followed by perimeter trimming. Hip VFC is not matched to adjacent rafters.']};
}
