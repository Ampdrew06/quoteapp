import { isMainRoofTileLine } from "./summaryTilingBOM";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const lineCost = (line = {}) => {
  const explicit = Number(line.line ?? line.total);
  if (Number.isFinite(explicit)) return explicit;

  return finite(line.qty) * finite(line.unitPrice ?? line.unit ?? line.priceEach);
};

const findMainTileLine = (lines = []) =>
  lines.find((line) => isMainRoofTileLine(line)) || null;

/**
 * Returns the cost-only adjustment needed to replace the legacy roof-covering
 * quantity and external fixing-lath length with the universal tiling result.
 *
 * Internal fixing laths and ring-beam finishing laths are intentionally absent:
 * they remain owned by their existing component calculations.
 */
export function buildQuoteTilingAdjustment({
  legacyTileLines = [],
  legacyExternalFixingLathM = 0,
  automaticResult = null,
  lathPricePerM = 0,
  lathWastePercent = 0,
} = {}) {
  const legacyTileLine = findMainTileLine(legacyTileLines);
  const errors = automaticResult?.errors || [];

  if (!legacyTileLine || !automaticResult || errors.length > 0) {
    return {
      valid: false,
      adjustment: 0,
      reason: !legacyTileLine
        ? "The legacy main roof-tile line was not found."
        : !automaticResult
        ? "The universal tiling result was not supplied."
        : errors[0],
    };
  }

  const universalTileQuantity = Number(automaticResult.tileQuantityOrdered);
  const universalExternalFixingLathM =
    Number(automaticResult.lathLengthMM) / 1000;

  if (
    !Number.isFinite(universalTileQuantity) ||
    universalTileQuantity < 0 ||
    !Number.isFinite(universalExternalFixingLathM) ||
    universalExternalFixingLathM < 0
  ) {
    return {
      valid: false,
      adjustment: 0,
      reason: "The universal tiling result contains an invalid quantity.",
    };
  }

  const tileUnitPrice = finite(
    legacyTileLine.unitPrice ?? legacyTileLine.unit ?? legacyTileLine.priceEach
  );
  const legacyTileCost = lineCost(legacyTileLine);
  const universalTileCost = universalTileQuantity * tileUnitPrice;

  const legacyLathM = Math.max(0, finite(legacyExternalFixingLathM));
  const lathUnitPrice = Math.max(0, finite(lathPricePerM));
  const lathWasteMultiplier =
    1 + Math.max(0, finite(lathWastePercent)) / 100;
  const legacyExternalLathCost =
    legacyLathM * lathUnitPrice * lathWasteMultiplier;
  const universalExternalLathCost =
    universalExternalFixingLathM * lathUnitPrice * lathWasteMultiplier;

  const tileCostAdjustment = universalTileCost - legacyTileCost;
  const externalLathCostAdjustment =
    universalExternalLathCost - legacyExternalLathCost;

  return {
    valid: true,
    adjustment: tileCostAdjustment + externalLathCostAdjustment,
    tileCostAdjustment,
    externalLathCostAdjustment,
    legacyTileQuantity: finite(legacyTileLine.qty),
    universalTileQuantity,
    legacyExternalFixingLathM: legacyLathM,
    universalExternalFixingLathM,
    legacyTileCost,
    universalTileCost,
    legacyExternalLathCost,
    universalExternalLathCost,
  };
}
