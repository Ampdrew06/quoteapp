// src/lib/Manufacturing/manufacturingSequenceBuilder.js

/**
 * Assigns workshop references to resolved roof members and slab spaces.
 *
 * IMPORTANT:
 * - This builder does NOT calculate roof geometry.
 * - This builder does NOT decide where rafters belong.
 * - It only assigns manufacturing identities to elements that have
 *   already been resolved elsewhere.
 *
 * R-series = structural/manufactured roof members
 * S-series = insulation slab spaces between structural members
 */

const normaliseMember = (member, index) => ({
  ...member,

  manufactureNo: index + 1,
  manufactureRef: `R${index + 1}`,
});

const normaliseSlab = (slab, index) => ({
  ...slab,

  slabNo: index + 1,
  slabRef: `S${index + 1}`,
});


/**
 * Build one continuous R-series.
 *
 * The caller supplies members in the required workshop traversal order.
 * This builder deliberately does not attempt to determine that order.
 */
export function buildManufacturingSequence({
  members = [],
  slabs = [],
} = {}) {
  const resolvedMembers = members.map(
    normaliseMember
  );

  const memberById = new Map(
    resolvedMembers.map((member) => [
      member.id,
      member,
    ])
  );

  const resolvedSlabs = slabs.map(
    (slab, index) => {
      const resolved =
        normaliseSlab(slab, index);

      const leftMember =
        slab.leftMemberId
          ? memberById.get(
              slab.leftMemberId
            )
          : null;

      const rightMember =
        slab.rightMemberId
          ? memberById.get(
              slab.rightMemberId
            )
          : null;

      return {
        ...resolved,

        between: {
          leftMemberId:
            slab.leftMemberId ?? null,

          rightMemberId:
            slab.rightMemberId ?? null,

          leftRef:
            leftMember?.manufactureRef ??
            null,

          rightRef:
            rightMember?.manufactureRef ??
            null,
        },
      };
    }
  );

  return {
    members: resolvedMembers,
    slabs: resolvedSlabs,

    memberById: Object.fromEntries(
      resolvedMembers.map((member) => [
        member.id,
        member,
      ])
    ),

    slabById: Object.fromEntries(
      resolvedSlabs.map((slab) => [
        slab.id,
        slab,
      ])
    ),

    counts: {
      members: resolvedMembers.length,
      slabs: resolvedSlabs.length,
    },
  };
}

/**
 * Build the Hipped Lean-To member list in the exact counter-clockwise order
 * used by the manufacture CAD plan.
 *
 * This deliberately assigns no lengths and makes no material decisions. It
 * only gives every already-resolved member one stable workshop identity.
 */
export function buildHippedLeanToManufacturingMembers(
  geometry = null
) {
  if (!geometry) return [];

  const members = [];
  const leftSideJacks =
    geometry.leftSideRingBeamLayout?.intermediateJackRafters ?? [];
  const rightSideJacks =
    geometry.rightSideRingBeamLayout?.intermediateJackRafters ?? [];
  const frontRafters =
    geometry.frontRafterLayoutV2?.allRafters ?? [];

  if (geometry.hasLeftHip) {
    members.push({ id: "left-wallbar", type: "wallbar", side: "left" });
  }

  leftSideJacks.forEach((jack, index) => {
    members.push({
      id: `left-side-jack-${Math.round(Number(jack?.centreMM) || 0)}-${index}`,
      type: "jack-rafter",
      side: "left",
    });
  });

  if (geometry.hasLeftHip) {
    members.push({ id: "left-hip", type: "hip", side: "left" });
  }

  frontRafters.forEach((rafter) => {
    members.push({
      id:
        rafter.id ||
        `front-rafter-${Math.round(Number(rafter?.centreMM) || 0)}`,
      type:
        rafter.role === "boss-rafter"
          ? "boss-rafter"
          : rafter.role === "jack"
            ? "jack-rafter"
            : "rafter",
      side: "front",
    });
  });

  if (geometry.hasRightHip) {
    members.push({ id: "right-hip", type: "hip", side: "right" });
  }

  rightSideJacks
    .map((jack, index) => ({ jack, originalIndex: index }))
    .reverse()
    .forEach(({ jack, originalIndex }) => {
      members.push({
        id: `right-side-jack-${Math.round(
          Number(jack?.centreMM) || 0
        )}-${originalIndex}`,
        type: "jack-rafter",
        side: "right",
      });
    });

  if (geometry.hasRightHip) {
    members.push({ id: "right-wallbar", type: "wallbar", side: "right" });
  }

  if(geometry.bossArrangement !== "central") members.push({
    id: "horizontal-wallplate",
    type: "wallplate",
    side: "back",
  });

  if (geometry.leftSideRingBeam?.exists) {
    members.push({ id: "left-ring-beam", type: "ring-beam", side: "left" });
  }

  members.push({ id: "front-ring-beam", type: "ring-beam", side: "front" });

  if (geometry.rightSideRingBeam?.exists) {
    members.push({ id: "right-ring-beam", type: "ring-beam", side: "right" });
  }

  return members;
}

export function buildHippedLeanToManufacturingSequence(geometry = null) {
  return buildManufacturingSequence({
    members: buildHippedLeanToManufacturingMembers(geometry),
  });
}

export default buildManufacturingSequence;
