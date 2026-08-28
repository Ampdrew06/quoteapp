import { buildQuoteEdgeAdjustment } from "./quoteEdgeAdjustment";

const automaticEdgeResult = {
  valid: true,
  bom: {
    valid: true,
    lines: [
      {
        key: "tile_starter",
        qty: 13.111,
        order_qty: 5,
        line: 52.444,
        chargeBasis: "usedLength",
      },
    ],
  },
};

describe("buildQuoteEdgeAdjustment", () => {
  test("replaces the old one-length charge with used-length cost", () => {
    const result = buildQuoteEdgeAdjustment({
      legacyTileStarterCost: 12,
      automaticEdgeResult,
    });

    expect(result).toMatchObject({
      valid: true,
      legacyTileStarterCost: 12,
      universalTileStarterCost: 52.444,
    });
    expect(result.adjustment).toBeCloseTo(40.444, 8);
  });

  test("accepts the BOM directly", () => {
    const result = buildQuoteEdgeAdjustment({
      legacyTileStarterCost: 12,
      automaticEdgeResult: automaticEdgeResult.bom,
    });

    expect(result.valid).toBe(true);
    expect(result.adjustment).toBeCloseTo(40.444, 8);
  });

  test("does not mistake another edge accessory for tile starter", () => {
    const result = buildQuoteEdgeAdjustment({
      legacyTileStarterCost: 12,
      automaticEdgeResult: {
        valid: true,
        lines: [{ key: "gutter", line: 100 }],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.adjustment).toBe(0);
  });

  test("returns zero adjustment when the automatic result is invalid", () => {
    const result = buildQuoteEdgeAdjustment({
      legacyTileStarterCost: 12,
      automaticEdgeResult: { valid: false, errors: ["Invalid roof."] },
    });

    expect(result.valid).toBe(false);
    expect(result.adjustment).toBe(0);
  });
});
