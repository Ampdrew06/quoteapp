import { buildHippedLeanToManufacturingSequence } from "./manufacturingSequenceBuilder";

export const BOSS_RAFTER_TERMINAL_ALLOWANCE_MM = 140;

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * Creates manufacture profiles for the full front-facet rafters.
 * Boss rafters retain the ordinary five-sided profile but finish early at the
 * boss/rafter terminal. The 140 mm slope allowance is provisional pending a
 * physical factory check.
 */
export function buildFrontRafterManufactureProfiles({ geometry = null } = {}) {
  if (!geometry) return [];

  const memberById =
    buildHippedLeanToManufacturingSequence(geometry).memberById;
  const pitchDeg = finite(geometry.frontPitchDeg);
  const pitchCos = Math.cos((pitchDeg * Math.PI) / 180);
  const baseExternalSlopeLengthMM = finite(
    geometry.rafterExternalLength,
    geometry.raw?.manufacturedExternalSlopeLengthMM
  );
  const baseInternalSlopeLengthMM = finite(
    geometry.rafterInternalLength,
    geometry.raw?.internalRafterLengthMM
  );
  const horizontalFootCutMM = finite(
    geometry.frontTemplateDebug?.horizontalFootRunMM,
    geometry.raw?.manufacturedHorizontalFootCutMM
  );
  const verticalFootCutMM = finite(
    geometry.frontTemplateDebug?.plumbCutHeightMM,
    geometry.raw?.manufacturedPlumbCutHeightMM
  );
  const topVerticalCutMM = pitchCos > 0 ? 220 / pitchCos : 0;

  return (geometry.frontRafterLayoutV2?.centreRafters || [])
    .map((member) => {
      const isBossRafter = member.role === "boss-rafter";
      const terminalAllowanceMM = isBossRafter
        ? BOSS_RAFTER_TERMINAL_ALLOWANCE_MM
        : 0;

      return {
        id: member.id,
        manufactureRef: memberById[member.id]?.manufactureRef ?? null,
        type: isBossRafter ? "boss-rafter" : "rafter",
        role: member.role,
        positionMM: finite(member.centreMM),
        profile: {
          valid:
            baseExternalSlopeLengthMM > terminalAllowanceMM &&
            baseInternalSlopeLengthMM > terminalAllowanceMM,
          facetPitchDeg: pitchDeg,
          externalSlopeLengthMM:
            baseExternalSlopeLengthMM - terminalAllowanceMM,
          internalSlopeLengthMM:
            baseInternalSlopeLengthMM - terminalAllowanceMM,
          horizontalFootCutMM,
          verticalFootCutMM,
          topVerticalCutMM,
          bossTerminalAllowanceMM: terminalAllowanceMM,
        },
      };
    })
    .filter((member) => member.profile.valid);
}

export default buildFrontRafterManufactureProfiles;
