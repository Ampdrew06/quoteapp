import { applyWeightsToLines } from "../utils/weights";
import { buildHipRidgeLathIntegrationAudit } from "./hipRidgeLathIntegrationAudit";
import { selectHipRidgeLathSummaryContribution } from "./hipRidgeLathSummaryIntegration";

const edgeModel = { valid: true, edges: [
  { id: "left", kind: "hip", lengthMM: 3752 },
  { id: "right", kind: "hip", lengthMM: 3752 },
] };

test("contributes approved lath usage and one separate whole-roll tape line", () => {
  const result = selectHipRidgeLathSummaryContribution(buildHipRidgeLathIntegrationAudit({
    edgeModel, materials: { expanding_foam_roll_price_each: 13 },
  }));
  expect(result.additionalLathM).toBe(15.008);
  expect(result.tapeLine.qty).toBe(3);
  expect(result.tapeLine.line).toBe(39);
  expect(result.tapeLine.weight_kg).toBe(0);
  expect(result.tapeLine.weight_unconfigured).toBe(true);
});

test("slate and invalid audits add neither laths nor tape", () => {
  expect(selectHipRidgeLathSummaryContribution(null)).toEqual({ additionalLathM: 0, tapeLine: null });
  expect(selectHipRidgeLathSummaryContribution(buildHipRidgeLathIntegrationAudit({
    edgeModel, tileSystem: "Tapco",
  }))).toEqual({ additionalLathM: 0, tapeLine: null });
});

test("uses installed tape length for weight while charging whole rolls", () => {
  const result = selectHipRidgeLathSummaryContribution(buildHipRidgeLathIntegrationAudit({
    edgeModel, materials: { expanding_foam_roll_price_each: 13, expanding_foam_roll_weight_kg_each: 0.56 },
  }));
  expect(result.tapeLine.weight_kg).toBe(1.5);
  expect(result.tapeLine.weight_unconfigured).toBe(false);
  expect(result.tapeLine.line).toBe(39);
});


test("existing weight filler preserves unconfigured tape weight despite canned-foam weights", () => {
  const result = selectHipRidgeLathSummaryContribution(buildHipRidgeLathIntegrationAudit({
    edgeModel, materials: { expanding_foam_roll_price_each: 13 },
  }));
  const patched = applyWeightsToLines([result.tapeLine], { expandingFoam: { weight_kg_each: 99 } })[0];
  expect(patched.weight_kg).toBe(0);
  expect(patched.totalWeightKg).toBe(0);
});
