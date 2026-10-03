const finiteOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * Read-only comparison between the quantity currently used by Summary and the
 * quantity derived from the manufacture ring-beam schedule.
 *
 * This deliberately does not choose a new pricing source. It only exposes the
 * difference so each material can be validated before Summary is integrated.
 */
export function buildRingBeamIntegrationAudit({
  currentSummaryQuantityM,
  ringSchedule,
  stockLengthM = 4.8,
  matchToleranceM = 0.005,
} = {}) {
  const summaryM = finiteOrNull(currentSummaryQuantityM);
  const manufactureM = finiteOrNull(
    ringSchedule?.totals?.pse30x90LengthM
  );
  const stockM = finiteOrNull(stockLengthM);

  if (
    summaryM == null ||
    manufactureM == null ||
    summaryM < 0 ||
    manufactureM < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM: summaryM,
      manufactureQuantityM: manufactureM,
      differenceM: null,
      currentSummaryOrderQty: null,
      manufactureOrderQty: null,
      stockLengthM: stockM,
    };
  }

  const differenceM = manufactureM - summaryM;
  const hasUsableStockLength = stockM != null && stockM > 0;

  return {
    valid: true,
    status:
      Math.abs(differenceM) <= Math.abs(Number(matchToleranceM) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM: summaryM,
    manufactureQuantityM: manufactureM,
    differenceM,
    currentSummaryOrderQty: hasUsableStockLength
      ? Math.ceil(summaryM / stockM)
      : null,
    manufactureOrderQty: hasUsableStockLength
      ? Math.ceil(manufactureM / stockM)
      : null,
    stockLengthM: stockM,
  };
}

/**
 * Like-for-like audit of the ring-beam base/soffit portion of the existing
 * combined 9 mm ply Summary line. Wallplate face and upstand ply are excluded.
 */
export function buildRingBeamPlyBaseIntegrationAudit({
  currentSummaryExternalWidthMM,
  currentSummaryBaseWidthMM,
  ringSchedule,
  matchToleranceM2 = 0.005,
} = {}) {
  const summaryLengthMM = finiteOrNull(currentSummaryExternalWidthMM);
  const summaryWidthMM = finiteOrNull(currentSummaryBaseWidthMM);
  const manufactureM2 = finiteOrNull(
    ringSchedule?.totals?.ply9BaseAreaM2
  );

  if (
    summaryLengthMM == null ||
    summaryWidthMM == null ||
    manufactureM2 == null ||
    summaryLengthMM < 0 ||
    summaryWidthMM < 0 ||
    manufactureM2 < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM2: null,
      manufactureQuantityM2: manufactureM2,
      differenceM2: null,
    };
  }

  const summaryM2 = (summaryLengthMM * summaryWidthMM) / 1_000_000;
  const differenceM2 = manufactureM2 - summaryM2;

  return {
    valid: true,
    status:
      Math.abs(differenceM2) <= Math.abs(Number(matchToleranceM2) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM2: summaryM2,
    manufactureQuantityM2: manufactureM2,
    differenceM2,
  };
}

/**
 * Like-for-like audit of the ring-beam upstand portion of the existing
 * combined 9 mm ply Summary line. The current Summary models one continuous
 * front strip; manufacture totals the actual upstands on every active beam.
 */
export function buildRingBeamPlyUpstandIntegrationAudit({
  currentSummaryExternalWidthMM,
  currentSummaryUpstandHeightMM = 195,
  ringSchedule,
  matchToleranceM2 = 0.005,
} = {}) {
  const summaryLengthMM = finiteOrNull(currentSummaryExternalWidthMM);
  const summaryHeightMM = finiteOrNull(currentSummaryUpstandHeightMM);
  const manufactureM2 = finiteOrNull(
    ringSchedule?.totals?.ply9UpstandAreaM2
  );

  if (
    summaryLengthMM == null ||
    summaryHeightMM == null ||
    manufactureM2 == null ||
    summaryLengthMM < 0 ||
    summaryHeightMM < 0 ||
    manufactureM2 < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM2: null,
      manufactureQuantityM2: manufactureM2,
      differenceM2: null,
    };
  }

  const summaryM2 = (summaryLengthMM * summaryHeightMM) / 1_000_000;
  const differenceM2 = manufactureM2 - summaryM2;

  return {
    valid: true,
    status:
      Math.abs(differenceM2) <= Math.abs(Number(matchToleranceM2) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM2: summaryM2,
    manufactureQuantityM2: manufactureM2,
    differenceM2,
  };
}

