// src/components/RoofPlanDiagram.jsx

import React from "react";

const roundMM = (value) =>
  Math.round(Number(value) || 0);

const formatDeg = (value) =>
  `${Number(value || 0).toFixed(1)}°`;

const boxesOverlap = (a, b, padding = 4) => {
  return !(
    a.right + padding < b.left ||
    a.left - padding > b.right ||
    a.bottom + padding < b.top ||
    a.top - padding > b.bottom
  );
};

const makeTextBox = ({
  x,
  y,
  text,
  fontSize = 12,
}) => {
  const estimatedWidth =
    String(text || "").length *
    fontSize *
    0.62;

  const estimatedHeight =
    fontSize * 1.2;

  return {
    left: x - estimatedWidth / 2,
    right: x + estimatedWidth / 2,
    top: y - estimatedHeight / 2,
    bottom: y + estimatedHeight / 2,
  };
};
const distancePointToSegment = (
  px,
  py,
  x1,
  y1,
  x2,
  y2
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(
      px - x1,
      py - y1
    );
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      (
        (px - x1) * dx +
        (py - y1) * dy
      ) /
        (dx * dx + dy * dy)
    )
  );

  const nearestX =
    x1 + t * dx;

  const nearestY =
    y1 + t * dy;

  return Math.hypot(
    px - nearestX,
    py - nearestY
  );
};
export default function RoofPlanDiagram({
  model,
  mode = "manufacture",
  largePrint = false,
}) {
  if (!model) {
    return null;
  }

  const internalOutline =
    model.internalOutline ?? [];

    const externalOutline =
  model.externalOutline ?? [];

  const structuralLines =
    model.structuralLines ?? [];

  const markers =
    model.markers ?? [];

  const dimensions =
    model.dimensions ?? [];

  const pitchLabels =
    model.pitchLabels ?? [];

    const manufacturingSequence =
  model.manufacturingSequence ?? null;

const memberById =
  manufacturingSequence?.memberById ?? {};

const slabSequence =
  manufacturingSequence?.slabs ?? [];

  /*
   * Work out the drawing bounds from the data supplied
   * by the roof-plan model.
   *
   * This is drawing/layout logic only.
   * It does NOT calculate roof geometry.
   */
  const allPoints = [
  ...internalOutline,
  ...externalOutline,

    ...structuralLines.flatMap((line) => [
      line.start,
      line.end,
    ]),

    ...markers.map((marker) =>
      marker.position
    ),
  ].filter(Boolean);

  if (allPoints.length === 0) {
    return null;
  }

  const xValues = allPoints.map(
    (point) => Number(point.xMM) || 0
  );

  const yValues = allPoints.map(
    (point) => Number(point.yMM) || 0
  );

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const roofWidthMM =
    Math.max(1, maxX - minX);

  const roofHeightMM =
    Math.max(1, maxY - minY);

  /*
   * SVG drawing area.
   *
   * The roof is scaled to fit this area while preserving
   * its real plan proportions.
   */
  const svgWidth = 1000;
  const svgHeight = largePrint
    ? Math.min(1160, Math.max(700, roofHeightMM * (744 / roofWidthMM) + 354))
    : 620;
  const fonts = largePrint
    ? { member: 20, position: 22, spacing: 19, marker: 20, hipPitch: 22, pitch: 24, dimension: 22 }
    : { member: 12, position: 14, spacing: 11, marker: 13, hipPitch: 14, pitch: 16, dimension: 15 };

  const marginLeft = largePrint ? 128 : 120;
  const marginRight = largePrint ? 128 : 120;
  const marginTop = largePrint ? 130 : 90;
  const marginBottom = largePrint ? 224 : 120;

  const drawingWidth =
    svgWidth - marginLeft - marginRight;

  const drawingHeight =
    svgHeight - marginTop - marginBottom;

  const scale = Math.min(
    drawingWidth / roofWidthMM,
    drawingHeight / roofHeightMM
  );

  const renderedRoofWidth =
    roofWidthMM * scale;

  const renderedRoofHeight =
    roofHeightMM * scale;

  const offsetX =
    marginLeft +
    (drawingWidth - renderedRoofWidth) / 2;

  const offsetY =
    marginTop +
    (drawingHeight - renderedRoofHeight) / 2;

  /*
   * Convert real millimetre coordinates into SVG
   * coordinates.
   *
   * The generic roof model uses:
   *
   *   x = left → right
   *   y = back → front
   *
   * SVG also increases y downwards, so no roof-specific
   * transformation is required here.
   */
  const pointToSvg = (point) => ({
    x:
      offsetX +
      ((Number(point?.xMM) || 0) - minX) *
        scale,

    y:
      offsetY +
      ((Number(point?.yMM) || 0) - minY) *
        scale,
  });

  const occupiedAnnotationBoxes = [];

/*
 * Pitch labels are high-priority annotations.
 * Slab references may move around them.
 */
pitchLabels.forEach((pitch) => {
  const point =
    pointToSvg(pitch.position);

  const text =
    formatDeg(pitch.valueDeg);

  occupiedAnnotationBoxes.push(
    makeTextBox({
      x: point.x,
      y: point.y,
      text,
      fontSize:
        pitch.metadata?.kind === "hip"
          ? fonts.hipPitch
          : fonts.pitch,
    })
  );
});

/*
 * R-series member references are also treated
 * as high-priority.
 */
const memberLabelPositions = {};
structuralLines.forEach((line) => {
  const manufactureRef = memberById?.[line.id]?.manufactureRef;
  if (!manufactureRef) return;
  const start = pointToSvg(line.start), end = pointToSvg(line.end);
  const sideInset = largePrint && line.type === "ring-beam" && Math.abs(start.x - end.x) < 0.01
    ? (line.metadata?.side === "right" ? -32 : 32) : 0;
  const baseX = (start.x + end.x) / 2 + sideInset;
  const baseY = (start.y + end.y) / 2 - 10;
  const candidates = largePrint
    ? [0, -28, 28, -48, 48].map(dy => ({ x: baseX, y: baseY + dy }))
    : [{ x: baseX, y: baseY }];
  let chosen = candidates[0];
  for (const candidate of candidates) {
    const box = makeTextBox({ ...candidate, text: manufactureRef, fontSize: fonts.member });
    if (!occupiedAnnotationBoxes.some(occupied => boxesOverlap(box, occupied, 5))) {
      chosen = candidate; break;
    }
  }
  memberLabelPositions[line.id] = chosen;
  occupiedAnnotationBoxes.push(makeTextBox({ ...chosen, text: manufactureRef, fontSize: fonts.member }));
});

const resolveSlabLabelPosition = (
  slab,
  previouslyPlacedSlabBoxes = []
) => {
  const base =
    pointToSvg(slab.position);

  /*
   * Small candidate movements around the
   * preferred slab-centre position.
   *
   * Completely roof-style independent.
   */
  const candidates = [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 18 },
    { dx: 0, dy: -18 },
    { dx: 20, dy: 0 },
    { dx: -20, dy: 0 },
    { dx: 20, dy: 18 },
    { dx: -20, dy: 18 },
    { dx: 20, dy: -18 },
    { dx: -20, dy: -18 },
    { dx: 0, dy: 30 },
    { dx: 0, dy: -30 },
  ];

  const allOccupied = [
    ...occupiedAnnotationBoxes,
    ...previouslyPlacedSlabBoxes,
  ];

  for (const candidate of candidates) {
    const x =
      base.x + candidate.dx;

    const y =
      base.y + candidate.dy;

    const box =
      makeTextBox({
        x,
        y,
        text: slab.slabRef,
        fontSize: fonts.member,
      });

    const collidesWithLabel =
  allOccupied.some((occupied) =>
    boxesOverlap(
      box,
      occupied,
      5
    )
  );

/*
 * Slab references should also avoid actual roof
 * members. This is generic renderer behaviour:
 * it does not matter whether the line represents
 * a rafter, hip, wallbar etc.
 */
const tooCloseToStructuralLine =
  structuralLines.some((line) => {
    const lineStart =
      pointToSvg(line.start);

    const lineEnd =
      pointToSvg(line.end);

    const distance =
      distancePointToSegment(
        x,
        y,
        lineStart.x,
        lineStart.y,
        lineEnd.x,
        lineEnd.y
      );

    return distance < 18;
  });

if (
  !collidesWithLabel &&
  !tooCloseToStructuralLine
) {
  return {
    x,
    y,
    box,
  };
}
  }

  /*
   * If every nearby candidate is occupied,
   * retain the original position rather than
   * moving the label somewhere misleading.
   */
  const box =
    makeTextBox({
      x: base.x,
      y: base.y,
      text: slab.slabRef,
      fontSize: fonts.member,
    });

  return {
    x: base.x,
    y: base.y,
    box,
  };
};

  const outlinePoints =
    internalOutline
      .map((point) => {
        const p = pointToSvg(point);
        return `${p.x},${p.y}`;
      })
      .join(" ");

   const externalOutlinePoints =
  externalOutline
    .map((point) => {
      const p = pointToSvg(point);
      return `${p.x},${p.y}`;
    })
    .join(" ");   

  const getStructuralStyle = (line) => {
    switch (line.type) {
      case "hip":
        return {
          stroke: "#111827",
          strokeWidth: 5,
        };

      case "boss-rafter":
        return {
          stroke: "#2563eb",
          strokeWidth: 6,
        };

      case "jack-rafter":
        return {
          stroke: "#2563eb",
          strokeWidth: 4,
        };

      case "rafter":
        return {
          stroke: "#2563eb",
          strokeWidth: 4,
        };

        case "side-jack-rafter":
  return {
    stroke: "#2563eb",
    strokeWidth: 4,
  };
case "wallbar":
case "wallplate":
case "ring-beam":
  return {
    stroke: "transparent",
    strokeWidth: 0,
  };
      default:
        return {
          stroke: "#374151",
          strokeWidth: 3,
        };
    }
  };

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          width: "100%",
          maxWidth: 1100,
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Roof plan diagram"
      >

        {/* ============================================
    EXTERNAL ROOF OUTLINE
============================================ */}

