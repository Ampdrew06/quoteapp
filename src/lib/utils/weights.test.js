import {
  FIXED_PRODUCT_WEIGHTS_KG,
  getFixedProductWeightKg,
} from "./weights";

describe("fixed technical product weights", () => {
  test("keeps roof tile accessory weights outside editable Materials values", () => {
    expect(FIXED_PRODUCT_WEIGHTS_KG).toMatchObject({
      hip_ridge: 1.6,
      hip_end_cap_90: 0.15,
      hip_end_cap_135: 0.2,
    });
  });

  test("provides the confirmed structural metal weights", () => {
    expect(getFixedProductWeightKg("spar_hook")).toBe(0.25);
    expect(getFixedProductWeightKg("jack_rafter_hooks")).toBe(0.25);
    expect(getFixedProductWeightKg("jack_rafter_brackets")).toBe(0.25);
    expect(getFixedProductWeightKg("boss_rafter_terminal")).toBe(0.5);
  });
});
