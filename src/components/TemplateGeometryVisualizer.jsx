import React, { useMemo, useState } from "react";

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (safeNumber(degrees) * Math.PI) / 180;

/**
 * Finds the intersection of two infinite lines.
 *
 * Each line is represented by two points:
 * p1 -> p2
 * p3 -> p4
 */
const findLineIntersection = (
  p1,
  p2,
  p3,
  p4
) => {
  const denominator =
    (p1.x - p2.x) * (p3.y - p4.y) -
    (p1.y - p2.y) * (p3.x - p4.x);

  if (Math.abs(denominator) < 0.000001) {
    return null;
  }

  const determinant1 =
    p1.x * p2.y - p1.y * p2.x;

  const determinant2 =
    p3.x * p4.y - p3.y * p4.x;

  return {
    x:
      (determinant1 * (p3.x - p4.x) -
        (p1.x - p2.x) * determinant2) /
      denominator,

    y:
      (determinant1 * (p3.y - p4.y) -
        (p1.y - p2.y) * determinant2) /
      denominator,
  };
};

function DimensionLine({
  x1,
  x2,
  y,
  extensionTopY,
  label,
  colour = "#334155",
}) {
  const centreX = (x1 + x2) / 2;

  return (
    <>
      <line
        x1={x1}
        y1={extensionTopY}
        x2={x1}
        y2={y + 7}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x2}
        y1={extensionTopY}
        x2={x2}
        y2={y + 7}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke={colour}
        strokeWidth="2"
        markerStart="url(#template-arrow)"
        markerEnd="url(#template-arrow)"
      />

      <text
        x={centreX}
        y={y + 22}
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill={colour}
      >
        {label}
      </text>
    </>
  );
}

