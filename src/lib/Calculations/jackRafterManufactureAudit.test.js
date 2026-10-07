import { buildJackRafterManufactureAudit } from "./jackRafterManufactureAudit";

describe("buildJackRafterManufactureAudit", () => {
  test("uses automatically assigned front and side jack positions", () => {
    const result = buildJackRafterManufactureAudit({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        widthMM: 5870,
        projMM: 3230,
      },
      geometry: {
        hasLeftHip: true,
        hasRightHip: true,
        effectivePitchRunMM: 3167,
        resolvedLeftHipWidthMM: 1881,
        resolvedRightHipWidthMM: 1881,
        frontPitchDeg: 15,
        leftSidePitchDeg: 25,
        rightSidePitchDeg: 25,
        frontTemplateDebug: { horizontalFootRunMM: 245, plumbCutHeightMM: 162 },
        leftTemplateDebug: { horizontalFootRunMM: 170, plumbCutHeightMM: 163 },
        rightTemplateDebug: { horizontalFootRunMM: 170, plumbCutHeightMM: 163 },
        frontRafterLayoutV2: {
          leftJackRafters: [{ id: "front-left", centreMM: 1216 }],
          rightJackRafters: [{ id: "front-right", centreMM: 4654 }],
          allRafters: [
            { id: "front-left", role: "jack", centreMM: 1216 },
            { id: "front-right", role: "jack", centreMM: 4654 },
          ],
        },
        leftSideRingBeam: { exists: true },
        rightSideRingBeam: { exists: true },
        leftSideRingBeamLayout: {
          intermediateJackRafters: [{ id: "side-left", centreMM: 690 }],
        },
        rightSideRingBeamLayout: {
          intermediateJackRafters: [{ id: "side-right", centreMM: 690 }],
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.setbackMM).toBeNull();
    expect(result.closestCornerGapMM).toBe(5);
    expect(result.jacks.every(jack=>jack.profile.connectionGeometry.valid)).toBe(true);
    expect(result.jacks).toHaveLength(4);
    expect(result.jacks.map((jack) => jack.facetId)).toEqual([
      "F1",
      "F2",
      "F2",
      "F3",
    ]);
    expect(result.jacks.every((jack) => jack.profile.valid)).toBe(true);
    expect(result.jacks.every((jack) => /^R\d+$/.test(jack.manufactureRef))).toBe(true);
  });
});
