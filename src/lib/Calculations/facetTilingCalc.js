import {
  getSlatePitchRule,
  getTileProduct,
} from "./tileProductConfig";

const asFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const round = (value, decimalPlaces = 6) => {
  const factor = 10 ** decimalPlaces;
  return Math.round((Number(value) || 0) * factor) / factor;
};

/*
 * Accepts both:
 *
 * 1. The current standalone calculator format:
 *    facet.baseWidthMM
 *
 * 2. A universal buildFacet() object:
 *    facet.geometry.tiling.baseWidthMM
 *
 * Canonical built-facet geometry takes priority when both
 * representations happen to be present.
 */

const polygonAreaMM2 = (outline = []) => {
  if (
    !Array.isArray(outline) ||
    outline.length < 3
  ) {
    return 0;
  }

  let doubledArea = 0;

  outline.forEach((point, index) => {
    const nextPoint =
      outline[
        (index + 1) % outline.length
      ];

    doubledArea +=
      point.xMM * nextPoint.yMM -
      nextPoint.xMM * point.yMM;
  });

  return Math.abs(doubledArea) / 2;
};

/*
 * Normalises one roof opening into a polygon on the
 * developed tiled surface.
 *
 * Rectangle inputs are converted into an outline.
 * Custom/future hip-cut units may supply an outline
 * directly.
 */
export function normalizeRoofOpening(
  opening = {},
  index = 0
) {
  const errors = [];

  const id =
    opening.id ||
    `opening-${index + 1}`;

  const type =
    opening.type ||
    "custom";

  let outline = [];

  if (
    Array.isArray(opening.outline) &&
    opening.outline.length >= 3
  ) {
    outline = opening.outline.map(
      (point) => ({
        xMM:
          asFiniteNumber(
            point?.xMM ?? point?.x
          ) ?? 0,

        yMM:
          asFiniteNumber(
            point?.yMM ?? point?.y
          ) ?? 0,
      })
    );
  } else {
    const xMM =
      asFiniteNumber(opening.xMM) ?? 0;

    const yMM =
      asFiniteNumber(opening.yMM) ?? 0;

    const widthMM =
      asFiniteNumber(
        opening.widthMM
      );

    const heightMM =
      asFiniteNumber(
        opening.heightMM
      );

    if (!(widthMM > 0)) {
      errors.push(
        "Opening width must be greater than 0 mm."
      );
    }

    if (!(heightMM > 0)) {
      errors.push(
        "Opening height must be greater than 0 mm."
      );
    }

    if (
      widthMM > 0 &&
      heightMM > 0
    ) {
      outline = [
        {
          xMM,
          yMM,
        },
        {
          xMM: xMM + widthMM,
          yMM,
        },
        {
          xMM: xMM + widthMM,
          yMM: yMM + heightMM,
        },
        {
          xMM,
          yMM: yMM + heightMM,
        },
      ];
    }
  }

  const areaMM2 =
    polygonAreaMM2(outline);

  if (!(areaMM2 > 0)) {
    errors.push(
      "Opening must have a valid positive area."
    );
  }

  return {
    id,
    label:
      opening.label ||
      `Opening ${index + 1}`,

    type,

    productId:
      opening.productId ?? null,

    glassSpecificationId:
      opening.glassSpecificationId ??
      null,

    outline,

    areaMM2:
      round(areaMM2, 3),

    areaM2:
      round(
        areaMM2 / 1_000_000,
        6
      ),

    errors: [...new Set(errors)],
  };
}

export function normalizeRoofOpenings(
  openings = []
) {
  return Array.isArray(openings)
    ? openings.map(
        (opening, index) =>
          normalizeRoofOpening(
            opening,
            index
          )
      )
    : [];
}

