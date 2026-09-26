const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const degToRad = (degrees) =>
  (toFiniteNumber(degrees) * Math.PI) / 180;

/**
 * Resolve the equal mitre between two members of the same depth.
 *
 * Both workshop saw settings are measured away from a square cut. The
 * external wallbar endpoint remains authoritative; the internal wallbar
 * endpoint and the horizontal wallplate lower edge are derived from the
 * shared angle-bisecting cut.
 */
export function calculateWallplateMitreGeometry({
  sidePitchDeg,
  memberDepthMM,
  wallbarExternalSlopeMM = 0,
  wallbarHorizontalFootCutMM = 0,
  wallbarVerticalFootCutMM = 0,
} = {}) {
  const pitchDeg = Math.max(0, toFiniteNumber(sidePitchDeg));
  const memberDepth = Math.max(0, toFiniteNumber(memberDepthMM));
  const externalSlope = Math.max(
    0,
    toFiniteNumber(wallbarExternalSlopeMM)
  );
  const hfc = Math.max(0, toFiniteNumber(wallbarHorizontalFootCutMM));
  const vfc = Math.max(0, toFiniteNumber(wallbarVerticalFootCutMM));

  const mitreOffSquareDeg = pitchDeg / 2;
  const pitchRad = degToRad(pitchDeg);
  const mitreRad = degToRad(mitreOffSquareDeg);
  const mitreOffsetMM = memberDepth * Math.tan(mitreRad);
  const cutFaceLengthMM =
    Math.cos(mitreRad) > 0
      ? memberDepth / Math.cos(mitreRad)
      : 0;

  // Station of the external top endpoint measured from the internal foot C
  // along the wallbar direction. A is offset from C by (-HFC, VFC).
  const externalEndpointStationMM =
    externalSlope -
    hfc * Math.cos(pitchRad) +
    vfc * Math.sin(pitchRad);

  const wallbarInternalSlopeMM = Math.max(
    0,
    externalEndpointStationMM - mitreOffsetMM
  );

  return {
    sidePitchDeg: pitchDeg,
    wallbarTopCutOffSquareDeg: mitreOffSquareDeg,
    horizontalWallplateCutOffSquareDeg: mitreOffSquareDeg,
    mitreOffsetMM,
    cutFaceLengthMM,
    wallbarInternalSlopeMM,
  };
}

