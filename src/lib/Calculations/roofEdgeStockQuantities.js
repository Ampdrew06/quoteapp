const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const pooledStockQuantity = (requiredLengthMM, stockLengthMM) => {
  const required = Math.max(0, finite(requiredLengthMM));
  const stock = Math.max(0, finite(stockLengthMM));

  return required > 0 && stock > 0 ? Math.ceil(required / stock) : 0;
};

const perEdgeStockQuantity = (edges = [], effectiveCoverMM = 0) =>
  (edges || []).reduce(
    (total, edge) =>
      total + pooledStockQuantity(edge.lengthMM, effectiveCoverMM),
    0
  );

/**
 * Convert verified raw edge requirements into purchasable stock quantities.
 *
 * Only confirmed rules belong here. Tile-starter offcuts are pooled and reused
 * across every eaves edge. Other edge products remain pending until their
 * stock/overlap rules are verified.
 */
export function buildRoofEdgeStockQuantities({
  accessoryRequirements = null,
  materials = {},
} = {}) {
  if (!accessoryRequirements?.valid) {
    return {
      valid: false,
      lines: [],
      pending: [],
      errors:
        accessoryRequirements?.errors || [
          "Valid edge accessory requirements were not supplied.",
        ],
    };
  }

  const requirements = accessoryRequirements.requirements || {};
  const tileStarterRequirement = requirements.tileStarter || {};
  const tileStarterStockLengthMM =
    materials.tile_starter_stock_length_m != null
      ? Math.max(0, finite(materials.tile_starter_stock_length_m, 3)) * 1000
      : Math.max(0, finite(materials.eaves_guard_piece_cover_mm, 3000));

  const tileStarterQty = pooledStockQuantity(
    tileStarterRequirement.totalLengthMM,
    tileStarterStockLengthMM
  );

  const hipCoveringRequirement = requirements.hipCovering || {};
  const hipOverallLengthMM = Math.max(
    0,
    finite(materials.hip_ridge_overall_length_mm, 1250)
  );
  const hipEffectiveCoverMM = Math.max(
    0,
    finite(materials.hip_ridge_effective_cover_mm, 1150)
  );
  const hipCoveringQty = perEdgeStockQuantity(
    hipCoveringRequirement.edges,
    hipEffectiveCoverMM
  );
  const hipEndCaps = requirements.hipEndCaps || {};

  const lines = [
    {
      key: "tile_starter",
      label: "Tile starter",
      qty: tileStarterQty,
      units: "lengths",
      stockLengthMM: tileStarterStockLengthMM,
      requiredLengthMM: Math.max(
        0,
        finite(tileStarterRequirement.totalLengthMM)
      ),
      pooledAcrossEdges: true,
      sourceEdgeIds: tileStarterRequirement.edgeIds || [],
    },
    ...(hipCoveringQty > 0
      ? [
          {
            key: "hip_ridge",
            label: "Hip / Ridge tile",
            qty: hipCoveringQty,
            units: "pcs",
            stockLengthMM: hipOverallLengthMM,
            effectiveCoverMM: hipEffectiveCoverMM,
            requiredLengthMM: Math.max(
              0,
              finite(hipCoveringRequirement.totalLengthMM)
            ),
            calculatedPerEdge: true,
            perEdgeQuantities: (hipCoveringRequirement.edges || []).map(
              (edge) => ({
                edgeId: edge.edgeId,
                lengthMM: Math.max(0, finite(edge.lengthMM)),
                qty: pooledStockQuantity(edge.lengthMM, hipEffectiveCoverMM),
              })
            ),
            sourceEdgeIds: hipCoveringRequirement.edgeIds || [],
          },
        ]
      : []),
    ...(Number(hipEndCaps.qty90) > 0
      ? [
          {
            key: "hip_end_cap_90",
            label: "90° Hip End Cap",
            qty: Number(hipEndCaps.qty90),
            units: "Ea",
            sourceEdgeIds: (hipEndCaps.edges || [])
              .filter((edge) => edge.suppliedAngleDeg === 90)
              .map((edge) => edge.edgeId),
          },
        ]
      : []),
    ...(Number(hipEndCaps.qty135) > 0
      ? [
          {
            key: "hip_end_cap_135",
            label: "135° Hip End Cap",
            qty: Number(hipEndCaps.qty135),
            units: "Ea",
            sourceEdgeIds: (hipEndCaps.edges || [])
              .filter((edge) => edge.suppliedAngleDeg === 135)
              .map((edge) => edge.edgeId),
          },
        ]
      : []),
  ];

  const pending = ["gutter", "watercourse"];

  if (requirements.twoPartBarge) pending.push("twoPartBarge");
  if (requirements.dryVerge) pending.push("dryVerge");

  return {
    valid: true,
    productFamily: accessoryRequirements.productFamily,
    lines,
    pending,
    errors: [],
  };
}
