const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) => (finite(degrees) * Math.PI) / 180;

/**
 * Build the five-sided workshop profile of one jack rafter.
 *
 * The hip intersection and 40 mm setback are horizontal plan dimensions
 * measured along the jack's own direction. The foot dimensions are inherited
 * unchanged from the facet containing the jack.
 */
export function calculateJackRafterManufactureGeometry({
  facetPitchDeg,
  hipCentrelinePlanRunMM,
  hipCentrelineSetbackMM = 40,
  horizontalFootCutMM,
  verticalFootCutMM,
  timberDepthMM = 220,
} = {}) {
  const pitchDeg = finite(facetPitchDeg);
  const pitchRad = degToRad(pitchDeg);
  const cosPitch = Math.cos(pitchRad);
  const tanPitch = Math.tan(pitchRad);

  const centrelineRunMM = Math.max(0, finite(hipCentrelinePlanRunMM));
  const setbackMM = Math.max(0, finite(hipCentrelineSetbackMM, 40));
  const hfcMM = Math.max(0, finite(horizontalFootCutMM));
  const suppliedVfcMM = Math.max(0, finite(verticalFootCutMM));
  const depthMM = Math.max(0, finite(timberDepthMM, 220));

  if (centrelineRunMM <= setbackMM || cosPitch <= 0) {
    return {
      valid: false,
      reason: "The hip intersection does not leave a positive jack run.",
    };
  }

  const topCutPlanRunMM = centrelineRunMM - setbackMM;
  const internalHorizontalRunMM = topCutPlanRunMM;
  const externalHorizontalRunMM = topCutPlanRunMM + hfcMM;

  const internalSlopeLengthMM = internalHorizontalRunMM / cosPitch;
  const externalSlopeLengthMM = externalHorizontalRunMM / cosPitch;
  const topVerticalCutMM = depthMM / cosPitch;
  const geometricVerticalFootCutMM =
    topVerticalCutMM - hfcMM * tanPitch;

  return {
    valid: true,
    facetPitchDeg: pitchDeg,
    timberDepthMM: depthMM,
    hipCentrelinePlanRunMM: centrelineRunMM,
    hipCentrelineSetbackMM: setbackMM,
    topCutPlanRunMM,
    horizontalFootCutMM: hfcMM,
    verticalFootCutMM: suppliedVfcMM,
    geometricVerticalFootCutMM,
    footTemplateDifferenceMM: suppliedVfcMM - geometricVerticalFootCutMM,
    internalHorizontalRunMM,
    externalHorizontalRunMM,
    internalSlopeLengthMM,
    externalSlopeLengthMM,
    topVerticalCutMM,
    rounded: {
      hipCentrelinePlanRunMM: Math.round(centrelineRunMM),
      topCutPlanRunMM: Math.round(topCutPlanRunMM),
      internalSlopeLengthMM: Math.round(internalSlopeLengthMM),
      externalSlopeLengthMM: Math.round(externalSlopeLengthMM),
      horizontalFootCutMM: Math.round(hfcMM),
      verticalFootCutMM: Math.round(suppliedVfcMM),
      topVerticalCutMM: Math.round(topVerticalCutMM),
    },
  };
}

export default calculateJackRafterManufactureGeometry;

