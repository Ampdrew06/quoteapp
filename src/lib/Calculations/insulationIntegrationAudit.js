import { buildProvisionalHippedLeanToTimber } from "./provisionalHippedLeanToTimber";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const nonNegative = (value) => Math.max(0, finite(value));
const degToRad = (degrees) => (finite(degrees) * Math.PI) / 180;
const slopeArea = (planAreaM2, pitchDeg) => {
  const cosine = Math.cos(degToRad(pitchDeg));
  return cosine > 0 ? nonNegative(planAreaM2) / cosine : 0;
};

const slopeLengthMM = (planDepthMM, pitchDeg) => {
  const cosine = Math.cos(degToRad(pitchDeg));
  return cosine > 0 ? nonNegative(planDepthMM) / cosine : 0;
};

const rowsIncludingEnd = (slopeMM, centresMM) => {
  const length = nonNegative(slopeMM);
  const centres = nonNegative(centresMM);
  if (length <= 0 || centres <= 0) return [];
  const rows = [];
  for (let position = 0; position < length; position += centres) {
    rows.push(position);
  }
  if (!rows.length || Math.abs(rows[rows.length - 1] - length) > 0.001) {
    rows.push(length);
  }
  return rows;
};

const triangularRows = (slopeMM, centresMM) =>
  rowsIncludingEnd(slopeMM, centresMM).filter(
    (position) => position < nonNegative(slopeMM) - 0.001
  );

const chooseSuperQuiltMix = ({
  requiredNominalM2,
  price12 = 0,
  price15 = 0,
} = {}) => {
  const required = nonNegative(requiredNominalM2);
  if (required <= 0) return { rolls12: 0, rolls15: 0, rollCount: 0, coverageM2: 0, cost: 0 };
  const limit = Math.ceil(required / 12) + 3;
  let best = null;
  for (let rolls12 = 0; rolls12 <= limit; rolls12 += 1) {
    for (let rolls15 = 0; rolls15 <= limit; rolls15 += 1) {
      if (rolls12 + rolls15 === 0) continue;
      const coverageM2 = rolls12 * 12 + rolls15 * 15;
      if (coverageM2 + 1e-9 < required) continue;
      const rollCount = rolls12 + rolls15;
      const cost = rolls12 * nonNegative(price12) + rolls15 * nonNegative(price15);
      if (
        !best ||
        coverageM2 < best.coverageM2 ||
        (coverageM2 === best.coverageM2 && rollCount < best.rollCount) ||
        (coverageM2 === best.coverageM2 && rollCount === best.rollCount && cost < best.cost)
      ) {
        best = { rolls12, rolls15, rollCount, coverageM2, cost };
      }
    }
  }
  return best;
};

/**
 * Read-only insulation audit for a Hipped Lean-To.
 *
 * PIR100 is derived from the internal roof surfaces, less the plan-width
 * footprint of the Steico roof members. PIR50 cradle is driven by the faces
 * that border insulation bays: two faces per roof member and one inward face
 * on each active sloping wallbar. Horizontal wallplate members are excluded.
 */
