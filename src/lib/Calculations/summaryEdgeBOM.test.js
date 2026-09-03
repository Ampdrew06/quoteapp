import {
  applyAutomaticEdgeBOMToSummaryLines,
  applyAutomaticHipBOMToSummaryTileLines,
} from "./summaryEdgeBOM";

const legacyLines = [
  {
    key: "tile_starter",
    label: "Tile starter (3.0 m length)",
    qty: 6.211,
    order_qty: 3,
    line: 24.84,
  },
  { key: "watercourse", label: "Watercourse", qty: 2, line: 10 },
  { key: "joist_hangers", label: "Joist Hangers", qty: 10, line: 20 },
];

const automaticEdgeResult = {
  valid: true,
  bom: {
    valid: true,
    lines: [
      {
        key: "tile_starter",
        qty: 13.110762285916138,
        order_qty: 5,
        units: "m",
        weight_kg: 11.8,
        line: 52.44,
        retainedOffcutMM: 1889,
        chargeBasis: "usedLength",
      },
      { key: "hip_ridge", label: "Hip / Ridge tile", qty: 8, order_qty: 8, units: "pcs", line: 49.44 },
      { key: "hip_end_cap_90", label: "90° Hip End Cap", qty: 2, order_qty: 2, units: "Ea", line: 21 },
    ],
  },
};

describe("applyAutomaticEdgeBOMToSummaryLines", () => {
  test("replaces only the legacy tile-starter row", () => {
    const result = applyAutomaticEdgeBOMToSummaryLines({
      lines: legacyLines,
      automaticEdgeResult,
    });

    expect(result.valid).toBe(true);
    expect(result.lines[0]).toMatchObject({
      key: "tile_starter",
      _k: "tile_starter",
      qty: 13.111,
      order_qty: 5,
      units: "m",
      weight_kg: 11.8,
      line: 52.44,
      retainedOffcutMM: 1889,
      chargeBasis: "usedLength",
    });
    expect(result.lines[0].qty).toBe(13.111);
    expect(result.lines[0].order_qty).toBe(5);
    expect(result.lines.filter((line) => line.key === "tile_starter")).toHaveLength(1);
  });

  test("preserves other metal rows and their order", () => {
    const result = applyAutomaticEdgeBOMToSummaryLines({
      lines: legacyLines,
      automaticEdgeResult,
    });

    expect(result.lines.slice(1)).toEqual(legacyLines.slice(1));
  });

  test("adds the tile-starter row when no legacy row exists", () => {
    const result = applyAutomaticEdgeBOMToSummaryLines({
      lines: legacyLines.slice(1),
      automaticEdgeResult,
    });

    expect(result.lines[0].key).toBe("tile_starter");
    expect(result.lines).toHaveLength(3);
  });

  test("leaves legacy rows unchanged when automatic edge BOM is invalid", () => {
    const result = applyAutomaticEdgeBOMToSummaryLines({
      lines: legacyLines,
      automaticEdgeResult: { valid: false, errors: ["Invalid roof."] },
    });

    expect(result.valid).toBe(false);
    expect(result.lines).toBe(legacyLines);
  });
});

describe("applyAutomaticHipBOMToSummaryTileLines", () => {
  test("replaces legacy hip products and inserts confirmed products before touch-up", () => {
    const lines = [
      { key: "britmet_tiles", label: "Britmet tiles", qty: 79, line: 483.48 },
      { key: "old_ridge_tile", label: "Ridge Tile", qty: 1, line: 0 },
      { key: "touch_up_kit", label: "Touch-Up kit", qty: 1, line: 5.1 },
    ];

    const result = applyAutomaticHipBOMToSummaryTileLines({
      lines,
      automaticEdgeResult,
    });

    expect(result.valid).toBe(true);
    expect(result.lines.map((line) => line.key)).toEqual([
      "britmet_tiles",
      "hip_ridge",
      "hip_end_cap_90",
      "touch_up_kit",
    ]);
    expect(result.lines[1].line).toBe(49.44);
    expect(result.lines[2].line).toBe(21);
  });
});
