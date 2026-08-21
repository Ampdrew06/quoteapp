import React from "react";

const round = (value, dp = 0) => {
  const multiplier = 10 ** dp;

  return (
    Math.round((Number(value) || 0) * multiplier) /
    multiplier
  );
};

export default function LeanToSideElevationManufacture({
  manufactureGeom,
  pitchDeg = 15,
}) {
  if (!manufactureGeom) {
    return null;
  }

  const pitch = Number(pitchDeg) || 0;
  const theta = (pitch * Math.PI) / 180;

  const externalSlopeMM =
  Number(
    manufactureGeom.manufacturedExternalSlopeLengthMM
  ) ||
  Number(
    manufactureGeom.calculatedExternalCutLengthMM
  ) ||
  0;

  const internalSlopeMM =
    Number(
      manufactureGeom.simpleInternalCutLengthMM
    ) || 0;

  const hfcMM =
    Number(
      manufactureGeom.manufacturedHorizontalFootCutMM
    ) ||
    Number(manufactureGeom.horizontalExtensionMM) ||
    0;

  const vfcMM =
    Number(
      manufactureGeom.manufacturedPlumbCutHeightMM
    ) ||
    Number(manufactureGeom.plumbCutHeightMM) ||
    0;

  const wallplateFixingHeightMM =
    Number(
      manufactureGeom.internalWallPlateHeightMM
    ) || 0;

    const maximumFinishedHeightMM =
  Number(
    manufactureGeom.calculatedMaximumFinishedHeightMM
  ) || 0;

  const uncutRafterLengthMM =
  Number(
    manufactureGeom.manufacturedOverallBlankLengthMM
  ) ||
  (
    externalSlopeMM +
    vfcMM * Math.sin(theta)
  );

  const wallplateThicknessMM =
    Number(
      manufactureGeom.wallplateThicknessMM
    ) || 63;

  const VB_W = 980;
  const VB_H = 430;

  /*
   * Production drawing layout.
   *
   * This is deliberately a clear workshop schematic:
   * house wall on the left and eaves on the right.
   */

  const wallX = 125;
  const floorY = 385;

  const finishedHeightDatumY = 78;

  const wallplateTopY = 122;
  const wallplateBottomY = 220;
  const wallplateWidthPX = 24;

  const rafterTopLeft = {
    x: wallX + wallplateWidthPX,
    y: 122,
  };

  const rafterTopRight = {
    x: 855,
    y: 302,
  };

  const rafterFootBottomRight = {
    x: 855,
    y: 348,
  };

  const rafterFootSeat = {
    x: 790,
    y: 348,
  };

  const rafterBottomLeft = {
    x: wallX + wallplateWidthPX,
    y: 183,
  };

  const rafterAngleDeg =
    (Math.atan2(
      rafterTopRight.y - rafterTopLeft.y,
      rafterTopRight.x - rafterTopLeft.x
    ) *
      180) /
    Math.PI;

  const labelStyle = {
    fontFamily: "Inter, system-ui, Arial",
    fontSize: 14,
    fill: "#111827",
  };

  const boldStyle = {
    ...labelStyle,
    fontWeight: 700,
  };

  const smallStyle = {
    ...labelStyle,
    fontSize: 12,
  };

  const redAngleStyle = {
    ...boldStyle,
    fill: "#dc2626",
  };

  const Tick = ({ x, y, angle = 0 }) => (
    <line
      x1={x - 8}
      y1={y}
      x2={x + 8}
      y2={y}
      transform={`rotate(${angle} ${x} ${y})`}
      stroke="#111827"
      strokeWidth="1.5"
    />
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        {/* House wall */}
        <line
          x1={wallX}
          y1="42"
          x2={wallX}
          y2={floorY}
          stroke="#111827"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Wallplate */}
        <rect
          x={wallX}
          y={wallplateTopY}
          width={wallplateWidthPX}
          height={wallplateBottomY - wallplateTopY}
          fill="#fff"
          stroke="#111827"
          strokeWidth="2"
        />

        {/* Finished five-sided rafter */}
        <polygon
          points={`
            ${rafterTopLeft.x},${rafterTopLeft.y}
            ${rafterTopRight.x},${rafterTopRight.y}
            ${rafterFootBottomRight.x},${rafterFootBottomRight.y}
            ${rafterFootSeat.x},${rafterFootSeat.y}
            ${rafterBottomLeft.x},${rafterBottomLeft.y}
          `}
          fill="#fff"
          stroke="#111827"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Uncut blank length */}
        <line
          x1="145"
          y1="69"
          x2="882"
          y2="252"
          stroke="#111827"
          strokeWidth="1"
        />

        <Tick
          x={145}
          y={69}
          angle={rafterAngleDeg + 90}
        />

        <Tick
          x={882}
          y={252}
          angle={rafterAngleDeg + 90}
        />

        <text
          x="515"
          y="145"
          textAnchor="middle"
          transform={`rotate(${rafterAngleDeg} 515 145)`}
          style={boldStyle}
        >
          Uncut rafter: {Math.floor(uncutRafterLengthMM)} mm
        </text>

        {/* External slope */}
        <text
          x="515"
          y="207"
          textAnchor="middle"
          transform={`rotate(${rafterAngleDeg} 515 207)`}
          style={boldStyle}
        >
          External slope: {Math.floor(externalSlopeMM)} mm
        </text>

        {/* Internal slope */}
        <text
          x="500"
          y="298"
          textAnchor="middle"
          transform={`rotate(${rafterAngleDeg} 500 298)`}
          style={boldStyle}
        >
          Internal slope: {Math.floor(internalSlopeMM)} mm
        </text>

        {/* Maximum external finished height */}
