import { buildHipRidgeLathIntegrationAudit } from "./hipRidgeLathIntegrationAudit";

const edgeModel = { valid: true, edges: [
  { id: "hip-left", kind: "hip", lengthMM: 3500 },
  { id: "hip-right", kind: "hip", lengthMM: 3500 },
  { id: "ridge", kind: "ridge", lengthMM: 1210 },
  { id: "eaves", kind: "eaves", lengthMM: 6000 },
] };

test("steel uses two laths along each hip and ridge but tape only on hips", () => {
  const result = buildHipRidgeLathIntegrationAudit({ edgeModel, tileSystem: "britmet" });
  expect(result.quantities.hipLathM).toBe(14);
  expect(result.quantities.ridgeLathM).toBe(2.42);
  expect(result.quantities.tapeLengthM).toBe(14);
  expect(result.quantities.tapeRollQty).toBe(3);
  expect(result.ridgeVentilationPending).toBe(true);
});

test("Metrotile follows steel requirements", () => {
  expect(buildHipRidgeLathIntegrationAudit({ edgeModel, tileSystem: "Metrotile" }).steel).toBe(true);
});

test("LiteSlate and Tapco require neither support laths nor foam tape", () => {
  for (const tileSystem of ["LiteSlate", "Tapco"]) {
    const result = buildHipRidgeLathIntegrationAudit({ edgeModel, tileSystem });
    expect(result.quantities.additionalLathM).toBe(0);
    expect(result.quantities.tapeRollQty).toBe(0);
    expect(result.ridgeVentilationPending).toBe(false);
  }
});

test("aggregates laths with existing stock instead of rounding separate uses", () => {
  const result = buildHipRidgeLathIntegrationAudit({
    edgeModel: { valid: true, edges: [{ kind: "hip", lengthMM: 500 }] },
    currentLathM: 8.6, materials: { lath_stock_length_m: 4.8 },
  });
  expect(result.quantities.proposedLathM).toBe(9.6);
  expect(result.quantities.currentLathStockQty).toBe(2);
  expect(result.quantities.proposedLathStockQty).toBe(2);
});

test("uses whole tape rolls for cost and installed tape length for weight", () => {
  const result = buildHipRidgeLathIntegrationAudit({ edgeModel,
    materials: { expanding_foam_roll_price_each: 10, expanding_foam_roll_weight_kg_each: 0.56 } });
  expect(result.tapeCost).toBe(30);
  expect(Number(result.tapeInstalledWeightKg.toFixed(2))).toBe(1.4);
});

test("handles no hips, missing rates and invalid geometry without inventing requirements", () => {
  const result = buildHipRidgeLathIntegrationAudit({ edgeModel: { valid: true, edges: [] } });
  expect(result.quantities.tapeRollQty).toBe(0);
  expect(result.tapeCost).toBe(null);
  expect(buildHipRidgeLathIntegrationAudit().valid).toBe(false);
  expect(buildHipRidgeLathIntegrationAudit({ edgeModel, tileSystem: "unknown" }).valid).toBe(false);
});
