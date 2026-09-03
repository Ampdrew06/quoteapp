import { buildHippedLeanToManufacturingSequence } from "../Manufacturing/manufacturingSequenceBuilder";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const HIP_V2_CAD_REFERENCE_MM = Object.freeze({
  externalSlopeLengthMM: 3885,
  internalSlopeLengthMM: 3615,
  horizontalFootCutMM: 250,
  verticalFootCutMM: 170,
  topVerticalCutMM: 230,
});

export const HIP_V2_CAD_TOLERANCE_MM = 20;

const inputNumber = (roofInputs, ...keys) => {
  for (const key of keys) {
    const value = Number(roofInputs?.[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const isCadReferenceRoof = (roofInputs = {}) =>
  Math.abs(inputNumber(roofInputs, "widthMM", "internalWidthMM") - 5870) <= 1 &&
  Math.abs(inputNumber(roofInputs, "projMM", "internalProjectionMM") - 3230) <= 1 &&
  Math.abs(inputNumber(roofInputs, "pitchDeg", "pitch_deg") - 15) <= 0.01 &&
  Math.abs(inputNumber(roofInputs, "requestedLeftSidePitchDeg") - 25) <= 0.01 &&
  Math.abs(inputNumber(roofInputs, "requestedRightSidePitchDeg") - 25) <= 0.01;

const buildHip = ({
  side,
  profile,
  edgeModel,
  includeCadReference,
  manufactureRef,
}) => {
  if (!profile?.valid) return null;

  const tiledEdge = (edgeModel?.edges || []).find(
    (edge) => edge.kind === "hip" && edge.side === side
  );

  const measurements = Object.entries(HIP_V2_CAD_REFERENCE_MM).map(
    ([key, referenceMM]) => {
      const calculatedMM = finite(profile[key]);
      const differenceMM = calculatedMM - referenceMM;

      return {
        key,
        calculatedMM,
        referenceMM: includeCadReference ? referenceMM : null,
        differenceMM: includeCadReference ? differenceMM : null,
        withinTolerance: includeCadReference
          ? Math.abs(differenceMM) <= HIP_V2_CAD_TOLERANCE_MM
          : null,
      };
    }
  );

  return {
    side,
    manufactureRef,
    hipPitchDeg: finite(profile.hipPitchDeg),
    hipPlanLengthMM: finite(profile.hipPlanLengthMM),
    finishedTiledEdgeMM: finite(tiledEdge?.lengthMM),
    structuralAuditLengthMM: finite(tiledEdge?.structuralLengthMM),
    measurements,
    allWithinCadTolerance:
      includeCadReference &&
      measurements.every((measurement) => measurement.withinTolerance),
  };
};

export function buildHipManufactureAudit({
  roofInputs = {},
  geometry = null,
  edgeModel = null,
} = {}) {
  const roofStyle = roofInputs.roofStyle || roofInputs.roof_style;

  if (roofStyle !== "hippedLeanTo" || !geometry) {
    return {
      valid: false,
      hips: [],
      cadReferenceApplicable: false,
      errors: ["A saved Hipped Lean-To V2 geometry was not found."],
    };
  }

  const cadReferenceApplicable = isCadReferenceRoof(roofInputs);
  const memberById =
    buildHippedLeanToManufacturingSequence(geometry).memberById;
  const hips = [
    buildHip({
      side: "left",
      profile: geometry.leftHipManufactureV2,
      edgeModel,
      includeCadReference: cadReferenceApplicable,
      manufactureRef: memberById["left-hip"]?.manufactureRef ?? null,
    }),
    buildHip({
      side: "right",
      profile: geometry.rightHipManufactureV2,
      edgeModel,
      includeCadReference: cadReferenceApplicable,
      manufactureRef: memberById["right-hip"]?.manufactureRef ?? null,
    }),
  ].filter(Boolean);

  return {
    valid: hips.length > 0,
    hips,
    cadReferenceApplicable,
    toleranceMM: HIP_V2_CAD_TOLERANCE_MM,
    errors: hips.length > 0 ? [] : ["No valid V2 hip profiles were found."],
  };
}
