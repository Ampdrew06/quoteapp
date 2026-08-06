import React, { useMemo } from "react";

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (safeNumber(degrees) * Math.PI) / 180;

function HorizontalDimension({
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
        y2={y + 6}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x2}
        y1={extensionTopY}
        x2={x2}
        y2={y + 6}
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
        markerStart="url(#wallplate-arrow)"
        markerEnd="url(#wallplate-arrow)"
      />

      <text
        x={centreX}
        y={y + 21}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill={colour}
      >
        {label}
      </text>
    </>
  );
}

function VerticalDimension({
  x,
  y1,
  y2,
  extensionRightX,
  label,
  colour = "#334155",
}) {
  const centreY = (y1 + y2) / 2;

  return (
    <>
      <line
        x1={x - 6}
        y1={y1}
        x2={extensionRightX}
        y2={y1}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x - 6}
        y1={y2}
        x2={extensionRightX}
        y2={y2}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke={colour}
        strokeWidth="2"
        markerStart="url(#wallplate-arrow)"
        markerEnd="url(#wallplate-arrow)"
      />

      <text
        x={x - 10}
        y={centreY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="700"
        fill={colour}
        transform={`rotate(-90 ${x - 10} ${centreY})`}
      >
        {label}
      </text>
    </>
  );
}

