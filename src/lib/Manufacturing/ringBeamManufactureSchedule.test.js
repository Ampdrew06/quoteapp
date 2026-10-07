import {
  buildHippedLeanToRingBeamSchedule,
  buildRingBeamManufactureCuts,
  buildRingBeamManufactureSchedule,
} from "./ringBeamManufactureSchedule";
import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import { buildRingBeam } from "./ringBeamBuilder";

const ringBeam = (overrides = {}) => ({
  exists: true,
  lengthMM: 3450,
  baseWidthMM: 220,
  bayWidthsMM: [617, 617, 617, 617],
  upstandCount: 4,
  dimensions: {
    upstandHeightMM: 195,
    pirHeightMM: 185,
    pirFacesPerBay: 2,
  },
  eavesGeometry: {
    pitchDeg: 25,
    soffitDepthMM: 105,
    plumbCutHeightMM: 165,
  },
  materials: {
    pse30x90LengthM: 3.45,
    ply9BaseAreaM2: 0.759,
    ply9UpstandAreaM2: 0.48126,
    ply9TotalAreaM2: 1.24026,
    outerFixingLath25x50LengthM: 3.45,
    finishingLath25x50LengthM: 2.468,
    pir50AreaM2: 0.91316,
  },
  ...overrides,
});

describe("buildRingBeamManufactureSchedule", () => {
  test("groups identical side beams while keeping the front beam separate", () => {
    const side = ringBeam();
    const front = ringBeam({
      lengthMM: 6229,
      bayWidthsMM: [617, 617, 617, 617, 617, 617, 617, 617],
      eavesGeometry: {
        pitchDeg: 16.4,
        soffitDepthMM: 150,
        plumbCutHeightMM: 165,
      },
    });
    const result = buildRingBeamManufactureSchedule({
      members: [
        { manufactureRef: "R23", side: "left", ringBeam: side },
        { manufactureRef: "R24", side: "front", ringBeam: front },
        { manufactureRef: "R25", side: "right", ringBeam: side },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].manufactureRefs).toEqual(["R23", "R25"]);
    expect(result.groups[0].quantity).toBe(2);
  });

  test("totals all component materials without using R as a material key", () => {
    const result = buildRingBeamManufactureSchedule({
      members: [
        { manufactureRef: "R23", side: "left", ringBeam: ringBeam() },
        { manufactureRef: "R25", side: "right", ringBeam: ringBeam() },
      ],
    });

    expect(result.totals.pse30x90LengthM).toBeCloseTo(6.9, 6);
    expect(result.totals.ply9TotalAreaM2).toBeCloseTo(2.48052, 6);
    expect(result.totals.finishingLath25x50LengthM).toBeCloseTo(4.936, 6);
    expect(result.totals.pir50AreaM2).toBeCloseTo(1.82632, 6);
  });

  test("groups repeated workshop cuts per beam", () => {
    const cuts = buildRingBeamManufactureCuts(
      ringBeam({
        bayWidthsMM: [618, 617, 617, 617, 473],
        upstandCount: 5,
      })
    );

    expect(cuts.continuous.pse30x90).toMatchObject({
      internalEdgeLengthMM: 3450,
      externalEdgeLengthMM: 3450,
      widthMM: 95,
      quantity: 1,
    });
    expect(cuts.continuous.ply9Base).toEqual({
      internalEdgeLengthMM: 3450,
      externalEdgeLengthMM: 3450,
      widthMM: 220,
      quantity: 1,
    });
    expect(cuts.bayGroups).toEqual([
      {
        widthMM: 618,
        quantity: 1,
        upstandQuantity: 1,
        finishingLathQuantity: 1,
        pirQuantity: 2,
      },
      {
        widthMM: 617,
        quantity: 3,
        upstandQuantity: 3,
        finishingLathQuantity: 3,
        pirQuantity: 6,
      },
      {
        widthMM: 473,
        quantity: 1,
        upstandQuantity: 1,
        finishingLathQuantity: 1,
        pirQuantity: 2,
      },
    ]);
    expect(cuts.baseLayout).toHaveLength(11);
    expect(cuts.baseLayoutLengthMM).toBe(3230);
    expect(cuts.baseLayout[0]).toEqual({
      type: "member-slot",
      widthMM: 48,
    });
    expect(cuts.baseLayout[1]).toEqual({
      type: "upstand-bay",
      widthMM: 618,
      bayNumber: 1,
    });
  });

  test("keeps different end-mitre geometry in separate groups", () => {
    const regular = ringBeam({
      internalLengthMM: 3230,
      externalLengthMM: 3450,
      endGeometry: { startExtensionMM: 0, endExtensionMM: 220 },
    });
    const victorian = ringBeam({
      internalLengthMM: 3230,
      externalLengthMM: 3450,
      endGeometry: { startExtensionMM: 70, endExtensionMM: 150 },
    });

    const result = buildRingBeamManufactureSchedule({
      members: [
        { manufactureRef: "R23", side: "left", ringBeam: regular },
        { manufactureRef: "R25", side: "right", ringBeam: victorian },
      ],
    });

    expect(result.groups).toHaveLength(2);
  });

  test("derives the internal- and external-aligned layer edges", () => {
    const beam = buildRingBeam({
      exists: true,
      lengthMM: 3450,
      internalLengthMM: 3230,
      externalLengthMM: 3450,
      baseWidthMM: 170.5,
      startExtensionMM: 0,
      endExtensionMM: 220,
    });

    expect(beam.layerProfiles.ply9Base.internalEdgeLengthMM).toBe(3230);
    expect(beam.layerProfiles.ply9Base.externalEdgeLengthMM).toBe(3450);
    expect(beam.layerProfiles.pse30x90.internalEdgeLengthMM).toBe(3230);
    expect(beam.layerProfiles.pse30x90.externalEdgeLengthMM).toBeCloseTo(
      3352.58,
      2
    );
    expect(
      beam.layerProfiles.outerLath25x50.internalEdgeLengthMM
    ).toBeCloseTo(3385.48, 2);
    expect(
      beam.layerProfiles.outerLath25x50.externalEdgeLengthMM
    ).toBe(3450);
    expect(beam.materials.ply9BaseAreaM2).toBeCloseTo(0.56947, 5);
  });
});

describe("buildHippedLeanToRingBeamSchedule", () => {
  test("assigns continuous manufacture references from the roof sequence", () => {
    const geometry = {
      hasLeftHip: true,
      hasRightHip: true,
      leftSideRingBeam: { exists: true },
      rightSideRingBeam: { exists: true },
      leftSideRingBeamLayout: { intermediateJackRafters: [] },
      rightSideRingBeamLayout: { intermediateJackRafters: [] },
      frontRafterLayoutV2: { allRafters: [], centreRafters: [] },
      facets: [
        { id: "facet-left-side", ringBeam: ringBeam() },
        {
          id: "facet-front",
          ringBeam: ringBeam({ lengthMM: 6229 }),
        },
        { id: "facet-right-side", ringBeam: ringBeam() },
      ],
    };
    const result = buildHippedLeanToRingBeamSchedule({ geometry });

    expect(result.members.map((member) => member.manufactureRef)).toEqual([
      "R6",
      "R7",
      "R8",
    ]);
    expect(result.members.map((member) => member.side)).toEqual([
      "left",
      "front",
      "right",
    ]);
  });

  test("keeps resolved plastic soffit metadata while cutting the ply to the aligned roof envelope", () => {
    const geometry = calculateHippedLeanToGeometry({
      widthMM: 5870,
      projectionMM: 3230,
      pitchDeg: 15,
      soffitDepthMM: 150,
      leftWall: false,
      rightWall: false,
      leftOverhangMM: 0,
      rightOverhangMM: 0,
      tileOverhangMM: 50,
      materials: {
        side_frame_thickness_mm: 70,
        fascia_lip_mm: 25,
        frame_on_mm: 70,
      },
      hippedSides: "both",
      leftHipWidthMM: 1615,
      rightHipWidthMM: 1615,
      requestedLeftSidePitchDeg: 25,
      requestedRightSidePitchDeg: 25,
    });

    const schedule = buildHippedLeanToRingBeamSchedule({ geometry });
    const leftBeam = schedule.members.find(
      (member) => member.side === "left"
    )?.ringBeam;
    const rightBeam = schedule.members.find(
      (member) => member.side === "right"
    )?.ringBeam;

    expect(leftBeam.eavesGeometry.soffitDepthMM).toBe(
      geometry.facetEavesLeftManufacturedSoffitMM
    );
    expect(rightBeam.eavesGeometry.soffitDepthMM).toBe(
      geometry.facetEavesRightManufacturedSoffitMM
    );
    expect(leftBeam.eavesGeometry.soffitDepthMM).toBeGreaterThan(0);
    expect(rightBeam.eavesGeometry.soffitDepthMM).toBeGreaterThan(0);

    expect(leftBeam.baseWidthMM).toBe(
      geometry.leftExternalAllowanceMM
    );
    expect(rightBeam.baseWidthMM).toBe(
      geometry.rightExternalAllowanceMM
    );
    expect(leftBeam.internalLengthMM).toBe(3230);
    expect(leftBeam.externalLengthMM).toBeCloseTo(
      geometry.externalProjectionMM,
      6
    );
    expect(leftBeam.layerProfiles.pse30x90.internalEdgeLengthMM).toBe(
      3230
    );
    expect(
      leftBeam.layerProfiles.outerLath25x50.externalEdgeLengthMM
    ).toBeCloseTo(geometry.externalProjectionMM, 6);

    const frontBeam = schedule.members.find(
      (member) => member.side === "front"
    )?.ringBeam;
    expect(frontBeam.internalLengthMM).toBe(5870);
    expect(frontBeam.externalLengthMM).toBeCloseTo(
      geometry.externalWidthMM,
      6
    );
    expect(frontBeam.baseWidthMM).toBe(225);
    expect(
      frontBeam.baseWidthMM -
        geometry.frontTemplateDebug.horizontalFootRunMM
    ).toBe(7);

    // The two side beams share a mirrored pattern; the front is separate.
    expect(schedule.groups).toHaveLength(2);

    // The exact matched sizes remain separate for roof geometry.
    expect(geometry.leftCalculatedSoffitMM).toBe(
      geometry.facetEavesLeftMatchedSoffitMM
    );
    expect(geometry.rightCalculatedSoffitMM).toBe(
      geometry.facetEavesRightMatchedSoffitMM
    );
  });
});


test("pairs mirrored upstand references in continuous roof order", () => {
  const side = ringBeam();
  const front = ringBeam({ lengthMM: 4050, bayWidthsMM: [617,617,617,617,617,617] });
  const result = buildRingBeamManufactureSchedule({ members: [
    { manufactureRef: "R17", side: "left", ringBeam: side },
    { manufactureRef: "R18", side: "front", ringBeam: front },
    { manufactureRef: "R19", side: "right", ringBeam: side },
  ] });
  expect(result.groups[0].cuts.baseLayout.filter(s => s.type === "upstand-bay").map(s => s.bayLabel))
    .toEqual(["B1/B14", "B2/B13", "B3/B12", "B4/B11"]);
  expect(result.groups[1].cuts.baseLayout.filter(s => s.type === "upstand-bay").map(s => s.bayLabel))
    .toEqual(["B5", "B6", "B7", "B8", "B9", "B10"]);
});
