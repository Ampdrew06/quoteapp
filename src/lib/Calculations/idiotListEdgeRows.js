const isTileStarter = (row = {}) => {
  const text = `${row.key || ""} ${row.item || ""} ${
    row.label || row.name || ""
  }`.toLowerCase();
  return /tile[\s_-]*starter/.test(text);
};

export function applyAutomaticEdgeBOMToIdiotListRows({
  rows = [],
  automaticEdgeResult = null,
} = {}) {
  const originalRows = Array.isArray(rows) ? rows : [];
  const bom = automaticEdgeResult?.bom || automaticEdgeResult;

  if (!bom?.valid) {
    return {
      valid: false,
      rows: originalRows,
      errors: bom?.errors || ["Valid automatic edge BOM was not supplied."],
    };
  }

  const starter = (bom.lines || []).find(
    (line) => line.key === "tile_starter"
  );

  if (!starter) {
    return {
      valid: false,
      rows: originalRows,
      errors: ["The automatic tile-starter line was not found."],
    };
  }

  const starterRow = {
    key: "tile_starter",
    item: "Tile Starter",
    qty: Number(starter.order_qty || 0),
    units: "Lengths",
    usedLengthM: Number(Number(starter.qty || 0).toFixed(3)),
    stockLengthM: Number(starter.stockLengthMM || 0) / 1000,
    retainedOffcutM: Number(
      (Number(starter.retainedOffcutMM || 0) / 1000).toFixed(3)
    ),
  };

  const firstStarterIndex = originalRows.findIndex(isTileStarter);
  const withoutStarter = originalRows.filter((row) => !isTileStarter(row));
  const insertAt = firstStarterIndex >= 0 ? firstStarterIndex : 0;

  return {
    valid: true,
    rows: [
      ...withoutStarter.slice(0, insertAt),
      starterRow,
      ...withoutStarter.slice(insertAt),
    ],
    errors: [],
  };
}

const rowText = (row = {}) =>
  `${row.key || ""} ${row.item || ""} ${row.label || row.name || ""}`.toLowerCase();

const isHipCoveringRow = (row) =>
  /hip[\s/_-]*(ridge|cover)|ridge[\s/_-]*tile/.test(rowText(row));
const isHipEndCapRow = (row) => /hip[\s/_-]*end[\s/_-]*cap/.test(rowText(row));
const isTwoPartBargeRow = (row) => /2[\s-]*part[\s-]*barge/.test(rowText(row));

export function applyAutomaticHipRowsToIdiotListTileRows({
  rows = [],
  automaticEdgeResult = null,
} = {}) {
  const originalRows = Array.isArray(rows) ? rows : [];
  const stock = automaticEdgeResult?.stock;
  const requirements = automaticEdgeResult?.accessoryRequirements?.requirements;

  if (!automaticEdgeResult?.valid || !stock?.valid || !requirements) {
    return {
      valid: false,
      rows: originalRows,
      errors: automaticEdgeResult?.errors || ["Valid automatic edges were not supplied."],
    };
  }

  const hasTwoPartBarge = Number(requirements.twoPartBarge?.edgeCount || 0) > 0;
  const retainedRows = originalRows.filter((row) => {
    if (isHipCoveringRow(row) || isHipEndCapRow(row)) return false;
    if (isTwoPartBargeRow(row) && !hasTwoPartBarge) return false;
    return true;
  });
  const hipRows = (stock.lines || [])
    .filter((line) =>
      ["hip_ridge", "hip_end_cap_90", "hip_end_cap_135"].includes(line.key)
    )
    .map((line) => ({
      key: line.key,
      item: line.label,
      qty: Number(line.qty || 0),
      units: line.units || "Ea",
    }));
  const finishingKitIndex = retainedRows.findIndex((row) =>
    /finishing[\s_-]*kit/.test(rowText(row))
  );
  const insertAt = finishingKitIndex >= 0 ? finishingKitIndex : retainedRows.length;

  return {
    valid: true,
    rows: [
      ...retainedRows.slice(0, insertAt),
      ...hipRows,
      ...retainedRows.slice(insertAt),
    ],
    errors: [],
  };
}

const isMainRoofTileRow = (row) => {
  const text = rowText(row);
  if (/ridge|hip|verge|barge|starter|end[\s_-]*cap|finishing/.test(text)) {
    return false;
  }
  return /tile|shingle|slate/.test(text);
};

