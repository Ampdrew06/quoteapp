import { calculateFasciaCutHeight } from "./Manufacturing/fasciaCutHeight";
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

/**
 * Solve the front pitch from a maximum finished-height restriction.
 *
 * Uses the same physical height model as
 * calculatedMaximumFinishedHeightMM:
 *
 * ring-beam datum
 * + rise across the full internal projection
 * + vertical rafter/lath/tile build-up.
 */
export function solveLeanToPitchForMaximumFinishedHeight(
  inputs = {}
) {
  const internalProjectionMM = Math.max(
    0,
    num(
      inputs.internalProjectionMM ??
        inputs.projMM ??
        inputs.internalProjection
    )
  );

  const maximumFinishedHeightMM = Math.max(
    0,
    num(inputs.maximumFinishedHeightMM)
  );

  const ringBeamHeightMM = Math.max(
    0,
    num(inputs.ringBeamHeightMM, 40)
  );

  const rafterDepthMM = Math.max(
    0,
    num(inputs.rafterDepthMM, 220)
  );

  const fixingLathDepthMM = Math.max(
    0,
    num(inputs.fixingLathDepthMM, 25)
  );

  const tileTopThicknessMM = Math.max(
    0,
    num(inputs.tileTopThicknessMM, 3)
  );

  if (
    internalProjectionMM <= 0 ||
    maximumFinishedHeightMM <= 0
  ) {
    return null;
  }

  const totalRoofDepthMM =
    rafterDepthMM +
    fixingLathDepthMM +
    tileTopThicknessMM;

  const finishedHeightAtPitch = (degrees) => {
    const radians = deg2rad(degrees);
    const cosPitch = Math.cos(radians);

    if (cosPitch <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return (
      ringBeamHeightMM +
      internalProjectionMM * Math.tan(radians) +
      totalRoofDepthMM / cosPitch
    );
  };

  const minimumPossibleHeightMM =
    finishedHeightAtPitch(0);

  if (
    maximumFinishedHeightMM <
    minimumPossibleHeightMM
  ) {
    return null;
  }

  let lowDeg = 0;
  let highDeg = 60;

  for (let i = 0; i < 80; i += 1) {
    const middleDeg =
      (lowDeg + highDeg) / 2;

    if (
      finishedHeightAtPitch(middleDeg) <=
      maximumFinishedHeightMM
    ) {
      lowDeg = middleDeg;
    } else {
      highDeg = middleDeg;
    }
  }

  return Number(lowDeg.toFixed(6));
}

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

// Explicit finished-roof build-up.
//
// These are kept separate from the legacy roofBuildUpMM
// so we can verify the physical construction before
// replacing any existing production calculation.
const fixingLathDepthMM = num(
  inputs.fixingLathDepthMM,
  25
);

const tileTopThicknessMM = num(
  inputs.tileTopThicknessMM,
  3
);

const roofFinishBuildUpMM =
  fixingLathDepthMM +
  tileTopThicknessMM;

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
// Overall architectural/internal roof projection.
const overallProjectionMM =
  internalProjectionMM;

// Timberlite pitch datum:
//
// Pitch and structural rise are measured from the front face
// of the wallplate, not from the rear wall datum.
const effectivePitchRunMM = Math.max(
  0,
  overallProjectionMM - wallplateThicknessMM
);

const pureRiseMM =
  effectivePitchRunMM * tanT;

const internalWallPlateHeightMM =
  pureRiseMM + ringBeamHeightMM;

  // --------------------------------------------------
// EXPLICIT MAXIMUM FINISHED HEIGHT MODEL
// --------------------------------------------------
//
// Datum:
// factory floor / top of conservatory frame = 0
//
// internalWallPlateHeightMM reaches the underside of
// the wallplate at the front face of the wallplate.
//
// From there:
//
// 1. Continue the rafter trajectory backwards across
//    the wallplate thickness (the green triangle).
//
// 2. Add the vertical height of the 220 mm rafter.
//
// 3. Add the 25 mm fixing lath + thin tile covering.
//
// This describes the physical highest finished point
// at the house wall.

const wallplateTrajectoryRiseMM =
  wallplateThicknessMM * tanT;

const rafterVerticalDepthMM =
  cosT > 0
    ? rafterDepthMM / cosT
    : 0;

const roofFinishVerticalBuildUpMM =
  cosT > 0
    ? roofFinishBuildUpMM / cosT
    : 0;

const calculatedMaximumFinishedHeightMM =
  internalWallPlateHeightMM +
  wallplateTrajectoryRiseMM +
  rafterVerticalDepthMM +
  roofFinishVerticalBuildUpMM;

// The internal rafter cut uses the same physical run datum.
const simpleInternalCutRunMM =
  effectivePitchRunMM;


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

  // Explicit workshop clearance at the front foot cut.
//
// The nominal architectural extension remains unchanged.
// This allowance prevents the manufactured rafter from
// finishing proud of the external ring-beam face.
const rafterFootClearanceMM = Math.max(
  0,
  num(inputs.rafterFootClearanceMM, 2)
);

const manufacturedHorizontalFootCutMM = Math.max(
  0,
  horizontalExtensionMM - rafterFootClearanceMM
);
// Manufactured sloping extension from the internal
// foot-cut corner to the external VFC.
const manufacturedExternalRafterExtensionMM =
  cosT > 0
    ? manufacturedHorizontalFootCutMM / cosT
    : 0;

// Complete manufactured upper/external rafter edge:
//
// internal slope from wallplate to foot-cut corner
// + manufactured sloping foot extension.
const manufacturedExternalSlopeLengthMM =
  internalRafterLengthMM +
  manufacturedExternalRafterExtensionMM;

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

  // 6) TRUE vertical foot cut (VFC)
//
// Pure rafter geometry:
// vertical depth of the 220 mm rafter
// minus the vertical fall across the HFC.
//
// No tolerance is included in the rafter cut.
const plumbCutHeightMM =
  rafterVerticalDepthMM - verticalDropMM;
  // Manufactured VFC after applying the explicit HFC clearance.
// This remains separate from the nominal true-geometry VFC.
const manufacturedVerticalDropMM =
  manufacturedHorizontalFootCutMM * tanT;

const manufacturedPlumbCutHeightMM =
  rafterVerticalDepthMM - manufacturedVerticalDropMM;
  // Minimum rectangular stock length required to contain
// the complete five-sided manufactured rafter.
const manufacturedOverallBlankLengthMM =
  manufacturedExternalSlopeLengthMM +
  manufacturedPlumbCutHeightMM * sinT;

// Keep the previous calibrated VFC temporarily for the
// existing fascia-order calculation only.
// We will review/remove this separately.
const legacyFasciaPlumbCutHeightMM =
  plumbCutBaseConstantMM - verticalDropMM;

// 7) Existing fascia calculation retained unchanged for now
const finishedFasciaHeightMM =
  legacyFasciaPlumbCutHeightMM + fasciaOffsetMM;

  const fasciaCut = calculateFasciaCutHeight(finishedFasciaHeightMM);
  // 8) Reveal Liner coverage: internal lip to top edge, no allowance deducted.
  const fasciaOrderingReferenceMM = Math.max(
  0,
  fasciaCut?.coverageHeightMM ?? 0
);

  // 9) Order fascia size using PRACTICAL reference, not perfect geometry
  const fasciaOrderSizeMM = pickNextStock(
    fasciaStockSizesMM,
    fasciaOrderingReferenceMM
  );

  return {
    pitchDeg,
    internalProjectionMM,
    overallProjectionMM: Number(
  overallProjectionMM.toFixed(2)
),

effectivePitchRunMM: Number(
  effectivePitchRunMM.toFixed(2)
),
    userSoffitMM,
    effectiveSoffitMM,
    frameThicknessMM,

    internalRafterLengthMM: Number(internalRafterLengthMM.toFixed(2)),
    horizontalExtensionMM: Number(horizontalExtensionMM.toFixed(2)),
    rafterFootClearanceMM: Number(
  rafterFootClearanceMM.toFixed(2)
),

manufacturedHorizontalFootCutMM: Number(
  manufacturedHorizontalFootCutMM.toFixed(2)
),
manufacturedExternalRafterExtensionMM: Number(
  manufacturedExternalRafterExtensionMM.toFixed(2)
),

manufacturedExternalSlopeLengthMM: Number(
  manufacturedExternalSlopeLengthMM.toFixed(2)
),
    externalRafterExtensionMM: Number(externalRafterExtensionMM.toFixed(2)),
    totalRafterLengthMM: Number(totalRafterLengthMM.toFixed(2)),
    fullProjectionRafterLengthMM: Number(fullProjectionRafterLengthMM.toFixed(2)),
  
    

    verticalDropMM: Number(verticalDropMM.toFixed(2)),
    plumbCutHeightMM: Number(plumbCutHeightMM.toFixed(2)),
    manufacturedVerticalDropMM: Number(
  manufacturedVerticalDropMM.toFixed(2)
),

manufacturedPlumbCutHeightMM: Number(
  manufacturedPlumbCutHeightMM.toFixed(2)
),
manufacturedOverallBlankLengthMM: Number(
  manufacturedOverallBlankLengthMM.toFixed(2)
),
    fasciaCut,
    fasciaExternalCutHeightMM: fasciaCut?.externalCutHeightMM ?? 0,
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

fixingLathDepthMM: Number(
  fixingLathDepthMM.toFixed(2)
),

tileTopThicknessMM: Number(
  tileTopThicknessMM.toFixed(2)
),

roofFinishBuildUpMM: Number(
  roofFinishBuildUpMM.toFixed(2)
),

wallplateTrajectoryRiseMM: Number(
  wallplateTrajectoryRiseMM.toFixed(2)
),

rafterVerticalDepthMM: Number(
  rafterVerticalDepthMM.toFixed(2)
),

roofFinishVerticalBuildUpMM: Number(
  roofFinishVerticalBuildUpMM.toFixed(2)
),

calculatedMaximumFinishedHeightMM: Number(
  calculatedMaximumFinishedHeightMM.toFixed(2)
),

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