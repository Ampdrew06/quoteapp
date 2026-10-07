import { calculateLeanToGeometry } from "../geometry/leanToGeometry";
import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import { calculateRoofTiling } from "./facetTilingCalc";

export function resolveAutomaticTileProduct(tileSystem) {
  const normalized = String(tileSystem || "britmet")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (normalized === "metrotile" || normalized === "metrotileshingle") {
    return "metrotileShingle";
  }

  if (normalized === "liteslate") {
    return "liteSlate";
  }

  if (normalized === "tapco" || normalized === "tapcoslate") {
    return "tapcoSlate";
  }

  return "britmetShingle";
}

function resolveHippedSides(roofInputs) {
  const hasExplicitHipFlags =
    typeof roofInputs.leftHip === "boolean" ||
    typeof roofInputs.rightHip === "boolean";

  if (hasExplicitHipFlags) {
    const hasLeft = roofInputs.leftHip === true;
    const hasRight = roofInputs.rightHip === true;

    if (hasLeft && hasRight) return "both";
    if (hasLeft) return "left";
    if (hasRight) return "right";
    return null;
  }

  if (
    roofInputs.hippedSides === "left" ||
    roofInputs.hippedSides === "right" ||
    roofInputs.hippedSides === "both"
  ) {
    return roofInputs.hippedSides;
  }

  const hasLeft = roofInputs.leftHip !== false;
  const hasRight = roofInputs.rightHip !== false;

  if (hasLeft && hasRight) return "both";
  if (hasLeft) return "left";
  if (hasRight) return "right";
  return null;
}

/**
 * Build the authoritative automatic tile/lath audit for a supported roof.
 *
 * This adapter deliberately contains no pricing or Summary-line formatting.
 * It converts persisted Design/Options inputs into universal roof facets and
 * passes those facets to the shared tiling engine.
 */
export function buildAutomaticRoofTiling({
  roofInputs = {},
  materials = {},
} = {}) {
  const roofStyle = roofInputs.roofStyle || roofInputs.roof_style || "leanTo";
  const productId = resolveAutomaticTileProduct(
    roofInputs.tileSystem ?? roofInputs.tile_system
  );

  const commonGeometryInputs = {
    widthMM: roofInputs.widthMM ?? roofInputs.internalWidthMM,
    projectionMM: roofInputs.projMM ?? roofInputs.internalProjectionMM,
    pitchDeg: roofInputs.pitchDeg ?? roofInputs.pitch_deg,
    soffitDepthMM: roofInputs.soffit_mm ?? roofInputs.soffitDepthMM,
    leftWall:
      roofInputs.leftWall === true || roofInputs.left_exposed === false,
    rightWall:
      roofInputs.rightWall === true || roofInputs.right_exposed === false,
    leftSupportDepthMM: roofInputs.leftSupportDepthMM,
    rightSupportDepthMM: roofInputs.rightSupportDepthMM,
    leftOverhangMM:
      roofInputs.leftOverhangMM ?? roofInputs.left_overhang_mm ?? 0,
    rightOverhangMM:
      roofInputs.rightOverhangMM ?? roofInputs.right_overhang_mm ?? 0,
    tileOverhangMM: roofInputs.eaves_overhang_mm ?? 50,
    materials,
  };

  let geometry = null;

  if (roofStyle === "leanTo") {
    geometry = calculateLeanToGeometry(commonGeometryInputs);
  } else if (roofStyle === "hippedLeanTo") {
    const hippedSides = resolveHippedSides(roofInputs);

    if (!hippedSides) {
      return {
        roofStyle,
        productId,
        geometry: null,
        result: null,
        errors: ["Select at least one hip side for a Hipped Lean-To."],
      };
    }

    geometry = calculateHippedLeanToGeometry({
      ...commonGeometryInputs,
      hippedSides,
      bossArrangement: roofInputs.bossArrangement ?? "offset",
      leftHipWidthMM: roofInputs.leftHipWidthMM ?? 1000,
      rightHipWidthMM: roofInputs.rightHipWidthMM ?? 1000,
      requestedLeftSidePitchDeg:
        roofInputs.requestedLeftSidePitchDeg ?? null,
      requestedRightSidePitchDeg:
        roofInputs.requestedRightSidePitchDeg ?? null,
      sideSoffitMode:
        roofInputs.sideSoffitMode ?? "automatic",
      sideSoffitControlSide:
        roofInputs.sideSoffitControlSide ?? "left",
      specifiedSideSoffitMM:
        roofInputs.specifiedSideSoffitMM ?? null,
    });
  }

  if (!geometry) {
    return {
      roofStyle,
      productId,
      geometry: null,
      result: null,
      errors: [`Automatic tiling is not available for roof style: ${roofStyle}.`],
    };
  }

  const result = calculateRoofTiling({
    product: productId,
    facets: geometry.facets,
  });

  return {
    roofStyle,
    productId,
    geometry,
    result,
    errors: result.errors || [],
  };
}
