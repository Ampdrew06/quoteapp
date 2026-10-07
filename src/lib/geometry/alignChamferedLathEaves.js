import { buildChamferedLathHeightAudit } from '../Calculations/chamferedLathHeightAudit';

// Integrate the same outside-face alignment proved in the Technical audit.
// Keep each existing ply/timber allowance; change actual widths by the HFC
// correction, rather than rounding the timber cut back to stock increments.
export function alignChamferedLathEaves(rule) {
  if (!rule?.solutionValid) return rule;
  const template = geometry => geometry?.raw ? {
    pitchDeg:geometry.raw.pitchDeg,
    horizontalFootRunMM:geometry.raw.manufacturedHorizontalFootCutMM,
    plumbCutHeightMM:geometry.raw.manufacturedPlumbCutHeightMM,
  } : null;
  const geometry = {
    frontTemplateDebug:template(rule.referenceGeometry),
    leftTemplateDebug:template(rule.left?.geometry),
    rightTemplateDebug:template(rule.right?.geometry),
    hasLeftHip:rule.left?.exists, hasRightHip:rule.right?.exists,
    sideSoffitMode:rule.sideSoffitControl?.mode || 'automatic',
    sideSoffitControlSide:rule.sideSoffitControl?.side || 'left',
  };
  const audit = buildChamferedLathHeightAudit({geometry});
  if (!audit.valid) return {...rule,solutionValid:false,chamferedLathAlignment:audit};
  const byId=Object.fromEntries(audit.rows.map(row=>[row.id,row]));
  const updateGeometry=(previous,row)=>{
    if (!row || !previous) return previous;
    const raw={...previous.raw,
      effectiveSoffitMM:Number(previous.raw.effectiveSoffitMM)+row.hfcChangeMM,
      horizontalExtensionMM:Number(previous.raw.horizontalExtensionMM)+row.hfcChangeMM,
      manufacturedBaseWidthMM:Number(previous.raw.manufacturedBaseWidthMM ?? rule.referenceBaseWidthMM)+row.hfcChangeMM,
      manufacturedHorizontalFootCutMM:row.candidateHfcMM,
      plumbCutHeightMM:row.candidateVfcMM,
      manufacturedPlumbCutHeightMM:row.candidateVfcMM,
      verticalDropMM:row.candidateHfcMM*Math.tan(row.pitchDeg*Math.PI/180),
    };
    return {...previous,raw,plumbCutHeight:row.candidateVfcMM,
      soffitDepthEffective:Number(previous.soffitDepthEffective)+row.hfcChangeMM};
  };
  const front=byId.front;
  const updateSide=(side,id)=>{
    const row=byId[id]; if (!row) return side;
    const adjusted={...side,geometry:updateGeometry(side.geometry,row)};
    for (const key of ['matchedSoffitMM','matchedHorizontalFootRunMM','manufacturedSoffitMM','manufacturedHorizontalFootRunMM','timberHorizontalFootCutMM','rawManufacturedSoffitMM']) {
      adjusted[key]=Number(side[key])+row.hfcChangeMM;
    }
    adjusted.matchedHorizontalFootRunMM=row.candidateHfcMM;
    adjusted.matchedSoffitMM=row.candidateHfcMM-rule.frameThicknessMM;
    adjusted.matchedPlumbCutHeightMM=row.candidateVfcMM;
    adjusted.manufacturedPlumbCutHeightMM=row.candidateVfcMM;
    adjusted.plumbCutDifferenceMM=0;
    return adjusted;
  };
  return {...rule,
    effectiveReferenceSoffitMM:rule.effectiveReferenceSoffitMM+front.hfcChangeMM,
    referenceSoffitAdjustmentMM:rule.effectiveReferenceSoffitMM+front.hfcChangeMM-rule.requestedReferenceSoffitMM,
    referenceSoffitAdjusted:Math.abs(rule.effectiveReferenceSoffitMM+front.hfcChangeMM-rule.requestedReferenceSoffitMM)>0.0001,
    referenceBaseWidthMM:rule.referenceBaseWidthMM+front.hfcChangeMM,
    referenceTimberHorizontalFootCutMM:front.candidateHfcMM,
    targetPlumbCutHeightMM:front.candidateVfcMM,
    referenceGeometry:updateGeometry(rule.referenceGeometry,front),
    left:updateSide(rule.left,'left'),right:updateSide(rule.right,'right'),
    chamferedLathAlignment:{...audit,integrated:true},
  };
}
