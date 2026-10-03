import { selectWallplateSummaryQuantities } from "./wallplateSummaryIntegration";

const legacy = {
  steicoLengthM: 7.356,
  ply9AreaM2: 1.61832,
  ply18AreaM2: 1.044552,
};

const wallplateAudit = {
  valid: true,
  steico: { manufacture: 8.077 },
  ply9: { manufacture: 1.56832 },
  ply18: { manufacture: 0.965552 },
};

describe("selectWallplateSummaryQuantities", () => {
  test("uses the complete audited set for a Hipped Lean-To", () => {
    const result = selectWallplateSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      wallplateAudit,
    });

    expect(result.valid).toBe(true);
    expect(result.source).toBe("manufacture");
    expect(result.quantities).toEqual({
      steicoLengthM: 8.077,
      ply9AreaM2: 1.56832,
      ply18AreaM2: 0.965552,
    });
  });

  test("leaves an ordinary Lean-To on its established allowances", () => {
    const result = selectWallplateSummaryQuantities({
      isHippedLeanTo: false,
      legacy,
      wallplateAudit,
    });

    expect(result.source).toBe("legacy");
    expect(result.quantities).toEqual(legacy);
  });

  test("falls back to the whole legacy set if one audited value is missing", () => {
    const result = selectWallplateSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      wallplateAudit: {
        ...wallplateAudit,
        ply9: { manufacture: undefined },
      },
    });

    expect(result.valid).toBe(false);
    expect(result.source).toBe("legacy-fallback");
    expect(result.quantities).toEqual(legacy);
  });

  test("falls back to the whole legacy set if the audit is invalid", () => {
    const result = selectWallplateSummaryQuantities({
      isHippedLeanTo: true,
      legacy,
      wallplateAudit: {
        ...wallplateAudit,
        valid: false,
      },
    });

    expect(result.source).toBe("legacy-fallback");
    expect(result.quantities).toEqual(legacy);
  });
});
