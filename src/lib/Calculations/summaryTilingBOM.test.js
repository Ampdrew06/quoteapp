import {
  applyUniversalTilingToSummaryLines,
  isMainRoofTileLine,
  selectSummaryExternalFixingLathM,
} from "./summaryTilingBOM";

test("identifies main roof tiles without matching accessories", () => {
  expect(isMainRoofTileLine({ key: "tile_britmet", label: "Britmet tiles" })).toBe(true);
  expect(isMainRoofTileLine({ key: "ls_tiles", label: "LiteSlate tiles" })).toBe(true);
  expect(isMainRoofTileLine({ key: "tile_starter", label: "Tile starter" })).toBe(false);
  expect(isMainRoofTileLine({ key: "verge", label: "2-Part Barge" })).toBe(false);
});

test("replaces only the main tile quantity and recalculates its line cost", () => {
  const accessories = { key: "verge", label: "2-Part Barge", qty: 6, line: 49.62 };
  const result = applyUniversalTilingToSummaryLines({
    lines: [
      {
        key: "tile_britmet",
        label: "Britmet tiles",
        qty: 66,
        qtyDisplay: 66,
        unit: 6.12,
        unitPrice: 6.12,
        line: 403.92,
      },
      accessories,
    ],
    automaticResult: { tileQuantityOrdered: 79, errors: [] },
  });

  expect(result.replaced).toBe(true);
  expect(result.tileQuantity).toBe(79);
  expect(result.lines[0]).toMatchObject({
    key: "tile_britmet",
    qty: 79,
    qtyDisplay: 79,
    line: 483.48,
    total: 483.48,
  });
  expect(result.lines[1]).toBe(accessories);
});

test("keeps legacy lines when the universal result is invalid", () => {
  const lines = [{ key: "tile_britmet", qty: 66 }];
  const result = applyUniversalTilingToSummaryLines({
    lines,
    automaticResult: { errors: ["Invalid facet"] },
  });

  expect(result).toEqual({ lines, replaced: false, tileQuantity: null });
});

test("selects universal external lath while retaining a safe legacy fallback", () => {
  expect(
    selectSummaryExternalFixingLathM({
      legacyExternalFixingLathM: 90.9,
      automaticResult: { lathLengthMM: 100265, errors: [] },
    })
  ).toBe(100.265);

  expect(
    selectSummaryExternalFixingLathM({
      legacyExternalFixingLathM: 90.9,
      automaticResult: { errors: ["Invalid facet"] },
    })
  ).toBe(90.9);
});