const automaticTileLabel = (productId) => {
  const product = String(productId || "britmetShingle").toLowerCase();
  if (product.includes("tapco")) return "Tapco slates";
  if (product.includes("slate")) return "LiteSlate tiles";
  if (product.includes("metrotile")) return "Metrotile shingles";
  return "Britmet tiles";
};

export function applyAutomaticMainTileToIdiotListRows({
  rows = [],
  automaticEdgeResult = null,
} = {}) {
  const originalRows = Array.isArray(rows) ? rows : [];
  const tiling = automaticEdgeResult?.tiling;
  const quantity = Number(tiling?.result?.tileQuantityOrdered);

  if (!automaticEdgeResult?.valid || !Number.isFinite(quantity)) {
    return {
      valid: false,
      rows: originalRows,
      errors: automaticEdgeResult?.errors || ["Valid automatic tiling was not supplied."],
    };
  }

  const tileRow = {
    key: "main_roof_tiles",
    item: automaticTileLabel(tiling.productId),
    qty: quantity,
    units: "pcs",
  };
  const firstTileIndex = originalRows.findIndex(isMainRoofTileRow);
  const withoutMainTile = originalRows.filter((row) => !isMainRoofTileRow(row));
  const insertAt = firstTileIndex >= 0 ? firstTileIndex : 0;

  return {
    valid: true,
    rows: [
      ...withoutMainTile.slice(0, insertAt),
      tileRow,
      ...withoutMainTile.slice(insertAt),
    ],
    errors: [],
  };
}

const isStructuralMetalRow = (row) =>
  /joist[\s_-]*hanger|jack[\s_-]*rafter[\s_-]*(hook|bracket)|boss[\s/_-]*rafter[\s_-]*terminal|spar[\s_-]*hook/.test(
    rowText(row)
  );

export function applyAutomaticStructuralMetalToIdiotListRows({
  rows = [],
  automaticEdgeResult = null,
} = {}) {
  const originalRows = Array.isArray(rows) ? rows : [];
  const geometry = automaticEdgeResult?.tiling?.geometry;
  const isHippedLeanTo =
    automaticEdgeResult?.edgeModel?.roofStyle === "hippedLeanTo";

  if (!automaticEdgeResult?.valid || !isHippedLeanTo || !geometry) {
    return {
      valid: false,
      rows: originalRows,
      errors: automaticEdgeResult?.errors || ["Valid Hipped Lean-To geometry was not supplied."],
    };
  }

  const number = (value) => Math.max(0, Number(value) || 0);
  const plainRafterQty = number(geometry.plainRafterCount);
  const jackRafterQty =
    number(geometry.leftJackRafterCount) +
    number(geometry.rightJackRafterCount) +
    number(geometry.leftSideIntermediateJackCount) +
    number(geometry.rightSideIntermediateJackCount);
  const bossQty = number(geometry.bossQty);
  const sparHookQty = number(geometry.sparHookQty);
  const structuralRows = [
    plainRafterQty > 0 && {
      key: "joist_hangers",
      item: "Joist Hangers",
      qty: plainRafterQty,
      units: "Ea",
    },
    jackRafterQty > 0 && {
      key: "jack_rafter_hooks",
      item: "Jack Rafter Hooks",
      qty: jackRafterQty,
      units: "Ea",
    },
    jackRafterQty > 0 && {
      key: "jack_rafter_brackets",
      item: "Jack Rafter Brackets",
      qty: jackRafterQty,
      units: "Ea",
    },
    bossQty > 0 && {
      key: "boss_rafter_terminal",
      item: "Boss / Rafter Terminal",
      qty: bossQty,
      units: "Ea",
    },
    sparHookQty > 0 && {
      key: "spar_hook",
      item: "Spar Hook",
      qty: sparHookQty,
      units: "Ea",
    },
  ].filter(Boolean);
  const firstStructuralIndex = originalRows.findIndex(isStructuralMetalRow);
  const withoutStructural = originalRows.filter(
    (row) => !isStructuralMetalRow(row)
  );
  const insertAt =
    firstStructuralIndex >= 0 ? firstStructuralIndex : withoutStructural.length;

  return {
    valid: true,
    rows: [
      ...withoutStructural.slice(0, insertAt),
      ...structuralRows,
      ...withoutStructural.slice(insertAt),
    ],
    errors: [],
  };
}
