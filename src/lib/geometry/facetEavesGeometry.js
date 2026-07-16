// src/lib/geometry/facetEavesGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (toFiniteNumber(degrees) * Math.PI) / 180;

/**
 * Finds the soffit depth that produces a specified vertical
 * rafter foot/plumb cut at a given pitch.
 *
 * This numerically reproduces the workshop operation of placing
 * two rafter templates together with their internal foot-cut
 * corners flush and matching their vertical cuts.
 */
const solveSoffitForTargetPlumbCut = ({
  targetPlumbCutHeightMM,
  pitchDeg,
  materials,
  minimumSoffitMM = 25,
  maximumSoffitMM = 1000,
}) => {
  const minimumMM = Math.max(
    0,
    toFiniteNumber(minimumSoffitMM, 25)
  );

  const maximumMM = Math.max(
    minimumMM,
    toFiniteNumber(maximumSoffitMM, 1000)
  );

  const targetMM = Math.max(
    0,
    toFiniteNumber(targetPlumbCutHeightMM)
  );

  const evaluate = (soffitDepthMM) => {
    const geometry = calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg,
      soffitDepthMM,
      materials,
    });

    const plumbCutHeightMM = toFiniteNumber(
      geometry?.plumbCutHeight
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

  const COARSE_STEP_MM = 20;

  let bestResult = evaluate(minimumMM);

  // Coarse search to find the best 20 mm region.
  for (
    let soffitMM = minimumMM;
    soffitMM <= maximumMM;
    soffitMM += COARSE_STEP_MM
  ) {
    const result = evaluate(soffitMM);

    if (result.differenceMM < bestResult.differenceMM) {
      bestResult = result;
    }
  }

  // One-millimetre refinement around the best coarse result.
  const fineStartMM = Math.max(
    minimumMM,
    bestResult.soffitDepthMM - COARSE_STEP_MM
  );

  const fineEndMM = Math.min(
    maximumMM,
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

/**
 * Calculates the common eaves geometry for facets meeting at a
 * 90-degree mitred corner.
 *
 * Workshop method represented here:
 *
 * 1. Cut one template at each facet pitch.
 * 2. Place the internal foot-cut corners flush.
 * 3. Match the vertical plumb cuts.
 * 4. Remove the unequal-pitch triangular projection with the
 *    square mitre cut.
 * 5. Round the resulting manufactured soffit upward.
 *
 * This helper contains no React, pricing or roof-style logic.
 */
export function solveFacetEavesGeometry({
  requestedReferenceSoffitMM,

  referencePitchDeg,
  leftPitchDeg = 0,
  rightPitchDeg = 0,

  hasLeftFacet = false,
  hasRightFacet = false,

  materials,

  minimumSoffitMM = 25,
  manufacturingRoundIncrementMM = 5,
}) {
  const requestedSoffitMM = Math.max(
    0,
    toFiniteNumber(requestedReferenceSoffitMM)
  );

  const resolvedReferencePitchDeg =
    toFiniteNumber(referencePitchDeg);

  const referenceGeometry = calculateLeanToGeometry({
    widthMM: 1000,
    projectionMM: 1000,
    pitchDeg: resolvedReferencePitchDeg,
    soffitDepthMM: requestedSoffitMM,
    materials,
  });

  const targetPlumbCutHeightMM = Math.max(
    0,
    toFiniteNumber(referenceGeometry?.plumbCutHeight)
  );

  const rafterDepthMM = Math.max(
    0,
    toFiniteNumber(
      materials?.rafter_depth_mm ??
        referenceGeometry?.raw?.rafterDepthMM,
      220
    )
  );

  const roundIncrementMM = Math.max(
    1,
    toFiniteNumber(
      manufacturingRoundIncrementMM,
      5
    )
  );

  const buildAdjacentFacetResult = ({
    exists,
    pitchDeg,
  }) => {
    if (!exists) {
      return {
        exists: false,

        pitchDeg: 0,

        matchedSoffitMM: 0,
        matchedPlumbCutHeightMM: 0,
        plumbCutDifferenceMM: 0,

        mitreTrimAllowanceMM: 0,
        rawManufacturedSoffitMM: 0,
        manufacturedSoffitMM: 0,

        geometry: null,
      };
    }

    const resolvedPitchDeg = toFiniteNumber(pitchDeg);

    const matched = solveSoffitForTargetPlumbCut({
      targetPlumbCutHeightMM,
      pitchDeg: resolvedPitchDeg,
      materials,
      minimumSoffitMM,
    });

    // At a 90-degree mitre, unequal-pitch profiles have different
    // outer projections. The excess triangular projection is
    // removed by the square mitre cut.
    const mitreTrimAllowanceMM =
      rafterDepthMM *
      Math.abs(
        Math.sin(degToRad(resolvedPitchDeg)) -
          Math.sin(
            degToRad(resolvedReferencePitchDeg)
          )
      );

    const rawManufacturedSoffitMM =
      toFiniteNumber(matched?.soffitDepthMM) +
      mitreTrimAllowanceMM;

    const manufacturedSoffitMM =
      Math.ceil(
        rawManufacturedSoffitMM /
          roundIncrementMM
      ) * roundIncrementMM;

    return {
      exists: true,

      pitchDeg: resolvedPitchDeg,

      matchedSoffitMM:
        toFiniteNumber(matched?.soffitDepthMM),

      matchedPlumbCutHeightMM:
        toFiniteNumber(matched?.plumbCutHeightMM),

      plumbCutDifferenceMM:
        toFiniteNumber(matched?.differenceMM),

      mitreTrimAllowanceMM,

      rawManufacturedSoffitMM,
      manufacturedSoffitMM,

      geometry: matched?.geometry ?? null,
    };
  };

  const left = buildAdjacentFacetResult({
    exists: hasLeftFacet,
    pitchDeg: leftPitchDeg,
  });

  const right = buildAdjacentFacetResult({
    exists: hasRightFacet,
    pitchDeg: rightPitchDeg,
  });

  return {
    requestedReferenceSoffitMM: requestedSoffitMM,
    effectiveReferenceSoffitMM: requestedSoffitMM,

    referencePitchDeg:
      resolvedReferencePitchDeg,

    targetPlumbCutHeightMM,

    commonFinishedFasciaHeightMM:
      toFiniteNumber(referenceGeometry?.fasciaHeight),

    commonFasciaOrderSizeMM:
      toFiniteNumber(referenceGeometry?.fasciaOrderSize),

    minimumSoffitMM: Math.max(
      0,
      toFiniteNumber(minimumSoffitMM, 25)
    ),

    manufacturingRoundIncrementMM:
      roundIncrementMM,

    rafterDepthMM,

    referenceGeometry,

    left,
    right,
  };
}