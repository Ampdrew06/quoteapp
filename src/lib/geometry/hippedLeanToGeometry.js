// src/lib/geometry/HippedLeanToGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";
import { computeHipManufactureGeometry } from "./hipManufactureGeometry";
import { buildFacet } from "../Manufacturing/facetBuilder";
import { solveFacetEavesGeometry } from "./facetEavesGeometry";

const degToRad = (deg) => (Number(deg) * Math.PI) / 180;
const radToDeg = (rad) => (Number(rad) * 180) / Math.PI;

const calcSidePitchDeg = ({ frontPitchDeg, projectionMM, hipWidthMM }) => {
  const projection = Number(projectionMM) || 0;
  const hipWidth = Number(hipWidthMM) || 0;

  if (!projection || !hipWidth) return 0;

  return radToDeg(
    Math.atan(Math.tan(degToRad(frontPitchDeg)) * (projection / hipWidth))
  );
};

const MIN_OPEN_SIDE_SOFFIT_MM = 25;

const HIP_TOP_CUT_FACE_OFFSET_MM = 140;
const SPAR_HOOK_TO_BOSS_OFFSET_MM = 105;

const SPAR_HOOK_TO_WALLPLATE_FACE_MM = 156;

const solveSoffitForTargetFasciaHeight = ({
  targetFasciaHeightMM,
  pitchDeg,
  materials,
}) => {
  const MIN_SOFFIT_MM = 0;
  const MAX_SOFFIT_MM = 1000;
  const COARSE_STEP_MM = 20;

  const getFasciaDifference = (soffitDepthMM) => {
    const test = calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg,
      soffitDepthMM,
      materials,
    });

    const fasciaAlignmentDatumMM = Number(
  test.fasciaAlignmentDatum || 0
);

return Math.abs(
  fasciaAlignmentDatumMM -
    Number(targetFasciaHeightMM || 0)
);
  };

  let bestSoffitMM = MIN_SOFFIT_MM;
  let bestDifferenceMM = Infinity;

  // First pass: quickly locate the best 20mm region.
  for (
    let soffitMM = MIN_SOFFIT_MM;
    soffitMM <= MAX_SOFFIT_MM;
    soffitMM += COARSE_STEP_MM
  ) {
    const differenceMM = getFasciaDifference(soffitMM);

    if (differenceMM < bestDifferenceMM) {
      bestDifferenceMM = differenceMM;
      bestSoffitMM = soffitMM;
    }
  }

  // Second pass: check every whole millimetre around the best region.
  const fineStartMM = Math.max(
    MIN_SOFFIT_MM,
    bestSoffitMM - COARSE_STEP_MM
  );

  const fineEndMM = Math.min(
    MAX_SOFFIT_MM,
    bestSoffitMM + COARSE_STEP_MM
  );

  for (
    let soffitMM = fineStartMM;
    soffitMM <= fineEndMM;
    soffitMM += 1
  ) {
    const differenceMM = getFasciaDifference(soffitMM);

    if (differenceMM < bestDifferenceMM) {
      bestDifferenceMM = differenceMM;
      bestSoffitMM = soffitMM;
    }
  }

  return bestSoffitMM;
};
/**
 * Finds the soffit depth that produces a required vertical
 * rafter foot/plumb cut at a given pitch.
 *
 * This is the numerical equivalent of comparing two physical
 * rafter templates after aligning their internal foot-cut corners.
 *
 * It is not connected to the active roof calculation yet.
 */
const solveSoffitForTargetPlumbCut = ({
  targetPlumbCutHeightMM,
  pitchDeg,
  materials,
  minimumSoffitMM = MIN_OPEN_SIDE_SOFFIT_MM,
  maximumSoffitMM = 1000,
}) => {
  const minSoffitMM = Math.max(
    0,
    Number(minimumSoffitMM) || 0
  );

  const maxSoffitMM = Math.max(
    minSoffitMM,
    Number(maximumSoffitMM) || 1000
  );

  const targetMM = Math.max(
    0,
    Number(targetPlumbCutHeightMM) || 0
  );

  const COARSE_STEP_MM = 20;

  const evaluate = (soffitDepthMM) => {
    const geometry = calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg,
      soffitDepthMM,
      materials,
    });

    const plumbCutHeightMM = Number(
      geometry?.plumbCutHeight ?? 0
    );

    return {
      soffitDepthMM,
      plumbCutHeightMM,
      differenceMM: Math.abs(
        plumbCutHeightMM - targetMM
      ),
      geometry,
    };
  };

  let bestResult = evaluate(minSoffitMM);

  // Coarse pass: locate the best 20 mm region.
  for (
    let soffitMM = minSoffitMM;
    soffitMM <= maxSoffitMM;
    soffitMM += COARSE_STEP_MM
  ) {
    const result = evaluate(soffitMM);

    if (result.differenceMM < bestResult.differenceMM) {
      bestResult = result;
    }
  }

  // Fine pass: search every whole millimetre around that region.
  const fineStartMM = Math.max(
    minSoffitMM,
    bestResult.soffitDepthMM - COARSE_STEP_MM
  );

  const fineEndMM = Math.min(
    maxSoffitMM,
    bestResult.soffitDepthMM + COARSE_STEP_MM
  );

  for (
    let soffitMM = fineStartMM;
    soffitMM <= fineEndMM;
    soffitMM += 1
  ) {
    const result = evaluate(soffitMM);

    if (result.differenceMM < bestResult.differenceMM) {
      bestResult = result;
    }
  }

  return bestResult;
};

