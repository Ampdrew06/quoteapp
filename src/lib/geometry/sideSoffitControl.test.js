import { calculateHippedLeanToGeometry } from "./hippedLeanToGeometry";

const commonInputs = {
  widthMM: 7040,
  projectionMM: 2910,
  pitchDeg: 18,
  soffitDepthMM: 150,
  materials: {
    side_frame_thickness_mm: 70,
    frame_on_mm: 70,
    fascia_lip_mm: 25,
    rafter_depth_mm: 220,
  },
  hippedSides: "both",
  leftHipWidthMM: 1455,
  rightHipWidthMM: 1455,
  requestedLeftSidePitchDeg: 32.8,
  requestedRightSidePitchDeg: 32.8,
};

describe("hipped side soffit control", () => {
  test("automatic mode preserves the established front-led cuts", () => {
    const geometry = calculateHippedLeanToGeometry(commonInputs);

    expect(geometry.sideSoffitMode).toBe("automatic");
    expect(geometry.frontFacet.ringBeam.baseWidthMM).toBe(225);
    expect(geometry.frontTemplateDebug.horizontalFootRunMM).toBe(218);
    expect(geometry.leftFacet.ringBeam.baseWidthMM).toBe(160);
  });

  test("specified side projection becomes the controlling datum", () => {
    const geometry = calculateHippedLeanToGeometry({
      ...commonInputs,
      sideSoffitMode: "specified",
      sideSoffitControlSide: "left",
      specifiedSideSoffitMM: 80,
    });

    expect(geometry.sideSoffitMode).toBe("specified");
    expect(geometry.controlledSidePlyBaseWidthMM).toBe(135);
    expect(geometry.leftTemplateDebug.horizontalFootRunMM).toBe(133);
    expect(geometry.frontPlumbCutHeightMM).toBeCloseTo(
      geometry.leftPlumbCutHeightMM,
      8
    );
    expect(geometry.rightPlumbCutHeightMM).toBeCloseTo(
      geometry.leftPlumbCutHeightMM,
      8
    );
  });

  test("no-soffit mode retains the 25 mm fascia lip", () => {
    const geometry = calculateHippedLeanToGeometry({
      ...commonInputs,
      sideSoffitMode: "none",
      sideSoffitControlSide: "left",
    });

    expect(geometry.sideSoffitMode).toBe("none");
    expect(geometry.controlledSidePlyBaseWidthMM).toBe(95);
    expect(geometry.leftTemplateDebug.horizontalFootRunMM).toBe(93);
    expect(geometry.frontPlumbCutHeightMM).toBeCloseTo(
      geometry.leftPlumbCutHeightMM,
      8
    );
  });
});
