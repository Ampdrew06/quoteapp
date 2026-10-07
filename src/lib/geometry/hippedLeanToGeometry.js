import {buildCentralBossDesign} from './centralBossDesign';
import { alignChamferedLathEaves } from "./alignChamferedLathEaves";
import { applyRectangularRingBeamJoints } from '../Manufacturing/rectangularRingBeamJoints';
// src/lib/geometry/HippedLeanToGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";
import { computeHipManufactureGeometry } from "./hipManufactureGeometry";
import { calculateHipManufactureGeometryV2 } from "./hipManufactureGeometryV2";
import { buildFacet } from "../Manufacturing/facetBuilder";
import { solveFacetEavesGeometry } from "./facetEavesGeometry";
import { buildFacetGeometry } from "../Manufacturing/facetGeometryBuilder";
import { buildDefaultFrontRafterLayout } from "../Manufacturing/rafterLayoutBuilder";
import { calculateWallplateMitreGeometry } from "./wallplateMitreGeometry";
import { calculateWallplateAssemblyGeometry } from "./wallplateAssemblyGeometry";
import { calculateWallplateBossGeometry, resolveDefaultBossPositionMM } from "./wallplateBossGeometry";

const degToRad = (deg) => (Number(deg) * Math.PI) / 180;
const radToDeg = (rad) => (Number(rad) * 180) / Math.PI;

const MIN_OPEN_SIDE_SOFFIT_MM = 25;

const HIP_TOP_CUT_FACE_OFFSET_MM = 140;
const SPAR_HOOK_TO_BOSS_OFFSET_MM = 105;

const SPAR_HOOK_TO_WALLPLATE_FACE_MM = 156;

// Global minimum default centre spacing used when
// automatically laying out rafters.
//


  

