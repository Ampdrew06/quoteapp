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
  test("deducts 140 mm from both slopes of boss rafters only", () => {
    const members = buildFrontRafterManufactureProfiles({ geometry });
    const boss = members.find((member) => member.type === "boss-rafter");
    const plain = members.find((member) => member.type === "rafter");

    expect(BOSS_RAFTER_TERMINAL_ALLOWANCE_MM).toBe(140);
    expect(plain.profile.externalSlopeLengthMM).toBe(3500);
    expect(plain.profile.internalSlopeLengthMM).toBe(3200);
    expect(boss.profile.externalSlopeLengthMM).toBe(3360);
    expect(boss.profile.internalSlopeLengthMM).toBe(3060);
    expect(boss.profile.bossTerminalAllowanceMM).toBe(140);
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
