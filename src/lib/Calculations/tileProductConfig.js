// Product facts and Timberlite-specific set-out rules.
// Keep calculation values here rather than burying constants in UI code.

const STEEL_SHINGLE_SET_OUT = Object.freeze({
  strategy: "steelShingleCourses",

  // Timberlite factory set-out:
  perimeterLathPositionMM: 0,
  firstFixingLathOffsetMM: 225,
  subsequentGaugeMM: 255,

  // Britmet and Metrotile use the same practical geometry.
  effectiveCoverWidthMM: 1250,
  fixingsPerTile: 4,
  defaultOrderAllowanceTiles: 2,
});

const SLATE_PITCH_BANDS = Object.freeze([
  Object.freeze({
    minPitchDeg: 12,
    maxPitchDeg: 25,
    gaugeMM: 152,
    slatesPerM2: 22,
  }),
  Object.freeze({
    minPitchDeg: 25,
    maxPitchDeg: 27.5,
    gaugeMM: 165,
    slatesPerM2: 20,
  }),
  Object.freeze({
    minPitchDeg: 27.5,
    maxPitchDeg: 30,
    gaugeMM: 178,
    slatesPerM2: 19,
  }),
]);

export const TILE_PRODUCTS = Object.freeze({
  britmetShingle: Object.freeze({
    id: "britmetShingle",
    label: "Britmet Shingle",
    family: "steelShingle",
    minimumPitchDeg: 15,
    maximumPitchDeg: 90,
    ...STEEL_SHINGLE_SET_OUT,
  }),

  metrotileShingle: Object.freeze({
    id: "metrotileShingle",
    label: "Metrotile Shingle",
    family: "steelShingle",
    minimumPitchDeg: 15,
    maximumPitchDeg: 90,
    ...STEEL_SHINGLE_SET_OUT,
  }),

  liteSlate: Object.freeze({
    id: "liteSlate",
    label: "LiteSlate",
    family: "syntheticSlate",
    strategy: "slatePitchTable",
    minimumPitchDeg: 12,
    maximumPitchDeg: 70,
    firstCourseIsDouble: true,
    perimeterLathPositionMM: 0,
    eavesSupportLathPositionsMM: [150, 200],
    firstStandardCourseOffsetMM: 150,
    effectiveSlateWidthMM: 297,
    fixingsPerSlate: 2,
    steepPitchGaugeMM: 190,
    steepPitchSlatesPerM2: 18,
    pitchBands: SLATE_PITCH_BANDS,
  }),

    tapcoSlate: Object.freeze({
    id: "tapcoSlate",
    label: "TapcoSlate",
    family: "syntheticSlate",
    strategy: "slatePitchTable",
    minimumPitchDeg: 12,
    maximumPitchDeg: 70,
    firstCourseIsDouble: true,
    perimeterLathPositionMM: 0,
    eavesSupportLathPositionsMM: [150, 200],
    firstStandardCourseOffsetMM: 150,
    effectiveSlateWidthMM: 305,
    fixingsPerSlate: 2,
    bundleSize: 25,
    steepPitchGaugeMM: 191,
    steepPitchSlatesPerM2: 18,
    pitchBands: SLATE_PITCH_BANDS,
  }),
});

export function getTileProduct(productOrId) {
  if (productOrId && typeof productOrId === "object") {
    return productOrId;
  }

  return TILE_PRODUCTS[productOrId] || null;
}

export function getSlatePitchRule(productOrId, pitchDeg) {
  const product = getTileProduct(productOrId);
  const pitch = Number(pitchDeg);

  if (
    !product ||
    product.strategy !== "slatePitchTable" ||
    !Number.isFinite(pitch)
  ) {
    return null;
  }

  const band = product.pitchBands.find(
    ({ minPitchDeg, maxPitchDeg }) =>
      pitch >= minPitchDeg && pitch < maxPitchDeg
  );

  return (
    band || {
      minPitchDeg: 30,
      maxPitchDeg: product.maximumPitchDeg,
      gaugeMM: product.steepPitchGaugeMM,
      slatesPerM2: product.steepPitchSlatesPerM2,
    }
  );
}