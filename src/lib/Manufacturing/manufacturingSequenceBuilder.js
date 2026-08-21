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

export default buildManufacturingSequence;