export function buildHippedLeanToInsulationAudit({
  roofInputs = {},
  geometry = null,
  ringSchedule = null,
  timberSchedule = null,
  currentSummaryPir50AreaM2 = null,
  memberWidthMM = 48,
  cradleStripWidthMM = 140,
  wastePercent = 5,
  sheetWidthMM = 1200,
  sheetLengthMM = 2400,
  internalLathCentresMM = 400,
  superQuiltOverlapMM = 50,
  superQuiltWastePercent = 6,
  superQuiltRollWidthMM = 1200,
  superQuilt12Price = 0,
  superQuilt15Price = 0,
  currentSummaryInternalLathM = null,
} = {}) {
  if (!geometry || (!geometry.hasLeftHip && !geometry.hasRightHip)) {
    return { valid: false, status: "Unavailable", errors: ["Hipped Lean-To geometry is unavailable."] };
  }

  const widthMM = nonNegative(
    roofInputs.widthMM ?? roofInputs.internalWidthMM ?? geometry.widthMM
  );
  const projectionMM = nonNegative(
    roofInputs.projMM ??
      roofInputs.internalProjectionMM ??
      geometry.projectionMM
  );
  if (widthMM <= 0 || projectionMM <= 0) {
    return { valid: false, status: "Unavailable", errors: ["Internal roof dimensions are unavailable."] };
  }

  const leftHipWidthMM = geometry.hasLeftHip
    ? nonNegative(geometry.resolvedLeftHipWidthMM)
    : 0;
  const rightHipWidthMM = geometry.hasRightHip
    ? nonNegative(geometry.resolvedRightHipWidthMM)
    : 0;
  const totalPlanAreaM2 = (widthMM * projectionMM) / 1_000_000;
  const leftPlanAreaM2 =
    (leftHipWidthMM * projectionMM) / 2_000_000;
  const rightPlanAreaM2 =
    (rightHipWidthMM * projectionMM) / 2_000_000;
  const frontPlanAreaM2 = Math.max(
    0,
    totalPlanAreaM2 - leftPlanAreaM2 - rightPlanAreaM2
  );

  const facetAreas = {
    frontM2: slopeArea(frontPlanAreaM2, geometry.frontPitchDeg),
    leftM2: slopeArea(leftPlanAreaM2, geometry.leftSidePitchDeg),
    rightM2: slopeArea(rightPlanAreaM2, geometry.rightSidePitchDeg),
  };
  const grossInternalRoofAreaM2 =
    facetAreas.frontM2 + facetAreas.leftM2 + facetAreas.rightM2;

  const timber =
    timberSchedule ??
    buildProvisionalHippedLeanToTimber({ roofInputs, geometry });
  if (!timber?.valid || !Array.isArray(timber?.members)) {
    return { valid: false, status: "Unavailable", errors: ["Manufactured roof-member lengths are unavailable."] };
  }

  const memberInternalLengthM = timber.members.reduce(
    (sum, member) => sum + nonNegative(member.internalLengthMM) / 1000,
    0
  );
  const timberFootprintAreaM2 =
    memberInternalLengthM * (nonNegative(memberWidthMM) / 1000);
  const pir100NetAreaM2 = Math.max(
    0,
    grossInternalRoofAreaM2 - timberFootprintAreaM2
  );
  const wasteMultiplier = 1 + nonNegative(wastePercent) / 100;
  const pir100OrderAreaM2 = pir100NetAreaM2 * wasteMultiplier;

  const leftWallbarLengthM =
    nonNegative(geometry.leftInternalWallBarSlopeMM) / 1000;
  const rightWallbarLengthM =
    nonNegative(geometry.rightInternalWallBarSlopeMM) / 1000;
  const wallbarCradleLengthM = leftWallbarLengthM + rightWallbarLengthM;
  const roofMemberCradleLengthM = memberInternalLengthM * 2;
  const cradleTotalLengthM =
    roofMemberCradleLengthM + wallbarCradleLengthM;
  const cradleNetAreaM2 =
    cradleTotalLengthM * (nonNegative(cradleStripWidthMM) / 1000);
  const cradleOrderAreaM2 = cradleNetAreaM2 * wasteMultiplier;
  const ringBeamPir50AreaM2 = nonNegative(
    ringSchedule?.totals?.pir50AreaM2
  );
  const pir50CombinedAreaM2 =
    cradleOrderAreaM2 + ringBeamPir50AreaM2;

  const sheetAreaM2 =
    (nonNegative(sheetWidthMM) * nonNegative(sheetLengthMM)) / 1_000_000;
  const orderQty = (areaM2) =>
    sheetAreaM2 > 0 ? Math.ceil(nonNegative(areaM2) / sheetAreaM2) : 0;

  const currentPir50 = Number(currentSummaryPir50AreaM2);
  const currentPir50AreaM2 = Number.isFinite(currentPir50)
    ? Math.max(0, currentPir50)
    : null;
  const frontPitchDeg = finite(geometry.frontPitchDeg);
  const currentPir100NetAreaM2 = slopeArea(totalPlanAreaM2, frontPitchDeg);
  const currentPir100AreaM2 = currentPir100NetAreaM2 * wasteMultiplier;

  // SuperQuilt covers the complete underside, including the timber members.
  // The configured overlap and waste allowances convert the geometric surface
  // into nominal roll area before selecting full 12 m2 and 15 m2 rolls.
  const quiltCoverageFactor =
    nonNegative(superQuiltRollWidthMM) > 0
      ? Math.max(
          0.01,
          (nonNegative(superQuiltRollWidthMM) - nonNegative(superQuiltOverlapMM)) /
            nonNegative(superQuiltRollWidthMM)
        )
      : 1;
  const superQuiltNominalAreaM2 =
    (grossInternalRoofAreaM2 / quiltCoverageFactor) *
    (1 + nonNegative(superQuiltWastePercent) / 100);
  const superQuiltMix = chooseSuperQuiltMix({
    requiredNominalM2: superQuiltNominalAreaM2,
    price12: superQuilt12Price,
    price15: superQuilt15Price,
  });

  // Internal laths follow the internal facet surfaces. The front facet is a
  // trapezoid; each hipped side is a triangle whose rows narrow to the apex.
  const centresMM = nonNegative(internalLathCentresMM) || 400;
  const frontSlopeMM = slopeLengthMM(projectionMM, geometry.frontPitchDeg);
  const frontTopWidthMM = Math.max(
    0,
    widthMM - leftHipWidthMM - rightHipWidthMM
  );
  const frontRows = rowsIncludingEnd(frontSlopeMM, centresMM).map(
    (positionMM) => ({
      positionMM,
      lengthMM:
        frontSlopeMM > 0
          ? widthMM +
            (frontTopWidthMM - widthMM) * (positionMM / frontSlopeMM)
          : 0,
    })
  );
  const buildSideRows = (hipWidthMM, pitchDeg) => {
    if (hipWidthMM <= 0) return [];
    const facetSlopeMM = slopeLengthMM(hipWidthMM, pitchDeg);
    return triangularRows(facetSlopeMM, centresMM).map((positionMM) => ({
      positionMM,
      lengthMM:
        facetSlopeMM > 0
          ? projectionMM * (1 - positionMM / facetSlopeMM)
          : 0,
    }));
  };
  const leftRows = buildSideRows(leftHipWidthMM, geometry.leftSidePitchDeg);
  const rightRows = buildSideRows(rightHipWidthMM, geometry.rightSidePitchDeg);
  const sumRowsM = (rows) =>
    rows.reduce((sum, row) => sum + nonNegative(row.lengthMM), 0) / 1000;
  const frontLathM = sumRowsM(frontRows);
  const leftLathM = sumRowsM(leftRows);
  const rightLathM = sumRowsM(rightRows);
  const internalLathTotalM = frontLathM + leftLathM + rightLathM;
  const currentInternalLath = Number(currentSummaryInternalLathM);

  return {
    valid: true,
    status: "Read only",
    assumptions: {
      memberWidthMM: nonNegative(memberWidthMM),
      cradleStripWidthMM: nonNegative(cradleStripWidthMM),
      wastePercent: nonNegative(wastePercent),
      sheetWidthMM: nonNegative(sheetWidthMM),
      sheetLengthMM: nonNegative(sheetLengthMM),
      sheetAreaM2,
      internalLathCentresMM: centresMM,
      superQuiltOverlapMM: nonNegative(superQuiltOverlapMM),
      superQuiltWastePercent: nonNegative(superQuiltWastePercent),
    },
    facets: facetAreas,
    pir100: {
      grossInternalRoofAreaM2,
      timberFootprintAreaM2,
      netAreaM2: pir100NetAreaM2,
      orderAreaM2: pir100OrderAreaM2,
      orderQty: orderQty(pir100OrderAreaM2),
      currentSummaryAreaM2: currentPir100AreaM2,
      currentSummaryOrderQty: orderQty(currentPir100AreaM2),
    },
    pir50: {
      roofMemberInternalLengthM: memberInternalLengthM,
      roofMemberCradleLengthM,
      wallbarCradleLengthM,
      cradleTotalLengthM,
      cradleNetAreaM2,
      cradleOrderAreaM2,
      ringBeamAreaM2: ringBeamPir50AreaM2,
      combinedAreaM2: pir50CombinedAreaM2,
      orderQty: orderQty(pir50CombinedAreaM2),
      currentSummaryAreaM2: currentPir50AreaM2,
      currentSummaryOrderQty:
        currentPir50AreaM2 == null ? null : orderQty(currentPir50AreaM2),
    },
    superQuilt: {
      geometricAreaM2: grossInternalRoofAreaM2,
      coverageFactor: quiltCoverageFactor,
      nominalAreaM2: superQuiltNominalAreaM2,
      ...superQuiltMix,
    },
    internalLaths: {
      front: { rows: frontRows, rowCount: frontRows.length, metres: frontLathM },
      left: { rows: leftRows, rowCount: leftRows.length, metres: leftLathM },
      right: { rows: rightRows, rowCount: rightRows.length, metres: rightLathM },
      totalM: internalLathTotalM,
      currentSummaryM: Number.isFinite(currentInternalLath)
        ? Math.max(0, currentInternalLath)
        : null,
    },
    memberCounts: timber.totals,
    errors: [],
  };
}

export default buildHippedLeanToInsulationAudit;
