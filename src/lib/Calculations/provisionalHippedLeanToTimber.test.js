import { buildProvisionalHippedLeanToTimber } from "./provisionalHippedLeanToTimber";

describe("buildProvisionalHippedLeanToTimber", () => {
  test("uses CAD references while excluding ring-beams from Steico totals", () => {
    const hipProfile = {
      valid: true,
      externalSlopeLengthMM: 3880,
      internalSlopeLengthMM: 3620,
    };
    const geometry = {
      hasLeftHip: true,
      hasRightHip: true,
      rafterExternalLength: 3500,
      effectivePitchRunMM: 3230,
      resolvedLeftHipWidthMM: 1880,
      resolvedRightHipWidthMM: 1880,
      frontPitchDeg: 15,
      leftSidePitchDeg: 25,
      rightSidePitchDeg: 25,
      frontTemplateDebug: { horizontalFootRunMM: 220, plumbCutHeightMM: 169 },
      leftTemplateDebug: { horizontalFootRunMM: 170, plumbCutHeightMM: 169 },
      rightTemplateDebug: { horizontalFootRunMM: 170, plumbCutHeightMM: 169 },
      frontRafterLayoutV2: {
        leftJackRafters: [{ id: "front-left-jack-600", centreMM: 600 }],
        centreRafters: [{ id: "front-centre", role: "plain", centreMM: 3000 }],
        rightJackRafters: [{ id: "front-right-jack-5200", centreMM: 5200 }],
        allRafters: [
          { id: "front-left-jack-600", role: "jack", centreMM: 600 },
          { id: "front-centre", role: "plain", centreMM: 3000 },
          { id: "front-right-jack-5200", role: "jack", centreMM: 5200 },
        ],
      },
      leftSideRingBeam: { exists: true },
      rightSideRingBeam: { exists: true },
      leftSideRingBeamLayout: {
        intermediateJackRafters: [{ centreMM: 690 }],
      },
      rightSideRingBeamLayout: {
        intermediateJackRafters: [{ centreMM: 690 }],
      },
      leftHipManufactureV2: hipProfile,
      rightHipManufactureV2: hipProfile,
    };

    const result = buildProvisionalHippedLeanToTimber({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        widthMM: 5870,
        projMM: 3230,
      },
      geometry,
    });

    expect(result.valid).toBe(true);
    expect(result.totals.fullRafterQty).toBe(1);
    expect(result.totals.jackQty).toBe(4);
    expect(result.totals.hipQty).toBe(2);
    expect(result.members.every((member) => member.manufactureRef)).toBe(true);
    expect(result.members.some((member) => member.type === "ring-beam")).toBe(false);
    expect(result.totals.steicoRoofMemberLengthMM).toBe(
      result.totals.fullRafterLengthMM +
        result.totals.jackLengthMM +
        result.totals.hipLengthMM
    );
  });
});
