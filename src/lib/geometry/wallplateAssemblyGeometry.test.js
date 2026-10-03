import { calculateWallplateAssemblyGeometry } from "./wallplateAssemblyGeometry";
import { calculateHippedLeanToGeometry } from "./hippedLeanToGeometry";

const materials = { side_frame_thickness_mm: 70, fascia_lip_mm: 25,
  frame_on_mm: 70, wallplate_thickness_mm: 63, wallplate_height_mm: 220,
  ring_beam_height_mm: 40, rafter_spacing_mm: 665 };
const roof = { widthMM: 4050, projectionMM: 2885, pitchDeg: 15,
  soffitDepthMM: 150, hippedSides: "both", leftHipWidthMM: 1443,
  rightHipWidthMM: 1443, sideSoffitMode: "specified",
  specifiedSideSoffitMM: 100, materials };
const close = (value, expected) => expect(value).toBeCloseTo(expected, 6);

function verifyAssembly(g) {
  const a = g.wallplateAssembly;
  expect(a.valid).toBe(true);
  for (const [name, side] of [["left", a.left], ["right", a.right]]) {
    if (!side) continue;
    const p = side.pitchDeg * Math.PI / 180;
    const inward = (x) => name === "left" ? x : a.internalWidthMM - x;
    // Independently intersect the two parallel timber edges with the
    // specified horizontal top and bottom heights.
    close(inward(side.A.xMM), inward(side.externalFoot.xMM) +
      (a.topHeightMM - side.externalFoot.yMM) / Math.tan(p));
    close(inward(side.C.xMM),
      (a.bottomHeightMM - a.ringBeamHeightMM) / Math.tan(p));
    close(side.A.yMM, a.topHeightMM);
    close(side.C.yMM, a.bottomHeightMM);
    // Manufactured mates have exactly the same endpoints, not just
    // the same angle or length difference.
    const top = name === "left" ? a.horizontal.topLeft : a.horizontal.topRight;
    const bottom = name === "left" ? a.horizontal.bottomLeft : a.horizontal.bottomRight;
    close(top.xMM, side.A.xMM); close(top.yMM, side.A.yMM);
    close(bottom.xMM, side.C.xMM); close(bottom.yMM, side.C.yMM);
    close(side.B.xMM, (side.A.xMM + side.C.xMM) / 2);
    close(side.B.yMM, (side.A.yMM + side.C.yMM) / 2);
    close(side.internalSlopeMM, g[`${name}InternalWallBarSlopeMM`]);
  }
  close(g.horizontalWallplateExternalLengthMM, a.horizontal.topRight.xMM - a.horizontal.topLeft.xMM);
  close(g.horizontalWallplateInternalLengthMM, a.horizontal.bottomRight.xMM - a.horizontal.bottomLeft.xMM);
}

test("ordered roof closes at the measured manufacture height about the default boss centre", () => {
  const g = calculateHippedLeanToGeometry(roof);
  verifyAssembly(g);
  expect(g.horizontalWallplateExternalLengthMM).toBeCloseTo(1219.3, 1);
  expect(g.horizontalWallplateInternalLengthMM).toBeCloseTo(1110.7, 1);
  expect(g.leftExternalWallBarSlopeMM).toBeCloseTo(1772.06, 2);
  expect(g.leftInternalWallBarSlopeMM).toBeCloseTo(1660.57, 2);
  expect(g.wallplateAssembly.left.bossCentrePositionMM).toBeCloseTo(1442.5, 1);
  // Plan and physical boss centre now agree.
  close(g.resolvedLeftHipWidthMM, 1442.5);
});

test("different left and right pitches close without assuming symmetry", () => {
  verifyAssembly(calculateHippedLeanToGeometry({ ...roof,
    requestedLeftSidePitchDeg: 27, requestedRightSidePitchDeg: 35 }));
});

test("single hips retain a square end on the unhipped side", () => {
  for (const hippedSides of ["left", "right"]) {
    const g = calculateHippedLeanToGeometry({ ...roof, hippedSides });
    verifyAssembly(g);
    const a = g.wallplateAssembly;
    if (hippedSides === "left") {
      expect(a.right).toBe(null);
      close(a.horizontal.topRight.xMM, roof.widthMM);
      close(a.horizontal.bottomRight.xMM, roof.widthMM);
    } else {
      expect(a.left).toBe(null);
      close(a.horizontal.topLeft.xMM, 0);
      close(a.horizontal.bottomLeft.xMM, 0);
    }
  }
});

test("ring-beam datum changes preserve the specified top height and both joints", () => {
  for (const ring_beam_height_mm of [0, 40, 65]) {
    verifyAssembly(calculateHippedLeanToGeometry({ ...roof,
      materials: { ...materials, ring_beam_height_mm } }));
  }
});

test("rejects inconsistent foot/height geometry rather than reporting a closed joint", () => {
  const g = calculateHippedLeanToGeometry(roof);
  const a = g.wallplateAssembly;
  const side = { pitchDeg: g.leftSidePitchDeg,
    externalSlopeMM: g.leftExternalWallBarSlopeMM,
    horizontalFootCutMM: 153, verticalFootCutMM: g.leftPlumbCutHeightMM + 10 };
  expect(calculateWallplateAssemblyGeometry({ internalWidthMM: 4050,
    memberDepthMM: 220, ringBeamHeightMM: 40,
    externalWallplateHeightMM: a.topHeightMM, left: side }).valid).toBe(false);
});
