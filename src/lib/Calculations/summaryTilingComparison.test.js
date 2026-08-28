import {
  buildSummaryTilingComparison,
  findLegacyMainTileQuantity,
} from "./summaryTilingComparison";

test("finds Britmet and LiteSlate main tile quantities", () => {
  expect(
    findLegacyMainTileQuantity([
      { key: "tile_britmet", label: "Britmet tiles", qty: 52 },
    ])
  ).toBe(52);

  expect(
    findLegacyMainTileQuantity([
      { key: "ls_verge", label: "Dry Verge", qty: 4 },
      { key: "ls_tiles", label: "LiteSlate tiles", qty: 198 },
    ])
  ).toBe(198);
});

test("does not mistake accessories for the main tile quantity", () => {
  expect(
    findLegacyMainTileQuantity([
      { key: "tile_starter", label: "Tile starter", qty: 2 },
      { key: "screws_tile_fixings", label: "Tile fixings", qty: 1 },
    ])
  ).toBeNull();
});

test("compares legacy quantities without changing either result", () => {
  const automaticResult = {
    tileQuantityOrdered: 78,
    lathLengthMM: 100265,
    errors: [],
  };

  const comparison = buildSummaryTilingComparison({
    legacyTileLines: [
      { key: "tile_britmet", label: "Britmet tiles", qty: 66 },
    ],
    legacyExternalLathM: 72.5,
    automaticResult,
  });

  expect(comparison).toEqual({
    legacyTileQuantity: 66,
    universalTileQuantity: 78,
    tileDifference: 12,
    legacyExternalLathM: 72.5,
    universalExternalLathM: 100.265,
    externalLathDifferenceM: 27.765,
  });

  expect(automaticResult.tileQuantityOrdered).toBe(78);
});

test("returns no comparison when the automatic calculation is invalid", () => {
  expect(
    buildSummaryTilingComparison({
      legacyTileLines: [],
      automaticResult: { errors: ["Unsupported roof"] },
    })
  ).toBeNull();
});