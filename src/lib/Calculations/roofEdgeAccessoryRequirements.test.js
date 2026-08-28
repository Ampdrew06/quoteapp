import { buildRoofEdgeAccessoryRequirements } from "./roofEdgeAccessoryRequirements";

const edge = (id, kind, side, lengthMM) => ({
  id,
  kind,
  side,
  lengthMM,
});

describe("buildRoofEdgeAccessoryRequirements", () => {
  test("maps both-sided Hipped Lean-To eaves and hips without barges", () => {
    const result = buildRoofEdgeAccessoryRequirements({
      tileSystem: "britmet",
      edgeModel: {
        valid: true,
        edges: [
          edge("eaves-front", "eaves", "front", 6211),
          edge("eaves-left", "eaves", "left", 3450),
          edge("hip-left", "hip", "left", 4198),
          edge("eaves-right", "eaves", "right", 3450),
          edge("hip-right", "hip", "right", 4198),
          edge("rear-wallplate", "rearWallplate", "rear", 5870),
        ],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.requirements.tileStarter.edgeCount).toBe(3);
    expect(result.requirements.tileStarter.totalLengthMM).toBe(13111);
    expect(result.requirements.gutter.totalLengthMM).toBe(13111);
    expect(result.requirements.hipCovering.totalLengthMM).toBe(8396);
    expect(result.requirements.twoPartBarge.edgeCount).toBe(0);
    expect(result.requirements.watercourse.edgeCount).toBe(0);
  });

  test("maps ordinary steel-shingle open verges to 2-Part Barge", () => {
    const result = buildRoofEdgeAccessoryRequirements({
      tileSystem: "britmet",
      edgeModel: {
        valid: true,
        edges: [
          edge("eaves-front", "eaves", "front", 4390),
          edge("open-verge-left", "openVerge", "left", 3126),
          edge("open-verge-right", "openVerge", "right", 3126),
        ],
      },
    });

    expect(result.requirements.twoPartBarge.edgeCount).toBe(2);
    expect(result.requirements.twoPartBarge.totalLengthMM).toBe(6252);
    expect(result.requirements.watercourse.edgeCount).toBe(0);
  });

  test("maps a wall side to watercourse instead of verge covering", () => {
    const result = buildRoofEdgeAccessoryRequirements({
      tileSystem: "britmet",
      edgeModel: {
        valid: true,
        edges: [
          edge("eaves-front", "eaves", "front", 4390),
          edge("open-verge-left", "openVerge", "left", 3126),
          edge("wall-abutment-right", "wallAbutment", "right", 3126),
        ],
      },
    });

    expect(result.requirements.twoPartBarge.edgeCount).toBe(1);
    expect(result.requirements.watercourse.edgeCount).toBe(1);
    expect(result.requirements.watercourse.totalLengthMM).toBe(3126);
  });

  test("maps synthetic-slate open verges to dry verge", () => {
    const result = buildRoofEdgeAccessoryRequirements({
      tileSystem: "liteslate",
      edgeModel: {
        valid: true,
        edges: [
          edge("eaves-front", "eaves", "front", 4390),
          edge("open-verge-left", "openVerge", "left", 3126),
        ],
      },
    });

    expect(result.productFamily).toBe("syntheticSlate");
    expect(result.requirements.dryVerge.edgeCount).toBe(1);
    expect(result.requirements.twoPartBarge).toBeUndefined();
  });

  test("rejects an invalid edge model", () => {
    const result = buildRoofEdgeAccessoryRequirements({
      edgeModel: {
        valid: false,
        errors: ["Select at least one hip side."],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.requirements).toEqual({});
  });
});

