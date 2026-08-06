import React, { useMemo } from "react";

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (safeNumber(degrees) * Math.PI) / 180;

const point = (x, y) => ({ x, y });

const svgPoints = (points) =>
  points.map(({ x, y }) => `${x},${y}`).join(" ");

function HorizontalDimension({
  x1,
  x2,
  y,
  extensionFromY,
  label,
  colour = "#334155",
}) {
  return (
    <>
      <line
        x1={x1}
        y1={extensionFromY}
        x2={x1}
        y2={y + 6}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x2}
        y1={extensionFromY}
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
        markerStart="url(#front-wallplate-arrow)"
        markerEnd="url(#front-wallplate-arrow)"
      />

      <text
        x={(x1 + x2) / 2}
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
  extensionToX,
  label,
  colour = "#334155",
}) {
  const centreY = (y1 + y2) / 2;

  return (
    <>
      <line
        x1={x - 5}
        y1={y1}
        x2={extensionToX}
        y2={y1}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x - 5}
        y1={y2}
        x2={extensionToX}
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
        markerStart="url(#front-wallplate-arrow)"
        markerEnd="url(#front-wallplate-arrow)"
      />

      <text
        x={x - 11}
        y={centreY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="700"
        fill={colour}
        transform={`rotate(-90 ${x - 11} ${centreY})`}
      >
        {label}
      </text>
    </>
  );
}

/*
 * Creates the left wall-bar as an actual constant-depth joist.
 *
 * The lower/external edge begins at the outside bottom corner
 * and rises at the supplied side pitch.
 *
 * The upper/internal edge is parallel. Its foot position comes
 * from the supplied horizontal foot cut.
 *
 * Both edges are intersected with the horizontal wallplate's
 * lower and upper datums to create the top mitre.
 */
function calculateLeftWallBar({
  pitchDeg,
  externalHeightMM,
  internalHeightMM,
  externalTopJointXMM,
  internalFootRunMM,
}) {
  const pitchRad = degToRad(pitchDeg);
  const tanPitch = Math.tan(pitchRad);
  const cosPitch = Math.cos(pitchRad);

  if (
    Math.abs(tanPitch) < 0.000001 ||
    Math.abs(cosPitch) < 0.000001
  ) {
    return null;
  }

  /*
   * External edge:
   *
   * y = x × tan(pitch)
   *
   * It finishes at the supplied external/top joint.
   */
  const calculatedExternalJointXMM =
    externalHeightMM / tanPitch;

  /*
   * Preserve the app's hip-position datum as the external
   * top joint. The difference is exposed for diagnosis.
   */
  const externalJointXMM = externalTopJointXMM;

  /*
   * Internal edge begins after the horizontal foot cut.
   *
   * y = (x - footRun) × tan(pitch)
   */
  const internalJointXMM =
    internalFootRunMM +
    internalHeightMM / tanPitch;

  const externalSlopeLengthMM =
    externalHeightMM / Math.sin(pitchRad);

  const internalSlopeLengthMM =
    internalHeightMM / Math.sin(pitchRad);

  const topMitreHorizontalDifferenceMM =
    internalJointXMM - externalJointXMM;

  const footVerticalCutMM =
    internalFootRunMM * tanPitch;

  return {
    pitchDeg,
    pitchRad,

    externalJointXMM,
    internalJointXMM,

    calculatedExternalJointXMM,
    externalJointDatumDifferenceMM:
      externalJointXMM - calculatedExternalJointXMM,

    externalSlopeLengthMM,
    internalSlopeLengthMM,

    internalFootRunMM,
    footVerticalCutMM,

    topMitreHorizontalDifferenceMM,
  };
}

