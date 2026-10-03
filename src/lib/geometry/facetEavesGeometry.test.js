import { solveFacetEavesGeometry } from "./facetEavesGeometry";

describe("facet eaves geometry", () => {
  test("uses the same nominal timber depth for the front and side foot cuts", () => {
    const result = solveFacetEavesGeometry({
      requestedReferenceSoffitMM: 150,
      referencePitchDeg: 18,
      leftPitchDeg: 32.8,
      hasLeftFacet: true,
      materials: {
        side_frame_thickness_mm: 70,
        rafter_depth_mm: 220,
        rafter_profile_tolerance_mm: 5,
      },
      manufacturingRoundIncrementMM: 5,
    });

    expect(result.targetPlumbCutHeightMM).toBeCloseTo(159.84, 2);
    expect(result.left.matchedPlumbCutHeightMM).toBeCloseTo(
      result.targetPlumbCutHeightMM,
      8
    );
    expect(result.left.matchedHorizontalFootRunMM).toBeCloseTo(
      158.1,
      1
    );
    expect(result.left.manufacturedHorizontalFootRunMM).toBe(160);
    expect(result.left.timberHorizontalFootCutMM).toBe(158);
    expect(result.left.manufacturingClearanceMM).toBe(2);
    expect(result.referenceBaseWidthMM).toBe(225);
    expect(result.referenceTimberHorizontalFootCutMM).toBe(218);

    // The tolerance remains available as metadata, but it must not
    // alter the 220 mm geometric profile depth.
    expect(result.profileToleranceMM).toBe(5);
    expect(
      result.left.geometry.raw.effectiveProfileDepthMM
    ).toBe(220);
  });

  test("a specified side projection controls the common foot-cut datum", () => {
    const result = solveFacetEavesGeometry({
      requestedReferenceSoffitMM: 150,
      referencePitchDeg: 18,
      leftPitchDeg: 32.8,
      rightPitchDeg: 32.8,
      hasLeftFacet: true,
      hasRightFacet: true,
      materials: {
        side_frame_thickness_mm: 70,
        rafter_depth_mm: 220,
      },
      sideSoffitControl: {
        mode: "specified",
        side: "left",
        requestedProjectionMM: 80,
      },
      fasciaThicknessMM: 10,
      plyProjectionAllowanceMM: 5,
      manufacturingRoundIncrementMM: 5,
      manufacturingClearanceMM: 2,
    });

    // 70 frame + 80 overall request - 10 fascia - 5 ply allowance.
    expect(result.sideSoffitControl.plyBaseWidthMM).toBe(135);
    expect(result.left.manufacturedHorizontalFootRunMM).toBe(135);
    expect(result.left.timberHorizontalFootCutMM).toBe(133);
    expect(result.adjustmentReason).toBe("side-soffit-control");
    expect(result.targetPlumbCutHeightMM).toBeCloseTo(
      result.left.matchedPlumbCutHeightMM,
      8
    );
    expect(result.right.matchedPlumbCutHeightMM).toBeCloseTo(
      result.targetPlumbCutHeightMM,
      8
    );
    expect(result.effectiveReferenceSoffitMM).not.toBe(150);
  });

  test("no side soffit retains the compulsory 25 mm fascia lip", () => {
    const result = solveFacetEavesGeometry({
      requestedReferenceSoffitMM: 150,
      referencePitchDeg: 18,
      leftPitchDeg: 32.8,
      hasLeftFacet: true,
      materials: {
        side_frame_thickness_mm: 70,
        rafter_depth_mm: 220,
        fascia_lip_mm: 25,
      },
      sideSoffitControl: {
        mode: "none",
        side: "left",
      },
      manufacturingClearanceMM: 2,
    });

    expect(result.sideSoffitControl.plyBaseWidthMM).toBe(95);
    expect(result.left.manufacturedHorizontalFootRunMM).toBe(95);
    expect(result.left.timberHorizontalFootCutMM).toBe(93);
    expect(result.referenceTimberHorizontalFootCutMM).toBeGreaterThan(0);
  });
});
