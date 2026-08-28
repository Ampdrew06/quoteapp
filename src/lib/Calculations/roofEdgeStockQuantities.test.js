import { buildRoofEdgeStockQuantities } from "./roofEdgeStockQuantities";

const requirements = (totalLengthMM, edgeIds = []) => ({
  valid: true,
  requirements: {
    tileStarter: {
      totalLengthMM,
      edgeIds,
    },
    gutter: { totalLengthMM },
    hipCovering: { totalLengthMM: 8396 },
    watercourse: { totalLengthMM: 0 },
    twoPartBarge: { totalLengthMM: 0 },
  },
});

describe("buildRoofEdgeStockQuantities", () => {
  test("pools tile-starter offcuts across all eaves", () => {
    const result = buildRoofEdgeStockQuantities({
      accessoryRequirements: requirements(13111, [
        "eaves-front",
        "eaves-left",
        "eaves-right",
      ]),
      materials: {
        tile_starter_stock_length_m: 3,
      },
    });

    expect(result.valid).toBe(true);
    expect(result.lines[0]).toMatchObject({
      key: "tile_starter",
      qty: 5,
      stockLengthMM: 3000,
      requiredLengthMM: 13111,
      pooledAcrossEdges: true,
    });
  });

  test("uses the existing 3000 mm cover value when no metre value exists", () => {
    const result = buildRoofEdgeStockQuantities({
      accessoryRequirements: requirements(6211),
      materials: {
        eaves_guard_piece_cover_mm: 3000,
      },
    });

    expect(result.lines[0].qty).toBe(3);
    expect(result.lines[0].stockLengthMM).toBe(3000);
  });

  test("does not invent stock quantities for unverified edge products", () => {
    const result = buildRoofEdgeStockQuantities({
      accessoryRequirements: requirements(13111),
    });

    expect(result.lines.map((line) => line.key)).toEqual(["tile_starter"]);
    expect(result.pending).toEqual(
      expect.arrayContaining(["gutter", "hipCovering", "twoPartBarge"])
    );
  });

  test("rejects invalid accessory requirements", () => {
    const result = buildRoofEdgeStockQuantities({
      accessoryRequirements: {
        valid: false,
        errors: ["Invalid edge model."],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.lines).toEqual([]);
  });
});

