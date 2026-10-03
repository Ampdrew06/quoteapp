const finiteNonNegative = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

/**
 * Select one coherent set of wallplate quantities for the live Summary.
 *
 * Ordinary Lean-To roofs retain their established allowances. A Hipped
 * Lean-To changes only when the complete audited wallplate material set is
 * available; otherwise all three legacy allowances are retained together.
 */
export function selectWallplateSummaryQuantities({
  isHippedLeanTo = false,
  legacy = {},
  wallplateAudit = null,
} = {}) {
  const legacyQuantities = {
    steicoLengthM: finiteNonNegative(legacy.steicoLengthM) ?? 0,
    ply9AreaM2: finiteNonNegative(legacy.ply9AreaM2) ?? 0,
    ply18AreaM2: finiteNonNegative(legacy.ply18AreaM2) ?? 0,
  };

  if (!isHippedLeanTo) {
    return {
      valid: true,
      source: "legacy",
      quantities: legacyQuantities,
    };
  }

  const manufacture = {
    steicoLengthM: finiteNonNegative(
      wallplateAudit?.steico?.manufacture
    ),
    ply9AreaM2: finiteNonNegative(
      wallplateAudit?.ply9?.manufacture
    ),
    ply18AreaM2: finiteNonNegative(
      wallplateAudit?.ply18?.manufacture
    ),
  };

  const hasCompleteAuditSet =
    wallplateAudit?.valid === true &&
    Object.values(manufacture).every((value) => value != null);

  if (!hasCompleteAuditSet) {
    return {
      valid: false,
      source: "legacy-fallback",
      quantities: legacyQuantities,
    };
  }

  return {
    valid: true,
    source: "manufacture",
    quantities: manufacture,
  };
}
