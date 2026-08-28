const asFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function isMainRoofTileLine(line = {}) {
  const text = `${line.key || ""} ${line.label || line.name || ""}`.toLowerCase();

  const identifiesMainTiles =
    text.includes("tile_britmet") ||
    text.includes("tile_liteslate") ||
    text.includes("ls_tiles") ||
    text.includes("britmet tiles") ||
    text.includes("liteslate tiles");

  return (
    identifiesMainTiles &&
    !text.includes("ridge") &&
    !text.includes("verge") &&
    !text.includes("barge") &&
    !text.includes("starter") &&
    !text.includes("fix") &&
    !text.includes("touch")
  );
}

/**
 * Adapt the verified universal quantity to Summary's established BOM line.
 *
 * The existing line remains the source of its product label, unit price and
 * weight metadata. Accessories are intentionally left untouched.
 */
export function applyUniversalTilingToSummaryLines({
  lines = [],
  automaticResult = null,
} = {}) {
  if (!automaticResult || (automaticResult.errors || []).length > 0) {
    return { lines, replaced: false, tileQuantity: null };
  }

  const tileQuantity = Number(automaticResult.tileQuantityOrdered);

  if (!Number.isFinite(tileQuantity) || tileQuantity < 0) {
    return { lines, replaced: false, tileQuantity: null };
  }

  let replaced = false;

  const adaptedLines = lines.map((line) => {
    if (replaced || !isMainRoofTileLine(line)) return line;

    replaced = true;

    const unitPrice = asFiniteNumber(line.unitPrice ?? line.unit);
    const lineCost = tileQuantity * unitPrice;

    return {
      ...line,
      qty: tileQuantity,
      qtyDisplay: tileQuantity,
      line: lineCost,
      total: lineCost,
    };
  });

  return {
    lines: adaptedLines,
    replaced,
    tileQuantity: replaced ? tileQuantity : null,
  };
}

export function selectSummaryExternalFixingLathM({
  legacyExternalFixingLathM = 0,
  automaticResult = null,
} = {}) {
  const legacy = Math.max(0, asFiniteNumber(legacyExternalFixingLathM));

  if (!automaticResult || (automaticResult.errors || []).length > 0) {
    return legacy;
  }

  const universal = Number(automaticResult.lathLengthMM);

  return Number.isFinite(universal) && universal >= 0
    ? universal / 1000
    : legacy;
}