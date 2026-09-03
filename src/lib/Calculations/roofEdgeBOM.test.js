import { buildRoofEdgeBOM } from "./roofEdgeBOM";

const stockResult = {
  valid: true,
  productFamily: "steelShingle",
  lines: [
    {
      key: "tile_starter",
      qty: 5,
      stockLengthMM: 3000,
      requiredLengthMM: 13111,
      pooledAcrossEdges: true,
    },
    { key: "hip_ridge", label: "Hip / Ridge tile", qty: 8, units: "pcs" },
    { key: "hip_end_cap_90", label: "90° Hip End Cap", qty: 2, units: "Ea" },
  ],
};

describe("buildRoofEdgeBOM", () => {
  test("orders full lengths but charges only the metres used", () => {
    const result = buildRoofEdgeBOM({
      stockResult,
      materials: {
        tile_starter_price_each: 8.8,
        tile_starter_weight_kg_each: 2.7,
      },
    });

    expect(result.valid).toBe(true);
    expect(result.lines[0]).toMatchObject({
      key: "tile_starter",
      qty: 13.111,
      order_qty: 5,
      units: "m",
      chargeBasis: "usedLength",
      retainedOffcutMM: 1889,
    });
    expect(result.lines[0].line).toBeCloseTo(13.111 * (8.8 / 3), 8);
    expect(result.lines[0].weight_kg).toBeCloseTo(13.111 * (2.7 / 3), 8);
  });

  test("supports the grouped Materials tile-starter fields", () => {
    const result = buildRoofEdgeBOM({
      stockResult,
      materials: {
        metal: {
          tile_starter: {
            price_each: 9,
            weight_kg_each: 3,
          },
        },
      },
    });

    expect(result.lines[0].priceEach).toBe(3);
    expect(result.lines[0].weightPerUnitKg).toBe(1);
  });

  test("does not charge the retained offcut to the current roof", () => {
    const result = buildRoofEdgeBOM({
      stockResult,
      materials: {
        tile_starter_price_each: 8.8,
      },
    });

    expect(result.lines[0].line).toBeLessThan(5 * 8.8);
    expect(result.lines[0].line).not.toBeCloseTo(5 * 8.8, 8);
  });

  test("prices confirmed hip products from the existing Materials fields", () => {
    const result = buildRoofEdgeBOM({
      stockResult,
      materials: {
        britmet_ridge_tile_price_each: 6.18,
        britmet_hip_end_cap_90_price_each: 10.5,
      },
    });

    expect(result.lines.find((line) => line.key === "hip_ridge")).toMatchObject({
      qty: 8,
      order_qty: 8,
      line: 49.44,
      weight_kg: 12.8,
      chargeBasis: "orderedQuantity",
    });
    expect(result.lines.find((line) => line.key === "hip_end_cap_90")).toMatchObject({
      qty: 2,
      order_qty: 2,
      line: 21,
      weight_kg: 0.3,
      chargeBasis: "orderedQuantity",
    });
  });

  test("rejects invalid stock input", () => {
    const result = buildRoofEdgeBOM({
      stockResult: { valid: false, errors: ["Invalid stock."] },
    });

    expect(result.valid).toBe(false);
    expect(result.lines).toEqual([]);
  });
});
