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
    expect(result.referenceBaseWidthMM).toBe(220);
    expect(result.referenceTimberHorizontalFootCutMM).toBe(218);

    // The tolerance remains available as metadata, but it must not
    // alter the 220 mm geometric profile depth.
    expect(result.profileToleranceMM).toBe(5);
    expect(
      result.left.geometry.raw.effectiveProfileDepthMM
    ).toBe(220);
  });
});
