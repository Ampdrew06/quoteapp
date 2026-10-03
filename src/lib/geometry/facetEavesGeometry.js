// src/lib/geometry/facetEavesGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (toFiniteNumber(degrees) * Math.PI) / 180;

const roundUpToIncrement = (value, increment) => {
  const resolvedIncrement = Math.max(
    0.1,
    toFiniteNumber(increment, 1)
  );

  return (
    Math.ceil(
      toFiniteNumber(value) / resolvedIncrement
    ) * resolvedIncrement
  );
};

const normaliseSideSoffitControl = (control) => {
  const mode = String(control?.mode ?? "automatic");

  if (mode !== "specified" && mode !== "none") {
    return null;
  }

  return {
    mode,
    side: control?.side === "right" ? "right" : "left",
    requestedProjectionMM: Math.max(
      0,
      toFiniteNumber(control?.requestedProjectionMM)
    ),
  };
};

/**
 * Creates a rafter-foot profile at a supplied pitch.
 *
 * The profile depth is the nominal timber depth.
 *
 * A manufacturing tolerance may be retained in the returned
 * diagnostics, but it must not enlarge the timber used by the
 * geometry. Front and side profiles are cut from the same stock.
 *
 * The formula is:
 *
 * projected profile height
 *   = effective profile depth / cos(pitch)
 *
 * vertical foot cut
 *   = projected profile height
 *     - horizontal foot run × tan(pitch)
 */
const calculateFacetFootProfile = ({
  pitchDeg,
  horizontalFootRunMM,
  frameThicknessMM,
  rafterDepthMM,
  profileToleranceMM,
}) => {
  const resolvedPitchDeg =
    toFiniteNumber(pitchDeg);

  const pitchRad = degToRad(resolvedPitchDeg);

  const cosPitch = Math.cos(pitchRad);
  const tanPitch = Math.tan(pitchRad);

  const resolvedFrameThicknessMM = Math.max(
    0,
    toFiniteNumber(frameThicknessMM, 70)
  );

  const resolvedRafterDepthMM = Math.max(
    0,
    toFiniteNumber(rafterDepthMM, 220)
  );

  const resolvedProfileToleranceMM = Math.max(
    0,
    toFiniteNumber(profileToleranceMM, 5)
  );

  const effectiveProfileDepthMM =
    resolvedRafterDepthMM;

  const resolvedHorizontalFootRunMM = Math.max(
    0,
    toFiniteNumber(horizontalFootRunMM)
  );

  if (
    Math.abs(cosPitch) < 0.000001 ||
    Math.abs(tanPitch) < 0.000001
  ) {
    return {
      valid: false,

      pitchDeg: resolvedPitchDeg,

      horizontalFootRunMM:
        resolvedHorizontalFootRunMM,

      soffitDepthMM: 0,
      verticalFootCutMM: 0,

      projectedProfileHeightMM: 0,
      verticalFallAcrossFootMM: 0,

      frameThicknessMM:
        resolvedFrameThicknessMM,

      rafterDepthMM:
        resolvedRafterDepthMM,

      profileToleranceMM:
        resolvedProfileToleranceMM,

      effectiveProfileDepthMM,
    };
  }

  const projectedProfileHeightMM =
    effectiveProfileDepthMM / cosPitch;

  const verticalFallAcrossFootMM =
    resolvedHorizontalFootRunMM * tanPitch;

  const verticalFootCutMM =
    projectedProfileHeightMM -
    verticalFallAcrossFootMM;

  const soffitDepthMM =
    resolvedHorizontalFootRunMM -
    resolvedFrameThicknessMM;

  return {
    valid: true,

    pitchDeg: resolvedPitchDeg,

    horizontalFootRunMM:
      resolvedHorizontalFootRunMM,

    soffitDepthMM,

    verticalFootCutMM,

    projectedProfileHeightMM,
    verticalFallAcrossFootMM,

    frameThicknessMM:
      resolvedFrameThicknessMM,

    rafterDepthMM:
      resolvedRafterDepthMM,

    profileToleranceMM:
      resolvedProfileToleranceMM,

    effectiveProfileDepthMM,
  };
};

