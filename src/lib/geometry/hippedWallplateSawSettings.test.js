import { calculateHippedLeanToGeometry } from "./hippedLeanToGeometry";

describe("Hipped Lean-To horizontal wallplate saw settings", () => {
  test("derives separate left and right off-square cuts from the resolved profile", () => {
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

    const reconstructedLengthDifferenceMM =
      Math.tan((leftDeg * Math.PI) / 180) * geometry.wallplateHeightMM +
      Math.tan((rightDeg * Math.PI) / 180) * geometry.wallplateHeightMM;

    expect(reconstructedLengthDifferenceMM).toBeCloseTo(
      geometry.horizontalWallplateExternalLengthMM -
        geometry.horizontalWallplateInternalLengthMM,
      6
    );
  });
});
