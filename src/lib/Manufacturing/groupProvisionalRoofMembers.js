const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const rounded = (value, precisionMM = 1) =>
  Math.round(finite(value) / precisionMM) * precisionMM;

const referenceNumber = (reference) =>
  finite(String(reference || "").replace(/[^0-9]/g, ""), 9999);

/**
 * Groups only genuinely matching provisional manufacture profiles.
 * References are presentation identifiers; dimensions determine grouping.
 */
export function groupProvisionalRoofMembers(
  members = [],
  { precisionMM = 1, precisionDeg = 0.1 } = {}
) {
  const groups = new Map();

  members.forEach((member) => {
    const profile = member?.profile;
    if (!profile?.valid) return;

    const signature = JSON.stringify({
      type: member.type,
      pitchDeg: rounded(profile.hipPitchDeg ?? profile.facetPitchDeg, precisionDeg),
      externalSlopeLengthMM: rounded(profile.externalSlopeLengthMM, precisionMM),
      internalSlopeLengthMM: rounded(profile.internalSlopeLengthMM, precisionMM),
      horizontalFootCutMM: rounded(profile.horizontalFootCutMM, precisionMM),
      verticalFootCutMM: rounded(profile.verticalFootCutMM, precisionMM),
      topVerticalCutMM: rounded(profile.topVerticalCutMM, precisionMM),
      hipCentrelineSetbackMM:
        member.type === "jack-rafter"
          ? rounded(profile.hipCentrelineSetbackMM, precisionMM)
          : null,
    });

    if (!groups.has(signature)) {
      groups.set(signature, {
        type: member.type,
        profile,
        members: [],
        provisional: true,
      });
    }

    groups.get(signature).members.push(member);
  });

  return Array.from(groups.values())
    .map((group) => {
      const membersSorted = [...group.members].sort(
        (a, b) =>
          referenceNumber(a.manufactureRef) - referenceNumber(b.manufactureRef)
      );
      return {
        ...group,
        members: membersSorted,
        manufactureRefs: membersSorted
          .map((member) => member.manufactureRef)
          .filter(Boolean),
        quantity: membersSorted.length,
      };
    })
    .sort(
      (a, b) =>
        referenceNumber(a.manufactureRefs[0]) -
        referenceNumber(b.manufactureRefs[0])
    );
}

export default groupProvisionalRoofMembers;
