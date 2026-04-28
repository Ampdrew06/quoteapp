// src/lib/pricing.js

/**
 * Central pricing helper.
 *
 * Inputs:
 *   - materialsCost: number (already includes waste / stock rounding etc.)
 *   - m: materials object from getMaterials()
 *
 * Reads:
 *   - m.delivery_flat  (optional flat £)
 *   - m.profit_pct     (optional % markup on materials)
 *   - m.vat_rate       (0–1, e.g. 0.2) OR m.vat_pct (0–100, e.g. 20)
 */
export function computePricing(materialsCost, m = {}, extras = {}) {
  const safeM = m || {};
  const cost = Number(materialsCost) || 0;

  const labourCost = Number(extras.labourCost ?? 0);
const delivery  = Number(safeM.delivery_flat ?? 0);
const profitPct = Number(safeM.profit_pct ?? 0);

const baseCost = cost + labourCost + delivery;
const profit = baseCost * (profitPct / 100);

const net = baseCost + profit;

  // Support either vat_rate (decimal) or vat_pct (percentage)
  let vatRate;
  if (safeM.vat_rate != null) {
    vatRate = Number(safeM.vat_rate) || 0;
  } else {
    const pct = Number(safeM.vat_pct ?? 20);
    vatRate = pct / 100;
  }

  const vat   = net * vatRate;
  const gross = net + vat;

  const marginPct = net > 0 ? (profit / net) * 100 : 0;

  return {
    materialsCost: cost,
    labourCost,
    delivery,
    baseCost, 
    profitPct,
    profit,
    net,
    vatRate,
    vat,
    gross,
    marginPct,
  };
}
export function computeLabourPricing({
  widthMM,
  projectionMM,
  tileSystem = "britmet",
  config = {},
  features = {},
}) {
  const dayRate = Number(config.dayRate ?? 300);
  const averageAreaM2 = Number(config.averageAreaM2 ?? 15);
  const minimumDays = Number(config.minimumDays ?? 1);

  const roofTypeFactor = Number(config.roofTypeFactor ?? 1);

  const tileFactor =
    tileSystem === "liteslate"
      ? Number(config.liteslateFactor ?? -0.2)
      : Number(config.britmetFactor ?? 0);

  const roofVentFactor = features.roofVent
    ? Number(config.roofVentFactor ?? 0.3)
    : 0;

  const fixedUnitFactor = features.fixedUnit
    ? Number(config.fixedUnitFactor ?? 0.5)
    : 0;

  const reinforcedRingBeamFactor = features.reinforcedRingBeam
    ? Number(config.reinforcedRingBeamFactor ?? 0.3)
    : 0;

  const areaM2 =
    (Number(widthMM || 0) / 1000) * (Number(projectionMM || 0) / 1000);

  const areaFactor = averageAreaM2 > 0 ? areaM2 / averageAreaM2 : 0;

  const complexity =
    roofTypeFactor +
    tileFactor +
    roofVentFactor +
    fixedUnitFactor +
    reinforcedRingBeamFactor;

  const rawDays = complexity * areaFactor;
  const labourDays = Math.max(minimumDays, rawDays);
  const labourCost = labourDays * dayRate;

  return {
    areaM2,
    areaFactor,
    complexity,
    rawDays,
    labourDays,
    labourCost,
    dayRate,
    averageAreaM2,
    minimumDays,
  };
}
export const LABOUR_PRICING_KEY = "labour_pricing_v1";

export const defaultLabourPricingConfig = {
  dayRate: 300,
  averageAreaM2: 15,
  minimumDays: 1,

  roofTypeFactor: 1,

  britmetFactor: 0,
  liteslateFactor: -0.2,

  roofVentFactor: 0.3,
  fixedUnitFactor: 0.5,
  reinforcedRingBeamFactor: 0.3,
};

export function getLabourPricingConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(LABOUR_PRICING_KEY) || "{}");
    return { ...defaultLabourPricingConfig, ...saved };
  } catch {
    return defaultLabourPricingConfig;
  }
}

export function saveLabourPricingConfig(config) {
  localStorage.setItem(
    LABOUR_PRICING_KEY,
    JSON.stringify({ ...defaultLabourPricingConfig, ...(config || {}) })
  );
}