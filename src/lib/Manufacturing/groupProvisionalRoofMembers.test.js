import { groupProvisionalRoofMembers } from "./groupProvisionalRoofMembers";

const profile = (overrides = {}) => ({
  valid: true,
  facetPitchDeg: 25,
  externalSlopeLengthMM: 1808.6,
  internalSlopeLengthMM: 1620.6,
  horizontalFootCutMM: 170.4,
  verticalFootCutMM: 168.8,
  topVerticalCutMM: 242.7,
  hipCentrelineSetbackMM: 40,
  ...overrides,
});

describe("groupProvisionalRoofMembers", () => {
  test("groups matching profiles and orders their R references", () => {
    const groups = groupProvisionalRoofMembers([
      { type: "jack-rafter", manufactureRef: "R20", profile: profile() },
      { type: "jack-rafter", manufactureRef: "R2", profile: profile() },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].manufactureRefs).toEqual(["R2", "R20"]);
    expect(groups[0].quantity).toBe(2);
  });

  test("splits profiles when a manufacturing dimension changes", () => {
    const groups = groupProvisionalRoofMembers([
      { type: "jack-rafter", manufactureRef: "R2", profile: profile() },
      {
        type: "jack-rafter",
        manufactureRef: "R20",
        profile: profile({ externalSlopeLengthMM: 1829 }),
      },
    ]);

    expect(groups).toHaveLength(2);
  });

  test("never groups hips with jack rafters", () => {
    const shared = profile({ hipPitchDeg: 25 });
    const groups = groupProvisionalRoofMembers([
      { type: "hip", manufactureRef: "R6", profile: shared },
      { type: "jack-rafter", manufactureRef: "R7", profile: shared },
    ]);

    expect(groups).toHaveLength(2);
  });
});
