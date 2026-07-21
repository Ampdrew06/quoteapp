// src/lib/geometry/leanToGeometry.js

import { computeLeanToManufactureGeometry } from "../leanToManufactureGeometry";

export function calculateLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,
}) {
  const geom = computeLeanToManufactureGeometry({
  internalProjectionMM: projectionMM,
  pitchDeg,
  soffitDepthMM,

  frameThicknessMM: Number(
    materials?.side_frame_thickness_mm ?? 70
  ),

  wallplateThicknessMM: Number(
    materials?.wallplate_thickness_mm ?? 65
  ),
});

  return {
    // Standardised shared names for the rest of the app
    rafterExternalLength: geom.totalRafterLengthMM,
    rafterInternalLength: geom.internalRafterLengthMM,
    externalSlopeLength: geom.externalRafterExtensionMM,
    plumbCutHeight: geom.plumbCutHeightMM,
    fasciaHeight: geom.finishedFasciaHeightMM,
    fasciaAlignmentDatum: geom.finishedFasciaAlignmentDatumMM,
    fasciaOrderSize: geom.fasciaOrderSizeMM,
    soffitDepthEffective: geom.effectiveSoffitMM,

    // Keep raw helper output available for pages that need more detail
    raw: geom,
  };
}