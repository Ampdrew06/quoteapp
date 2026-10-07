import { calculateHipPerimeterIntersection, calculateSparHookEnd } from "./hipPerimeterIntersection";
// lib/Geometry/hipManufactureGeometryV2.js

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Calculates the finished manufacturing geometry of one hip timber.
 *
 * All dimensions are in millimetres.
 *
 * The boss/spar-hook allowance is measured in PLAN,
 * along the diagonal trajectory of the hip.
 */
export function calculateHipManufactureGeometryV2({
  hipWidthMM,
  effectivePitchRunMM,
  frontPitchDeg,

  hipDepthMM = 220,
  bossAllowancePlanMM = 156,

  frontHorizontalAllowanceMM,
  sideHorizontalAllowanceMM,
  frontBaseWidthMM, sideBaseWidthMM, hipTimberWidthMM = 45,
  perimeterProjectionRunMM,
}) {
  const hipWidth = Math.max(0, finiteNumber(hipWidthMM));
  const effectivePitchRun = Math.max(
    0,
    finiteNumber(effectivePitchRunMM)
  );

  const frontPitch = finiteNumber(frontPitchDeg);
  const hipDepth = Math.max(0, finiteNumber(hipDepthMM, 220));

  const bossAllowancePlan = Math.max(
    0,
    finiteNumber(bossAllowancePlanMM, 156)
  );

  const frontHorizontalAllowance = Math.max(
    0,
    finiteNumber(frontHorizontalAllowanceMM)
  );

  const sideHorizontalAllowance = Math.max(
    0,
    finiteNumber(sideHorizontalAllowanceMM)
  );

  const frontPitchRad = frontPitch * DEG_TO_RAD;

  /*
   * PLAN GEOMETRY
   *
   * This is the diagonal plan distance from the internal
   * front mitre to the wallplate hip position.
   */
  const hipPlanLengthMM = Math.hypot(
    hipWidth,
    effectivePitchRun
  );

  if (hipPlanLengthMM <= 0) {
    return {
      valid: false,
      reason: "Hip plan length is zero.",

      hipPlanLengthMM: 0,
      hipRiseMM: 0,
      hipPitchDeg: 0,

      internalPlanLengthMM: 0,
      internalSlopeLengthMM: 0,
      externalSlopeLengthMM: 0,

      topVerticalCutMM: 0,
      horizontalFootCutMM: 0,
      verticalFootCutMM: 0,

      bossAllowancePlanMM: bossAllowancePlan,
    };
  }

  /*
   * HEIGHT OF THE HIP
   *
   * The vertical rise is governed by the front roof pitch
   * and the effective front-to-wallplate run.
   */
  const hipRiseMM =
    effectivePitchRun * Math.tan(frontPitchRad);

  /*
   * TRUE HIP PITCH
   *
   * The hip rises by hipRiseMM over the diagonal plan length.
   */
  const hipPitchRad = Math.atan2(
    hipRiseMM,
    hipPlanLengthMM
  );

  const hipPitchDeg = hipPitchRad * RAD_TO_DEG;

  /*
   * INTERNAL FINISHED EDGE B→C
   *
   * The 156 mm boss/spar-hook allowance is deducted
   * along the hip trajectory in plan before converting
   * the remaining plan distance into a slope length.
   */
  const internalPlanLengthMM = Math.max(
    0,
    hipPlanLengthMM - bossAllowancePlan
  );

  const hipPitchCos = Math.cos(hipPitchRad);
  const hipPitchSin = Math.sin(hipPitchRad);
  const hipPitchTan = Math.tan(hipPitchRad);

  const internalSlopeLengthMM =
    hipPitchCos > 0
      ? internalPlanLengthMM / hipPitchCos
      : 0;

  /*
   * HIP FOOT CUT C→E
   *
   * The front and side horizontal allowances are projected
   * onto the diagonal plan direction of the hip.
   */
  const acrossWidthDirection =
    hipWidth / hipPlanLengthMM;

  const projectionDirection =
    effectivePitchRun / hipPlanLengthMM;

  const projectedHorizontalFootCutMM =
    sideHorizontalAllowance * acrossWidthDirection +
    frontHorizontalAllowance * projectionDirection;

  // The supplied footprint widths activate the confirmed centreline datum.
  // Without them, retain the isolated historical reference calculation.
  const usesPerimeter = frontBaseWidthMM !== undefined || sideBaseWidthMM !== undefined;
  const perimeterFootprint = usesPerimeter ? calculateHipPerimeterIntersection({
    widthRunMM:hipWidth, projectionRunMM:perimeterProjectionRunMM ?? effectivePitchRun,
    sideBaseWidthMM, frontBaseWidthMM, timberWidthMM:hipTimberWidthMM,
    centreOffsetMM:0,
  }) : null;
  if(usesPerimeter && !perimeterFootprint.valid) return {valid:false,reason:perimeterFootprint.error};
  const horizontalFootCutMM = usesPerimeter ? perimeterFootprint.horizontalFootCutMM : projectedHorizontalFootCutMM;
  const hookEnd = calculateSparHookEnd({pitchDeg:hipPitchDeg,depthMM:hipDepth});

  /*
   * FULL VERTICAL DEPTH OF THE 220 mm HIP
   *
   * The timber depth is measured square to the timber,
   * so the equivalent plumb-cut depth is larger.
   *
   * This is also the provisional top vertical cut A→B.
   */
  const topVerticalCutMM =
    hipPitchCos > 0
      ? hipDepth / hipPitchCos
      : hipDepth;

  /*
   * HIP VERTICAL FOOT CUT D→E
   *
   * The horizontal foot cut rises through the timber
   * according to the actual hip pitch.
   */
  const riseAcrossHorizontalFootMM =
    horizontalFootCutMM * hipPitchTan;

  const verticalFootCutMM = Math.max(
    0,
    topVerticalCutMM - riseAcrossHorizontalFootMM
  );

  if(usesPerimeter && verticalFootCutMM<=0) return {valid:false,reason:"The centred hip toe exceeds the timber depth; a positive VFC is required."};

  /*
   * EXTERNAL FINISHED EDGE A→D
   *
   * Constructed from the internal edge and the completed
   * top/foot geometry rather than by adding a nominal
   * allowance to a sloping length.
   */
  const externalMinusInternalMM =
    horizontalFootCutMM * hipPitchCos -
    verticalFootCutMM * hipPitchSin +
    topVerticalCutMM * hipPitchSin;

  const externalSlopeLengthMM =
    internalSlopeLengthMM + externalMinusInternalMM + hookEnd.externalEdgeAdjustmentMM;

  return {
    valid: true,

    // Roof geometry
    hipWidthMM: hipWidth,
    effectivePitchRunMM: effectivePitchRun,
    hipRiseMM,
    hipPlanLengthMM,
    hipPitchDeg,

    // Top boss/spar-hook position
    bossAllowancePlanMM: bossAllowancePlan,
    internalPlanLengthMM,

    // Finished measurable timber edges
    internalSlopeLengthMM,
    externalSlopeLengthMM,
    topVerticalCutMM:hookEnd.topCutLengthMM,
    topCutLengthMM:hookEnd.topCutLengthMM,
    topCutOffSquareDeg:hookEnd.topCutOffSquareDeg,
    topCutDepartsFromPlumb:hookEnd.departsFromPlumb,
    sparHookExternalEdgeAdjustmentMM:hookEnd.externalEdgeAdjustmentMM,
    perimeterFootprint,
    footCutRule:usesPerimeter?'centreline-at-inner-corner':'historical-projected-reference',
    trimmedVfcMaxMM:usesPerimeter ? topVerticalCutMM-perimeterFootprint.firstTrimDistanceMM*hipPitchTan : verticalFootCutMM,
    horizontalFootCutMM,
    verticalFootCutMM,

    // Useful diagnostic values
    frontHorizontalAllowanceMM:
      frontHorizontalAllowance,

    sideHorizontalAllowanceMM:
      sideHorizontalAllowance,

    acrossWidthDirection,
    projectionDirection,
    riseAcrossHorizontalFootMM,

    // Workshop-rounded values
    rounded: {
      hipPlanLengthMM: Math.round(hipPlanLengthMM),
      hipRiseMM: Math.round(hipRiseMM),
      hipPitchDeg:
        Math.round(hipPitchDeg * 100) / 100,

      internalPlanLengthMM:
        Math.round(internalPlanLengthMM),

      internalSlopeLengthMM:
        Math.round(internalSlopeLengthMM),

      externalSlopeLengthMM:
        Math.round(externalSlopeLengthMM),

      topVerticalCutMM:
        Math.round(hookEnd.topCutLengthMM),

      horizontalFootCutMM:
        Math.round(horizontalFootCutMM),

      verticalFootCutMM:
        Math.round(verticalFootCutMM),
    },
  };
}

export default calculateHipManufactureGeometryV2;