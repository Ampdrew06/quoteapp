// src/lib/geometry/leanToGeometry.js

import {
  computeLeanToManufactureGeometry,
} from "../leanToManufactureGeometry";

import {
  buildFacet,
} from "../Manufacturing/facetBuilder";

import {
  resolveEdgeSupport,
  resolveTwoSidedExternalWidth,
} from "./supportGeometry";

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

export function calculateLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,

  /*
   * Optional boundary conditions.
   *
   * Existing callers do not yet provide these, so their
   * present behaviour remains unchanged.
   */
  leftWall = false,
  rightWall = false,

  leftSupportDepthMM,
  rightSupportDepthMM,

  leftOverhangMM = 0,
  rightOverhangMM = 0,

  /*
   * Finished tile overhang into the gutter.
   */
  tileOverhangMM = 50,
}) {
  const internalWidthMM = Math.max(
    0,
    finiteNumber(widthMM)
  );

  const internalProjectionMM = Math.max(
    0,
    finiteNumber(projectionMM)
  );

  const resolvedPitchDeg =
    finiteNumber(pitchDeg);

  const geom =
    computeLeanToManufactureGeometry({
      internalProjectionMM,
      pitchDeg: resolvedPitchDeg,
      soffitDepthMM,

      frameThicknessMM: Number(
        materials?.side_frame_thickness_mm ??
        70
      ),

      wallplateThicknessMM: Number(
        materials?.wallplate_thickness_mm ??
        63
      ),
    });

  const defaultSupportDepthMM = Math.max(
    0,
    finiteNumber(
      materials?.side_frame_thickness_mm,
      70
    )
  );

  const fasciaLipMM = Math.max(
    0,
    finiteNumber(
      materials?.fascia_lip_mm,
      25
    )
  );

  const leftSupport = resolveEdgeSupport({
    type: leftWall ? "wall" : "frame",

    depthMM:
      leftSupportDepthMM ??
      defaultSupportDepthMM,

    defaultDepthMM:
      defaultSupportDepthMM,
  });

  const rightSupport = resolveEdgeSupport({
    type: rightWall ? "wall" : "frame",

    depthMM:
      rightSupportDepthMM ??
      defaultSupportDepthMM,

    defaultDepthMM:
      defaultSupportDepthMM,
  });

  const externalWidthResult =
    resolveTwoSidedExternalWidth({
      internalWidthMM,

      leftSupport,
      rightSupport,

      leftOverhangMM:
        Math.max(
          0,
          finiteNumber(leftOverhangMM)
        ),

      rightOverhangMM:
        Math.max(
          0,
          finiteNumber(rightOverhangMM)
        ),

      fasciaLipMM,
    });

  const frameOnMM = Math.max(
    0,
    finiteNumber(
      materials?.frame_on_mm,
      70
    )
  );

  const resolvedTileOverhangMM = Math.max(
    0,
    finiteNumber(tileOverhangMM, 50)
  );

  const finishedHorizontalTileRunMM =
    internalProjectionMM +
    geom.effectiveSoffitMM +
    frameOnMM +
    resolvedTileOverhangMM;

  const pitchRadians =
    resolvedPitchDeg *
    Math.PI /
    180;

  const cosine =
    Math.cos(pitchRadians);

  const finishedTileSlopeMM =
    cosine > 0
      ? finishedHorizontalTileRunMM /
        cosine
      : 0;

  const externalTileWidthMM =
    externalWidthResult.externalWidthMM;

  const mainFacet = buildFacet({
    id: "facet-main",
    label: "Main Roof Facet",

    exists:
      internalWidthMM > 0 &&
      internalProjectionMM > 0 &&
      resolvedPitchDeg > 0,

    internalEavesLengthMM:
      internalWidthMM,

    externalEavesLengthMM:
      externalTileWidthMM,

    internalSlopeLengthMM:
      geom.internalRafterLengthMM,

    /*
     * Structural external slope remains separate from the
     * finished tiled slope containing the 50 mm overhang.
     */
    externalSlopeLengthMM:
      geom.totalRafterLengthMM,

    pitchDeg:
      resolvedPitchDeg,

    planAreaM2:
      (
        externalTileWidthMM *
        finishedHorizontalTileRunMM
      ) /
      1_000_000,

    roofAreaM2:
      (
        externalTileWidthMM *
        finishedTileSlopeMM
      ) /
      1_000_000,

    tilingGeometry: {
      baseWidthMM:
        externalTileWidthMM,

      topWidthMM:
        externalTileWidthMM,

      heightMM:
        finishedTileSlopeMM,

      outline: [
        {
          xMM: 0,
          yMM: 0,
        },
        {
          xMM: externalTileWidthMM,
          yMM: 0,
        },
        {
          xMM: externalTileWidthMM,
          yMM: finishedTileSlopeMM,
        },
        {
          xMM: 0,
          yMM: finishedTileSlopeMM,
        },
      ],
    },

    openings: [],

    hasRingBeam: true,

    ringBeamLengthMM:
      externalTileWidthMM,
  });

  return {
    // Existing shared names remain unchanged.
    rafterExternalLength:
      geom.fullProjectionRafterLengthMM,

    rafterInternalLength:
      geom.internalRafterLengthMM,

    externalSlopeLength:
      geom.fullProjectionRafterLengthMM,

    plumbCutHeight:
      geom.plumbCutHeightMM,

    fasciaHeight:
      geom.finishedFasciaHeightMM,

    fasciaAlignmentDatum:
      geom.finishedFasciaAlignmentDatumMM,

    fasciaOrderSize:
      geom.fasciaOrderSizeMM,

    soffitDepthEffective:
      geom.effectiveSoffitMM,

    /*
     * New universal facet outputs.
     */
    facets:
      mainFacet.exists
        ? [mainFacet]
        : [],

    mainFacet,

    tilingGeometry: {
      externalTileWidthMM,
      finishedHorizontalTileRunMM,
      finishedTileSlopeMM,

      tileOverhangMM:
        resolvedTileOverhangMM,

      leftAllowanceMM:
        externalWidthResult.leftAllowanceMM,

      rightAllowanceMM:
        externalWidthResult.rightAllowanceMM,
    },

    // Existing detailed helper output remains available.
    raw: geom,
  };
}