export default function HippedWallplateFrontVisualizer({
  internalWidthMM = 0,

  leftHipPositionMM = 0,
  rightHipPositionMM = 0,

  leftSidePitchDeg = 0,
  rightSidePitchDeg = 0,

  internalWallplateHeightMM = 0,
  externalWallplateHeightMM = 0,

  wallplateSectionHeightMM = 220,

  leftWallBarFootRunMM = 0,
  rightWallBarFootRunMM = 0,

  externalWidthMM = 0,
}) {
  const drawing = useMemo(() => {
    const internalWidth = safeNumber(internalWidthMM);

    const leftHipPosition = safeNumber(
      leftHipPositionMM
    );

    const rightHipPosition = safeNumber(
      rightHipPositionMM
    );

    const leftPitch = safeNumber(leftSidePitchDeg);
    const rightPitch = safeNumber(rightSidePitchDeg);

    const internalHeight = safeNumber(
      internalWallplateHeightMM
    );

    const externalHeight = safeNumber(
      externalWallplateHeightMM
    );

    const sectionHeight = safeNumber(
      wallplateSectionHeightMM,
      220
    );

    const leftFootRun = safeNumber(
      leftWallBarFootRunMM
    );

    const rightFootRun = safeNumber(
      rightWallBarFootRunMM
    );

    const externalWidth = safeNumber(externalWidthMM);

    if (
      internalWidth <= 0 ||
      leftHipPosition <= 0 ||
      rightHipPosition <= 0 ||
      leftPitch <= 0 ||
      rightPitch <= 0 ||
      internalHeight <= 0 ||
      externalHeight <= 0
    ) {
      return null;
    }

    const left = calculateLeftWallBar({
      pitchDeg: leftPitch,
      externalHeightMM: externalHeight,
      internalHeightMM: internalHeight,
      externalTopJointXMM: leftHipPosition,
      internalFootRunMM: leftFootRun,
    });

    /*
     * Calculate the right side by mirroring the left-side
     * coordinate system from the internal right datum.
     */
    const rightLocal = calculateLeftWallBar({
      pitchDeg: rightPitch,
      externalHeightMM: externalHeight,
      internalHeightMM: internalHeight,
      externalTopJointXMM: rightHipPosition,
      internalFootRunMM: rightFootRun,
    });

    if (!left || !rightLocal) {
      return null;
    }

    const leftExternalJointXMM =
      left.externalJointXMM;

    const leftInternalJointXMM =
      left.internalJointXMM;

    const rightExternalJointXMM =
      internalWidth - rightLocal.externalJointXMM;

    const rightInternalJointXMM =
      internalWidth - rightLocal.internalJointXMM;

    const externalCentreLengthMM = Math.max(
      0,
      rightExternalJointXMM -
        leftExternalJointXMM
    );

    const internalCentreLengthMM = Math.max(
      0,
      rightInternalJointXMM -
        leftInternalJointXMM
    );

    /*
     * Drawing coordinates.
     */
    const canvasLeft = 160;
    const canvasRight = 800;
    const floorY = 390;

    const widthScale =
      (canvasRight - canvasLeft) / internalWidth;

    const heightScale =
      235 / Math.max(externalHeight, 1);

    const toX = (millimetres) =>
      canvasLeft + millimetres * widthScale;

    const toY = (millimetres) =>
      floorY - millimetres * heightScale;

    /*
     * Left wall-bar points.
     *
     * A = external foot
     * B = external/top mitre
     * C = internal/bottom mitre
     * D = internal foot
     * E = outer foot endpoint after horizontal cut
     */
    const leftA = point(toX(0), floorY);

    const leftB = point(
      toX(leftExternalJointXMM),
      toY(externalHeight)
    );

    const leftC = point(
      toX(leftInternalJointXMM),
      toY(internalHeight)
    );

    const leftD = point(
      toX(leftFootRun),
      floorY
    );

    /*
     * The foot is shown as:
     *
     * external bottom point -> horizontal foot end ->
     * vertical rise -> internal sloping edge.
     */
    const leftFootTop = point(
      toX(leftFootRun),
      toY(left.footVerticalCutMM)
    );

    /*
     * Right side is mirrored.
     */
    const rightA = point(toX(internalWidth), floorY);

    const rightB = point(
      toX(rightExternalJointXMM),
      toY(externalHeight)
    );

    const rightC = point(
      toX(rightInternalJointXMM),
      toY(internalHeight)
    );

    const rightD = point(
      toX(internalWidth - rightFootRun),
      floorY
    );

    const rightFootTop = point(
      toX(internalWidth - rightFootRun),
      toY(rightLocal.footVerticalCutMM)
    );

    const leftWallBarPoints = svgPoints([
      leftA,
      leftB,
      leftC,
      leftFootTop,
      leftD,
    ]);

    const centreWallplatePoints = svgPoints([
      leftB,
      rightB,
      rightC,
      leftC,
    ]);

    const rightWallBarPoints = svgPoints([
      rightB,
      rightA,
      rightD,
      rightFootTop,
      rightC,
    ]);

    return {
      internalWidth,
      externalWidth,

      leftHipPosition,
      rightHipPosition,

      leftPitch,
      rightPitch,

      internalHeight,
      externalHeight,
      sectionHeight,

      left,
      rightLocal,

      leftExternalJointXMM,
      leftInternalJointXMM,
      rightExternalJointXMM,
      rightInternalJointXMM,

      externalCentreLengthMM,
      internalCentreLengthMM,

      canvasLeft,
      canvasRight,
      floorY,

      leftA,
      leftB,
      leftC,
      leftD,
      leftFootTop,

      rightA,
      rightB,
      rightC,
      rightD,
      rightFootTop,

      leftWallBarPoints,
      centreWallplatePoints,
      rightWallBarPoints,
    };
  }, [
    internalWidthMM,
    leftHipPositionMM,
    rightHipPositionMM,
    leftSidePitchDeg,
    rightSidePitchDeg,
    internalWallplateHeightMM,
    externalWallplateHeightMM,
    wallplateSectionHeightMM,
    leftWallBarFootRunMM,
    rightWallBarFootRunMM,
    externalWidthMM,
  ]);

  if (!drawing) {
    return null;
  }

  const {
    internalWidth,
    externalWidth,

    leftHipPosition,
    rightHipPosition,

    leftPitch,
    rightPitch,

    internalHeight,
    externalHeight,
    sectionHeight,

    left,
    rightLocal,

    externalCentreLengthMM,
    internalCentreLengthMM,

    canvasLeft,
    canvasRight,
    floorY,

    leftB,
    leftC,
    rightB,
    rightC,

    leftWallBarPoints,
    centreWallplatePoints,
    rightWallBarPoints,
  } = drawing;

  return (
    <section
      style={{
        marginTop: 16,
        padding: 14,
        border: "2px solid #059669",
        borderRadius: 10,
        background: "#ecfdf5",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>
        HIPPED WALLPLATE — FRONT ELEVATION
      </h3>

      <div
        style={{
          color: "#475569",
          fontSize: 13,
          marginBottom: 10,
        }}
      >
        Front elevation assembled from two constant-depth
        wall-bars and one horizontal wallplate.
      </div>

      <svg
        viewBox="0 0 940 610"
        role="img"
        aria-label="Front elevation of the three-piece hipped wallplate"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
        }}
      >
        <defs>
          <marker
            id="front-wallplate-arrow"
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

        {/* Floor datum */}
        <line
          x1={canvasLeft - 35}
          y1={floorY}
          x2={canvasRight + 35}
          y2={floorY}
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* Left wall-bar */}
        <polygon
          points={leftWallBarPoints}
          fill="rgba(180, 105, 55, 0.55)"
          stroke="#92400e"
          strokeWidth="3"
        />

        {/* Horizontal wallplate */}
        <polygon
          points={centreWallplatePoints}
          fill="rgba(180, 105, 55, 0.72)"
          stroke="#92400e"
          strokeWidth="3"
        />

        {/* Right wall-bar */}
        <polygon
          points={rightWallBarPoints}
          fill="rgba(180, 105, 55, 0.55)"
          stroke="#92400e"
          strokeWidth="3"
        />

        {/* Mitre lines */}
        <line
          x1={leftB.x}
          y1={leftB.y}
          x2={leftC.x}
          y2={leftC.y}
          stroke="#78350f"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        <line
          x1={rightB.x}
          y1={rightB.y}
          x2={rightC.x}
          y2={rightC.y}
          stroke="#78350f"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Member labels */}
        <text
          x={(canvasLeft + leftB.x) / 2}
          y={(floorY + leftB.y) / 2}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#78350f"
          transform={`rotate(-${leftPitch} ${
            (canvasLeft + leftB.x) / 2
          } ${(floorY + leftB.y) / 2})`}
        >
          Left wall-bar
        </text>

        <text
          x={(leftB.x + rightB.x) / 2}
          y={leftB.y + 30}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#78350f"
        >
          Horizontal wallplate
        </text>

        <text
          x={(canvasRight + rightB.x) / 2}
          y={(floorY + rightB.y) / 2}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#78350f"
          transform={`rotate(${rightPitch} ${
            (canvasRight + rightB.x) / 2
          } ${(floorY + rightB.y) / 2})`}
        >
          Right wall-bar
        </text>

        {/* Joint points */}
        {[leftB, leftC, rightB, rightC].map(
          (joint, index) => (
            <circle
              key={index}
              cx={joint.x}
              cy={joint.y}
              r="5"
              fill="#111827"
            />
          )
        )}

        {/* Overall width */}
        <HorizontalDimension
          x1={canvasLeft}
          x2={canvasRight}
          y={floorY + 58}
          extensionFromY={floorY}
          label={`Internal width: ${internalWidth.toFixed(
            0
          )} mm`}
          colour="#2563eb"
        />

        {/* Hip positions */}
        <HorizontalDimension
          x1={canvasLeft}
          x2={leftB.x}
          y={floorY + 108}
          extensionFromY={floorY}
          label={`Left hip position: ${leftHipPosition.toFixed(
            0
          )} mm`}
          colour="#059669"
        />

        <HorizontalDimension
          x1={rightB.x}
          x2={canvasRight}
          y={floorY + 108}
          extensionFromY={floorY}
          label={`Right hip position: ${rightHipPosition.toFixed(
            0
          )} mm`}
          colour="#059669"
        />

        {/* Centre member lengths */}
        <HorizontalDimension
          x1={leftB.x}
          x2={rightB.x}
          y={leftB.y - 58}
          extensionFromY={leftB.y}
          label={`External centre length: ${externalCentreLengthMM.toFixed(
            0
          )} mm`}
          colour="#92400e"
        />

        <HorizontalDimension
          x1={leftC.x}
          x2={rightC.x}
          y={leftC.y + 56}
          extensionFromY={leftC.y}
          label={`Internal centre length: ${internalCentreLengthMM.toFixed(
            0
          )} mm`}
          colour="#7c3aed"
        />

        {/* Heights */}
        <VerticalDimension
          x={95}
          y1={leftC.y}
          y2={floorY}
          extensionToX={canvasLeft}
          label={`Internal height: ${internalHeight.toFixed(
            0
          )} mm`}
          colour="#2563eb"
        />

        <VerticalDimension
          x={45}
          y1={leftB.y}
          y2={floorY}
          extensionToX={canvasLeft}
          label={`External height: ${externalHeight.toFixed(
            0
          )} mm`}
          colour="#7c3aed"
        />

        {/* Pitches */}
        <text
          x={canvasLeft + 55}
          y={floorY - 18}
          fontSize="13"
          fontWeight="700"
          fill="#b91c1c"
        >
          {leftPitch.toFixed(2)}°
        </text>

        <text
          x={canvasRight - 55}
          y={floorY - 18}
          textAnchor="end"
          fontSize="13"
          fontWeight="700"
          fill="#b91c1c"
        >
          {rightPitch.toFixed(2)}°
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
            border: "1px solid #86efac",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Left wall-bar</b>

          <div>Pitch: {leftPitch.toFixed(2)}°</div>

          <div>
            External slope:{" "}
            {left.externalSlopeLengthMM.toFixed(1)} mm
          </div>

          <div>
            Internal slope:{" "}
            {left.internalSlopeLengthMM.toFixed(1)} mm
          </div>

          <div>
            Horizontal foot cut:{" "}
            {left.internalFootRunMM.toFixed(1)} mm
          </div>

          <div>
            Vertical foot cut:{" "}
            {left.footVerticalCutMM.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #fdba74",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Horizontal wallplate</b>

          <div>
            External length:{" "}
            {externalCentreLengthMM.toFixed(1)} mm
          </div>

          <div>
            Internal length:{" "}
            {internalCentreLengthMM.toFixed(1)} mm
          </div>

          <div>
            Section height: {sectionHeight.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #86efac",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Right wall-bar</b>

          <div>Pitch: {rightPitch.toFixed(2)}°</div>

          <div>
            External slope:{" "}
            {rightLocal.externalSlopeLengthMM.toFixed(
              1
            )}{" "}
            mm
          </div>

          <div>
            Internal slope:{" "}
            {rightLocal.internalSlopeLengthMM.toFixed(
              1
            )}{" "}
            mm
          </div>

          <div>
            Horizontal foot cut:{" "}
            {rightLocal.internalFootRunMM.toFixed(1)} mm
          </div>

          <div>
            Vertical foot cut:{" "}
            {rightLocal.footVerticalCutMM.toFixed(1)} mm
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
          <b>Datum check</b>

          <div>
            Left hip datum difference:{" "}
            {left.externalJointDatumDifferenceMM.toFixed(
              1
            )}{" "}
            mm
          </div>

          <div>
            Right hip datum difference:{" "}
            {rightLocal.externalJointDatumDifferenceMM.toFixed(
              1
            )}{" "}
            mm
          </div>

          <div>
            External roof width:{" "}
            {externalWidth.toFixed(1)} mm
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 11,
          borderLeft: "4px solid #d97706",
          background: "#ffffff",
          fontSize: 13,
        }}
      >
        <strong>
          This version assembles three constant-depth joists.
        </strong>

        <div style={{ marginTop: 4 }}>
          The side wall-bar foot runs must come from the
          validated side-rafter template geometry. The
          resulting mitres and centre-wallplate lengths can
          then be compared with your factory CAD.
        </div>
      </div>
    </section>
  );
}