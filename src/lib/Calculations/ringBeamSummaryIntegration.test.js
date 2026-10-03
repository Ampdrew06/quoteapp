import { selectRingBeamSummaryQuantities } from "./ringBeamSummaryIntegration";

const legacy = {
  pse30x90LengthM: 7.23,
  ply9BaseAreaM2: 1.5906,
  ply9UpstandAreaM2: 1.40985,
  outerFixingLath25x50LengthM: 0,
  finishingLath25x50LengthM: 6.787,
  pir50AreaM2: 1.33755,
};

const ringSchedule = {
  totals: {
    pse30x90LengthM: 13.24,
    ply9BaseAreaM2: 2.587,
    ply9UpstandAreaM2: 2.311,
    outerFixingLath25x50LengthM: 13.626,
    finishingLath25x50LengthM: 11.852,
    pir50AreaM2: 4.385,
  },
};

describe("selectRingBeamSummaryQuantities", () => {
  test("uses the complete manufacture set for a Hipped Lean-To", () => {
    const result = selectRingBeamSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      ringSchedule,
    });

    expect(result.source).toBe("manufacture");
    expect(result.quantities).toEqual(ringSchedule.totals);
    expect(result.quantities.outerFixingLath25x50LengthM).toBe(13.626);
  });

  test("does not add manufacture quantities to obsolete legacy allowances", () => {
    const result = selectRingBeamSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      ringSchedule,
    });

    expect(result.quantities.pse30x90LengthM).toBe(13.24);
    expect(result.quantities.finishingLath25x50LengthM).toBe(11.852);
    expect(result.quantities.pir50AreaM2).toBe(4.385);
  });

  test("leaves an ordinary Lean-To on the established quantities", () => {
    const result = selectRingBeamSummaryQuantities({
      isHippedLeanTo: false,
      legacy,
      ringSchedule,
    });

    expect(result.source).toBe("legacy");
    expect(result.quantities).toEqual(legacy);
  });

  test("falls back to the whole legacy set if manufacture data is incomplete", () => {
    const result = selectRingBeamSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      ringSchedule: {
        totals: {
          ...ringSchedule.totals,
          pir50AreaM2: undefined,
        },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.source).toBe("legacy-fallback");
    expect(result.quantities).toEqual(legacy);
  });
});

