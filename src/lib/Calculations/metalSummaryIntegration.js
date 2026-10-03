import { buildWatercourseWallbarRequirement } from './metalIntegrationAudit';
// Preserve audited hardware rows; replace all legacy watercourse rows exactly once.
export function integrateMetalSummaryWatercourse(lines = [], geometry, materials = {}) {
  if (!geometry || !Number.isFinite(Number(geometry.leftExternalWallBarSlopeMM)) ||
      !Number.isFinite(Number(geometry.rightExternalWallBarSlopeMM))) return lines;
  const requirement = buildWatercourseWallbarRequirement(geometry, materials);
  const remaining = lines.filter(row => !/watercourse|secret[\s_-]*gutter/i.test(`${row.key || ''} ${row.label || row.name || ''}`));
  if (!requirement.qty) return remaining;
  const weight = Number(requirement.weightKg.toFixed(2));
  const cost = Number((requirement.cost ?? 0).toFixed(2));
  const row = { key:'watercourse', _k:'watercourse', label:requirement.label,
    qty:requirement.qty, order_qty:requirement.orderQty, units:'Lengths',
    used_m:requirement.usedM, unit:cost/requirement.qty, unitPrice:cost/requirement.qty,
    line:cost, total:cost, weight_kg:weight, totalWeightKg:weight, total_weight_kg:weight,
    weight_kg_each:weight/requirement.qty, price_unconfigured:requirement.cost == null };
  const index = remaining.findIndex(item => item.key === 'tile_starter');
  remaining.splice(index >= 0 ? index+1 : 0,0,row);
  return remaining;
}
