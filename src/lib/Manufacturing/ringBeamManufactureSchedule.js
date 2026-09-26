import { buildHippedLeanToManufacturingSequence } from "./manufacturingSequenceBuilder";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const rounded = (value, dp = 3) => {
  const power = 10 ** dp;
  return Math.round(finite(value) * power) / power;
};

const referenceNumber = (reference) =>
  finite(String(reference || "").replace(/[^0-9]/g, ""), 9999);

const addMaterialTotals = (members) =>
  members.reduce(
    (totals, member) => {
      const materials = member.ringBeam?.materials || {};
      Object.keys(totals).forEach((key) => {
        totals[key] += finite(materials[key]);
      });
      return totals;
    },
    {
      pse30x90LengthM: 0,
      ply9BaseAreaM2: 0,
      ply9UpstandAreaM2: 0,
      ply9TotalAreaM2: 0,
      outerFixingLath25x50LengthM: 0,
      finishingLath25x50LengthM: 0,
      pir50AreaM2: 0,
    }
  );

const groupWidths = (widths = []) => {
  const grouped = new Map();

  widths.forEach((value) => {
    const widthMM = rounded(value, 1);
    if (widthMM <= 0) return;

    const key = String(widthMM);
    grouped.set(key, {
      widthMM,
      quantity: (grouped.get(key)?.quantity || 0) + 1,
    });
  });

  return Array.from(grouped.values());
};

/**
 * Converts one resolved ring-beam into workshop cut groups.
 * Quantities are per beam; the schedule group supplies the number of
 * identical beams to manufacture.
 */
export function buildRingBeamManufactureCuts(ringBeam = null) {
  if (!ringBeam?.exists) return null;

  const lengthMM = rounded(ringBeam.lengthMM, 1);
  const internalLengthMM = rounded(
    ringBeam.internalLengthMM ?? lengthMM,
    1
  );
  const externalLengthMM = rounded(
    ringBeam.externalLengthMM ?? lengthMM,
    1
  );
  const baseWidthMM = rounded(ringBeam.baseWidthMM, 1);
  const upstandHeightMM = rounded(
    ringBeam.dimensions?.upstandHeightMM,
    1
  );
  const pirHeightMM = rounded(ringBeam.dimensions?.pirHeightMM, 1);
  const pirFacesPerBay = Math.max(
    0,
    Math.round(finite(ringBeam.dimensions?.pirFacesPerBay))
  );
  const memberSlotWidthMM = rounded(
    ringBeam.dimensions?.memberSlotWidthMM ?? 48,
    1
  );

  const bayGroups = groupWidths(ringBeam.bayWidthsMM).map((group) => ({
    ...group,
    upstandQuantity: group.quantity,
    finishingLathQuantity: group.quantity,
    pirQuantity: group.quantity * pirFacesPerBay,
  }));

  const baseLayout = [];
  (ringBeam.bayWidthsMM || []).forEach((bayWidthMM, index) => {
    if (index === 0) {
      baseLayout.push({
        type: "member-slot",
        widthMM: memberSlotWidthMM,
      });
    }
    baseLayout.push({
      type: "upstand-bay",
      widthMM: rounded(bayWidthMM, 1),
      bayNumber: index + 1,
    });
    baseLayout.push({
      type: "member-slot",
      widthMM: memberSlotWidthMM,
    });
  });

  return {
    lengthMM,
    internalLengthMM,
    externalLengthMM,
    baseWidthMM,
    endGeometry: {
      startExtensionMM: rounded(
        ringBeam.endGeometry?.startExtensionMM,
        1
      ),
      endExtensionMM: rounded(
        ringBeam.endGeometry?.endExtensionMM,
        1
      ),
    },
    layerProfiles: ringBeam.layerProfiles || null,
    pitchDeg: rounded(ringBeam.eavesGeometry?.pitchDeg, 1),
    manufacturedSoffitMM: rounded(
      ringBeam.eavesGeometry?.soffitDepthMM,
      1
    ),
    verticalFootCutMM: rounded(
      ringBeam.eavesGeometry?.plumbCutHeightMM,
      1
    ),
    upstandHeightMM,
    pirHeightMM,
    pirFacesPerBay,
    memberSlotWidthMM,
    baseLayout,
    baseLayoutLengthMM: rounded(
      baseLayout.reduce(
        (sum, segment) => sum + finite(segment.widthMM),
        0
      ),
      1
    ),
    continuous: {
      pse30x90: {
        ...(ringBeam.layerProfiles?.pse30x90 || {
          internalEdgeLengthMM: internalLengthMM,
          externalEdgeLengthMM: externalLengthMM,
          widthMM: 90,
        }),
        quantity: 1,
      },
      ply9Base: {
        ...(ringBeam.layerProfiles?.ply9Base || {
          internalEdgeLengthMM: internalLengthMM,
          externalEdgeLengthMM: externalLengthMM,
        }),
        widthMM: baseWidthMM,
        quantity: 1,
      },
      outerLath25x50: {
        ...(ringBeam.layerProfiles?.outerLath25x50 || {
          internalEdgeLengthMM: internalLengthMM,
          externalEdgeLengthMM: externalLengthMM,
          widthMM: 50,
        }),
        quantity: 1,
      },
    },
    bayGroups,
  };
}

