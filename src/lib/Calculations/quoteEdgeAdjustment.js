const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function buildQuoteEdgeAdjustment({
  legacyTileStarterCost = 0,
  automaticEdgeResult = null,
} = {}) {
  const legacyCost = Math.max(0, finite(legacyTileStarterCost));
  const bom = automaticEdgeResult?.bom || automaticEdgeResult;

  if (!bom?.valid) {
    return {
      valid: false,
      legacyTileStarterCost: legacyCost,
      universalTileStarterCost: 0,
      adjustment: 0,
      errors: bom?.errors || ["Valid automatic edge BOM was not supplied."],
    };
  }

  const tileStarterLine = (bom.lines || []).find(
    (line) => line.key === "tile_starter"
  );

  if (!tileStarterLine) {
    return {
      valid: false,
      legacyTileStarterCost: legacyCost,
      universalTileStarterCost: 0,
      adjustment: 0,
      errors: ["The universal tile-starter BOM line was not found."],
    };
  }

  const universalCost = Math.max(
    0,
    finite(tileStarterLine.line ?? tileStarterLine.total)
  );
  const confirmedHipProductCost = (bom.lines || [])
    .filter((line) =>
      ["hip_ridge", "hip_end_cap_90", "hip_end_cap_135"].includes(line.key)
    )
    .reduce(
      (total, line) =>
        total + Math.max(0, finite(line.line ?? line.total)),
      0
    );

  return {
    valid: true,
    legacyTileStarterCost: legacyCost,
    universalTileStarterCost: universalCost,
    confirmedHipProductCost,
    adjustment: universalCost - legacyCost + confirmedHipProductCost,
    errors: [],
  };
}
