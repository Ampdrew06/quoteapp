// src/lib/Manufacturing/roofPlanBuilder.js

const finiteNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalisePoint = (point = {}) => ({
  xMM: finiteNumber(point.xMM),
  yMM: finiteNumber(point.yMM),
});

const normaliseLine = (line = {}, index = 0) => ({
  id: line.id || `line-${index}`,

  type: line.type || "structural",

  start: normalisePoint(line.start),
  end: normalisePoint(line.end),

  role: line.role || null,
  facetId: line.facetId || null,

  label: line.label || "",
  positionMM:
    line.positionMM == null
      ? null
      : finiteNumber(line.positionMM),

  metadata: line.metadata || {},
});

const normaliseDimension = (
  dimension = {},
  index = 0
) => ({
  id: dimension.id || `dimension-${index}`,

  type:
  dimension.type === "vertical"
    ? "vertical"
    : dimension.type === "spacing"
    ? "spacing"
    : "horizontal",

  start: normalisePoint(dimension.start),
  end: normalisePoint(dimension.end),

  valueMM: finiteNumber(dimension.valueMM),

  label: dimension.label || "",

  datum: dimension.datum || null,

  metadata: dimension.metadata || {},
});

const normalisePitchLabel = (
  pitch = {},
  index = 0
) => ({
  id: pitch.id || `pitch-${index}`,

  facetId: pitch.facetId || null,

  position: normalisePoint(pitch.position),

  valueDeg: finiteNumber(pitch.valueDeg),

  label: pitch.label || "",

  metadata: pitch.metadata || {},
});

const normaliseMarker = (
  marker = {},
  index = 0
) => ({
  id: marker.id || `marker-${index}`,

  type: marker.type || "point",

  position: normalisePoint(marker.position),

  label: marker.label || "",

  metadata: marker.metadata || {},
});

/**
 * buildRoofPlan
 *
 * Creates a roof-style-independent plan model.
 *
 * IMPORTANT:
 *
 * This function does NOT calculate roof geometry.
 *
 * It receives geometry which has already been resolved by
 * the appropriate geometry/manufacturing builders and puts
 * it into one standard structure for drawing.
 *
 * The resulting model can be consumed by:
 *
 * - customer quotation CAD
 * - manufacture CAD
 * - future snap-grid / freehand roofs
 * - print/export systems
 */
export function buildRoofPlan({
  internalOutline = [],
  externalOutline = [],

  structuralLines = [],

  markers = [],

  dimensions = [],

  pitchLabels = [],

  facets = [],

  manufacturingSequence = null,

  metadata = {},
} = {}) {

  const resolvedInternalOutline =
    Array.isArray(internalOutline)
      ? internalOutline.map(normalisePoint)
      : [];

  const resolvedExternalOutline =
    Array.isArray(externalOutline)
      ? externalOutline.map(normalisePoint)
      : [];

  const resolvedStructuralLines =
    Array.isArray(structuralLines)
      ? structuralLines.map(normaliseLine)
      : [];

  const resolvedMarkers =
    Array.isArray(markers)
      ? markers.map(normaliseMarker)
      : [];

  const resolvedDimensions =
    Array.isArray(dimensions)
      ? dimensions.map(normaliseDimension)
      : [];

  const resolvedPitchLabels =
    Array.isArray(pitchLabels)
      ? pitchLabels.map(normalisePitchLabel)
      : [];

  const resolvedFacets =
    Array.isArray(facets)
      ? facets.map((facet, index) => ({
          id:
            facet?.id ||
            `facet-${index}`,

          label:
            facet?.label || "",

          outline:
            Array.isArray(facet?.outline)
              ? facet.outline.map(normalisePoint)
              : [],

          pitchDeg:
            finiteNumber(facet?.pitchDeg),

          metadata:
            facet?.metadata || {},
        }))
      : [];

  return {
    version: 1,

    internalOutline:
      resolvedInternalOutline,

    externalOutline:
      resolvedExternalOutline,

    structuralLines:
      resolvedStructuralLines,

    markers:
      resolvedMarkers,

    dimensions:
      resolvedDimensions,

    pitchLabels:
      resolvedPitchLabels,

    facets:
      resolvedFacets,

      manufacturingSequence,

    metadata: {
      ...metadata,
    },
  };
}