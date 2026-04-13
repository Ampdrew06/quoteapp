// src/lib/roofMath.js
// Re-usable helpers for tiles/laths & roof fittings (slope-aware)

/** Normalise mm numbers */
export const mm = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

/** mm → metres */
export const toM = (mmVal) => mm(mmVal) / 1000;

/** Ceil helpers */
export const ceil = (n) => Math.ceil(Number(n) || 0);
export const ceilDiv = (a, b) => {
  const den = mm(b) || 1; // avoid /0
  return Math.ceil(mm(a) / den);
};

/** Degrees ↔ Radians */
export const deg2rad = (deg) => (Number(deg) * Math.PI) / 180;

/**
 * Compute **slope length** from plan projection and pitch.
 * If pitch is missing, falls back to projection (best-effort).
 * @param {object} p
 * @param {number} p.projection_mm - plan distance wall→eaves (mm)
 * @param {number} [p.pitch_deg]   - roof pitch in degrees
 * @param {number} [p.pitch_rad]   - alternative radians input
 * @returns {number} slope length in mm
 */
// Count tile courses along the slope
// Return slope length (mm) from plan projection (mm) and pitch (deg)
export function slopeLength({ projection_mm, pitch_deg }) {
  const proj = mm(projection_mm);
  const theta = deg2rad(pitch_deg || 0);
  return proj / Math.cos(theta);
}

export function courseCount({
  gauge_mm,
  slope_mm,
  projection_mm,       // ignored if slope_mm is provided
  pitch_deg,           // ignored if slope_mm is provided
  eaves_overhang_mm = 0,
}) {
  const gauge = mm(gauge_mm) || 250;

  // Use slope if provided; otherwise derive from projection + pitch
  const slope = mm(slope_mm) > 0
    ? mm(slope_mm)
    : slopeLength({ projection_mm, pitch_deg });

  // If you want to include a little eaves allowance, add it here.
  const effectiveSlope = slope; // + mm(eaves_overhang_mm);

  // No +1 fudge — ceil gives the right number of courses
  return Math.max(1, Math.ceil(effectiveSlope / gauge));
}

/**
 * Courses = how many tile rows from eaves to top **along the slope**.
 * Gauge is along-slope cover per course (Britmet ≈ 250 mm).
 * If only projection is available, we convert it using pitch to slope.
 *
 * @param {object} p
 * @param {number} p.gauge_mm                  - along-slope cover per course
 * @param {number} [p.slope_mm]               - slope distance eaves→top (excl. overhang)
 * @param {number} [p.projection_mm]          - plan projection; used to derive slope if slope_mm not given
 * @param {number} [p.pitch_deg]              - pitch in degrees (or provide pitch_rad)
 * @param {number} [p.pitch_rad]              - pitch in radians
 * @param {number} [p.eaves_overhang_mm=50]   - eaves overhang (measured horizontally)
 * @returns {number} course count (integer)
 */


/**
 * Tiles per course across the eaves/front run.
 * @param {object} p
 * @param {number} p.run_mm - overall roof length along eaves
 * @param {number} p.cover_width_mm - effective horizontal cover of one tile (Britmet ≈ 1231 mm)
 */
export function tilesPerCourse({ run_mm, cover_width_mm }) {
  return ceilDiv(mm(run_mm), mm(cover_width_mm) || 1);
}

/**
 * Generic piece count for linear ancillaries (verge, eaves guard, watercourse).
 * @param {object} p
 * @param {number} p.run_mm - length to be covered (mm)
 * @param {number} p.piece_cover_mm - effective cover per piece (mm)
 */
export function pieceCount({ run_mm, piece_cover_mm }) {
  return ceilDiv(mm(run_mm), mm(piece_cover_mm) || 1);
}

/**
 * Side-edge parts for a lean-to side, **slope-aware**.
 * sideType: 'exposed' → 2-Part Barge (verge)
 *           'wall'    → Watercourse
 * Provide either slope_mm (preferred) or projection_mm + pitch to derive slope.
 */
export function sideEdgeParts({
  sideType,
  slope_mm,
  projection_mm,
  pitch_deg,
  pitch_rad,
  covers, // { verge, watercourse }
}) {
  const slope =
    mm(slope_mm) > 0
      ? mm(slope_mm)
      : slopeLength({ projection_mm, pitch_deg, pitch_rad });

  if (slope <= 0) return { vergePieces: 0, watercoursePieces: 0 };

  if (sideType === "exposed") {
    return {
      vergePieces: pieceCount({ run_mm: slope, piece_cover_mm: covers.verge }),
      watercoursePieces: 0,
    };
  }
  if (sideType === "wall") {
    return {
      vergePieces: 0,
      watercoursePieces: pieceCount({
        run_mm: slope,
        piece_cover_mm: covers.watercourse,
      }),
    };
  }
  return { vergePieces: 0, watercoursePieces: 0 };
}

/** Money helpers */
export const money = (n) => Number(((Number(n) || 0).toFixed(2)));
export const lineTotal = (qty, price) => money((Number(qty) || 0) * (Number(price) || 0));

/**
 * Polygon area (shoelace). Points in mm; returns area in mm² (always positive).
 * Useful for future roof styles when tiling area is derived geometrically.
 * @param {Array<[number,number]>} pts
 */
export function polygonAreaMM2(pts = []) {
  const n = Array.isArray(pts) ? pts.length : 0;
  if (n < 3) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    s += mm(x1) * mm(y2) - mm(y1) * mm(x2);
  }
  return Math.abs(s / 2);
}

/** Convert mm² to m² */
export const mm2ToM2 = (mm2) => mm(mm2) / 1_000_000;
