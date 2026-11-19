import { buildLeanToVentLayout } from '../geometry/leanToVentLayout';
import {buildHippedRoofPlaneCovering} from './hippedRoofPlaneCovering';
import { calculateLeanToGeometry } from "../geometry/leanToGeometry";
import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import {buildHippedLeanToVentLayout} from "../geometry/hippedLeanToVentLayout";
import { calculateRoofTiling, calculateOpeningTileDeduction } from "./facetTilingCalc";

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
  let ventFacets;

  if (roofStyle === "leanTo") {
    geometry = calculateLeanToGeometry(commonGeometryInputs);
    const layout = buildLeanToVentLayout(roofInputs, materials);
    if (layout.error) return { roofStyle, productId, geometry, result: null, errors: [layout.error] };
    if (layout.openings.length && geometry.facets.length) {
      const { leftAllowanceMM, finishedTileSlopeMM } = geometry.tilingGeometry;
      const internalSlope = Number(commonGeometryInputs.projectionMM) / Math.cos(Number(commonGeometryInputs.pitchDeg) * Math.PI / 180);
      geometry.mainFacet = {
        ...geometry.mainFacet,
        openings: layout.openings.map(opening => ({
          ...opening,
          xMM: opening.xMM + leftAllowanceMM,
          yMM: opening.yMM + finishedTileSlopeMM - internalSlope,
        })),
      };
      geometry.facets = [geometry.mainFacet];
      // The opening-aware calculator accepts rectangular facets by dimensions.
      const { outline, ...rectangle } = geometry.mainFacet.geometry.tiling;
      ventFacets = [{ ...geometry.mainFacet, geometry: { ...geometry.mainFacet.geometry, tiling: rectangle } }];
    }
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

  const coveringGeometry=roofStyle==='hippedLeanTo'?buildHippedRoofPlaneCovering({geometry,tileOverhangMM:commonGeometryInputs.tileOverhangMM}):null;
  if(coveringGeometry&&!coveringGeometry.valid)return {roofStyle,productId,geometry,result:null,coveringGeometry,errors:coveringGeometry.errors};
  let result = calculateRoofTiling({
    product: productId,
    facets: ventFacets ?? coveringGeometry?.facets ?? geometry.facets,
  });

  if(roofStyle==='hippedLeanTo'&&roofInputs.hippedVentQuantities){
    const layout=buildHippedLeanToVentLayout(geometry,roofInputs.hippedVentQuantities);
    if(layout.errors.length)return {roofStyle,productId,geometry,result:null,errors:layout.errors};
    if(layout.openings.length&&!result.errors.length){
      const ids={front:geometry.frontFacet?.id,left:geometry.leftFacet?.id,right:geometry.rightFacet?.id};
      const facets=result.facets.map(row=>{
        const openings=layout.openings.filter(vent=>ids[vent.facet]===row.facet.id);
        const openingAreaM2=openings.reduce((sum,vent)=>sum+vent.areaM2,0);
        const deduction=calculateOpeningTileDeduction({openings,product:productId,pitchDeg:row.facet.pitchDeg});
        const tileQuantityRaw=Math.max(0,row.tileQuantityRaw-deduction);
        return {...row,openingAreaM2,tileQuantityRaw,tileQuantityOrdered:Math.ceil(tileQuantityRaw)};
      });
      const tileQuantityRaw=Number(facets.reduce((sum,row)=>sum+row.tileQuantityRaw,0).toFixed(6));
      const tileQuantityRounded=Math.ceil(tileQuantityRaw);
      const tileQuantityOrdered=tileQuantityRounded+result.orderAllowanceTiles;
      const perTile=result.tileQuantityOrdered?result.fixingQuantity/result.tileQuantityOrdered:0;
      result={...result,facets,tileQuantityRaw,tileQuantityRounded,tileQuantityOrdered,
        openingAreaM2:layout.areaM2,netFacetAreaM2:Math.max(0,result.grossFacetAreaM2-layout.areaM2),
        fixingQuantity:tileQuantityOrdered*perTile};
    }
  }

  return {
    roofStyle,
    productId,
    geometry,
    ...(coveringGeometry?{coveringGeometry}:{}),
    result,
    errors: result.errors || [],
  };
}
