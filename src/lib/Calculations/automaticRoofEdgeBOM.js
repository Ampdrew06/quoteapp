import { buildAutomaticRoofTiling } from "./automaticRoofTiling";
import { buildRoofEdgeModel } from "./roofEdgeModel";
import { buildRoofEdgeAccessoryRequirements } from "./roofEdgeAccessoryRequirements";
import { buildRoofEdgeStockQuantities } from "./roofEdgeStockQuantities";
import { buildRoofEdgeBOM } from "./roofEdgeBOM";

/**
 * Build one shared edge model and confirmed edge BOM from the current roof.
 * Consumers may use the returned audit stages without recalculating an edge.
 */
export function buildAutomaticRoofEdgeBOM({
  roofInputs = {},
  materials = {},
  automaticRoofTiling = null,
} = {}) {
  const tiling =
    automaticRoofTiling ||
    buildAutomaticRoofTiling({ roofInputs, materials });

  if (!tiling?.geometry || !tiling?.result) {
    return {
      valid: false,
      tiling,
      edgeModel: null,
      accessoryRequirements: null,
      stock: null,
      bom: null,
      errors: tiling?.errors || ["Valid automatic roof geometry was not found."],
    };
  }

  const edgeModel = buildRoofEdgeModel({
    roofInputs,
    geometry: tiling.geometry,
  });
  const accessoryRequirements = buildRoofEdgeAccessoryRequirements({
    edgeModel,
    tileSystem: tiling.productId,
  });
  const stock = buildRoofEdgeStockQuantities({
    accessoryRequirements,
    materials,
  });
  const bom = buildRoofEdgeBOM({ stockResult: stock, materials });
  const errors = [
    ...(edgeModel?.errors || []),
    ...(accessoryRequirements?.errors || []),
    ...(stock?.errors || []),
    ...(bom?.errors || []),
  ];

  return {
    valid:
      edgeModel.valid &&
      accessoryRequirements.valid &&
      stock.valid &&
      bom.valid,
    tiling,
    edgeModel,
    accessoryRequirements,
    stock,
    bom,
    errors,
  };
}