export default function WallplateGeometryVisualizer({
  projectionMM = 0,
  frontPitchDeg = 0,

  designRiseMM = 0,
  frontRafterFaceRiseMM = 0,
  effectivePitchRunMM = 0,

  internalWallplateHeightMM = 0,
  externalWallplateHeightMM = 0,

  wallplateThicknessMM = 63,
  wallplateHeightMM = 220,
  ringBeamHeightMM = 40,
}) {
  const drawing = useMemo(() => {
    const projection = safeNumber(projectionMM);
    const pitch = safeNumber(frontPitchDeg);

    const designRise = safeNumber(designRiseMM);
    const faceRise = safeNumber(frontRafterFaceRiseMM);

    const effectiveRun = safeNumber(
      effectivePitchRunMM,
      Math.max(
        0,
        projection - safeNumber(wallplateThicknessMM, 63)
      )
    );

    const internalWallplateHeight = safeNumber(
      internalWallplateHeightMM
    );

    const externalWallplateHeight = safeNumber(
      externalWallplateHeightMM
    );

    const wallplateThickness = safeNumber(
      wallplateThicknessMM,
      63
    );

    const wallplateHeight = safeNumber(
      wallplateHeightMM,
      220
    );

    const ringBeamHeight = safeNumber(
      ringBeamHeightMM,
      40
    );

    if (
      projection <= 0 ||
      internalWallplateHeight <= 0 ||
      externalWallplateHeight <= 0
    ) {
      return null;
    }

    /*
     * Drawing scale is fitted to the available SVG area.
     * The dimensions displayed remain the real millimetre
     * values supplied by the geometry engine.
     */
    const wallX = 170;
    const frontInternalX = 790;
    const baselineY = 440;

    const horizontalScale =
      (frontInternalX - wallX) / projection;

    const maximumHeight = Math.max(
      externalWallplateHeight,
      internalWallplateHeight,
      designRise + ringBeamHeight + wallplateHeight
    );

    const verticalScale = 300 / maximumHeight;

    const toX = (millimetres) =>
      wallX + millimetres * horizontalScale;

    const toY = (millimetres) =>
      baselineY - millimetres * verticalScale;

    const wallplateInternalFaceX =
      wallX + wallplateThickness * horizontalScale;

    const internalWallplateBottomY =
      toY(internalWallplateHeight);

    const externalWallplateTopY =
      toY(externalWallplateHeight);

    const frontRingBeamTopY =
      toY(ringBeamHeight);

    const frontRingBeamBottomY = baselineY;

    /*
     * Lower rafter edge:
     * front ring-beam top to the internal/bottom wallplate
     * datum.
     */
    const lowerRafterStart = {
      x: wallplateInternalFaceX,
      y: internalWallplateBottomY,
    };

    const lowerRafterEnd = {
      x: frontInternalX,
      y: frontRingBeamTopY,
    };

    /*
     * The displayed rafter depth is represented vertically
     * at the wallplate end. It is diagnostic rather than a
     * manufacturing profile at this stage.
     */
    const upperRafterStart = {
      x: wallX,
      y: externalWallplateTopY,
    };

    const upperRafterEnd = {
      x: frontInternalX,
      y:
        frontRingBeamTopY -
        wallplateHeight * verticalScale,
    };

    const pitchRad = degToRad(pitch);

    const calculatedDesignRise =
      projection * Math.tan(pitchRad);

    const calculatedFaceRise =
      effectiveRun * Math.tan(pitchRad);

    return {
      projection,
      pitch,

      designRise,
      faceRise,
      effectiveRun,

      calculatedDesignRise,
      calculatedFaceRise,

      internalWallplateHeight,
      externalWallplateHeight,

      wallplateThickness,
      wallplateHeight,
      ringBeamHeight,

      wallX,
      frontInternalX,
      baselineY,
      wallplateInternalFaceX,

      internalWallplateBottomY,
      externalWallplateTopY,

      frontRingBeamTopY,
      frontRingBeamBottomY,

      lowerRafterStart,
      lowerRafterEnd,
      upperRafterStart,
      upperRafterEnd,
    };
  }, [
    projectionMM,
    frontPitchDeg,
    designRiseMM,
    frontRafterFaceRiseMM,
    effectivePitchRunMM,
    internalWallplateHeightMM,
    externalWallplateHeightMM,
    wallplateThicknessMM,
    wallplateHeightMM,
    ringBeamHeightMM,
  ]);

  if (!drawing) {
    return null;
  }

  const {
    projection,
    pitch,

    designRise,
    faceRise,
    effectiveRun,

    calculatedDesignRise,
    calculatedFaceRise,

    internalWallplateHeight,
    externalWallplateHeight,

    wallplateThickness,
    wallplateHeight,
    ringBeamHeight,

    wallX,
    frontInternalX,
    baselineY,
    wallplateInternalFaceX,

    internalWallplateBottomY,
    externalWallplateTopY,

    frontRingBeamTopY,
    frontRingBeamBottomY,

    lowerRafterStart,
    lowerRafterEnd,
    upperRafterStart,
    upperRafterEnd,
  } = drawing;

  return (
    <section
      style={{
        marginTop: 16,
        padding: 14,
        border: "2px solid #7c3aed",
        borderRadius: 10,
        background: "#f5f3ff",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>
        WALLPLATE GEOMETRY VISUALISER
      </h3>

      <div
        style={{
          marginBottom: 10,
          color: "#475569",
          fontSize: 13,
        }}
      >
        Side elevation showing the design-rise datum and
        the separate front-rafter wallplate-face datum.
      </div>

      <svg
        viewBox="0 0 940 570"
        role="img"
        aria-label={`Wallplate and front rafter geometry at ${pitch.toFixed(
          2
        )} degrees`}
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
            id="wallplate-arrow"
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

        {/* House wall */}
        <line
          x1={wallX}
          y1="55"
          x2={wallX}
          y2={baselineY + 15}
          stroke="#111827"
          strokeWidth="6"
        />

        <text
          x={wallX - 16}
          y="90"
          textAnchor="end"
          fontSize="14"
          fontWeight="700"
          fill="#111827"
        >
          Wall
        </text>

        {/* Wallplate */}
        <rect
          x={wallX}
          y={externalWallplateTopY}
          width={wallplateInternalFaceX - wallX}
          height={
            internalWallplateBottomY -
            externalWallplateTopY
          }
          fill="rgba(180, 105, 55, 0.55)"
          stroke="#92400e"
          strokeWidth="3"
        />

        <text
          x={(wallX + wallplateInternalFaceX) / 2}
          y={
            (externalWallplateTopY +
              internalWallplateBottomY) /
            2
          }
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="700"
          fill="#78350f"
          transform={`rotate(-90 ${
            (wallX + wallplateInternalFaceX) / 2
          } ${
            (externalWallplateTopY +
              internalWallplateBottomY) /
            2
          })`}
        >
          Wallplate
        </text>

        {/* Front ring beam */}
        <rect
          x={frontInternalX}
          y={frontRingBeamTopY}
          width="95"
          height={
            frontRingBeamBottomY - frontRingBeamTopY
          }
          fill="rgba(100, 116, 139, 0.28)"
          stroke="#475569"
          strokeWidth="3"
        />

        <text
          x={frontInternalX + 48}
          y={frontRingBeamTopY - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#334155"
        >
          Front ring beam
        </text>

        {/* Front rafter */}
        <polygon
          points={[
            `${upperRafterStart.x},${upperRafterStart.y}`,
            `${upperRafterEnd.x},${upperRafterEnd.y}`,
            `${lowerRafterEnd.x},${lowerRafterEnd.y}`,
            `${lowerRafterStart.x},${lowerRafterStart.y}`,
          ].join(" ")}
          fill="rgba(220, 38, 38, 0.18)"
          stroke="#dc2626"
          strokeWidth="3"
        />

        <text
          x="510"
          y="220"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#b91c1c"
        >
          Front rafter — {pitch.toFixed(2)}°
        </text>

        {/* Full design projection datum */}
        <line
          x1={wallX}
          y1={baselineY}
          x2={frontInternalX}
          y2={baselineY}
          stroke="#2563eb"
          strokeWidth="3"
        />

        {/* Effective face-run datum */}
        <line
          x1={wallplateInternalFaceX}
          y1={baselineY - 18}
          x2={frontInternalX}
          y2={baselineY - 18}
          stroke="#d97706"
          strokeWidth="3"
          strokeDasharray="8 5"
        />

        <HorizontalDimension
          x1={wallX}
          x2={frontInternalX}
          y={baselineY + 55}
          extensionTopY={baselineY}
          label={`Full internal projection: ${projection.toFixed(
            0
          )} mm`}
          colour="#2563eb"
        />

        <HorizontalDimension
          x1={wallplateInternalFaceX}
          x2={frontInternalX}
          y={baselineY + 100}
          extensionTopY={baselineY - 18}
          label={`Front-rafter effective run: ${effectiveRun.toFixed(
            0
          )} mm`}
          colour="#d97706"
        />

        <HorizontalDimension
          x1={wallX}
          x2={wallplateInternalFaceX}
          y={baselineY + 145}
          extensionTopY={baselineY}
          label={`Wallplate thickness: ${wallplateThickness.toFixed(
            0
          )} mm`}
          colour="#92400e"
        />

        <VerticalDimension
          x={95}
          y1={internalWallplateBottomY}
          y2={baselineY}
          extensionRightX={wallX}
          label={`Internal WP height: ${internalWallplateHeight.toFixed(
            0
          )} mm`}
          colour="#2563eb"
        />

        <VerticalDimension
          x={45}
          y1={externalWallplateTopY}
          y2={baselineY}
          extensionRightX={wallX}
          label={`External WP height: ${externalWallplateHeight.toFixed(
            0
          )} mm`}
          colour="#7c3aed"
        />

        <VerticalDimension
          x={wallplateInternalFaceX + 45}
          y1={externalWallplateTopY}
          y2={internalWallplateBottomY}
          extensionRightX={wallplateInternalFaceX}
          label={`WP section: ${wallplateHeight.toFixed(
            0
          )} mm`}
          colour="#92400e"
        />

        <VerticalDimension
          x={frontInternalX + 130}
          y1={frontRingBeamTopY}
          y2={frontRingBeamBottomY}
          extensionRightX={frontInternalX + 95}
          label={`Ring beam: ${ringBeamHeight.toFixed(
            0
          )} mm`}
          colour="#475569"
        />

        {/* Datum labels */}
        <circle
          cx={wallX}
          cy={externalWallplateTopY}
          r="5"
          fill="#7c3aed"
        />

        <text
          x={wallX + 12}
          y={externalWallplateTopY - 10}
          fontSize="12"
          fontWeight="700"
          fill="#6d28d9"
        >
          External/top wallplate datum
        </text>

        <circle
          cx={wallplateInternalFaceX}
          cy={internalWallplateBottomY}
          r="5"
          fill="#2563eb"
        />

        <text
          x={wallplateInternalFaceX + 12}
          y={internalWallplateBottomY + 20}
          fontSize="12"
          fontWeight="700"
          fill="#1d4ed8"
        >
          Internal/bottom wallplate datum
        </text>

        <circle
          cx={frontInternalX}
          cy={frontRingBeamTopY}
          r="5"
          fill="#111827"
        />

        <text
          x={frontInternalX - 10}
          y={frontRingBeamTopY + 25}
          textAnchor="end"
          fontSize="12"
          fontWeight="700"
          fill="#111827"
        >
          Internal front datum
        </text>
      </svg>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
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
          <b>Design roof geometry</b>

          <div>
            Projection: {projection.toFixed(0)} mm
          </div>

          <div>Pitch: {pitch.toFixed(2)}°</div>

          <div>
            Calculated rise:{" "}
            {calculatedDesignRise.toFixed(1)} mm
          </div>

          <div>
            Geometry-engine rise:{" "}
            {designRise.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #fbbf24",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Front-rafter face geometry</b>

          <div>
            Effective run: {effectiveRun.toFixed(0)} mm
          </div>

          <div>
            Calculated face rise:{" "}
            {calculatedFaceRise.toFixed(1)} mm
          </div>

          <div>
            Geometry-engine face rise:{" "}
            {faceRise.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #c4b5fd",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Required wallplate</b>

          <div>
            Internal height:{" "}
            {internalWallplateHeight.toFixed(1)} mm
          </div>

          <div>
            External height:{" "}
            {externalWallplateHeight.toFixed(1)} mm
          </div>

          <div>
            Section height:{" "}
            {wallplateHeight.toFixed(1)} mm
          </div>

          <div>
            Section thickness:{" "}
            {wallplateThickness.toFixed(1)} mm
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 11,
          borderLeft: "4px solid #7c3aed",
          background: "#ffffff",
          fontSize: 13,
        }}
      >
        <strong>Two separate datums are displayed.</strong>

        <div style={{ marginTop: 4 }}>
          The full internal projection determines the
          required wallplate height. The shorter
          wallplate-face run is retained separately for the
          physical front-rafter top-cut geometry.
        </div>
      </div>
    </section>
  );
}