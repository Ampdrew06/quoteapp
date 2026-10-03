import { externalFacetAreaM2, coveringWeightRates, apportionInstalledWeight } from "./installedCoveringWeights";

test("adds sloped trapezoid and triangle faces without applying pitch twice", () => {
  expect(externalFacetAreaM2([
    { geometry: { tiling: { baseWidthMM: 6000, topWidthMM: 4000, heightMM: 3000 } } },
    { tilingGeometry: { baseWidthMM: 3000, topWidthMM: 0, heightMM: 2000 } },
    { exists: false, tilingGeometry: { baseWidthMM: 9000, topWidthMM: 9000, heightMM: 9000 } },
  ])).toBe(18);
});

test("uses one reference density rather than the selected SuperQuilt roll size", () => {
  const rates = coveringWeightRates({ superquilt_12m_weight_kg_each: 7.5,
    superquilt_15m_weight_kg_each: 9, breather_roll_weight_kg: 9 });
  expect(rates.superQuiltKgPerM2).toBe(0.625);
  expect(rates.membraneKgPerM2).toBe(0.18);
  const sum = (values) => Number(values.reduce((a, b) => a + b, 0).toFixed(2));
  expect(sum(apportionInstalledWeight(22.126, rates.superQuiltKgPerM2, [12, 12])))
    .toBe(sum(apportionInstalledWeight(22.126, rates.superQuiltKgPerM2, [12, 15])));
});

test("preserves exact displayed total when splitting three rows", () => {
  expect(apportionInstalledWeight(10, 0.1, [1, 1, 1])).toEqual([0.33, 0.33, 0.34]);
});

test("accepts explicit area weight rates and safely handles empty geometry", () => {
  expect(coveringWeightRates({ superquilt_weight_kg_per_m2: 0.6,
    breather_weight_kg_per_m2: 0.2 })).toEqual({ superQuiltKgPerM2: 0.6, membraneKgPerM2: 0.2 });
  expect(externalFacetAreaM2([])).toBe(0);
  expect(apportionInstalledWeight(0, 0.6, [12])).toEqual([0]);
});
