import { buildJackRafterManufactureAudit } from "./jackRafterManufactureAudit";
import { buildHippedLeanToManufacturingSequence } from "../Manufacturing/manufacturingSequenceBuilder";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * Provisional Steico schedule for a Hipped Lean-To.
 *
 * Hip and jack lengths are intentionally isolated here while awaiting a
 * physical factory cross-check. Ring-beams remain in their own material
 * calculation even though they share the visible R-series.
 */
export function buildProvisionalHippedLeanToTimber({
  roofInputs = {},
  geometry = null,
} = {}) {
  if (!geometry || (!geometry.hasLeftHip && !geometry.hasRightHip)) {
    return {
      valid: false,
      members: [],
      totals: {},
      errors: ["A resolved Hipped Lean-To geometry was not found."],
    };
  }

  const sequence = buildHippedLeanToManufacturingSequence(geometry);
  const memberById = sequence.memberById;
  const members = [];

  (geometry.frontRafterLayoutV2?.centreRafters || []).forEach((member) => {
    members.push({
      id: member.id,
      manufactureRef: memberById[member.id]?.manufactureRef ?? null,
      type: member.role === "boss-rafter" ? "boss-rafter" : "rafter",
      materialKey: "steico_220",
      externalLengthMM: finite(geometry.rafterExternalLength),
      provisional: false,
    });
  });

  const jackAudit = buildJackRafterManufactureAudit({ roofInputs, geometry });
  jackAudit.jacks.forEach((jack) => {
    members.push({
      id: jack.id,
      manufactureRef: jack.manufactureRef,
      type: "jack-rafter",
      materialKey: "steico_220",
      externalLengthMM: finite(jack.profile.externalSlopeLengthMM),
      internalLengthMM: finite(jack.profile.internalSlopeLengthMM),
      provisional: true,
    });
  });

  [
    ["left", geometry.leftHipManufactureV2],
    ["right", geometry.rightHipManufactureV2],
  ].forEach(([side, profile]) => {
    if (!profile?.valid) return;
    const id = `${side}-hip`;
    members.push({
      id,
      manufactureRef: memberById[id]?.manufactureRef ?? null,
      type: "hip",
      materialKey: "steico_220",
      externalLengthMM: finite(profile.externalSlopeLengthMM),
      internalLengthMM: finite(profile.internalSlopeLengthMM),
      provisional: true,
    });
  });

  const totalByType = (type) =>
    members
      .filter((member) => member.type === type)
      .reduce((sum, member) => sum + member.externalLengthMM, 0);

  const fullRafterLengthMM = members
    .filter((member) => member.type === "rafter" || member.type === "boss-rafter")
    .reduce((sum, member) => sum + member.externalLengthMM, 0);
  const jackLengthMM = totalByType("jack-rafter");
  const hipLengthMM = totalByType("hip");

  return {
    valid: members.length > 0,
    members: members.sort((a, b) => {
      const aNo = finite(String(a.manufactureRef || "").replace("R", ""), 9999);
      const bNo = finite(String(b.manufactureRef || "").replace("R", ""), 9999);
      return aNo - bNo;
    }),
    totals: {
      fullRafterLengthMM,
      jackLengthMM,
      hipLengthMM,
      steicoRoofMemberLengthMM:
        fullRafterLengthMM + jackLengthMM + hipLengthMM,
      fullRafterQty: members.filter(
        (member) => member.type === "rafter" || member.type === "boss-rafter"
      ).length,
      jackQty: members.filter((member) => member.type === "jack-rafter").length,
      hipQty: members.filter((member) => member.type === "hip").length,
    },
    errors: [],
  };
}

export default buildProvisionalHippedLeanToTimber;
