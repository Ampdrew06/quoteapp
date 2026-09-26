import {
  calculateFacetTiling,
  calculateRoofTiling,
  normalizeRoofOpening,
  openingSegmentsAtY,
  lathOpeningDeductionAtY,
  calculateOpeningTileDeduction,
  widthAtFacetPosition,
} from "./facetTilingCalc";
import { buildFacet } from "../Manufacturing/facetBuilder";
import {
  calculateLeanToGeometry,
} from "../geometry/leanToGeometry";

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

  test("adds one finishing course and lath to each synthetic-slate facet ending at a ridge", () => {
    const roof = calculateRoofTiling({
      product: "liteSlate",
      facets: [1, 2].map((number) => ({
        id: `gable-${number}`,
        label: `Gable ${number}`,
        baseWidthMM: 3160,
        topWidthMM: 3160,
        heightMM: 2113,
        pitchDeg: 25,
        topEdgeType: "ridge",
      })),
    });

    expect(roof.errors).toEqual([]);
    expect(roof.tileQuantityOrdered).toBe(330);
    expect(roof.lathLengthMM).toBeCloseTo(94800, 3);

    roof.facets.forEach((facet) => {
      expect(facet.hasRidgeFinishingCourse).toBe(true);
      expect(facet.ridgeFinishingSlateQuantityRaw).toBe(11);
      expect(facet.tileQuantityRaw).toBe(165);
      expect(facet.lathRows).toHaveLength(15);
      expect(facet.lathRows.at(-1)).toMatchObject({
        kind: "ridgeFinishing",
        widthMM: 3160,
        setOutOnSite: true,
      });
    });
  });

  test("does not apply the ridge finishing rule to Britmet or Metrotile", () => {
    ["britmetShingle", "metrotileShingle"].forEach((product) => {
      const withoutRidge = calculateFacetTiling({
        product,
        facet: trapezoid,
      });
      const withRidge = calculateFacetTiling({
        product,
        facet: {
          ...trapezoid,
          topEdgeType: "ridge",
        },
      });

      expect(withRidge.lathRows).toEqual(withoutRidge.lathRows);
      expect(withRidge.tileQuantityRaw).toBe(withoutRidge.tileQuantityRaw);
    });
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
  test(
    "accepts a universal buildFacet tiled surface",
    () => {
      const builtFacet = buildFacet({
        id: "built-s1",
        label: "Built S1",

        externalEavesLengthMM: 4465,
        externalSlopeLengthMM: 2389,

        pitchDeg: 20,

        tilingGeometry: {
          baseWidthMM: 4465,
          topWidthMM: 2300,
          heightMM: 2389,
        },
      });

      const flatResult =
        calculateFacetTiling({
          facet: trapezoid,
          product: "britmetShingle",
        });

      const builtResult =
        calculateFacetTiling({
          facet: builtFacet,
          product: "britmetShingle",
        });

      expect(builtResult.errors).toEqual([]);

      expect(
        builtResult.facet.baseWidthMM
      ).toBe(4465);

      expect(
        builtResult.facet.topWidthMM
      ).toBe(2300);

      expect(
        builtResult.facet.heightMM
      ).toBe(2389);

      expect(
        builtResult.facet.pitchDeg
      ).toBe(20);

      expect(
        builtResult.tileQuantityRaw
      ).toBe(flatResult.tileQuantityRaw);

      expect(
        builtResult.lathLengthMM
      ).toBe(flatResult.lathLengthMM);

      expect(
        builtResult.lathRows
      ).toEqual(flatResult.lathRows);
    }
  );
    test(
    "calculates tiles from the factory-verified Lean-To geometry",
    () => {
      const geometry =
        calculateLeanToGeometry({
          widthMM: 2485,
          projectionMM: 2830,
          pitchDeg: 12,
          soffitDepthMM: 150,

          leftWall: true,
          rightWall: false,

          rightSupportDepthMM: 100,

          tileOverhangMM: 50,

          materials: {
            side_frame_thickness_mm: 70,
            fascia_lip_mm: 25,
            frame_on_mm: 70,
            wallplate_thickness_mm: 63,
          },
        });

      expect(geometry.facets).toHaveLength(1);

      const facet = geometry.mainFacet;

      expect(
        facet.geometry.tiling
      ).not.toBeNull();

      expect(
        facet.geometry.tiling.baseWidthMM
      ).toBe(2610);

      expect(
        facet.geometry.tiling.topWidthMM
      ).toBe(2610);

      /*
       * 2830 internal projection
       * + 150 soffit
       * + 70 frame-on
       * + 50 tile overhang
       * converted to the 12-degree slope.
       */
      expect(
        facet.geometry.tiling.heightMM
      ).toBeCloseTo(3169.256, 3);

      const roofResult =
        calculateRoofTiling({
          product: "liteSlate",
          facets: geometry.facets,
        });

      expect(roofResult.errors).toEqual([]);

      expect(
        roofResult.facets[0].lathRows
      ).toHaveLength(22);

      expect(
        roofResult.lathLengthMM
      ).toBeCloseTo(57420, 3);

      expect(
        roofResult.tileQuantityRaw
      ).toBe(198);

      expect(
        roofResult.tileQuantityOrdered
      ).toBe(198);

      expect(
        roofResult.fixingQuantity
      ).toBe(396);
    }
  );
    test(
    "calculates the exact areas of the standard roof vents",
    () => {
      const smallVent =
        normalizeRoofOpening({
          id: "vent-small",
          label: "550 × 780 Vent",
          type: "vent",
          productId: "vent-550x780",

          xMM: 0,
          yMM: 0,
          widthMM: 550,
          heightMM: 780,
        });

      const mediumVent =
        normalizeRoofOpening({
          id: "vent-medium",
          label: "550 × 980 Vent",
          type: "vent",
          productId: "vent-550x980",

          xMM: 0,
          yMM: 0,
          widthMM: 550,
          heightMM: 980,
        });

      const largeVent =
        normalizeRoofOpening({
          id: "vent-large",
          label: "780 × 980 Vent",
          type: "vent",
          productId: "vent-780x980",

          xMM: 0,
          yMM: 0,
          widthMM: 780,
          heightMM: 980,
        });

      expect(smallVent.errors).toEqual([]);
      expect(mediumVent.errors).toEqual([]);
      expect(largeVent.errors).toEqual([]);

      expect(smallVent.areaM2).toBeCloseTo(
        0.429,
        6
      );

      expect(mediumVent.areaM2).toBeCloseTo(
        0.539,
        6
      );

      expect(largeVent.areaM2).toBeCloseTo(
        0.7644,
        6
      );

      expect(smallVent.outline).toEqual([
        { xMM: 0, yMM: 0 },
        { xMM: 550, yMM: 0 },
        { xMM: 550, yMM: 780 },
        { xMM: 0, yMM: 780 },
      ]);
    }
  );
  test("calculates rectangular and hip-shaped fixed glazing areas", () => {
  const rectangular = normalizeRoofOpening(
    {
      id: "fixed-1",
      type: "fixedGlazing",
      xMM: 200,
      yMM: 300,
      widthMM: 600,
      heightMM: 2000,
    },
    0
  );

  const hipShaped = normalizeRoofOpening(
    {
      id: "fixed-2",
      type: "fixedGlazing",
      outline: [
        { xMM: 0, yMM: 0 },
        { xMM: 600, yMM: 0 },
        { xMM: 600, yMM: 1500 },
        { xMM: 300, yMM: 2000 },
        { xMM: 0, yMM: 1500 },
      ],
    },
    1
  );

  expect(rectangular.errors).toEqual([]);
  expect(rectangular.areaM2).toBeCloseTo(1.2, 6);

  expect(hipShaped.errors).toEqual([]);
  expect(hipShaped.areaM2).toBeCloseTo(1.05, 6);
});

test("finds the opening width crossing individual lath positions", () => {
  const rectangular = normalizeRoofOpening({
    type: "roofVent",
    xMM: 1000,
    yMM: 500,
    widthMM: 550,
    heightMM: 780,
  });

  const hipShaped = normalizeRoofOpening({
    type: "fixedGlazing",
    outline: [
      { xMM: 0, yMM: 0 },
      { xMM: 600, yMM: 0 },
      { xMM: 600, yMM: 1500 },
      { xMM: 300, yMM: 2000 },
      { xMM: 0, yMM: 1500 },
    ],
  });

  expect(openingSegmentsAtY(rectangular, 400)).toEqual([]);

  expect(openingSegmentsAtY(rectangular, 600)).toEqual([
    {
      startXMM: 1000,
      endXMM: 1550,
      widthMM: 550,
    },
  ]);

  expect(openingSegmentsAtY(rectangular, 1300)).toEqual([]);

  expect(openingSegmentsAtY(hipShaped, 1000)).toEqual([
    {
      startXMM: 0,
      endXMM: 600,
      widthMM: 600,
    },
  ]);

  expect(openingSegmentsAtY(hipShaped, 1750)).toEqual([
    {
      startXMM: 150,
      endXMM: 450,
      widthMM: 300,
    },
  ]);
});
test("clips and combines overlapping lath opening deductions", () => {
  const openings = [
    normalizeRoofOpening({
      type: "roofVent",
      xMM: -100,
      yMM: 500,
      widthMM: 600,
      heightMM: 780,
    }),

    normalizeRoofOpening({
      type: "fixedGlazing",
      xMM: 400,
      yMM: 500,
      widthMM: 600,
      heightMM: 780,
    }),

    normalizeRoofOpening({
      type: "roofVent",
      xMM: 1400,
      yMM: 500,
      widthMM: 300,
      heightMM: 780,
    }),
  ];

  expect(
    lathOpeningDeductionAtY(
      openings,
      600,
      1500
    )
  ).toBe(1100);

  expect(
    lathOpeningDeductionAtY(
      openings,
      400,
      1500
    )
  ).toBe(0);
});
test("deducts laths and steel-shingle coverage for a roof opening", () => {
  const facet = {
    baseWidthMM: 3000,
    topWidthMM: 3000,
    heightMM: 1500,
    pitchDeg: 15,
  };

  const withoutOpening = calculateFacetTiling({
    product: "britmetShingle",
    facet,
  });

  const withOpening = calculateFacetTiling({
    product: "britmetShingle",
    facet: {
      ...facet,
      openings: [
        {
          type: "roofVent",
          xMM: 1000,
          yMM: 500,
          widthMM: 550,
          heightMM: 780,
        },
      ],
    },
  });

  const affectedRows =
    withOpening.lathRows.filter(
      (row) => row.openingDeductionMM > 0
    );

  expect(affectedRows).toHaveLength(3);

  expect(
    affectedRows.map(
      (row) => row.openingDeductionMM
    )
  ).toEqual([550, 550, 550]);

  expect(
    withoutOpening.lathLengthMM -
      withOpening.lathLengthMM
  ).toBe(1650);

  expect(
  withoutOpening.tileQuantityRaw -
    withOpening.tileQuantityRaw
).toBeCloseTo(
  0.429 / 0.317475,
  6
);

expect(
  withOpening.openingTileQuantityDeduction
).toBeCloseTo(
  0.429 / 0.317475,
  6
);
});
test("rejects an opening extending beyond its roof facet", () => {
  const result = calculateFacetTiling({
    product: "britmetShingle",
    facet: {
      baseWidthMM: 3000,
      topWidthMM: 2000,
      heightMM: 1500,
      pitchDeg: 15,
      openings: [
        {
          label: "Vent 1",
          type: "roofVent",
          xMM: 2700,
          yMM: 500,
          widthMM: 550,
          heightMM: 780,
        },
      ],
    },
  });

  expect(result.errors).toContain(
    "Vent 1 must fit completely within its roof facet."
  );

  expect(result.lathRows).toEqual([]);
  expect(result.courses).toEqual([]);
});
test("calculates opening tile deductions using each product coverage rule", () => {
  const vent = normalizeRoofOpening({
    type: "roofVent",
    xMM: 1000,
    yMM: 500,
    widthMM: 550,
    heightMM: 780,
  });

  const steelDeduction =
    calculateOpeningTileDeduction({
      openings: [vent],
      product: "britmetShingle",
      pitchDeg: 15,
    });

  const liteSlateDeduction =
    calculateOpeningTileDeduction({
      openings: [vent],
      product: "liteSlate",
      pitchDeg: 25,
    });

  const tapcoDeduction =
    calculateOpeningTileDeduction({
      openings: [vent],
      product: "tapcoSlate",
      pitchDeg: 25,
    });

  expect(steelDeduction).toBeCloseTo(
    0.429 / 0.317475,
    6
  );

  expect(liteSlateDeduction).toBeCloseTo(
    8.58,
    6
  );

  expect(tapcoDeduction).toBeCloseTo(
    8.58,
    6
  );
});
test("deducts roof openings from LiteSlate and Tapco quantities", () => {
  const facet = {
    baseWidthMM: 3000,
    topWidthMM: 3000,
    heightMM: 1500,
    pitchDeg: 25,
  };

  const opening = {
    type: "roofVent",
    xMM: 1000,
    yMM: 500,
    widthMM: 550,
    heightMM: 780,
  };

  const products = [
    "liteSlate",
    "tapcoSlate",
  ];

  products.forEach((product) => {
    const withoutOpening =
      calculateFacetTiling({
        product,
        facet,
      });

    const withOpening =
      calculateFacetTiling({
        product,
        facet: {
          ...facet,
          openings: [opening],
        },
      });

    expect(
      withOpening.openingTileQuantityDeduction
    ).toBeCloseTo(8.58, 6);

    expect(
      withoutOpening.tileQuantityRaw -
        withOpening.tileQuantityRaw
    ).toBeCloseTo(8.58, 6);

    expect(
      withOpening.tileQuantityOrdered
    ).toBe(
      Math.ceil(
        withOpening.tileQuantityRaw
      )
    );
  });
});
test("aggregates opening areas and rounds the steel order once per roof", () => {
  const result = calculateRoofTiling({
    product: "britmetShingle",
    facets: [
      {
        label: "Facet 1",
        baseWidthMM: 3000,
        topWidthMM: 3000,
        heightMM: 1500,
        pitchDeg: 15,
        openings: [
          {
            label: "Vent 1",
            type: "roofVent",
            xMM: 1000,
            yMM: 500,
            widthMM: 550,
            heightMM: 780,
          },
        ],
      },
      {
        label: "Facet 2",
        baseWidthMM: 3000,
        topWidthMM: 3000,
        heightMM: 1500,
        pitchDeg: 15,
        openings: [
          {
            label: "Vent 2",
            type: "roofVent",
            xMM: 1000,
            yMM: 400,
            widthMM: 550,
            heightMM: 980,
          },
        ],
      },
    ],
  });

  expect(result.errors).toEqual([]);

  expect(result.grossFacetAreaM2).toBeCloseTo(
    9,
    6
  );

  expect(result.openingAreaM2).toBeCloseTo(
    0.968,
    6
  );

  expect(result.netFacetAreaM2).toBeCloseTo(
    8.032,
    6
  );

  expect(result.facetAreaM2).toBe(
    result.grossFacetAreaM2
  );

  expect(result.tileQuantityOrdered).toBe(
    Math.ceil(result.tileQuantityRaw) + 2
  );

  expect(result.orderAllowanceTiles).toBe(2);

  expect(result.fixingQuantity).toBe(
    result.tileQuantityOrdered * 4
  );
});
test("accepts universal buildFacet tiling geometry", () => {
  const manualResult = calculateFacetTiling({
    product: "britmetShingle",
    facet: trapezoid,
  });

  const universalFacetResult =
    calculateFacetTiling({
      product: "britmetShingle",

      facet: {
        id: "built-facet",
        label: "Built Roof Facet",

        geometry: {
          pitchDeg: 20,

          tiling: {
            baseWidthMM: 4465,
            topWidthMM: 2300,
            heightMM: 2389,

            outline: [
              { xMM: 0, yMM: 0 },
              { xMM: 4465, yMM: 0 },
              { xMM: 2300, yMM: 2389 },
              { xMM: 0, yMM: 2389 },
            ],
          },
        },

        openings: [],
      },
    });

  expect(universalFacetResult.errors).toEqual([]);

  expect(
    universalFacetResult.facet.baseWidthMM
  ).toBe(4465);

  expect(
    universalFacetResult.facet.topWidthMM
  ).toBe(2300);

  expect(
    universalFacetResult.facet.heightMM
  ).toBe(2389);

  expect(
    universalFacetResult.lathRows
  ).toEqual(manualResult.lathRows);

  expect(
    universalFacetResult.tileQuantityRaw
  ).toBe(manualResult.tileQuantityRaw);
});
test(
  "uses one roof-wide slate set-out pitch while retaining physical facet pitches",
  () => {
    const roof = calculateRoofTiling({
      product: "liteSlate",
      overallSetOutPitchDeg: 15,

      facets: [
        {
          id: "front-facet",
          label: "Front Facet",

          geometry: {
            pitchDeg: 15,

            tiling: {
              baseWidthMM: 6310.76,
              topWidthMM: 2107.61,
              heightMM: 3623.47,
              outline: [],
            },
          },

          openings: [],
        },

        {
          id: "left-side-facet",
          label: "Left Side Facet",

          geometry: {
            pitchDeg: 25,

            tiling: {
              baseWidthMM: 3500,
              topWidthMM: 0,
              heightMM: 2318.83,
              outline: [],
            },
          },

          openings: [],
        },
      ],
    });

    expect(roof.errors).toEqual([]);

    expect(
      roof.facets[0].facet.pitchDeg
    ).toBe(15);

    expect(
      roof.facets[1].facet.pitchDeg
    ).toBe(25);

    expect(
      roof.facets[0].facet.setOutPitchDeg
    ).toBe(15);

    expect(
      roof.facets[1].facet.setOutPitchDeg
    ).toBe(15);

    expect(
      roof.facets[0].pitchRule.gaugeMM
    ).toBe(152);

    expect(
      roof.facets[1].pitchRule.gaugeMM
    ).toBe(152);
  }
);
});