/**
 * Like-for-like audit of the ring-beam outer-edge 25x50 fixing lath.
 *
 * The chamfered perimeter lath belongs to the tiling assembly and is already
 * counted by the automatic tiling calculation. It is not the ring-beam outer
 * lath. The current Summary has no separate ring-beam outer-lath allowance,
 * so its established quantity is zero until live integration takes place.
 */
export function buildRingBeamOuterLathIntegrationAudit({
  currentSummaryQuantityM = 0,
  ringSchedule,
  matchToleranceM = 0.005,
} = {}) {
  const summaryM = finiteOrNull(currentSummaryQuantityM);
  const manufactureM = finiteOrNull(
    ringSchedule?.totals?.outerFixingLath25x50LengthM
  );

  if (
    summaryM == null ||
    manufactureM == null ||
    summaryM < 0 ||
    manufactureM < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM: null,
      manufactureQuantityM: manufactureM,
      differenceM: null,
    };
  }

  const differenceM = manufactureM - summaryM;

  return {
    valid: true,
    status:
      Math.abs(differenceM) <= Math.abs(Number(matchToleranceM) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM: summaryM,
    manufactureQuantityM: manufactureM,
    differenceM,
  };
}

/**
 * Audit the 25x50 finishing pieces fitted across the ring-beam upstand bays.
 * This reproduces Summary's existing regular-rafter count and assumed 617 mm
 * bay rule before comparing it with the actual manufactured bay widths.
 */
export function buildRingBeamFinishingLathIntegrationAudit({
  currentSummaryInternalWidthMM,
  rafterSpacingMM = 665,
  firstRafterCentreMM = 690,
  assumedBayWidthMM = 617,
  ringSchedule,
  matchToleranceM = 0.005,
} = {}) {
  const internalWidthMM = finiteOrNull(currentSummaryInternalWidthMM);
  const spacingMM = finiteOrNull(rafterSpacingMM);
  const firstCentreMM = finiteOrNull(firstRafterCentreMM);
  const bayWidthMM = finiteOrNull(assumedBayWidthMM);
  const manufactureM = finiteOrNull(
    ringSchedule?.totals?.finishingLath25x50LengthM
  );

  if (
    internalWidthMM == null ||
    spacingMM == null ||
    firstCentreMM == null ||
    bayWidthMM == null ||
    manufactureM == null ||
    internalWidthMM < 0 ||
    spacingMM <= 0 ||
    firstCentreMM <= 0 ||
    bayWidthMM < 0 ||
    manufactureM < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM: null,
      manufactureQuantityM: manufactureM,
      differenceM: null,
      currentSummaryUpstandCount: null,
    };
  }

  let centreCount = 0;
  for (
    let centreMM = firstCentreMM;
    centreMM <= internalWidthMM;
    centreMM += spacingMM
  ) {
    centreCount += 1;
  }

  const rafterCount = Math.max(2, centreCount + 2);
  const upstandCount = Math.max(0, rafterCount - 1);
  const summaryM = (upstandCount * bayWidthMM) / 1000;
  const differenceM = manufactureM - summaryM;

  return {
    valid: true,
    status:
      Math.abs(differenceM) <= Math.abs(Number(matchToleranceM) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM: summaryM,
    manufactureQuantityM: manufactureM,
    differenceM,
    currentSummaryUpstandCount: upstandCount,
  };
}

/**
 * Audit the 50 mm PIR fitted to ring-beam upstand faces. The current Summary
 * models one continuous 185 mm front strip; manufacture totals the individual
 * PIR faces fitted throughout every active ring-beam bay.
 */
