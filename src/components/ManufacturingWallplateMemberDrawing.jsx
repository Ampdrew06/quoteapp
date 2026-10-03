import React from "react";

const finite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const dim = (value, dp = 0) =>
  finite(value).toFixed(dp);

/**
 * ManufacturingWallplateMemberDrawing
 *
 * Draws ONE manufactured wallplate member.
 *
 * It does not calculate roof geometry.
 * All manufacture dimensions are supplied to it.
 *
 * Supported member types:
 *
 *   wallbar
 *   horizontal-wallplate
 */
export default function ManufacturingWallplateMemberDrawing({
  manufactureRef = "",
  quantity = 1,

  memberType = "wallbar",

  pitchDeg = 0,

  hfcMM = 0,
  vfcMM = 0,

  ewbsMM = 0,
  iwbsMM = 0,
  topCutOffSquareDeg = 0,

  externalLengthMM = 0,
  internalLengthMM = 0,

  externalHeightMM = 0,
  internalHeightMM = 0,
  leftEndCutOffSquareDeg = 0,
  rightEndCutOffSquareDeg = 0,

  internalHorizontalRunMM = 0,

  externalWallplateHeightMM = 0,
  internalWallplateHeightMM = 0,

}) {
  const isWallbar =
    memberType === "wallbar";

  const title =
    isWallbar
      ? "Wallbar"
      : "Horizontal Wallplate";

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        padding: 12,
        background: "#fff",
        boxSizing: "border-box",
      }}
    >
      {/* MEMBER HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {manufactureRef}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {title}
        </div>

        {quantity > 1 && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ×{quantity}
          </div>
        )}
      </div>

      {isWallbar ? (
        <WallbarDrawing
  pitchDeg={pitchDeg}
  hfcMM={hfcMM}
  vfcMM={vfcMM}
  ewbsMM={ewbsMM}
  iwbsMM={iwbsMM}
  topCutOffSquareDeg={topCutOffSquareDeg}

  internalHorizontalRunMM={
    internalHorizontalRunMM
  }

  externalWallplateHeightMM={
    externalWallplateHeightMM
  }

  internalWallplateHeightMM={
    internalWallplateHeightMM
  }
/>
      ) : (
        <HorizontalWallplateDrawing
          externalLengthMM={externalLengthMM}
          internalLengthMM={internalLengthMM}
          externalHeightMM={externalHeightMM}
          internalHeightMM={internalHeightMM}
          leftEndCutOffSquareDeg={leftEndCutOffSquareDeg}
          rightEndCutOffSquareDeg={rightEndCutOffSquareDeg}
        />
      )}
    </div>
  );
}

function WallbarDrawing({
  pitchDeg,
  hfcMM,
  vfcMM,
  ewbsMM,
  iwbsMM,
  topCutOffSquareDeg,

  internalHorizontalRunMM,
  externalWallplateHeightMM,
  internalWallplateHeightMM,
}) {
  const VB_W = 520;
  const VB_H = 220;

  const hfc = Math.max(0, finite(hfcMM));
  const vfc = Math.max(0, finite(vfcMM));

  const ewbs = Math.max(0, finite(ewbsMM));
  const iwbs = Math.max(0, finite(iwbsMM));

  const internalRun = Math.max(
    0,
    finite(internalHorizontalRunMM)
  );

  const externalHeight = Math.max(
    0,
    finite(externalWallplateHeightMM)
  );

  const internalHeight = Math.max(
    0,
    finite(internalWallplateHeightMM)
  );

  /*
   * REAL A-B-C-D-E PROFILE
   *
   * B/C sit on the internal base datum.
   *
   * A = outer top of foot cut
   * B = outer bottom of foot cut
   * C = internal foot
   * D = internal wallplate end
   * E = external wallplate end
   */

  const A = {
    x: -hfc,
    y: vfc,
  };

  const B = {
    x: -hfc,
    y: 0,
  };

  const C = {
    x: 0,
    y: 0,
  };

  const pitchRad =
    finite(pitchDeg) * Math.PI / 180;

  const D = {
    x:
      iwbs > 0
        ? iwbs * Math.cos(pitchRad)
        : internalRun,
    y:
      iwbs > 0
        ? iwbs * Math.sin(pitchRad)
        : internalHeight,
  };

  /*
   * EWBS gives us the real sloping distance A → E.
   *
   * We already know its vertical rise, therefore the
   * corresponding horizontal run can be derived without
   * introducing any new roof geometry.
   */
  const E = {
    x: A.x + ewbs * Math.cos(pitchRad),
    y: A.y + ewbs * Math.sin(pitchRad),
  };

  const topCutSawSettingDeg = Math.max(
    0,
    finite(topCutOffSquareDeg)
  );

  /*
   * Preserve the REAL member proportions.
   *
   * One uniform scale is used for both X and Y.
   */
  const minPhysicalX =
    Math.min(
      A.x,
      B.x,
      C.x,
      D.x,
      E.x
    );

  const maxPhysicalX =
    Math.max(
      A.x,
      B.x,
      C.x,
      D.x,
      E.x
    );

  const minPhysicalY = 0;

  const maxPhysicalY =
    Math.max(
      A.y,
      D.y,
      E.y
    );

  const physicalWidth =
    Math.max(
      1,
      maxPhysicalX -
        minPhysicalX
    );

  const physicalHeight =
    Math.max(
      1,
      maxPhysicalY -
        minPhysicalY
    );

  const drawingLeft = 80;
  const drawingRight = 455;

  const drawingTop = 35;
  const drawingBottom = 165;

  const availableWidth =
    drawingRight - drawingLeft;

  const availableHeight =
    drawingBottom - drawingTop;

  const scale =
    Math.min(
      availableWidth /
        physicalWidth,

      availableHeight /
        physicalHeight
    );

  const usedWidth =
    physicalWidth * scale;

  const usedHeight =
    physicalHeight * scale;

  const offsetX =
    drawingLeft +
    (
      availableWidth -
      usedWidth
    ) / 2;

  const offsetY =
    drawingTop +
    (
      availableHeight -
      usedHeight
    ) / 2;

  const mapPoint = (point) => ({
    x:
      offsetX +
      (
        point.x -
        minPhysicalX
      ) *
        scale,

    /*
     * SVG Y runs downward, hence the inversion.
     */
    y:
      offsetY +
      usedHeight -
      (
        point.y -
        minPhysicalY
      ) *
        scale,
  });

  const a = mapPoint(A);
  const b = mapPoint(B);
  const c = mapPoint(C);
  const d = mapPoint(D);
  const e = mapPoint(E);

  const textStyle = {
    fontFamily:
      "Inter, system-ui, Arial",
    fill: "#111827",
    fontWeight: 700,
  };

  const angleStyle = {
    ...textStyle,
    fill: "#dc2626",
    fontSize: 16,
  };

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "auto",
        display: "block",
        fontFamily: "Arial, sans-serif",
        margin: "0 auto",
      }}
    >
      {/* =============================
          MEMBER OUTLINE
      ============================= */}

      <polygon
        points={`
          ${a.x},${a.y}
          ${e.x},${e.y}
          ${d.x},${d.y}
          ${c.x},${c.y}
          ${b.x},${b.y}
        `}
        fill="none"
        stroke="#111827"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* =============================
          EXTERNAL LENGTH A-E
      ============================= */}

      <text
        x={(a.x + e.x) / 2}
        y={
          (a.y + e.y) / 2 - 15
        }
        textAnchor="middle"
        style={{
          ...textStyle,
          fontSize: 15,
        }}
      >
        {dim(ewbsMM, 0)} mm
      </text>

      {/* =============================
          INTERNAL LENGTH C-D
      ============================= */}

      <text
        x={(c.x + d.x) / 2}
        y={
          (c.y + d.y) / 2 + 32
        }
        textAnchor="middle"
        style={{
          ...textStyle,
          fontSize: 15,
        }}
      >
        {dim(iwbsMM, 0)} mm
      </text>

      {/* =============================
          VERTICAL FOOT A-B
      ============================= */}

      <text
        x={a.x - 12}
        y={(a.y + b.y) / 2}
        textAnchor="end"
        dominantBaseline="middle"
        style={{
          ...textStyle,
          fontSize: 14,
        }}
      >
        {dim(vfcMM, 0)} mm
      </text>

      {/* =============================
          HORIZONTAL FOOT B-C
      ============================= */}

      <text
        x={(b.x + c.x) / 2}
        y={b.y + 18}
        textAnchor="middle"
        style={{
          ...textStyle,
          fontSize: 14,
        }}
      >
        {dim(hfcMM, 0)} mm
      </text>

      {/* Roof-pitch foot cut. */}
      <text
        x={c.x + 12}
        y={c.y - 8}
        style={angleStyle}
      >
        {dim(pitchDeg, 1)}°
      </text>

      {/* Equal mitre for the top / R22 mating cut. */}
      <text
        x={e.x + 10}
        y={e.y + 20}
        style={angleStyle}
      >
        {dim(topCutSawSettingDeg, 1)}°
      </text>
    </svg>
  );
}

