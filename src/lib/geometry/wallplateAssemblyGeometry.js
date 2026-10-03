const finite = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * Finished wallplate assembly, in mm from the left INTERNAL frame line
 * and the factory floor. Each wallbar starts on the ring-beam top.
 * Joint A = top endpoint; B = centre; C = bottom endpoint.
 * These are assembly coordinates, separate from the roof's plan hip datum.
 */
export function calculateWallplateAssemblyGeometry({
  internalWidthMM,
  memberDepthMM,
  ringBeamHeightMM = 40,
  externalWallplateHeightMM,
  left = null,
  right = null,
} = {}) {
  const width = finite(internalWidthMM);
  const depth = finite(memberDepthMM);
  const floor = finite(ringBeamHeightMM);
  const topHeight = finite(externalWallplateHeightMM);
  const bottomHeight = topHeight - depth;
  const buildSide = (input, mirrored) => {
    if (!input) return null;
    const pitchDeg = finite(input.pitchDeg);
    const pitch = pitchDeg * Math.PI / 180;
    const slope = finite(input.externalSlopeMM);
    const hfc = finite(input.horizontalFootCutMM);
    const vfc = finite(input.verticalFootCutMM);
    if (pitchDeg <= 0 || pitchDeg >= 90 || slope <= 0 || hfc <= 0 || vfc <= 0) {
      return { valid: false };
    }
    const inwardTop = -hfc + slope * Math.cos(pitch);
    const topY = floor + vfc + slope * Math.sin(pitch);
    const mitreOffsetMM = depth * Math.tan(pitch / 2);
    const inwardBottom = inwardTop + mitreOffsetMM;
    const x = (inward) => mirrored ? width - inward : inward;
    const A = { xMM: x(inwardTop), yMM: topY };
    const C = { xMM: x(inwardBottom), yMM: topY - depth };
    const B = { xMM: (A.xMM + C.xMM) / 2, yMM: (A.yMM + C.yMM) / 2 };
    const externalFoot = { xMM: x(-hfc), yMM: floor + vfc };
    const internalFoot = { xMM: x(0), yMM: floor };
    // Independent checks: both manufactured edges must land on the
    // horizontal member at its specified height, at the requested pitch.
    const internalRun = inwardBottom;
    const internalHeightErrorMM = C.yMM - floor - internalRun * Math.tan(pitch);
    const topHeightErrorMM = topY - topHeight;
    return {
      valid: Math.abs(topHeightErrorMM) < 0.01 && Math.abs(internalHeightErrorMM) < 0.01,
      pitchDeg, A, B, C, externalFoot, internalFoot,
      topPositionMM: inwardTop,
      bossCentrePositionMM: (inwardTop + inwardBottom) / 2,
      bottomPositionMM: inwardBottom,
      externalSlopeMM: slope,
      internalSlopeMM: Math.hypot(internalRun, C.yMM - floor),
      mitreOffsetMM, topHeightErrorMM, internalHeightErrorMM,
    };
  };
  const leftSide = buildSide(left, false);
  const rightSide = buildSide(right, true);
  const topLeft = leftSide?.A?.xMM ?? 0;
  const topRight = rightSide?.A?.xMM ?? width;
  const bottomLeft = leftSide?.C?.xMM ?? 0;
  const bottomRight = rightSide?.C?.xMM ?? width;
  const externalLengthMM = topRight - topLeft;
  const internalLengthMM = bottomRight - bottomLeft;
  return {
    valid: width > 0 && depth > 0 && floor >= 0 && bottomHeight > floor &&
      (!left || Boolean(leftSide?.valid)) && (!right || Boolean(rightSide?.valid)) &&
      externalLengthMM > 0 && internalLengthMM > 0,
    internalWidthMM: width, memberDepthMM: depth, ringBeamHeightMM: floor,
    topHeightMM: topHeight, bottomHeightMM: bottomHeight,
    left: leftSide, right: rightSide,
    externalLengthMM, internalLengthMM,
    horizontal: {
      topLeft: { xMM: topLeft, yMM: topHeight },
      topRight: { xMM: topRight, yMM: topHeight },
      bottomLeft: { xMM: bottomLeft, yMM: bottomHeight },
      bottomRight: { xMM: bottomRight, yMM: bottomHeight },
    },
  };
}
