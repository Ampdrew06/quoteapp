// src/lib/manufacturing/facetBuilder.js

import { buildRingBeam } from "./ringBeamBuilder";

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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

  // Optional relationships
  startVertexId = null,
  endVertexId = null,

  // Ring-beam configuration
  hasRingBeam = true,
  ringBeamLengthMM,
  ringBeamBaseWidthMM = 220,
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
baseWidthMM: ringBeamBaseWidthMM,

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
    },

    ringBeam,

    rafters: Array.isArray(rafters) ? rafters : [],
    jackRafters: Array.isArray(jackRafters)
      ? jackRafters
      : [],

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