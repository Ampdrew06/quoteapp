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

  let edgeModel = buildRoofEdgeModel({
    roofInputs,
    geometry: tiling.geometry,
  });
  if(edgeModel.valid&&tiling.coveringGeometry?.hipRuns){
    const runs=tiling.coveringGeometry.hipRuns;
    const edges=edgeModel.edges.map(edge=>{const run=edge.kind==='hip'?runs.find(r=>r.side===edge.side):null;return run?{...edge,lengthMM:run.lengthMM,coveringAllowance:run}:edge;});
    const totalsByKind={};for(const edge of edges){const total=totalsByKind[edge.kind]??{count:0,lengthMM:0};totalsByKind[edge.kind]={count:total.count+1,lengthMM:total.lengthMM+edge.lengthMM};}
    edgeModel={...edgeModel,edges,totalsByKind};
  }
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
