// Factory fascia preparation only. Structural roof geometry remains unchanged.
export function calculateFasciaCutHeight(structuralHeightMM) {
  const structural = Number(structuralHeightMM);
  if (!Number.isFinite(structural) || structural <= 0) return null;
  const soffitAllowanceMM = 10;
  const lipMM = 10;
  const starterClearanceMM = 5;
  const fullExternalHeightMM = Math.ceil(structural + soffitAllowanceMM + lipMM);
  const externalCutHeightMM = fullExternalHeightMM - starterClearanceMM;
  return { structuralHeightMM: structural, soffitAllowanceMM, lipMM, starterClearanceMM,
    fullExternalHeightMM, externalCutHeightMM,
    coverageHeightMM: externalCutHeightMM - lipMM };
}
