import { buildRoofEdgeModel } from "./roofEdgeModel";

const mainFacet = {
  id: "facet-front",
  externalEavesLengthMM: 6211,
  internalEavesLengthMM: 5870,
  tilingGeometry: { heightMM: 3623.47 },
};

const hippedGeometry = {
  widthMM: 5870,
  externalProjectionMM: 3450,
  frontFacet: mainFacet,
  leftFacet: {
    id: "facet-left-side",
    externalEavesLengthMM: 3450,
    tilingGeometry: {
      baseWidthMM: 3500,
      topWidthMM: 0,
      heightMM: 2318.83,
    },
  },
  rightFacet: {
    id: "facet-right-side",
    geometry: {
      externalEavesLengthMM: 3450,
      tiling: {
        baseWidthMM: 3500,
        topWidthMM: 0,
        heightMM: 2318.83,
      },
    },
  },
  leftHipTrueLengthMM: 4010,
  rightHipTrueLengthMM: 4010,
};

const kinds = (result) => result.edges.map((edge) => edge.kind);

describe("buildRoofEdgeModel", () => {
  test("classifies ordinary Lean-To open and wall sides", () => {
    const result = buildRoofEdgeModel({
      roofInputs: {
        roofStyle: "leanTo",
        leftWall: false,
        rightWall: true,
      },
      geometry: {
        widthMM: 5870,
        mainFacet,
      },
    });

    expect(result.valid).toBe(true);
    expect(kinds(result)).toEqual([
      "eaves",
      "rearWallplate",
      "openVerge",
      "wallAbutment",
    ]);
  });

  test("both-sided Hipped Lean-To has three eaves and two hips", () => {
    const result = buildRoofEdgeModel({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        leftHip: true,
        rightHip: true,
      },
      geometry: hippedGeometry,
    });

    expect(result.valid).toBe(true);
    expect(result.totalsByKind.eaves).toEqual({
      count: 3,
      lengthMM: 13111,
    });
    expect(result.totalsByKind.hip.count).toBe(2);
    expect(result.totalsByKind.hip.lengthMM).toBeCloseTo(
      Math.hypot(3500, 2318.83) * 2,
      6
    );

    const leftHip = result.edges.find((edge) => edge.id === "hip-left");
    expect(leftHip.lengthMM).toBeCloseTo(Math.hypot(3500, 2318.83), 6);
    expect(leftHip.structuralLengthMM).toBe(4010);
    expect(leftHip.terminalAngleDeg).toBe(90);
    expect(result.totalsByKind.openVerge).toBeUndefined();
    expect(result.totalsByKind.wallAbutment).toBeUndefined();
  });

  test("one-sided hip leaves the opposite open side as a verge", () => {
    const result = buildRoofEdgeModel({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        leftHip: true,
        rightHip: false,
        rightWall: false,
      },
      geometry: hippedGeometry,
    });

    expect(result.totalsByKind.eaves.count).toBe(2);
    expect(result.totalsByKind.hip.count).toBe(1);
    expect(result.totalsByKind.openVerge.count).toBe(1);
    expect(result.totalsByKind.wallAbutment).toBeUndefined();
  });

  test("one-sided hip leaves the opposite wall side as an abutment", () => {
    const result = buildRoofEdgeModel({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        leftHip: true,
        rightHip: false,
        rightWall: true,
      },
      geometry: hippedGeometry,
    });

    expect(result.totalsByKind.wallAbutment.count).toBe(1);
    expect(result.totalsByKind.openVerge).toBeUndefined();
  });

  test("rejects a Hipped Lean-To with no selected hips", () => {
    const result = buildRoofEdgeModel({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        leftHip: false,
        rightHip: false,
      },
      geometry: hippedGeometry,
    });

    expect(result.valid).toBe(false);
    expect(result.edges).toEqual([]);
    expect(result.errors[0]).toMatch(/at least one hip/i);
  });
});
