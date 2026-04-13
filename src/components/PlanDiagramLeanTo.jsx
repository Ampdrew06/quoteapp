// src/components/PlanDiagramLeanTo.jsx
import React, { useMemo } from "react";

const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};

export default function PlanDiagramLeanToManufacture({
  iw, ip,
  sft, lip,
  soffit, frameOn,
  leftOH = 0, rightOH = 0,
  leftWall = false, rightWall = false,
  rafterSpacing = 665, firstCentre = 690,
  outlet = "left", gutterColor = "black",
  pitchDeg = 15,
}) {
  // --- compute per-side deltas (full rule set) ---
  const { extW, extP, leftDelta, rightDelta } = useMemo(() => {
  const FT  = Number(sft) || 70;
  const LIP = Number(lip) || 25;
  const L_OH = Number(leftOH) || 0;
  const R_OH = Number(rightOH) || 0;

  // Manufacture Book should always show the true overall roof width
  const leftDelta  = FT + (L_OH > 0 ? L_OH : LIP);
  const rightDelta = FT + (R_OH > 0 ? R_OH : LIP);

  const extW = iw + leftDelta + rightDelta;
  const extP = ip + (Number(frameOn) || 70) + (Number(soffit) || 150);

  return { extW, extP, leftDelta, rightDelta };
}, [iw, ip, sft, lip, soffit, frameOn, leftOH, rightOH]);

  // --- drawing area setup ---
  const VB_W = 900, VB_H = 520;
  const M_TOP = 70, M_RIGHT = 80, M_BOTTOM = 90, M_LEFT = 80;
  const innerW = VB_W - M_LEFT - M_RIGHT;
  const innerH = VB_H - M_TOP - M_BOTTOM;
  const scale = Math.min(innerW / Math.max(1, extW), innerH / Math.max(1, extP));

  const ox = M_LEFT, oy = M_TOP;
  const ow = extW * scale, oh = extP * scale;

  // --- internal rect (wall top → eaves bottom) ---
  const ix = ox + leftDelta * scale;
  const iy = oy + (frameOn * scale); // wall is top; frameOn offsets downward
  const iw_px = iw * scale;
  const ip_px = ip * scale;

  // --- rafters ---
  const centres = [];
  for (let c = firstCentre; c <= iw; c += rafterSpacing) centres.push(c);

  const rafterStroke = Math.max(2, Math.min(6, 0.005 * iw_px + 2));
  const labelFont = "14px Inter, system-ui, Arial";
  const faint = "#6b7280";

  const uid = "pdlt";
  const arrId = `arr-${uid}`;
  const arrYId = `arrY-${uid}`;

  const DimX = ({ x1, x2, y, text }) => {
    const mid = (x1 + x2) / 2;
    return (
      <g>
        <line
          x1={x1} y1={y} x2={x2} y2={y}
          stroke="#374151" strokeWidth="1.5"
          markerStart={`url(#${arrId})`} markerEnd={`url(#${arrId})`}
        />
        <text x={mid} y={y - 6} textAnchor="middle"
          style={{ font: labelFont }} fill="#111827">{text}</text>
      </g>
    );
  };

  const DimY = ({ x, y1, y2, text }) => {
    const mid = (y1 + y2) / 2;
    return (
      <g>
        <line
          x1={x} y1={y1} x2={x} y2={y2}
          stroke="#374151" strokeWidth="1.5"
          markerStart={`url(#${arrYId})`} markerEnd={`url(#${arrYId})`}
        />
        <text
          x={x - 6} y={mid} textAnchor="end"
          style={{ font: labelFont }} fill="#111827"
          transform={`rotate(-90 ${x - 6} ${mid})`}
        >
          {text}
        </text>
      </g>
    );
  };

  const dim = (n) => `${round(n, 0)}`;

  // --- render ---
  return (
    <svg width="100%" height="360" viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <defs>
        <marker id={arrId} markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#374151" strokeWidth="1.5" />
        </marker>
        <marker id={arrYId} markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#374151" strokeWidth="1.5" />
        </marker>
      </defs>

      {/* --- external rectangle (wall = top, eaves = bottom) --- */}
      <rect x={ox} y={oy} width={ow} height={oh} fill="#f8fafc" stroke="#111827" strokeWidth="2" />

      {/* --- internal rectangle --- */}
      <rect
        x={ix}
        y={oy + oh - ip_px - (soffit * scale)}   // push down so eaves at bottom
        width={iw_px}
        height={ip_px}
        fill="#ffffff"
        stroke="#1f2937"
        strokeWidth="1.5"
      />

      {/* --- rafters --- */}
      {centres.map((mm, i) => {
        const x = ix + mm * scale;
        return (
          <g key={i}>
            <line x1={x} y1={oy} x2={x} y2={oy + oh} stroke="#2563eb" strokeWidth={rafterStroke} />
            <text x={x} y={oy + oh + 22} textAnchor="middle"
              style={{ font: labelFont }} fill="#111827">{dim(mm)}</text>
          </g>
        );
      })}

      {/* --- side labels on actual external edges --- */}
<g>
  <text
    x={ox - 10}
    y={oy + oh / 2}
    textAnchor="end"
    dominantBaseline="middle"
    style={{ font: "12px Inter, system-ui, Arial" }}
    fill="#111827"
  >
    {leftWall ? "WALL" : "END"}
  </text>

  <text
    x={ox + ow + 10}
    y={oy + oh / 2}
    textAnchor="start"
    dominantBaseline="middle"
    style={{ font: "12px Inter, system-ui, Arial" }}
    fill="#111827"
  >
    {rightWall ? "WALL" : "END"}
  </text>
</g>

      {/* --- dimensions --- */}
      <DimX x1={ix} x2={ix + iw_px} y={oy - 22} text={`${dim(iw)} int`} />
      <DimX x1={ox} x2={ox + ow} y={oy + oh + 46} text={`${dim(extW)} ext`} />
      <DimY x={ox - 50} y1={oy} y2={oy + oh} text={`${dim(extP)} ext`} />
      <DimY x={ox + ow + 50} y1={oy + oh - ip_px - (soffit * scale)} y2={oy + oh - (soffit * scale)} text={`${dim(ip)} int`} />

      {/* --- gutter indicators (bottom edge) --- */}
      {(() => {
        const eavesY = oy + oh;
        const fill =
          gutterColor === "white" ? "#e5e7eb" :
          gutterColor === "anthracite" ? "#374151" :
          gutterColor === "brown" ? "#7c3e1d" : "#111827";

        const dot = (cx) => (
          <circle key={cx} cx={cx} cy={eavesY + 14} r={6} fill={fill} stroke="#111827" strokeWidth="1" />
        );

        const leftX = ox + 10;
        const rightX = ox + ow - 10;
        const centerX = ox + ow / 2;

        if (outlet === "none") return null;
        if (outlet === "left") return dot(leftX);
        if (outlet === "right") return dot(rightX);
        if (outlet === "center") return dot(centerX);
        if (outlet === "both") return <g>{[dot(leftX), dot(rightX)]}</g>;
        return null;
      })()}

      {/* --- faint baseline under bottom labels --- */}
      <polyline
        points={`${ox},${oy + oh} ${ox},${oy + oh + 8} ${ox + ow},${oy + oh + 8} ${ox + ow},${oy + oh}`}
        fill="none"
        stroke={faint}
        strokeWidth="1"
      />
    </svg>
  );
}
