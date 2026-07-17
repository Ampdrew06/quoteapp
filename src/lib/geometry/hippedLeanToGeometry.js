// src/lib/geometry/HippedLeanToGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";
import { computeHipManufactureGeometry } from "./hipManufactureGeometry";
import { buildFacet } from "../Manufacturing/facetBuilder";
import { solveFacetEavesGeometry } from "./facetEavesGeometry";

const degToRad = (deg) => (Number(deg) * Math.PI) / 180;
const radToDeg = (rad) => (Number(rad) * 180) / Math.PI;

const calcSidePitchDeg = ({ frontPitchDeg, projectionMM, hipWidthMM }) => {
const projection = Number(projectionMM) || 0;
const hipWidth = Number(hipWidthMM) || 0;

  if (!projection || !hipWidth) return 0;

  return radToDeg(
    Math.atan(Math.tan(degToRad(frontPitchDeg)) * (projection / hipWidth))
  );
};

const MIN_OPEN_SIDE_SOFFIT_MM = 25;

const HIP_TOP_CUT_FACE_OFFSET_MM = 140;
const SPAR_HOOK_TO_BOSS_OFFSET_MM = 105;

const SPAR_HOOK_TO_WALLPLATE_FACE_MM = 156;

export function calculateHippedLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,
  hippedSides = "both", // "left" | "right" | "both"
  leftHipWidthMM = 1000,
  rightHipWidthMM = 1000,

  leftWall = false,
  rightWall = false,
  leftOverhangMM = 0,
  rightOverhangMM = 0,
}) {
  const base = calculateLeanToGeometry({
    widthMM,
    projectionMM,
    pitchDeg,
    soffitDepthMM,
    materials,
  });

  const width = Number(widthMM || 0);
  const projection = Number(projectionMM || 0);

  const hasLeftHip = hippedSides === "left" || hippedSides === "both";
  const hasRightHip = hippedSides === "right" || hippedSides === "both";

  const leftHipWidth = hasLeftHip ? Number(leftHipWidthMM || 0) : 0;
  const rightHipWidth = hasRightHip ? Number(rightHipWidthMM || 0) : 0;

  const centreWidth = Math.max(0, width - leftHipWidth - rightHipWidth);

  // 1) Boss / hip positions in plan
const leftBossX = leftHipWidth;
const rightBossX = width - rightHipWidth;

// 2) Hip plan lengths
const hipPlanLengthLeft = hasLeftHip
  ? Math.sqrt(leftHipWidth ** 2 + projection ** 2)
  : 0;

const hipPlanLengthRight = hasRightHip
  ? Math.sqrt(rightHipWidth ** 2 + projection ** 2)
  : 0;

// 3) Rise from corrected Lean-To geometry
const riseMM = base?.raw?.pureRiseMM ?? 0;

// 4) Side roof plane pitches
const leftSidePitchDeg = hasLeftHip
  ? calcSidePitchDeg({
      frontPitchDeg: pitchDeg,
      projectionMM: projection,
      hipWidthMM: leftHipWidth,
    })
  : 0;

const rightSidePitchDeg = hasRightHip
  ? calcSidePitchDeg({
      frontPitchDeg: pitchDeg,
      projectionMM: projection,
      hipWidthMM: rightHipWidth,
    })
  : 0;

// 5) Hip member pitch — this is the factory saw angle we need to validate
const leftHipPitchDeg = hasLeftHip
  ? radToDeg(Math.atan2(riseMM, hipPlanLengthLeft))
  : 0;

const rightHipPitchDeg = hasRightHip
  ? radToDeg(Math.atan2(riseMM, hipPlanLengthRight))
  : 0;

// 6) Hip true/cut lengths
const leftHipTrueLengthMM = hasLeftHip
  ? hipPlanLengthLeft / Math.cos(degToRad(leftSidePitchDeg))
  : 0;

const rightHipTrueLengthMM = hasRightHip
  ? hipPlanLengthRight / Math.cos(degToRad(rightSidePitchDeg))
  : 0;

  // 7) Manufacturing / fittings
const bossQty = (hasLeftHip ? 1 : 0) + (hasRightHip ? 1 : 0);
const sparHookQty = bossQty * 2;
const hipTopCutDeg = 19;
const frontSoffitMM = base.soffitDepthEffective || 0;

const requestedFrontSoffitMM = frontSoffitMM;

const facetEavesRule = solveFacetEavesGeometry({
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
});



// Live eaves dimensions now come from the universal,
// physically validated facet-eaves solver.
const effectiveFrontSoffitMM = Number(
  facetEavesRule.effectiveReferenceSoffitMM ?? 0
);

const leftCalculatedSoffitMM = hasLeftHip
  ? Number(
      facetEavesRule.left.manufacturedSoffitMM ?? 0
    )
  : 0;

const rightCalculatedSoffitMM = hasRightHip
  ? Number(
      facetEavesRule.right.manufacturedSoffitMM ?? 0
    )
  : 0;

const frameThicknessMM = Number(materials?.side_frame_thickness_mm ?? 70);

const leftExternalHipRunMM =
  leftHipWidth + frameThicknessMM;

const rightExternalHipRunMM =
  rightHipWidth + frameThicknessMM;

const externalHipProjectionMM =
  projection + frameThicknessMM;

const leftHipExternalPlanLengthMM = hasLeftHip
  ? Math.sqrt(leftExternalHipRunMM ** 2 + externalHipProjectionMM ** 2)
  : 0;

const rightHipExternalPlanLengthMM = hasRightHip
  ? Math.sqrt(rightExternalHipRunMM ** 2 + externalHipProjectionMM ** 2)
  : 0;

const leftHipExternalTrueLengthMM = hasLeftHip
  ? leftHipExternalPlanLengthMM / Math.cos(degToRad(pitchDeg))
  : 0;

const rightHipExternalTrueLengthMM = hasRightHip
  ? rightHipExternalPlanLengthMM / Math.cos(degToRad(pitchDeg))
  : 0;

const leftHipManufacturingLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM)
  : 0;

const rightHipManufacturingLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM)
  : 0;

  const leftHipExternalEdgeCutLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM)
  : 0;

const rightHipExternalEdgeCutLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM)
  : 0;

  const leftHipTimberliteCutLengthMM = hasLeftHip
  ? Math.max(0, leftHipTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

const rightHipTimberliteCutLengthMM = hasRightHip
  ? Math.max(0, rightHipTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

  const leftHipPitchTrueLengthMM = hasLeftHip
  ? hipPlanLengthLeft / Math.cos(degToRad(leftHipPitchDeg))
  : 0;

const rightHipPitchTrueLengthMM = hasRightHip
  ? hipPlanLengthRight / Math.cos(degToRad(rightHipPitchDeg))
  : 0;

const leftHipPitchBasedCutMM = hasLeftHip
  ? Math.max(0, leftHipPitchTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;

const rightHipPitchBasedCutMM = hasRightHip
  ? Math.max(0, rightHipPitchTrueLengthMM - SPAR_HOOK_TO_WALLPLATE_FACE_MM)
  : 0;
const leftHipManufactureTest = hasLeftHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: hipPlanLengthLeft,
      hipPitchDeg: leftHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;

const rightHipManufactureTest = hasRightHip
  ? computeHipManufactureGeometry({
      hipPlanRunMM: hipPlanLengthRight,
      hipPitchDeg: rightHipPitchDeg,
      sparHookAllowanceMM: SPAR_HOOK_TO_WALLPLATE_FACE_MM,
    })
  : null;
const frameOnMM = Number(materials?.frame_on_mm ?? 70);

const fasciaLipMM = Number(materials?.fascia_lip_mm ?? 25);

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
  ? frameThicknessMM + leftCalculatedSoffitMM
  : leftWall
    ? 0
    : frameThicknessMM +
      (resolvedLeftOverhangMM > 0
        ? resolvedLeftOverhangMM
        : fasciaLipMM);

const rightExternalAllowanceMM = hasRightHip
  ? frameThicknessMM + rightCalculatedSoffitMM
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
  frameOnMM +
  effectiveFrontSoffitMM;

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

  soffitDepthMM:
  facetEavesRule.left.matchedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.left.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasLeftHip,
  ringBeamLengthMM:
    leftSideRingBeam.externalLengthMM,

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

  soffitDepthMM:
  facetEavesRule.right.matchedSoffitMM,

  plumbCutHeightMM:
  facetEavesRule.right.matchedPlumbCutHeightMM,

finishedFasciaHeightMM:
  facetEavesRule.commonFinishedFasciaHeightMM,

fasciaOrderSizeMM:
  facetEavesRule.commonFasciaOrderSizeMM,

  hasRingBeam: hasRightHip,
  ringBeamLengthMM:
    rightSideRingBeam.externalLengthMM,

  // Wall slot + intermediate side-jack slots + hip-seat slot.
  ringBeamBayWidthsMM:
    rightSideRingBeamLayout.bayWidthsMM,
});


  const plainRafterZoneStartMM = leftBossX;
const plainRafterZoneEndMM = rightBossX;
const plainRafterZoneWidthMM = centreWidth;
const rafterSpacingMM = Number(materials?.rafter_spacing_mm ?? 665);
const firstRafterCentreMM = Number(materials?.rafter_first_center_mm ?? 685);

const rafterCentres = [];

for (let c = firstRafterCentreMM; c < width; c += rafterSpacingMM) {
  let type = "plain";

  if (hasLeftHip && c < leftBossX) {
    type = "leftJack";
  } else if (hasRightHip && c > rightBossX) {
    type = "rightJack";
  }

  rafterCentres.push({
    centreMM: c,
    type,
  });
}

const leftJackRafters = rafterCentres.filter((r) => r.type === "leftJack");
const plainRafters = rafterCentres.filter((r) => r.type === "plain");
const rightJackRafters = rafterCentres.filter((r) => r.type === "rightJack");

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

  ringBeamBayWidthsMM:
    frontRingBeamBayWidthsMM,
});
const facets = [
  leftFacet,
  frontFacet,
  rightFacet,
].filter((facet) => facet.exists);

  return {
  ...base,

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

  riseMM,

  plainRafterZoneStartMM,
  plainRafterZoneEndMM,
  plainRafterZoneWidthMM,

  leftHipTrueLengthMM,
  rightHipTrueLengthMM,
  leftHipManufacturingLengthMM,
  rightHipManufacturingLengthMM,
  leftHipExternalEdgeCutLengthMM,
  rightHipExternalEdgeCutLengthMM,
  leftHipTimberliteCutLengthMM,
  rightHipTimberliteCutLengthMM,

  leftHipPitchTrueLengthMM,
  rightHipPitchTrueLengthMM,
  leftHipPitchBasedCutMM,
  rightHipPitchBasedCutMM,

  leftHipManufactureTest,
  rightHipManufactureTest,

  rafterCentres,
  leftJackRafterCount: leftJackRafters.length,
  plainRafterCount: plainRafters.length,
  rightJackRafterCount: rightJackRafters.length,

  hipTopCutFaceOffsetMM: HIP_TOP_CUT_FACE_OFFSET_MM,
  sparHookToBossOffsetMM: SPAR_HOOK_TO_BOSS_OFFSET_MM,

  bossQty,
  sparHookQty,
  hipTopCutDeg,

  frontSoffitMM: effectiveFrontSoffitMM,
  leftCalculatedSoffitMM,
  rightCalculatedSoffitMM,

  requestedFrontSoffitMM,

  effectiveFrontSoffitMM,

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

  frontSoffitAutoAdjusted: false,

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

  leftHipPlanLengthMM: hipPlanLengthLeft,
  rightHipPlanLengthMM: hipPlanLengthRight,

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