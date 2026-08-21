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

const distance = (a, b) =>
  Math.hypot(b.x - a.x, b.y - a.y);

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
        y2={y}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x2}
        y1={extensionFromY}
        x2={x2}
        y2={y}
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
        x={(x1 + x2) / 2}
        y={y - 7}
        textAnchor="middle"
        fontSize="12"
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
        x1={x}
        y1={y1}
        x2={extensionToX}
        y2={y1}
        stroke={colour}
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <line
        x1={x}
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
        markerStart="url(#wallplate-arrow)"
        markerEnd="url(#wallplate-arrow)"
      />

      <text
        x={x - 10}
        y={centreY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="700"
        fill={colour}
        transform={`rotate(-90 ${x - 10} ${centreY})`}
      >
        {label}
      </text>
    </>
  );
}

function PointLabel({
  p,
  label,
  dx = 0,
  dy = -9,
  colour = "#111827",
}) {
  return (
    <>
      <circle
        cx={p.x}
        cy={p.y}
        r="4"
        fill={colour}
      />

      <text
        x={p.x + dx}
        y={p.y + dy}
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill={colour}
      >
        {label}
      </text>
    </>
  );
}

export default function HippedWallplateFrontVisualizer({
  internalWidthMM = 0,
  externalWidthMM = 0,

  /*
   * CURRENT APP HIP POSITIONS.
   *
   * These are comparison values ONLY.
   * They DO NOT control the geometry in this visualiser.
   */
  leftHipPositionMM = 0,
  rightHipPositionMM = 0,

  /*
   * AUTHORITATIVE SIDE PITCHES.
   *
   * These now control where E / D and F / G occur.
   */
  leftSidePitchDeg = 0,
  rightSidePitchDeg = 0,

  internalWallplateHeightMM = 0,
  externalWallplateHeightMM = 0,

  wallplateSectionHeightMM = 220,

  /*
   * Validated complete side foot runs.
   */
  leftWallBarFootRunMM = 0,
  rightWallBarFootRunMM = 0,

  /*
   * Validated side VFCs.
   */
  leftWallBarVerticalFootCutMM = 0,
  rightWallBarVerticalFootCutMM = 0,
}) {
  const drawing = useMemo(() => {
    const IW = safeNumber(internalWidthMM);

    const appEW = safeNumber(externalWidthMM);

    const appHPL = safeNumber(
      leftHipPositionMM
    );

    const appHPR = safeNumber(
      rightHipPositionMM
    );

    const leftPitch =
      safeNumber(leftSidePitchDeg);

    const rightPitch =
      safeNumber(rightSidePitchDeg);

    const IWPH = safeNumber(
      internalWallplateHeightMM
    );

    const EWPH = safeNumber(
      externalWallplateHeightMM
    );

    const sectionHeight = safeNumber(
      wallplateSectionHeightMM,
      220
    );

    const HFCL = safeNumber(
      leftWallBarFootRunMM
    );

    const HFCR = safeNumber(
      rightWallBarFootRunMM
    );

    const VFCL = safeNumber(
      leftWallBarVerticalFootCutMM
    );

    const VFCR = safeNumber(
      rightWallBarVerticalFootCutMM
    );

    if (
      IW <= 0 ||
      leftPitch <= 0 ||
      rightPitch <= 0 ||
      IWPH <= 0 ||
      EWPH <= 0 ||
      HFCL <= 0 ||
      HFCR <= 0 ||
      VFCL <= 0 ||
      VFCR <= 0
    ) {
      return null;
    }

    const leftPitchRad =
      degToRad(leftPitch);

    const rightPitchRad =
      degToRad(rightPitch);

    const leftTan =
      Math.tan(leftPitchRad);

    const rightTan =
      Math.tan(rightPitchRad);

    if (
      Math.abs(leftTan) < 0.000001 ||
      Math.abs(rightTan) < 0.000001
    ) {
      return null;
    }

    /*
     * =====================================================
     * BASE POINTS
     * =====================================================
     *
     * LEFT:
     *
     * B = outside bottom of VFC
     * A = top of VFC
     * C = end of HFC / internal foot datum
     *
     * RIGHT:
     *
     * H = internal foot datum
     * I = outside bottom of VFC
     * J = top of VFC
     */

    const Bx = 0;
    const Cx = HFCL;

    const Hx = Cx + IW;

    /*
     * External width is no longer independently imposed on
     * the drawing.
     *
     * It follows directly from:
     *
     * HFC(L) + IW + HFC(R)
     */
    const calculatedEW =
      HFCL + IW + HFCR;

    const Ix = calculatedEW;

    /*
     * =====================================================
     * LEFT WALL-BAR INTERSECTIONS
     * =====================================================
     *
     * A→E is drawn at EXACTLY the requested side pitch.
     *
     * Starting height at A = VFC.
     *
     * Therefore horizontal run A→E is:
     *
     * (EWPH - VFC) / tan(pitch)
     */

    const leftExternalRunMM =
      (EWPH - VFCL) / leftTan;

    const Ex =
      Bx + leftExternalRunMM;

    /*
     * C→D is parallel to A→E and begins at baseline.
     *
     * Therefore:
     *
     * C→D horizontal run =
     * IWPH / tan(pitch)
     */

    const leftInternalRunMM =
      IWPH / leftTan;

    const Dx =
      Cx + leftInternalRunMM;

    /*
     * Hip position is now an OUTPUT.
     *
     * K is the vertical projection of E.
     *
     * HP(L) = C→K
     */
    const calculatedHPL =
      Ex - Cx;

    /*
     * =====================================================
     * RIGHT WALL-BAR INTERSECTIONS
     * =====================================================
     *
     * Mirror of left.
     */

    const rightExternalRunMM =
      (EWPH - VFCR) / rightTan;

    const Fx =
      Ix - rightExternalRunMM;

    const rightInternalRunMM =
      IWPH / rightTan;

    const Gx =
      Hx - rightInternalRunMM;

    /*
     * L is the vertical projection of F.
     *
     * HP(R) = L→H
     */
    const calculatedHPR =
      Hx - Fx;

    /*
     * =====================================================
     * MASTER FINISHED POINTS
     * =====================================================
     */

    const A = point(Bx, VFCL);
    const B = point(Bx, 0);
    const C = point(Cx, 0);

    const D = point(Dx, IWPH);
    const E = point(Ex, EWPH);

    const F = point(Fx, EWPH);
    const G = point(Gx, IWPH);

    const H = point(Hx, 0);
    const I = point(Ix, 0);
    const J = point(Ix, VFCR);

    const K = point(Ex, 0);
    const L = point(Fx, 0);

    /*
     * =====================================================
     * DERIVED FINISHED DIMENSIONS
     * =====================================================
     */

    const EWBSL =
      distance(A, E);

    const IWBSL =
      distance(C, D);

    const EWBSR =
      distance(F, J);

    const IWBSR =
      distance(G, H);

    const EWPL = Math.max(
      0,
      F.x - E.x
    );

    const IWPL = Math.max(
      0,
      G.x - D.x
    );

    /*
     * Comparison only.
     *
     * These show how far the CURRENT app hip positions are
     * from the pitch-derived Timberlite positions.
     */
    const leftHipDifferenceMM =
      appHPL > 0
        ? calculatedHPL - appHPL
        : 0;

    const rightHipDifferenceMM =
      appHPR > 0
        ? calculatedHPR - appHPR
        : 0;

    const externalWidthDifferenceMM =
      appEW > 0
        ? calculatedEW - appEW
        : 0;

    /*
     * =====================================================
     * SVG SCALING
     * =====================================================
     */

    const canvasLeft = 150;
    const canvasRight = 890;
    const floorY = 430;

    const widthScale =
      (canvasRight - canvasLeft) /
      Math.max(calculatedEW, 1);

    const heightScale =
      260 /
      Math.max(EWPH, 1);

    const toSVG = (p) =>
      point(
        canvasLeft +
          p.x * widthScale,

        floorY -
          p.y * heightScale
      );

    const sA = toSVG(A);
    const sB = toSVG(B);
    const sC = toSVG(C);

    const sD = toSVG(D);
    const sE = toSVG(E);

    const sF = toSVG(F);
    const sG = toSVG(G);

    const sH = toSVG(H);
    const sI = toSVG(I);
    const sJ = toSVG(J);

    const sK = toSVG(K);
    const sL = toSVG(L);

    /*
     * Finished physical members ONLY.
     */

    const leftWallBarPoints =
      svgPoints([
        sA,
        sE,
        sD,
        sC,
        sB,
      ]);

    const wallplatePoints =
      svgPoints([
        sE,
        sF,
        sG,
        sD,
      ]);

    const rightWallBarPoints =
      svgPoints([
        sF,
        sJ,
        sI,
        sH,
        sG,
      ]);

    return {
      IW,

      appEW,
      calculatedEW,
      externalWidthDifferenceMM,

      appHPL,
      appHPR,

      calculatedHPL,
      calculatedHPR,

      leftHipDifferenceMM,
      rightHipDifferenceMM,

      HFCL,
      HFCR,

      VFCL,
      VFCR,

      IWPH,
      EWPH,

      EWBSL,
      IWBSL,

      EWBSR,
      IWBSR,

      EWPL,
      IWPL,

      sectionHeight,

      leftPitch,
      rightPitch,

      canvasLeft,
      canvasRight,
      floorY,

      sA,
      sB,
      sC,
      sD,
      sE,
      sF,
      sG,
      sH,
      sI,
      sJ,
      sK,
      sL,

      leftWallBarPoints,
      wallplatePoints,
      rightWallBarPoints,
    };
  }, [
    internalWidthMM,
    externalWidthMM,

    leftHipPositionMM,
    rightHipPositionMM,

    leftSidePitchDeg,
    rightSidePitchDeg,

    internalWallplateHeightMM,
    externalWallplateHeightMM,

    wallplateSectionHeightMM,

    leftWallBarFootRunMM,
    rightWallBarFootRunMM,

    leftWallBarVerticalFootCutMM,
    rightWallBarVerticalFootCutMM,
  ]);

  if (!drawing) {
    return null;
  }

  const {
    IW,

    appEW,
    calculatedEW,
    externalWidthDifferenceMM,

    appHPL,
    appHPR,

    calculatedHPL,
    calculatedHPR,

    leftHipDifferenceMM,
    rightHipDifferenceMM,

    HFCL,
    HFCR,

    VFCL,
    VFCR,

    IWPH,
    EWPH,

    EWBSL,
    IWBSL,

    EWBSR,
    IWBSR,

    EWPL,
    IWPL,

    sectionHeight,

    leftPitch,
    rightPitch,

    canvasLeft,
    canvasRight,
    floorY,

    sA,
    sB,
    sC,
    sD,
    sE,
    sF,
    sG,
    sH,
    sI,
    sJ,
    sK,
    sL,

    leftWallBarPoints,
    wallplatePoints,
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
        Pitch-driven Timberlite wallplate geometry.
        Hip positions and member lengths are calculated
        from the wall-bar intersections.
      </div>

      <svg
        viewBox="0 0 1040 690"
        role="img"
        aria-label="Pitch-driven front elevation of the hipped wallplate"
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

        {/* BASE */}
        <line
          x1={canvasLeft - 30}
          y1={floorY}
          x2={canvasRight + 30}
          y2={floorY}
          stroke="#475569"
          strokeWidth="2"
        />

        <text
          x={(canvasLeft + canvasRight) / 2}
          y={floorY - 8}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#111827"
        >
          BASE
        </text>

        {/* LEFT WALL-BAR */}
        <polygon
          points={leftWallBarPoints}
          fill="#a3e635"
          stroke="#365314"
          strokeWidth="2.5"
        />

        {/* HORIZONTAL WALLPLATE */}
        <polygon
          points={wallplatePoints}
          fill="#fde047"
          stroke="#854d0e"
          strokeWidth="2.5"
        />

        {/* RIGHT WALL-BAR */}
        <polygon
          points={rightWallBarPoints}
          fill="#a3e635"
          stroke="#365314"
          strokeWidth="2.5"
        />

        {/* E→K / F→L pitch-derived hip datums */}
        <line
          x1={sE.x}
          y1={sE.y}
          x2={sK.x}
          y2={sK.y}
          stroke="#059669"
          strokeDasharray="5 5"
        />

        <line
          x1={sF.x}
          y1={sF.y}
          x2={sL.x}
          y2={sL.y}
          stroke="#059669"
          strokeDasharray="5 5"
        />

        {/* POINTS */}
        <PointLabel p={sA} label="A" />
        <PointLabel p={sB} label="B" dy={17} />
        <PointLabel p={sC} label="C" dy={17} />

        <PointLabel p={sD} label="D" dy={17} />
        <PointLabel p={sE} label="E" />

        <PointLabel p={sF} label="F" />
        <PointLabel p={sG} label="G" dy={17} />

        <PointLabel p={sH} label="H" dy={17} />
        <PointLabel p={sI} label="I" dy={17} />
        <PointLabel p={sJ} label="J" />

        <PointLabel
          p={sK}
          label="K"
          dy={17}
          colour="#059669"
        />

        <PointLabel
          p={sL}
          label="L"
          dy={17}
          colour="#059669"
        />

        {/* EWPL */}
        <HorizontalDimension
          x1={sE.x}
          x2={sF.x}
          y={sE.y - 50}
          extensionFromY={sE.y}
          label={`EWPL: ${EWPL.toFixed(0)} mm`}
          colour="#92400e"
        />

        {/* IWPL */}
        <HorizontalDimension
          x1={sD.x}
          x2={sG.x}
          y={sD.y + 55}
          extensionFromY={sD.y}
          label={`IWPL: ${IWPL.toFixed(0)} mm`}
          colour="#7c3aed"
        />

        {/* CALCULATED HIP POSITIONS */}
        <HorizontalDimension
          x1={sC.x}
          x2={sK.x}
          y={floorY + 38}
          extensionFromY={floorY}
          label={`HP (L): ${calculatedHPL.toFixed(
            1
          )} mm`}
          colour="#059669"
        />

        <HorizontalDimension
          x1={sL.x}
          x2={sH.x}
          y={floorY + 38}
          extensionFromY={floorY}
          label={`HP (R): ${calculatedHPR.toFixed(
            1
          )} mm`}
          colour="#059669"
        />

        {/* IW */}
        <HorizontalDimension
          x1={sC.x}
          x2={sH.x}
          y={floorY + 78}
          extensionFromY={floorY}
          label={`IW: ${IW.toFixed(0)} mm`}
          colour="#2563eb"
        />

        {/* EW */}
        <HorizontalDimension
          x1={sB.x}
          x2={sI.x}
          y={floorY + 120}
          extensionFromY={floorY}
          label={`EW: ${calculatedEW.toFixed(1)} mm`}
          colour="#111827"
        />

        {/* HFC */}
        <HorizontalDimension
          x1={sB.x}
          x2={sC.x}
          y={floorY + 164}
          extensionFromY={floorY}
          label={`HFC (L): ${HFCL.toFixed(1)} mm`}
          colour="#b91c1c"
        />

        <HorizontalDimension
          x1={sH.x}
          x2={sI.x}
          y={floorY + 164}
          extensionFromY={floorY}
          label={`HFC (R): ${HFCR.toFixed(1)} mm`}
          colour="#b91c1c"
        />

        {/* HEIGHTS */}
        <VerticalDimension
          x={80}
          y1={sE.y}
          y2={floorY}
          extensionToX={sB.x}
          label={`EWPH: ${EWPH.toFixed(1)} mm`}
          colour="#7c3aed"
        />

        <VerticalDimension
          x={115}
          y1={sD.y}
          y2={floorY}
          extensionToX={sC.x}
          label={`IWPH: ${IWPH.toFixed(1)} mm`}
          colour="#2563eb"
        />

        {/* VFC */}
        <VerticalDimension
          x={135}
          y1={sA.y}
          y2={sB.y}
          extensionToX={sB.x}
          label={`VFC (L): ${VFCL.toFixed(1)} mm`}
          colour="#b91c1c"
        />

        <VerticalDimension
          x={915}
          y1={sJ.y}
          y2={sI.y}
          extensionToX={sI.x}
          label={`VFC (R): ${VFCR.toFixed(1)} mm`}
          colour="#b91c1c"
        />

        {/* WALL-BAR LENGTHS */}
        <text
          x={(sA.x + sE.x) / 2}
          y={(sA.y + sE.y) / 2 - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#365314"
        >
          EWBS (L): {EWBSL.toFixed(0)} mm
        </text>

        <text
          x={(sC.x + sD.x) / 2}
          y={(sC.y + sD.y) / 2 + 22}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#365314"
        >
          IWBS (L): {IWBSL.toFixed(0)} mm
        </text>

        <text
          x={(sF.x + sJ.x) / 2}
          y={(sF.y + sJ.y) / 2 - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#365314"
        >
          EWBS (R): {EWBSR.toFixed(0)} mm
        </text>

        <text
          x={(sG.x + sH.x) / 2}
          y={(sG.y + sH.y) / 2 + 22}
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#365314"
        >
          IWBS (R): {IWBSR.toFixed(0)} mm
        </text>

        {/* PITCHES */}
        <text
          x={sC.x + 55}
          y={floorY - 12}
          fontSize="12"
          fontWeight="800"
          fill="#b91c1c"
        >
          Pitch: {leftPitch.toFixed(2)}°
        </text>

        <text
          x={sH.x - 55}
          y={floorY - 12}
          textAnchor="end"
          fontSize="12"
          fontWeight="800"
          fill="#b91c1c"
        >
          Pitch: {rightPitch.toFixed(2)}°
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

          <div>
            Pitch: {leftPitch.toFixed(2)}°
          </div>

          <div>
            HFC: {HFCL.toFixed(1)} mm
          </div>

          <div>
            VFC: {VFCL.toFixed(1)} mm
          </div>

          <div>
            Calculated HP:{" "}
            {calculatedHPL.toFixed(1)} mm
          </div>

          <div>
            EWBS: {EWBSL.toFixed(1)} mm
          </div>

          <div>
            IWBS: {IWBSL.toFixed(1)} mm
          </div>
        </div>

        <div
          style={{
            padding: 10,
            border: "1px solid #fde68a",
            borderRadius: 8,
            background: "#ffffff",
          }}
        >
          <b>Horizontal wallplate</b>

          <div>
            EWPL: {EWPL.toFixed(1)} mm
          </div>

          <div>
            IWPL: {IWPL.toFixed(1)} mm
          </div>

          <div>
            EWPH: {EWPH.toFixed(1)} mm
          </div>

          <div>
            IWPH: {IWPH.toFixed(1)} mm
          </div>

          <div>
            Nominal joist depth:{" "}
            {sectionHeight.toFixed(1)} mm
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

          <div>
            Pitch: {rightPitch.toFixed(2)}°
          </div>

          <div>
            HFC: {HFCR.toFixed(1)} mm
          </div>

          <div>
            VFC: {VFCR.toFixed(1)} mm
          </div>

          <div>
            Calculated HP:{" "}
            {calculatedHPR.toFixed(1)} mm
          </div>

          <div>
            EWBS: {EWBSR.toFixed(1)} mm
          </div>

          <div>
            IWBS: {IWBSR.toFixed(1)} mm
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
          <b>Comparison with current app</b>

          <div>
            Pitch-derived EW:{" "}
            {calculatedEW.toFixed(1)} mm
          </div>

          <div>
            Current app EW:{" "}
            {appEW.toFixed(1)} mm
          </div>

          <div>
            EW difference:{" "}
            {externalWidthDifferenceMM >= 0
              ? "+"
              : ""}
            {externalWidthDifferenceMM.toFixed(1)} mm
          </div>

          <div style={{ marginTop: 6 }}>
            Pitch-derived HP (L):{" "}
            {calculatedHPL.toFixed(1)} mm
          </div>

          <div>
            Current app HP (L):{" "}
            {appHPL.toFixed(1)} mm
          </div>

          <div>
            Difference (L):{" "}
            {leftHipDifferenceMM >= 0
              ? "+"
              : ""}
            {leftHipDifferenceMM.toFixed(1)} mm
          </div>

          <div style={{ marginTop: 6 }}>
            Pitch-derived HP (R):{" "}
            {calculatedHPR.toFixed(1)} mm
          </div>

          <div>
            Current app HP (R):{" "}
            {appHPR.toFixed(1)} mm
          </div>

          <div>
            Difference (R):{" "}
            {rightHipDifferenceMM >= 0
              ? "+"
              : ""}
            {rightHipDifferenceMM.toFixed(1)} mm
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 11,
          borderLeft: "4px solid #059669",
          background: "#ffffff",
          fontSize: 13,
        }}
      >
        <strong>
          Side pitch is now authoritative.
        </strong>

        <div style={{ marginTop: 4 }}>
          The visualiser no longer uses the existing hip
          positions to construct the wallplate. Points E, D,
          F and G are found from the required side pitches and
          wallplate heights. The resulting hip positions,
          wall-bar lengths and horizontal-wallplate lengths
          are outputs.
        </div>
      </div>
    </section>
  );
}