import {
  applyAutomaticEdgeBOMToIdiotListRows,
  applyAutomaticHipRowsToIdiotListTileRows,
  applyAutomaticMainTileToIdiotListRows,
  applyAutomaticStructuralMetalToIdiotListRows,
} from "./idiotListEdgeRows";

const legacyRows = [
  { item: "Tile Starter", qty: 3, units: "Lengths" },
  { item: "Watercourse (wall abutment)", qty: 2, units: "Lengths" },
  { item: "Joist Hangers", qty: 10, units: "Ea" },
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
        stockLengthMM: 3000,
        retainedOffcutMM: 1889.237714083862,
      },
    ],
  },
};

describe("applyAutomaticEdgeBOMToIdiotListRows", () => {
  test("replaces the old tile-starter row with confirmed stock lengths", () => {
    const result = applyAutomaticEdgeBOMToIdiotListRows({
      rows: legacyRows,
      automaticEdgeResult,
    });

    expect(result.valid).toBe(true);
    expect(result.rows[0]).toEqual({
      key: "tile_starter",
      item: "Tile Starter",
      qty: 5,
      units: "Lengths",
      usedLengthM: 13.111,
      stockLengthM: 3,
      retainedOffcutM: 1.889,
    });
  });

  test("preserves every other checklist row and its order", () => {
    const result = applyAutomaticEdgeBOMToIdiotListRows({
      rows: legacyRows,
      automaticEdgeResult,
    });

    expect(result.rows.slice(1)).toEqual(legacyRows.slice(1));
  });

  test("adds tile starter when the legacy checklist omitted it", () => {
    const result = applyAutomaticEdgeBOMToIdiotListRows({
      rows: legacyRows.slice(1),
      automaticEdgeResult,
    });

    expect(result.rows[0].qty).toBe(5);
    expect(result.rows).toHaveLength(3);
  });

  test("leaves the checklist unchanged when automatic geometry is invalid", () => {
    const result = applyAutomaticEdgeBOMToIdiotListRows({
      rows: legacyRows,
      automaticEdgeResult: { valid: false, errors: ["Invalid roof."] },
    });

    expect(result.valid).toBe(false);
    expect(result.rows).toBe(legacyRows);
  });
});

describe("applyAutomaticHipRowsToIdiotListTileRows", () => {
  test("removes barges and adds per-hip stock plus 90 degree end caps", () => {
    const result = applyAutomaticHipRowsToIdiotListTileRows({
      rows: [
        { item: "2-Part Barge trim", qty: 7, units: "pcs" },
        { item: "Finishing Kit", qty: 1, units: "Ea" },
      ],
      automaticEdgeResult: {
        valid: true,
        accessoryRequirements: {
          requirements: { twoPartBarge: { edgeCount: 0 } },
        },
        stock: {
          valid: true,
          lines: [
            { key: "hip_ridge", label: "Hip / Ridge tile", qty: 8, units: "pcs" },
            { key: "hip_end_cap_90", label: "90° Hip End Cap", qty: 2, units: "Ea" },
          ],
        },
      },
    });

    expect(result.rows).toEqual([
      { key: "hip_ridge", item: "Hip / Ridge tile", qty: 8, units: "pcs" },
      { key: "hip_end_cap_90", item: "90° Hip End Cap", qty: 2, units: "Ea" },
      { item: "Finishing Kit", qty: 1, units: "Ea" },
    ]);
  });
});

describe("applyAutomaticMainTileToIdiotListRows", () => {
  test("adds the universal ordered tile quantity when the legacy row is missing", () => {
    const result = applyAutomaticMainTileToIdiotListRows({
      rows: [{ item: "Finishing Kit", qty: 1, units: "Ea" }],
      automaticEdgeResult: {
        valid: true,
        tiling: {
          productId: "britmetShingle",
          result: { tileQuantityOrdered: 79 },
        },
      },
    });

    expect(result.rows[0]).toEqual({
      key: "main_roof_tiles",
      item: "Britmet tiles",
      qty: 79,
      units: "pcs",
    });
  });

  test("does not mistake hip tiles or end caps for the main roof tile", () => {
    const result = applyAutomaticMainTileToIdiotListRows({
      rows: [
        { item: "Hip / Ridge tile", qty: 8, units: "pcs" },
        { item: "90° Hip End Cap", qty: 2, units: "Ea" },
      ],
      automaticEdgeResult: {
        valid: true,
        tiling: {
          productId: "britmetShingle",
          result: { tileQuantityOrdered: 79 },
        },
      },
    });

    expect(result.rows.map((row) => row.item)).toEqual([
      "Britmet tiles",
      "Hip / Ridge tile",
      "90° Hip End Cap",
    ]);
  });
});

describe("applyAutomaticStructuralMetalToIdiotListRows", () => {
  test("uses the same Hipped Lean-To structural metal counts as Summary", () => {
    const result = applyAutomaticStructuralMetalToIdiotListRows({
      rows: [
        { item: "Tile Starter", qty: 5, units: "Lengths" },
        { item: "Joist Hangers", qty: 10, units: "Ea" },
      ],
      automaticEdgeResult: {
        valid: true,
        edgeModel: { roofStyle: "hippedLeanTo" },
        tiling: {
          geometry: {
            plainRafterCount: 3,
            leftJackRafterCount: 4,
            rightJackRafterCount: 4,
            leftSideIntermediateJackCount: 1,
            rightSideIntermediateJackCount: 1,
            bossQty: 2,
            sparHookQty: 8,
          },
        },
      },
    });

    expect(result.rows).toEqual([
      { item: "Tile Starter", qty: 5, units: "Lengths" },
      { key: "joist_hangers", item: "Joist Hangers", qty: 3, units: "Ea" },
      { key: "jack_rafter_hooks", item: "Jack Rafter Hooks", qty: 10, units: "Ea" },
      { key: "jack_rafter_brackets", item: "Jack Rafter Brackets", qty: 10, units: "Ea" },
      { key: "boss_rafter_terminal", item: "Boss / Rafter Terminal", qty: 2, units: "Ea" },
      { key: "spar_hook", item: "Spar Hook", qty: 8, units: "Ea" },
    ]);
  });

  test("leaves an ordinary Lean-To metal list unchanged", () => {
    const rows = [{ item: "Joist Hangers", qty: 10, units: "Ea" }];
    const result = applyAutomaticStructuralMetalToIdiotListRows({
      rows,
      automaticEdgeResult: {
        valid: true,
        edgeModel: { roofStyle: "leanTo" },
        tiling: { geometry: {} },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.rows).toBe(rows);
  });
});
