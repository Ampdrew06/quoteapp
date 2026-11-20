// Dimensions used by the workshop to set out a vent between two rafters.
export const ventRafterThicknessMM = 47;
export const minimumVentRafterGapMM = 49;
const ventClearanceMM = 10;
const maxSpacingBetweenVentsMM = 750;
const maxInternalRafters = 100;

export function ventBayWidthMM(widthMM) {
  return 2 * Math.floor((widthMM + ventRafterThicknessMM + ventClearanceMM) / 2);
}

export function equalVentGapMM(startMM, endMM, vents) {
  return (endMM - startMM - vents.reduce((sum, vent) => sum + vent.bayMM, 0)) / (vents.length + 1);
}

// Anchors include both boundaries and all vent rafters. Optional anchors
// can retain fixed members specific to the roof, such as a centre rafter.
export function distributeVentRafters({ boundaries, bays, spacingMM, manual = false }) {
  const firstVent = bays[0];
  const lastVent = bays.at(-1);
  const positions = [];
  for (let i = 1; i < boundaries.length; i += 1) {
    const left = boundaries[i - 1];
    const right = boundaries[i];
    const span = right - left;
    const isVent = bays.some(bay => bay.left === left && bay.right === right);
    const fromRight = right <= firstVent.left;
    const fromLeft = left >= lastVent.right;
    const limit = fromRight || fromLeft ? spacingMM : maxSpacingBetweenVentsMM;
    const divisions = isVent || manual ? 1 : Math.max(1, Math.ceil((span - 0.001) / limit));
    if (!Number.isFinite(divisions) || positions.length + divisions > maxInternalRafters + 1) return null;

    if (divisions > 1 && (fromRight || fromLeft)) {
      // Keep standard centres from the vent outwards. Share a short end
      // remainder across the last two bays.
      const endGap = span - (divisions - 1) * spacingMM;
      const offsets = Array.from({length: divisions - 1}, (_, index) =>
        endGap < spacingMM / 2 && index === divisions - 2
          ? (span + (divisions - 2) * spacingMM) / 2
          : (index + 1) * spacingMM);
      const intermediate = fromRight
        ? offsets.reverse().map(offset => right - offset)
        : offsets.map(offset => left + offset);
      positions.push(...intermediate);
    } else {
      for (let division = 1; division < divisions; division += 1) {
        positions.push(left + division * span / divisions);
      }
    }
    positions.push(right);
  }
  return positions.slice(0, -1);
}
