import {
  buildHippedWallplateIntegrationAudit,
  buildWallplateSummaryProposal,
} from "./wallplateIntegrationAudit";

const doubleHippedGeometry = {
  horizontalWallplateExternalLengthMM: 4098,
  leftExternalWallBarSlopeMM: 1936,
  rightExternalWallBarSlopeMM: 1936,
  plainRafterCount: 5,
  bossQty: 2,
  sparHookQty: 8,
};

describe("Hipped Lean-To wallplate integration audit", () => {
  test("totals all three Steico wallplate members", () => {
    const result = buildHippedWallplateIntegrationAudit({
      geometry: doubleHippedGeometry,
      currentSummaryExternalWidthMM: 7356,
    });

    expect(result.valid).toBe(true);
    expect(result.steico.current).toBeCloseTo(7.356, 6);
    expect(result.steico.manufacture).toBeCloseTo(7.97, 6);
  });

  test("uses the 143 mm Steico web for infill and four chevrons", () => {
    const result = buildHippedWallplateIntegrationAudit({
      geometry: doubleHippedGeometry,
      currentSummaryExternalWidthMM: 7356,
    });

    expect(result.ply18.chevronCount).toBe(4);
    expect(result.ply18.chevronBlankWidthMM).toBe(600);
    expect(result.ply18.infillAreaM2).toBeCloseTo(0.586014, 6);
    expect(result.ply18.chevronAreaM2).toBeCloseTo(0.3432, 6);
    expect(result.ply18.manufacture).toBeCloseTo(0.929214, 6);
  });

  test("separates front faceplate, rear covers and rear packers", () => {
    const result = buildHippedWallplateIntegrationAudit({
      geometry: doubleHippedGeometry,
      currentSummaryExternalWidthMM: 7356,
    });

    expect(result.ply9.frontFaceplateLengthMM).toBe(4798);
    expect(result.ply9.rearChevronCoverLengthMM).toBe(1400);
    expect(result.ply9.rearPackerCount).toBe(9);
    expect(result.ply9.manufacture).toBeCloseTo(1.51206, 6);
  });

  test("counts ordinary-rafter hangers and boss hardware without duplication", () => {
    const result = buildHippedWallplateIntegrationAudit({
      geometry: doubleHippedGeometry,
      currentSummaryExternalWidthMM: 7356,
    });

    expect(result.hardware.joistHangers.manufacture).toBe(5);
    expect(result.hardware.bosses.manufacture).toBe(2);
    expect(result.hardware.sparHooks.manufacture).toBe(8);
  });

  test("supports a single active hipped side", () => {
    const result = buildHippedWallplateIntegrationAudit({
      geometry: {
        ...doubleHippedGeometry,
        rightExternalWallBarSlopeMM: 0,
        bossQty: 1,
        sparHookQty: 4,
      },
      currentSummaryExternalWidthMM: 6500,
    });

    expect(result.jointCount).toBe(1);
    expect(result.ply18.chevronCount).toBe(2);
    expect(result.hardware.bosses.status).toBe("Match");
    expect(result.hardware.sparHooks.status).toBe("Match");
  });

  test("fails closed when authoritative wallplate lengths are unavailable", () => {
    expect(
      buildHippedWallplateIntegrationAudit({
        geometry: {},
        currentSummaryExternalWidthMM: 7356,
      }).valid
    ).toBe(false);
  });

  test("proposes complete Summary lines without disturbing other audited components", () => {
    const audit = buildHippedWallplateIntegrationAudit({
      geometry: doubleHippedGeometry,
      currentSummaryExternalWidthMM: 7356,
    });
    const result = buildWallplateSummaryProposal({
      wallplateAudit: audit,
      steicoRoofMembersM: 38.22,
      integratedPly9M2: 6.489,
      materials: {
        ply9_sheet_price: 15.54,
        ply18_sheet_price: 23.49,
        steico: {
          price_per_m: 6.4,
          weight_kg_per_m: 2.95,
          stock_len_m: 12,
          waste_percent: 10,
        },
        ply9mm: {
          price_per_m2: 5.4,
          weight_kg_per_m2: 5.21,
          sheet_len_m: 2.4,
          sheet_width_m: 1.2,
          waste_percent: 10,
        },
        ply18mm: {
          price_per_m2: 8.16,
          weight_kg_per_m2: 10.75,
          sheet_len_m: 2.4,
          sheet_width_m: 1.2,
          waste_percent: 10,
        },
      },
    });

    expect(result.valid).toBe(true);
    expect(result.lines.steico.currentQuantity).toBeCloseTo(45.576, 6);
    expect(result.lines.steico.proposedQuantity).toBeCloseTo(46.19, 6);
    expect(result.lines.steico.currentOrderQty).toBe(4);
    expect(result.lines.steico.proposedOrderQty).toBe(4);
    expect(result.lines.ply9mm.proposedQuantity).toBeCloseTo(6.38274, 6);
    expect(result.lines.ply9mm.proposedOrderQty).toBe(3);
    expect(result.lines.ply18mm.proposedQuantity).toBeCloseTo(0.929214, 6);
    expect(result.lines.ply18mm.proposedOrderQty).toBe(1);
    expect(result.lines.ply9mm.currentBaseCost).toBe(35.02);
    expect(result.lines.ply9mm.currentChargeableCost).toBeCloseTo(38.522, 6);
    expect(result.lines.ply18mm.currentBaseCost).toBe(8.48);
    expect(result.lines.ply18mm.currentChargeableCost).toBeCloseTo(9.328, 6);
  });
});
