const n = value => Math.max(0, Number(value) || 0);
const line = (key, label, qty, cost, weight, extra = {}) => ({ key, _k: key, label,
  qty, order_qty: qty, units: 'Length', unit: qty ? n(cost) / qty : 0,
  unitPrice: qty ? n(cost) / qty : 0, line: n(cost), total: n(cost),
  weight_kg: Number(n(weight).toFixed(2)), totalWeightKg: Number(n(weight).toFixed(2)),
  total_weight_kg: Number(n(weight).toFixed(2)), price_unconfigured: cost == null, ...extra });

// Only the approved hipped perimeter is replaced. Legacy Lean-To remains unchanged.
export function integratePlasticsSummary(audit, legacyLines, materials = {}) {
  if (!audit?.valid || audit.remainingOpenVerges.length) return legacyLines;
  const band = audit.band;
  const fasciaRate = n(materials[`fascia_weight_kg_per_m_${band}`]);
  const soffitRate = n(materials[`soffit_weight_kg_per_m_${band}`]);
  const fasciaPrices = materials[`fascia_price_per_length_${band}_mm`] || {};
  const fasciaWidths = [...new Set(audit.fasciaPlan.boards.map(board => board.widthMM))];
  const result = fasciaWidths.map((width, index) => {
    const boards = audit.fasciaPlan.boards.filter(board => board.widthMM === width);
    const usedM = boards.reduce((sum, board) => sum + board.pieces.reduce((t,p) => t + p.lengthM,0),0);
    return line(index ? `fascia_${width}` : 'fascia', `Reveal Liner ${width} mm — ${band}`, boards.length,
      fasciaPrices[width] == null ? null : boards.length * n(fasciaPrices[width]), usedM * fasciaRate, { used_m: usedM });
  });
  audit.soffitPlan.order.forEach((item,index) => {
    const boards = audit.soffitPlan.boards.filter(board => board.widthMM === item.widthMM);
    const usedM = boards.reduce((sum,board) => sum + board.strips.reduce((t,strip) => t + strip.pieces.reduce((u,p) => u+p.lengthM,0),0),0);
    const price = materials[`soffit_price_per_length_${band}_mm`]?.[item.widthMM];
    result.push(line(index ? `soffit_${item.widthMM}` : 'soffit', `Soffit ${item.widthMM} mm × 5m — ${band}`,item.qty,
      price == null ? null : item.qty*n(price), usedM*soffitRate, { used_m: usedM }));
  });
  const oldVent = legacyLines.find(row => row.key === 'vent');
  result.push(line('vent','Factory Reveal Liner venting',audit.totals.ventQtyM,audit.totals.ventCost,n(oldVent?.weight_kg),{units:'m'}));
  audit.accessories.lines.filter(item => item.key !== 'polytop_pins').forEach(item => {
    let weight = 0;
    if (item.key === 'fascia_corners') weight = item.qty*n(materials.fascia_corner_weight_kg_each);
    if (item.key === 'fascia_joints') weight = item.qty*n(materials.fascia_joint_weight_kg_each);
    if (item.key === 'j_trim') weight = audit.accessories.jRunM/audit.accessories.jStockM*n(materials[`j_section_weight_kg_each_${band}`]);
    result.push(line(item.key,item.label,item.qty,item.cost,weight,{ units:item.unit, used_m:item.key === 'j_trim' ? audit.accessories.jRunM : undefined }));
  });
  return result;
}