export function calculateHippedLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,
  bossArrangement = "offset",
  hippedSides = "both", // "left" | "right" | "both"

  // Current/manual HP inputs.
  // Retained for compatibility and future admin override.
  leftHipWidthMM = null,
  rightHipWidthMM = null,

  // Optional side-pitch overrides move the physical boss centre.
  requestedLeftSidePitchDeg = null,
  requestedRightSidePitchDeg = null,

  // Optional side-led eaves rule. Blank/automatic preserves the
  // established front-led calculation.
  sideSoffitMode = "automatic",
  sideSoffitControlSide = "left",
  specifiedSideSoffitMM = null,

    leftWall = false,
  rightWall = false,
  leftOverhangMM = 0,
  rightOverhangMM = 0,

  // Finished tile overhang into each gutter.
  tileOverhangMM = 50,
}) {
  const base = calculateLeanToGeometry({
    widthMM,
    projectionMM,
    pitchDeg,
    soffitDepthMM,
    materials,
  });

  const isCentralBoss = bossArrangement === 'central';
  const centralTruss = isCentralBoss ? buildCentralBossDesign({inputs:{widthMM,projMM:projectionMM,pitchDeg,
   soffit_mm:soffitDepthMM,sideSoffitMode,sideSoffitControlSide,specifiedSideSoffitMM},materials}) : null;
  if(isCentralBoss && !centralTruss.valid)return {...base,valid:false,bossArrangement,centralTruss,hasLeftHip:false,hasRightHip:false,facets:[],errors:centralTruss.errors};
  const width = Number(widthMM || 0);
  const projection = Number(projectionMM || 0);

  const hasLeftHip = isCentralBoss || hippedSides === "left" || hippedSides === "both";
  const hasRightHip = isCentralBoss || hippedSides === "right" || hippedSides === "both";

// Hip positions refer to the BOSS CENTRE (joint B), not either timber endpoint.
const manualLeftHipWidthMM = hasLeftHip
  ? resolveDefaultBossPositionMM(leftHipWidthMM, projection) : 0;
const manualRightHipWidthMM = hasRightHip
  ? resolveDefaultBossPositionMM(rightHipWidthMM, projection) : 0;

// ======================================================
// TWO SEPARATE VERTICAL DATUMS
// ======================================================
//
// 1. designRiseMM
//    The required roof rise established by the full
//    internal projection and the requested front pitch.
//    This controls the wallplate height and side pitches.
//
// 2. frontRafterFaceRiseMM
//    The existing front-rafter manufacture rise, based on
//    the effective run to the wallplate face.
//    Retained for the current rafter/hip manufacture logic
//    until those calculations are migrated separately.
// ======================================================

const frontPitchRad = degToRad(pitchDeg);

const designRiseMM =
  projection * Math.tan(frontPitchRad);

const frontRafterFaceRiseMM =
  Number(base?.raw?.pureRiseMM ?? 0);

// Keep the existing name temporarily so current hip
// manufacture calculations remain unchanged.
const riseMM = frontRafterFaceRiseMM;

const ringBeamHeightMM = Number(
  materials?.ring_beam_height_mm ?? 40
);

const wallplateHeightMM = Number(
  materials?.wallplate_height_mm ?? 220
);

const designInternalWallplateHeightMM =
  designRiseMM + ringBeamHeightMM;

const designExternalWallplateHeightMM =
  designInternalWallplateHeightMM + wallplateHeightMM;

// Same finished covering-height convention as the regular Lean-To solver.
// The horizontal wallplate top is not the finished sloping roof surface.
const finishedRoofHeightMM = ringBeamHeightMM + designRiseMM +
  (wallplateHeightMM + 25 + 3) / Math.cos(degToRad(pitchDeg));


// Solve the equal-depth joint about the physical boss centre. All plan,
// manufacturing and facet consumers receive these same resolved positions.
const centralJoint = isCentralBoss ? {valid:true,pitchDeg:centralTruss.sidePitchDeg,bossCentrePositionMM:width/2,topPositionMM:width/2,bottomPositionMM:width/2,halfMitreOffsetMM:0} : null;
const leftBossGeometry = isCentralBoss ? centralJoint : hasLeftHip ? calculateWallplateBossGeometry({
  riseMM: designRiseMM, memberDepthMM: wallplateHeightMM,
  bossCentrePositionMM: manualLeftHipWidthMM,
  requestedSidePitchDeg: requestedLeftSidePitchDeg,
}) : null;
const rightBossGeometry = isCentralBoss ? centralJoint : hasRightHip ? calculateWallplateBossGeometry({
  riseMM: designRiseMM, memberDepthMM: wallplateHeightMM,
  bossCentrePositionMM: manualRightHipWidthMM,
  requestedSidePitchDeg: requestedRightSidePitchDeg,
}) : null;
const leftHipWidth = leftBossGeometry?.bossCentrePositionMM ?? 0;
const rightHipWidth = rightBossGeometry?.bossCentrePositionMM ?? 0;
const centreWidth = Math.max(0, width - leftHipWidth - rightHipWidth);
const leftBossX = leftHipWidth;
const rightBossX = width - rightHipWidth;

// Corrected Timberlite hip geometry diagnostic.
// Uses the same effective pitch run as the front-rafter geometry.
const effectivePitchRunMM =
  Number(base?.raw?.effectivePitchRunMM ?? 0);

// ======================================================
// AUTHORITATIVE TIMBERLITE HIP GEOMETRY
//
// Uses the same effective wallplate-face pitch datum as
// the front-rafter geometry. Validated against a physical
// manufactured roof.
// ======================================================

const leftHipPlanLengthMM = hasLeftHip
  ? Math.hypot(leftHipWidth, effectivePitchRunMM)
  : 0;

const rightHipPlanLengthMM = hasRightHip
  ? Math.hypot(rightHipWidth, effectivePitchRunMM)
  : 0;

const leftHipPitchDeg = hasLeftHip
  ? radToDeg(
      Math.atan2(riseMM, leftHipPlanLengthMM)
    )
  : 0;

const rightHipPitchDeg = hasRightHip
  ? radToDeg(
      Math.atan2(riseMM, rightHipPlanLengthMM)
    )
  : 0;

const leftHipTrueLengthMM = hasLeftHip
  ? Math.hypot(leftHipPlanLengthMM, riseMM)
  : 0;

const rightHipTrueLengthMM = hasRightHip
  ? Math.hypot(rightHipPlanLengthMM, riseMM)
  : 0;

// A side pitch override moves the physical boss centre; the default
// instead keeps projection / 2 (or an explicit centre-distance input).
const leftSidePitchDeg = leftBossGeometry?.pitchDeg ?? 0;
const rightSidePitchDeg = rightBossGeometry?.pitchDeg ?? 0;

  // 7) Manufacturing / fittings
const bossQty = isCentralBoss ? 1 : (hasLeftHip ? 1 : 0) + (hasRightHip ? 1 : 0);
// Each boss receives the hip plus the aligned front-section rafter.
// Both timber connections use a pair of spar hooks: 4 hooks per boss.
const sparHookQty = isCentralBoss ? 6 : bossQty * 4;
const hipTopCutDeg = Math.min(18, Math.max(leftHipPitchDeg, rightHipPitchDeg));
const frontSoffitMM = base.soffitDepthEffective || 0;

const requestedFrontSoffitMM = frontSoffitMM;

const facetEavesRule = isCentralBoss ? centralTruss.eaves : alignChamferedLathEaves(solveFacetEavesGeometry({
  requestedReferenceSoffitMM:
    requestedFrontSoffitMM,

  referencePitchDeg:
    pitchDeg,

  leftPitchDeg:
    leftSidePitchDeg,

  rightPitchDeg:
    rightSidePitchDeg,

  hasLeftFacet:
    hasLeftHip,

  hasRightFacet:
    hasRightHip,

  materials,

  minimumSoffitMM:
    MIN_OPEN_SIDE_SOFFIT_MM,

  manufacturingRoundIncrementMM: 5,

  sideSoffitControl:
    (
      sideSoffitMode === "specified" &&
      Number(specifiedSideSoffitMM) > 0
    ) || sideSoffitMode === "none"
      ? {
          mode: sideSoffitMode,
          side:
            sideSoffitControlSide === "right"
              ? "right"
              : "left",
          requestedProjectionMM:
            specifiedSideSoffitMM,
        }
      : null,

  fasciaThicknessMM: Number(
    materials?.fascia_thickness_mm ?? 10
  ),
  plyProjectionAllowanceMM: Number(
    materials?.ply_projection_allowance_mm ?? 5
  ),
  fasciaLipMM: Number(
    materials?.fascia_lip_mm ?? 25
  ),
}));
// ======================================================
// TEMPORARY RAFTER-TEMPLATE DIAGNOSTICS
//
// These expose the two calculated foot-cut profiles used
// by the facet-eaves solver:
//
// - frontTemplateDebug: requested front pitch and soffit
// - left/rightTemplateDebug: side pitch with the soffit
//   required to match the front template's plumb cut
//
// No live calculation is changed by this block.
// ======================================================

const frontTemplateRaw =
  facetEavesRule.referenceGeometry?.raw ?? null;

const leftTemplateRaw =
  facetEavesRule.left?.geometry?.raw ?? null;

const rightTemplateRaw =
  facetEavesRule.right?.geometry?.raw ?? null;

const buildTemplateDebug = ({
  exists,
  pitchDeg,
  raw,
}) => {
  if (!exists || !raw) return null;

  return {
    pitchDeg: Number(pitchDeg) || 0,

    soffitDepthMM:
      Number(raw.effectiveSoffitMM ?? 0),

    frameThicknessMM:
      Number(raw.frameThicknessMM ?? 0),

    // Workshop timber cut. The ply-base width is carried
    // separately by the ring-beam geometry.
    horizontalFootRunMM:
      Number(
        raw.manufacturedHorizontalFootCutMM ??
          raw.horizontalExtensionMM ??
          0
      ),

    verticalFallAcrossFootMM:
      Number(raw.verticalDropMM ?? 0),

    plumbCutHeightMM:
      Number(
        raw.manufacturedPlumbCutHeightMM ??
          raw.plumbCutHeightMM ??
          0
      ),

    nominalHorizontalFootRunMM:
      Number(raw.horizontalExtensionMM ?? 0),

    plyBaseWidthMM:
      Number(
        raw.manufacturedBaseWidthMM ??
          raw.horizontalExtensionMM ??
          0
      ),

    rafterFootClearanceMM:
      Number(raw.rafterFootClearanceMM ?? 0),

    rafterDepthMM:
      Number(raw.rafterDepthMM ?? 0),

    upperEdgeReferenceXMM:
      Number(
        raw.footTemplate
          ?.upperEdgeReferencePoint?.xMM ?? 0
      ),

    upperEdgeReferenceYMM:
      Number(
        raw.footTemplate
          ?.upperEdgeReferencePoint?.yMM ?? 0
      ),

    outwardSlopeUnitX:
      Number(
        raw.footTemplate
          ?.outwardSlopeUnit?.x ?? 0
      ),

    outwardSlopeUnitY:
      Number(
        raw.footTemplate
          ?.outwardSlopeUnit?.y ?? 0
      ),
  };
};

const frontTemplateDebug = buildTemplateDebug({
  exists: true,
  pitchDeg,
  raw: frontTemplateRaw,
});

const leftTemplateDebug = buildTemplateDebug({
  exists: hasLeftHip,
  pitchDeg: leftSidePitchDeg,
  raw: leftTemplateRaw,
});

const rightTemplateDebug = buildTemplateDebug({
  exists: hasRightHip,
  pitchDeg: rightSidePitchDeg,
  raw: rightTemplateRaw,
});


// Live eaves dimensions now come from the universal,
// physically validated facet-eaves solver.
const effectiveFrontSoffitMM = Number(
  facetEavesRule.effectiveReferenceSoffitMM ?? 0
);

const leftCalculatedSoffitMM = hasLeftHip
  ? Number(
      facetEavesRule.left.matchedSoffitMM ?? 0
    )
  : 0;

const rightCalculatedSoffitMM = hasRightHip
  ? Number(
      facetEavesRule.right.matchedSoffitMM ?? 0
    )
  : 0;

 const leftHorizontalFootRunMM = hasLeftHip
  ? Number(
      facetEavesRule.left
        .matchedHorizontalFootRunMM ?? 0
    )
  : 0;

const rightHorizontalFootRunMM = hasRightHip
  ? Number(
      facetEavesRule.right
        .matchedHorizontalFootRunMM ?? 0
    )
  : 0;

  // ======================================================
// UNIVERSAL FACET GEOMETRY BUILDER — VALIDATION
//
// Parallel calculation only.
//
// This does NOT yet drive live Hipped Lean-To geometry.
// It allows us to prove that the universal facet builder
// reproduces the geometry already validated here.
// ======================================================

const leftFacetGeometry = hasLeftHip
  ? buildFacetGeometry({
      pitchDeg: leftSidePitchDeg,

      horizontalFootRunMM:
        leftHorizontalFootRunMM,

      verticalFootCutMM:
        Number(
          facetEavesRule.left
            ?.matchedPlumbCutHeightMM ?? 0
        ),

      internalWallplateHeightMM:
        designInternalWallplateHeightMM,

      externalWallplateHeightMM:
        designExternalWallplateHeightMM,
    })
  : null;

  const rightFacetGeometry = hasRightHip
  ? buildFacetGeometry({
      pitchDeg: rightSidePitchDeg,

      horizontalFootRunMM:
        rightHorizontalFootRunMM,

      verticalFootCutMM:
        Number(
          facetEavesRule.right
            ?.matchedPlumbCutHeightMM ?? 0
        ),

      internalWallplateHeightMM:
        designInternalWallplateHeightMM,

      externalWallplateHeightMM:
        designExternalWallplateHeightMM,
    })
  : null;

// ======================================================
// PITCH-DERIVED HIP POSITIONS
// Original facet intersections use a foot on the floor. They remain
// diagnostics for historical comparisons, not boss setting-out positions.
// Retain the old floor-foot top intersections as diagnostics only.
const leftFacetFloorTopOffsetMM = leftFacetGeometry?.intersectionOffsetMM ?? 0;
const rightFacetFloorTopOffsetMM = rightFacetGeometry?.intersectionOffsetMM ?? 0;
const leftPitchDerivedHipWidthMM = leftHipWidth;
const rightPitchDerivedHipWidthMM = rightHipWidth;

const wallbarSlopeFromRingBeamTop = ({
  exists,
  pitchDeg: facetPitchDeg,
  floorDatumSlopeMM,
}) => {
  if (!exists) return 0;

  const sine = Math.sin(degToRad(facetPitchDeg));

  if (Math.abs(sine) < 0.000001) return 0;

  // The facet builder also resolves the pitch-derived hip position,
  // whose factory-floor datum remains correct. A manufactured wallbar,
  // however, begins on top of the 40 mm ring-beam. Remove that datum
  // height from the slope length without moving the resolved hip.
  return Math.max(
    0,
    Number(floorDatumSlopeMM || 0) -
      ringBeamHeightMM / sine
  );
};

const leftExternalWallBarSlopeMM = isCentralBoss ? centralTruss.members[0].externalSlopeMM :
  wallbarSlopeFromRingBeamTop({
    exists: hasLeftHip && leftFacetGeometry?.valid,
    pitchDeg: leftSidePitchDeg,
    floorDatumSlopeMM:
      leftFacetGeometry?.externalWallBarSlopeMM,
  });

const rightExternalWallBarSlopeMM = isCentralBoss ? centralTruss.members[1].externalSlopeMM :
  wallbarSlopeFromRingBeamTop({
    exists: hasRightHip && rightFacetGeometry?.valid,
    pitchDeg: rightSidePitchDeg,
    floorDatumSlopeMM:
      rightFacetGeometry?.externalWallBarSlopeMM,
  });

const leftWallplateMitre = hasLeftHip
  ? calculateWallplateMitreGeometry({
      sidePitchDeg: leftSidePitchDeg,
      memberDepthMM: wallplateHeightMM,
      wallbarExternalSlopeMM: leftExternalWallBarSlopeMM,
      wallbarHorizontalFootCutMM: leftHorizontalFootRunMM,
      wallbarVerticalFootCutMM:
        facetEavesRule.left?.matchedPlumbCutHeightMM ?? 0,
    })
  : null;

const rightWallplateMitre = hasRightHip
  ? calculateWallplateMitreGeometry({
      sidePitchDeg: rightSidePitchDeg,
      memberDepthMM: wallplateHeightMM,
      wallbarExternalSlopeMM: rightExternalWallBarSlopeMM,
      wallbarHorizontalFootCutMM: rightHorizontalFootRunMM,
      wallbarVerticalFootCutMM:
        facetEavesRule.right?.matchedPlumbCutHeightMM ?? 0,
    })
  : null;

const leftInternalWallBarSlopeMM =
  isCentralBoss ? centralTruss.members[0].internalSlopeMM : leftWallplateMitre?.wallbarInternalSlopeMM ?? 0;

const rightInternalWallBarSlopeMM =
  isCentralBoss ? centralTruss.members[1].internalSlopeMM : rightWallplateMitre?.wallbarInternalSlopeMM ?? 0;
// ======================================================
// HORIZONTAL WALLPLATE GEOMETRY
//
// The side facet geometry determines the two mitred
// intersections with the horizontal wallplate.
//
// EWPL = external/top finished wallplate length E → F
// IWPL = internal/bottom finished wallplate length D → G
//
// These are outputs of the resolved geometry and must not
// be recalculated by manufacture drawings.
// ======================================================

// Use the finished wallbar endpoints AFTER the ring-beam datum correction.
// Facet intersections belong to a different (floor-foot) construction and
// cannot also be used as finished horizontal bottom endpoints.
const wallplateAssembly = isCentralBoss ? {valid:true,arrangement:"central",internalLengthMM:0,externalLengthMM:0} : calculateWallplateAssemblyGeometry({
  internalWidthMM: width,
  memberDepthMM: wallplateHeightMM,
  ringBeamHeightMM,
  externalWallplateHeightMM: designExternalWallplateHeightMM,
  left: hasLeftHip ? {
    pitchDeg: leftSidePitchDeg,
    externalSlopeMM: leftExternalWallBarSlopeMM,
    horizontalFootCutMM: leftHorizontalFootRunMM,
    verticalFootCutMM: facetEavesRule.left?.matchedPlumbCutHeightMM ?? 0,
  } : null,
  right: hasRightHip ? {
    pitchDeg: rightSidePitchDeg,
    externalSlopeMM: rightExternalWallBarSlopeMM,
    horizontalFootCutMM: rightHorizontalFootRunMM,
    verticalFootCutMM: facetEavesRule.right?.matchedPlumbCutHeightMM ?? 0,
  } : null,
});
wallplateAssembly.valid = wallplateAssembly.valid &&
  (!hasLeftHip || Boolean(leftBossGeometry?.valid)) &&
  (!hasRightHip || Boolean(rightBossGeometry?.valid));
const horizontalWallplateInternalLengthMM = wallplateAssembly.valid
  ? wallplateAssembly.internalLengthMM : 0;
const horizontalWallplateExternalLengthMM = wallplateAssembly.valid
  ? wallplateAssembly.externalLengthMM : 0;
// All downstream geometry uses the physical joint centre B.
const resolvedLeftHipWidthMM = leftHipWidth;
const resolvedRightHipWidthMM = rightHipWidth;
 // ======================================================
// RESOLVED PLAN / BOSS GEOMETRY
//
// These are the authoritative plan positions, measured to boss centre B.
// ======================================================

const resolvedLeftBossXMM =
  hasLeftHip
    ? resolvedLeftHipWidthMM
    : 0;

const resolvedRightBossXMM =
  hasRightHip
    ? width - resolvedRightHipWidthMM
    : width;

const resolvedCentreWidthMM = Math.max(
  0,
  resolvedRightBossXMM -
    resolvedLeftBossXMM
);   
const frontRafterLayoutV2 = isCentralBoss ? centralTruss.frontRafterLayout :
  buildDefaultFrontRafterLayout({
    widthMM: width,

    leftBossXMM:
      resolvedLeftBossXMM,

    rightBossXMM:
      resolvedRightBossXMM,

    hasLeftHip,
    hasRightHip,

    spacingMM:
      Number(
        materials?.rafter_spacing_mm ?? 665
      ),
  });

const fasciaLipMM = Number(materials?.fascia_lip_mm ?? 25);
const frameThicknessMM = Number(materials?.side_frame_thickness_mm ?? 70);
const frameOnMM = Number(materials?.frame_on_mm ?? 70);

const frontHipHorizontalAllowanceMM =
  frameOnMM +
  effectiveFrontSoffitMM +
  fasciaLipMM;

const leftHipHorizontalAllowanceMM =
  // The complete side rafter foot run includes the side frame and fascia lip.
  // At the hip/ring-beam mitre those components are already represented by
  // the corner datums, so V2 needs only the remaining side projection.
  Math.max(
    0,
    leftHorizontalFootRunMM - frameThicknessMM - fasciaLipMM
  );

const horizontalWallplateLeftEndCutOffSquareDeg = hasLeftHip
  ? leftWallplateMitre.horizontalWallplateCutOffSquareDeg
  : 0;

const horizontalWallplateRightEndCutOffSquareDeg = hasRightHip
  ? rightWallplateMitre.horizontalWallplateCutOffSquareDeg
  : 0;

const leftWallbarTopCutOffSquareDeg = hasLeftHip
  ? leftWallplateMitre.wallbarTopCutOffSquareDeg
  : 0;

const rightWallbarTopCutOffSquareDeg = hasRightHip
  ? rightWallplateMitre.wallbarTopCutOffSquareDeg
  : 0;

const rightHipHorizontalAllowanceMM =
  Math.max(
    0,
    rightHorizontalFootRunMM - frameThicknessMM - fasciaLipMM
  );


// Authoritative hip manufacture geometry.
// Uses the corrected pitch run and adds the Timberlite
// spar-hook extension to obtain the finished workshop cut.
const leftHipManufacture = hasLeftHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: leftHipPlanLengthMM,
      hipPitchDeg: leftHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;

const rightHipManufacture = hasRightHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: rightHipPlanLengthMM,
      hipPitchDeg: rightHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;

  // ======================================================
// HIP MANUFACTURE GEOMETRY V2
//
// Temporary parallel calculation for validation.
// This does not replace the existing manufacture outputs.
// ======================================================

const leftHipManufactureV2 = hasLeftHip
  ? calculateHipManufactureGeometryV2({
      // V2 must use the pitch-derived live boss/hip position. Using the
      // retained manual HP here mixed legacy and resolved geometry and made
      // the read-only manufacturing profile describe a different roof.
      hipWidthMM: resolvedLeftHipWidthMM,
      effectivePitchRunMM,
      frontPitchDeg: Number(pitchDeg) || 0,

      hipDepthMM: 220,
      bossAllowancePlanMM:
        SPAR_HOOK_TO_WALLPLATE_FACE_MM,

      frontHorizontalAllowanceMM:
        frontHipHorizontalAllowanceMM,

      sideHorizontalAllowanceMM:
        leftHipHorizontalAllowanceMM,
      frontBaseWidthMM:facetEavesRule.referenceBaseWidthMM,
      sideBaseWidthMM:leftHorizontalFootRunMM,
      perimeterProjectionRunMM:projection,
    })
  : null;

const rightHipManufactureV2 = hasRightHip
  ? calculateHipManufactureGeometryV2({
      hipWidthMM: resolvedRightHipWidthMM,
      effectivePitchRunMM,
      frontPitchDeg: Number(pitchDeg) || 0,

      hipDepthMM: 220,
      bossAllowancePlanMM:
        SPAR_HOOK_TO_WALLPLATE_FACE_MM,

      frontHorizontalAllowanceMM:
        frontHipHorizontalAllowanceMM,

      sideHorizontalAllowanceMM:
        rightHipHorizontalAllowanceMM,
      frontBaseWidthMM:facetEavesRule.referenceBaseWidthMM,
      sideBaseWidthMM:rightHorizontalFootRunMM,
      perimeterProjectionRunMM:projection,
    })
  : null;
// Temporary compatibility aliases.
// Remove these after all pages have moved to the official names.
const leftHipManufactureTest = leftHipManufacture;
const rightHipManufactureTest = rightHipManufacture;

const leftHipStructuralLengthMM =
  leftHipManufacture?.pitchBasedStructuralLengthMM ?? 0;

const rightHipStructuralLengthMM =
  rightHipManufacture?.pitchBasedStructuralLengthMM ?? 0;

const leftHipFinishedCutLengthMM =
  leftHipManufacture?.pitchBasedTimberliteCutMM ?? 0;

const rightHipFinishedCutLengthMM =
  rightHipManufacture?.pitchBasedTimberliteCutMM ?? 0;

  // Legacy compatibility.
// Summary currently uses these values for Steico costing and purchasing,
// so they must represent the full workshop cut length required.
const leftHipManufacturingLengthMM = leftHipFinishedCutLengthMM;
const rightHipManufacturingLengthMM = rightHipFinishedCutLengthMM;

  // Legacy aliases.
// Keep until all consumers have been migrated.
  const leftHipTimberliteCutLengthMM = leftHipFinishedCutLengthMM;
const rightHipTimberliteCutLengthMM = rightHipFinishedCutLengthMM;



const resolvedLeftOverhangMM = Math.max(
  0,
  Number(leftOverhangMM) || 0
);

const resolvedRightOverhangMM = Math.max(
  0,
  Number(rightOverhangMM) || 0
);

// Current supported side conditions:
//
// 1. Hip present:
//    frame thickness + calculated hipped-side soffit.
//
// 2. No hip, wall present:
//    no frame, soffit or fascia-lip addition.
//
// 3. No hip, open side:
//    use the normal Lean-To rule:
//    frame + entered overhang, or frame + minimum fascia lip.
const leftExternalAllowanceMM = hasLeftHip
  ? leftHorizontalFootRunMM
  : leftWall
    ? 0
    : frameThicknessMM +
      (resolvedLeftOverhangMM > 0
        ? resolvedLeftOverhangMM
        : fasciaLipMM);

const rightExternalAllowanceMM = hasRightHip
  ? rightHorizontalFootRunMM
  : rightWall
    ? 0
    : frameThicknessMM +
      (resolvedRightOverhangMM > 0
        ? resolvedRightOverhangMM
        : fasciaLipMM);

const externalWidthMM =
  width +
  leftExternalAllowanceMM +
  rightExternalAllowanceMM;

const externalProjectionMM =
  projection +
  Number(
    facetEavesRule.referenceBaseWidthMM ??
      (frameOnMM + effectiveFrontSoffitMM)
  );

  // ======================================================
// FINISHED TILED-SURFACE GEOMETRY
//
// Structural dimensions remain unchanged. These values
// describe the outer finished tile envelope, including
// the confirmed 50 mm tile overhang into each gutter.
// ======================================================

const resolvedTileOverhangMM = Math.max(
  0,
  Number(tileOverhangMM) || 0
);

const slopeLengthFromHorizontalRun = (
  horizontalRunMM,
  facetPitchDeg
) => {
  const pitchRadians =
    degToRad(facetPitchDeg);

  const cosine =
    Math.cos(pitchRadians);

  return cosine > 0
    ? Math.max(
        0,
        Number(horizontalRunMM) || 0
      ) / cosine
    : 0;
};

/*
 * Front facet:
 *
 * The front gutter overhang extends its tiled height.
 * A hipped side has its own gutter, so its 50 mm tile
 * overhang also extends the corresponding end of the
 * front facet's bottom edge.
 */
const frontTilingBaseWidthMM =
  externalWidthMM +
  (hasLeftHip
    ? resolvedTileOverhangMM
    : 0) +
  (hasRightHip
    ? resolvedTileOverhangMM
    : 0);

const frontTilingTopWidthMM =
  resolvedCentreWidthMM +
  (!hasLeftHip
    ? leftExternalAllowanceMM
    : 0) +
  (!hasRightHip
    ? rightExternalAllowanceMM
    : 0);

const frontTilingHeightMM =
  slopeLengthFromHorizontalRun(
    externalProjectionMM +
      resolvedTileOverhangMM,
    pitchDeg
  );

/*
 * Side facets:
 *
 * Their bottom edges run from the rear wall to the outer
 * finished front-tile edge.
 *
 * Their tiled heights run from the outer side gutter edge
 * to the corresponding hip/boss position.
 */
const sideTilingBaseWidthMM =
  externalProjectionMM +
  resolvedTileOverhangMM;

const leftTilingHeightMM =
  hasLeftHip
    ? slopeLengthFromHorizontalRun(
        resolvedLeftHipWidthMM +
          leftHorizontalFootRunMM +
          resolvedTileOverhangMM,
        leftSidePitchDeg
      )
    : 0;

const rightTilingHeightMM =
  hasRightHip
    ? slopeLengthFromHorizontalRun(
        resolvedRightHipWidthMM +
          rightHorizontalFootRunMM +
          resolvedTileOverhangMM,
        rightSidePitchDeg
      )
    : 0;

const leftSideRingBeam = hasLeftHip
  ? {
      exists: true,
      internalLengthMM: projection,
      externalLengthMM: externalProjectionMM,
      sideSoffitMM: leftCalculatedSoffitMM,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    }
  : {
      exists: false,
      internalLengthMM: 0,
      externalLengthMM: 0,
      sideSoffitMM: 0,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    };

const rightSideRingBeam = hasRightHip
  ? {
      exists: true,
      internalLengthMM: projection,
      externalLengthMM: externalProjectionMM,
      sideSoffitMM: rightCalculatedSoffitMM,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    }
  : {
      exists: false,
      internalLengthMM: 0,
      externalLengthMM: 0,
      sideSoffitMM: 0,
      frameThicknessMM,
      frameOnMM,
      minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
    };

    const SIDE_RING_BEAM_SLOT_WIDTH_MM = 48;
const SIDE_FIRST_RAFTER_CENTRE_MM = 690;
const SIDE_RAFTER_SPACING_MM = 665;

// Minimum clear gap required between the final side-jack slot
// and the front hip-seat slot.
// Temporary manufacturing rule — review after workshop testing.
const SIDE_FINAL_JACK_MIN_CLEARANCE_MM = 400;

const buildSideRingBeamLayout = ({
  exists,
  internalLengthMM,
  side,
}) => {
  const lengthMM = Math.max(
    0,
    Number(internalLengthMM) || 0
  );

  if (!exists || lengthMM <= 0) {
    return {
      side,
      exists: false,

      slots: [],
      bayWidthsMM: [],

      intermediateJackRafters: [],
      intermediateJackRafterCount: 0,

      wallJackCount: 0,
      hipSeatCount: 0,
    };
  }

  const slotWidthMM = SIDE_RING_BEAM_SLOT_WIDTH_MM;
  const halfSlotMM = slotWidthMM / 2;

  // Boundary slot at the wall end.
  const wallSlot = {
    type: "wall-jack",
    centreMM: halfSlotMM,
    leftMM: 0,
    rightMM: Math.min(slotWidthMM, lengthMM),
  };

  // Actual side jack rafters:
  // first centre 690 mm from the wall,
  // then 665 mm centres towards the front hip.
  const intermediateJackRafters = [];

  for (
    let centreMM = SIDE_FIRST_RAFTER_CENTRE_MM;
    centreMM < lengthMM;
    centreMM += SIDE_RAFTER_SPACING_MM
  ) {
    const leftMM = centreMM - halfSlotMM;
const rightMM = centreMM + halfSlotMM;

const hipSeatLeftMM = Math.max(
  0,
  lengthMM - slotWidthMM
);

const clearGapToHipSeatMM =
  hipSeatLeftMM - rightMM;

// Omit this jack—and all later positions—when the clear gap
// between its slot and the hip-seat slot would be less than
// the current manufacturing minimum.
if (
  clearGapToHipSeatMM <
  SIDE_FINAL_JACK_MIN_CLEARANCE_MM
) {
  break;
}

intermediateJackRafters.push({
  type: "side-jack",
  centreMM,
  leftMM,
  rightMM,
  clearGapToHipSeatMM,
});
  }

  // Boundary slot at the front mitred end for the hip.
  const hipSlot = {
    type: "hip-seat",
    centreMM: Math.max(0, lengthMM - halfSlotMM),
    leftMM: Math.max(0, lengthMM - slotWidthMM),
    rightMM: lengthMM,
  };

  const slots = [
    wallSlot,
    ...intermediateJackRafters,
    hipSlot,
  ]
    .filter(
      (slot) =>
        Number.isFinite(slot.leftMM) &&
        Number.isFinite(slot.rightMM) &&
        slot.rightMM > slot.leftMM
    )
    .sort((a, b) => a.leftMM - b.leftMM);

  const bayWidthsMM = slots
    .slice(0, -1)
    .map((slot, index) => {
      const nextSlot = slots[index + 1];

      return Math.max(
        0,
        Number(nextSlot.leftMM) -
          Number(slot.rightMM)
      );
    })
    .filter((widthMM) => widthMM > 0);

  return {
    side,
    exists: true,

    internalLengthMM: lengthMM,
    slotWidthMM,

    slots,
    bayWidthsMM,

    intermediateJackRafters,
    intermediateJackRafterCount:
      intermediateJackRafters.length,

    // Included as Steico members later, but no hook/bracket.
    wallJackCount: 1,

    // Represents the hip seating at the front mitre.
    hipSeatCount: 1,
  };
};

const leftSideRingBeamLayout =
  buildSideRingBeamLayout({
    exists: hasLeftHip,
    internalLengthMM: projection,
    side: "left",
  });

const rightSideRingBeamLayout =
  buildSideRingBeamLayout({
    exists: hasRightHip,
    internalLengthMM: projection,
    side: "right",
  });

const leftFacet = buildFacet({
  id: "facet-left-side",
  label: "Left Side Facet",
  exists: hasLeftHip,

  internalEavesLengthMM: projection,
  externalEavesLengthMM:
    leftSideRingBeam.externalLengthMM,

  pitchDeg: leftSidePitchDeg,

    tilingGeometry: hasLeftHip
    ? {
        baseWidthMM:
          sideTilingBaseWidthMM,

        topWidthMM: 0,

        heightMM:
          leftTilingHeightMM,

        outline: [
          { xMM: 0, yMM: 0 },
          {
            xMM: sideTilingBaseWidthMM,
            yMM: 0,
          },
          {
            xMM: 0,
            yMM: leftTilingHeightMM,
          },
        ],
      }
    : null,

  soffitDepthMM:
  // Ring-beam manufacture uses the rounded-up workshop size.
  // The exact matched soffit remains available separately and
  // continues to drive the design/external geometry.
  facetEavesRule.left.manufacturedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.left.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasLeftHip,
  ringBeamLengthMM:
    leftSideRingBeam.externalLengthMM,
  ringBeamInternalLengthMM: projection,
  ringBeamExternalLengthMM:
    leftSideRingBeam.externalLengthMM,
  ringBeamBaseWidthMM:
    facetEavesRule.left
      .manufacturedHorizontalFootRunMM,
  ringBeamStartExtensionMM: 0,
  ringBeamEndExtensionMM:
    externalProjectionMM - projection,

  // Wall slot + intermediate side-jack slots + hip-seat slot.
  ringBeamBayWidthsMM:
    leftSideRingBeamLayout.bayWidthsMM,
});

const rightFacet = buildFacet({
  id: "facet-right-side",
  label: "Right Side Facet",
  exists: hasRightHip,

  internalEavesLengthMM: projection,
  externalEavesLengthMM:
    rightSideRingBeam.externalLengthMM,

  pitchDeg: rightSidePitchDeg,

    tilingGeometry: hasRightHip
    ? {
        baseWidthMM:
          sideTilingBaseWidthMM,

        topWidthMM: 0,

        heightMM:
          rightTilingHeightMM,

        outline: [
          { xMM: 0, yMM: 0 },
          {
            xMM: sideTilingBaseWidthMM,
            yMM: 0,
          },
          {
            xMM: 0,
            yMM: rightTilingHeightMM,
          },
        ],
      }
    : null,

  soffitDepthMM:
  // Ring-beam manufacture uses the rounded-up workshop size.
  // The exact matched soffit remains available separately and
  // continues to drive the design/external geometry.
  facetEavesRule.right.manufacturedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.right.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasRightHip,
  ringBeamLengthMM:
    rightSideRingBeam.externalLengthMM,
  ringBeamInternalLengthMM: projection,
  ringBeamExternalLengthMM:
    rightSideRingBeam.externalLengthMM,
  ringBeamBaseWidthMM:
    facetEavesRule.right
      .manufacturedHorizontalFootRunMM,
  ringBeamStartExtensionMM:
    externalProjectionMM - projection,
  ringBeamEndExtensionMM: 0,

  // Wall slot + intermediate side-jack slots + hip-seat slot.
  ringBeamBayWidthsMM:
    rightSideRingBeamLayout.bayWidthsMM,
});


  // ======================================================
// AUTHORITATIVE FRONT RAFTER LAYOUT
//
// All front-facet rafter positions now come from the
// shared rafterLayoutBuilder.
//
// Keep these compatibility variable names temporarily
// because downstream manufacture / Summary code still
// reads them.
// ======================================================

const plainRafterZoneStartMM =
  frontRafterLayoutV2?.centreZoneStartMM ?? 0;

const plainRafterZoneEndMM =
  frontRafterLayoutV2?.centreZoneEndMM ?? width;

const plainRafterZoneWidthMM =
  frontRafterLayoutV2?.centreZoneWidthMM ?? 0;

const rafterSpacingMM =
  frontRafterLayoutV2?.spacingMM ??
  Number(materials?.rafter_spacing_mm ?? 665);

const leftJackRafters =
  frontRafterLayoutV2?.leftJackRafters ?? [];

const plainRafters =
  (frontRafterLayoutV2?.centreRafters ?? []).filter(
    (rafter) => rafter.role === "plain"
  );

const bossRafters =
  (frontRafterLayoutV2?.centreRafters ?? []).filter(
    (rafter) => rafter.role === "boss-rafter"
  );

const rightJackRafters =
  frontRafterLayoutV2?.rightJackRafters ?? [];

/*
 * Compatibility list used by the front ring-beam slot
 * calculation below.
 *
 * This now contains the exact same positions as the D/O CAD:
 * left jacks + boss rafters + centre plain rafters + right jacks.
 */
const rafterCentres =
  (frontRafterLayoutV2?.allRafters ?? []).map(
    (rafter) => ({
      centreMM: Number(rafter.centreMM) || 0,

      type:
        rafter.role === "boss-rafter"
          ? "boss"
          : rafter.zone === "left-jack"
            ? "leftJack"
            : rafter.zone === "right-jack"
              ? "rightJack"
              : "plain",

      role: rafter.role,
      zone: rafter.zone,
      id: rafter.id,
    })
  );

const rafterSlotWidthMM = 48;
const rafterSlotHalfWidthMM = rafterSlotWidthMM / 2;

// The front ring-beam includes:
// - a left edge rafter slot;
// - every normal/jack rafter position;
// - a right edge rafter slot.
const frontRafterSlots = [
  {
    leftMM: 0,
    rightMM: Math.min(rafterSlotWidthMM, width),
    centreMM: Math.min(rafterSlotHalfWidthMM, width / 2),
    type: "edge-start",
  },

  ...rafterCentres.map((rafter) => ({
    leftMM: Math.max(
      0,
      Number(rafter.centreMM) - rafterSlotHalfWidthMM
    ),
    rightMM: Math.min(
      width,
      Number(rafter.centreMM) + rafterSlotHalfWidthMM
    ),
    centreMM: Number(rafter.centreMM),
    type: rafter.type,
  })),

  {
    leftMM: Math.max(0, width - rafterSlotWidthMM),
    rightMM: width,
    centreMM: Math.max(
      0,
      width - rafterSlotHalfWidthMM
    ),
    type: "edge-end",
  },
]
  .filter(
    (slot) =>
      Number.isFinite(slot.leftMM) &&
      Number.isFinite(slot.rightMM) &&
      slot.rightMM > slot.leftMM
  )
  .sort((a, b) => a.leftMM - b.leftMM);

// Clear width between consecutive 48 mm rafter slots.
// These are the individual ring-beam upstand widths.
const frontRingBeamBayWidthsMM = frontRafterSlots
  .slice(0, -1)
  .map((slot, index) => {
    const nextSlot = frontRafterSlots[index + 1];

    return Math.max(
      0,
      Number(nextSlot.leftMM) - Number(slot.rightMM)
    );
  })
  .filter((bayWidthMM) => bayWidthMM > 0);

 const frontFacet = buildFacet({
  id: "facet-front",
  label: "Front Facet",
  exists: true,

  internalEavesLengthMM: width,
  externalEavesLengthMM: externalWidthMM,

  pitchDeg: Number(pitchDeg) || 0,

    tilingGeometry: {
    baseWidthMM:
      frontTilingBaseWidthMM,

    topWidthMM:
      frontTilingTopWidthMM,

    heightMM:
      frontTilingHeightMM,

    outline: [
      { xMM: 0, yMM: 0 },
      {
        xMM: frontTilingBaseWidthMM,
        yMM: 0,
      },
      {
        xMM: frontTilingTopWidthMM,
        yMM: frontTilingHeightMM,
      },
      {
        xMM: 0,
        yMM: frontTilingHeightMM,
      },
    ],
  },

  soffitDepthMM:
    effectiveFrontSoffitMM,

  plumbCutHeightMM:
    facetEavesRule.targetPlumbCutHeightMM,

finishedFasciaHeightMM:
    facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
    facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: true,
  ringBeamLengthMM: externalWidthMM,
  ringBeamInternalLengthMM: width,
  ringBeamExternalLengthMM: externalWidthMM,
  ringBeamBaseWidthMM:
    externalProjectionMM - projection,
  ringBeamStartExtensionMM:
    leftExternalAllowanceMM,
  ringBeamEndExtensionMM:
    rightExternalAllowanceMM,

  ringBeamBayWidthsMM:
    frontRingBeamBayWidthsMM,
});
const facets = applyRectangularRingBeamJoints({
  facets:[leftFacet,frontFacet,rightFacet].filter(facet=>facet.exists),
  widthMM:width,projectionMM:projection,externalWidthMM,externalProjectionMM,
  leftAllowanceMM:leftExternalAllowanceMM,rightAllowanceMM:rightExternalAllowanceMM,
});

  // Reuse the regular Lean-To manufacture calculation with the resolved
  // front soffit, rather than its internal-projection-only slope alias.
  const frontRafterManufactureGeometry = calculateLeanToGeometry({
    widthMM: width, projectionMM: projection, pitchDeg,
    soffitDepthMM: effectiveFrontSoffitMM, materials,
  });
  return {
  ...(isCentralBoss ? {bossArrangement,centralTruss,valid:true} : {}),
  ...base,
  rafterExternalLength: frontRafterManufactureGeometry.raw.manufacturedExternalSlopeLengthMM,
  rafterInternalLength: frontRafterManufactureGeometry.raw.internalRafterLengthMM,
  frontRafterManufactureGeometry,
  finishedRoofHeightMM,
  chamferedLathAlignment: facetEavesRule.chamferedLathAlignment,

  frontPitchDeg: Number(pitchDeg) || 0,
  leftSidePitchDeg,
  rightSidePitchDeg,

  leftSideRingBeam,
  rightSideRingBeam,

  leftSideRingBeamLayout,
rightSideRingBeamLayout,



leftSideIntermediateJackCount:
  leftSideRingBeamLayout.intermediateJackRafterCount,

rightSideIntermediateJackCount:
  rightSideRingBeamLayout.intermediateJackRafterCount,

leftWallJackCount:
  leftSideRingBeamLayout.wallJackCount,

rightWallJackCount:
  rightSideRingBeamLayout.wallJackCount,

  facets,
  leftFacet,
  frontFacet,
  rightFacet,

  leftHipPitchDeg,
  rightHipPitchDeg,

  // Vertical design/manufacture datums
riseMM,
designRiseMM,
frontRafterFaceRiseMM,

ringBeamHeightMM,
wallplateHeightMM,

designInternalWallplateHeightMM,
designExternalWallplateHeightMM,

  plainRafterZoneStartMM,
  plainRafterZoneEndMM,
  plainRafterZoneWidthMM,

  leftHipTrueLengthMM,
  rightHipTrueLengthMM,
  leftHipManufacturingLengthMM,
  rightHipManufacturingLengthMM,
  leftHipTimberliteCutLengthMM,
  rightHipTimberliteCutLengthMM,

  effectivePitchRunMM,

  // Existing official manufacture outputs
leftHipManufacture,
rightHipManufacture,

leftHipStructuralLengthMM,
rightHipStructuralLengthMM,

leftHipFinishedCutLengthMM,
rightHipFinishedCutLengthMM,

// Temporary V2 comparison outputs
leftHipManufactureV2,
rightHipManufactureV2,

frontHipHorizontalAllowanceMM,
leftHipHorizontalAllowanceMM,
rightHipHorizontalAllowanceMM,

leftHipFinishedCutLengthMM,
rightHipFinishedCutLengthMM,

// Temporary backward-compatible outputs
leftHipManufactureTest,
rightHipManufactureTest,

  rafterCentres,

leftJackRafterCount:
  leftJackRafters.length,

plainRafterCount:
  plainRafters.length,

bossRafterCount:
  bossRafters.length,

rightJackRafterCount:
  rightJackRafters.length,

  hipTopCutFaceOffsetMM: HIP_TOP_CUT_FACE_OFFSET_MM,
  sparHookToBossOffsetMM: SPAR_HOOK_TO_BOSS_OFFSET_MM,

  bossQty,
  sparHookQty,
  hipTopCutDeg,

  frontSoffitMM: effectiveFrontSoffitMM,

leftCalculatedSoffitMM,
rightCalculatedSoffitMM,

leftHorizontalFootRunMM,
rightHorizontalFootRunMM,

leftPitchDerivedHipWidthMM,
rightPitchDerivedHipWidthMM,
leftFacetFloorTopOffsetMM,
rightFacetFloorTopOffsetMM,
leftBossGeometry,
rightBossGeometry,

leftExternalWallBarSlopeMM,
leftInternalWallBarSlopeMM,

rightExternalWallBarSlopeMM,
rightInternalWallBarSlopeMM,

wallplateAssembly,
horizontalWallplateExternalLengthMM,
horizontalWallplateInternalLengthMM,
horizontalWallplateLeftEndCutOffSquareDeg,
horizontalWallplateRightEndCutOffSquareDeg,
leftWallbarTopCutOffSquareDeg,
rightWallbarTopCutOffSquareDeg,

// Universal facet-geometry validation
leftFacetGeometry,
rightFacetGeometry,


requestedFrontSoffitMM,

effectiveFrontSoffitMM,

frontSoffitAdjustmentMM:
  Number(
    facetEavesRule
      .referenceSoffitAdjustmentMM ?? 0
  ),

facetEavesSolutionValid:
  Boolean(
    facetEavesRule.solutionValid
  ),

sideSoffitMode:
  facetEavesRule.sideSoffitControl?.mode ?? "automatic",

sideSoffitControlSide:
  facetEavesRule.sideSoffitControl?.side ?? null,

specifiedSideSoffitMM:
  facetEavesRule.sideSoffitControl?.mode === "specified"
    ? Number(specifiedSideSoffitMM) || 0
    : null,

controlledSidePlyBaseWidthMM:
  Number(
    facetEavesRule.sideSoffitControl?.plyBaseWidthMM ?? 0
  ),

  frontFinishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

leftFinishedFasciaHeightMM:
  hasLeftHip
    ? facetEavesRule.commonFinishedFasciaHeightMM
    : 0,

rightFinishedFasciaHeightMM:
  hasRightHip
    ? facetEavesRule.commonFinishedFasciaHeightMM
    : 0,

frontFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

leftFasciaOrderSizeMM:
  hasLeftHip
    ? facetEavesRule.commonFasciaOrderSizeMM
    : 0,

rightFasciaOrderSizeMM:
  hasRightHip
    ? facetEavesRule.commonFasciaOrderSizeMM
    : 0,

commonFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

fasciaOrderSizesMatch: true,

frontPlumbCutHeightMM:
  facetEavesRule.targetPlumbCutHeightMM,

leftPlumbCutHeightMM:
  hasLeftHip
    ? facetEavesRule.left.matchedPlumbCutHeightMM
    : 0,

rightPlumbCutHeightMM:
  hasRightHip
    ? facetEavesRule.right.matchedPlumbCutHeightMM
    : 0,

  frontSoffitAutoAdjusted:
  Boolean(
    facetEavesRule.referenceSoffitAdjusted
  ),

minOpenSideSoffitMM:
  MIN_OPEN_SIDE_SOFFIT_MM,

  leftPlumbCutMatchedSoffitMM:
  facetEavesRule.left.matchedSoffitMM,

rightPlumbCutMatchedSoffitMM:
  facetEavesRule.right.matchedSoffitMM,

leftMatchedPlumbCutHeightMM:
  facetEavesRule.left.matchedPlumbCutHeightMM,

rightMatchedPlumbCutHeightMM:
  facetEavesRule.right.matchedPlumbCutHeightMM,

leftPlumbCutDifferenceMM:
  facetEavesRule.left.plumbCutDifferenceMM,

rightPlumbCutDifferenceMM:
  facetEavesRule.right.plumbCutDifferenceMM,

leftMitreTrimAllowanceMM:
  facetEavesRule.left.mitreTrimAllowanceMM,

rightMitreTrimAllowanceMM:
  facetEavesRule.right.mitreTrimAllowanceMM,

leftRawManufacturedSoffitMM:
  facetEavesRule.left.rawManufacturedSoffitMM,

rightRawManufacturedSoffitMM:
  facetEavesRule.right.rawManufacturedSoffitMM,

leftRoundedManufacturedSoffitMM:
  facetEavesRule.left.manufacturedSoffitMM,

rightRoundedManufacturedSoffitMM:
  facetEavesRule.right.manufacturedSoffitMM,
  facetEavesReferenceSoffitMM:
  facetEavesRule.effectiveReferenceSoffitMM,

facetEavesCommonPlumbCutMM:
  facetEavesRule.targetPlumbCutHeightMM,

facetEavesCommonFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

facetEavesCommonFasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

facetEavesLeftMatchedSoffitMM:
  facetEavesRule.left.matchedSoffitMM,

facetEavesLeftMitreTrimMM:
  facetEavesRule.left.mitreTrimAllowanceMM,

facetEavesLeftRawManufacturedSoffitMM:
  facetEavesRule.left.rawManufacturedSoffitMM,

facetEavesLeftManufacturedSoffitMM:
  facetEavesRule.left.manufacturedSoffitMM,

facetEavesRightMatchedSoffitMM:
  facetEavesRule.right.matchedSoffitMM,

facetEavesRightMitreTrimMM:
  facetEavesRule.right.mitreTrimAllowanceMM,

facetEavesRightRawManufacturedSoffitMM:
  facetEavesRule.right.rawManufacturedSoffitMM,

facetEavesRightManufacturedSoffitMM:
  facetEavesRule.right.manufacturedSoffitMM,

  // Temporary rafter-template diagnostics
frontTemplateDebug,
leftTemplateDebug,
rightTemplateDebug,

  externalWidthMM,
  externalProjectionMM,

  roofType: "hippedLeanTo",

  widthMM: width,
  projectionMM: projection,

  hippedSides,
  hasLeftHip,
  hasRightHip,

  leftWall,
rightWall,

leftBoundaryType: hasLeftHip
  ? "hipped"
  : leftWall
    ? "wall"
    : "open",

rightBoundaryType: hasRightHip
  ? "hipped"
  : rightWall
    ? "wall"
    : "open",

leftExternalAllowanceMM,
rightExternalAllowanceMM,

  leftHipWidthMM: leftHipWidth,
  rightHipWidthMM: rightHipWidth,
  centreWidthMM: centreWidth,

  leftBossXMM: leftBossX,
  rightBossXMM: rightBossX,

  resolvedLeftHipWidthMM,
resolvedRightHipWidthMM,

resolvedCentreWidthMM,

resolvedLeftBossXMM,
resolvedRightBossXMM,

frontRafterLayoutV2,

 leftHipPlanLengthMM,
 rightHipPlanLengthMM,

  points: {
    frontLeft: { x: 0, y: 0 },
    frontRight: { x: width, y: 0 },
    backLeft: { x: 0, y: projection },
    backRight: { x: width, y: projection },

    leftBoss: hasLeftHip ? { x: leftBossX, y: projection } : null,
    rightBoss: hasRightHip ? { x: rightBossX, y: projection } : null,
  },
};
}