export function buildRingBeamPirIntegrationAudit({
  currentSummaryExternalWidthMM,
  currentSummaryPirHeightMM = 185,
  ringSchedule,
  matchToleranceM2 = 0.005,
} = {}) {
  const summaryLengthMM = finiteOrNull(currentSummaryExternalWidthMM);
  const summaryHeightMM = finiteOrNull(currentSummaryPirHeightMM);
  const manufactureM2 = finiteOrNull(
    ringSchedule?.totals?.pir50AreaM2
  );

  if (
    summaryLengthMM == null ||
    summaryHeightMM == null ||
    manufactureM2 == null ||
    summaryLengthMM < 0 ||
    summaryHeightMM < 0 ||
    manufactureM2 < 0
  ) {
    return {
      valid: false,
      status: "Unavailable",
      currentSummaryQuantityM2: null,
      manufactureQuantityM2: manufactureM2,
      differenceM2: null,
    };
  }

  const summaryM2 = (summaryLengthMM * summaryHeightMM) / 1_000_000;
  const differenceM2 = manufactureM2 - summaryM2;

  return {
    valid: true,
    status:
      Math.abs(differenceM2) <= Math.abs(Number(matchToleranceM2) || 0)
        ? "Match"
        : "Review",
    currentSummaryQuantityM2: summaryM2,
    manufactureQuantityM2: manufactureM2,
    differenceM2,
  };
}

const buildConsolidatedLine = ({
  currentQuantity,
  proposedQuantity,
  unitPrice,
  weightPerUnit,
  stockUnitSize,
  wastePercent,
}) => {
  const currentOrderQty =
    stockUnitSize > 0 ? Math.ceil(currentQuantity / stockUnitSize) : null;
  const proposedOrderQty =
    stockUnitSize > 0 ? Math.ceil(proposedQuantity / stockUnitSize) : null;
  const wasteMultiplier = 1 + Math.max(0, wastePercent) / 100;

  return {
    currentQuantity,
    proposedQuantity,
    difference: proposedQuantity - currentQuantity,
    currentOrderQty,
    proposedOrderQty,
    currentWeightKg: currentQuantity * weightPerUnit,
    proposedWeightKg: proposedQuantity * weightPerUnit,
    currentBaseCost: currentQuantity * unitPrice,
    proposedBaseCost: proposedQuantity * unitPrice,
    currentChargeableCost: currentQuantity * unitPrice * wasteMultiplier,
    proposedChargeableCost: proposedQuantity * unitPrice * wasteMultiplier,
  };
};

/**
 * First read-only proposed Summary consolidation. PSE is wholly manufacture
 * derived. The 9 mm line combines the validated ring-beam base and upstands
 * with the existing wallplate-face allowance, which remains explicitly
 * provisional until the wallplate material audit is available.
 */
