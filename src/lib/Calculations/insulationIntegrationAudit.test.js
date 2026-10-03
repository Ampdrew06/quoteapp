import { buildHippedLeanToInsulationAudit } from "./insulationIntegrationAudit";

const timberSchedule = {
  valid: true,
  members: [
    { internalLengthMM: 3000 },
    { internalLengthMM: 2000 },
    { internalLengthMM: 1000 },
  ],
  totals: { fullRafterQty: 1, jackQty: 1, hipQty: 1 },
};

const geometry = {
  hasLeftHip: true,
  hasRightHip: true,
  resolvedLeftHipWidthMM: 1000,
  resolvedRightHipWidthMM: 1000,
  frontPitchDeg: 0,
  leftSidePitchDeg: 0,
  rightSidePitchDeg: 0,
  leftInternalWallBarSlopeMM: 1500,
  rightInternalWallBarSlopeMM: 1500,
};

describe("buildHippedLeanToInsulationAudit", () => {
  test("derives PIR100 from all facet surfaces less timber footprints", () => {
    const result = buildHippedLeanToInsulationAudit({
      roofInputs: { roofStyle: "hippedLeanTo", widthMM: 6000, projMM: 3000 },
      geometry,
      timberSchedule,
      ringSchedule: { totals: { pir50AreaM2: 2 } },
      currentSummaryPir50AreaM2: 4,
    });

    expect(result.valid).toBe(true);
    expect(result.pir100.grossInternalRoofAreaM2).toBeCloseTo(18, 6);
    expect(result.pir100.timberFootprintAreaM2).toBeCloseTo(0.288, 6);
    expect(result.pir100.netAreaM2).toBeCloseTo(17.712, 6);
    expect(result.pir100.orderAreaM2).toBeCloseTo(18.5976, 6);
    expect(result.pir100.orderQty).toBe(7);
  });

  test("counts two cradle faces per roof member and one per sloping wallbar", () => {
    const result = buildHippedLeanToInsulationAudit({
      roofInputs: { roofStyle: "hippedLeanTo", widthMM: 6000, projMM: 3000 },
      geometry,
      timberSchedule,
      ringSchedule: { totals: { pir50AreaM2: 2 } },
    });

    expect(result.pir50.roofMemberCradleLengthM).toBeCloseTo(12, 6);
    expect(result.pir50.wallbarCradleLengthM).toBeCloseTo(3, 6);
    expect(result.pir50.cradleTotalLengthM).toBeCloseTo(15, 6);
    expect(result.pir50.cradleNetAreaM2).toBeCloseTo(2.1, 6);
    expect(result.pir50.cradleOrderAreaM2).toBeCloseTo(2.205, 6);
    expect(result.pir50.combinedAreaM2).toBeCloseTo(4.205, 6);
    expect(result.pir50.orderQty).toBe(2);
  });

  test("does not count the horizontal wallplate as cradle", () => {
    const result = buildHippedLeanToInsulationAudit({
      roofInputs: { widthMM: 6000, projMM: 3000 },
      geometry: {
        ...geometry,
        horizontalWallplateInternalLengthMM: 50000,
      },
      timberSchedule,
      ringSchedule: { totals: { pir50AreaM2: 0 } },
    });

    expect(result.pir50.wallbarCradleLengthM).toBe(3);
    expect(result.pir50.cradleTotalLengthM).toBe(15);
  });

  test("covers all internal facets with SuperQuilt and selects full rolls", () => {
    const result = buildHippedLeanToInsulationAudit({
      roofInputs: { widthMM: 6000, projMM: 3000 },
      geometry,
      timberSchedule,
      superQuiltOverlapMM: 50,
      superQuiltWastePercent: 6,
    });

    expect(result.superQuilt.geometricAreaM2).toBeCloseTo(18, 6);
    expect(result.superQuilt.nominalAreaM2).toBeCloseTo(19.909565, 6);
    expect(result.superQuilt.rolls12).toBe(2);
    expect(result.superQuilt.rolls15).toBe(0);
    expect(result.superQuilt.coverageM2).toBe(24);
  });

  test("builds full-width front rows and narrowing side-facet rows", () => {
    const result = buildHippedLeanToInsulationAudit({
      roofInputs: { widthMM: 6000, projMM: 3000 },
      geometry,
      timberSchedule,
      internalLathCentresMM: 400,
    });

    expect(result.internalLaths.front.rowCount).toBe(9);
    expect(result.internalLaths.front.rows[0].lengthMM).toBe(6000);
    expect(result.internalLaths.front.rows[8].lengthMM).toBe(4000);
    expect(result.internalLaths.left.rowCount).toBe(3);
    expect(result.internalLaths.left.rows[0].lengthMM).toBeCloseTo(3000, 6);
    expect(result.internalLaths.left.rows[1].lengthMM).toBeCloseTo(1800, 6);
    expect(result.internalLaths.left.rows[2].lengthMM).toBeCloseTo(600, 6);
    expect(result.internalLaths.totalM).toBeCloseTo(55.333333, 6);
  });

  test("fails closed without resolved hipped geometry", () => {
    expect(
      buildHippedLeanToInsulationAudit({
        roofInputs: { widthMM: 6000, projMM: 3000 },
        geometry: null,
      }).valid
    ).toBe(false);
  });
});