function HorizontalWallplateDrawing({
  externalLengthMM,
  internalLengthMM,
  externalHeightMM,
  internalHeightMM,
  leftEndCutOffSquareDeg,
  rightEndCutOffSquareDeg,
}) {
  const VB_W = 760;
  const VB_H = 330;

  const leftX = 90;
  const rightX = 670;

  const extY = 80;
  const intY = 165;
  const topDimY = 35;
  const bottomDimY = 205;
  const floorY = 285;
  const heightDimX = 710;

  const dimensionStroke = "#111827";
  const extensionStroke = "#64748b";

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* EXTERNAL / TOP LENGTH DIMENSION */}

      <line
        x1={leftX}
        y1={topDimY}
        x2={rightX}
        y2={topDimY}
        stroke={dimensionStroke}
        strokeWidth="1.5"
      />
      <line x1={leftX} y1={topDimY - 7} x2={leftX} y2={topDimY + 7} stroke={dimensionStroke} />
      <line x1={rightX} y1={topDimY - 7} x2={rightX} y2={topDimY + 7} stroke={dimensionStroke} />
      <line x1={leftX} y1={topDimY + 8} x2={leftX} y2={extY - 5} stroke={extensionStroke} />
      <line x1={rightX} y1={topDimY + 8} x2={rightX} y2={extY - 5} stroke={extensionStroke} />

      <rect
        x="285"
        y="20"
        width="190"
        height="28"
        fill="#fff"
      />
      <text
        x={(leftX + rightX) / 2}
        y="39"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
      >
        Top length (EWPL): {dim(externalLengthMM, 1)} mm
      </text>

      {/* MEMBER — intentionally uncoloured workshop profile */}

      <polygon
        points={`
          ${leftX},${extY}
          ${rightX},${extY}
          ${rightX - 35},${intY}
          ${leftX + 35},${intY}
        `}
        fill="#fff"
        stroke="#1f2937"
        strokeWidth="2.5"
      />

      {/* Practical saw settings for the two mating end cuts. */}

      <line x1={leftX} y1={extY} x2={leftX + 34} y2={extY + 27} stroke="#dc2626" strokeWidth="1.5" />
      <text x={leftX + 39} y={extY + 25} fontSize="20" fontWeight="800" fill="#dc2626">
        {dim(leftEndCutOffSquareDeg, 1)}°
      </text>

      <line x1={rightX} y1={extY} x2={rightX - 34} y2={extY + 27} stroke="#dc2626" strokeWidth="1.5" />
      <text x={rightX - 39} y={extY + 25} textAnchor="end" fontSize="20" fontWeight="800" fill="#dc2626">
        {dim(rightEndCutOffSquareDeg, 1)}°
      </text>

      {/* INTERNAL / BOTTOM LENGTH DIMENSION */}

      <line
        x1={leftX + 35}
        y1={bottomDimY}
        x2={rightX - 35}
        y2={bottomDimY}
        stroke={dimensionStroke}
        strokeWidth="1.5"
      />
      <line x1={leftX + 35} y1={bottomDimY - 7} x2={leftX + 35} y2={bottomDimY + 7} stroke={dimensionStroke} />
      <line x1={rightX - 35} y1={bottomDimY - 7} x2={rightX - 35} y2={bottomDimY + 7} stroke={dimensionStroke} />
      <line x1={leftX + 35} y1={intY + 5} x2={leftX + 35} y2={bottomDimY - 8} stroke={extensionStroke} />
      <line x1={rightX - 35} y1={intY + 5} x2={rightX - 35} y2={bottomDimY - 8} stroke={extensionStroke} />

      <text
        x={(leftX + rightX) / 2}
        y={bottomDimY + 22}
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
      >
        Bottom length (IWPL): {dim(internalLengthMM, 1)} mm
      </text>

      {/* FACTORY FLOOR DATUM */}

      <line
        x1="45"
        y1={floorY}
        x2="740"
        y2={floorY}
        stroke="#111827"
        strokeWidth="2"
      />
      <text x="48" y={floorY + 20} fontSize="15" fontWeight="700">
        FACTORY FLOOR DATUM
      </text>

      {/* CRITICAL FLOOR-TO-UNDERSIDE CHECK DIMENSION */}

      <line
        x1={heightDimX}
        y1={intY}
        x2={heightDimX}
        y2={floorY}
        stroke="#111827"
        strokeWidth="1.8"
      />
      <line x1={heightDimX - 8} y1={intY} x2={heightDimX + 8} y2={intY} stroke="#111827" />
      <line x1={heightDimX - 8} y1={floorY} x2={heightDimX + 8} y2={floorY} stroke="#111827" />
      <line x1={rightX - 35} y1={intY} x2={heightDimX - 9} y2={intY} stroke={extensionStroke} />

      <text
        x={heightDimX - 12}
        y={(intY + floorY) / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${heightDimX - 12} ${(intY + floorY) / 2})`}
        fontSize="17"
        fontWeight="800"
      >
        {dim(internalHeightMM, 1)} mm
      </text>

      {/* SECONDARY CHECK TO THE TOP EDGE */}

      <text x="48" y="260" fontSize="15" fontWeight="600" fill="#334155">
        Floor to top edge: {dim(externalHeightMM, 1)} mm
      </text>
    </svg>
  );
}
