import { buildRoofEdgeBOM } from "./roofEdgeBOM";

const stockResult = {
  valid: true,
  lines: [
    {
      key: "tile_starter",
      qty: 5,
      stockLengthMM: 3000,
      requiredLengthMM: 13111,
      pooledAcrossEdges: true,
    },
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

  test("rejects invalid stock input", () => {
    const result = buildRoofEdgeBOM({
      stockResult: { valid: false, errors: ["Invalid stock."] },
    });

    expect(result.valid).toBe(false);
    expect(result.lines).toEqual([]);
  });
});

