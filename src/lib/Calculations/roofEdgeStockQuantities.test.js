import { buildRoofEdgeStockQuantities } from "./roofEdgeStockQuantities";

const requirements = (totalLengthMM, edgeIds = []) => ({
  valid: true,
  requirements: {
    tileStarter: {
      totalLengthMM,
      edgeIds,
    },
    gutter: { totalLengthMM },
    hipCovering: {
      totalLengthMM: 8396,
      edgeIds: ["hip-left", "hip-right"],
      edges: [
        { edgeId: "hip-left", lengthMM: 4198 },
        { edgeId: "hip-right", lengthMM: 4198 },
      ],
    },
    hipEndCaps: {
      qty: 2,
      qty90: 2,
      qty135: 0,
      edges: [
        { edgeId: "hip-left", suppliedAngleDeg: 90 },
        { edgeId: "hip-right", suppliedAngleDeg: 90 },
      ],
    },
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

    expect(result.lines.map((line) => line.key)).toEqual([
      "tile_starter",
      "hip_ridge",
      "hip_end_cap_90",
    ]);
    expect(result.pending).toEqual(
      expect.arrayContaining(["gutter", "twoPartBarge"])
    );
  });

  test("rounds each hip independently at 1150 mm effective cover", () => {
    const result = buildRoofEdgeStockQuantities({
      accessoryRequirements: requirements(13111),
    });
    const hip = result.lines.find((line) => line.key === "hip_ridge");

    expect(hip.qty).toBe(8);
    expect(hip.stockLengthMM).toBe(1250);
    expect(hip.effectiveCoverMM).toBe(1150);
    expect(hip.calculatedPerEdge).toBe(true);
    expect(hip.perEdgeQuantities.map((edge) => edge.qty)).toEqual([4, 4]);
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
