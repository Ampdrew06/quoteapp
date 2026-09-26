import { calculateHippedLeanToGeometry } from "./hippedLeanToGeometry";
import { calculateWallplateMitreGeometry } from "./wallplateMitreGeometry";

describe("Hipped Lean-To horizontal wallplate saw settings", () => {
  test("bisects each side pitch across equal-depth mating members", () => {
    const geometry = calculateHippedLeanToGeometry({
      widthMM: 5870,
      projectionMM: 3230,
      pitchDeg: 15,
      soffitDepthMM: 150,
      hippedSides: "both",
      requestedLeftSidePitchDeg: 25,
      requestedRightSidePitchDeg: 25,
      materials: {
        side_frame_thickness_mm: 70,
        fascia_lip_mm: 25,
        frame_on_mm: 70,
        wallplate_thickness_mm: 63,
        wallplate_height_mm: 220,
        ring_beam_height_mm: 40,
        rafter_spacing_mm: 665,
      },
    });

    const leftDeg = geometry.horizontalWallplateLeftEndCutOffSquareDeg;
    const rightDeg = geometry.horizontalWallplateRightEndCutOffSquareDeg;

    expect(leftDeg).toBeGreaterThan(0);
    expect(rightDeg).toBeGreaterThan(0);
    expect(leftDeg).toBeCloseTo(rightDeg, 8);
    expect(leftDeg).toBeCloseTo(
      geometry.leftSidePitchDeg / 2,
      8
    );
    expect(rightDeg).toBeCloseTo(
      geometry.rightSidePitchDeg / 2,
      8
    );
    expect(geometry.leftWallbarTopCutOffSquareDeg).toBeCloseTo(
      leftDeg,
      8
    );
    expect(geometry.rightWallbarTopCutOffSquareDeg).toBeCloseTo(
      rightDeg,
      8
    );

    const reconstructedLengthDifferenceMM =
      Math.tan((leftDeg * Math.PI) / 180) * geometry.wallplateHeightMM +
      Math.tan((rightDeg * Math.PI) / 180) * geometry.wallplateHeightMM;

    expect(reconstructedLengthDifferenceMM).toBeCloseTo(
      geometry.horizontalWallplateExternalLengthMM -
        geometry.horizontalWallplateInternalLengthMM,
      6
    );
  });

  test("produces matching 16.4 degree cuts for the ordered 32.8 degree roof", () => {
    const result = calculateWallplateMitreGeometry({
      sidePitchDeg: 32.8,
      memberDepthMM: 220,
      wallbarExternalSlopeMM: 1930,
      wallbarHorizontalFootCutMM: 167,
      wallbarVerticalFootCutMM: 160,
    });

    expect(result.wallbarTopCutOffSquareDeg).toBeCloseTo(16.4, 8);
    expect(result.horizontalWallplateCutOffSquareDeg).toBeCloseTo(16.4, 8);
    expect(result.mitreOffsetMM).toBeCloseTo(
      220 * Math.tan((16.4 * Math.PI) / 180),
      8
    );
    expect(result.cutFaceLengthMM).toBeCloseTo(
      220 / Math.cos((16.4 * Math.PI) / 180),
      8
    );
  });
});
