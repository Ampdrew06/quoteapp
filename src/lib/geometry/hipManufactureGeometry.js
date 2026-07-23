const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const degToRad = (deg) => (num(deg) * Math.PI) / 180;

export function computeHipManufactureGeometry(inputs = {}) {
  const hipPlanRunMM = num(inputs.hipPlanRunMM);
  const hipPitchDeg = num(inputs.hipPitchDeg);

  const sparHookAllowanceMM = num(inputs.sparHookAllowanceMM, 156);

  const cosHip = Math.cos(degToRad(hipPitchDeg));

  const pitchBasedStructuralLengthMM =
    cosHip > 0 ? hipPlanRunMM / cosHip : 0;

  const pitchBasedTimberliteCutMM = Math.max(
  0,
  pitchBasedStructuralLengthMM + sparHookAllowanceMM
);

  return {
    hipPlanRunMM: Number(hipPlanRunMM.toFixed(2)),
    hipPitchDeg: Number(hipPitchDeg.toFixed(2)),
    sparHookAllowanceMM: Number(sparHookAllowanceMM.toFixed(2)),
    pitchBasedStructuralLengthMM: Number(pitchBasedStructuralLengthMM.toFixed(2)),
    pitchBasedTimberliteCutMM: Number(pitchBasedTimberliteCutMM.toFixed(2)),
  };
}