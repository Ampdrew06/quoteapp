import { calculateJackRafterManufactureGeometry } from "./jackRafterManufactureGeometry";

describe("calculateJackRafterManufactureGeometry", () => {
  test("inherits the facet foot and stops 40 mm before the hip centreline", () => {
    const result = calculateJackRafterManufactureGeometry({
      facetPitchDeg: 25,
      hipCentrelinePlanRunMM: 1000,
      hipCentrelineSetbackMM: 40,
      horizontalFootCutMM: 175,
      verticalFootCutMM: 160,
      timberDepthMM: 220,
    });

    expect(result.valid).toBe(true);
    expect(result.topCutPlanRunMM).toBe(960);
    expect(result.horizontalFootCutMM).toBe(175);
    expect(result.verticalFootCutMM).toBe(160);
    expect(result.externalSlopeLengthMM).toBeGreaterThan(
      result.internalSlopeLengthMM
    );
    expect(result.topVerticalCutMM).toBeCloseTo(
      220 / Math.cos((25 * Math.PI) / 180),
      8
    );
  });

  test("rejects a jack position inside the 40 mm setback", () => {
    const result = calculateJackRafterManufactureGeometry({
      facetPitchDeg: 25,
      hipCentrelinePlanRunMM: 35,
      horizontalFootCutMM: 175,
      verticalFootCutMM: 160,
    });

    expect(result.valid).toBe(false);
  });
});

