// src/lib/manufacturing/facetGeometryBuilder.js

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
};

const degToRad = (degrees) =>
  (toFiniteNumber(degrees) * Math.PI) / 180;

/**
*Builds the resolved geometry for one Timberlite roof facet.

 *The returned geometry is independent of roof style and
 *can be reused by Lean-To, Hipped Lean-To, Edwardian,
 *Victorian and future roof types.
 *
 * This builder deliberately knows nothing about:
 *
 * - Hipped Lean-To
 * - Edwardian
 * - Victorian
 * - roof pricing
 * - React
 * - rafter spacing
 *
 * It receives already-resolved design geometry and returns
 * the resulting physical intersection dimensions.
 *
 * Reference geometry:
 *
 * A = top of vertical foot cut
 * B = bottom/outside of vertical foot cut
 * C = inside end of horizontal foot cut
 * D = inner wall-bar / inner wallplate intersection
 * E = outer wall-bar / outer wallplate intersection
 *
 * HP   = horizontal distance C → vertical projection of E
 * EWBS = external wall-bar slope A → E
 * IWBS = internal wall-bar slope C → D
 */
export function buildFacetGeometry({
  pitchDeg,

  horizontalFootRunMM,
  verticalFootCutMM,

  internalWallplateHeightMM,
  externalWallplateHeightMM,
}) {
  const resolvedPitchDeg =
    toFiniteNumber(pitchDeg);

  const horizontalFootRun =
    Math.max(
      0,
      toFiniteNumber(horizontalFootRunMM)
    );

  const verticalFootCut =
    Math.max(
      0,
      toFiniteNumber(verticalFootCutMM)
    );

  const internalWallplateHeight =
    Math.max(
      0,
      toFiniteNumber(
        internalWallplateHeightMM
      )
    );

  const externalWallplateHeight =
    Math.max(
      0,
      toFiniteNumber(
        externalWallplateHeightMM
      )
    );

  const pitchRad =
    degToRad(resolvedPitchDeg);

  const tanPitch =
    Math.tan(pitchRad);

  if (
    resolvedPitchDeg <= 0 ||
    Math.abs(tanPitch) < 0.000001 ||
    horizontalFootRun <= 0 ||
    verticalFootCut <= 0 ||
    internalWallplateHeight <= 0 ||
    externalWallplateHeight <= 0
  ) {
    return {
      valid: false,

      pitchDeg: resolvedPitchDeg,

      horizontalFootRunMM:
        horizontalFootRun,

      verticalFootCutMM:
        verticalFootCut,

      intersectionOffsetMM: 0,

      externalWallBarSlopeMM: 0,
      internalWallBarSlopeMM: 0,

      externalHorizontalRunMM: 0,
      internalHorizontalRunMM: 0,

      points: null,
    };
  }

  /*
   * ----------------------------------------------------
   * EXTERNAL WALL-BAR EDGE
   *
   * Starts at A, at the top of the VFC.
   *
   * Rise required to reach E:
   *
   * EWPH - VFC
   * ----------------------------------------------------
   */

  const externalRiseMM =
    externalWallplateHeight -
    verticalFootCut;

  const externalHorizontalRunMM =
    externalRiseMM / tanPitch;

  /*
   * ----------------------------------------------------
   * INTERNAL WALL-BAR EDGE
   *
   * Starts at C on the baseline and reaches D at IWPH.
   * ----------------------------------------------------
   */

  const internalHorizontalRunMM =
    internalWallplateHeight /
    tanPitch;

  /*
   * ----------------------------------------------------
   * HIP POSITION
   *
   * B is x = 0
   * C is x = HFC
   * E is x = externalHorizontalRun
   *
   * HP is C → vertical projection of E.
   * ----------------------------------------------------
   */

  const intersectionOffsetMM =
  externalHorizontalRunMM -
  horizontalFootRun;

  /*
   * ----------------------------------------------------
   * FINISHED SLOPE LENGTHS
   * ----------------------------------------------------
   */

  const externalWallBarSlopeMM =
    Math.hypot(
      externalHorizontalRunMM,
      externalRiseMM
    );

  const internalWallBarSlopeMM =
    Math.hypot(
      internalHorizontalRunMM,
      internalWallplateHeight
    );

  /*
   * ----------------------------------------------------
   * LOCAL POINT MODEL
   *
   * These coordinates describe ONE facet.
   *
   * B = (0, 0)
   * A = (0, VFC)
   * C = (HFC, 0)
   *
   * E and D are then solved from pitch + wallplate height.
   * ----------------------------------------------------
   */

  const points = {
    A: {
      xMM: 0,
      yMM: verticalFootCut,
    },

    B: {
      xMM: 0,
      yMM: 0,
    },

    C: {
      xMM: horizontalFootRun,
      yMM: 0,
    },

    D: {
      xMM:
        horizontalFootRun +
        internalHorizontalRunMM,

      yMM:
        internalWallplateHeight,
    },

    E: {
      xMM:
        externalHorizontalRunMM,

      yMM:
        externalWallplateHeight,
    },
  };

  return {
    valid: true,

    pitchDeg: resolvedPitchDeg,

    horizontalFootRunMM:
      horizontalFootRun,

    verticalFootCutMM:
      verticalFootCut,

    internalWallplateHeightMM:
      internalWallplateHeight,

    externalWallplateHeightMM:
      externalWallplateHeight,

    intersectionOffsetMM,

    externalHorizontalRunMM,
    internalHorizontalRunMM,

    externalWallBarSlopeMM,
    internalWallBarSlopeMM,

    points,
  };
}