const isTileStarter = (line = {}) => {
  const text = `${line.key || ""} ${line._k || ""} ${
    line.label || line.name || ""
  }`.toLowerCase();
  return /tile[\s_-]*starter/.test(text);
};

export function applyAutomaticEdgeBOMToSummaryLines({
  lines = [],
  automaticEdgeResult = null,
} = {}) {
  const originalLines = Array.isArray(lines) ? lines : [];
  const bom = automaticEdgeResult?.bom || automaticEdgeResult;

  if (!bom?.valid) {
    return {
      valid: false,
      lines: originalLines,
      errors: bom?.errors || ["Valid automatic edge BOM was not supplied."],
    };
  }

  const starter = (bom.lines || []).find(
    (line) => line.key === "tile_starter"
  );

  if (!starter) {
    return {
      valid: false,
      lines: originalLines,
      errors: ["The automatic tile-starter line was not found."],
    };
  }

  const summaryStarter = {
    ...starter,
    key: "tile_starter",
    _k: "tile_starter",
    label: "Tile starter (3.0 m length)",
    qty: Number(Number(starter.qty || 0).toFixed(3)),
    units: "m",
    order_qty: Number(starter.order_qty || 0),
    weight_kg: Number(starter.weight_kg || 0),
    line: Number(starter.line || 0),
  };

  const firstStarterIndex = originalLines.findIndex(isTileStarter);
  const withoutStarter = originalLines.filter((line) => !isTileStarter(line));
  const insertAt = firstStarterIndex >= 0 ? firstStarterIndex : 0;

  return {
    valid: true,
    lines: [
      ...withoutStarter.slice(0, insertAt),
      summaryStarter,
      ...withoutStarter.slice(insertAt),
    ],
    errors: [],
  };
}

const isHipProduct = (line = {}) => {
  const text = `${line.key || ""} ${line._k || ""} ${
    line.label || line.name || ""
  }`.toLowerCase();
  return /hip[\s/_-]*(ridge|cover|end)|ridge[\s/_-]*tile/.test(text);
};

export function applyAutomaticHipBOMToSummaryTileLines({
  lines = [],
  automaticEdgeResult = null,
} = {}) {
  const originalLines = Array.isArray(lines) ? lines : [];
  const bom = automaticEdgeResult?.bom || automaticEdgeResult;

  if (!bom?.valid) {
    return {
      valid: false,
      lines: originalLines,
      errors: bom?.errors || ["Valid automatic edge BOM was not supplied."],
    };
  }

  const hipLines = (bom.lines || [])
    .filter((line) =>
      ["hip_ridge", "hip_end_cap_90", "hip_end_cap_135"].includes(line.key)
    )
    .map((line) => ({
      ...line,
      _k: `${line.key} ${String(line.label || "").toLowerCase()}`,
      qty: Number(line.qty || 0),
      order_qty: Number(line.order_qty || line.qty || 0),
      weight_kg: Number(line.weight_kg || 0),
      line: Number(line.line || 0),
    }));
  const withoutLegacyHipProducts = originalLines.filter(
    (line) => !isHipProduct(line)
  );
  const touchupIndex = withoutLegacyHipProducts.findIndex((line) =>
    /touch/.test(`${line.key || ""} ${line.label || ""}`.toLowerCase())
  );
  const insertAt =
    touchupIndex >= 0 ? touchupIndex : withoutLegacyHipProducts.length;

  return {
    valid: true,
    lines: [
      ...withoutLegacyHipProducts.slice(0, insertAt),
      ...hipLines,
      ...withoutLegacyHipProducts.slice(insertAt),
    ],
    errors: [],
  };
}
