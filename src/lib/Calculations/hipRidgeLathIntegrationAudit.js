const length = (value) => Math.max(0, Number(value) || 0);

// Read-only requirements. This does not modify Summary quantities or pricing.
export function buildHipRidgeLathIntegrationAudit({
  edgeModel = null,
  tileSystem = "britmet",
  materials = {},
  currentLathM = null,
} = {}) {
  const product = String(tileSystem).toLowerCase().replace(/[\s_-]/g, "");
  const steel = product.includes("britmet") || product.includes("metrotile");
  const slate = product.includes("liteslate") || product.includes("tapco");
  const errors = !edgeModel?.valid
    ? (edgeModel?.errors || ["Valid roof-edge geometry is required."])
    : !steel && !slate ? ["Unrecognised tile system; support-lath requirements have not been assumed."] : [];
  const edges = (edgeModel?.edges || []).filter((edge) =>
    edge.kind === "hip" || edge.kind === "ridge"
  );
  const rows = edges.map((edge) => {
    const edgeLengthM = length(edge.lengthMM) / 1000;
    return {
      edgeId: edge.id, kind: edge.kind, side: edge.side,
      edgeLengthM,
      lathQty: steel ? 2 : 0,
      lathLengthM: steel ? 2 * edgeLengthM : 0,
      tapeLengthM: steel && edge.kind === "hip" ? 2 * edgeLengthM : 0,
      finish: steel ? "Paint black" : "Not required",
    };
  });
  const hipLathM = rows.filter((row) => row.kind === "hip").reduce((sum, row) => sum + row.lathLengthM, 0);
  const ridgeLathM = rows.filter((row) => row.kind === "ridge").reduce((sum, row) => sum + row.lathLengthM, 0);
  const additionalLathM = hipLathM + ridgeLathM;
  const tapeLengthM = rows.reduce((sum, row) => sum + row.tapeLengthM, 0);
  const tapeRollLengthM = 5.6;
  const tapeRollQty = Math.ceil(tapeLengthM / tapeRollLengthM);
  const lathStockLengthM = length(materials.lath_stock_length_m) || 4.8;
  const baseLathM = currentLathM == null ? null : length(currentLathM);
  const proposedLathM = baseLathM == null ? null : baseLathM + additionalLathM;
  const tapePrice = materials.expanding_foam_roll_price_each;
  const tapeRollKg = materials.expanding_foam_roll_weight_kg_each;
  return {
    valid: errors.length === 0, errors, steel, rows,
    quantities: { hipLathM, ridgeLathM, additionalLathM, tapeLengthM,
      tapeRollLengthM, tapeRollQty, lathStockLengthM, baseLathM, proposedLathM,
      currentLathStockQty: baseLathM == null ? null : Math.ceil(baseLathM / lathStockLengthM),
      proposedLathStockQty: proposedLathM == null ? null : Math.ceil(proposedLathM / lathStockLengthM) },
    additionalLathCost: additionalLathM * length(materials.chamferLath?.price_per_m),
    additionalLathWeightKg: additionalLathM * length(materials.chamferLath?.weight_kg_per_m),
    tapeCost: tapePrice == null ? null : tapeRollQty * length(tapePrice),
    tapeInstalledWeightKg: tapeRollKg == null ? null : tapeLengthM * length(tapeRollKg) / tapeRollLengthM,
    ridgeVentilationPending: steel && rows.some((row) => row.kind === "ridge"),
    assumptions: [
      "Support laths follow finished external hip/ridge edge lengths from the shared roof-edge model.",
      "Two black-painted 25×50 laths per steel-shingle hip or ridge; none for slate systems.",
      "One expanding-foam strip under each hip lath; none under ridge laths.",
      "Tape and timber ordering pool total usage; no extra waste or individual-piece stock optimisation is applied here.",
      "Paint consumption and ridge ventilation strips are not quantified in this audit.",
    ],
  };
}
