import {
  calculateFacetTiling,
  calculateRoofTiling,
  widthAtFacetPosition,
} from "./facetTilingCalc";

const trapezoid = {
  id: "s1",
  label: "S1",
  baseWidthMM: 4465,
  topWidthMM: 2300,
  heightMM: 2389,
  pitchDeg: 20,
};

describe("facetTilingCalc steel-shingle geometry", () => {
  test("linearly interpolates a facet width", () => {
    expect(widthAtFacetPosition(trapezoid, 0)).toBe(4465);
    expect(widthAtFacetPosition(trapezoid, 2389)).toBe(2300);
    expect(widthAtFacetPosition(trapezoid, 1194.5)).toBeCloseTo(3382.5, 6);
  });

  test("uses the confirmed Timberlite 225/255 lath set-out", () => {
    const result = calculateFacetTiling({
      facet: trapezoid,
      product: "britmetShingle",
    });

    expect(result.errors).toEqual([]);
    expect(result.lathRows.map((row) => row.yMM)).toEqual([
      0, 225, 480, 735, 990, 1245, 1500, 1755, 2010, 2265,
    ]);
    expect(result.lathRows[0].kind).toBe("chamferedPerimeter");
    expect(result.courses.at(-1).kind).toBe("cutFinalCourse");
    expect(result.courses.at(-1).yMM).toBe(2265);
expect(result.courses.at(-1).endYMM).toBe(2389);
expect(result.courses).toHaveLength(result.lathRows.length);
  });

  test("shares geometry between Britmet and Metrotile", () => {
    const britmet = calculateFacetTiling({ facet: trapezoid, product: "britmetShingle" });
    const metrotile = calculateFacetTiling({ facet: trapezoid, product: "metrotileShingle" });

    expect(metrotile.lathRows).toEqual(britmet.lathRows);
    expect(metrotile.tileQuantityRaw).toBe(britmet.tileQuantityRaw);
  });

  test("aggregates different facet shapes without assuming symmetry", () => {
    const roof = calculateRoofTiling({
      product: "britmetShingle",
      facets: [
        trapezoid,
        {
          id: "s2",
          label: "S2",
          baseWidthMM: 4330,
          topWidthMM: 0,
          heightMM: 2389,
          pitchDeg: 20,
        },
      ],
    });

    expect(roof.errors).toEqual([]);
    expect(roof.facets).toHaveLength(2);
    expect(roof.facets[0].lathLengthMM).not.toBe(roof.facets[1].lathLengthMM);
    expect(roof.lathLengthMM).toBeCloseTo(
      roof.facets[0].lathLengthMM + roof.facets[1].lathLengthMM,
      3
    );
  });
    test("selects the correct LiteSlate pitch bands", () => {
    const expectedRules = [
      { pitchDeg: 12, gaugeMM: 152, slatesPerM2: 22 },
      { pitchDeg: 25, gaugeMM: 165, slatesPerM2: 20 },
      { pitchDeg: 27.5, gaugeMM: 178, slatesPerM2: 19 },
      { pitchDeg: 30, gaugeMM: 190, slatesPerM2: 18 },
    ];

    expectedRules.forEach(
      ({ pitchDeg, gaugeMM, slatesPerM2 }) => {
        const result = calculateFacetTiling({
          product: "liteSlate",
          facet: {
            ...trapezoid,
            pitchDeg,
          },
        });

        expect(result.errors).toEqual([]);
        expect(result.pitchRule.gaugeMM).toBe(gaugeMM);
        expect(result.pitchRule.slatesPerM2).toBe(
          slatesPerM2
        );
      }
    );
  });

  test("uses the synthetic-slate eaves laths and doubled first row", () => {
    const result = calculateFacetTiling({
      product: "liteSlate",
      facet: {
        ...trapezoid,
        pitchDeg: 20,
      },
    });

    expect(result.errors).toEqual([]);

    expect(
      result.lathRows
        .slice(0, 5)
        .map((row) => row.yMM)
    ).toEqual([0, 150, 200, 302, 454]);

    expect(result.standardSlateQuantityRaw).toBeGreaterThan(
      0
    );

    expect(result.starterSlateQuantityRaw).toBe(
  Math.ceil(4465 / 297)
);

    expect(result.tileQuantityRaw).toBeCloseTo(
      result.standardSlateQuantityRaw +
        result.starterSlateQuantityRaw,
      5
    );

    expect(result.fixingQuantity).toBe(
      result.tileQuantityOrdered * 2
    );
  });

  test("keeps the LiteSlate and Tapco steep gauges separate", () => {
    const liteSlate = calculateFacetTiling({
      product: "liteSlate",
      facet: {
        ...trapezoid,
        pitchDeg: 31,
      },
    });

    const tapco = calculateFacetTiling({
      product: "tapcoSlate",
      facet: {
        ...trapezoid,
        pitchDeg: 31,
      },
    });

    expect(liteSlate.pitchRule.gaugeMM).toBe(190);
    expect(tapco.pitchRule.gaugeMM).toBe(191);

    expect(liteSlate.pitchRule.slatesPerM2).toBe(18);
    expect(tapco.pitchRule.slatesPerM2).toBe(18);
  });

  test("matches the factory-verified LiteSlate lean-to", () => {
  const result = calculateFacetTiling({
    product: "liteSlate",
    facet: {
      id: "factory-lean-to",
      label: "Factory Lean-To",
      baseWidthMM: 2610,
      topWidthMM: 2610,
      heightMM: 3168,
      pitchDeg: 12,
    },
  });

  expect(result.errors).toEqual([]);

  expect(result.lathRows).toHaveLength(22);
  expect(result.lathLengthMM).toBeCloseTo(57420, 3);

  expect(result.courses).toHaveLength(21);
  expect(result.standardSlateQuantityRaw).toBe(189);
  expect(result.starterSlateQuantityRaw).toBe(9);

  expect(result.tileQuantityRaw).toBe(198);
  expect(result.tileQuantityOrdered).toBe(198);
  expect(result.fixingQuantity).toBe(396);
});
});