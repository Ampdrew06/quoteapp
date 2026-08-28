import { buildAutomaticRoofEdgeBOM } from "./automaticRoofEdgeBOM";

const materials = {
  side_frame_thickness_mm: 70,
  fascia_lip_mm: 25,
  frame_on_mm: 70,
  tile_starter_stock_length_m: 3,
  tile_starter_price_each: 12,
  tile_starter_weight_kg_each: 2.7,
};

const commonInputs = {
  widthMM: 5870,
  projMM: 3230,
  pitchDeg: 15,
  soffit_mm: 150,
  leftWall: false,
  rightWall: false,
  leftOverhangMM: 0,
  rightOverhangMM: 0,
  eaves_overhang_mm: 50,
  tileSystem: "britmet",
};

describe("buildAutomaticRoofEdgeBOM", () => {
  test("both-sided Hipped Lean-To uses all three eaves", () => {
    const result = buildAutomaticRoofEdgeBOM({
      roofInputs: {
        ...commonInputs,
        roofStyle: "hippedLeanTo",
        hippedSides: "both",
        leftHip: true,
        rightHip: true,
        requestedLeftSidePitchDeg: 25,
        requestedRightSidePitchDeg: 25,
      },
      materials,
    });

    const starter = result.accessoryRequirements.requirements.tileStarter;
    const bomLine = result.bom.lines[0];

    expect(result.valid).toBe(true);
    expect(result.edgeModel.totalsByKind.eaves.count).toBe(3);
    expect(starter.edgeCount).toBe(3);
    expect(bomLine.qty).toBeCloseTo(starter.totalLengthMM / 1000, 8);
    expect(bomLine.order_qty).toBe(
      Math.ceil(starter.totalLengthMM / 3000)
    );
    expect(
      result.accessoryRequirements.requirements.twoPartBarge.edgeCount
    ).toBe(0);
  });

  test("ordinary Lean-To uses its front eaves only", () => {
    const result = buildAutomaticRoofEdgeBOM({
      roofInputs: { ...commonInputs, roofStyle: "leanTo" },
      materials,
    });

    const starter = result.accessoryRequirements.requirements.tileStarter;

    expect(result.valid).toBe(true);
    expect(result.edgeModel.totalsByKind.eaves.count).toBe(1);
    expect(starter.edgeCount).toBe(1);
    expect(result.bom.lines[0].qty).toBeCloseTo(
      starter.totalLengthMM / 1000,
      8
    );
  });

  test("charges used metres rather than all allocated stock", () => {
    const result = buildAutomaticRoofEdgeBOM({
      roofInputs: { ...commonInputs, roofStyle: "leanTo" },
      materials,
    });
    const line = result.bom.lines[0];

    expect(line.chargeBasis).toBe("usedLength");
    expect(line.line).toBeCloseTo(line.qty * 4, 8);
    expect(line.line).toBeLessThan(line.order_qty * 12);
  });

  test("rejects a Hipped Lean-To with no selected hips", () => {
    const result = buildAutomaticRoofEdgeBOM({
      roofInputs: {
        ...commonInputs,
        roofStyle: "hippedLeanTo",
        leftHip: false,
        rightHip: false,
      },
      materials,
    });

    expect(result.valid).toBe(false);
    expect(result.bom).toBeNull();
    expect(result.errors[0]).toMatch(/at least one hip/i);
  });
});
