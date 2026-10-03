// Consume the approved audit; never recalculate edge geometry in Summary.
export function selectHipRidgeLathSummaryContribution(audit) {
  if (!audit?.valid) return { additionalLathM: 0, tapeLine: null };
  const { additionalLathM, tapeLengthM, tapeRollQty, tapeRollLengthM } = audit.quantities;
  const tapeLine = tapeRollQty > 0 ? {
    key: "expanding_foam_tape",
    label: `Expanding foam tape (${tapeRollLengthM} m roll)${audit.tapeInstalledWeightKg == null ? " — weight unconfigured" : ""}`,
    qty: tapeRollQty,
    order_qty: tapeRollQty,
    units: "Roll",
    used_m: tapeLengthM,
    unitPrice: audit.tapeCost == null ? 0 : audit.tapeCost / tapeRollQty,
    unit: audit.tapeCost == null ? 0 : audit.tapeCost / tapeRollQty,
    line: audit.tapeCost ?? 0,
    total: audit.tapeCost ?? 0,
    weight_kg: Number((audit.tapeInstalledWeightKg ?? 0).toFixed(2)),
    totalWeightKg: Number((audit.tapeInstalledWeightKg ?? 0).toFixed(2)),
    total_weight_kg: Number((audit.tapeInstalledWeightKg ?? 0).toFixed(2)),
    weight_kg_each: Number((audit.tapeInstalledWeightKg ?? 0).toFixed(2)) / tapeRollQty,
    weight_unconfigured: audit.tapeInstalledWeightKg == null,
    price_unconfigured: audit.tapeCost == null,
  } : null;
  return { additionalLathM, tapeLine };
}
