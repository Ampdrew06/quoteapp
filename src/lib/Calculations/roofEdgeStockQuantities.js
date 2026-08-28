const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const pooledStockQuantity = (requiredLengthMM, stockLengthMM) => {
  const required = Math.max(0, finite(requiredLengthMM));
  const stock = Math.max(0, finite(stockLengthMM));

  return required > 0 && stock > 0 ? Math.ceil(required / stock) : 0;
};

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
  ];

  const pending = ["gutter", "hipCovering", "watercourse"];

  if (requirements.twoPartBarge) pending.push("twoPartBarge");
  if (requirements.dryVerge) pending.push("dryVerge");

  return {
    valid: true,
    lines,
    pending,
    errors: [],
  };
}
