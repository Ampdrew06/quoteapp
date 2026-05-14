export function computeTotalWeightKg(lines = []) {
  return lines.reduce((sum, l) => {
    // 1. Explicit total (best case)
    if (Number.isFinite(l.totalWeightKg)) {
      return sum + l.totalWeightKg;
    }

    // 2. Per-unit weight
    if (
      Number.isFinite(l.weightPerUnitKg) &&
      Number.isFinite(l.qty)
    ) {
      return sum + l.weightPerUnitKg * l.qty;
    }

    return sum;
  }, 0);
}