export default function TemplateGeometryVisualizer({
  frontTemplate,
  sideTemplate,

  matchedSideSoffitMM = 0,
  mitreTrimAllowanceMM = 0,
  manufacturedSideSoffitMM = 0,
}) {

  const [sideShiftMM, setSideShiftMM] = useState(0);
  const drawing = useMemo(() => {
    if (!frontTemplate || !sideTemplate) {
      return null;
    }

    const frontPitchDeg = safeNumber(
      frontTemplate.pitchDeg
    );

    const sidePitchDeg = safeNumber(
      sideTemplate.pitchDeg
    );

    const frontFootRunMM = safeNumber(
      frontTemplate.horizontalFootRunMM
    );

    const sideFootRunMM = safeNumber(
      sideTemplate.horizontalFootRunMM
    );

    const frontPlumbCutMM = safeNumber(
      frontTemplate.plumbCutHeightMM
    );

    const sidePlumbCutMM = safeNumber(
      sideTemplate.plumbCutHeightMM
    );

    const frontPitchRad = degToRad(frontPitchDeg);
    const sidePitchRad = degToRad(sidePitchDeg);

    /*
     * Both physical templates are aligned here:
     *
     * internal underside corner where the sloping underside
     * meets the horizontal foot cut.
     */
    const origin = {
      x: 310,
      y: 315,
    };

    const scale = 1.18;
    const backRunMM = 520;

    const createTemplate = ({
      pitchRad,
      footRunMM,
      plumbCutMM,
    }) => {
      const lowerBack = {
        x: origin.x - backRunMM * scale,
        y:
          origin.y -
          backRunMM *
            Math.tan(pitchRad) *
            scale,
      };

      const footEnd = {
        x: origin.x + footRunMM * scale,
        y: origin.y,
      };

      const footTop = {
        x: footEnd.x,
        y: origin.y - plumbCutMM * scale,
      };

      const upperBack = {
        x: lowerBack.x,
        y: lowerBack.y - plumbCutMM * scale,
      };

      return {
        lowerBack,
        upperBack,
        footEnd,
        footTop,

        polygonPoints: [
          `${upperBack.x},${upperBack.y}`,
          `${footTop.x},${footTop.y}`,
          `${footEnd.x},${footEnd.y}`,
          `${origin.x},${origin.y}`,
          `${lowerBack.x},${lowerBack.y}`,
        ].join(" "),
      };
    };

    const front = createTemplate({
      pitchRad: frontPitchRad,
      footRunMM: frontFootRunMM,
      plumbCutMM: frontPlumbCutMM,
    });

    const unshiftedSide = createTemplate({
  pitchRad: sidePitchRad,
  footRunMM: sideFootRunMM,
  plumbCutMM: sidePlumbCutMM,
});

const sideShiftDrawingUnits = sideShiftMM * scale;

const shiftPoint = (point) => ({
  x: point.x + sideShiftDrawingUnits,
  y: point.y,
});

const side = {
  lowerBack: shiftPoint(unshiftedSide.lowerBack),
  upperBack: shiftPoint(unshiftedSide.upperBack),
  footEnd: shiftPoint(unshiftedSide.footEnd),
  footTop: shiftPoint(unshiftedSide.footTop),

  polygonPoints: [
    shiftPoint(unshiftedSide.upperBack),
    shiftPoint(unshiftedSide.footTop),
    shiftPoint(unshiftedSide.footEnd),
    {
      x: origin.x + sideShiftDrawingUnits,
      y: origin.y,
    },
    shiftPoint(unshiftedSide.lowerBack),
  ]
    .map((point) => `${point.x},${point.y}`)
    .join(" "),
};

const shiftedSideOrigin = {
  x: origin.x + sideShiftDrawingUnits,
  y: origin.y,
};

    /*
     * The intersection of the two upper edges is useful
     * because it shows the actual overlap wedge generated
     * when the two templates are offered together.
     */
    const upperEdgeIntersection =
      findLineIntersection(
        front.upperBack,
        front.footTop,
        side.upperBack,
        side.footTop
      );

    const graphicalFootDifferenceMM = Math.abs(
      frontFootRunMM - sideFootRunMM
    );

    const roundedGraphicalSoffitMM =
      Math.ceil(graphicalFootDifferenceMM / 5) * 5;

    const solverManufacturedMM = safeNumber(
      manufacturedSideSoffitMM
    );

    return {
    origin,
      shiftedSideOrigin,
      scale,

      front,
      side,

      frontPitchDeg,
      sidePitchDeg,

      frontFootRunMM,
      sideFootRunMM,

      frontPlumbCutMM,
      sidePlumbCutMM,

      upperEdgeIntersection,

      graphicalFootDifferenceMM,
      roundedGraphicalSoffitMM,

      solverManufacturedMM,
      
    };
  }, [
  frontTemplate,
  sideTemplate,
  manufacturedSideSoffitMM,
  sideShiftMM,
]);

  if (!drawing) {
    return null;
  }

  const {
    origin,
    shiftedSideOrigin,

    front,
    side,

    frontPitchDeg,
    sidePitchDeg,

    frontFootRunMM,
    sideFootRunMM,

    frontPlumbCutMM,
    sidePlumbCutMM,

    upperEdgeIntersection,

    graphicalFootDifferenceMM,
    roundedGraphicalSoffitMM,

    solverManufacturedMM,
    solverDifferenceMM,
    closeAgreement,
  } = drawing;

  const shorterFootEndX = Math.min(
    front.footEnd.x,
    side.footEnd.x
  );

  const longerFootEndX = Math.max(
    front.footEnd.x,
    side.footEnd.x
  );

  const overlapPoints = upperEdgeIntersection
    ? [
        `${upperEdgeIntersection.x},${upperEdgeIntersection.y}`,
        `${front.footTop.x},${front.footTop.y}`,
        `${front.footEnd.x},${front.footEnd.y}`,
        `${side.footEnd.x},${side.footEnd.y}`,
        `${side.footTop.x},${side.footTop.y}`,
      ].join(" ")
    : "";

  return (
    <section
      style={{
        marginTop: 16,
        padding: 14,
        border: "2px solid #2563eb",
        borderRadius: 10,
        background: "#eff6ff",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>
        RAFTER TEMPLATE GEOMETRY VISUALISER
      </h3>

      <div
        style={{
          color: "#475569",
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        Both templates are aligned at the internal
        underside/foot-cut corner, matching the factory
        template method.
      </div>

      <svg
        viewBox="0 0 940 520"
        role="img"
        aria-label={`Front rafter at ${frontPitchDeg.toFixed(
          2
        )} degrees and side rafter at ${sidePitchDeg.toFixed(
          2
        )} degrees aligned at their internal foot corners`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
        }}
      >
        <defs>
          <marker
            id="template-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 8 4 L 0 8 z"
              fill="context-stroke"
            />
          </marker>
        </defs>

        {/* Front template */}
        <polygon
          points={front.polygonPoints}
          fill="rgba(37, 99, 235, 0.16)"
          stroke="#2563eb"
          strokeWidth="3"
        />

        {/* Side template */}
        <polygon
          points={side.polygonPoints}
          fill="rgba(220, 38, 38, 0.14)"
          stroke="#dc2626"
          strokeWidth="3"
        />

        {/* Overlap wedge */}
        {upperEdgeIntersection && (
          <polygon
            points={overlapPoints}
            fill="rgba(245, 158, 11, 0.20)"
            stroke="#d97706"
            strokeWidth="2"
            strokeDasharray="7 5"
          />
        )}

        {/* Upper-edge intersection */}
        {upperEdgeIntersection && (
          <>
            <circle
              cx={upperEdgeIntersection.x}
              cy={upperEdgeIntersection.y}
              r="6"
              fill="#d97706"
            />

            <text
              x={upperEdgeIntersection.x}
              y={upperEdgeIntersection.y - 14}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#92400e"
            >
              Upper-edge intersection
            </text>
          </>
        )}

        {/* Shared internal corner */}
        <circle
          cx={origin.x}
          cy={origin.y}
          r="6"
          fill="#111827"
        />

        <text
          x={origin.x - 10}
          y={origin.y + 24}
          textAnchor="end"
          fontSize="13"
          fontWeight="700"
          fill="#111827"
        >
          Shared internal corner
        </text>
        
{/* Movable side-template datum */}
<circle
  cx={shiftedSideOrigin.x}
  cy={shiftedSideOrigin.y}
  r="5"
  fill="#dc2626"
/>

<text
  x={shiftedSideOrigin.x}
  y={shiftedSideOrigin.y + 42}
  textAnchor="middle"
  fontSize="13"
  fontWeight="700"
  fill="#dc2626"
>
  Side-template datum
</text>
        {/* Foot endpoints */}
        <circle
          cx={front.footEnd.x}
          cy={front.footEnd.y}
          r="5"
          fill="#2563eb"
        />

        <text
          x={front.footEnd.x}
          y={front.footEnd.y + 24}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#2563eb"
        >
          Front foot end
        </text>

        <circle
          cx={side.footEnd.x}
          cy={side.footEnd.y}
          r="5"
          fill="#dc2626"
        />

        <text
          x={side.footEnd.x}
          y={side.footEnd.y - 11}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#dc2626"
        >
          Side foot end
        </text>


<text
  x={shiftedSideOrigin.x}
  y={shiftedSideOrigin.y + 42}
  textAnchor="middle"
  fontSize="13"
  fontWeight="700"
  fill="#dc2626"
>
  Side-template datum
</text>

        {/* Individual foot-run dimensions */}
        <DimensionLine
          x1={origin.x}
          x2={front.footEnd.x}
          y={origin.y + 72}
          extensionTopY={origin.y + 5}
          label={`Front foot run: ${frontFootRunMM.toFixed(
            1
          )} mm`}
          colour="#2563eb"
        />

        <DimensionLine
          x1={origin.x}
          x2={side.footEnd.x}
          y={origin.y + 116}
          extensionTopY={origin.y + 5}
          label={`Side foot run: ${sideFootRunMM.toFixed(
            1
          )} mm`}
          colour="#dc2626"
        />

        {/* Difference between endpoints */}
        <DimensionLine
  x1={shorterFootEndX}
  x2={longerFootEndX}
  y={origin.y + 160}
  extensionTopY={origin.y + 5}
  label={`Difference between foot ends: ${graphicalFootDifferenceMM.toFixed(
    1
  )} mm`}
  colour="#334155"
/>

        {/* Legend */}
        <line
          x1="650"
          y1="45"
          x2="695"
          y2="45"
          stroke="#2563eb"
          strokeWidth="4"
        />

        <text
          x="705"
          y="50"
          fontSize="14"
          fill="#1e293b"
        >
          Front template — {frontPitchDeg.toFixed(2)}°
        </text>

        <line
          x1="650"
          y1="75"
          x2="695"
          y2="75"
          stroke="#dc2626"
          strokeWidth="4"
        />

        <text
          x="705"
          y="80"
          fontSize="14"
          fill="#1e293b"
        >
          Side template — {sidePitchDeg.toFixed(2)}°
        </text>

        <line
          x1="650"
          y1="105"
          x2="695"
          y2="105"
          stroke="#d97706"
          strokeWidth="4"
          strokeDasharray="7 5"
        />

        <text
          x="705"
          y="110"
          fontSize="14"
          fill="#1e293b"
        >
          Geometric overlap / mitre region
        </text>
      </svg>

<div
  style={{
    marginTop: 12,
    padding: 12,
    border: "1px solid #94a3b8",
    borderRadius: 8,
    background: "#ffffff",
  }}
>
  <label
    htmlFor="side-template-shift"
    style={{
      display: "block",
      fontWeight: 700,
      marginBottom: 8,
    }}
  >
    Move side template horizontally:{" "}
    {sideShiftMM.toFixed(1)} mm
  </label>

  <input
    id="side-template-shift"
    type="range"
    min="-150"
    max="150"
    step="0.5"
    value={sideShiftMM}
    onChange={(event) =>
      setSideShiftMM(Number(event.target.value))
    }
    style={{ width: "100%" }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: 4,
      fontSize: 12,
      color: "#475569",
    }}
  >
    <span>−150 mm</span>
    <span>Aligned at zero</span>
    <span>+150 mm</span>
  </div>

  <button
    type="button"
    onClick={() => setSideShiftMM(0)}
    style={{
      marginTop: 10,
      padding: "6px 12px",
      border: "1px solid #64748b",
      borderRadius: 6,
      background: "#ffffff",
      cursor: "pointer",
    }}
  >
    Reset alignment
  </button>
</div>

<div
  style={{
    marginTop: 12,
    display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 10,
          fontSize: 13,
        }}
      >
        <div
          style={{
            padding: 10,
            border: "1px solid #93c5fd",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Front template</b>

          <div>
            Pitch: {frontPitchDeg.toFixed(2)}°
          </div>

          <div>
            Foot run: {frontFootRunMM.toFixed(1)} mm
          </div>

          <div>
            Plumb cut:{" "}
            {frontPlumbCutMM.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #fca5a5",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Side template</b>

          <div>
            Pitch: {sidePitchDeg.toFixed(2)}°
          </div>

          <div>
            Foot run: {sideFootRunMM.toFixed(1)} mm
          </div>

          <div>
            Plumb cut:{" "}
            {sidePlumbCutMM.toFixed(1)} mm
          </div>
        </div>

        <div
  style={{
    padding: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
  }}
>
  <b>Profile comparison</b>

  <div>
    Front total foot run:{" "}
    {frontFootRunMM.toFixed(1)} mm
  </div>

  <div>
    Side total foot run:{" "}
    {sideFootRunMM.toFixed(1)} mm
  </div>

  <div>
    Difference between foot ends:{" "}
    {graphicalFootDifferenceMM.toFixed(1)} mm
  </div>
</div>

        <div
  style={{
    padding: 10,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
  }}
>
  <b>Side-soffit solver</b>

  <div>
    Matched side soffit:{" "}
    {safeNumber(
      matchedSideSoffitMM
    ).toFixed(1)}{" "}
    mm
  </div>

  <div>
    Mitre allowance:{" "}
    {safeNumber(
      mitreTrimAllowanceMM
    ).toFixed(1)}{" "}
    mm
  </div>

  <div>
    Raw manufactured soffit:{" "}
    {(
      safeNumber(matchedSideSoffitMM) +
      safeNumber(mitreTrimAllowanceMM)
    ).toFixed(1)}{" "}
    mm
  </div>

  <div>
    Rounded manufacturing cut:{" "}
    {solverManufacturedMM.toFixed(1)} mm
  </div>
</div>
      </div>

      <div
  style={{
    marginTop: 12,
    padding: 11,
    borderLeft: "4px solid #2563eb",
    background: "#ffffff",
    fontSize: 13,
  }}
>
  <strong>
    These values describe different physical dimensions.
  </strong>

  <div style={{ marginTop: 4 }}>
    The drawing shows a{" "}
    <b>
      {graphicalFootDifferenceMM.toFixed(1)} mm
    </b>{" "}
    difference between the two complete foot-run endpoints.
    The side-soffit solver separately calculates a{" "}
    <b>{solverManufacturedMM.toFixed(1)} mm</b>{" "}
    manufacturing cut from the matched soffit and mitre
    allowance.
  </div>
</div>
    </section>
  );
}