// src/lib/Manufacturing/rafterLayoutBuilder.js

// Global minimum default centre spacing used when
// automatically laying out rafters.
//
// This is a DEFAULT layout rule, not an immutable
// structural restriction. Admin overrides may later
// deliberately move rafters closer where appropriate.
const MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM = 300;

// ======================================================
// DEFAULT FRONT-FACET RAFTER LAYOUT
//
// Geometry determines the boss positions.
// This function generates the DEFAULT rafter layout.
//
// Important:
// These positions are recommendations, not immutable
// structural geometry. Individual rafters can later be
// moved by an admin for vents, glass units, symmetry etc.
// ======================================================

export const buildDefaultFrontRafterLayout = ({
  widthMM,
  leftBossXMM,
  rightBossXMM,
  hasLeftHip,
  hasRightHip,
  spacingMM = 665,
}) => {
  const width = Math.max(0, Number(widthMM) || 0);
  const spacing = Math.max(1, Number(spacingMM) || 665);

  const leftBoss = hasLeftHip
    ? Math.max(0, Number(leftBossXMM) || 0)
    : 0;

  const rightBoss = hasRightHip
    ? Math.min(
        width,
        Number(rightBossXMM) || width
      )
    : width;

  const leftJackRafters = [];
  const centreRafters = [];
  const rightJackRafters = [];

  /*
   * ----------------------------------------------------
   * LEFT FRONT TRIANGLE
   *
   * Work OUTWARDS from the left boss at 665 centres.
   * The boss itself is a separate default full rafter.
   * ----------------------------------------------------
   */

  if (hasLeftHip) {
    for (
      let centreMM = leftBoss - spacing;
      centreMM >= MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM;
      centreMM -= spacing
    ) {
      leftJackRafters.push({
        id: `front-left-jack-${Math.round(centreMM)}`,
        facet: "front",
        zone: "left-jack",
        role: "jack",
        defaultCentreMM: centreMM,
        centreMM,
        isManuallyMoved: false,
      });
    }

    leftJackRafters.sort(
      (a, b) => a.centreMM - b.centreMM
    );
  }

  /*
   * ----------------------------------------------------
   * BOSS RAFTERS
   *
   * Default position = exact boss position.
   *
   * These are deliberately NOT treated as immutable.
   * Later an admin override may move them if required.
   * ----------------------------------------------------
   */

  if (hasLeftHip) {
    centreRafters.push({
      id: "front-left-boss-rafter",
      facet: "front",
      zone: "centre",
      role: "boss-rafter",

      defaultCentreMM: leftBoss,
      centreMM: leftBoss,

      bossSide: "left",

      isDefaultBossAligned: true,
      isManuallyMoved: false,
    });
  }

  /*
   * ----------------------------------------------------
   * CENTRE PLAIN-RAFTER ZONE
   *
   * Work inward from both boss boundaries at the normal
   * Timberlite spacing and intelligently resolve the
   * remaining centre bay.
   *
   * These remain DEFAULT positions only and can later
   * be manually moved by an admin.
   * ----------------------------------------------------
   */

  const centreZoneStart = leftBoss;
  const centreZoneEnd = rightBoss;

  const centreZoneWidth = Math.max(
    0,
    centreZoneEnd - centreZoneStart
  );

  const DISTANCE_TOLERANCE_MM = 1;

  if (centreZoneWidth > 0) {
    const centreRafterMM =
      centreZoneStart +
      centreZoneWidth / 2;

    const leftCandidates = [];
    const rightCandidates = [];

    /*
     * Work INWARDS from the LEFT boss at 665 centres.
     * Only generate positions on the left-hand side
     * of the centre datum.
     */

    for (
      let centreMM = centreZoneStart + spacing;
      centreMM <
        centreRafterMM - DISTANCE_TOLERANCE_MM;
      centreMM += spacing
    ) {
      leftCandidates.push(centreMM);
    }

    /*
     * Work INWARDS from the RIGHT boss at 665 centres.
     * Only generate positions on the right-hand side
     * of the centre datum.
     */

    for (
      let centreMM = centreZoneEnd - spacing;
      centreMM >
        centreRafterMM + DISTANCE_TOLERANCE_MM;
      centreMM -= spacing
    ) {
      rightCandidates.push(centreMM);
    }

    rightCandidates.sort((a, b) => a - b);

    const nearestLeftMM =
      leftCandidates.length > 0
        ? leftCandidates[leftCandidates.length - 1]
        : null;

    const nearestRightMM =
      rightCandidates.length > 0
        ? rightCandidates[0]
        : null;

    /*
     * Resolve the middle.
     *
     * <300 mm:
     * Remove the cramped pair and insert one centre rafter.
     *
     * >normal spacing:
     * Insert a centre rafter to split the oversized bay.
     *
     * 300 mm to normal spacing:
     * Leave the remaining bay alone.
     */

    let addCentreRafter = false;

    if (
      nearestLeftMM !== null &&
      nearestRightMM !== null
    ) {
      const middleGapMM =
        nearestRightMM - nearestLeftMM;

      if (
        middleGapMM <
        MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM
      ) {
        leftCandidates.pop();
        rightCandidates.shift();

        addCentreRafter = true;
      } else if (middleGapMM > spacing) {
        addCentreRafter = true;
      }
    } else {
      /*
       * If there aren't candidates on both sides,
       * use one centre rafter provided it has sensible
       * clearance from both boss rafters.
       */
      const centreToLeftBossMM =
        centreRafterMM - centreZoneStart;

      const centreToRightBossMM =
        centreZoneEnd - centreRafterMM;

      if (
        centreToLeftBossMM >=
          MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM &&
        centreToRightBossMM >=
          MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM
      ) {
        addCentreRafter = true;
      }
    }

    /*
     * Add LEFT candidates.
     */
    leftCandidates.forEach((centreMM) => {
      centreRafters.push({
        id: `front-centre-left-${Math.round(
          centreMM
        )}`,

        facet: "front",
        zone: "centre",
        role: "plain",

        defaultCentreMM: centreMM,
        centreMM,

        isManuallyMoved: false,
      });
    });

    /*
     * Add centre rafter if required.
     */
    if (addCentreRafter) {
      centreRafters.push({
        id: `front-centre-middle-${Math.round(
          centreRafterMM
        )}`,

        facet: "front",
        zone: "centre",
        role: "plain",

        defaultCentreMM: centreRafterMM,
        centreMM: centreRafterMM,

        isManuallyMoved: false,
      });
    }

    /*
     * Add RIGHT candidates.
     */
    rightCandidates.forEach((centreMM) => {
      centreRafters.push({
        id: `front-centre-right-${Math.round(
          centreMM
        )}`,

        facet: "front",
        zone: "centre",
        role: "plain",

        defaultCentreMM: centreMM,
        centreMM,

        isManuallyMoved: false,
      });
    });
  }

  if (hasRightHip) {
    centreRafters.push({
      id: "front-right-boss-rafter",
      facet: "front",
      zone: "centre",
      role: "boss-rafter",

      defaultCentreMM: rightBoss,
      centreMM: rightBoss,

      bossSide: "right",

      isDefaultBossAligned: true,
      isManuallyMoved: false,
    });
  }

  /*
   * ----------------------------------------------------
   * RIGHT FRONT TRIANGLE
   *
   * Mirror of left:
   * work OUTWARDS from the right boss at 665 centres.
   * ----------------------------------------------------
   */

  if (hasRightHip) {
    for (
      let centreMM = rightBoss + spacing;
      centreMM <=
        width - MIN_DEFAULT_RAFTER_CENTRE_SPACING_MM;
      centreMM += spacing
    ) {
      rightJackRafters.push({
        id: `front-right-jack-${Math.round(centreMM)}`,
        facet: "front",
        zone: "right-jack",
        role: "jack",

        defaultCentreMM: centreMM,
        centreMM,

        isManuallyMoved: false,
      });
    }
  }

  centreRafters.sort(
    (a, b) => a.centreMM - b.centreMM
  );

  const allRafters = [
    ...leftJackRafters,
    ...centreRafters,
    ...rightJackRafters,
  ].sort(
    (a, b) => a.centreMM - b.centreMM
  );

  return {
    spacingMM: spacing,

    leftBossXMM: leftBoss,
    rightBossXMM: rightBoss,

    centreZoneStartMM: centreZoneStart,
    centreZoneEndMM: centreZoneEnd,
    centreZoneWidthMM: centreZoneWidth,

    leftJackRafters,
    centreRafters,
    rightJackRafters,

    allRafters,

    leftJackCount: leftJackRafters.length,

    bossRafterCount:
      centreRafters.filter(
        (rafter) =>
          rafter.role === "boss-rafter"
      ).length,

    plainRafterCount:
      centreRafters.filter(
        (rafter) =>
          rafter.role === "plain"
      ).length,

    rightJackCount: rightJackRafters.length,

    totalRafterCount: allRafters.length,
  };
};