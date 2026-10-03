const finiteNonNegative = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

/**
 * Select one coherent set of ring-beam quantities for the live Summary.
 *
 * Ordinary Lean-To roofs retain their established quantities. A Hipped
 * Lean-To changes only when every validated manufacture total is available;
 * otherwise the complete legacy set is retained so Summary can never contain
 * a partial mixture of old and new ring-beam rules.
 */
export function selectRingBeamSummaryQuantities({
  isHippedLeanTo = false,
  legacy = {},
  ringSchedule = null,
} = {}) {
  const legacyQuantities = {
    pse30x90LengthM: finiteNonNegative(legacy.pse30x90LengthM) ?? 0,
    ply9BaseAreaM2: finiteNonNegative(legacy.ply9BaseAreaM2) ?? 0,
    ply9UpstandAreaM2: finiteNonNegative(legacy.ply9UpstandAreaM2) ?? 0,
    outerFixingLath25x50LengthM:
      finiteNonNegative(legacy.outerFixingLath25x50LengthM) ?? 0,
    finishingLath25x50LengthM:
      finiteNonNegative(legacy.finishingLath25x50LengthM) ?? 0,
    pir50AreaM2: finiteNonNegative(legacy.pir50AreaM2) ?? 0,
  };

  if (!isHippedLeanTo) {
    return {
      valid: true,
      source: "legacy",
      quantities: legacyQuantities,
    };
  }

  const manufacture = {
    pse30x90LengthM: finiteNonNegative(
      ringSchedule?.totals?.pse30x90LengthM
    ),
    ply9BaseAreaM2: finiteNonNegative(
      ringSchedule?.totals?.ply9BaseAreaM2
    ),
    ply9UpstandAreaM2: finiteNonNegative(
      ringSchedule?.totals?.ply9UpstandAreaM2
    ),
    outerFixingLath25x50LengthM: finiteNonNegative(
      ringSchedule?.totals?.outerFixingLath25x50LengthM
    ),
    finishingLath25x50LengthM: finiteNonNegative(
      ringSchedule?.totals?.finishingLath25x50LengthM
    ),
    pir50AreaM2: finiteNonNegative(
      ringSchedule?.totals?.pir50AreaM2
    ),
  };

  const hasCompleteManufactureSet = Object.values(manufacture).every(
    (value) => value != null
  );

  if (!hasCompleteManufactureSet) {
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