export function openingSegmentsAtY(opening, yMM) {
  const outline = opening?.outline || [];

  if (outline.length < 3 || !Number.isFinite(Number(yMM))) {
    return [];
  }

  const targetY = Number(yMM);
  const intersections = [];

  for (let index = 0; index < outline.length; index += 1) {
    const start = outline[index];
    const end = outline[(index + 1) % outline.length];

    const x1 = Number(start.xMM);
    const y1 = Number(start.yMM);
    const x2 = Number(end.xMM);
    const y2 = Number(end.yMM);

    if (![x1, y1, x2, y2].every(Number.isFinite)) {
      continue;
    }

    // Horizontal polygon edges do not create crossing points.
    if (y1 === y2) {
      continue;
    }

    // Half-open comparison prevents a shared vertex being counted twice.
    const crosses =
      (y1 <= targetY && targetY < y2) ||
      (y2 <= targetY && targetY < y1);

    if (!crosses) {
      continue;
    }

    const ratio = (targetY - y1) / (y2 - y1);
    intersections.push(x1 + ratio * (x2 - x1));
  }

  intersections.sort((a, b) => a - b);

  const segments = [];

  for (let index = 0; index + 1 < intersections.length; index += 2) {
    const startXMM = intersections[index];
    const endXMM = intersections[index + 1];

    if (endXMM > startXMM) {
      segments.push({
        startXMM: round(startXMM, 3),
        endXMM: round(endXMM, 3),
        widthMM: round(endXMM - startXMM, 3),
      });
    }
  }

  return segments;
}
export function lathOpeningDeductionAtY(
  openings = [],
  yMM,
  facetWidthMM
) {
  const maximumWidth = Math.max(
    0,
    Number(facetWidthMM) || 0
  );

  if (maximumWidth === 0) {
    return 0;
  }

  const segments = openings
    .flatMap((opening) =>
      openingSegmentsAtY(opening, yMM)
    )
    .map((segment) => ({
      startXMM: Math.max(
        0,
        Math.min(maximumWidth, segment.startXMM)
      ),
      endXMM: Math.max(
        0,
        Math.min(maximumWidth, segment.endXMM)
      ),
    }))
    .filter(
      (segment) =>
        segment.endXMM > segment.startXMM
    )
    .sort(
      (first, second) =>
        first.startXMM - second.startXMM
    );

  if (segments.length === 0) {
    return 0;
  }

  const mergedSegments = [
    { ...segments[0] },
  ];

  for (
    let index = 1;
    index < segments.length;
    index += 1
  ) {
    const current = segments[index];
    const previous =
      mergedSegments[mergedSegments.length - 1];

    if (current.startXMM <= previous.endXMM) {
      previous.endXMM = Math.max(
        previous.endXMM,
        current.endXMM
      );
    } else {
      mergedSegments.push({ ...current });
    }
  }

  return round(
    mergedSegments.reduce(
      (total, segment) =>
        total +
        segment.endXMM -
        segment.startXMM,
      0
    ),
    3
  );
}

function applyOpeningDeductionsToLathRows(
  lathRows = [],
  openings = []
) {
  return lathRows.map((row) => {
    const grossWidthMM = row.widthMM;

    const openingDeductionMM =
      lathOpeningDeductionAtY(
        openings,
        row.yMM,
        grossWidthMM
      );

    return {
      ...row,
      grossWidthMM,
      openingDeductionMM,
      widthMM: round(
        Math.max(
          0,
          grossWidthMM - openingDeductionMM
        ),
        3
      ),
    };
  });
}

function openingFitsWithinFacet(
  opening,
  facet
) {
  const outline = opening?.outline || [];

  if (outline.length < 3) {
    return false;
  }

  return outline.every((point) => {
    const xMM = Number(point.xMM);
    const yMM = Number(point.yMM);

    if (
      !Number.isFinite(xMM) ||
      !Number.isFinite(yMM) ||
      yMM < 0 ||
      yMM > facet.heightMM
    ) {
      return false;
    }

    const facetWidthMM =
      widthAtFacetPosition(facet, yMM);

    return (
      xMM >= 0 &&
      xMM <= facetWidthMM
    );
  });
}

export function calculateOpeningTileDeduction({
  openings = [],
  product: productOrId,
  pitchDeg,
} = {}) {
  const product = getTileProduct(productOrId);

  if (!product) {
    return 0;
  }

  const openingAreaM2 = openings.reduce(
    (total, opening) =>
      total + (Number(opening?.areaM2) || 0),
    0
  );

  if (product.strategy === "steelShingleCourses") {
    const tileCoverageM2 =
      (
        product.effectiveCoverWidthMM *
        product.subsequentGaugeMM
      ) /
      1_000_000;

    if (!(tileCoverageM2 > 0)) {
      return 0;
    }

    return round(
      openingAreaM2 / tileCoverageM2
    );
  }

  if (product.strategy === "slatePitchTable") {
    const pitchRule = getSlatePitchRule(
      product,
      pitchDeg
    );

    if (!pitchRule) {
      return 0;
    }

    return round(
      openingAreaM2 *
        pitchRule.slatesPerM2
    );
  }

  return 0;
}

