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
  const pitchDeg = asFiniteNumber(facet?.pitchDeg);

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
  const lathRows = lathPositionsMM.map((yMM, index) => ({
    index: index + 1,
    kind: index === 0 ? "chamferedPerimeter" : "tileFixing",
    yMM,
    widthMM: round(widthAtFacetPosition(facet, yMM), 3),
  }));

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

  const lathLengthMM = lathRows.reduce((total, row) => total + row.widthMM, 0);
  const tileQuantityRaw = courses.reduce(
    (total, course) => total + course.tileCountRaw,
    0
  );
  const tileQuantityOrdered = Math.ceil(tileQuantityRaw);

  warnings.push(
    "Steel-shingle order rounding and wastage are provisional: tiles currently round up once per facet."
  );

  return {
    courses,
    lathRows,
    lathLengthMM: round(lathLengthMM, 3),
    tileQuantityRaw: round(tileQuantityRaw),
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
  const pitchRule = getSlatePitchRule(product, facet.pitchDeg);

  const lathPositionsMM = buildSyntheticSlatePositions(
    facet.heightMM,
    product,
    pitchRule.gaugeMM
  );

  const lathRows = lathPositionsMM.map((yMM, index) => ({
    index: index + 1,
    kind:
      yMM === product.perimeterLathPositionMM
        ? "chamferedPerimeter"
        : product.eavesSupportLathPositionsMM.includes(yMM)
          ? "eavesSupport"
          : "slateCourse",
    yMM,
    widthMM: round(widthAtFacetPosition(facet, yMM), 3),
  }));

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
    (total, course) => total + course.slateQuantity,
    0
  );

  // Timberlite installs the first slate row twice.
  const starterSlateQuantity = Math.ceil(
    facet.baseWidthMM / product.effectiveSlateWidthMM
  );

  const slateQuantityRaw =
    standardSlateQuantity + starterSlateQuantity;

  warnings.push(
    "Synthetic-slate quantity is calculated by whole slates per course and includes the doubled first row."
  );

  return {
    pitchRule,
    courses,
    lathRows,
    lathLengthMM: round(lathLengthMM, 3),

    standardSlateQuantityRaw: standardSlateQuantity,
    starterSlateQuantityRaw: starterSlateQuantity,

    tileQuantityRaw: slateQuantityRaw,
    tileQuantityOrdered: slateQuantityRaw,
    fixingQuantity:
      slateQuantityRaw * product.fixingsPerSlate,
  };
}

export function calculateFacetTiling({ facet = {}, product: productOrId } = {}) {
  const product = getTileProduct(productOrId);
  if (!product) {
    return {
      errors: ["Choose a recognised tile product."],
      warnings: [],
      courses: [],
      lathRows: [],
    };
  }

  const normalizedFacet = {
    id: facet.id ?? null,
    label: facet.label || "Facet",
    baseWidthMM: asFiniteNumber(facet.baseWidthMM),
    topWidthMM: asFiniteNumber(facet.topWidthMM),
    heightMM: asFiniteNumber(facet.heightMM),
    pitchDeg: asFiniteNumber(facet.pitchDeg),
  };
  const { errors, warnings } = validateFacet(normalizedFacet, product);

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


  return {
    facet: normalizedFacet,
    productId: product.id,
    facetAreaM2: round(facetAreaM2),
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
} = {}) {
  const productConfig = getTileProduct(product);

  const facetResults = facets.map((facet) =>
    calculateFacetTiling({ facet, product })
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

  return {
    productId: productConfig?.id ?? null,
    facets: facetResults,

    facetAreaM2: round(
      facetResults.reduce(
        (total, result) => total + (result.facetAreaM2 || 0),
        0
      )
    ),

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