/**
 * Solves the complete horizontal foot run required at the
 * adjacent facet pitch so its vertical foot cut matches the
 * front/reference vertical foot cut.
 *
 * Rearranged formula:
 *
 * HFC =
 *   (projected profile height - target VFC)
 *   / tan(pitch)
 */
const solveFacetForTargetVerticalFootCut = ({
  targetVerticalFootCutMM,
  pitchDeg,
  frameThicknessMM,
  rafterDepthMM,
  profileToleranceMM,
  minimumSoffitMM,
  manufacturingRoundIncrementMM,
  manufacturingClearanceMM,
}) => {
  const resolvedPitchDeg =
    toFiniteNumber(pitchDeg);

  const pitchRad = degToRad(resolvedPitchDeg);

  const cosPitch = Math.cos(pitchRad);
  const tanPitch = Math.tan(pitchRad);

  const resolvedFrameThicknessMM = Math.max(
    0,
    toFiniteNumber(frameThicknessMM, 70)
  );

  const resolvedRafterDepthMM = Math.max(
    0,
    toFiniteNumber(rafterDepthMM, 220)
  );

  const resolvedProfileToleranceMM = Math.max(
    0,
    toFiniteNumber(profileToleranceMM, 5)
  );

  const resolvedMinimumSoffitMM = Math.max(
    0,
    toFiniteNumber(minimumSoffitMM, 25)
  );

  const resolvedManufacturingClearanceMM = Math.max(
    0,
    toFiniteNumber(manufacturingClearanceMM, 2)
  );

  // Use the same nominal stock depth as the reference/front
  // profile. The tolerance is a workshop allowance only; adding
  // it here previously treated a 220 mm side rafter as 225 mm and
  // incorrectly increased the calculated side HFC.
  const effectiveProfileDepthMM =
    resolvedRafterDepthMM;

  const targetVFC = Math.max(
    0,
    toFiniteNumber(targetVerticalFootCutMM)
  );

  if (
    Math.abs(cosPitch) < 0.000001 ||
    Math.abs(tanPitch) < 0.000001
  ) {
    return {
      valid: false,
      minimumSatisfied: false,

      pitchDeg: resolvedPitchDeg,

      matchedSoffitMM: 0,
      matchedHorizontalFootRunMM: 0,

      matchedPlumbCutHeightMM: 0,
      plumbCutDifferenceMM: targetVFC,

      manufacturedSoffitMM: 0,
      manufacturedHorizontalFootRunMM: 0,
      timberHorizontalFootCutMM: 0,
      manufacturedPlumbCutHeightMM: 0,
      manufacturingClearanceMM:
        resolvedManufacturingClearanceMM,

      mitreTrimAllowanceMM: 0,
      rawManufacturedSoffitMM: 0,

      geometry: null,
    };
  }

  const projectedProfileHeightMM =
    effectiveProfileDepthMM / cosPitch;

  const matchedHorizontalFootRunMM =
    (
      projectedProfileHeightMM -
      targetVFC
    ) / tanPitch;

  const matchedSoffitMM =
    matchedHorizontalFootRunMM -
    resolvedFrameThicknessMM;

  const profile = calculateFacetFootProfile({
    pitchDeg: resolvedPitchDeg,

    horizontalFootRunMM:
      matchedHorizontalFootRunMM,

    frameThicknessMM:
      resolvedFrameThicknessMM,

    rafterDepthMM:
      resolvedRafterDepthMM,

    profileToleranceMM:
      resolvedProfileToleranceMM,
  });

  const matchedPlumbCutHeightMM =
    toFiniteNumber(profile.verticalFootCutMM);

  const plumbCutDifferenceMM = Math.abs(
    matchedPlumbCutHeightMM -
    targetVFC
  );

  const minimumSatisfied =
    matchedSoffitMM >=
    resolvedMinimumSoffitMM;

  /*
   * Manufacturing rounding is retained as a separate output.
   *
   * It is NOT used to determine the design external width,
   * because rounding changes the exact matched VFC slightly.
   */
  const manufacturedSoffitMM =
    roundUpToIncrement(
      Math.max(0, matchedSoffitMM),
      manufacturingRoundIncrementMM
    );

  const manufacturedHorizontalFootRunMM =
    resolvedFrameThicknessMM +
    manufacturedSoffitMM;

  // The rounded dimension belongs to the 9 mm ply base. Timber
  // members finish slightly inside that external edge so normal
  // timber and cutting variation cannot leave them standing proud.
  const timberHorizontalFootCutMM = Math.max(
    0,
    manufacturedHorizontalFootRunMM -
      resolvedManufacturingClearanceMM
  );

  const manufacturedTimberProfile =
    calculateFacetFootProfile({
      pitchDeg: resolvedPitchDeg,
      horizontalFootRunMM:
        timberHorizontalFootCutMM,
      frameThicknessMM:
        resolvedFrameThicknessMM,
      rafterDepthMM:
        resolvedRafterDepthMM,
      profileToleranceMM:
        resolvedProfileToleranceMM,
    });

  const manufacturedPlumbCutHeightMM =
    toFiniteNumber(
      manufacturedTimberProfile.verticalFootCutMM
    );

  return {
    valid:
      Number.isFinite(matchedSoffitMM) &&
      matchedHorizontalFootRunMM > 0,

    minimumSatisfied,

    pitchDeg: resolvedPitchDeg,

    matchedSoffitMM,
    matchedHorizontalFootRunMM,

    matchedPlumbCutHeightMM,
    plumbCutDifferenceMM,

    manufacturedSoffitMM,
    manufacturedHorizontalFootRunMM,
    timberHorizontalFootCutMM,
    manufacturedPlumbCutHeightMM,
    manufacturingClearanceMM:
      resolvedManufacturingClearanceMM,

    /*
     * Compatibility fields.
     *
     * The old separate mitre allowance is deliberately zero.
     */
    mitreTrimAllowanceMM: 0,

    rawManufacturedSoffitMM:
      matchedSoffitMM,

    geometry: {
      pitchDeg: resolvedPitchDeg,

      plumbCutHeight:
        matchedPlumbCutHeightMM,

      soffitDepthEffective:
        matchedSoffitMM,

      raw: {
        pitchDeg: resolvedPitchDeg,

        effectiveSoffitMM:
          matchedSoffitMM,

        frameThicknessMM:
          resolvedFrameThicknessMM,

        horizontalExtensionMM:
          matchedHorizontalFootRunMM,

        manufacturedBaseWidthMM:
          manufacturedHorizontalFootRunMM,

        manufacturedHorizontalFootCutMM:
          timberHorizontalFootCutMM,

        rafterFootClearanceMM:
          resolvedManufacturingClearanceMM,

        verticalDropMM:
          profile.verticalFallAcrossFootMM,

        plumbCutHeightMM:
          matchedPlumbCutHeightMM,

        manufacturedPlumbCutHeightMM,

        rafterDepthMM:
          resolvedRafterDepthMM,

        profileToleranceMM:
          resolvedProfileToleranceMM,

        effectiveProfileDepthMM,

        projectedProfileHeightMM:
          profile.projectedProfileHeightMM,
      },
    },
  };
};

