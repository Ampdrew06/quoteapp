import {
  buildAutomaticRoofTiling,
  resolveAutomaticTileProduct,
} from "./automaticRoofTiling";
import { calculateLeanToGeometry } from "../geometry/leanToGeometry";
import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import { calculateRoofTiling } from "./facetTilingCalc";

const materials = {
  side_frame_thickness_mm: 70,
  fascia_lip_mm: 25,
  frame_on_mm: 70,
};

const commonInputs = {
  widthMM: 5500,
  projMM: 3410,
  pitchDeg: 18,
  soffit_mm: 150,
  leftWall: false,
  rightWall: false,
  leftOverhangMM: 0,
  rightOverhangMM: 0,
  eaves_overhang_mm: 50,
  tileSystem: "britmet",
};

test("resolves current and occasional tile product names", () => {
  expect(resolveAutomaticTileProduct("britmet")).toBe("britmetShingle");
  expect(resolveAutomaticTileProduct("LiteSlate")).toBe("liteSlate");
  expect(resolveAutomaticTileProduct("Metrotile")).toBe("metrotileShingle");
  expect(resolveAutomaticTileProduct("Tapco Slate")).toBe("tapcoSlate");
});

test("matches the former automatic Lean-To calculation path", () => {
  const expectedGeometry = calculateLeanToGeometry({
    widthMM: commonInputs.widthMM,
    projectionMM: commonInputs.projMM,
    pitchDeg: commonInputs.pitchDeg,
    soffitDepthMM: commonInputs.soffit_mm,
    leftWall: commonInputs.leftWall,
    rightWall: commonInputs.rightWall,
    leftSupportDepthMM: undefined,
    rightSupportDepthMM: undefined,
    leftOverhangMM: commonInputs.leftOverhangMM,
    rightOverhangMM: commonInputs.rightOverhangMM,
    tileOverhangMM: commonInputs.eaves_overhang_mm,
    materials,
  });

  const expectedResult = calculateRoofTiling({
    product: "britmetShingle",
    facets: expectedGeometry.facets,
  });

  const automatic = buildAutomaticRoofTiling({
    roofInputs: { ...commonInputs, roofStyle: "leanTo" },
    materials,
  });

  expect(automatic.geometry).toEqual(expectedGeometry);
  expect(automatic.result).toEqual(expectedResult);
});

test("matches the former automatic Hipped Lean-To calculation path", () => {
  const roofInputs = {
    ...commonInputs,
    roofStyle: "hippedLeanTo",
    hippedSides: "both",
    leftHipWidthMM: 1000,
    rightHipWidthMM: 1000,
  };

  const expectedGeometry = calculateHippedLeanToGeometry({
    widthMM: roofInputs.widthMM,
    projectionMM: roofInputs.projMM,
    pitchDeg: roofInputs.pitchDeg,
    soffitDepthMM: roofInputs.soffit_mm,
    leftWall: roofInputs.leftWall,
    rightWall: roofInputs.rightWall,
    leftSupportDepthMM: undefined,
    rightSupportDepthMM: undefined,
    leftOverhangMM: roofInputs.leftOverhangMM,
    rightOverhangMM: roofInputs.rightOverhangMM,
    tileOverhangMM: roofInputs.eaves_overhang_mm,
    materials,
    hippedSides: roofInputs.hippedSides,
    leftHipWidthMM: roofInputs.leftHipWidthMM,
    rightHipWidthMM: roofInputs.rightHipWidthMM,
    requestedLeftSidePitchDeg: null,
    requestedRightSidePitchDeg: null,
  });

  const expectedResult = calculateRoofTiling({
    product: "britmetShingle",
    facets: expectedGeometry.facets,
  });

  const automatic = buildAutomaticRoofTiling({ roofInputs, materials });

  expect(automatic.geometry).toEqual(expectedGeometry);
  expect(automatic.result).toEqual(expectedResult);
});

test("returns a clear unsupported-roof result", () => {
  const automatic = buildAutomaticRoofTiling({
    roofInputs: { ...commonInputs, roofStyle: "victorian" },
    materials,
  });

  expect(automatic.geometry).toBeNull();
  expect(automatic.result).toBeNull();
  expect(automatic.errors).toHaveLength(1);
});

test("rejects a Hipped Lean-To with neither hip selected", () => {
  const automatic = buildAutomaticRoofTiling({
    roofInputs: {
      ...commonInputs,
      roofStyle: "hippedLeanTo",
      hippedSides: "both",
      leftHip: false,
      rightHip: false,
    },
    materials,
  });

  expect(automatic.geometry).toBeNull();
  expect(automatic.result).toBeNull();
  expect(automatic.errors).toEqual([
    "Select at least one hip side for a Hipped Lean-To.",
  ]);
});