export function normalizeFacetTilingInput(
  facet = {}
) {
  const tilingGeometry =
    facet?.geometry?.tiling;

  const facetPitchDeg =
    facet?.geometry?.pitchDeg ??
    facet?.pitchDeg;

      const facetSetOutPitchDeg =
    facet?.setOutPitchDeg ??
    tilingGeometry?.setOutPitchDeg ??
    facetPitchDeg;

  return {
    id: facet?.id ?? null,

    label:
      facet?.label ||
      "Facet",

    // Manual calculations supply this explicitly. Automatic roof geometry
    // supplies it when the roof topology is known (for example, a Gable ridge).
    topEdgeType:
      tilingGeometry?.topEdgeType ??
      facet?.geometry?.topEdgeType ??
      facet?.topEdgeType ??
      "none",

    baseWidthMM: asFiniteNumber(
      tilingGeometry?.baseWidthMM ??
      facet?.baseWidthMM
    ),

    topWidthMM: asFiniteNumber(
      tilingGeometry?.topWidthMM ??
      facet?.topWidthMM
    ),

    heightMM: asFiniteNumber(
      tilingGeometry?.heightMM ??
      facet?.heightMM
    ),

    pitchDeg: asFiniteNumber(
      facetPitchDeg
    ),

        setOutPitchDeg: asFiniteNumber(
      facetSetOutPitchDeg
    ),

        openings: normalizeRoofOpenings(
      facet?.openings
    ),
  };
}

export function widthAtFacetPosition(facet, yMM) {
  const baseWidthMM = Number(facet.baseWidthMM);
  const topWidthMM = Number(facet.topWidthMM);
  const heightMM = Number(facet.heightMM);
  const y = Math.min(Math.max(Number(yMM) || 0, 0), heightMM);

  if (!(heightMM > 0)) return 0;
  return baseWidthMM + (topWidthMM - baseWidthMM) * (y / heightMM);
}

function validateFacet(facet, product) {
  const warnings = [];
  const errors = [];
  const baseWidthMM = asFiniteNumber(facet?.baseWidthMM);
  const topWidthMM = asFiniteNumber(facet?.topWidthMM);
  const heightMM = asFiniteNumber(facet?.heightMM);
  const pitchDeg = asFiniteNumber(
  facet?.setOutPitchDeg ??
  facet?.pitchDeg
);

  if (!(baseWidthMM > 0)) errors.push("Base width must be greater than 0 mm.");
  if (topWidthMM === null || topWidthMM < 0) errors.push("Top width cannot be negative.");
  if (!(heightMM > 0)) errors.push("Facet height must be greater than 0 mm.");
    if (
    product?.strategy === "slatePitchTable" &&
    !(pitchDeg > 0)
  ) {
    errors.push(
      "Overall pitch must be greater than 0 degrees."
    );
  }

  if (pitchDeg > 0 && product) {
    if (pitchDeg < product.minimumPitchDeg) {
      warnings.push(
        `${product.label} has a minimum pitch of ${product.minimumPitchDeg} degrees.`
      );
    }
    if (pitchDeg > product.maximumPitchDeg) {
      warnings.push(
        `${product.label} has a maximum pitch of ${product.maximumPitchDeg} degrees.`
      );
    }
  }

  return { errors, warnings };
}

function buildSteelShinglePositions(heightMM, product) {
  const positions = [product.perimeterLathPositionMM];
  let position = product.firstFixingLathOffsetMM;

  while (position < heightMM) {
    positions.push(position);
    position += product.subsequentGaugeMM;
  }

  return positions;
}