{externalOutlinePoints && (
  <polygon
    points={externalOutlinePoints}
    fill="none"
    stroke="#9ca3af"
    strokeWidth="3"
  />
)}

        {/* ============================================
            INTERNAL ROOF OUTLINE
        ============================================ */}

        {outlinePoints && (
          <polygon
            points={outlinePoints}
            fill="#f8fafc"
            stroke="#111827"
            strokeWidth="5"
          />
        )}

        {/* ============================================
            STRUCTURAL LINES
        ============================================ */}

        {structuralLines.map((line) => {
          const start =
            pointToSvg(line.start);

          const end =
            pointToSvg(line.end);

          const style =
            getStructuralStyle(line);

            const manufactureRef =
  memberById?.[line.id]?.manufactureRef ?? null;

          return (
            <g key={line.id}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={style.stroke}
                strokeWidth={
                  style.strokeWidth
                }
                strokeLinecap="round"
              />
{/* ============================================
    MANUFACTURING MEMBER REFERENCES
============================================ */}

{mode === "manufacture" &&
  manufactureRef && (
    <text
      x={memberLabelPositions[line.id]?.x ?? (start.x + end.x) / 2}
      y={memberLabelPositions[line.id]?.y ?? (start.y + end.y) / 2 - 10}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fonts.member}
      fontWeight="700"
      fill="#1d4ed8"
    >
      {manufactureRef}
    </text>
  )}

              {mode === "manufacture" &&
  line.positionMM != null && (() => {
    const isSideJack =
      line.type === "side-jack-rafter";

    if (isSideJack) {
      const side =
        line.metadata?.side;

      const labelX =
        side === "left"
          ? Math.min(start.x, end.x) - 14
          : Math.max(start.x, end.x) + 14;

      const labelY =
        (start.y + end.y) / 2;

      return (
        <text
          x={labelX}
          y={labelY}
          textAnchor={
            side === "left"
              ? "end"
              : "start"
          }
          dominantBaseline="middle"
          fontSize={fonts.position}
          fontWeight="700"
          fill="#111827"
        >
          {roundMM(line.positionMM)}
        </text>
      );
    }

    return (
      <text
        x={(start.x + end.x) / 2}
        y={
          Math.max(start.y, end.y) + 22
        }
        textAnchor="middle"
        fontSize={fonts.position}
        fontWeight="700"
        fill="#111827"
      >
        {roundMM(line.positionMM)}
      </text>
    );
  })()}
            </g>
          );
        })}