/**
 * Universal grouping/totalling layer. Roof-specific geometry is translated
 * into member entries before reaching this function.
 */
export function buildRingBeamManufactureSchedule({ members = [] } = {}) {
  const validMembers = (Array.isArray(members) ? members : [])
    .filter((member) => member?.ringBeam?.exists)
    .sort(
      (a, b) =>
        referenceNumber(a.manufactureRef) -
        referenceNumber(b.manufactureRef)
    );

  const grouped = new Map();
  validMembers.forEach((member) => {
    const ringBeam = member.ringBeam;
    const signature = JSON.stringify({
      lengthMM: rounded(ringBeam.lengthMM, 1),
      internalLengthMM: rounded(ringBeam.internalLengthMM, 1),
      externalLengthMM: rounded(ringBeam.externalLengthMM, 1),
      baseWidthMM: rounded(ringBeam.baseWidthMM, 1),
      // Mirrored end arrangements share a workshop pattern; different
      // corner geometries remain separate groups.
      endExtensionsMM: [
        rounded(ringBeam.endGeometry?.startExtensionMM, 1),
        rounded(ringBeam.endGeometry?.endExtensionMM, 1),
      ].sort((a, b) => a - b),
      bayWidthsMM: (ringBeam.bayWidthsMM || []).map((width) =>
        rounded(width, 1)
      ),
      upstandHeightMM: rounded(ringBeam.dimensions?.upstandHeightMM, 1),
      pirHeightMM: rounded(ringBeam.dimensions?.pirHeightMM, 1),
      pirFacesPerBay: rounded(ringBeam.dimensions?.pirFacesPerBay, 1),
      pitchDeg: rounded(ringBeam.eavesGeometry?.pitchDeg, 2),
      soffitDepthMM: rounded(ringBeam.eavesGeometry?.soffitDepthMM, 1),
      plumbCutHeightMM: rounded(
        ringBeam.eavesGeometry?.plumbCutHeightMM,
        1
      ),
    });

    if (!grouped.has(signature)) {
      grouped.set(signature, { members: [], ringBeam });
    }
    grouped.get(signature).members.push(member);
  });

  const groups = Array.from(grouped.values()).map((group) => ({
    ...group,
    quantity: group.members.length,
    manufactureRefs: group.members
      .map((member) => member.manufactureRef)
      .filter(Boolean),
    sides: group.members.map((member) => member.side),
    cuts: buildRingBeamManufactureCuts(group.ringBeam),
  }));

  return {
    valid: validMembers.length > 0,
    members: validMembers,
    groups,
    totals: addMaterialTotals(validMembers),
    errors:
      validMembers.length > 0
        ? []
        : ["No resolved ring-beam members were found."],
  };
}

/**
 * Hipped Lean-To adapter. Future roof styles can provide their own adapter
 * while reusing the universal schedule above unchanged.
 */
export function buildHippedLeanToRingBeamSchedule({ geometry = null } = {}) {
  if (!geometry) return buildRingBeamManufactureSchedule();

  const memberById =
    buildHippedLeanToManufacturingSequence(geometry).memberById;
  const facets = Array.isArray(geometry.facets) ? geometry.facets : [];
  const definitions = [
    {
      memberId: "left-ring-beam",
      side: "left",
      facet: facets.find((facet) => facet.id === "facet-left-side"),
    },
    {
      memberId: "front-ring-beam",
      side: "front",
      facet: facets.find((facet) => facet.id === "facet-front"),
    },
    {
      memberId: "right-ring-beam",
      side: "right",
      facet: facets.find((facet) => facet.id === "facet-right-side"),
    },
  ];

  return buildRingBeamManufactureSchedule({
    members: definitions
      .filter((definition) => definition.facet?.ringBeam?.exists)
      .map((definition) => ({
        id: definition.memberId,
        side: definition.side,
        manufactureRef:
          memberById[definition.memberId]?.manufactureRef ?? null,
        ringBeam: definition.facet.ringBeam,
      })),
  });
}

export default buildRingBeamManufactureSchedule;
