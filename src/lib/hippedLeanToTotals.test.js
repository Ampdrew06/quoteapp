jest.mock("./supabaseClient", () => ({
  supabase: {},
}));

import {
  adjustHippedSideEdgeLines,
  buildHippedLeanToTotals,
} from "./hippedLeanToTotals";
import { buildLeanToQuoteBase } from "./leanToTotals";

const materials = {
  verge_trim_piece_cover_mm: 1150,
  watercourse_piece_cover_mm: 2950,
};

const lines = [
  { key: "verge", label: "2-Part Barge", qty: 6, unit: 8.27, line: 49.62 },
  { key: "watercourse", label: "Watercourse", qty: 2, unit: 4, line: 8 },
  { key: "touchup", label: "Touch-Up kit", qty: 1, unit: 5.1, line: 5.1 },
];

test("a both-sided Hipped Lean-To has no verge or watercourse covering", () => {
  const adjusted = adjustHippedSideEdgeLines({
    lines,
    hippedSides: "both",
    slopeMM: 3400,
    projectionMM: 3600,
    materials,
  });

  expect(adjusted.map((line) => line.key)).toEqual(["touchup"]);
});

test("a left hip keeps only a qualifying open right-hand verge", () => {
  const adjusted = adjustHippedSideEdgeLines({
    lines,
    hippedSides: "left",
    rightWall: false,
    slopeMM: 3400,
    projectionMM: 3600,
    materials,
  });

  expect(adjusted.find((line) => line.key === "verge")).toMatchObject({
    qty: 3,
    line: 24.81,
  });
  expect(adjusted.some((line) => line.key === "watercourse")).toBe(false);
});

test("a left hip keeps only a qualifying right-hand wall watercourse", () => {
  const adjusted = adjustHippedSideEdgeLines({
    lines,
    hippedSides: "left",
    rightWall: true,
    slopeMM: 3400,
    projectionMM: 3600,
    materials,
  });

  expect(adjusted.some((line) => line.key === "verge")).toBe(false);
  expect(adjusted.find((line) => line.key === "watercourse")).toMatchObject({
    qty: 2,
    line: 8,
  });
});

test("the integrated both-sided totals contain no 2-Part Barge", () => {
  const totals = buildHippedLeanToTotals({
    widthMM: 5500,
    projMM: 3410,
    pitchDeg: 18,
    eavesOverhangMM: 150,
    hippedSides: "both",
    leftWall: false,
    rightWall: false,
    tileSystem: "britmet",
  });

  const text = totals.allLines
    .map((line) => `${line.key || ""} ${line.label || ""}`.toLowerCase())
    .join("\n");

  expect(text).not.toContain("2-part barge");
  expect(text).not.toContain("watercourse");
});

test("the quote base exposes its legacy tile-starter charge", () => {
  const quoteBase = buildLeanToQuoteBase({
    widthMM: 5500,
    projMM: 3410,
    pitchDeg: 18,
    tileSystem: "britmet",
  });

  expect(quoteBase.edgePricingBasis).toEqual({
    legacyTileStarterCost: expect.any(Number),
  });
  expect(quoteBase.edgePricingBasis.legacyTileStarterCost).toBeGreaterThan(0);
});

test("the quote base replaces legacy starter cost with shared edge cost", () => {
  const quoteBase = buildLeanToQuoteBase({
    widthMM: 5870,
    projMM: 3230,
    pitchDeg: 15,
    soffit_mm: 150,
    roofStyle: "hippedLeanTo",
    hippedSides: "both",
    leftHip: true,
    rightHip: true,
    requestedLeftSidePitchDeg: 25,
    requestedRightSidePitchDeg: 25,
    tileSystem: "britmet",
  });

  expect(quoteBase.automaticRoofEdgeResult.valid).toBe(true);
  expect(quoteBase.edgeAdjustment.valid).toBe(true);
  expect(quoteBase.materialsCostForPricing).toBeCloseTo(
    quoteBase.legacyMaterialsCostForPricing +
      quoteBase.edgeAdjustment.adjustment,
    8
  );
});
