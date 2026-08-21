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

  externalLengthMM = 0,
  internalLengthMM = 0,

  externalHeightMM = 0,
  internalHeightMM = 0,

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

  const D = {
    x: internalRun,
    y: internalHeight,
  };

  /*
   * EWBS gives us the real sloping distance A → E.
   *
   * We already know its vertical rise, therefore the
   * corresponding horizontal run can be derived without
   * introducing any new roof geometry.
   */
  const externalVerticalRise =
    externalHeight - vfc;

  const externalHorizontalRun =
    Math.sqrt(
      Math.max(
        0,
        ewbs * ewbs -
          externalVerticalRise *
            externalVerticalRise
      )
    );

  const E = {
    x:
      A.x +
      externalHorizontalRun,

    y: externalHeight,
  };

  /*
   * Included angle at E between:
   *
   * external slope A-E
   * end cut E-D
   *
   * This comes directly from the resolved member profile.
   */
  const angleBetween = (
    ax,
    ay,
    bx,
    by
  ) => {
    const aLength =
      Math.hypot(ax, ay);

    const bLength =
      Math.hypot(bx, by);

    if (
      aLength < 0.000001 ||
      bLength < 0.000001
    ) {
      return 0;
    }

    const dot =
      ax * bx + ay * by;

    const cosAngle =
      Math.max(
        -1,
        Math.min(
          1,
          dot / (aLength * bLength)
        )
      );

    return (
      Math.acos(cosAngle) *
      180 /
      Math.PI
    );
  };

  const topCutAngleDeg =
    angleBetween(
      A.x - E.x,
      A.y - E.y,
      D.x - E.x,
      D.y - E.y
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
    fontSize: 11,
  };

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{
        width: "100%",
        maxWidth: 600,
        height: "auto",
        display: "block",
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
          fontSize: 12,
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
          (c.y + d.y) / 2 + 20
        }
        textAnchor="middle"
        style={{
          ...textStyle,
          fontSize: 12,
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
          fontSize: 11,
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
          fontSize: 11,
        }}
      >
        {dim(hfcMM, 0)} mm
      </text>

      {/* =============================
          INTERNAL FOOT ANGLE AT C
      ============================= */}

      <path
        d={`
          M ${c.x - 18} ${c.y - 1}
          Q ${c.x - 11} ${c.y - 17}
            ${c.x + 5} ${c.y - 20}
        `}
        fill="none"
        stroke="#dc2626"
        strokeWidth="2"
      />

      <text
        x={c.x + 9}
        y={c.y - 17}
        style={angleStyle}
      >
        {dim(pitchDeg, 1)}°
      </text>

      {/* =============================
          TOP / WALLPLATE CUT AT E
      ============================= */}

      <path
        d={`
          M ${e.x - 23} ${e.y + 3}
          Q ${e.x - 9} ${e.y + 7}
            ${e.x - 7} ${e.y + 23}
        `}
        fill="none"
        stroke="#dc2626"
        strokeWidth="2"
      />

      <text
        x={e.x - 55}
        y={e.y + 28}
        style={angleStyle}
      >
        {dim(topCutAngleDeg, 1)}°
      </text>
    </svg>
  );
}

function HorizontalWallplateDrawing({
  externalLengthMM,
  internalLengthMM,
  externalHeightMM,
  internalHeightMM,
}) {
  const VB_W = 760;
  const VB_H = 230;

  const leftX = 90;
  const rightX = 670;

  const extY = 70;
  const intY = 155;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
      }}
    >
      {/* MEMBER */}

      <polygon
        points={`
          ${leftX},${extY}
          ${rightX},${extY}
          ${rightX - 35},${intY}
          ${leftX + 35},${intY}
        `}
        fill="#fde047"
        stroke="#1f2937"
        strokeWidth="2"
      />

      {/* EWPL */}

      <text
        x={(leftX + rightX) / 2}
        y={extY - 18}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
      >
        EWPL: {dim(externalLengthMM, 1)} mm
      </text>

      {/* IWPL */}

      <text
        x={(leftX + rightX) / 2}
        y={intY + 24}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
      >
        IWPL: {dim(internalLengthMM, 1)} mm
      </text>

      {/* HEIGHTS */}

      <text
        x={leftX + 15}
        y={(extY + intY) / 2}
        fontSize="12"
        fontWeight="700"
      >
        EWPH: {dim(externalHeightMM, 1)} mm
      </text>

      <text
        x={rightX - 145}
        y={(extY + intY) / 2}
        fontSize="12"
        fontWeight="700"
      >
        IWPH: {dim(internalHeightMM, 1)} mm
      </text>
    </svg>
  );
}