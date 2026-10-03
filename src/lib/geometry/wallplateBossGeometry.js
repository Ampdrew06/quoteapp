const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

/** Boss centre B is the midpoint of an equal-depth wallplate mitre.
 * Rise is underside-wallplate height above the wallbar's internal foot.
 * B = rise / tan(pitch) - depth / 2 * tan(pitch / 2).
 * An explicit side pitch moves B; otherwise B determines the side pitch.
 */
export function calculateWallplateBossGeometry({
  riseMM, memberDepthMM, bossCentrePositionMM, requestedSidePitchDeg = null,
} = {}) {
  const rise = finite(riseMM), depth = finite(memberDepthMM);
  const requested = finite(requestedSidePitchDeg);
  let centre = finite(bossCentrePositionMM);
  const pitchDriven = requested > 0;
  if (rise <= 0 || depth <= 0 || (pitchDriven ? requested >= 90 : centre <= 0)) {
    return { valid: false, pitchDeg: 0, bossCentrePositionMM: 0 };
  }
  // Rationalized positive root avoids subtracting two nearly equal values.
  const halfTangent = pitchDriven
    ? Math.tan(requested * Math.PI / 360)
    : rise / (Math.sqrt(centre * centre + rise * (rise + depth)) + centre);
  const pitch = 2 * Math.atan(halfTangent);
  if (pitchDriven) centre = rise / Math.tan(pitch) - depth * halfTangent / 2;
  const offset = depth * halfTangent / 2;
  return {
    valid: centre > 0 && Number.isFinite(centre),
    pitchDriven,
    pitchDeg: pitch * 180 / Math.PI,
    bossCentrePositionMM: centre,
    topPositionMM: centre - offset,
    bottomPositionMM: centre + offset,
    halfMitreOffsetMM: offset,
  };
}

// Old D/O defaults rounded projection / 2 to whole mm. Restore the exact
// half-mm default without changing other explicit setting-out distances.
export function resolveDefaultBossPositionMM(value, projectionMM) {
  const projection = finite(projectionMM);
  const supplied = finite(value);
  const half = projection / 2;
  return supplied <= 0 || supplied === Math.round(half) ? half : supplied;
}
