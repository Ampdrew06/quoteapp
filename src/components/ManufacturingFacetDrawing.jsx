import React from "react";

const finite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const dim = (value, dp = 0) =>
  finite(value).toFixed(dp);

/**
 * ManufacturingFacetDrawing
 *
 * Pure manufacturing drawing component.
 *
 * IMPORTANT:
 * This component does NOT solve Timberlite geometry.
 * All physical dimensions must be supplied by the
 * geometry/manufacturing engine.
 */
export default function ManufacturingFacetDrawing({
  title = "Wallplate Geometry",

  internalWidthMM = 0,
  externalWidthMM = 0,

  leftHipPositionMM = 0,
  rightHipPositionMM = 0,

  externalWallplateLengthMM = 0,
  internalWallplateLengthMM = 0,

  internalWallplateHeightMM = 0,
  externalWallplateHeightMM = 0,

  leftPitchDeg = 0,
  rightPitchDeg = 0,

  leftHFCMM = 0,
  rightHFCMM = 0,

  leftVFCMM = 0,
  rightVFCMM = 0,

  leftEWBSMM = 0,
  rightEWBSMM = 0,

  leftIWBSMM = 0,
  rightIWBSMM = 0,

  leftInternalHorizontalRunMM = 0,
 rightInternalHorizontalRunMM = 0,
}) {
  const iw = Math.max(
  1,
  finite(internalWidthMM, 1)
);

const leftHP = Math.max(
  0,
  finite(leftHipPositionMM)
);

const rightHP = Math.max(
  0,
  finite(rightHipPositionMM)
);

const leftHFC = Math.max(
  0,
  finite(leftHFCMM)
);

const rightHFC = Math.max(
  0,
  finite(rightHFCMM)
);

const leftInternalRun = Math.max(
  0,
  finite(leftInternalHorizontalRunMM)
);

const rightInternalRun = Math.max(
  0,
  finite(rightInternalHorizontalRunMM)
);

/*
 * SVG coordinates only.
 *
 * C = 0
 * H = internal width
 *
 * Therefore:
 *
 * B/A = -left HFC
 * C   = 0
 * E   = left HP
 * D   = left internal horizontal run
 *
 * H   = IW
 * G   = IW - right internal run
 * F   = IW - right HP
 * I/J = IW + right HFC
 */

const VB_W = 1000;
const VB_H = 560;

const drawingLeftX = 120;
const drawingRightX = 880;
const baseY = 410;

const physicalLeftMM =
  -leftHFC;

const physicalRightMM =
  iw + rightHFC;

const physicalWidthMM = Math.max(
  1,
  physicalRightMM - physicalLeftMM
);

const drawingWidth =
  drawingRightX - drawingLeftX;

const sx =
  drawingWidth / physicalWidthMM;

const mapX = (mm) =>
  drawingLeftX +
  (Number(mm) - physicalLeftMM) * sx;

// LEFT
const leftAX = mapX(-leftHFC);
const leftBX = mapX(-leftHFC);

const leftCX = mapX(0);

const leftDX =
  mapX(leftInternalRun);

const leftEX =
  mapX(leftHP);

// RIGHT
const rightFX =
  mapX(iw - rightHP);

const rightGX =
  mapX(iw - rightInternalRun);

const rightHX =
  mapX(iw);

const rightIX =
  mapX(iw + rightHFC);

const rightJX =
  mapX(iw + rightHFC);

/*
 * Vertical scale.
 */
const maxHeight = Math.max(
  1,
  finite(externalWallplateHeightMM, 1)
);

const availableHeight = 250;

const sy =
  availableHeight / maxHeight;

const extTopY =
  baseY -
  finite(externalWallplateHeightMM) * sy;

const intTopY =
  baseY -
  finite(internalWallplateHeightMM) * sy;

const leftAY =
  baseY -
  finite(leftVFCMM) * sy;

const leftCY = baseY;

const rightHY = baseY;

const rightJY =
  baseY -
  finite(rightVFCMM) * sy;

  const memberFill = "#a3e635";
  const centreFill = "#fde047";
  const outline = "#1f2937";

  const textStyle = {
    fontFamily: "Inter, system-ui, Arial",
    fontSize: 13,
    fill: "#111827",
  };

  return (
    <div
      style={{
        width: "100%",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          marginBottom: 6,
          textTransform: "uppercase",
          color: "#111827",
        }}
      >
        {title}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          background: "#fff",
        }}
      >
        {/* ============================= */}
        {/* BASE / INTERNAL DATUM         */}
        {/* ============================= */}

        <line
          x1={drawingLeftX}
          y1={baseY}
          x2={drawingRightX}
          y2={baseY}
          stroke="#64748b"
          strokeWidth="2"
        />

        {/* ============================= */}
        {/* LEFT WALL-BAR                 */}
        {/* ============================= */}

        <polygon
          points={`
            ${leftAX},${leftAY}
            ${leftEX},${extTopY}
            ${leftDX},${intTopY}
            ${leftCX},${leftCY}
            ${leftBX},${baseY}
          `}
          fill={memberFill}
          stroke={outline}
          strokeWidth="2"
        />

        {/* ============================= */}
        {/* HORIZONTAL WALLPLATE          */}
        {/* ============================= */}

        <polygon
          points={`
            ${leftEX},${extTopY}
            ${rightFX},${extTopY}
            ${rightGX},${intTopY}
            ${leftDX},${intTopY}
          `}
          fill={centreFill}
          stroke={outline}
          strokeWidth="2"
        />

        {/* ============================= */}
        {/* RIGHT WALL-BAR                */}
        {/* ============================= */}

        <polygon
          points={`
            ${rightFX},${extTopY}
            ${rightJX},${rightJY}
            ${rightIX},${baseY}
            ${rightHX},${rightHY}
            ${rightGX},${intTopY}
          `}
          fill={memberFill}
          stroke={outline}
          strokeWidth="2"
        />

        {/* ============================= */}
        {/* POINT LABELS                  */}
        {/* ============================= */}

        {[
          ["A", leftAX, leftAY],
          ["B", leftBX, baseY],
          ["C", leftCX, baseY],
          ["D", leftDX, intTopY],
          ["E", leftEX, extTopY],

          ["F", rightFX, extTopY],
          ["G", rightGX, intTopY],
          ["H", rightHX, baseY],
          ["I", rightIX, baseY],
          ["J", rightJX, rightJY],
        ].map(([label, x, y]) => (
          <g key={label}>
            <circle
              cx={x}
              cy={y}
              r="3.5"
              fill="#111827"
            />

            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              style={{
                ...textStyle,
                fontWeight: 800,
              }}
            >
              {label}
            </text>
          </g>
        ))}

        {/* ============================= */}
        {/* EWPL                         */}
        {/* ============================= */}

        <line
          x1={leftEX}
          y1={extTopY - 42}
          x2={rightFX}
          y2={extTopY - 42}
          stroke="#92400e"
          strokeWidth="1.5"
        />

        <text
          x={(leftEX + rightFX) / 2}
          y={extTopY - 50}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#92400e",
            fontWeight: 700,
          }}
        >
          EWPL: {dim(externalWallplateLengthMM)} mm
        </text>

        {/* ============================= */}
        {/* IWPL                         */}
        {/* ============================= */}

        <line
          x1={leftDX}
          y1={intTopY + 34}
          x2={rightGX}
          y2={intTopY + 34}
          stroke="#7c3aed"
          strokeWidth="1.5"
        />

        <text
          x={(leftDX + rightGX) / 2}
          y={intTopY + 54}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#7c3aed",
            fontWeight: 700,
          }}
        >
          IWPL: {dim(internalWallplateLengthMM)} mm
        </text>

        {/* ============================= */}
        {/* LEFT MEMBER VALUES            */}
        {/* ============================= */}

        <text
          x={235}
          y={250}
          textAnchor="middle"
          style={{
            ...textStyle,
            fontWeight: 700,
          }}
        >
          EWBS (L): {dim(leftEWBSMM)} mm
        </text>

        <text
          x={260}
          y={310}
          textAnchor="middle"
          style={{
            ...textStyle,
            fontWeight: 700,
          }}
        >
          IWBS (L): {dim(leftIWBSMM)} mm
        </text>

        <text
          x={150}
          y={390}
          style={{
            ...textStyle,
            fill: "#dc2626",
            fontWeight: 700,
          }}
        >
          {dim(leftPitchDeg, 1)}°
        </text>

        {/* ============================= */}
        {/* RIGHT MEMBER VALUES           */}
        {/* ============================= */}

        <text
          x={765}
          y={250}
          textAnchor="middle"
          style={{
            ...textStyle,
            fontWeight: 700,
          }}
        >
          EWBS (R): {dim(rightEWBSMM)} mm
        </text>

        <text
          x={740}
          y={310}
          textAnchor="middle"
          style={{
            ...textStyle,
            fontWeight: 700,
          }}
        >
          IWBS (R): {dim(rightIWBSMM)} mm
        </text>

        <text
          x={850}
          y={390}
          textAnchor="end"
          style={{
            ...textStyle,
            fill: "#dc2626",
            fontWeight: 700,
          }}
        >
          {dim(rightPitchDeg, 1)}°
        </text>

        {/* ============================= */}
        {/* HFC                          */}
        {/* ============================= */}

        <text
          x={(leftBX + leftCX) / 2}
          y={445}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#dc2626",
          }}
        >
          HFC (L): {dim(leftHFCMM, 1)} mm
        </text>

        <text
          x={(rightHX + rightIX) / 2}
          y={445}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#dc2626",
          }}
        >
          HFC (R): {dim(rightHFCMM, 1)} mm
        </text>

        {/* ============================= */}
        {/* HP                           */}
        {/* ============================= */}

        <text
          x={(leftCX + leftEX) / 2}
          y={478}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#059669",
            fontWeight: 700,
          }}
        >
          HP (L): {dim(leftHipPositionMM, 1)} mm
        </text>

        <text
          x={(rightFX + rightHX) / 2}
          y={478}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#059669",
            fontWeight: 700,
          }}
        >
          HP (R): {dim(rightHipPositionMM, 1)} mm
        </text>

        {/* ============================= */}
        {/* OVERALL WIDTHS                */}
        {/* ============================= */}

        <text
          x={500}
          y={515}
          textAnchor="middle"
          style={{
            ...textStyle,
            fill: "#2563eb",
            fontWeight: 700,
          }}
        >
          IW: {dim(internalWidthMM)} mm
        </text>

        <text
          x={500}
          y={542}
          textAnchor="middle"
          style={{
            ...textStyle,
            fontWeight: 700,
          }}
        >
          EW: {dim(externalWidthMM)} mm
        </text>
      </svg>

      {/* Numerical manufacture summary */}
      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 8,
          fontSize: 12,
        }}
      >
        <div>
          <b>Left wall-bar</b>
          <br />
          Pitch: {dim(leftPitchDeg, 2)}°
          <br />
          HFC: {dim(leftHFCMM, 1)} mm
          <br />
          VFC: {dim(leftVFCMM, 1)} mm
          <br />
          EWBS: {dim(leftEWBSMM, 1)} mm
          <br />
          IWBS: {dim(leftIWBSMM, 1)} mm
        </div>

        <div>
          <b>Horizontal wallplate</b>
          <br />
          EWPL: {dim(externalWallplateLengthMM, 1)} mm
          <br />
          IWPL: {dim(internalWallplateLengthMM, 1)} mm
          <br />
          IWPH: {dim(internalWallplateHeightMM, 1)} mm
          <br />
          EWPH: {dim(externalWallplateHeightMM, 1)} mm
        </div>

        <div>
          <b>Right wall-bar</b>
          <br />
          Pitch: {dim(rightPitchDeg, 2)}°
          <br />
          HFC: {dim(rightHFCMM, 1)} mm
          <br />
          VFC: {dim(rightVFCMM, 1)} mm
          <br />
          EWBS: {dim(rightEWBSMM, 1)} mm
          <br />
          IWBS: {dim(rightIWBSMM, 1)} mm
        </div>
      </div>
    </div>
  );
}