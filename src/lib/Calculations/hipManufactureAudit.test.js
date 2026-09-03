import { buildHipManufactureAudit } from "./hipManufactureAudit";

const profile = {
  valid: true,
  hipPitchDeg: 12.97,
  hipPlanLengthMM: 3683.48,
  externalSlopeLengthMM: 3885.83,
  internalSlopeLengthMM: 3619.88,
  horizontalFootCutMM: 259.16,
  verticalFootCutMM: 166.06,
  topVerticalCutMM: 225.78,
};

describe("buildHipManufactureAudit", () => {
  test("compares the saved CAD reference roof without changing its geometry", () => {
    const result = buildHipManufactureAudit({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        widthMM: 5870,
        projMM: 3230,
        pitchDeg: 15,
        requestedLeftSidePitchDeg: 25,
        requestedRightSidePitchDeg: 25,
      },
      geometry: {
        hasLeftHip: true,
        hasRightHip: true,
        leftHipManufactureV2: profile,
        rightHipManufactureV2: profile,
      },
      edgeModel: {
        edges: [
          { kind: "hip", side: "left", lengthMM: 4198, structuralLengthMM: 3655 },
          { kind: "hip", side: "right", lengthMM: 4198, structuralLengthMM: 3655 },
        ],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.cadReferenceApplicable).toBe(true);
    expect(result.hips).toHaveLength(2);
    expect(result.hips[0]).toMatchObject({
      side: "left",
      finishedTiledEdgeMM: 4198,
      structuralAuditLengthMM: 3655,
      allWithinCadTolerance: true,
      manufactureRef: "R2",
    });
  });

  test("shows live dimensions without applying the CAD comparison to another roof", () => {
    const result = buildHipManufactureAudit({
      roofInputs: {
        roofStyle: "hippedLeanTo",
        widthMM: 5000,
        projMM: 3000,
        pitchDeg: 18,
      },
      geometry: { leftHipManufactureV2: profile },
    });

    expect(result.valid).toBe(true);
    expect(result.cadReferenceApplicable).toBe(false);
    expect(result.hips[0].measurements.every(
      (measurement) => measurement.referenceMM === null
    )).toBe(true);
  });
});
