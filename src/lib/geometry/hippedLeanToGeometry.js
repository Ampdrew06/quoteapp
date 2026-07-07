// src/lib/geometry/HippedLeanToGeometry.js

import { calculateLeanToGeometry } from "./leanToGeometry";
import { computeHipManufactureGeometry } from "./hipManufactureGeometry";

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

const solveSoffitForTargetFasciaHeight = ({
  targetFasciaHeightMM,
  pitchDeg,
  materials,
}) => {
  let bestSoffit = 0;
  let bestDiff = Infinity;

  // Safer brute-force scan: 0–1000mm in 1mm steps
  // This avoids assuming whether fascia height rises or falls with soffit.
  for (let soffit = 0; soffit <= 1000; soffit += 1) {
    const test = calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg,
      soffitDepthMM: soffit,
      materials,
    });

    const fascia = Number(test.fasciaHeight || 0);
    const diff = Math.abs(fascia - targetFasciaHeightMM);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestSoffit = soffit;
    }
  }

  return bestSoffit;
};

const calculateLevelFasciaSoffits = ({
  requestedFrontSoffitMM,
  frontPitchDeg,
  leftSidePitchDeg,
  rightSidePitchDeg,
  hasLeftHip,
  hasRightHip,
  materials,
}) => {
  let effectiveFrontSoffitMM = Number(requestedFrontSoffitMM) || 0;
  let adjusted = false;

  const getTarget = (frontSoffit) =>
    calculateLeanToGeometry({
      widthMM: 1000,
      projectionMM: 1000,
      pitchDeg: frontPitchDeg,
      soffitDepthMM: frontSoffit,
      materials,
    }).fasciaHeight;

  const pitchesMatch = (a, b) =>
  Math.abs(Number(a) - Number(b)) < 0.05;

const getSideSoffits = (frontSoffit) => {
  const targetFasciaHeightMM = getTarget(frontSoffit);

  return {
    left: hasLeftHip
      ? pitchesMatch(leftSidePitchDeg, frontPitchDeg)
        ? frontSoffit
        : solveSoffitForTargetFasciaHeight({
            targetFasciaHeightMM,
            pitchDeg: leftSidePitchDeg,
            materials,
          })
      : 0,

    right: hasRightHip
      ? pitchesMatch(rightSidePitchDeg, frontPitchDeg)
        ? frontSoffit
        : solveSoffitForTargetFasciaHeight({
            targetFasciaHeightMM,
            pitchDeg: rightSidePitchDeg,
            materials,
          })
      : 0,
  };
};

  let sideSoffits = getSideSoffits(effectiveFrontSoffitMM);

  const sideTooSmall = () =>
    (hasLeftHip && sideSoffits.left < MIN_OPEN_SIDE_SOFFIT_MM) ||
    (hasRightHip && sideSoffits.right < MIN_OPEN_SIDE_SOFFIT_MM);

  if (sideTooSmall()) {
    adjusted = true;

    let low = effectiveFrontSoffitMM;
    let high = 1000;

    for (let i = 0; i < 30; i += 1) {
      const mid = (low + high) / 2;
      sideSoffits = getSideSoffits(mid);

      if (sideTooSmall()) {
        low = mid;
      } else {
        high = mid;
      }
    }

    effectiveFrontSoffitMM = high;
    sideSoffits = getSideSoffits(effectiveFrontSoffitMM);
  }

  return {
    requestedFrontSoffitMM,
    effectiveFrontSoffitMM,
    leftCalculatedSoffitMM: hasLeftHip ? sideSoffits.left : 0,
    rightCalculatedSoffitMM: hasRightHip ? sideSoffits.right : 0,
    frontSoffitAutoAdjusted: adjusted,
    minOpenSideSoffitMM: MIN_OPEN_SIDE_SOFFIT_MM,
  };
};

export function calculateHippedLeanToGeometry({
  widthMM,
  projectionMM,
  pitchDeg,
  soffitDepthMM,
  materials,
  hippedSides = "both", // "left" | "right" | "both"
  leftHipWidthMM = 1000,
  rightHipWidthMM = 1000,
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

const soffitRule = calculateLevelFasciaSoffits({
  requestedFrontSoffitMM,
  frontPitchDeg: pitchDeg,
  leftSidePitchDeg,
  rightSidePitchDeg,
  hasLeftHip,
  hasRightHip,
  materials,
});

const effectiveFrontSoffitMM = soffitRule.effectiveFrontSoffitMM;
const leftCalculatedSoffitMM = soffitRule.leftCalculatedSoffitMM;
const rightCalculatedSoffitMM = soffitRule.rightCalculatedSoffitMM;

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
const externalWidthMM =
  width +
  frameThicknessMM +
  frameThicknessMM +
  leftCalculatedSoffitMM +
  rightCalculatedSoffitMM;

const externalProjectionMM =
  projection +
  frameThicknessMM +
  effectiveFrontSoffitMM;

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

  return {
    ...base,
frontPitchDeg: Number(pitchDeg) || 0,
leftSidePitchDeg,
rightSidePitchDeg,

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

requestedFrontSoffitMM: soffitRule.requestedFrontSoffitMM,
effectiveFrontSoffitMM: soffitRule.effectiveFrontSoffitMM,
frontSoffitAutoAdjusted: soffitRule.frontSoffitAutoAdjusted,
minOpenSideSoffitMM: soffitRule.minOpenSideSoffitMM,

externalWidthMM,
externalProjectionMM,
    roofType: "hippedLeanTo",

    widthMM: width,
    projectionMM: projection,

    hippedSides,
    hasLeftHip,
    hasRightHip,

    leftHipWidthMM: leftHipWidth,
    rightHipWidthMM: rightHipWidth,
    centreWidthMM: centreWidth,

    leftBossXMM: leftBossX,
    rightBossXMM: rightBossX,

    leftHipPlanLengthMM: hipPlanLengthLeft,
    rightHipPlanLengthMM: hipPlanLengthRight,

    // Diagram points, measured from front-left corner:
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