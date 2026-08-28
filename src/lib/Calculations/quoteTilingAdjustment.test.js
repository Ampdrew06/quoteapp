import { buildQuoteTilingAdjustment } from "./quoteTilingAdjustment";

const legacyTileLines = [
  {
    key: "tile_britmet",
    label: "Britmet tiles",
    qty: 66,
    unit: 6.12,
    line: 403.92,
  },
  {
    key: "verge",
    label: "2-Part Barge",
    qty: 6,
    unit: 8.27,
    line: 49.62,
  },
];

describe("buildQuoteTilingAdjustment", () => {
  test("adjusts only main tiles and external fixing laths", () => {
    const result = buildQuoteTilingAdjustment({
      legacyTileLines,
      legacyExternalFixingLathM: 90.9,
      automaticResult: {
        tileQuantityOrdered: 79,
        lathLengthMM: 100265,
        errors: [],
      },
      lathPricePerM: 0.62,
      lathWastePercent: 10,
    });

    expect(result.valid).toBe(true);
    expect(result.tileCostAdjustment).toBeCloseTo((79 - 66) * 6.12, 8);
    expect(result.externalLathCostAdjustment).toBeCloseTo(
      (100.265 - 90.9) * 0.62 * 1.1,
      8
    );
    expect(result.adjustment).toBeCloseTo(
      (79 - 66) * 6.12 + (100.265 - 90.9) * 0.62 * 1.1,
      8
    );
  });

  test("does not treat tile accessories as the main roof tile", () => {
    const result = buildQuoteTilingAdjustment({
      legacyTileLines: legacyTileLines.slice(1),
      legacyExternalFixingLathM: 90.9,
      automaticResult: {
        tileQuantityOrdered: 79,
        lathLengthMM: 100265,
        errors: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.adjustment).toBe(0);
  });

  test("returns a zero adjustment when universal geometry is invalid", () => {
    const result = buildQuoteTilingAdjustment({
      legacyTileLines,
      automaticResult: {
        errors: ["Select at least one hip side for a Hipped Lean-To."],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.adjustment).toBe(0);
  });
});
