// src/lib/manufacturing/facetBuilder.js

import { buildRingBeam } from "./ringBeamBuilder";

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toOptionalNonNegativeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
};

/**
 * Builds one reusable roof facet.
 *
 * A facet represents one roof face/perimeter section.
 * It may contain a ring-beam, rafters, jack rafters and later
 * tiles, insulation, membrane, fascia, guttering and other items.
 *
 * This file deliberately contains:
 * - no React code
 * - no pricing
 * - no roof-style-specific calculations
 */
export function buildFacet({
  id,
  label,
  exists = true,

  // Basic facet geometry
  internalEavesLengthMM = 0,
  externalEavesLengthMM = 0,
  internalSlopeLengthMM = 0,
  externalSlopeLengthMM = 0,
  pitchDeg = 0,
  // Resolved eaves geometry
soffitDepthMM = 0,
plumbCutHeightMM = 0,
finishedFasciaHeightMM = 0,
fasciaOrderSizeMM = 0,

  // Optional area values.
  // These can be supplied by the roof-specific geometry calculator.
  planAreaM2 = 0,
  roofAreaM2 = 0,

    /*
   * Optional finished tiled-surface geometry.
   *
   * This is separate from structural rafter and ring-beam
   * geometry because the finished tiles can include their
   * own perimeter overhang.
   */
  tilingGeometry = null,

  /*
   * Roof openings belonging to this facet.
   * These will later include vents and fixed glazing.
   */
  openings = [],

  // Optional relationships
  startVertexId = null,
  endVertexId = null,

  // Ring-beam configuration
  hasRingBeam = true,
  ringBeamLengthMM,
  ringBeamInternalLengthMM,
  ringBeamExternalLengthMM,
  ringBeamBaseWidthMM = 220,
  ringBeamStartExtensionMM = 0,
  ringBeamEndExtensionMM,
  ringBeamBayWidthsMM = [],
  ringBeamUpstandHeightMM = 195,
  ringBeamPirHeightMM = 185,
  ringBeamPirFacesPerBay = 2,

  // These will be populated properly later
  rafters = [],
  jackRafters = [],
}) {
  const facetExists = Boolean(exists);

  const resolvedInternalEavesLengthMM = Math.max(
    0,
    toFiniteNumber(internalEavesLengthMM)
  );

  const resolvedExternalEavesLengthMM = Math.max(
    0,
    toFiniteNumber(externalEavesLengthMM)
  );

  const resolvedInternalSlopeLengthMM = Math.max(
    0,
    toFiniteNumber(internalSlopeLengthMM)
  );

  const resolvedExternalSlopeLengthMM = Math.max(
    0,
    toFiniteNumber(externalSlopeLengthMM)
  );

  const resolvedPitchDeg = toFiniteNumber(pitchDeg);

  const resolvedSoffitDepthMM = Math.max(
  0,
  toFiniteNumber(soffitDepthMM)
);

const resolvedPlumbCutHeightMM = Math.max(
  0,
  toFiniteNumber(plumbCutHeightMM)
);

const resolvedFinishedFasciaHeightMM = Math.max(
  0,
  toFiniteNumber(finishedFasciaHeightMM)
);

const resolvedFasciaOrderSizeMM = Math.max(
  0,
  toFiniteNumber(fasciaOrderSizeMM)
);

  const resolvedPlanAreaM2 = Math.max(
    0,
    toFiniteNumber(planAreaM2)
  );

  const resolvedRoofAreaM2 = Math.max(
    0,
    toFiniteNumber(roofAreaM2)
  );

    const resolvedTilingGeometry = (() => {
    if (
      !tilingGeometry ||
      typeof tilingGeometry !== "object"
    ) {
      return null;
    }

    const baseWidthMM =
      toOptionalNonNegativeNumber(
        tilingGeometry.baseWidthMM
      );

    const topWidthMM =
      toOptionalNonNegativeNumber(
        tilingGeometry.topWidthMM
      );

    const heightMM =
      toOptionalNonNegativeNumber(
        tilingGeometry.heightMM
      );

    /*
     * A top width of zero is valid for a triangular facet.
     * Missing values remain invalid rather than silently
     * becoming zero.
     */
    if (
      baseWidthMM === null ||
      baseWidthMM <= 0 ||
      topWidthMM === null ||
      heightMM === null ||
      heightMM <= 0
    ) {
      return null;
    }

    const outline = Array.isArray(
      tilingGeometry.outline
    )
      ? tilingGeometry.outline.map((point) => ({
          xMM: toFiniteNumber(
            point?.xMM ?? point?.x
          ),

          yMM: toFiniteNumber(
            point?.yMM ?? point?.y
          ),
        }))
      : [];

    return {
      baseWidthMM,
      topWidthMM,
      heightMM,
      outline,
    };
  })();

  const resolvedOpenings = Array.isArray(openings)
    ? openings.map((opening) => ({
        ...opening,
      }))
    : [];

  const resolvedRingBeamLengthMM = Math.max(
    0,
    toFiniteNumber(
      ringBeamLengthMM,
      resolvedExternalEavesLengthMM
    )
  );

  const ringBeam = buildRingBeam({
    id: `${id}-ring-beam`,
    label: label ? `${label} Ring-beam` : "Ring-beam",

    exists:
      facetExists &&
      Boolean(hasRingBeam) &&
      resolvedRingBeamLengthMM > 0,

    lengthMM: resolvedRingBeamLengthMM,
internalLengthMM: toFiniteNumber(
  ringBeamInternalLengthMM,
  resolvedInternalEavesLengthMM
),
externalLengthMM: toFiniteNumber(
  ringBeamExternalLengthMM,
  resolvedRingBeamLengthMM
),
baseWidthMM: ringBeamBaseWidthMM,
startExtensionMM: ringBeamStartExtensionMM,
endExtensionMM: ringBeamEndExtensionMM,

pitchDeg: resolvedPitchDeg,
soffitDepthMM: resolvedSoffitDepthMM,
plumbCutHeightMM: resolvedPlumbCutHeightMM,
finishedFasciaHeightMM:
  resolvedFinishedFasciaHeightMM,
fasciaOrderSizeMM:
  resolvedFasciaOrderSizeMM,

bayWidthsMM: ringBeamBayWidthsMM,
    upstandHeightMM: ringBeamUpstandHeightMM,
    pirHeightMM: ringBeamPirHeightMM,
    pirFacesPerBay: ringBeamPirFacesPerBay,
  });

  return {
    id,
    label,
    exists: facetExists,

    vertices: {
      startVertexId,
      endVertexId,
    },

    geometry: {
      internalEavesLengthMM: resolvedInternalEavesLengthMM,
      externalEavesLengthMM: resolvedExternalEavesLengthMM,

      internalSlopeLengthMM: resolvedInternalSlopeLengthMM,
      externalSlopeLengthMM: resolvedExternalSlopeLengthMM,

      pitchDeg: resolvedPitchDeg,

            planAreaM2: resolvedPlanAreaM2,
      roofAreaM2: resolvedRoofAreaM2,

      /*
       * Null until the roof-specific geometry builder has
       * supplied a complete finished tiled surface.
       */
      tiling: resolvedTilingGeometry,
    },

    ringBeam,

    rafters: Array.isArray(rafters) ? rafters : [],
    jackRafters: Array.isArray(jackRafters)
      ? jackRafters
      : [],

          openings: resolvedOpenings,

    materials: {
      // These currently come from the ring-beam only.
      // Later, tiles, membrane, insulation and laths will also
      // contribute to this facet-level materials object.
      ply9AreaM2:
        ringBeam.materials.ply9TotalAreaM2,

      pse30x90LengthM:
        ringBeam.materials.pse30x90LengthM,

      lath25x50LengthM:
        ringBeam.materials.outerFixingLath25x50LengthM +
        ringBeam.materials.finishingLath25x50LengthM,

      pir50AreaM2:
        ringBeam.materials.pir50AreaM2,
    },
  };
}
