const finiteOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const positive = (value) => Math.max(0, finiteOrNull(value) ?? 0);

const comparison = (current, manufacture, tolerance = 0.005) => ({
  current,
  manufacture,
  difference: manufacture - current,
  status:
    Math.abs(manufacture - current) <= Math.abs(Number(tolerance) || 0)
      ? "Match"
      : "Review",
});

/**
 * Read-only Hipped Lean-To wallplate material audit.
 *
 * The wallplate is treated as a three-member assembly: one horizontal
 * wallplate plus the active sloping wallbars. This module deliberately does
 * not alter Summary. Approximate workshop allowances are explicit inputs so
 * they remain visible and testable until physical manufacture confirms them.
 */
export function buildHippedWallplateIntegrationAudit({
  geometry,
  currentSummaryExternalWidthMM,
  wallplateDepthMM = 220,
  steicoWebHeightMM = 143,
  faceplateWallbarCoverMM = 350,
  chevronSideMM = 300,
  rearChevronCoverPerSideMM = 350,
  rearPackerWidthMM = 75,
  rearPackerMaxSpacingMM = 800,
} = {}) {
  const externalWidthMM = finiteOrNull(currentSummaryExternalWidthMM);
  const ewplMM = finiteOrNull(
    geometry?.horizontalWallplateExternalLengthMM
  );
  const leftEwbsMM = positive(geometry?.leftExternalWallBarSlopeMM);
  const rightEwbsMM = positive(geometry?.rightExternalWallBarSlopeMM);

  if (
    externalWidthMM == null ||
    ewplMM == null ||
    externalWidthMM < 0 ||
    ewplMM < 0
  ) {
    return { valid: false, status: "Unavailable" };
  }

  const hasLeftJoint = leftEwbsMM > 0;
  const hasRightJoint = rightEwbsMM > 0;
  const jointCount = Number(hasLeftJoint) + Number(hasRightJoint);

  const wallplateDepth = positive(wallplateDepthMM);
  const webHeight = positive(steicoWebHeightMM);
  const faceplateCover = positive(faceplateWallbarCoverMM);
  const chevronSide = positive(chevronSideMM);
  const rearCoverSide = positive(rearChevronCoverPerSideMM);
  const packerWidth = positive(rearPackerWidthMM);
  const packerMaxSpacing = positive(rearPackerMaxSpacingMM);

  const manufactureSteicoMM = ewplMM + leftEwbsMM + rightEwbsMM;
  const steico = comparison(
    externalWidthMM / 1000,
    manufactureSteicoMM / 1000
  );

  // The front faceplate covers the whole EWPL and continues approximately
  // 350 mm onto each active wallbar. It may be made in multiple sheet pieces;
  // that workshop split does not change its net area.
  const frontFaceplateLengthMM =
    ewplMM + jointCount * faceplateCover;
  const frontFaceplateAreaM2 =
    (frontFaceplateLengthMM * wallplateDepth) / 1_000_000;

  // Each rear cover spans both sides of its joint.
  const rearChevronCoverLengthMM =
    jointCount * rearCoverSide * 2;
  const rearChevronCoverAreaM2 =
    (rearChevronCoverLengthMM * wallplateDepth) / 1_000_000;

  // Count packers independently on each uncovered run so a short wallbar is
  // not accidentally hidden by unused allowance from the horizontal member.
  const uncoveredRunsMM = [
    Math.max(0, ewplMM - jointCount * rearCoverSide),
    ...(hasLeftJoint
      ? [Math.max(0, leftEwbsMM - rearCoverSide)]
      : []),
    ...(hasRightJoint
      ? [Math.max(0, rightEwbsMM - rearCoverSide)]
      : []),
  ];
  const rearPackerCount =
    packerMaxSpacing > 0
      ? uncoveredRunsMM.reduce(
          (sum, runMM) => sum + Math.ceil(runMM / packerMaxSpacing),
          0
        )
      : 0;
  const rearPackerAreaM2 =
    (rearPackerCount * packerWidth * wallplateDepth) / 1_000_000;

  const manufacturePly9M2 =
    frontFaceplateAreaM2 +
    rearChevronCoverAreaM2 +
    rearPackerAreaM2;
  const ply9 = comparison(
    (externalWidthMM * wallplateDepth) / 1_000_000,
    manufacturePly9M2
  );

  // One continuous 143 mm-high infill along EWPL, plus two 18 mm chevrons
  // (front and back) at every joint. Each chevron is cut from a 600 mm-wide
  // blank: 300 mm on each side of its centreline.
  const currentPly18M2 = (externalWidthMM * 142) / 1_000_000;
  const infillAreaM2 = (ewplMM * webHeight) / 1_000_000;
  const chevronCount = jointCount * 2;
  const chevronBlankWidthMM = chevronSide * 2;
  const chevronAreaM2 =
    (chevronCount * chevronBlankWidthMM * webHeight) / 1_000_000;
  const manufacturePly18M2 = infillAreaM2 + chevronAreaM2;
  const ply18 = comparison(currentPly18M2, manufacturePly18M2);

  const ordinaryRafterCount = positive(geometry?.plainRafterCount);
  const currentBossQty = positive(geometry?.bossQty);
  const currentSparHookQty = positive(geometry?.sparHookQty);
  const expectedBossQty = jointCount;
  const expectedSparHookQty = jointCount * 4;

  return {
    valid: true,
    status: "Read only",
    jointCount,
    dimensions: {
      ewplMM,
      leftEwbsMM,
      rightEwbsMM,
      wallplateDepthMM: wallplateDepth,
      steicoWebHeightMM: webHeight,
    },
    steico: {
      ...steico,
      unit: "m",
      formula: "EWPL + left EWBS + right EWBS",
    },
    ply9: {
      ...ply9,
      unit: "m²",
      frontFaceplateLengthMM,
      frontFaceplateAreaM2,
      rearChevronCoverLengthMM,
      rearChevronCoverAreaM2,
      rearPackerCount,
      rearPackerAreaM2,
      rearPackerSizeMM: `${packerWidth} × ${wallplateDepth}`,
      rearPackerMaxSpacingMM: packerMaxSpacing,
    },
    ply18: {
      ...ply18,
      unit: "m²",
      infillAreaM2,
      chevronCount,
      chevronBlankWidthMM,
      chevronAreaM2,
    },
    hardware: {
      joistHangers: {
        current: ordinaryRafterCount,
        manufacture: ordinaryRafterCount,
        status: "Match",
        note: "Ordinary rafters only; hips and boss rafters are excluded",
      },
      bosses: {
        current: currentBossQty,
        manufacture: expectedBossQty,
        status: currentBossQty === expectedBossQty ? "Match" : "Review",
      },
      sparHooks: {
        current: currentSparHookQty,
        manufacture: expectedSparHookQty,
        status:
          currentSparHookQty === expectedSparHookQty ? "Match" : "Review",
        note: "Two per hip and two per boss-position rafter",
      },
    },
  };
}

