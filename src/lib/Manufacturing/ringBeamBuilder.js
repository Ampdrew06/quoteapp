// src/lib/manufacturing/ringBeamBuilder.js

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * Builds the manufacturing quantities for one perimeter ring-beam facet.
 *
 * This function contains no React code, no pricing and no roof-style logic.
 * It can therefore be reused by Lean-To, Hipped Lean-To, Edwardian,
 * Victorian, P-Shape, L-Shape and future freeform roof facets.
 */
export function buildRingBeam({
  id,
  label,
  exists = true,

  // Length along the ring-beam facet
  lengthMM = 0,

  // Width of the 9 mm ply base from inner to outer edge
  baseWidthMM = 220,

    // Resolved eaves geometry supplied by the roof geometry engine.
  // These values are metadata for manufacture and future diagrams;
  // this builder does not independently solve roof pitches.
  pitchDeg = 0,
  soffitDepthMM = 0,
  plumbCutHeightMM = 0,
  finishedFasciaHeightMM = 0,
  fasciaOrderSizeMM = 0,

  // Individual clear widths between rafter/upstand gaps
  bayWidthsMM = [],

  // Manufacturing dimensions
  upstandHeightMM = 195,
  pirHeightMM = 185,
  pirFacesPerBay = 2,
}) {
  const resolvedLengthMM = Math.max(0, toFiniteNumber(lengthMM));
  const resolvedBaseWidthMM = Math.max(0, toFiniteNumber(baseWidthMM, 220));

  const resolvedPitchDeg =
  toFiniteNumber(pitchDeg);

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

  const resolvedBayWidthsMM = Array.isArray(bayWidthsMM)
    ? bayWidthsMM
        .map((width) => Math.max(0, toFiniteNumber(width)))
        .filter((width) => width > 0)
    : [];

  const ringBeamExists = Boolean(exists) && resolvedLengthMM > 0;

  if (!ringBeamExists) {
    return {
      id,
      label,
      exists: false,
      lengthMM: 0,
      lengthM: 0,
      baseWidthMM: resolvedBaseWidthMM,

      eavesGeometry: {
  pitchDeg: resolvedPitchDeg,
  soffitDepthMM: resolvedSoffitDepthMM,
  plumbCutHeightMM: resolvedPlumbCutHeightMM,
  finishedFasciaHeightMM:
    resolvedFinishedFasciaHeightMM,
  fasciaOrderSizeMM:
    resolvedFasciaOrderSizeMM,
},

      upstandCount: 0,
      bayWidthsMM: [],

      materials: {
        ply9BaseAreaM2: 0,
        ply9UpstandAreaM2: 0,
        ply9TotalAreaM2: 0,
        pse30x90LengthM: 0,
        outerFixingLath25x50LengthM: 0,
        finishingLath25x50LengthM: 0,
        pir50AreaM2: 0,
      },
    };
  }

  const lengthM = resolvedLengthMM / 1000;
  const baseWidthM = resolvedBaseWidthMM / 1000;
  const upstandHeightM = Math.max(
    0,
    toFiniteNumber(upstandHeightMM, 195)
  ) / 1000;
  const pirHeightM = Math.max(
    0,
    toFiniteNumber(pirHeightMM, 185)
  ) / 1000;
  const resolvedPirFacesPerBay = Math.max(
    0,
    toFiniteNumber(pirFacesPerBay, 2)
  );

  const upstandCount = resolvedBayWidthsMM.length;

  const totalBayWidthM =
    resolvedBayWidthsMM.reduce((sum, widthMM) => sum + widthMM, 0) /
    1000;

  const ply9BaseAreaM2 = lengthM * baseWidthM;
  const ply9UpstandAreaM2 = totalBayWidthM * upstandHeightM;
  const ply9TotalAreaM2 = ply9BaseAreaM2 + ply9UpstandAreaM2;

  const pir50AreaM2 =
    totalBayWidthM * pirHeightM * resolvedPirFacesPerBay;

  return {
    id,
    label,
    exists: true,

    lengthMM: resolvedLengthMM,
    lengthM,
    baseWidthMM: resolvedBaseWidthMM,

    eavesGeometry: {
  pitchDeg: resolvedPitchDeg,
  soffitDepthMM: resolvedSoffitDepthMM,
  plumbCutHeightMM: resolvedPlumbCutHeightMM,
  finishedFasciaHeightMM:
    resolvedFinishedFasciaHeightMM,
  fasciaOrderSizeMM:
    resolvedFasciaOrderSizeMM,
},

    upstandCount,
    bayWidthsMM: resolvedBayWidthsMM,

    dimensions: {
      upstandHeightMM: Math.round(upstandHeightM * 1000),
      pirHeightMM: Math.round(pirHeightM * 1000),
      pirFacesPerBay: resolvedPirFacesPerBay,
    },

    materials: {
      // 9 mm ply base running continuously beneath the ring-beam
      ply9BaseAreaM2,

      // Individual 9 mm ply upstands between rafter positions
      ply9UpstandAreaM2,

      ply9TotalAreaM2,

      // Continuous members along the full facet
      pse30x90LengthM: lengthM,
      outerFixingLath25x50LengthM: lengthM,

      // One finishing lath across each clear bay
      finishingLath25x50LengthM: totalBayWidthM,

      // PIR fitted to both faces of every upstand bay by default
      pir50AreaM2,
    },
  };
}