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

test("V2 hip manufacture uses the physical boss centres for a side-pitch override", () => {
  const automatic = buildAutomaticRoofTiling({
    roofInputs: {
      widthMM: 5870,
      projMM: 3230,
      pitchDeg: 15,
      soffit_mm: 150,
      roofStyle: "hippedLeanTo",
      hippedSides: "both",
      leftHip: true,
      rightHip: true,

      // Deliberately stale legacy/manual positions.
      leftHipWidthMM: 1615,
      rightHipWidthMM: 1615,

      requestedLeftSidePitchDeg: 25,
      requestedRightSidePitchDeg: 25,
      tileSystem: "britmet",
    },
    materials,
  });

  const geometry = automatic.geometry;

  expect(geometry.resolvedLeftHipWidthMM).not.toBe(1615);
  expect(geometry.resolvedRightHipWidthMM).not.toBe(1615);
  expect(geometry.leftHipManufactureV2.hipWidthMM).toBeCloseTo(
    geometry.resolvedLeftHipWidthMM,
    8
  );
  expect(geometry.rightHipManufactureV2.hipWidthMM).toBeCloseTo(
    geometry.resolvedRightHipWidthMM,
    8
  );

  // The earlier CAD tolerance here assumed a floor-foot TOP intersection
  // was the boss. That is not the centre of the finished joint. The separate
  // CAD comparison audit still reports that historical specimen unchanged.
  const rise = 3230 * Math.tan(15 * Math.PI / 180);
  const p = 25 * Math.PI / 180;
  const expectedBossCentre = rise / Math.tan(p) - 110 * Math.tan(p / 2);
  expect(geometry.resolvedLeftHipWidthMM).toBeCloseTo(expectedBossCentre, 8);
  expect(geometry.resolvedRightHipWidthMM).toBeCloseTo(expectedBossCentre, 8);
  expect(geometry.wallplateAssembly.left.bossCentrePositionMM).toBeCloseTo(expectedBossCentre, 8);
  expect(geometry.wallplateAssembly.right.bossCentrePositionMM).toBeCloseTo(expectedBossCentre, 8);
  expect(geometry.leftHipManufactureV2.hipPlanLengthMM).toBeCloseTo(
    Math.hypot(expectedBossCentre, geometry.effectivePitchRunMM), 8
  );

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
