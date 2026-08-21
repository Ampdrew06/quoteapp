// src/lib/geometry/supportGeometry.js

const finite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Resolve one perimeter support.
 *
 * This module is deliberately roof-style independent.
 *
 * Examples:
 *
 * frame:
 *   { type: "frame", depthMM: 70 }
 *
 * brickwork:
 *   { type: "brickwork", depthMM: 100 }
 *
 * wall:
 *   { type: "wall", depthMM: null }
 *
 * A wall has no external allowance. Its physical wall
 * thickness is not treated as zero; it is simply irrelevant
 * to the external roof extension on that boundary.
 */
export function resolveEdgeSupport({
  type = "frame",
  depthMM,
  defaultDepthMM = 70,
} = {}) {
  const resolvedType =
    String(type || "frame").toLowerCase();

  if (resolvedType === "wall") {
    return {
      type: "wall",
      depthMM: null,
      isWall: true,
    };
  }

  const resolvedDepthMM = Math.max(
    0,
    finite(depthMM, finite(defaultDepthMM, 70))
  );

  return {
    type: resolvedType,
    depthMM: resolvedDepthMM,
    isWall: false,
  };
}

/**
 * Calculate the amount by which one roof boundary extends
 * beyond the internal roof datum.
 *
 * Existing Timberlite Lean-To rule:
 *
 * wall:
 *   0
 *
 * exposed/support edge with explicit overhang:
 *   support depth + overhang
 *
 * exposed/support edge without explicit overhang:
 *   support depth + fascia lip
 */
export function calculateEdgeExternalAllowanceMM({
  support,
  overhangMM = 0,
  fasciaLipMM = 25,
} = {}) {
  const resolvedSupport =
    support ||
    resolveEdgeSupport();

  if (resolvedSupport.isWall) {
    return 0;
  }

  const supportDepthMM =
    Math.max(
      0,
      finite(resolvedSupport.depthMM, 70)
    );

  const overhang =
    Math.max(0, finite(overhangMM));

  const fasciaLip =
    Math.max(0, finite(fasciaLipMM, 25));

  return (
    supportDepthMM +
    (overhang > 0
      ? overhang
      : fasciaLip)
  );
}

/**
 * Resolve a simple two-sided roof width.
 *
 * This is useful immediately for Lean-To roofs, but the
 * individual edge-support functions above are intentionally
 * generic so future multi-facet roofs do not depend on this
 * particular shape.
 */
export function resolveTwoSidedExternalWidth({
  internalWidthMM = 0,

  leftSupport,
  rightSupport,

  leftOverhangMM = 0,
  rightOverhangMM = 0,

  fasciaLipMM = 25,
} = {}) {
  const iw =
    Math.max(
      0,
      finite(internalWidthMM)
    );

  const leftAllowanceMM =
    calculateEdgeExternalAllowanceMM({
      support: leftSupport,
      overhangMM: leftOverhangMM,
      fasciaLipMM,
    });

  const rightAllowanceMM =
    calculateEdgeExternalAllowanceMM({
      support: rightSupport,
      overhangMM: rightOverhangMM,
      fasciaLipMM,
    });

  return {
    internalWidthMM: iw,

    leftSupport,
    rightSupport,

    leftAllowanceMM,
    rightAllowanceMM,

    externalWidthMM:
      iw +
      leftAllowanceMM +
      rightAllowanceMM,
  };
}