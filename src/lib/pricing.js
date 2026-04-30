// src/lib/pricing.js

/**
 * Central pricing helper.
 *
 * Correct pricing flow:
 *
 * materials + labour
 * + markup
 * + delivery
 * = net
 *
 * + VAT
 * = gross
 */
export function computePricing(materialsCost, m = {}, extras = {}) {
  const safeM = m || {};
  const cost = Number(materialsCost) || 0;

  const labourCost = Number(extras.labourCost ?? 0);
  const delivery = Number(extras.deliveryCost ?? safeM.delivery_flat ?? 0);
  const profitPct = Number(safeM.profit_pct ?? 0);

  const baseCost = cost + labourCost;
  const profit = baseCost * (profitPct / 100);

  const netBeforeDelivery = baseCost + profit;
  const net = netBeforeDelivery + delivery;

  // Support either vat_rate (decimal) or vat_pct (percentage)
  let vatRate;
  if (safeM.vat_rate != null) {
    vatRate = Number(safeM.vat_rate) || 0;
  } else {
    const pct = Number(safeM.vat_pct ?? 20);
    vatRate = pct / 100;
  }

  const vat = net * vatRate;
  const gross = net + vat;

  const marginPct = net > 0 ? (profit / net) * 100 : 0;

  return {
    materialsCost: cost,
    labourCost,
    delivery,

    baseCost,
    profitPct,
    profit,

    netBeforeDelivery,
    net,

    vatRate,
    vat,
    gross,
    marginPct,
  };
}

/**
 * Delivery pricing helper.
 *
 * Google returns one-way miles.
 * Your spreadsheet formula uses return miles.
 */
export function computeDeliveryPricing(distanceMilesOneWay, config = {}) {
  const oneWayMiles = Number(distanceMilesOneWay) || 0;

  const hourlyRate = Number(config.hourlyRate ?? 17.96);
  const vanMpg = Number(config.vanMpg ?? 26);
  const fuelPricePerLitre = Number(config.fuelPricePerLitre ?? 1.89);

  const returnMiles = oneWayMiles * 2;

  const timeCost = ((returnMiles / 50) + 1) * hourlyRate;

  const fuelCost =
    vanMpg > 0 ? (returnMiles / vanMpg) * 4.54 * fuelPricePerLitre : 0;

  const deliveryCost = timeCost + fuelCost;

  return {
    oneWayMiles,
    returnMiles,
    hourlyRate,
    vanMpg,
    fuelPricePerLitre,
    timeCost,
    fuelCost,
    deliveryCost,
  };
}

export const DELIVERY_PRICING_KEY = "delivery_pricing_v1";

export const defaultDeliveryPricingConfig = {
  hourlyRate: 17.96,
  vanMpg: 26,
  fuelPricePerLitre: 1.89,
};

export function getDeliveryPricingConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(DELIVERY_PRICING_KEY) || "{}");
    return { ...defaultDeliveryPricingConfig, ...saved };
  } catch {
    return defaultDeliveryPricingConfig;
  }
}

export function saveDeliveryPricingConfig(config) {
  localStorage.setItem(
    DELIVERY_PRICING_KEY,
    JSON.stringify({ ...defaultDeliveryPricingConfig, ...(config || {}) })
  );
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
export const MARKUP_PRICING_KEY = "markup_pricing_v1";

export const defaultMarkupPricingConfig = {
  profitPct: 50,
};

export function getMarkupPricingConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(MARKUP_PRICING_KEY) || "{}");
    return { ...defaultMarkupPricingConfig, ...saved };
  } catch {
    return defaultMarkupPricingConfig;
  }
}

export function saveMarkupPricingConfig(config) {
  localStorage.setItem(
    MARKUP_PRICING_KEY,
    JSON.stringify({ ...defaultMarkupPricingConfig, ...(config || {}) })
  );
}