// Replace only audited consumables; keep insulation and existing integrations intact.
const round = value => Number(Number(value).toFixed(2));
export const miscellaneousIntegrationKeys = [
  'expanding_foam', 'alu_roll_tape', 'screws_rafter_eaves',
  'screws_lath_fixings', 'screws_tile_fixings', 'd4_glue',
  'factory_screws_1_5x10', 'factory_spar_rivets', 'factory_drywall_32mm',
];
export function integrateMiscellaneousSummary(audit, lines = []) {
  if (!audit?.valid || !audit?.lathAudit?.valid || !audit.rows?.length ||
      audit.rows.some(row => row.candidateQty == null || !Number.isFinite(Number(row.candidateQty)))) return lines;
  const replacements = new Map(audit.rows.map(item => {
    const previous = lines.find(row => row.key === item.key) || {};
    const qty = Number(item.candidateQty);
    const previousQty = Number(previous.qty ?? previous.order_qty ?? 0);
    const previousWeight = Number(previous.weight_kg ?? previous.totalWeightKg ?? previous.weightKg ?? 0);
    // Retain the accepted existing site allowance weights; factory weights need a configured basis.
    const weight = item.usage === 'factory' ? 0 : round(previousQty > 0 ? previousWeight * qty / previousQty : 0);
    const cost = round(item.cost ?? 0);
    const row = { ...previous, key: item.key, _k: item.key,
      label: item.usage === 'factory' ? `${item.label} (factory use; weight unconfigured)` : (previous.label || item.label),
      qty, order_qty: qty, qtyDisplay: qty,
      units: item.usage === 'factory' ? (item.key === 'd4_glue' ? 'Tub' : 'Ea') : (item.key.startsWith('screws_') ? 'Box' : (previous.units || 'Ea')),
      unit: qty > 0 ? cost / qty : 0, unitPrice: qty > 0 ? cost / qty : 0,
      line: cost, total: cost, cost, totalCost: cost,
      weight_kg: weight, weightKg: weight, totalWeightKg: weight, total_weight_kg: weight,
      weight_kg_each: qty > 0 ? weight / qty : 0,
      usage: item.usage || 'site', supplyToSite: item.usage !== 'factory',
      price_unconfigured: item.cost == null, weight_unconfigured: item.usage === 'factory',
      requirement_basis: item.basis,
    };
    return [item.key, row];
  }));
  const result = [];
  const added = new Set();
  for (const row of lines) {
    if (!replacements.has(row.key)) result.push(row);
    else if (!added.has(row.key)) { result.push(replacements.get(row.key)); added.add(row.key); }
  }
  for (const [key, row] of replacements) if (!added.has(key)) result.push(row);
  return result;
}
// Pricing starts from the legacy quote base, so reconcile these same rows explicitly.
export function miscellaneousPricingDelta(audit, integratedLines, baselineLines = [], excluded = () => false) {
  if (!audit?.valid || !audit?.lathAudit?.valid || integratedLines === baselineLines) return 0;
  const sum = lines => lines.reduce((total, row) => total +
    (miscellaneousIntegrationKeys.includes(row.key) && !excluded(row.key)
      ? Number(row.line ?? row.total ?? row.cost ?? 0) || 0 : 0), 0);
  return round(sum(integratedLines) - sum(baselineLines));
}
export function miscellaneousSiteSupplyLines(lines = [], adjustments = {}) {
  return lines.filter(row => row.usage !== 'factory' && row.supplyToSite !== false).map(row => {
    if (!miscellaneousIntegrationKeys.includes(row.key)) return row;
    const qty = Math.max(0, Number(row.qty ?? row.order_qty ?? 0) + (Number(adjustments[row.key]) || 0));
    return { ...row, qty, order_qty: qty, orderQty: qty, qty_order: qty, qtyDisplay: qty };
  });
}