function calculateSteelShingleFacet(facet, product, warnings) {
  const lathPositionsMM = buildSteelShinglePositions(facet.heightMM, product);
  const lathRows = applyOpeningDeductionsToLathRows(
  lathPositionsMM.map((yMM, index) => ({
    index: index + 1,
    kind:
      index === 0
        ? "chamferedPerimeter"
        : "tileFixing",
    yMM,
    widthMM: round(
      widthAtFacetPosition(facet, yMM),
      3
    ),
  })),
  facet.openings
);

 // A tile course occupies the area between its fixing position and the next
// fixing position. Using the average course width avoids overcounting tapered
// facets by measuring every course only at its wider lower edge.
const courses = lathPositionsMM.map((startYMM, index) => {
  const endYMM =
    index < lathPositionsMM.length - 1
      ? lathPositionsMM[index + 1]
      : facet.heightMM;

  const startWidthMM = widthAtFacetPosition(facet, startYMM);
  const endWidthMM = widthAtFacetPosition(facet, endYMM);
  const averageWidthMM = round((startWidthMM + endWidthMM) / 2, 3);
  const tileCountRaw = averageWidthMM / product.effectiveCoverWidthMM;

  return {
    index: index + 1,
    kind:
      index === lathPositionsMM.length - 1
        ? "cutFinalCourse"
        : "standardCourse",
    yMM: startYMM,
    startYMM,
    endYMM,
    widthMM: averageWidthMM,
    startWidthMM: round(startWidthMM, 3),
    endWidthMM: round(endWidthMM, 3),
    tileCountRaw: round(tileCountRaw),
  };
});

  const lathLengthMM = lathRows.reduce(
  (total, row) => total + row.widthMM,
  0
);

const grossTileQuantityRaw = courses.reduce(
  (total, course) =>
    total + course.tileCountRaw,
  0
);

const openingTileQuantityDeduction =
  calculateOpeningTileDeduction({
    openings: facet.openings,
    product,
    pitchDeg: facet.pitchDeg,
  });

const tileQuantityRaw = round(
  Math.max(
    0,
    grossTileQuantityRaw -
      openingTileQuantityDeduction
  )
);

const tileQuantityOrdered =
  Math.ceil(tileQuantityRaw);

  warnings.push(
    "Steel-shingle order rounding and wastage are provisional: tiles currently round up once per facet."
  );

  return {
    courses,
    lathRows,
    lathLengthMM: round(lathLengthMM, 3),
    grossTileQuantityRaw: round(
  grossTileQuantityRaw
),
openingTileQuantityDeduction,
tileQuantityRaw,
tileQuantityOrdered,
    fixingQuantity: tileQuantityOrdered * product.fixingsPerTile,
  };
}

function buildSyntheticSlatePositions(
  heightMM,
  product,
  gaugeMM
) {
  const positions = [
    product.perimeterLathPositionMM,
    ...product.eavesSupportLathPositionsMM,
  ];

  let position =
    product.firstStandardCourseOffsetMM + gaugeMM;

  while (position < heightMM) {
    positions.push(position);
    position += gaugeMM;
  }

  return [...new Set(positions)].sort(
    (a, b) => a - b
  );
}

