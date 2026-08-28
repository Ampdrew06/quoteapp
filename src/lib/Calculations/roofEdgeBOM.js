const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * Adapt confirmed edge stock into Summary-style BOM lines.
 *
 * Tile starter is ordered as complete 3 m lengths, but cost and installed
 * weight are allocated only to the metres used by this roof because retained
 * offcuts are reused on later roofs.
 */
export function buildRoofEdgeBOM({ stockResult = null, materials = {} } = {}) {
  if (!stockResult?.valid) {
    return {
      valid: false,
      lines: [],
      errors: stockResult?.errors || ["Valid edge stock was not supplied."],
    };
  }

  const tileStarterStock = (stockResult.lines || []).find(
    (line) => line.key === "tile_starter"
  );

  if (!tileStarterStock) {
    return {
      valid: false,
      lines: [],
      errors: ["The confirmed tile-starter stock line was not found."],
    };
  }

  const stockLengthMM = Math.max(0, finite(tileStarterStock.stockLengthMM));
  const requiredLengthMM = Math.max(
    0,
    finite(tileStarterStock.requiredLengthMM)
  );
  const orderQty = Math.max(0, finite(tileStarterStock.qty));
  const requiredLengthM = requiredLengthMM / 1000;
  const stockLengthM = stockLengthMM / 1000;
  const pricePerLength = Math.max(
    0,
    finite(
      materials.tile_starter_price_each ??
        materials.metal?.tile_starter?.price_each
    )
  );
  const weightPerLengthKg = Math.max(
    0,
    finite(
      materials.tile_starter_weight_kg_each ??
        materials.metal?.tile_starter?.weight_kg_each
    )
  );
  const pricePerM = stockLengthM > 0 ? pricePerLength / stockLengthM : 0;
  const weightPerM = stockLengthM > 0 ? weightPerLengthKg / stockLengthM : 0;

  return {
    valid: true,
    lines: [
      {
        key: "tile_starter",
        label: "Tile starter",
        qty: requiredLengthM,
        order_qty: orderQty,
        units: "m",
        stockLengthMM,
        priceEach: pricePerM,
        unit: pricePerM,
        line: requiredLengthM * pricePerM,
        total: requiredLengthM * pricePerM,
        weightPerUnitKg: weightPerM,
        weight_kg: requiredLengthM * weightPerM,
        chargeBasis: "usedLength",
        pooledAcrossEdges: tileStarterStock.pooledAcrossEdges === true,
        retainedOffcutMM: Math.max(
          0,
          orderQty * stockLengthMM - requiredLengthMM
        ),
      },
    ],
    errors: [],
  };
}