const calculateLevelFasciaSoffits = ({
  requestedFrontSoffitMM,
  frontPitchDeg,
  leftSidePitchDeg,
  rightSidePitchDeg,
  hasLeftHip,
  hasRightHip,
  materials,
}) => {
  let effectiveFrontSoffitMM = Number(requestedFrontSoffitMM) || 0;
  let adjusted = false;

  const getTarget = (frontSoffit) =>
    calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg: frontPitchDeg,
      soffitDepthMM: frontSoffit,
      materials,
    }).fasciaAlignmentDatum;

  const pitchesMatch = (a, b) =>
  Math.abs(Number(a) - Number(b)) < 0.05;

const getSideSoffits = (frontSoffit) => {
  const targetFasciaHeightMM = getTarget(frontSoffit);

  return {
    left: hasLeftHip
      ? pitchesMatch(leftSidePitchDeg, frontPitchDeg)
        ? frontSoffit
        : solveSoffitForTargetFasciaHeight({
            targetFasciaHeightMM,
            pitchDeg: leftSidePitchDeg,
            materials,
          })
      : 0,

    right: hasRightHip
      ? pitchesMatch(rightSidePitchDeg, frontPitchDeg)
        ? frontSoffit
        : solveSoffitForTargetFasciaHeight({
            targetFasciaHeightMM,
            pitchDeg: rightSidePitchDeg,
            materials,
          })
      : 0,
  };
};

const evaluateFasciaSolution = (frontSoffitMM) => {
  const sideSoffits = getSideSoffits(frontSoffitMM);

  const frontGeometry = calculateLeanToGeometry({
    widthMM: 1000,
    projectionMM: 1000,
    pitchDeg: frontPitchDeg,
    soffitDepthMM: frontSoffitMM,
    materials,
  });

  const leftGeometry = hasLeftHip
    ? calculateLeanToGeometry({
        widthMM: 1000,
        projectionMM: 1000,
        pitchDeg: leftSidePitchDeg,
        soffitDepthMM: sideSoffits.left,
        materials,
      })
    : null;

  const rightGeometry = hasRightHip
    ? calculateLeanToGeometry({
        widthMM: 1000,
        projectionMM: 1000,
        pitchDeg: rightSidePitchDeg,
        soffitDepthMM: sideSoffits.right,
        materials,
      })
    : null;

  const frontOrderSizeMM = Number(
    frontGeometry?.fasciaOrderSize ?? 0
  );

  const leftOrderSizeMM = hasLeftHip
    ? Number(leftGeometry?.fasciaOrderSize ?? 0)
    : frontOrderSizeMM;

  const rightOrderSizeMM = hasRightHip
    ? Number(rightGeometry?.fasciaOrderSize ?? 0)
    : frontOrderSizeMM;

  const sideSoffitsValid =
    (!hasLeftHip ||
      sideSoffits.left >= MIN_OPEN_SIDE_SOFFIT_MM) &&
    (!hasRightHip ||
      sideSoffits.right >= MIN_OPEN_SIDE_SOFFIT_MM);

  const fasciaSizesMatch =
  frontOrderSizeMM > 0;

  return {
    frontSoffitMM,
    sideSoffits,

    frontGeometry,
    leftGeometry,
    rightGeometry,

    frontOrderSizeMM,
    leftOrderSizeMM,
    rightOrderSizeMM,

    sideSoffitsValid,
    fasciaSizesMatch,

    isValid:
      sideSoffitsValid &&
      fasciaSizesMatch,
  };
};

  const requestedSoffitMM =
  Math.max(0, Number(requestedFrontSoffitMM) || 0);

// The requested front soffit is the master geometry.
// Side soffits adapt to its finished fascia line.
const selectedSolution =
  evaluateFasciaSolution(requestedSoffitMM);

effectiveFrontSoffitMM = requestedSoffitMM;

const sideSoffits =
  selectedSolution.sideSoffits;

adjusted = false;

  const frontGeometry =
  selectedSolution.frontGeometry;

const leftSideGeometry =
  selectedSolution.leftGeometry;

const rightSideGeometry =
  selectedSolution.rightGeometry;

  const leftPlumbCutMatch = hasLeftHip
  ? solveSoffitForTargetPlumbCut({
      targetPlumbCutHeightMM:
        Number(frontGeometry?.plumbCutHeight ?? 0),
      pitchDeg: leftSidePitchDeg,
      materials,
      minimumSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    })
  : null;

const rightPlumbCutMatch = hasRightHip
  ? solveSoffitForTargetPlumbCut({
      targetPlumbCutHeightMM:
        Number(frontGeometry?.plumbCutHeight ?? 0),
      pitchDeg: rightSidePitchDeg,
      materials,
      minimumSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    })
  : null;

  // At a 90° mitred corner, unequal-pitch rafter templates do not
// finish at the same outer point.
//
// The steeper profile projects farther beyond the common vertical
// foot-cut line. That triangular projection is cut off square at
// the mitre and must be added to the theoretical matched soffit.
const rafterDepthMM = Number(
  materials?.rafter_depth_mm ??
  frontGeometry?.raw?.rafterDepthMM ??
  220
);

const frontPitchRad = degToRad(frontPitchDeg);

