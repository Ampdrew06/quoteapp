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
  const tanT = Math.tan(theta || 0);

  // 1) Internal structural rafter length
  const internalRafterLengthMM = cosT > 0 ? internalProjectionMM / cosT : 0;

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

    verticalDropMM: Number(verticalDropMM.toFixed(2)),
    plumbCutHeightMM: Number(plumbCutHeightMM.toFixed(2)),
    finishedFasciaHeightMM: Number(finishedFasciaHeightMM.toFixed(2)),

    fasciaAllowanceMM: Number(fasciaAllowanceMM.toFixed(2)),
    fasciaOrderingReferenceMM: Number(fasciaOrderingReferenceMM.toFixed(2)),
    fasciaOrderSizeMM,

    plumbCutBaseConstantMM: Number(plumbCutBaseConstantMM.toFixed(2)),
    fasciaOffsetMM: Number(fasciaOffsetMM.toFixed(2)),
  };
}