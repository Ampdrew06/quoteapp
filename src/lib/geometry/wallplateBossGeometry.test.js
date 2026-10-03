import { calculateWallplateBossGeometry, resolveDefaultBossPositionMM } from "./wallplateBossGeometry";
import { calculateHippedLeanToGeometry } from "./hippedLeanToGeometry";

const rise = 2885 * Math.tan(15 * Math.PI / 180);
const depth = 220;
const verifyCentre = (g, expected) => {
  expect(g.valid).toBe(true);
  const p = g.pitchDeg * Math.PI / 180;
  // Geometric reconstruction from bottom edge and equal mitre.
  const c = rise / Math.tan(p);
  const a = c - depth * Math.tan(p / 2);
  expect((a + c) / 2).toBeCloseTo(expected, 7);
  expect(g.bossCentrePositionMM).toBeCloseTo(expected, 7);
};

test("default centre at half the projection solves the side pitch around B", () => {
  const g = calculateWallplateBossGeometry({ riseMM: rise, memberDepthMM: depth,
    bossCentrePositionMM: 1442.5 });
  verifyCentre(g, 1442.5);
  expect(g.pitchDeg).toBeCloseTo(27.744049, 6);
});

test("explicit side pitch moves the centre and round-trips to the same pitch", () => {
  const g = calculateWallplateBossGeometry({ riseMM: rise, memberDepthMM: depth,
    bossCentrePositionMM: 999, requestedSidePitchDeg: 32 });
  verifyCentre(g, rise / Math.tan(32 * Math.PI / 180) - 110 * Math.tan(16 * Math.PI / 180));
  const inverse = calculateWallplateBossGeometry({ riseMM: rise, memberDepthMM: depth,
    bossCentrePositionMM: g.bossCentrePositionMM });
  expect(inverse.pitchDeg).toBeCloseTo(32, 7);
});

test("restores exact half-mm defaults and retains other explicit centre positions", () => {
  expect(resolveDefaultBossPositionMM(null, 2885)).toBe(1442.5);
  expect(resolveDefaultBossPositionMM(1443, 2885)).toBe(1442.5);
  expect(resolveDefaultBossPositionMM(1200, 2885)).toBe(1200);
});

test("invalid geometry does not invent a side pitch", () => {
  for (const inputs of [ { riseMM: 0, memberDepthMM: 220, bossCentrePositionMM: 1442.5 },
    { riseMM: rise, memberDepthMM: 0, bossCentrePositionMM: 1442.5 },
    { riseMM: rise, memberDepthMM: 220, requestedSidePitchDeg: 90 } ]) {
    expect(calculateWallplateBossGeometry(inputs).valid).toBe(false);
  }
});

test("default and override use the same centre in assembly, layout and hip geometry", () => {
  for (const overrides of [{}, { requestedLeftSidePitchDeg: 25, requestedRightSidePitchDeg: 35 }]) {
    const g = calculateHippedLeanToGeometry({ widthMM: 4050, projectionMM: 2885,
      pitchDeg: 15, soffitDepthMM: 150, hippedSides: "both", ...overrides });
    expect(g.wallplateAssembly.valid).toBe(true);
    expect(g.leftBossXMM).toBeCloseTo(g.wallplateAssembly.left.B.xMM, 7);
    expect(g.rightBossXMM).toBeCloseTo(g.wallplateAssembly.right.B.xMM, 7);
    expect(g.resolvedLeftHipWidthMM).toBeCloseTo(g.wallplateAssembly.left.bossCentrePositionMM, 7);
    expect(g.resolvedRightHipWidthMM).toBeCloseTo(g.wallplateAssembly.right.bossCentrePositionMM, 7);
    expect(g.leftHipWidthMM).toBeCloseTo(g.resolvedLeftHipWidthMM, 7);
    expect(g.rightHipWidthMM).toBeCloseTo(g.resolvedRightHipWidthMM, 7);
    expect(g.leftHipPlanLengthMM).toBeCloseTo(Math.hypot(g.resolvedLeftHipWidthMM, g.effectivePitchRunMM), 7);
    const bossRafters = g.frontRafterLayoutV2.centreRafters.filter(r => r.role === "boss-rafter");
    expect(bossRafters.find(r => r.bossSide === "left").centreMM).toBeCloseTo(g.leftBossXMM, 7);
    expect(bossRafters.find(r => r.bossSide === "right").centreMM).toBeCloseTo(g.rightBossXMM, 7);
    if (!overrides.requestedLeftSidePitchDeg) {
      expect(g.resolvedLeftHipWidthMM).toBe(1442.5);
      expect(g.resolvedRightHipWidthMM).toBe(1442.5);
    }
  }
});


test("a pitch that places the boss outside the frame cannot generate production cuts", () => {
  const g = calculateHippedLeanToGeometry({ widthMM: 4050, projectionMM: 2885,
    pitchDeg: 15, hippedSides: "left", requestedLeftSidePitchDeg: 89 });
  expect(g.leftBossGeometry.valid).toBe(false);
  expect(g.wallplateAssembly.valid).toBe(false);
  expect(g.horizontalWallplateExternalLengthMM).toBe(0);
  expect(g.horizontalWallplateInternalLengthMM).toBe(0);
});