/**
 * Calculates the front and adjacent facet eaves geometry.
 *
 * Rules:
 *
 * 1. Begin with the requested front soffit.
 * 2. Obtain the established Lean-To front VFC.
 * 3. Solve each active side HFC so its VFC equals the front VFC.
 * 4. Every active side soffit must be at least the configured minimum.
 * 5. If not, adjust the front soffit to the nearest valid value and
 *    recalculate all facets.
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
  manufacturingClearanceMM = 2,

  // Optional reverse-solving rule. When present, the selected side
  // establishes the common VFC and the front is derived from it.
  sideSoffitControl = null,
  fasciaThicknessMM = 10,
  plyProjectionAllowanceMM = 5,
  fasciaLipMM,

  minimumReferenceSoffitMM = 25,
  maximumReferenceSoffitMM = 1000,
}) {
  const requestedSoffitMM = Math.max(
    0,
    toFiniteNumber(requestedReferenceSoffitMM)
  );

  const resolvedReferencePitchDeg =
    toFiniteNumber(referencePitchDeg);

  const resolvedMinimumSoffitMM = Math.max(
    0,
    toFiniteNumber(minimumSoffitMM, 25)
  );

  const resolvedMinimumReferenceSoffitMM =
    Math.max(
      0,
      toFiniteNumber(
        minimumReferenceSoffitMM,
        25
      )
    );

  const resolvedMaximumReferenceSoffitMM =
    Math.max(
      resolvedMinimumReferenceSoffitMM,
      toFiniteNumber(
        maximumReferenceSoffitMM,
        1000
      )
    );

  const frameThicknessMM = Math.max(
    0,
    toFiniteNumber(
      materials?.side_frame_thickness_mm,
      70
    )
  );

  const rafterDepthMM = Math.max(
    0,
    toFiniteNumber(
      materials?.rafter_depth_mm,
      220
    )
  );

  /*
   * This is the previously agreed practical profile tolerance.
   * It does not change the nominal 220 mm timber size.
   */
  const profileToleranceMM = Math.max(
    0,
    toFiniteNumber(
      materials?.rafter_profile_tolerance_mm,
      5
    )
  );

  const roundIncrementMM = Math.max(
    0.1,
    toFiniteNumber(
      manufacturingRoundIncrementMM,
      5
    )
  );

  const resolvedManufacturingClearanceMM = Math.max(
    0,
    toFiniteNumber(manufacturingClearanceMM, 2)
  );

  const resolvedSideSoffitControl =
    normaliseSideSoffitControl(sideSoffitControl);

  const resolvedFasciaThicknessMM = Math.max(
    0,
    toFiniteNumber(fasciaThicknessMM, 10)
  );

  const resolvedPlyProjectionAllowanceMM = Math.max(
    0,
    toFiniteNumber(plyProjectionAllowanceMM, 5)
  );

  const resolvedFasciaLipMM = Math.max(
    0,
    toFiniteNumber(
      fasciaLipMM ?? materials?.fascia_lip_mm,
      25
    )
  );

  const evaluateReferenceSoffit = (
    referenceSoffitMM
  ) => {
    const referenceGeometry =
      calculateLeanToGeometry({
        widthMM: 1000,
        projectionMM: 1000,

        pitchDeg:
          resolvedReferencePitchDeg,

        soffitDepthMM:
          referenceSoffitMM,

        materials,
      });

    const targetPlumbCutHeightMM = Math.max(
      0,
      toFiniteNumber(
        referenceGeometry?.plumbCutHeight
      )
    );

    const buildSide = ({
      exists,
      pitchDeg,
    }) => {
      if (!exists) {
        return {
          exists: false,
          valid: true,
          minimumSatisfied: true,

          pitchDeg: 0,

          matchedSoffitMM: 0,
          matchedHorizontalFootRunMM: 0,

          matchedPlumbCutHeightMM: 0,
          plumbCutDifferenceMM: 0,

          manufacturedSoffitMM: 0,
          manufacturedHorizontalFootRunMM: 0,
          timberHorizontalFootCutMM: 0,
          manufacturedPlumbCutHeightMM: 0,
          manufacturingClearanceMM:
            resolvedManufacturingClearanceMM,

          mitreTrimAllowanceMM: 0,
          rawManufacturedSoffitMM: 0,

          geometry: null,
        };
      }

      return {
        exists: true,

        ...solveFacetForTargetVerticalFootCut({
          targetVerticalFootCutMM:
            targetPlumbCutHeightMM,

          pitchDeg,

          frameThicknessMM,
          rafterDepthMM,
          profileToleranceMM,

          minimumSoffitMM:
            resolvedMinimumSoffitMM,

          manufacturingRoundIncrementMM:
            roundIncrementMM,

          manufacturingClearanceMM:
            resolvedManufacturingClearanceMM,
        }),
      };
    };

    const left = buildSide({
      exists: hasLeftFacet,
      pitchDeg: leftPitchDeg,
    });

    const right = buildSide({
      exists: hasRightFacet,
      pitchDeg: rightPitchDeg,
    });

    const valid =
      left.valid &&
      right.valid &&
      left.minimumSatisfied &&
      right.minimumSatisfied;

    return {
      valid,

      effectiveReferenceSoffitMM:
        referenceSoffitMM,

      referenceGeometry,
      targetPlumbCutHeightMM,

      left,
      right,
    };
  };

  /*
   * Explicit side-soffit mode.
   *
   * The customer's dimension is the complete projection from the
   * external frame edge to the external fascia face. It therefore
   * drives the side ply-base width and the side timber foot cut.
   *
   * "none" is a separate construction rule: retain only the
   * compulsory 25 mm finishing-fascia lip outside the frame.
   */
  if (resolvedSideSoffitControl) {
    const requestedControllingSide =
      resolvedSideSoffitControl.side;

    const controllingSide =
      requestedControllingSide === "left" && !hasLeftFacet && hasRightFacet
        ? "right"
        : requestedControllingSide === "right" && !hasRightFacet && hasLeftFacet
          ? "left"
          : requestedControllingSide;

    const controllingSideExists =
      controllingSide === "left"
        ? hasLeftFacet
        : hasRightFacet;

    const controllingPitchDeg =
      controllingSide === "left"
        ? leftPitchDeg
        : rightPitchDeg;

    if (controllingSideExists) {
      const controllingPlyBaseWidthMM =
        resolvedSideSoffitControl.mode === "none"
          ? frameThicknessMM + resolvedFasciaLipMM
          : Math.max(
              0,
              frameThicknessMM +
                resolvedSideSoffitControl.requestedProjectionMM -
                resolvedFasciaThicknessMM -
                resolvedPlyProjectionAllowanceMM
            );

      const controllingTimberFootCutMM = Math.max(
        0,
        controllingPlyBaseWidthMM -
          resolvedManufacturingClearanceMM
      );

      const controllingProfile = calculateFacetFootProfile({
        pitchDeg: controllingPitchDeg,
        horizontalFootRunMM: controllingTimberFootCutMM,
        frameThicknessMM,
        rafterDepthMM,
        profileToleranceMM,
      });

      const targetPlumbCutHeightMM = Math.max(
        0,
        toFiniteNumber(controllingProfile.verticalFootCutMM)
      );

      const solveAtPitch = (pitch) =>
        solveFacetForTargetVerticalFootCut({
          targetVerticalFootCutMM: targetPlumbCutHeightMM,
          pitchDeg: pitch,
          frameThicknessMM,
          rafterDepthMM,
          profileToleranceMM,
          minimumSoffitMM: 0,
          manufacturingRoundIncrementMM: roundIncrementMM,
          manufacturingClearanceMM:
            resolvedManufacturingClearanceMM,
        });

      const reference = solveAtPitch(
        resolvedReferencePitchDeg
      );

      const makeMissingSide = () => ({
        exists: false,
        valid: true,
        minimumSatisfied: true,
        pitchDeg: 0,
        matchedSoffitMM: 0,
        matchedHorizontalFootRunMM: 0,
        matchedPlumbCutHeightMM: 0,
        plumbCutDifferenceMM: 0,
        manufacturedSoffitMM: 0,
        manufacturedHorizontalFootRunMM: 0,
        timberHorizontalFootCutMM: 0,
        manufacturedPlumbCutHeightMM: 0,
        manufacturingClearanceMM:
          resolvedManufacturingClearanceMM,
        mitreTrimAllowanceMM: 0,
        rawManufacturedSoffitMM: 0,
        geometry: null,
      });

      const makeControlledSide = () => ({
        exists: true,
        valid: controllingProfile.valid,
        minimumSatisfied: true,
        pitchDeg: toFiniteNumber(controllingPitchDeg),
        matchedSoffitMM:
          controllingTimberFootCutMM - frameThicknessMM,
        matchedHorizontalFootRunMM:
          controllingTimberFootCutMM,
        matchedPlumbCutHeightMM:
          targetPlumbCutHeightMM,
        plumbCutDifferenceMM: 0,
        manufacturedSoffitMM:
          controllingPlyBaseWidthMM - frameThicknessMM,
        manufacturedHorizontalFootRunMM:
          controllingPlyBaseWidthMM,
        timberHorizontalFootCutMM:
          controllingTimberFootCutMM,
        manufacturedPlumbCutHeightMM:
          targetPlumbCutHeightMM,
        manufacturingClearanceMM:
          resolvedManufacturingClearanceMM,
        mitreTrimAllowanceMM: 0,
        rawManufacturedSoffitMM:
          controllingPlyBaseWidthMM - frameThicknessMM,
        geometry: {
          pitchDeg: toFiniteNumber(controllingPitchDeg),
          plumbCutHeight: targetPlumbCutHeightMM,
          soffitDepthEffective:
            controllingPlyBaseWidthMM - frameThicknessMM,
          raw: {
            pitchDeg: toFiniteNumber(controllingPitchDeg),
            effectiveSoffitMM:
              controllingPlyBaseWidthMM - frameThicknessMM,
            frameThicknessMM,
            horizontalExtensionMM:
              controllingTimberFootCutMM,
            manufacturedBaseWidthMM:
              controllingPlyBaseWidthMM,
            manufacturedHorizontalFootCutMM:
              controllingTimberFootCutMM,
            rafterFootClearanceMM:
              resolvedManufacturingClearanceMM,
            verticalDropMM:
              controllingProfile.verticalFallAcrossFootMM,
            plumbCutHeightMM:
              targetPlumbCutHeightMM,
            manufacturedPlumbCutHeightMM:
              targetPlumbCutHeightMM,
            rafterDepthMM,
            profileToleranceMM,
            effectiveProfileDepthMM: rafterDepthMM,
            projectedProfileHeightMM:
              controllingProfile.projectedProfileHeightMM,
          },
        },
      });

      const buildSideFromConstraint = (side, exists, pitch) => {
        if (!exists) return makeMissingSide();
        if (side === controllingSide) return makeControlledSide();

        return {
          exists: true,
          ...solveAtPitch(pitch),
        };
      };

      const left = buildSideFromConstraint(
        "left",
        hasLeftFacet,
        leftPitchDeg
      );

      const right = buildSideFromConstraint(
        "right",
        hasRightFacet,
        rightPitchDeg
      );

      const referenceBaseWidthMM = roundUpToIncrement(
        reference.matchedHorizontalFootRunMM +
          resolvedManufacturingClearanceMM +
          resolvedPlyProjectionAllowanceMM,
        roundIncrementMM
      );

      const effectiveReferenceSoffitMM = Math.max(
        0,
        referenceBaseWidthMM -
          frameThicknessMM -
          resolvedPlyProjectionAllowanceMM
      );

      const referenceGeometry = calculateLeanToGeometry({
        widthMM: 1000,
        projectionMM: 1000,
        pitchDeg: resolvedReferencePitchDeg,
        soffitDepthMM: effectiveReferenceSoffitMM,
        materials,
      });

      return {
        requestedReferenceSoffitMM: requestedSoffitMM,
        effectiveReferenceSoffitMM,
        referenceSoffitAdjusted: true,
        referenceSoffitAdjustmentMM:
          effectiveReferenceSoffitMM - requestedSoffitMM,
        adjustmentReason: "side-soffit-control",
        solutionValid:
          controllingProfile.valid && reference.valid,
        referencePitchDeg: resolvedReferencePitchDeg,
        targetPlumbCutHeightMM,
        commonFinishedFasciaHeightMM: toFiniteNumber(
          referenceGeometry?.fasciaHeight
        ),
        commonFasciaOrderSizeMM: toFiniteNumber(
          referenceGeometry?.fasciaOrderSize
        ),
        minimumSoffitMM: resolvedMinimumSoffitMM,
        manufacturingRoundIncrementMM: roundIncrementMM,
        manufacturingClearanceMM:
          resolvedManufacturingClearanceMM,
        referenceBaseWidthMM,
        referenceTimberHorizontalFootCutMM:
          reference.matchedHorizontalFootRunMM,
        frameThicknessMM,
        rafterDepthMM,
        profileToleranceMM,
        referenceGeometry,
        left,
        right,
        sideSoffitControl: {
          ...resolvedSideSoffitControl,
          side: controllingSide,
          plyBaseWidthMM: controllingPlyBaseWidthMM,
          timberHorizontalFootCutMM:
            controllingTimberFootCutMM,
        },
      };
    }
  }

  /*
   * First test the requested front soffit.
   */
  let resolved =
    evaluateReferenceSoffit(
      requestedSoffitMM
    );

  /*
   * If either active side falls below the minimum,
   * search outwards from the requested front soffit.
   *
   * This finds the smallest possible front-soffit change.
   */
  if (!resolved.valid) {
    const MAX_ADJUSTMENT_MM =
      Math.max(
        requestedSoffitMM -
          resolvedMinimumReferenceSoffitMM,

        resolvedMaximumReferenceSoffitMM -
          requestedSoffitMM
      );

    for (
      let adjustmentMM = 1;
      adjustmentMM <= MAX_ADJUSTMENT_MM;
      adjustmentMM += 1
    ) {
      const lowerCandidate =
        requestedSoffitMM -
        adjustmentMM;

      const upperCandidate =
        requestedSoffitMM +
        adjustmentMM;

      if (
        lowerCandidate >=
        resolvedMinimumReferenceSoffitMM
      ) {
        const lowerResult =
          evaluateReferenceSoffit(
            lowerCandidate
          );

        if (lowerResult.valid) {
          resolved = lowerResult;
          break;
        }
      }

      if (
        upperCandidate <=
        resolvedMaximumReferenceSoffitMM
      ) {
        const upperResult =
          evaluateReferenceSoffit(
            upperCandidate
          );

        if (upperResult.valid) {
          resolved = upperResult;
          break;
        }
      }
    }
  }

  const effectiveReferenceSoffitMM =
    resolved.effectiveReferenceSoffitMM;

  const referenceSoffitAdjusted =
    Math.abs(
      effectiveReferenceSoffitMM -
      requestedSoffitMM
    ) > 0.0001;

  return {
    requestedReferenceSoffitMM:
      requestedSoffitMM,

    effectiveReferenceSoffitMM,

    referenceSoffitAdjusted,

    referenceSoffitAdjustmentMM:
      effectiveReferenceSoffitMM -
      requestedSoffitMM,

    adjustmentReason:
      referenceSoffitAdjusted
        ? "minimum-side-soffit"
        : null,

    solutionValid: resolved.valid,

    referencePitchDeg:
      resolvedReferencePitchDeg,

    targetPlumbCutHeightMM:
      resolved.targetPlumbCutHeightMM,

    commonFinishedFasciaHeightMM:
      toFiniteNumber(
        resolved.referenceGeometry?.fasciaHeight
      ),

    commonFasciaOrderSizeMM:
      toFiniteNumber(
        resolved.referenceGeometry
          ?.fasciaOrderSize
      ),

    minimumSoffitMM:
      resolvedMinimumSoffitMM,

    manufacturingRoundIncrementMM:
      roundIncrementMM,

    manufacturingClearanceMM:
      resolvedManufacturingClearanceMM,

    // The front ply extends 5 mm beyond the nominal soffit datum.
    // This preserves the established 150 mm input while correctly
    // manufacturing a 225 mm base on a 70 mm frame.
    referenceBaseWidthMM:
      frameThicknessMM +
      effectiveReferenceSoffitMM +
      profileToleranceMM,

    referenceTimberHorizontalFootCutMM:
      toFiniteNumber(
        resolved.referenceGeometry?.raw
          ?.manufacturedHorizontalFootCutMM,
        Math.max(
          0,
          frameThicknessMM +
            effectiveReferenceSoffitMM -
            resolvedManufacturingClearanceMM
        )
      ),

    frameThicknessMM,
    rafterDepthMM,
    profileToleranceMM,

    referenceGeometry:
      resolved.referenceGeometry,

    left: resolved.left,
    right: resolved.right,
  };
}
