// Read-only perimeter alignment. No roof geometry, stock or cut list is mutated.
export function buildChamferedLathHeightAudit({ geometry, thicknessMM = 25 } = {}) {
  const thickness = Number(thicknessMM);
  if (!geometry || !Number.isFinite(thickness) || thickness <= 0) {
    return { valid:false, rows:[], errors:["Resolved geometry and positive lath thickness are required."] };
  }
  const definitions = [
    ["front", "Front", geometry.frontTemplateDebug],
    ["left", "Left side", geometry.hasLeftHip ? geometry.leftTemplateDebug : null],
    ["right", "Right side", geometry.hasRightHip ? geometry.rightTemplateDebug : null],
  ].filter(([, , profile]) => profile);
  const rows = definitions.map(([id, label, profile]) => {
    const pitchDeg = Number(profile.pitchDeg);
    const angle = pitchDeg * Math.PI / 180;
    const hfcMM = Number(profile.horizontalFootRunMM);
    const vfcMM = Number(profile.plumbCutHeightMM);
    const valid = [pitchDeg,hfcMM,vfcMM].every(Number.isFinite) && pitchDeg > 0 && pitchDeg < 90 && hfcMM > 0 && vfcMM > 0;
    const lathVerticalHeightMM = valid ? thickness / Math.cos(angle) : NaN;
    return { id,label,pitchDeg,hfcMM,vfcMM,lathVerticalHeightMM,
      finishedHeightMM:vfcMM+lathVerticalHeightMM, valid };
  });
  const sideControlled = geometry.sideSoffitMode === "specified" || geometry.sideSoffitMode === "none";
  const controlId = sideControlled ? (geometry.sideSoffitControlSide || "left") : "front";
  const control = rows.find(row => row.id === controlId);
  if (!control || rows.some(row => !row.valid)) {
    return { valid:false, rows:[], errors:["The controlling facet or a valid HFC/VFC profile is missing."] };
  }
  const targetFinishedHeightMM = control.finishedHeightMM;
  const resolvedRows = rows.map(row => {
    const angle = row.pitchDeg * Math.PI / 180;
    const vfcChangeMM = targetFinishedHeightMM - row.finishedHeightMM;
    const hfcChangeMM = vfcChangeMM === 0 ? 0 : -vfcChangeMM / Math.tan(angle);
    const candidateHfcMM = row.hfcMM + hfcChangeMM;
    const candidateVfcMM = row.vfcMM + vfcChangeMM;
    return { ...row, vfcChangeMM,hfcChangeMM,candidateHfcMM,candidateVfcMM,
      candidateFinishedHeightMM:candidateVfcMM+row.lathVerticalHeightMM,
      externalEdgeChangeMM:hfcChangeMM/Math.cos(angle),
      candidateValid:candidateHfcMM > 0 && candidateVfcMM > 0 };
  });
  return { valid:resolvedRows.every(row=>row.candidateValid), rows:resolvedRows,
    controlId, targetFinishedHeightMM, thicknessMM:thickness,
    currentHeightSpreadMM:Math.max(...rows.map(r=>r.finishedHeightMM))-Math.min(...rows.map(r=>r.finishedHeightMM)),
    errors:resolvedRows.every(row=>row.candidateValid)?[]:["Alignment would require a non-positive foot cut."],
    readOnly:true };
}