const buildSummaryLine = ({
  currentQuantity,
  proposedQuantity,
  unitPrice,
  weightPerUnit,
  stockUnitSize,
  wastePercent,
  unit,
  note,
}) => {
  const current = positive(currentQuantity);
  const proposed = positive(proposedQuantity);
  const price = positive(unitPrice);
  const weight = positive(weightPerUnit);
  const stock = positive(stockUnitSize);
  const wasteMultiplier = 1 + positive(wastePercent) / 100;
  // Summary exposes quantities to two decimals and its material-price patch
  // recalculates timber costs from that displayed quantity. Preserve that
  // established behaviour so the audit's current £ values reconcile exactly.
  const currentPricedQuantity = Number(current.toFixed(2));
  const proposedPricedQuantity = Number(proposed.toFixed(2));
  const currentBaseCost = Number(
    (currentPricedQuantity * price).toFixed(2)
  );
  const proposedBaseCost = Number(
    (proposedPricedQuantity * price).toFixed(2)
  );

  return {
    currentQuantity: current,
    proposedQuantity: proposed,
    difference: proposed - current,
    currentOrderQty: stock > 0 ? Math.ceil(current / stock) : null,
    proposedOrderQty: stock > 0 ? Math.ceil(proposed / stock) : null,
    currentWeightKg: current * weight,
    proposedWeightKg: proposed * weight,
    currentBaseCost,
    proposedBaseCost,
    currentChargeableCost: currentBaseCost * wasteMultiplier,
    proposedChargeableCost: proposedBaseCost * wasteMultiplier,
    unit,
    note,
  };
};