const leftMitreTrimAllowanceMM = hasLeftHip
  ? rafterDepthMM *
    Math.abs(
      Math.sin(degToRad(leftSidePitchDeg)) -
      Math.sin(frontPitchRad)
    )
  : 0;

const rightMitreTrimAllowanceMM = hasRightHip
  ? rafterDepthMM *
    Math.abs(
      Math.sin(degToRad(rightSidePitchDeg)) -
      Math.sin(frontPitchRad)
    )
  : 0;

const leftRawManufacturedSoffitMM = hasLeftHip
  ? Number(leftPlumbCutMatch?.soffitDepthMM ?? 0) +
    leftMitreTrimAllowanceMM
  : 0;

const rightRawManufacturedSoffitMM = hasRightHip
  ? Number(rightPlumbCutMatch?.soffitDepthMM ?? 0) +
    rightMitreTrimAllowanceMM
  : 0;

// Temporary workshop rule:
// round the manufactured side soffit upward to the nearest 5 mm.
const leftRoundedManufacturedSoffitMM = hasLeftHip
  ? Math.ceil(leftRawManufacturedSoffitMM / 5) * 5
  : 0;

const rightRoundedManufacturedSoffitMM = hasRightHip
  ? Math.ceil(rightRawManufacturedSoffitMM / 5) * 5
  : 0;

  // The isolated front/side Lean-To values are diagnostic only.
//
// In the assembled hipped roof, all active facets meet on one
// common vertical fascia line. The largest physical requirement
// therefore determines the common finished fascia height.
const activeFinishedFasciaHeightsMM = [
  Number(frontGeometry?.fasciaHeight ?? 0),

  ...(hasLeftHip
    ? [Number(leftSideGeometry?.fasciaHeight ?? 0)]
    : []),

  ...(hasRightHip
    ? [Number(rightSideGeometry?.fasciaHeight ?? 0)]
    : []),
].filter((value) => Number.isFinite(value) && value > 0);

const commonFinishedFasciaHeightMM =
  activeFinishedFasciaHeightsMM.length > 0
    ? Math.max(...activeFinishedFasciaHeightsMM)
    : 0;

// Use the same physical fascia offset as the validated Lean-To
// calculation to convert the assembled finished height back to
// the common vertical rafter foot cut.
const fasciaOffsetMM = Number(
  frontGeometry?.raw?.fasciaOffsetMM ?? 61
);

const commonFootPlumbCutHeightMM = Math.max(
  0,
  commonFinishedFasciaHeightMM - fasciaOffsetMM
);

// Stock fascia is selected from the greatest requirement of all
// active facets. This gives one fascia size around the whole roof.
const activeFasciaOrderSizesMM = [
  Number(frontGeometry?.fasciaOrderSize ?? 0),

  ...(hasLeftHip
    ? [Number(leftSideGeometry?.fasciaOrderSize ?? 0)]
    : []),

  ...(hasRightHip
    ? [Number(rightSideGeometry?.fasciaOrderSize ?? 0)]
    : []),
].filter((value) => Number.isFinite(value) && value > 0);

const commonFasciaOrderSizeMM =
  activeFasciaOrderSizesMM.length > 0
    ? Math.max(...activeFasciaOrderSizesMM)
    : 0;

return {
  requestedFrontSoffitMM,
  effectiveFrontSoffitMM,

  leftCalculatedSoffitMM:
    hasLeftHip ? sideSoffits.left : 0,

  rightCalculatedSoffitMM:
    hasRightHip ? sideSoffits.right : 0,

  frontSoffitAutoAdjusted: adjusted,
  minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,

  commonFasciaOrderSizeMM,
  commonFinishedFasciaHeightMM,
  commonFootPlumbCutHeightMM,

  fasciaOrderSizesMatch:
  selectedSolution.fasciaSizesMatch,

  // Actual finished Lean-To fascia results
  frontFinishedFasciaHeightMM: Number(
    frontGeometry?.fasciaHeight ?? 0
  ),

  leftFinishedFasciaHeightMM: Number(
    leftSideGeometry?.fasciaHeight ?? 0
  ),

  rightFinishedFasciaHeightMM: Number(
    rightSideGeometry?.fasciaHeight ?? 0
  ),

  // Pitch-dependent datum used by the reverse solver
  frontFasciaAlignmentDatumMM: Number(
    frontGeometry?.fasciaAlignmentDatum ?? 0
  ),

  leftFasciaAlignmentDatumMM: Number(
    leftSideGeometry?.fasciaAlignmentDatum ?? 0
  ),

  rightFasciaAlignmentDatumMM: Number(
    rightSideGeometry?.fasciaAlignmentDatum ?? 0
  ),

  // Practical ordered fascia board sizes
  frontFasciaOrderSizeMM: Number(
    frontGeometry?.fasciaOrderSize ?? 0
  ),

  leftFasciaOrderSizeMM: Number(
    leftSideGeometry?.fasciaOrderSize ?? 0
  ),

  rightFasciaOrderSizeMM: Number(
    rightSideGeometry?.fasciaOrderSize ?? 0
  ),

  // Rafter outer vertical foot/plumb cuts
  frontPlumbCutHeightMM: Number(
    frontGeometry?.plumbCutHeight ?? 0
  ),

  leftPlumbCutHeightMM: Number(
    leftSideGeometry?.plumbCutHeight ?? 0
  ),

  rightPlumbCutHeightMM: Number(
    rightSideGeometry?.plumbCutHeight ?? 0
  ),

  leftPlumbCutMatchedSoffitMM: Number(
  leftPlumbCutMatch?.soffitDepthMM ?? 0
),

rightPlumbCutMatchedSoffitMM: Number(
  rightPlumbCutMatch?.soffitDepthMM ?? 0
),

leftMatchedPlumbCutHeightMM: Number(
  leftPlumbCutMatch?.plumbCutHeightMM ?? 0
),

rightMatchedPlumbCutHeightMM: Number(
  rightPlumbCutMatch?.plumbCutHeightMM ?? 0
),

leftPlumbCutDifferenceMM: Number(
  leftPlumbCutMatch?.differenceMM ?? 0
),

rightPlumbCutDifferenceMM: Number(
  rightPlumbCutMatch?.differenceMM ?? 0
),

leftMitreTrimAllowanceMM: Number(
  leftMitreTrimAllowanceMM.toFixed(2)
),

rightMitreTrimAllowanceMM: Number(
  rightMitreTrimAllowanceMM.toFixed(2)
),

leftRawManufacturedSoffitMM: Number(
  leftRawManufacturedSoffitMM.toFixed(2)
),

rightRawManufacturedSoffitMM: Number(
  rightRawManufacturedSoffitMM.toFixed(2)
),

leftRoundedManufacturedSoffitMM: Number(
  leftRoundedManufacturedSoffitMM.toFixed(2)
),

rightRoundedManufacturedSoffitMM: Number(
  rightRoundedManufacturedSoffitMM.toFixed(2)
),
};
};