<line
  x1="25"
  y1={finishedHeightDatumY}
  x2="25"
  y2={floorY}
  stroke="#111827"
  strokeWidth="1.5"
/>

<line
  x1="12"
  y1={finishedHeightDatumY}
  x2="38"
  y2={finishedHeightDatumY}
  stroke="#111827"
  strokeWidth="1"
/>

<line
  x1="12"
  y1={floorY}
  x2="38"
  y2={floorY}
  stroke="#111827"
  strokeWidth="1"
/>

<line
  x1="25"
  y1={finishedHeightDatumY}
  x2={wallX - 8}
  y2={finishedHeightDatumY}
  stroke="#6b7280"
  strokeWidth="1"
  strokeDasharray="5 4"
/>

<text
  x="8"
  y={(finishedHeightDatumY + floorY) / 2}
  textAnchor="middle"
  transform={`rotate(-90 8 ${
    (finishedHeightDatumY + floorY) / 2
  })`}
  style={boldStyle}
>
  Max finished height:{" "}
  {round(maximumFinishedHeightMM)} mm
</text>

        {/* Wallplate fixing height */}
        <line
          x1="72"
          y1={wallplateBottomY}
          x2="72"
          y2={floorY}
          stroke="#111827"
          strokeWidth="1.5"
        />

        <line
          x1="58"
          y1={wallplateBottomY}
          x2="86"
          y2={wallplateBottomY}
          stroke="#111827"
          strokeWidth="1"
        />

        <line
          x1="58"
          y1={floorY}
          x2="86"
          y2={floorY}
          stroke="#111827"
          strokeWidth="1"
        />

        <text
          x="54"
          y={(wallplateBottomY + floorY) / 2}
          textAnchor="middle"
          transform={`rotate(-90 54 ${
            (wallplateBottomY + floorY) / 2
          })`}
          style={boldStyle}
        >
          Wallplate fixing:{" "}
          {round(wallplateFixingHeightMM)} mm
        </text>

        {/* VFC dimension */}
        <line
          x1="894"
          y1={rafterTopRight.y}
          x2="894"
          y2={rafterFootBottomRight.y}
          stroke="#111827"
          strokeWidth="1.5"
        />

        <line
          x1="882"
          y1={rafterTopRight.y}
          x2="906"
          y2={rafterTopRight.y}
          stroke="#111827"
          strokeWidth="1"
        />

        <line
          x1="882"
          y1={rafterFootBottomRight.y}
          x2="906"
          y2={rafterFootBottomRight.y}
          stroke="#111827"
          strokeWidth="1"
        />

        <text
          x="912"
          y={
            (rafterTopRight.y +
              rafterFootBottomRight.y) /
            2
          }
          dominantBaseline="middle"
          style={boldStyle}
        >
          VFC {round(vfcMM)} mm
        </text>

        {/* HFC dimension */}
        <line
          x1={rafterFootSeat.x}
          y1="382"
          x2={rafterFootBottomRight.x}
          y2="382"
          stroke="#111827"
          strokeWidth="1.5"
        />

        <line
          x1={rafterFootSeat.x}
          y1="370"
          x2={rafterFootSeat.x}
          y2="394"
          stroke="#111827"
          strokeWidth="1"
        />

        <line
          x1={rafterFootBottomRight.x}
          y1="370"
          x2={rafterFootBottomRight.x}
          y2="394"
          stroke="#111827"
          strokeWidth="1"
        />

        <text
          x={
            (rafterFootSeat.x +
              rafterFootBottomRight.x) /
            2
          }
          y="414"
          textAnchor="middle"
          style={boldStyle}
        >
          HFC {round(hfcMM)} mm
        </text>

        {/* Wallplate thickness note */}
        <text
          x={wallX + wallplateWidthPX / 2}
          y="238"
          textAnchor="middle"
          style={smallStyle}
        >
          {round(wallplateThicknessMM)} mm
        </text>

        {/* Essential angles */}
        <text
          x={rafterTopLeft.x + 10}
          y={rafterTopLeft.y + 22}
          style={redAngleStyle}
        >
          {round(pitch, 1)}°
        </text>

        <text
          x={rafterBottomLeft.x + 10}
          y={rafterBottomLeft.y + 20}
          style={redAngleStyle}
        >
          {round(pitch, 1)}°
        </text>

        <text
          x={rafterFootSeat.x + 10}
          y={rafterFootSeat.y - 10}
          style={redAngleStyle}
        >
          {round(pitch, 1)}°
        </text>
      </svg>
    </div>
  );
}