function calculateSyntheticSlateFacet(facet, product, warnings) {
  const pitchRule = getSlatePitchRule(
  product,
  facet.setOutPitchDeg ??
    facet.pitchDeg
);

  const lathPositionsMM = buildSyntheticSlatePositions(
    facet.heightMM,
    product,
    pitchRule.gaugeMM
  );

  let lathRows = applyOpeningDeductionsToLathRows(
  lathPositionsMM.map((yMM, index) => ({
    index: index + 1,
    kind:
      yMM === product.perimeterLathPositionMM
        ? "chamferedPerimeter"
        : product.eavesSupportLathPositionsMM.includes(
              yMM
            )
          ? "eavesSupport"
          : "slateCourse",
    yMM,
    widthMM: round(
      widthAtFacetPosition(facet, yMM),
      3
    ),
  })),
  facet.openings
);

  const hasRidgeFinishingCourse =
    facet.topEdgeType === "ridge" &&
    facet.topWidthMM > 0;

  const ridgeFinishingLath = hasRidgeFinishingCourse
    ? {
        index: lathRows.length + 1,
        kind: "ridgeFinishing",
        // This records the ridge boundary datum. Its precise fixing position
        // is deliberately left for on-site set-out rather than inventing a gauge.
        yMM: facet.heightMM,
        widthMM: round(facet.topWidthMM, 3),
        setOutOnSite: true,
      }
    : null;

  if (ridgeFinishingLath) {
    lathRows = [...lathRows, ridgeFinishingLath];
  }

  const lathLengthMM = lathRows.reduce(
    (total, row) => total + row.widthMM,
    0
  );

  /*
   * The chamfered perimeter lath is included in the lath quantity but does not
   * create an additional ordinary slate course. Every remaining lath row
   * represents one installed slate course.
   */
  const coursePositionsMM = lathPositionsMM.filter(
    (yMM) => yMM !== product.perimeterLathPositionMM
  );

  const courses = coursePositionsMM.map((yMM, index) => {
    /*
     * The first course begins at the eaves. Subsequent courses begin at their
     * own lath position. The final course extends to the finished top edge.
     *
     * Using the wider boundary ensures a triangular or trapezoidal facet has
     * enough whole slates to cover its complete sloping edge.
     */
    const startYMM = index === 0 ? 0 : yMM;

    const endYMM =
      index === coursePositionsMM.length - 1
        ? facet.heightMM
        : coursePositionsMM[index + 1];

    const startWidthMM = widthAtFacetPosition(facet, startYMM);
    const endWidthMM = widthAtFacetPosition(facet, endYMM);
    const requiredWidthMM = Math.max(startWidthMM, endWidthMM);

    const slateQuantity = Math.ceil(
      requiredWidthMM / product.effectiveSlateWidthMM
    );

    return {
      index: index + 1,
      kind:
        index === coursePositionsMM.length - 1
          ? "cutFinalCourse"
          : "standardCourse",
      yMM,
      startYMM,
      endYMM,
      startWidthMM: round(startWidthMM, 3),
      endWidthMM: round(endWidthMM, 3),
      requiredWidthMM: round(requiredWidthMM, 3),
      slateQuantity,
    };
  });

  const standardSlateQuantity = courses.reduce(
  (total, course) =>
    total + course.slateQuantity,
  0
);

// Timberlite installs the first slate row twice.
const starterSlateQuantity = Math.ceil(
  facet.baseWidthMM /
    product.effectiveSlateWidthMM
);

// A horizontal ridge needs a separate short finishing course for practical
// appearance and fitting, even when the ordinary gauge covers the remaining
// geometric height on paper.
const ridgeFinishingSlateQuantity =
  hasRidgeFinishingCourse
    ? Math.ceil(
        facet.topWidthMM /
          product.effectiveSlateWidthMM
      )
    : 0;

const grossSlateQuantityRaw =
  standardSlateQuantity +
  starterSlateQuantity +
  ridgeFinishingSlateQuantity;

const openingTileQuantityDeduction =
  calculateOpeningTileDeduction({
    openings: facet.openings,
    product,
    pitchDeg: facet.pitchDeg,
  });

const slateQuantityRaw = round(
  Math.max(
    0,
    grossSlateQuantityRaw -
      openingTileQuantityDeduction
  )
);

const slateQuantityOrdered =
  Math.ceil(slateQuantityRaw);

  warnings.push(
    "Synthetic-slate quantity is calculated by whole slates per course and includes the doubled first row."
  );

  if (hasRidgeFinishingCourse) {
    warnings.push(
      "A separate ridge finishing course and lath have been included; its exact fixing position is set out at the ridge during fitting."
    );
  }

  return {
    pitchRule,
    courses,
    lathRows,
    lathLengthMM: round(lathLengthMM, 3),

    standardSlateQuantityRaw: standardSlateQuantity,
    starterSlateQuantityRaw: starterSlateQuantity,
    ridgeFinishingSlateQuantityRaw:
      ridgeFinishingSlateQuantity,
    hasRidgeFinishingCourse,

    grossSlateQuantityRaw,
openingTileQuantityDeduction,

tileQuantityRaw: slateQuantityRaw,
tileQuantityOrdered: slateQuantityOrdered,

fixingQuantity:
  slateQuantityOrdered *
  product.fixingsPerSlate,
  };
}

