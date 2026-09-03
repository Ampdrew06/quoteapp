import { calculateHipManufactureGeometryV2 } from "./hipManufactureGeometryV2";

// CAD reconstruction of the former factory pencil sketch for the
// 5870 x 3230 Hipped Lean-To, with a 15 degree front pitch and
// approximately 25 degree side pitches.
//
// These are manufacturing-profile dimensions, not the finished tiled hip:
//   external/top edge       3885 mm
//   internal/bottom edge    3615 mm
//   horizontal foot cut      250 mm
//   vertical foot cut        170 mm
//   wallplate/boss end cut   230 mm
//
// The original measurements were approximate, so this reference deliberately
// uses a 20 mm acceptance tolerance. Tighten the tolerance only after a future
// physical roof has been measured from the same five datums.

const CAD_REFERENCE_MM = Object.freeze({
  externalSlopeLengthMM: 3885,
  internalSlopeLengthMM: 3615,
  horizontalFootCutMM: 250,
  verticalFootCutMM: 170,
  topVerticalCutMM: 230,
});

const ACCEPTANCE_TOLERANCE_MM = 20;

const buildReferenceHip = () =>
  calculateHipManufactureGeometryV2({
    // Pitch-derived hip position shown on the saved plan.
    hipWidthMM: 1881,

    // Internal projection less the verified 63 mm wallplate thickness.
    effectivePitchRunMM: 3230 - 63,

    frontPitchDeg: 15,
    hipDepthMM: 220,

    // Plan distance between the spar-hook/boss datum and wallplate face.
    bossAllowancePlanMM: 156,

    // 70 mm frame-on + 150 mm front soffit + 25 mm fascia lip.
    frontHorizontalAllowanceMM: 245,

    // Side-only projection at the hip mitre after the 70 mm frame and
    // 25 mm fascia lip have been removed from the complete foot run.
    sideHorizontalAllowanceMM: 75,
  });

describe("calculateHipManufactureGeometryV2 CAD reference", () => {
  test("reproduces all five approximate factory profile dimensions within 20 mm", () => {
    const result = buildReferenceHip();

    expect(result.valid).toBe(true);

    Object.entries(CAD_REFERENCE_MM).forEach(([key, referenceMM]) => {
      const differenceMM = Math.abs(Number(result[key]) - referenceMM);
      expect(differenceMM).toBeLessThanOrEqual(ACCEPTANCE_TOLERANCE_MM);
    });
  });

  test("keeps the manufacturing timber profile separate from the tiled hip edge", () => {
    const result = buildReferenceHip();

    expect(result.externalSlopeLengthMM).toBeGreaterThan(
      result.internalSlopeLengthMM
    );
    expect(result.externalSlopeLengthMM).toBeLessThan(4198);
    expect(result.rounded).toMatchObject({
      internalSlopeLengthMM: 3620,
      externalSlopeLengthMM: 3875,
      horizontalFootCutMM: 249,
      verticalFootCutMM: 168,
      topVerticalCutMM: 226,
    });
  });
});
