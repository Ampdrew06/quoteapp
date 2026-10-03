const nonNegative = (value) => Math.max(0, Number(value) || 0);

// Facet dimensions are already measured on the sloping external face.
export function externalFacetAreaM2(facets = []) {
  return facets.filter((facet) => facet.exists !== false).reduce((total, facet) => {
    const face = facet.geometry?.tiling ?? facet.tilingGeometry;
    if (!face) return total;
    return total + (nonNegative(face.baseWidthMM) + nonNegative(face.topWidthMM)) *
      nonNegative(face.heightMM) / 2_000_000;
  }, 0);
}

export function coveringWeightRates(materials = {}) {
  const reference12 = (materials.superquilt_options || []).find(
    (option) => Number(option.coverage_m2) === 12
  );
  // Always use the same 12m² reference, irrespective of the ordered roll mix.
  const quiltReferenceKg = materials.superquilt_12m_weight_kg_each ??
    reference12?.weight_kg_per_roll ?? materials.superquilt_roll_weight_kg ?? 0;
  const membraneRollKg = materials.breather_roll_weight_kg ??
    materials.breatherMembrane?.weight_kg_per_roll ?? 0;
  return {
    superQuiltKgPerM2: nonNegative(materials.superquilt_weight_kg_per_m2 ??
      (nonNegative(quiltReferenceKg) / 12)),
    membraneKgPerM2: nonNegative(materials.breather_weight_kg_per_m2 ??
      (nonNegative(membraneRollKg) / 50)),
  };
}

// Apportion display rows only after calculating the fixed installed total.
// Allocate rounding to the final row so the displayed weights add up exactly.
export function apportionInstalledWeight(areaM2, kgPerM2, coverages = []) {
  const totalKg = Math.round(nonNegative(areaM2) * nonNegative(kgPerM2) * 100) / 100;
  const coverage = coverages.reduce((sum, value) => sum + nonNegative(value), 0);
  let allocated = 0;
  return coverages.map((value, index) => {
    const kg = index === coverages.length - 1 ? totalKg - allocated :
      (coverage > 0 ? Math.round(totalKg * nonNegative(value) / coverage * 100) / 100 : 0);
    allocated += kg;
    return Math.round(kg * 100) / 100;
  });
}