export function buildRingBeamSummaryConsolidation({
  currentSummaryExternalWidthMM,
  currentSummaryBaseWidthMM,
  currentSummaryUpstandHeightMM = 195,
  currentSummaryWallplateFaceHeightMM = 220,
  currentExternalTilingLathM = 0,
  currentInternalFixingLathM = 0,
  currentRingBeamFinishingLathM = 0,
  currentPirCradleAreaM2 = 0,
  currentPirCradleWeightMultiplier = 1,
  currentSummaryPirHeightMM = 185,
  ringSchedule,
  materials = {},
} = {}) {
  const externalWidthMM = finiteOrNull(currentSummaryExternalWidthMM);
  const baseWidthMM = finiteOrNull(currentSummaryBaseWidthMM);
  const upstandHeightMM = finiteOrNull(currentSummaryUpstandHeightMM);
  const wallplateHeightMM = finiteOrNull(
    currentSummaryWallplateFaceHeightMM
  );
  const proposedPseM = finiteOrNull(
    ringSchedule?.totals?.pse30x90LengthM
  );
  const proposedRingPlyM2 = finiteOrNull(
    ringSchedule?.totals?.ply9TotalAreaM2
  );
  const proposedRingOuterLathM = finiteOrNull(
    ringSchedule?.totals?.outerFixingLath25x50LengthM
  );
  const proposedRingFinishingLathM = finiteOrNull(
    ringSchedule?.totals?.finishingLath25x50LengthM
  );
  const proposedRingPirM2 = finiteOrNull(
    ringSchedule?.totals?.pir50AreaM2
  );
  const externalTilingLathM = finiteOrNull(currentExternalTilingLathM);
  const internalFixingLathM = finiteOrNull(currentInternalFixingLathM);
  const legacyFinishingLathM = finiteOrNull(
    currentRingBeamFinishingLathM
  );
  const cradlePirM2 = finiteOrNull(currentPirCradleAreaM2);
  const cradleWeightMultiplier = finiteOrNull(
    currentPirCradleWeightMultiplier
  );
  const summaryPirHeightMM = finiteOrNull(currentSummaryPirHeightMM);

  if (
    externalWidthMM == null ||
    baseWidthMM == null ||
    upstandHeightMM == null ||
    wallplateHeightMM == null ||
    proposedPseM == null ||
    proposedRingPlyM2 == null ||
    proposedRingOuterLathM == null ||
    proposedRingFinishingLathM == null ||
    proposedRingPirM2 == null ||
    externalTilingLathM == null ||
    internalFixingLathM == null ||
    legacyFinishingLathM == null ||
    cradlePirM2 == null ||
    cradleWeightMultiplier == null ||
    summaryPirHeightMM == null
  ) {
    return { valid: false, status: "Unavailable", lines: {} };
  }

  const externalWidthM = externalWidthMM / 1000;
  const currentBaseM2 = externalWidthM * (baseWidthMM / 1000);
  const currentUpstandM2 = externalWidthM * (upstandHeightMM / 1000);
  const carriedWallplateFaceM2 =
    externalWidthM * (wallplateHeightMM / 1000);
  const currentPlyM2 =
    currentBaseM2 + currentUpstandM2 + carriedWallplateFaceM2;
  const proposedPlyM2 = proposedRingPlyM2 + carriedWallplateFaceM2;

  // Automatic tiling already includes the chamfered perimeter row. It is a
  // separate physical use from the ring-beam outer-edge lath, so both remain
  // in the proposed total. Ridge/hip laths are deliberately not guessed here;
  // they will be added by the tile-system audit.
  const currentLathM =
    externalTilingLathM + internalFixingLathM + legacyFinishingLathM;
  const proposedLathM =
    externalTilingLathM +
    internalFixingLathM +
    proposedRingOuterLathM +
    proposedRingFinishingLathM;

  const currentRingPirM2 =
    externalWidthM * (summaryPirHeightMM / 1000);
  const currentPirM2 = cradlePirM2 + currentRingPirM2;
  const proposedPirM2 = cradlePirM2 + proposedRingPirM2;

  const pseMaterial = materials?.pse30x90 || {};
  const plyMaterial = materials?.ply9mm || {};
  const plySheetAreaM2 =
    Number(plyMaterial.sheet_len_m ?? 2.4) *
    Number(plyMaterial.sheet_width_m ?? 1.2);
  const lathMaterial = materials?.lath25x50 || {};
  const lathWeightPerM = Number(
    lathMaterial.weight_kg_per_m ??
      materials?.chamferLath?.weight_kg_per_m ??
      materials?.chamfer_lath_weight_kg_per_m ??
      0
  );
  const lathWastePercent = Number(
    lathMaterial.waste_percent ??
      lathMaterial.waste_pct ??
      materials?.chamferLath?.waste_percent ??
      materials?.chamferLath?.waste_pct ??
      0
  );
  const pirMaterial = materials?.pir50 || {};
  const pirSheetAreaM2 =
    Number(pirMaterial.sheet_w_m ?? 1.2) *
    Number(pirMaterial.sheet_h_m ?? 2.4);
  const pirPricePerM2 = Number(
    pirMaterial.price_per_m2 ?? materials?.pir50_per_m2 ?? 0
  );
  const pirWeightPerM2 = Number(
    pirMaterial.weight_kg_per_m2 ??
      materials?.pir50_weight_kg_per_m2 ??
      0
  );

  const buildPirLine = () => ({
    currentQuantity: currentPirM2,
    proposedQuantity: proposedPirM2,
    difference: proposedPirM2 - currentPirM2,
    currentOrderQty:
      pirSheetAreaM2 > 0 ? Math.ceil(currentPirM2 / pirSheetAreaM2) : null,
    proposedOrderQty:
      pirSheetAreaM2 > 0 ? Math.ceil(proposedPirM2 / pirSheetAreaM2) : null,
    currentWeightKg:
      cradlePirM2 * pirWeightPerM2 * cradleWeightMultiplier +
      currentRingPirM2 * pirWeightPerM2,
    proposedWeightKg:
      cradlePirM2 * pirWeightPerM2 * cradleWeightMultiplier +
      proposedRingPirM2 * pirWeightPerM2,
    currentBaseCost: currentPirM2 * pirPricePerM2,
    proposedBaseCost: proposedPirM2 * pirPricePerM2,
    currentChargeableCost: currentPirM2 * pirPricePerM2,
    proposedChargeableCost: proposedPirM2 * pirPricePerM2,
    unit: "m²",
    carriedCradleM2: cradlePirM2,
    note: "Retains rafter-web cradle; replaces front-only upstand strip with manufacture faces",
  });

  return {
    valid: true,
    status: "Provisional",
    lines: {
      pse30x90: {
        ...buildConsolidatedLine({
          currentQuantity: externalWidthM,
          proposedQuantity: proposedPseM,
          unitPrice: Number(
            materials?.ringbeam_pse90x30_per_m ??
              pseMaterial.price_per_m ??
              0
          ),
          weightPerUnit: Number(pseMaterial.weight_kg_per_m ?? 0),
          stockUnitSize: Number(pseMaterial.stock_len_m ?? 4.8),
          wastePercent: Number(
            pseMaterial.waste_percent ?? pseMaterial.waste_pct ?? 0
          ),
        }),
        unit: "m",
        note: "Manufacture-derived ring-beam total",
      },
      ply9mm: {
        ...buildConsolidatedLine({
          currentQuantity: currentPlyM2,
          proposedQuantity: proposedPlyM2,
          unitPrice: Number(plyMaterial.price_per_m2 ?? 0),
          weightPerUnit: Number(plyMaterial.weight_kg_per_m2 ?? 0),
          stockUnitSize: Number(plySheetAreaM2 || 0),
          wastePercent: Number(
            plyMaterial.waste_percent ?? plyMaterial.waste_pct ?? 0
          ),
        }),
        unit: "m²",
        carriedWallplateFaceM2,
        note: "Includes existing wallplate-face allowance; wallplate audit pending",
      },
      lath25x50: {
        ...buildConsolidatedLine({
          currentQuantity: currentLathM,
          proposedQuantity: proposedLathM,
          unitPrice: Number(
            lathMaterial.price_per_m ??
              materials?.lath_25x50_price_per_m ??
              materials?.lath_50x25_per_m ??
              0
          ),
          weightPerUnit: lathWeightPerM,
          stockUnitSize: Number(materials?.lath_stock_length_m ?? 4.8),
          wastePercent: lathWastePercent,
        }),
        unit: "m",
        externalTilingLathM,
        internalFixingLathM,
        currentRingBeamFinishingLathM: legacyFinishingLathM,
        proposedRingBeamOuterLathM: proposedRingOuterLathM,
        proposedRingBeamFinishingLathM: proposedRingFinishingLathM,
        ridgeHipLathStatus: "Pending tile audit",
        note: "All 25×50 uses consolidated; ridge/hip laths pending tile audit",
      },
      pir50: buildPirLine(),
    },
  };
}
