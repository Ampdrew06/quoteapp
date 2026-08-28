const asFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function findLegacyMainTileQuantity(lines = []) {
  const mainTileLine = lines.find((line) => {
    const text = `${line?.key || ""} ${line?.label || ""}`.toLowerCase();

    return (
      (text.includes("tile_britmet") ||
        text.includes("tile_liteslate") ||
        text.includes("ls_tiles") ||
        text.includes("britmet tiles") ||
        text.includes("liteslate tiles")) &&
      !text.includes("ridge") &&
      !text.includes("verge") &&
      !text.includes("barge") &&
      !text.includes("starter") &&
      !text.includes("fix")
    );
  });

  if (!mainTileLine) return null;

  const quantity = Number(
    mainTileLine.qty ??
      mainTileLine.order_qty ??
      mainTileLine.qtyDisplay
  );

  return Number.isFinite(quantity) ? quantity : null;
}

export function buildSummaryTilingComparison({
  legacyTileLines = [],
  legacyExternalLathM = 0,
  automaticResult = null,
} = {}) {
  if (!automaticResult || (automaticResult.errors || []).length > 0) {
    return null;
  }

  const legacyTileQuantity = findLegacyMainTileQuantity(legacyTileLines);
  const universalTileQuantity = asFiniteNumber(
    automaticResult.tileQuantityOrdered
  );
  const legacyLathM = asFiniteNumber(legacyExternalLathM);
  const universalLathM = asFiniteNumber(automaticResult.lathLengthMM) / 1000;

  return {
    legacyTileQuantity,
    universalTileQuantity,
    tileDifference:
      legacyTileQuantity == null
        ? null
        : universalTileQuantity - legacyTileQuantity,
    legacyExternalLathM: legacyLathM,
    universalExternalLathM: universalLathM,
    externalLathDifferenceM: universalLathM - legacyLathM,
  };
}