// src/lib/leanToManufactureGeometry.js

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const deg2rad = (deg) => (num(deg) * Math.PI) / 180;

const pickNextStock = (sizes = [], required = 0) => {
  const arr = (sizes || [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!arr.length) return 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= required) return arr[i];
  }

  return arr[arr.length - 1];
};

/**
 * Lean-to manufacturing geometry based on Timberlite ring-beam detail.
 *
 * Current known rules:
 * - Internal rafter length is set by internal projection + pitch
 * - External horizontal extension = frame thickness + effective soffit
 * - "0 soffit" still means a minimum effective soffit of 25 mm for fascia lip clearance
 * - Plumb cut height is driven by the extension triangle plus a calibrated seat offset
 * - Finished fascia height is driven by plumb cut height plus a calibrated fascia offset
 *
 * IMPORTANT:
 * - finishedFasciaHeightMM is the geometric / ideal fascia height
 * - fasciaOrderingReferenceMM is the practical Timberlite ordering height
 *   after allowing fitting tolerance
 *
 * NOTE:
 * The calibration constants below come from the measured 15° mock-up
 * and can be refined later if needed.
 */
export function computeLeanToManufactureGeometry(inputs = {}) {
  const internalProjectionMM = num(
    inputs.internalProjectionMM ?? inputs.projMM ?? inputs.internalProjection
  );

  const pitchDeg = num(inputs.pitchDeg ?? inputs.pitch, 15);

  const userSoffitMM = num(
    inputs.soffitDepthMM ?? inputs.soffitMM ?? inputs.eavesOverhangMM,
    150
  );

  // 0 soffit still needs 25 mm effective clearance for fascia lip
  const effectiveSoffitMM = Math.max(userSoffitMM, 25);

  const frameThicknessMM = num(inputs.frameThicknessMM, 70);

  // Stock fascia boards
  const fasciaStockSizesMM =
    inputs.fasciaStockSizesMM ?? [200, 225, 250, 300, 400];

  // ---- calibrated Timberlite constants from measured mock-up ----
  // At 15°, with 150 soffit:
  // horizontalExtension = 220
  // verticalDrop = 58.95
  // plumbCutHeight = 174
  // finishedFasciaHeight = 235
  //
  // Therefore:
  // plumbCutBaseConstant = 174 + 58.95 = 232.95
  // fasciaOffset = 235 - 174 = 61
  const plumbCutBaseConstantMM = num(inputs.plumbCutBaseConstantMM, 232.95);
  const fasciaOffsetMM = num(inputs.fasciaOffsetMM, 61);

  // Practical Timberlite fitting allowance for fascia ordering
  // Example:
  // finished fascia = 235
  // ordering reference = 225
  // ordered board = 225
  const fasciaAllowanceMM = num(inputs.fasciaAllowanceMM, 10);

  const theta = deg2rad(pitchDeg);
const cosT = Math.cos(theta || 0);
const sinT = Math.sin(theta || 0);
const tanT = Math.tan(theta || 0);

  // --- Simple trig geometry checks ---
const wallplateThicknessMM = num(inputs.wallplateThicknessMM, 63);
const ringBeamHeightMM = num(inputs.ringBeamHeightMM, 40);
const rafterDepthMM = num(inputs.rafterDepthMM, 220);
const roofBuildUpMM = num(inputs.roofBuildUpMM, 260); // rafter + laths + tiles approx.

// Local rafter-template coordinates.
//
// Datum:
// The internal corner of the front foot cut is treated as 0,0.
// This is the point the workshop aligns when placing one
// rafter template directly on top of another.
//
// Coordinate directions:
// +x = outward towards the fascia
// +y = vertically upward
//
// The rafter slopes downward as x moves outward.
const footTemplate = {
  datumName: "internal-foot-cut-corner",

  pitchDeg,
  rafterDepthMM,

  internalFootCutPoint: {
    xMM: 0,
    yMM: 0,
  },

  // Direction along the rafter towards the fascia.
  outwardSlopeUnit: {
    x: cosT,
    y: -sinT,
  },

  // Perpendicular direction from the lower rafter edge
  // towards its upper edge.
  lowerToUpperNormalUnit: {
    x: sinT,
    y: cosT,
  },

  // One known point on the upper rafter edge when the
  // lower/internal foot-cut datum is located at 0,0.
  upperEdgeReferencePoint: {
    xMM: rafterDepthMM * sinT,
    yMM: rafterDepthMM * cosT,
  },

  upperEdgeGradient: -tanT,
};
const pureRiseMM = internalProjectionMM * tanT;

const internalWallPlateHeightMM =
  pureRiseMM + ringBeamHeightMM;

const simpleInternalCutRunMM =
  Math.max(0, internalProjectionMM - wallplateThicknessMM);

const simpleInternalCutLengthMM =
  cosT > 0 ? simpleInternalCutRunMM / cosT : 0;

const simpleExternalExtensionLengthMM =
  cosT > 0 ? (frameThicknessMM + effectiveSoffitMM) / cosT : 0;

const simpleTotalCutLengthMM =
  simpleInternalCutLengthMM + simpleExternalExtensionLengthMM;

  // Explicit manufacturing diagnostics.
// These duplicate existing calculations under clearer names.
// No existing output or calculation is being replaced yet.
const internalHorizontalRunMM =
  simpleInternalCutRunMM;

const externalHorizontalRunMM =
  frameThicknessMM + effectiveSoffitMM;

const fullHorizontalRunMM =
  internalHorizontalRunMM + externalHorizontalRunMM;

const calculatedInternalCutLengthMM =
  simpleInternalCutLengthMM;

const calculatedExternalExtensionLengthMM =
  simpleExternalExtensionLengthMM;

const calculatedExternalCutLengthMM =
  calculatedInternalCutLengthMM +
  calculatedExternalExtensionLengthMM;

// Difference between the top and bottom edges created by the
// 220 mm-deep rafter and the two parallel angled end cuts.
const rafterEdgeLengthDifferenceMM =
  cosT > 0 ? rafterDepthMM / cosT : 0;

const externalFinishedHeightMM =
  internalWallPlateHeightMM +
  (roofBuildUpMM / cosT);
  // 1) Internal structural rafter length
  const fullProjectionRafterLengthMM =
  cosT > 0 ? internalProjectionMM / cosT : 0;

const internalRafterLengthMM =
  simpleInternalCutLengthMM;

  // 2) External horizontal extension from inside face of frame to fascia face
  const horizontalExtensionMM = frameThicknessMM + effectiveSoffitMM;

  // 3) External extension along the slope
  const externalRafterExtensionMM =
    cosT > 0 ? horizontalExtensionMM / cosT : 0;

  // 4) Total rafter length
  const totalRafterLengthMM =
    internalRafterLengthMM + externalRafterExtensionMM;

  // 5) Vertical drop caused by the extension triangle
  const verticalDropMM = horizontalExtensionMM * tanT;

  // Finished eaves-profile alignment datum.
//
// This includes the vertical projection of the complete roof profile
// (220 mm rafter + approximately 40 mm lath/tile build-up)
// and subtracts the vertical fall across the frame + soffit extension.
//
// It is used to align unequal-pitch facets to one common fascia line.
// It does NOT replace the validated Lean-To rafter cut calculations.
const finishedFasciaAlignmentDatumMM =
  (cosT > 0 ? roofBuildUpMM / cosT : 0) -
  verticalDropMM;

  // 6) Plumb cut height at fascia (ideal geometric result)
  const plumbCutHeightMM = plumbCutBaseConstantMM - verticalDropMM;

  // 7) Finished fascia height (ideal geometric result)
  const finishedFasciaHeightMM = plumbCutHeightMM + fasciaOffsetMM;

  // 8) Practical fascia ordering reference
  const fasciaOrderingReferenceMM = Math.max(
  0,
  Math.floor(finishedFasciaHeightMM - fasciaAllowanceMM)
);

  // 9) Order fascia size using PRACTICAL reference, not perfect geometry
  const fasciaOrderSizeMM = pickNextStock(
    fasciaStockSizesMM,
    fasciaOrderingReferenceMM
  );

  return {
    pitchDeg,
    internalProjectionMM,
    userSoffitMM,
    effectiveSoffitMM,
    frameThicknessMM,

    internalRafterLengthMM: Number(internalRafterLengthMM.toFixed(2)),
    horizontalExtensionMM: Number(horizontalExtensionMM.toFixed(2)),
    externalRafterExtensionMM: Number(externalRafterExtensionMM.toFixed(2)),
    totalRafterLengthMM: Number(totalRafterLengthMM.toFixed(2)),
    fullProjectionRafterLengthMM: Number(fullProjectionRafterLengthMM.toFixed(2)),

    verticalDropMM: Number(verticalDropMM.toFixed(2)),
    plumbCutHeightMM: Number(plumbCutHeightMM.toFixed(2)),
    finishedFasciaHeightMM: Number(finishedFasciaHeightMM.toFixed(2)),

    finishedFasciaAlignmentDatumMM: Number(finishedFasciaAlignmentDatumMM.toFixed(2)),

    fasciaAllowanceMM: Number(fasciaAllowanceMM.toFixed(2)),
    fasciaOrderingReferenceMM: Number(fasciaOrderingReferenceMM.toFixed(2)),
    fasciaOrderSizeMM,

    plumbCutBaseConstantMM: Number(plumbCutBaseConstantMM.toFixed(2)),
    fasciaOffsetMM: Number(fasciaOffsetMM.toFixed(2)),

    footTemplate: {
  datumName: footTemplate.datumName,

  pitchDeg: Number(
    footTemplate.pitchDeg.toFixed(4)
  ),

  rafterDepthMM: Number(
    footTemplate.rafterDepthMM.toFixed(2)
  ),

  internalFootCutPoint: {
    xMM: 0,
    yMM: 0,
  },

  outwardSlopeUnit: {
    x: Number(
      footTemplate.outwardSlopeUnit.x.toFixed(8)
    ),
    y: Number(
      footTemplate.outwardSlopeUnit.y.toFixed(8)
    ),
  },

  lowerToUpperNormalUnit: {
    x: Number(
      footTemplate.lowerToUpperNormalUnit.x.toFixed(8)
    ),
    y: Number(
      footTemplate.lowerToUpperNormalUnit.y.toFixed(8)
    ),
  },

  upperEdgeReferencePoint: {
    xMM: Number(
      footTemplate.upperEdgeReferencePoint.xMM.toFixed(4)
    ),
    yMM: Number(
      footTemplate.upperEdgeReferencePoint.yMM.toFixed(4)
    ),
  },

  upperEdgeGradient: Number(
    footTemplate.upperEdgeGradient.toFixed(8)
  ),
},

    wallplateThicknessMM: Number(wallplateThicknessMM.toFixed(2)),
ringBeamHeightMM: Number(ringBeamHeightMM.toFixed(2)),
rafterDepthMM: Number(rafterDepthMM.toFixed(2)),
roofBuildUpMM: Number(roofBuildUpMM.toFixed(2)),

pureRiseMM: Number(pureRiseMM.toFixed(2)),
internalWallPlateHeightMM: Number(internalWallPlateHeightMM.toFixed(2)),
simpleInternalCutRunMM: Number(simpleInternalCutRunMM.toFixed(2)),
simpleInternalCutLengthMM: Number(simpleInternalCutLengthMM.toFixed(2)),
simpleExternalExtensionLengthMM: Number(simpleExternalExtensionLengthMM.toFixed(2)),
simpleTotalCutLengthMM: Number(simpleTotalCutLengthMM.toFixed(2)),
internalHorizontalRunMM: Number(
  internalHorizontalRunMM.toFixed(2)
),

externalHorizontalRunMM: Number(
  externalHorizontalRunMM.toFixed(2)
),

fullHorizontalRunMM: Number(
  fullHorizontalRunMM.toFixed(2)
),

calculatedInternalCutLengthMM: Number(
  calculatedInternalCutLengthMM.toFixed(2)
),

calculatedExternalExtensionLengthMM: Number(
  calculatedExternalExtensionLengthMM.toFixed(2)
),

calculatedExternalCutLengthMM: Number(
  calculatedExternalCutLengthMM.toFixed(2)
),

rafterEdgeLengthDifferenceMM: Number(
  rafterEdgeLengthDifferenceMM.toFixed(2)
),
externalFinishedHeightMM: Number(externalFinishedHeightMM.toFixed(2)),
  };
}