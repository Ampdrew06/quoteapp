import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import { calculateLeanToGeometry } from "../geometry/leanToGeometry";
import {
  BOSS_RAFTER_TERMINAL_ALLOWANCE_MM,
  buildFrontRafterManufactureProfiles,
} from "./frontRafterManufactureProfiles";

const geometry = {
  hasLeftHip: true,
  hasRightHip: true,
  frontPitchDeg: 16.4,
  rafterExternalLength: 3500,
  rafterInternalLength: 3200,
  raw: { manufacturedExternalSlopeLengthMM: 3420 },
  frontTemplateDebug: {
    horizontalFootRunMM: 220,
    plumbCutHeightMM: 165,
  },
  frontRafterLayoutV2: {
    centreRafters: [
      { id: "boss-left", role: "boss-rafter", centreMM: 1900 },
      { id: "plain-centre", role: "plain", centreMM: 2935 },
      { id: "boss-right", role: "boss-rafter", centreMM: 3970 },
    ],
    allRafters: [
      { id: "boss-left", role: "boss-rafter", centreMM: 1900 },
      { id: "plain-centre", role: "plain", centreMM: 2935 },
      { id: "boss-right", role: "boss-rafter", centreMM: 3970 },
    ],
  },
  leftSideRingBeamLayout: { intermediateJackRafters: [] },
  rightSideRingBeamLayout: { intermediateJackRafters: [] },
  leftSideRingBeam: { exists: true },
  rightSideRingBeam: { exists: true },
};

describe("buildFrontRafterManufactureProfiles", () => {
  test("deducts 150 mm from both slopes of boss rafters only", () => {
    const members = buildFrontRafterManufactureProfiles({ geometry });
    const boss = members.find((member) => member.type === "boss-rafter");
    const plain = members.find((member) => member.type === "rafter");

    expect(BOSS_RAFTER_TERMINAL_ALLOWANCE_MM).toBe(150);
    expect(plain.profile.externalSlopeLengthMM).toBe(3500);
    expect(plain.profile.internalSlopeLengthMM).toBe(3200);
    expect(boss.profile.externalSlopeLengthMM).toBe(3350);
    expect(boss.profile.internalSlopeLengthMM).toBe(3050);
    expect(boss.profile.bossTerminalAllowanceMM).toBe(150);
    expect(plain.profile.bossTerminalAllowanceMM).toBe(0);
  });

  test("retains shared pitch and foot profile dimensions", () => {
    const members = buildFrontRafterManufactureProfiles({ geometry });
    members.forEach((member) => {
      expect(member.profile.facetPitchDeg).toBe(16.4);
      expect(member.profile.horizontalFootCutMM).toBe(220);
      expect(member.profile.verticalFootCutMM).toBe(165);
    });
  });
});


test("factory roof uses the same manufactured front slope as a regular Lean-To with resolved soffit", () => {
  const inputs = { widthMM:4050, projectionMM:2885, pitchDeg:15, soffitDepthMM:150,
    materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_lip_mm:25,fascia_thickness_mm:9} };
  const hipped = calculateHippedLeanToGeometry({ ...inputs, hippedSides:"both",
    sideSoffitMode:"specified", specifiedSideSoffitMM:100 });
  const regular = calculateLeanToGeometry({ ...inputs, soffitDepthMM:hipped.frontSoffitMM });
  const profiles = buildFrontRafterManufactureProfiles({ geometry:hipped });
  expect(hipped.frontSoffitMM).toBeLessThan(160);
  expect(hipped.rafterExternalLength).toBe(regular.raw.manufacturedExternalSlopeLengthMM);
  const plain = profiles.find(m => m.type === "rafter");
  const boss = profiles.find(m => m.type === "boss-rafter");
  expect(plain.profile.externalSlopeLengthMM).toBeCloseTo(3144.96,2);
  expect(boss.profile.externalSlopeLengthMM).toBeCloseTo(2994.96,2);
  expect(plain.profile.externalSlopeLengthMM-boss.profile.externalSlopeLengthMM).toBe(150);
  expect(hipped.raw.fullProjectionRafterLengthMM).toBeCloseTo(2986.77,2);
});


test("resolved front manufacture slope follows regular Lean-To across pitches and one-sided roofs", () => {
  for (const pitchDeg of [12,15,20,25]) {
    for (const hippedSides of ["left","right","both"]) {
      const inputs = { widthMM:7040, projectionMM:2910, pitchDeg, soffitDepthMM:150,
        materials:{side_frame_thickness_mm:70,frame_on_mm:70,fascia_thickness_mm:9} };
      const hipped = calculateHippedLeanToGeometry({ ...inputs, hippedSides });
      const regular = calculateLeanToGeometry({ ...inputs, soffitDepthMM:hipped.frontSoffitMM });
      expect(hipped.rafterExternalLength).toBe(regular.raw.manufacturedExternalSlopeLengthMM);
      expect(hipped.rafterInternalLength).toBe(regular.raw.internalRafterLengthMM);
      expect(hipped.rafterExternalLength).toBeGreaterThan(hipped.rafterInternalLength);
    }
  }
});