/**
 * Read-only proposal for the three complete Summary rows affected by the
 * wallplate audit. The already-integrated ring-beam quantity is retained;
 * only its carried legacy wallplate allowance is replaced.
 */
export function buildWallplateSummaryProposal({
  wallplateAudit,
  steicoRoofMembersM,
  integratedPly9M2,
  materials = {},
} = {}) {
  const roofMembersM = finiteOrNull(steicoRoofMembersM);
  const currentIntegratedPly9M2 = finiteOrNull(integratedPly9M2);

  if (
    !wallplateAudit?.valid ||
    roofMembersM == null ||
    currentIntegratedPly9M2 == null ||
    roofMembersM < 0 ||
    currentIntegratedPly9M2 < 0
  ) {
    return { valid: false, status: "Unavailable", lines: {} };
  }

  const steicoMaterial = materials?.steico || {};
  const ply9Material = materials?.ply9mm || {};
  const ply18Material = materials?.ply18mm || {};
  const sheetArea = (material) =>
    positive(material?.sheet_len_m ?? 2.4) *
    positive(material?.sheet_width_m ?? 1.2);
  const ply9SheetArea = sheetArea(ply9Material);
  const ply18SheetArea = sheetArea(ply18Material);
  const ply9PricePerM2 =
    positive(materials?.ply9_sheet_price) > 0 && ply9SheetArea > 0
      ? positive(materials.ply9_sheet_price) / ply9SheetArea
      : positive(ply9Material.price_per_m2);
  const ply18PricePerM2 =
    positive(materials?.ply18_sheet_price) > 0 && ply18SheetArea > 0
      ? positive(materials.ply18_sheet_price) / ply18SheetArea
      : positive(
          materials?.ply18_per_m2 ?? ply18Material.price_per_m2
        );

  const currentSteicoM = roofMembersM + wallplateAudit.steico.current;
  const proposedSteicoM = roofMembersM + wallplateAudit.steico.manufacture;
  const proposedPly9M2 = Math.max(
    0,
    currentIntegratedPly9M2 -
      wallplateAudit.ply9.current +
      wallplateAudit.ply9.manufacture
  );

  return {
    valid: true,
    status: "Read only",
    lines: {
      steico: buildSummaryLine({
        currentQuantity: currentSteicoM,
        proposedQuantity: proposedSteicoM,
        unitPrice: steicoMaterial.price_per_m,
        weightPerUnit: steicoMaterial.weight_kg_per_m,
        stockUnitSize: steicoMaterial.stock_len_m ?? 12,
        wastePercent:
          steicoMaterial.waste_percent ?? steicoMaterial.waste_pct ?? 0,
        unit: "m",
        note: "Retains audited rafters, jacks and hips; replaces the straight-width wallplate allowance",
      }),
      ply9mm: buildSummaryLine({
        currentQuantity: currentIntegratedPly9M2,
        proposedQuantity: proposedPly9M2,
        unitPrice: ply9PricePerM2,
        weightPerUnit: ply9Material.weight_kg_per_m2,
        stockUnitSize: ply9SheetArea,
        wastePercent:
          ply9Material.waste_percent ?? ply9Material.waste_pct ?? 0,
        unit: "m²",
        note: "Retains audited ring-beam ply; replaces the legacy wallplate face with faceplate, rear covers and packers",
      }),
      ply18mm: buildSummaryLine({
        currentQuantity: wallplateAudit.ply18.current,
        proposedQuantity: wallplateAudit.ply18.manufacture,
        unitPrice: ply18PricePerM2,
        weightPerUnit: ply18Material.weight_kg_per_m2,
        stockUnitSize: ply18SheetArea,
        wastePercent:
          ply18Material.waste_percent ?? ply18Material.waste_pct ?? 0,
        unit: "m²",
        note: "143 mm horizontal infill plus two chevrons at each active wallplate joint",
      }),
    },
  };
}