export function calculateFacetTiling({
  facet = {},
  product: productOrId,
  setOutPitchDeg,
} = {}) {
  const product = getTileProduct(productOrId);
  if (!product) {
    return {
      errors: ["Choose a recognised tile product."],
      warnings: [],
      courses: [],
      lathRows: [],
    };
  }



    const normalizedFacet =
    normalizeFacetTilingInput(facet);

    const requestedSetOutPitchDeg =
  asFiniteNumber(setOutPitchDeg);

if (requestedSetOutPitchDeg > 0) {
  normalizedFacet.setOutPitchDeg =
    requestedSetOutPitchDeg;
}

const { errors, warnings } = validateFacet(
  normalizedFacet,
  product
);

const openingErrors =
  normalizedFacet.openings.flatMap(
    (opening) =>
      opening.errors.map(
        (error) =>
          `${opening.label}: ${error}`
      )
  );

errors.push(...openingErrors);

normalizedFacet.openings.forEach(
  (opening) => {
    if (
      opening.errors.length === 0 &&
      !openingFitsWithinFacet(
        opening,
        normalizedFacet
      )
    ) {
      errors.push(
        `${opening.label} must fit completely within its roof facet.`
      );
    }
  }
);

if (errors.length > 0) {
  return {
    facet: normalizedFacet,
    productId: product.id,
    errors,
    warnings,
    courses: [],
    lathRows: [],
  };
}

  const facetAreaM2 =
    ((normalizedFacet.baseWidthMM + normalizedFacet.topWidthMM) / 2) *
    normalizedFacet.heightMM /
    1_000_000;

      const openingAreaM2 =
    normalizedFacet.openings.reduce(
      (total, opening) =>
        total + opening.areaM2,
      0
    );

  const netFacetAreaM2 =
    Math.max(
      0,
      facetAreaM2 -
      openingAreaM2
    );


  return {
    facet: normalizedFacet,
    productId: product.id,
        /*
     * Keep facetAreaM2 as the gross value for backwards
     * compatibility until opening deductions are enabled.
     */
    facetAreaM2: round(facetAreaM2),

    grossFacetAreaM2:
      round(facetAreaM2),

    openingAreaM2:
      round(openingAreaM2),

    netFacetAreaM2:
      round(netFacetAreaM2),
    errors: [],
    warnings,
        ...(product.strategy === "steelShingleCourses"
      ? calculateSteelShingleFacet(
          normalizedFacet,
          product,
          warnings
        )
      : calculateSyntheticSlateFacet(
          normalizedFacet,
          product,
          warnings
        )),
  };
}

export function calculateRoofTiling({
  facets = [],
  product,
  orderAllowanceTiles: orderAllowanceOverride,
  overallSetOutPitchDeg,
} = {}) {
  const productConfig = getTileProduct(product);

  const facetResults = facets.map((facet) =>
  calculateFacetTiling({
    facet,
    product,
    setOutPitchDeg:
      overallSetOutPitchDeg,
  })
);

  const errors = facetResults.flatMap(
    (result) => result.errors || []
  );

  const warnings = [
    ...new Set(
      facetResults.flatMap((result) => result.warnings || [])
    ),
  ];

  const tileQuantityRaw = round(
    facetResults.reduce(
      (total, result) => total + (result.tileQuantityRaw || 0),
      0
    )
  );

  const tileQuantityRounded = Math.ceil(tileQuantityRaw);

  const defaultOrderAllowance =
    productConfig?.strategy === "steelShingleCourses"
      ? productConfig.defaultOrderAllowanceTiles || 0
      : 0;

  const parsedOrderAllowance = Number(orderAllowanceOverride);

  const orderAllowanceTiles =
    productConfig?.strategy === "steelShingleCourses" &&
    Number.isFinite(parsedOrderAllowance) &&
    parsedOrderAllowance >= 0
      ? Math.floor(parsedOrderAllowance)
      : defaultOrderAllowance;

  const tileQuantityOrdered =
    tileQuantityRounded + orderAllowanceTiles;

  const fixingsPerUnit =
    productConfig?.fixingsPerTile ??
    productConfig?.fixingsPerSlate ??
    0;
const grossFacetAreaM2 = round(
  facetResults.reduce(
    (total, result) =>
      total +
      (
        result.grossFacetAreaM2 ??
        result.facetAreaM2 ??
        0
      ),
    0
  )
);

const openingAreaM2 = round(
  facetResults.reduce(
    (total, result) =>
      total +
      (result.openingAreaM2 || 0),
    0
  )
);

const netFacetAreaM2 = round(
  Math.max(
    0,
    grossFacetAreaM2 - openingAreaM2
  )
);

  return {
    productId: productConfig?.id ?? null,
    facets: facetResults,

    // Retained as the gross roof area for compatibility.
facetAreaM2: grossFacetAreaM2,
grossFacetAreaM2,
openingAreaM2,
netFacetAreaM2,

    lathLengthMM: round(
      facetResults.reduce(
        (total, result) => total + (result.lathLengthMM || 0),
        0
      ),
      3
    ),

    tileQuantityRaw,
    tileQuantityRounded,
    orderAllowanceTiles,
    tileQuantityOrdered,
    fixingQuantity: tileQuantityOrdered * fixingsPerUnit,

    errors,
    warnings,
  };
}
