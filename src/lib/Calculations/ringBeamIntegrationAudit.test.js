import {
  buildRingBeamIntegrationAudit,
  buildRingBeamPlyBaseIntegrationAudit,
  buildRingBeamPlyUpstandIntegrationAudit,
  buildRingBeamOuterLathIntegrationAudit,
  buildRingBeamFinishingLathIntegrationAudit,
  buildRingBeamPirIntegrationAudit,
  buildRingBeamSummaryConsolidation,
} from "./ringBeamIntegrationAudit";

describe("buildRingBeamIntegrationAudit", () => {
  test("compares the current Summary front run with all manufacture ring-beams", () => {
    const ringSchedule = {
      totals: { pse30x90LengthM: 13.176 },
    };

    const result = buildRingBeamIntegrationAudit({
      currentSummaryQuantityM: 7.356,
      ringSchedule,
      stockLengthM: 4.8,
    });

    expect(result).toEqual({
      valid: true,
      status: "Review",
      currentSummaryQuantityM: 7.356,
      manufactureQuantityM: 13.176,
      differenceM: 5.82,
      currentSummaryOrderQty: 2,
      manufactureOrderQty: 3,
      stockLengthM: 4.8,
    });
    expect(ringSchedule.totals.pse30x90LengthM).toBe(13.176);
  });

  test("marks equal quantities as a match", () => {
    const result = buildRingBeamIntegrationAudit({
      currentSummaryQuantityM: 10,
      ringSchedule: { totals: { pse30x90LengthM: 10.004 } },
    });

    expect(result.status).toBe("Match");
  });

  test("reports unavailable data without inventing a comparison", () => {
    const result = buildRingBeamIntegrationAudit({
      currentSummaryQuantityM: 5,
      ringSchedule: null,
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("Unavailable");
    expect(result.differenceM).toBeNull();
  });
});

describe("buildRingBeamPlyBaseIntegrationAudit", () => {
  test("isolates the existing Summary base/soffit portion for comparison", () => {
    const result = buildRingBeamPlyBaseIntegrationAudit({
      currentSummaryExternalWidthMM: 7230,
      currentSummaryBaseWidthMM: 220,
      ringSchedule: { totals: { ply9BaseAreaM2: 2.587 } },
    });

    expect(result.valid).toBe(true);
    expect(result.currentSummaryQuantityM2).toBeCloseTo(1.5906, 6);
    expect(result.manufactureQuantityM2).toBe(2.587);
    expect(result.differenceM2).toBeCloseTo(0.9964, 6);
    expect(result.status).toBe("Review");
  });

  test("does not treat the combined Summary wallplate or upstand areas as base ply", () => {
    const result = buildRingBeamPlyBaseIntegrationAudit({
      currentSummaryExternalWidthMM: 5000,
      currentSummaryBaseWidthMM: 200,
      ringSchedule: { totals: { ply9BaseAreaM2: 1 } },
    });

    expect(result.currentSummaryQuantityM2).toBe(1);
    expect(result.status).toBe("Match");
  });
});

describe("buildRingBeamPlyUpstandIntegrationAudit", () => {
  test("compares the Summary front strip with all manufactured upstands", () => {
    const result = buildRingBeamPlyUpstandIntegrationAudit({
      currentSummaryExternalWidthMM: 7230,
      currentSummaryUpstandHeightMM: 195,
      ringSchedule: { totals: { ply9UpstandAreaM2: 2.311 } },
    });

    expect(result.valid).toBe(true);
    expect(result.currentSummaryQuantityM2).toBeCloseTo(1.40985, 6);
    expect(result.manufactureQuantityM2).toBe(2.311);
    expect(result.differenceM2).toBeCloseTo(0.90115, 6);
    expect(result.status).toBe("Review");
  });

  test("marks an equal manufactured upstand area as a match", () => {
    const result = buildRingBeamPlyUpstandIntegrationAudit({
      currentSummaryExternalWidthMM: 5000,
      ringSchedule: { totals: { ply9UpstandAreaM2: 0.975 } },
    });

    expect(result.currentSummaryQuantityM2).toBe(0.975);
    expect(result.status).toBe("Match");
  });
});

describe("buildRingBeamOuterLathIntegrationAudit", () => {
  test("shows that the current Summary omits the ring-beam outer lath", () => {
    const result = buildRingBeamOuterLathIntegrationAudit({
      ringSchedule: {
        totals: { outerFixingLath25x50LengthM: 13.626 },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.currentSummaryQuantityM).toBe(0);
    expect(result.manufactureQuantityM).toBe(13.626);
    expect(result.differenceM).toBeCloseTo(13.626, 6);
    expect(result.status).toBe("Review");
  });

  test("marks equal outer-lath runs as a match", () => {
    const result = buildRingBeamOuterLathIntegrationAudit({
      currentSummaryQuantityM: 5,
      ringSchedule: {
        totals: { outerFixingLath25x50LengthM: 5 },
      },
    });

    expect(result.status).toBe("Match");
  });
});

describe("buildRingBeamFinishingLathIntegrationAudit", () => {
  test("reproduces the Summary assumed bays before comparing manufacture", () => {
    const result = buildRingBeamFinishingLathIntegrationAudit({
      currentSummaryInternalWidthMM: 7040,
      rafterSpacingMM: 665,
      firstRafterCentreMM: 690,
      assumedBayWidthMM: 617,
      ringSchedule: {
        totals: { finishingLath25x50LengthM: 11.852 },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.currentSummaryUpstandCount).toBe(11);
    expect(result.currentSummaryQuantityM).toBeCloseTo(6.787, 6);
    expect(result.manufactureQuantityM).toBe(11.852);
    expect(result.differenceM).toBeCloseTo(5.065, 6);
    expect(result.status).toBe("Review");
  });

  test("reports unavailable when the Summary spacing rule is invalid", () => {
    const result = buildRingBeamFinishingLathIntegrationAudit({
      currentSummaryInternalWidthMM: 7040,
      rafterSpacingMM: 0,
      ringSchedule: {
        totals: { finishingLath25x50LengthM: 11.852 },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("Unavailable");
  });
});

describe("buildRingBeamPirIntegrationAudit", () => {
  test("compares the Summary front PIR strip with all manufactured faces", () => {
    const result = buildRingBeamPirIntegrationAudit({
      currentSummaryExternalWidthMM: 7230,
      currentSummaryPirHeightMM: 185,
      ringSchedule: { totals: { pir50AreaM2: 4.385 } },
    });

    expect(result.valid).toBe(true);
    expect(result.currentSummaryQuantityM2).toBeCloseTo(1.33755, 6);
    expect(result.manufactureQuantityM2).toBe(4.385);
    expect(result.differenceM2).toBeCloseTo(3.04745, 6);
    expect(result.status).toBe("Review");
  });

  test("marks an equal PIR area as a match", () => {
    const result = buildRingBeamPirIntegrationAudit({
      currentSummaryExternalWidthMM: 5000,
      ringSchedule: { totals: { pir50AreaM2: 0.925 } },
    });

    expect(result.currentSummaryQuantityM2).toBe(0.925);
    expect(result.status).toBe("Match");
  });
});

describe("buildRingBeamSummaryConsolidation", () => {
  const materials = {
    pse30x90: {
      price_per_m: 1.28,
      weight_kg_per_m: 1.4,
      stock_len_m: 4.8,
      waste_percent: 10,
    },
    ply9mm: {
      price_per_m2: 5.4,
      weight_kg_per_m2: 5.21,
      sheet_len_m: 2.4,
      sheet_width_m: 1.2,
      waste_pct: 10,
    },
    lath25x50: {
      price_per_m: 0.62,
    },
    chamferLath: {
      weight_kg_per_m: 0.65,
      waste_percent: 10,
    },
    lath_stock_length_m: 4.8,
    pir50: {
      sheet_w_m: 1.2,
      sheet_h_m: 2.4,
      price_per_m2: 5.2778,
      weight_kg_per_m2: 1.6,
    },
  };

  test("consolidates PSE and ring-beam ply without replacing the wallplate allowance", () => {
    const result = buildRingBeamSummaryConsolidation({
      currentSummaryExternalWidthMM: 7230,
      currentSummaryBaseWidthMM: 220,
      currentSummaryUpstandHeightMM: 195,
      currentSummaryWallplateFaceHeightMM: 220,
      currentExternalTilingLathM: 100,
      currentInternalFixingLathM: 35.2,
      currentRingBeamFinishingLathM: 6.787,
      currentPirCradleAreaM2: 4.2,
      currentPirCradleWeightMultiplier: 0.6,
      ringSchedule: {
        totals: {
          pse30x90LengthM: 13.24,
          ply9TotalAreaM2: 4.898,
          outerFixingLath25x50LengthM: 13.626,
          finishingLath25x50LengthM: 11.852,
          pir50AreaM2: 4.385,
        },
      },
      materials,
    });

    expect(result.valid).toBe(true);
    expect(result.lines.pse30x90.currentQuantity).toBe(7.23);
    expect(result.lines.pse30x90.proposedQuantity).toBe(13.24);
    expect(result.lines.pse30x90.currentOrderQty).toBe(2);
    expect(result.lines.pse30x90.proposedOrderQty).toBe(3);

    expect(result.lines.ply9mm.carriedWallplateFaceM2).toBeCloseTo(1.5906, 6);
    expect(result.lines.ply9mm.currentQuantity).toBeCloseTo(4.59105, 6);
    expect(result.lines.ply9mm.proposedQuantity).toBeCloseTo(6.4886, 6);
    expect(result.lines.ply9mm.currentOrderQty).toBe(2);
    expect(result.lines.ply9mm.proposedOrderQty).toBe(3);

    expect(result.lines.lath25x50.currentQuantity).toBeCloseTo(141.987, 6);
    expect(result.lines.lath25x50.proposedQuantity).toBeCloseTo(160.678, 6);
    expect(result.lines.lath25x50.proposedOrderQty).toBe(34);
    expect(result.lines.lath25x50.ridgeHipLathStatus).toBe(
      "Pending tile audit"
    );

    expect(result.lines.pir50.currentQuantity).toBeCloseTo(5.53755, 6);
    expect(result.lines.pir50.proposedQuantity).toBeCloseTo(8.585, 6);
    expect(result.lines.pir50.currentOrderQty).toBe(2);
    expect(result.lines.pir50.proposedOrderQty).toBe(3);
  });

  test("applies material price, weight and waste without mutating quantities", () => {
    const result = buildRingBeamSummaryConsolidation({
      currentSummaryExternalWidthMM: 5000,
      currentSummaryBaseWidthMM: 200,
      currentExternalTilingLathM: 50,
      currentInternalFixingLathM: 20,
      currentRingBeamFinishingLathM: 4,
      currentPirCradleAreaM2: 2,
      currentPirCradleWeightMultiplier: 0.6,
      ringSchedule: {
        totals: {
          pse30x90LengthM: 8,
          ply9TotalAreaM2: 3,
          outerFixingLath25x50LengthM: 8,
          finishingLath25x50LengthM: 6,
          pir50AreaM2: 3,
        },
      },
      materials,
    });

    expect(result.lines.pse30x90.proposedBaseCost).toBeCloseTo(10.24, 6);
    expect(result.lines.pse30x90.proposedChargeableCost).toBeCloseTo(11.264, 6);
    expect(result.lines.pse30x90.proposedWeightKg).toBeCloseTo(11.2, 6);
    expect(result.lines.ply9mm.proposedQuantity).toBeCloseTo(4.1, 6);
    expect(result.lines.lath25x50.currentQuantity).toBe(74);
    expect(result.lines.lath25x50.proposedQuantity).toBe(84);
    expect(result.lines.lath25x50.proposedChargeableCost).toBeCloseTo(
      57.288,
      6
    );
    expect(result.lines.pir50.currentQuantity).toBeCloseTo(2.925, 6);
    expect(result.lines.pir50.proposedQuantity).toBe(5);
    expect(result.lines.pir50.proposedWeightKg).toBeCloseTo(6.72, 6);
  });

  test("prefers the editable Materials-page PSE price used by live Summary", () => {
    const result = buildRingBeamSummaryConsolidation({
      currentSummaryExternalWidthMM: 5000,
      currentSummaryBaseWidthMM: 200,
      currentExternalTilingLathM: 50,
      currentInternalFixingLathM: 20,
      currentRingBeamFinishingLathM: 4,
      currentPirCradleAreaM2: 2,
      ringSchedule: {
        totals: {
          pse30x90LengthM: 8,
          ply9TotalAreaM2: 3,
          outerFixingLath25x50LengthM: 8,
          finishingLath25x50LengthM: 6,
          pir50AreaM2: 3,
        },
      },
      materials: {
        ...materials,
        ringbeam_pse90x30_per_m: 1.44,
      },
    });

    expect(result.lines.pse30x90.proposedBaseCost).toBeCloseTo(11.52, 6);
    expect(result.lines.pse30x90.proposedChargeableCost).toBeCloseTo(
      12.672,
      6
    );
  });
});