{/* ============================================
    INSULATION SLAB REFERENCES
============================================ */}

{mode === "manufacture" && (() => {
  const placedSlabBoxes = [];

  return slabSequence.map((slab) => {
    const resolved =
      resolveSlabLabelPosition(
        slab,
        placedSlabBoxes
      );

    placedSlabBoxes.push(
      resolved.box
    );

    return (
      <text
        key={slab.id}
        x={resolved.x}
        y={resolved.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fonts.member}
        fontWeight="600"
        fill="#111827"
      >
        {slab.slabRef}
      </text>
    );
  });
})()}

        {/* ============================================
            BOSS / POINT MARKERS
        ============================================ */}

        {markers.map((marker) => {
          const point =
            pointToSvg(marker.position);

          return (
            <g key={marker.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="#111827"
              />

              {mode === "manufacture" &&
                marker.label && (
                  <text
                    x={point.x}
                    y={point.y - 14}
                    textAnchor="middle"
                    fontSize={fonts.marker}
                    fontWeight="700"
                    fill="#111827"
                  >
                    {marker.label}
                  </text>
                )}
            </g>
          );
        })}

        {/* ============================================
            PITCH LABELS
        ============================================ */}

        {pitchLabels.map((pitch) => {
          const point =
            pointToSvg(pitch.position);

            const isHipPitch =
  pitch.metadata?.kind === "hip";

          return (
            <text
  key={pitch.id}
  x={point.x}
  y={point.y}
  textAnchor="middle"
  dominantBaseline="middle"
  fontSize={isHipPitch ? fonts.hipPitch : fonts.pitch}
  fontWeight="700"
  fill={isHipPitch ? "#dc2626" : "#059669"}
>
  {formatDeg(pitch.valueDeg)}
</text>
          );
        })}

        {/* ============================================
            DIMENSIONS
        ============================================ */}

        {dimensions.map((dimension) => {
  const start =
    pointToSvg(dimension.start);

  const end =
    pointToSvg(dimension.end);

  const placement =
    dimension.metadata?.placement ||
    (
      dimension.type === "vertical"
        ? "right"
        : "above"
    );


  const level =
    Math.max(
      1,
      Number(
        dimension.metadata?.level ?? 1
      )
    );

  const levelGap = largePrint ? 42 : 34;

  if (dimension.type === "spacing") {
  const axis =
    dimension.metadata?.axis;

  const placement =
    dimension.metadata?.placement;

  /*
   * Vertical side spacing:
   * small/lighter value midway between adjacent
   * side jack-rafter position labels.
   */
  if (axis === "vertical") {
    const y =
      (start.y + end.y) / 2;

    const x =
      placement === "outside-left"
        ? Math.min(start.x, end.x) - 28
        : Math.max(start.x, end.x) + 28;

    return (
      <text
        key={dimension.id}
        x={x}
        y={y}
        textAnchor={
          placement === "outside-left"
            ? "end"
            : "start"
        }
        dominantBaseline="middle"
        fontSize={fonts.spacing}
        fontWeight={largePrint ? "700" : "400"}
        fill="#475569"
      >
        {roundMM(dimension.valueMM)}
      </text>
    );
  }

  /*
   * Horizontal/front spacing:
   * same baseline as front setting-out positions.
   */
  const x =
    (start.x + end.x) / 2;

  const y =
    Math.max(start.y, end.y) + (largePrint ? 54 : 22);

  return (
    <text
      key={dimension.id}
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={fonts.spacing}
      fontWeight={largePrint ? "700" : "400"}
      fill="#475569"
    >
      {roundMM(dimension.valueMM)}
    </text>
  );
}

  /*
   * --------------------------------------------
   * VERTICAL DIMENSIONS
   * --------------------------------------------
   */

  if (dimension.type === "vertical") {
    const baseEdgeX =
      placement === "left"
        ? Math.min(start.x, end.x)
        : Math.max(start.x, end.x);

    const x =
      placement === "left"
        ? baseEdgeX - 55 - (level - 1) * levelGap
        : baseEdgeX + 55 + (level - 1) * levelGap;

    const y1 = start.y;
    const y2 = end.y;

    const labelX =
      placement === "left"
        ? x - 25
        : x + 25;

    return (
      <g key={dimension.id}>
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* top arrow */}
        <line
          x1={x - 7}
          y1={y1 + 10}
          x2={x}
          y2={y1}
          stroke="#374151"
          strokeWidth="2"
        />

        <line
          x1={x + 7}
          y1={y1 + 10}
          x2={x}
          y2={y1}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* bottom arrow */}
        <line
          x1={x - 7}
          y1={y2 - 10}
          x2={x}
          y2={y2}
          stroke="#374151"
          strokeWidth="2"
        />

        <line
          x1={x + 7}
          y1={y2 - 10}
          x2={x}
          y2={y2}
          stroke="#374151"
          strokeWidth="2"
        />

        <text
          x={labelX}
          y={(y1 + y2) / 2}
          textAnchor="middle"
          fontSize={fonts.dimension}
          fontWeight={largePrint ? "600" : "400"}
          fill="#111827"
          transform={`rotate(-90 ${labelX} ${
            (y1 + y2) / 2
          })`}
        >
          {dimension.label}:{" "}
          {roundMM(dimension.valueMM)} mm
        </text>
      </g>
    );
  }

  /*
   * --------------------------------------------
   * HORIZONTAL DIMENSIONS
   * --------------------------------------------
   */

  const baseEdgeY =
    placement === "below"
      ? Math.max(start.y, end.y)
      : Math.min(start.y, end.y);

  const y =
    placement === "below"
      ? baseEdgeY + (largePrint ? 104 : 45) + (level - 1) * levelGap
      : baseEdgeY - 45 - (level - 1) * levelGap;

  const x1 = start.x;
  const x2 = end.x;

  const labelY =
    placement === "below"
      ? y + 24
      : y - 12;

  return (
    <g key={dimension.id}>
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="#374151"
        strokeWidth="2"
      />

      {/* left arrow */}
      <line
        x1={x1 + 10}
        y1={y - 7}
        x2={x1}
        y2={y}
        stroke="#374151"
        strokeWidth="2"
      />

      <line
        x1={x1 + 10}
        y1={y + 7}
        x2={x1}
        y2={y}
        stroke="#374151"
        strokeWidth="2"
      />

      {/* right arrow */}
      <line
        x1={x2 - 10}
        y1={y - 7}
        x2={x2}
        y2={y}
        stroke="#374151"
        strokeWidth="2"
      />

      <line
        x1={x2 - 10}
        y1={y + 7}
        x2={x2}
        y2={y}
        stroke="#374151"
        strokeWidth="2"
      />

      <text
        x={(x1 + x2) / 2}
        y={labelY}
        textAnchor="middle"
        fontSize={fonts.dimension}
        fontWeight={largePrint ? "600" : "400"}
        fill="#111827"
      >
        {dimension.label}:{" "}
        {roundMM(dimension.valueMM)} mm
      </text>
    </g>
  );
})}
      </svg>
    </div>
  );
}