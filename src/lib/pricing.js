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
export function computePricing(materialsCost, m = {}) {
  const safeM = m || {};
  const cost = Number(materialsCost) || 0;

  const delivery  = Number(safeM.delivery_flat ?? 0);
  const profitPct = Number(safeM.profit_pct ?? 0);
  const profit    = cost * (profitPct / 100);

  const net = cost + delivery + profit;

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
    delivery,
    profitPct,
    profit,
    net,
    vatRate,
    vat,
    gross,
    marginPct,
  };
}
