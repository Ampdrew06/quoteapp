// src/components/PlanDiagramHippedLeanTo.jsx
import React, { useMemo } from "react";
import { calculateHippedLeanToGeometry } from "../lib/geometry/hippedLeanToGeometry";

const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};
const degToRad = (deg) => (Number(deg) * Math.PI) / 180;
const radToDeg = (rad) => (Number(rad) * 180) / Math.PI;

const calcSidePitchDeg = ({ frontPitchDeg, projectionMM, hipWidthMM }) => {
  const frontPitchRad = degToRad(frontPitchDeg);
  const projection = Number(projectionMM) || 0;
  const hipWidth = Number(hipWidthMM) || 0;

  if (!projection || !hipWidth) return 0;

  return radToDeg(
    Math.atan(Math.tan(frontPitchRad) * (projection / hipWidth))
  );
};
export default function PlanDiagramHippedLeanTo({
  iw = 4000,
  ip = 2000,
  leftHipWidth = 1000,
  rightHipWidth = 1000,
  hippedSides = "both",
  rafterSpacing = 665,
  firstCentre = 690,
  pitchDeg = 15,
  tileSystem = "britmet",
  soffitDepthMM = 150,
}) {
  const geom = calculateHippedLeanToGeometry({
    widthMM: iw,
    projectionMM: ip,
    pitchDeg,
    soffitDepthMM,
    materials: {},
    hippedSides,
    leftHipWidthMM: leftHipWidth,
    rightHipWidthMM: rightHipWidth,
  });
  
  const {
    hasLeftHip,
    hasRightHip,
    centreStart,
    centreEnd,
    centreWidth,
    rafters,
  } = useMemo(() => {
    
    const width = Number(iw) || 0;
    const leftHip = Number(leftHipWidth) || 0;
    const rightHip = Number(rightHipWidth) || 0;

    const hasLeft = hippedSides === "left" || hippedSides === "both";
    const hasRight = hippedSides === "right" || hippedSides === "both";

    const start = hasLeft ? leftHip : 0;
    const end = hasRight ? width - rightHip : width;

    const list = [];
    for (let c = firstCentre; c <= width; c += rafterSpacing) {
      if (c > start && c < end) list.push(c);
    }

    return {
      hasLeftHip: hasLeft,
      hasRightHip: hasRight,
      centreStart: start,
      centreEnd: end,
      centreWidth: Math.max(0, end - start),
      rafters: list,
    };
  }, [iw, leftHipWidth, rightHipWidth, hippedSides, rafterSpacing, firstCentre]);

  const leftSidePitchDeg = calcSidePitchDeg({
  frontPitchDeg: pitchDeg,
  projectionMM: ip,
  hipWidthMM: leftHipWidth,
});

const rightSidePitchDeg = calcSidePitchDeg({
  frontPitchDeg: pitchDeg,
  projectionMM: ip,
  hipWidthMM: rightHipWidth,
});

  const minPitchDeg = tileSystem === "liteslate" ? 12 : 15;

  const leftPitchColour =
  leftSidePitchDeg < minPitchDeg ? "#dc2626" : "#16a34a";

  const rightPitchColour =
  rightSidePitchDeg < minPitchDeg ? "#dc2626" : "#16a34a";

  const frontPitchColour =
  Number(pitchDeg) < minPitchDeg ? "#dc2626" : "#16a34a";

  const VB_W = 900;
  const VB_H = 520;
  const M_TOP = 70;
  const M_RIGHT = 80;
  const M_BOTTOM = 90;
  const M_LEFT = 80;

  const innerW = VB_W - M_LEFT - M_RIGHT;
  const innerH = VB_H - M_TOP - M_BOTTOM;
  const scale = Math.min(innerW / Math.max(1, iw), innerH / Math.max(1, ip));

  const ox = M_LEFT;
  const oy = M_TOP;
  const ow = iw * scale;
  const oh = ip * scale;

  const x = (mm) => ox + mm * scale;
  const yFront = oy + oh;
  const yBack = oy;

  const extLeft = ox - geom.leftCalculatedSoffitMM * scale;
  const extRight = ox + ow + geom.rightCalculatedSoffitMM * scale;
  const extFront = yFront + geom.frontSoffitMM * scale;
  const extBack = yBack;

  const labelFont = "14px Inter, system-ui, Arial";
  const smallFont = "12px Inter, system-ui, Arial";
  const rafterStroke = Math.max(2, Math.min(6, 0.005 * ow + 2));

  const arrId = "arr-hlt";
  const arrYId = "arrY-hlt";

  const dim = (n) => `${round(n, 0)}`;

  const DimX = ({ x1, x2, y, text }) => {
    const mid = (x1 + x2) / 2;
    return (
      <g>
        <line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#374151"
          strokeWidth="1.5"
          markerStart={`url(#${arrId}-start)`}
          markerEnd={`url(#${arrId}-end)`}
        />
        <text
          x={mid}
          y={y - 6}
          textAnchor="middle"
          style={{ font: labelFont }}
          fill="#111827"
        >
          {text}
        </text>
      </g>
    );
  };

  const DimY = ({ x, y1, y2, text }) => {
    const mid = (y1 + y2) / 2;
    return (
      <g>
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="#374151"
          strokeWidth="1.5"
          markerStart={`url(#${arrYId}-start)`}
          markerEnd={`url(#${arrYId}-end)`}
        />
        <text
          x={x - 6}
          y={mid}
          textAnchor="end"
          style={{ font: labelFont }}
          fill="#111827"
          transform={`rotate(-90 ${x - 6} ${mid})`}
        >
          {text}
        </text>
      </g>
    );
  };

  return (
    <svg width="100%" height="360" viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <defs>
  {/* Horizontal arrows */}
  <marker
    id={`${arrId}-start`}
    markerWidth="10"
    markerHeight="10"
    refX="1"
    refY="3"
    orient="auto"
  >
    <path d="M6,0 L0,3 L6,6" fill="none" stroke="#374151" strokeWidth="1.5" />
  </marker>

  <marker
    id={`${arrId}-end`}
    markerWidth="10"
    markerHeight="10"
    refX="5"
    refY="3"
    orient="auto"
  >
    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#374151" strokeWidth="1.5" />
  </marker>

  {/* Vertical arrows */}
  <marker
    id={`${arrYId}-start`}
    markerWidth="10"
    markerHeight="10"
    refX="1"
    refY="3"
    orient="auto"
  >
    <path d="M6,0 L0,3 L6,6" fill="none" stroke="#374151" strokeWidth="1.5" />
  </marker>

  <marker
    id={`${arrYId}-end`}
    markerWidth="10"
    markerHeight="10"
    refX="5"
    refY="3"
    orient="auto"
  >
    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#374151" strokeWidth="1.5" />
  </marker>
</defs>

{/* External soffit outline */}
<rect
  x={extLeft}
  y={extBack}
  width={extRight - extLeft}
  height={extFront - extBack}
  fill="none"
  stroke="#9ca3af"
  strokeWidth="2"

/>
      {/* Roof outline */}
      <rect
        x={ox}
        y={oy}
        width={ow}
        height={oh}
        fill="#f8fafc"
        stroke="#111827"
        strokeWidth="2"
      />

      {/* Wallplate: centre flat section */}
      <line
        x1={x(centreStart)}
        y1={yBack}
        x2={x(centreEnd)}
        y2={yBack}
        stroke="#111827"
        strokeWidth="5"
      />

      {/* Left hip return */}
      {hasLeftHip && (
        <>
          <line x1={ox} y1={yBack} x2={x(centreStart)} y2={yBack} stroke="#111827" strokeWidth="2" />
          <line x1={ox} y1={yFront} x2={x(centreStart)} y2={yBack} stroke="#dc2626" strokeWidth="4" />
          <circle cx={x(centreStart)} cy={yBack} r="7" fill="#111827" />
          <text x={x(centreStart)} y={yBack - 12} textAnchor="middle" style={{ font: smallFont }}>
            BOSS
          </text>
         <text
  x={x(centreStart / 2)}
  y={yBack + oh * 0.18}
  textAnchor="middle"
  style={{ font: smallFont, fontWeight: 700 }}
  fill={leftPitchColour}
>
  {round(leftSidePitchDeg, 1)}°
</text>
        </>
      )}

      {/* Right hip return */}
      {hasRightHip && (
        <>
          <line x1={x(centreEnd)} y1={yBack} x2={ox + ow} y2={yBack} stroke="#111827" strokeWidth="2" />
          <line x1={ox + ow} y1={yFront} x2={x(centreEnd)} y2={yBack} stroke="#dc2626" strokeWidth="4" />
          <circle cx={x(centreEnd)} cy={yBack} r="7" fill="#111827" />
          <text x={x(centreEnd)} y={yBack - 12} textAnchor="middle" style={{ font: smallFont }}>
            BOSS
          </text>
          <text
  x={x((centreEnd + iw) / 2)}
  y={yBack + oh * 0.18}
  textAnchor="middle"
  style={{ font: smallFont, fontWeight: 700 }}
  fill={rightPitchColour}
>
  {round(rightSidePitchDeg, 1)}°
</text>
        </>
      )}

      {/* Straight lean-to rafters */}
      {rafters.map((mm, i) => {
        const rx = x(mm);
        return (
          <g key={i}>
            <line
              x1={rx}
              y1={yBack}
              x2={rx}
              y2={yFront}
              stroke="#2563eb"
              strokeWidth={rafterStroke}
            />
            <text
              x={rx}
              y={yFront + 22}
              textAnchor="middle"
              style={{ font: labelFont }}
              fill="#111827"
            >
              {dim(mm)}
            </text>
          </g>
        );
      })}

      {/* Simple jack rafter hints */}
      {hasLeftHip && (
        <>
          <line x1={x(centreStart / 2)} y1={yFront} x2={x(centreStart)} y2={yBack} stroke="#2563eb" strokeWidth="3" strokeDasharray="7 5" />
          
        </>
      )}

      {hasRightHip && (
        <>
          <line x1={x((centreEnd + iw) / 2)} y1={yFront} x2={x(centreEnd)} y2={yBack} stroke="#2563eb" strokeWidth="3" strokeDasharray="7 5" />
          
        </>
      )}

      {/* Labels */}
    

      {/* Internal dimensions */}
<DimX x1={ox} x2={ox + ow} y={oy - 20} text={`${dim(iw)} int`} />
<DimY x={ox + ow + 50} y1={oy} y2={oy + oh} text={`${dim(ip)} int`} />

{/* External dimensions */}
<DimX
  x1={extLeft}
  x2={extRight}
  y={extFront + 35}
  text={`${dim(geom.externalWidthMM)} ext`}
/>

<DimY
  x={extLeft - 50}
  y1={extBack}
  y2={extFront}
  text={`${dim(geom.externalProjectionMM)} ext`}
/>
      {/* Front ring beam */}
<line x1={ox} y1={yFront} x2={ox + ow} y2={yFront} stroke="#111827" strokeWidth="5" />

<text
  x={ox + ow / 2}
  y={yBack + oh * 0.5}
  textAnchor="middle"
  style={{ font: "14px Inter, system-ui, Arial", fontWeight: 700 }}
  fill={frontPitchColour}
>
  {round(pitchDeg, 1)}°
</text>

    </svg>
  );
}