export function calculateHippedLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,
  hippedSides = "both", // "left" | "right" | "both"
  leftHipWidthMM = 1000,
  rightHipWidthMM = 1000,

  leftWall = false,
  rightWall = false,
  leftOverhangMM = 0,
  rightOverhangMM = 0,
}) {
  const base = calculateLeanToGeometry({
    widthMM,
    projectionMM,
    pitchDeg,
    soffitDepthMM,
    materials,
  });

  const width = Number(widthMM || 0);
  const projection = Number(projectionMM || 0);

  const hasLeftHip = hippedSides === "left" || hippedSides === "both";
  const hasRightHip = hippedSides === "right" || hippedSides === "both";

  const leftHipWidth = hasLeftHip ? Number(leftHipWidthMM || 0) : 0;
  const rightHipWidth = hasRightHip ? Number(rightHipWidthMM || 0) : 0;

  const centreWidth = Math.max(0, width - leftHipWidth - rightHipWidth);

  // 1) Boss / hip positions in plan
const leftBossX = leftHipWidth;
const rightBossX = width - rightHipWidth;

// 2) Hip plan lengths
const hipPlanLengthLeft = hasLeftHip
  ? Math.sqrt(leftHipWidth ** 2 + projection ** 2)
  : 0;

const hipPlanLengthRight = hasRightHip
  ? Math.sqrt(rightHipWidth ** 2 + projection ** 2)
  : 0;

// 3) Rise from corrected Lean-To geometry
const riseMM = base?.raw?.pureRiseMM ?? 0;

// 4) Side roof plane pitches
const leftSidePitchDeg = hasLeftHip
  ? calcSidePitchDeg({
      frontPitchDeg: pitchDeg,
      projectionMM: projection,
      hipWidthMM: leftHipWidth,
    })
  : 0;

const rightSidePitchDeg = hasRightHip
  ? calcSidePitchDeg({
      frontPitchDeg: pitchDeg,
      projectionMM: projection,
      hipWidthMM: rightHipWidth,
    })
  : 0;

// 5) Hip member pitch — this is the factory saw angle we need to validate
const leftHipPitchDeg = hasLeftHip
  ? radToDeg(Math.atan2(riseMM, hipPlanLengthLeft))
  : 0;

const rightHipPitchDeg = hasRightHip
  ? radToDeg(Math.atan2(riseMM, hipPlanLengthRight))
  : 0;

// 6) Hip true/cut lengths
const leftHipTrueLengthMM = hasLeftHip
  ? hipPlanLengthLeft / Math.cos(degToRad(leftSidePitchDeg))
  : 0;

const rightHipTrueLengthMM = hasRightHip
  ? hipPlanLengthRight / Math.cos(degToRad(rightSidePitchDeg))
  : 0;

  // 7) Manufacturing / fittings
const bossQty = (hasLeftHip ? 1 : 0) + (hasRightHip ? 1 : 0);
const sparHookQty = bossQty * 2;
const hipTopCutDeg = 19;
const frontSoffitMM = base.soffitDepthEffective || 0;

const requestedFrontSoffitMM = frontSoffitMM;

const facetEavesRule = solveFacetEavesGeometry({
  requestedReferenceSoffitMM:
    requestedFrontSoffitMM,

  referencePitchDeg:
    pitchDeg,

  leftPitchDeg:
    leftSidePitchDeg,

  rightPitchDeg:
    rightSidePitchDeg,

  hasLeftFacet:
    hasLeftHip,

  hasRightFacet:
    hasRightHip,

  materials,

  minimumSoffitMM:
    MIN_OPEN_SIDE_SOFFIT_MM,

  manufacturingRoundIncrementMM: 5,
});

const soffitRule = calculateLevelFasciaSoffits({
  requestedFrontSoffitMM,
  frontPitchDeg: pitchDeg,
  leftSidePitchDeg,
  rightSidePitchDeg,
  hasLeftHip,
  hasRightHip,
  materials,
});

// Live eaves dimensions now come from the universal,
// physically validated facet-eaves solver.
const effectiveFrontSoffitMM = Number(
  facetEavesRule.effectiveReferenceSoffitMM ?? 0
);

const leftCalculatedSoffitMM = hasLeftHip
  ? Number(
      facetEavesRule.left.manufacturedSoffitMM ?? 0
    )
  : 0;

const rightCalculatedSoffitMM = hasRightHip
  ? Number(
      facetEavesRule.right.manufacturedSoffitMM ?? 0
    )
  : 0;

const frameThicknessMM = Number(materials?.side_frame_thickness_mm ?? 70);

const leftExternalHipRunMM =
  leftHipWidth + frameThicknessMM;

const rightExternalHipRunMM =
  rightHipWidth + frameThicknessMM;

const externalHipProjectionMM =
  projection + frameThicknessMM;

const leftHipExternalPlanLengthMM = hasLeftHip
  ? Math.sqrt(leftExternalHipRunMM ** 2 + externalHipProjectionMM ** 2)
  : 0;

const rightHipExternalPlanLengthMM = hasRightHip
  ? Math.sqrt(rightExternalHipRunMM ** 2 + externalHipProjectionMM ** 2)
  : 0;

const leftHipExternalTrueLengthMM = hasLeftHip
  ? leftHipExternalPlanLengthMM / Math.cos(degToRad(pitchDeg))
  : 0;

const rightHipExternalTrueLengthMM = hasRightHip
  ? rightHipExternalPlanLengthMM / Math.cos(degToRad(pitchDeg))
  : 0;

const leftHipManufacturingLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM)
  : 0;

const rightHipManufacturingLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM)
  : 0;

  const leftHipExternalEdgeCutLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM)
  : 0;

const rightHipExternalEdgeCutLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM)
  : 0;

  const leftHipTimberliteCutLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

const rightHipTimberliteCutLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

  const leftHipPitchTrueLengthMM = hasLeftHip
  ? hipPlanLengthLeft / Math.cos(degToRad(leftHipPitchDeg))
  : 0;

const rightHipPitchTrueLengthMM = hasRightHip
  ? hipPlanLengthRight / Math.cos(degToRad(rightHipPitchDeg))
  : 0;

const leftHipPitchBasedCutMM = hasLeftHip
  ? Math.max(0, leftHipPitchTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

const rightHipPitchBasedCutMM = hasRightHip
  ? Math.max(0, rightHipPitchTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;
const leftHipManufactureTest = hasLeftHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: hipPlanLengthLeft,
      hipPitchDeg: leftHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;

const rightHipManufactureTest = hasRightHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: hipPlanLengthRight,
      hipPitchDeg: rightHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;
const frameOnMM = Number(materials?.frame_on_mm ?? 70);

const fasciaLipMM = Number(materials?.fascia_lip_mm ?? 25);

const resolvedLeftOverhangMM = Math.max(
  0,
  Number(leftOverhangMM) || 0
);

const resolvedRightOverhangMM = Math.max(
  0,
  Number(rightOverhangMM) || 0
);

// Current supported side conditions:
//
// 1. Hip present:
//    frame thickness + calculated hipped-side soffit.
//
// 2. No hip, wall present:
//    no frame, soffit or fascia-lip addition.
//
// 3. No hip, open side:
//    use the normal Lean-To rule:
//    frame + entered overhang, or frame + minimum fascia lip.
const leftExternalAllowanceMM = hasLeftHip
  ? frameThicknessMM + leftCalculatedSoffitMM
  : leftWall
    ? 0
    : frameThicknessMM +
      (resolvedLeftOverhangMM > 0
        ? resolvedLeftOverhangMM
        : fasciaLipMM);

const rightExternalAllowanceMM = hasRightHip
  ? frameThicknessMM + rightCalculatedSoffitMM
  : rightWall
    ? 0
    : frameThicknessMM +
      (resolvedRightOverhangMM > 0
        ? resolvedRightOverhangMM
        : fasciaLipMM);

const externalWidthMM =
  width +
  leftExternalAllowanceMM +
  rightExternalAllowanceMM;

const externalProjectionMM =
  projection +
  frameOnMM +
  effectiveFrontSoffitMM;

const leftSideRingBeam = hasLeftHip
  ? {
      exists: true,
      internalLengthMM: projection,
      externalLengthMM: externalProjectionMM,
      sideSoffitMM: leftCalculatedSoffitMM,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,
    }
  : {
      exists: false,
      internalLengthMM: 0,
      externalLengthMM: 0,
      sideSoffitMM: 0,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,
    };

const rightSideRingBeam = hasRightHip
  ? {
      exists: true,
      internalLengthMM: projection,
      externalLengthMM: externalProjectionMM,
      sideSoffitMM: rightCalculatedSoffitMM,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,
    }
  : {
      exists: false,
      internalLengthMM: 0,
      externalLengthMM: 0,
      sideSoffitMM: 0,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,
    };

    const SIDE_RING_BEAM_SLOT_WIDTH_MM = 48;
const SIDE_FIRST_RAFTER_CENTRE_MM = 690;
const SIDE_RAFTER_SPACING_MM = 665;

// Minimum clear gap required between the final side-jack slot
// and the front hip-seat slot.
// Temporary manufacturing rule — review after workshop testing.
const SIDE_FINAL_JACK_MIN_CLEARANCE_MM = 400;

const buildSideRingBeamLayout = ({
  exists,
  internalLengthMM,
  side,
}) => {
  const lengthMM = Math.max(
    0,
    Number(internalLengthMM) || 0
  );

  if (!exists || lengthMM <= 0) {
    return {
      side,
      exists: false,

      slots: [],
      bayWidthsMM: [],

      intermediateJackRafters: [],
      intermediateJackRafterCount: 0,

      wallJackCount: 0,
      hipSeatCount: 0,
    };
  }

  const slotWidthMM = SIDE_RING_BEAM_SLOT_WIDTH_MM;
  const halfSlotMM = slotWidthMM / 2;

  // Boundary slot at the wall end.
  const wallSlot = {
    type: "wall-jack",
    centreMM: halfSlotMM,
    leftMM: 0,
    rightMM: Math.min(slotWidthMM, lengthMM),
  };

  // Actual side jack rafters:
  // first centre 690 mm from the wall,
  // then 665 mm centres towards the front hip.
  const intermediateJackRafters = [];

  for (
    let centreMM = SIDE_FIRST_RAFTER_CENTRE_MM;
    centreMM < lengthMM;
    centreMM += SIDE_RAFTER_SPACING_MM
  ) {
    const leftMM = centreMM - halfSlotMM;
const rightMM = centreMM + halfSlotMM;

const hipSeatLeftMM = Math.max(
  0,
  lengthMM - slotWidthMM
);

const clearGapToHipSeatMM =
  hipSeatLeftMM - rightMM;

// Omit this jack—and all later positions—when the clear gap
// between its slot and the hip-seat slot would be less than
// the current manufacturing minimum.
if (
  clearGapToHipSeatMM <
  SIDE_FINAL_JACK_MIN_CLEARANCE_MM
) {
  break;
}

intermediateJackRafters.push({
  type: "side-jack",
  centreMM,
  leftMM,
  rightMM,
  clearGapToHipSeatMM,
});
  }

  // Boundary slot at the front mitred end for the hip.
  const hipSlot = {
    type: "hip-seat",
    centreMM: Math.max(0, lengthMM - halfSlotMM),
    leftMM: Math.max(0, lengthMM - slotWidthMM),
    rightMM: lengthMM,
  };

  const slots = [
    wallSlot,
    ...intermediateJackRafters,
    hipSlot,
  ]
    .filter(
      (slot) =>
        Number.isFinite(slot.leftMM) &&
        Number.isFinite(slot.rightMM) &&
        slot.rightMM > slot.leftMM
    )
    .sort((a, b) => a.leftMM - b.leftMM);

  const bayWidthsMM = slots
    .slice(0, -1)
    .map((slot, index) => {
      const nextSlot = slots[index + 1];

      return Math.max(
        0,
        Number(nextSlot.leftMM) -
          Number(slot.rightMM)
      );
    })
    .filter((widthMM) => widthMM > 0);

  return {
    side,
    exists: true,

    internalLengthMM: lengthMM,
    slotWidthMM,

    slots,
    bayWidthsMM,

    intermediateJackRafters,
    intermediateJackRafterCount:
      intermediateJackRafters.length,

    // Included as Steico members later, but no hook/bracket.
    wallJackCount: 1,

    // Represents the hip seating at the front mitre.
    hipSeatCount: 1,
  };
};

const leftSideRingBeamLayout =
  buildSideRingBeamLayout({
    exists: hasLeftHip,
    internalLengthMM: projection,
    side: "left",
  });

const rightSideRingBeamLayout =
  buildSideRingBeamLayout({
    exists: hasRightHip,
    internalLengthMM: projection,
    side: "right",
  });

const leftFacet = buildFacet({
  id: "facet-left-side",
  label: "Left Side Facet",
  exists: hasLeftHip,

  internalEavesLengthMM: projection,
  externalEavesLengthMM:
    leftSideRingBeam.externalLengthMM,

  pitchDeg: leftSidePitchDeg,

  soffitDepthMM:
    leftCalculatedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.left.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasLeftHip,
  ringBeamLengthMM:
    leftSideRingBeam.externalLengthMM,

  // Wall slot + intermediate side-jack slots + hip-seat slot.
  ringBeamBayWidthsMM:
    leftSideRingBeamLayout.bayWidthsMM,
});

const rightFacet = buildFacet({
  id: "facet-right-side",
  label: "Right Side Facet",
  exists: hasRightHip,

  internalEavesLengthMM: projection,
  externalEavesLengthMM:
    rightSideRingBeam.externalLengthMM,

  pitchDeg: rightSidePitchDeg,

  soffitDepthMM:
    rightCalculatedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.right.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasRightHip,
  ringBeamLengthMM:
    rightSideRingBeam.externalLengthMM,

  // Wall slot + intermediate side-jack slots + hip-seat slot.
  ringBeamBayWidthsMM:
    rightSideRingBeamLayout.bayWidthsMM,
});


  const plainRafterZoneStartMM = leftBossX;
const plainRafterZoneEndMM = rightBossX;
const plainRafterZoneWidthMM = centreWidth;
const rafterSpacingMM = Number(materials?.rafter_spacing_mm ?? 665);
const firstRafterCentreMM = Number(materials?.rafter_first_center_mm ?? 685);

const rafterCentres = [];

for (let c = firstRafterCentreMM; c < width; c += rafterSpacingMM) {
  let type = "plain";

  if (hasLeftHip && c < leftBossX) {
    type = "leftJack";
  } else if (hasRightHip && c > rightBossX) {
    type = "rightJack";
  }

  rafterCentres.push({
    centreMM: c,
    type,
  });
}

const leftJackRafters = rafterCentres.filter((r) => r.type === "leftJack");
const plainRafters = rafterCentres.filter((r) => r.type === "plain");
const rightJackRafters = rafterCentres.filter((r) => r.type === "rightJack");

const rafterSlotWidthMM = 48;
const rafterSlotHalfWidthMM = rafterSlotWidthMM / 2;

// The front ring-beam includes:
// - a left edge rafter slot;
// - every normal/jack rafter position;
// - a right edge rafter slot.
const frontRafterSlots = [
  {
    leftMM: 0,
    rightMM: Math.min(rafterSlotWidthMM, width),
    centreMM: Math.min(rafterSlotHalfWidthMM, width / 2),
    type: "edge-start",
  },

  ...rafterCentres.map((rafter) => ({
    leftMM: Math.max(
      0,
      Number(rafter.centreMM) - rafterSlotHalfWidthMM
    ),
    rightMM: Math.min(
      width,
      Number(rafter.centreMM) + rafterSlotHalfWidthMM
    ),
    centreMM: Number(rafter.centreMM),
    type: rafter.type,
  })),

  {
    leftMM: Math.max(0, width - rafterSlotWidthMM),
    rightMM: width,
    centreMM: Math.max(
      0,
      width - rafterSlotHalfWidthMM
    ),
    type: "edge-end",
  },
]
  .filter(
    (slot) =>
      Number.isFinite(slot.leftMM) &&
      Number.isFinite(slot.rightMM) &&
      slot.rightMM > slot.leftMM
  )
  .sort((a, b) => a.leftMM - b.leftMM);

// Clear width between consecutive 48 mm rafter slots.
// These are the individual ring-beam upstand widths.
const frontRingBeamBayWidthsMM = frontRafterSlots
  .slice(0, -1)
  .map((slot, index) => {
    const nextSlot = frontRafterSlots[index + 1];

    return Math.max(
      0,
      Number(nextSlot.leftMM) - Number(slot.rightMM)
    );
  })
  .filter((bayWidthMM) => bayWidthMM > 0);

 const frontFacet = buildFacet({
  id: "facet-front",
  label: "Front Facet",
  exists: true,

  internalEavesLengthMM: width,
  externalEavesLengthMM: externalWidthMM,

  pitchDeg: Number(pitchDeg) || 0,

  soffitDepthMM:
    effectiveFrontSoffitMM,

  plumbCutHeightMM:
    soffitRule.frontPlumbCutHeightMM,

  finishedFasciaHeightMM:
    soffitRule.frontFinishedFasciaHeightMM,

  fasciaOrderSizeMM:
    soffitRule.frontFasciaOrderSizeMM,

  hasRingBeam: true,
  ringBeamLengthMM: externalWidthMM,

  ringBeamBayWidthsMM:
    frontRingBeamBayWidthsMM,
});
const facets = [
  leftFacet,
  frontFacet,
  rightFacet,
].filter((facet) => facet.exists);

  return {
  ...base,

  frontPitchDeg: Number(pitchDeg) || 0,
  leftSidePitchDeg,
  rightSidePitchDeg,

  leftSideRingBeam,
  rightSideRingBeam,

  leftSideRingBeamLayout,
rightSideRingBeamLayout,

leftSideIntermediateJackCount:
  leftSideRingBeamLayout.intermediateJackRafterCount,

rightSideIntermediateJackCount:
  rightSideRingBeamLayout.intermediateJackRafterCount,

leftWallJackCount:
  leftSideRingBeamLayout.wallJackCount,

rightWallJackCount:
  rightSideRingBeamLayout.wallJackCount,

  facets,
  leftFacet,
  frontFacet,
  rightFacet,

  leftHipPitchDeg,
  rightHipPitchDeg,

  riseMM,

  plainRafterZoneStartMM,
  plainRafterZoneEndMM,
  plainRafterZoneWidthMM,

  leftHipTrueLengthMM,
  rightHipTrueLengthMM,
  leftHipManufacturingLengthMM,
  rightHipManufacturingLengthMM,
  leftHipExternalEdgeCutLengthMM,
  rightHipExternalEdgeCutLengthMM,
  leftHipTimberliteCutLengthMM,
  rightHipTimberliteCutLengthMM,

  leftHipPitchTrueLengthMM,
  rightHipPitchTrueLengthMM,
  leftHipPitchBasedCutMM,
  rightHipPitchBasedCutMM,

  leftHipManufactureTest,
  rightHipManufactureTest,

  rafterCentres,
  leftJackRafterCount: leftJackRafters.length,
  plainRafterCount: plainRafters.length,
  rightJackRafterCount: rightJackRafters.length,

  hipTopCutFaceOffsetMM: HIP_TOP_CUT_FACE_OFFSET_MM,
  sparHookToBossOffsetMM: SPAR_HOOK_TO_BOSS_OFFSET_MM,

  bossQty,
  sparHookQty,
  hipTopCutDeg,

  frontSoffitMM: effectiveFrontSoffitMM,
  leftCalculatedSoffitMM,
  rightCalculatedSoffitMM,

  requestedFrontSoffitMM: soffitRule.requestedFrontSoffitMM,
  effectiveFrontSoffitMM: soffitRule.effectiveFrontSoffitMM,

  frontFinishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

leftFinishedFasciaHeightMM:
  hasLeftHip
    ? facetEavesRule.commonFinishedFasciaHeightMM
    : 0,

rightFinishedFasciaHeightMM:
  hasRightHip
    ? facetEavesRule.commonFinishedFasciaHeightMM
    : 0,

frontFasciaAlignmentDatumMM:
  soffitRule.frontFasciaAlignmentDatumMM,

leftFasciaAlignmentDatumMM:
  soffitRule.leftFasciaAlignmentDatumMM,

rightFasciaAlignmentDatumMM:
  soffitRule.rightFasciaAlignmentDatumMM,

frontFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

leftFasciaOrderSizeMM:
  hasLeftHip
    ? facetEavesRule.commonFasciaOrderSizeMM
    : 0,

rightFasciaOrderSizeMM:
  hasRightHip
    ? facetEavesRule.commonFasciaOrderSizeMM
    : 0,

commonFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

fasciaOrderSizesMatch:
  soffitRule.fasciaOrderSizesMatch,

frontPlumbCutHeightMM:
  facetEavesRule.targetPlumbCutHeightMM,

leftPlumbCutHeightMM:
  hasLeftHip
    ? facetEavesRule.left.matchedPlumbCutHeightMM
    : 0,

rightPlumbCutHeightMM:
  hasRightHip
    ? facetEavesRule.right.matchedPlumbCutHeightMM
    : 0,
    
  frontSoffitAutoAdjusted: soffitRule.frontSoffitAutoAdjusted,
  minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,

  leftPlumbCutMatchedSoffitMM:
  soffitRule.leftPlumbCutMatchedSoffitMM,

rightPlumbCutMatchedSoffitMM:
  soffitRule.rightPlumbCutMatchedSoffitMM,

leftMatchedPlumbCutHeightMM:
  soffitRule.leftMatchedPlumbCutHeightMM,

rightMatchedPlumbCutHeightMM:
  soffitRule.rightMatchedPlumbCutHeightMM,

leftPlumbCutDifferenceMM:
  soffitRule.leftPlumbCutDifferenceMM,

rightPlumbCutDifferenceMM:
  soffitRule.rightPlumbCutDifferenceMM,

  leftMitreTrimAllowanceMM:
  soffitRule.leftMitreTrimAllowanceMM,

rightMitreTrimAllowanceMM:
  soffitRule.rightMitreTrimAllowanceMM,

leftRawManufacturedSoffitMM:
  soffitRule.leftRawManufacturedSoffitMM,

rightRawManufacturedSoffitMM:
  soffitRule.rightRawManufacturedSoffitMM,

leftRoundedManufacturedSoffitMM:
  soffitRule.leftRoundedManufacturedSoffitMM,

rightRoundedManufacturedSoffitMM:
  soffitRule.rightRoundedManufacturedSoffitMM,

  facetEavesReferenceSoffitMM:
  facetEavesRule.effectiveReferenceSoffitMM,

facetEavesCommonPlumbCutMM:
  facetEavesRule.targetPlumbCutHeightMM,

facetEavesCommonFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

facetEavesCommonFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

facetEavesLeftMatchedSoffitMM:
  facetEavesRule.left.matchedSoffitMM,

facetEavesLeftMitreTrimMM:
  facetEavesRule.left.mitreTrimAllowanceMM,

facetEavesLeftRawManufacturedSoffitMM:
  facetEavesRule.left.rawManufacturedSoffitMM,

facetEavesLeftManufacturedSoffitMM:
  facetEavesRule.left.manufacturedSoffitMM,

facetEavesRightMatchedSoffitMM:
  facetEavesRule.right.matchedSoffitMM,

facetEavesRightMitreTrimMM:
  facetEavesRule.right.mitreTrimAllowanceMM,

facetEavesRightRawManufacturedSoffitMM:
  facetEavesRule.right.rawManufacturedSoffitMM,

facetEavesRightManufacturedSoffitMM:
  facetEavesRule.right.manufacturedSoffitMM,

  externalWidthMM,
  externalProjectionMM,

  roofType: "hippedLeanTo",

  widthMM: width,
  projectionMM: projection,

  hippedSides,
  hasLeftHip,
  hasRightHip,

  leftWall,
rightWall,

leftBoundaryType: hasLeftHip
  ? "hipped"
  : leftWall
    ? "wall"
    : "open",

rightBoundaryType: hasRightHip
  ? "hipped"
  : rightWall
    ? "wall"
    : "open",

leftExternalAllowanceMM,
rightExternalAllowanceMM,

  leftHipWidthMM: leftHipWidth,
  rightHipWidthMM: rightHipWidth,
  centreWidthMM: centreWidth,

  leftBossXMM: leftBossX,
  rightBossXMM: rightBossX,

  leftHipPlanLengthMM: hipPlanLengthLeft,
  rightHipPlanLengthMM: hipPlanLengthRight,

  points: {
    frontLeft: { x: 0, y: 0 },
    frontRight: { x: width, y: 0 },
    backLeft: { x: 0, y: projection },
    backRight: { x: width, y: projection },

    leftBoss: hasLeftHip ? { x: leftBossX, y: projection } : null,
    rightBoss: hasRightHip ? { x: rightBossX, y: projection } : null,
  },
};
}