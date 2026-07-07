import { buildLeanToTotals } from "./leanToTotals";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function buildHippedLeanToTotals(inputs = {}, exclusions = {}) {
  const base = buildLeanToTotals(inputs, exclusions);

  const hippedSides = inputs.hippedSides ?? "both";

  const hasLeftHip = hippedSides === "left" || hippedSides === "both";
  const hasRightHip = hippedSides === "right" || hippedSides === "both";

  const bossQty = (hasLeftHip ? 1 : 0) + (hasRightHip ? 1 : 0);
  const sparHookQty = bossQty * 2;

  const hippedMetalLines = [
    bossQty > 0 && {
      key: "boss_rafter_terminal",
      label: "Boss / Rafter Terminal",
      qty: bossQty,
      order_qty: bossQty,
      units: "Ea",
      weight_kg: bossQty * 0.5,
      line: bossQty * 0,
    },
    sparHookQty > 0 && {
      key: "spar_hook",
      label: "Spar Hook",
      qty: sparHookQty,
      order_qty: sparHookQty,
      units: "Ea",
      weight_kg: sparHookQty * 0.25,
      line: sparHookQty * 0,
    },
  ].filter(Boolean);

  return {
    ...base,
    roofStyle: "hippedLeanTo",
    engineeringPreview: true,

    metalLines: [
      ...(base.metalLines || []),
      ...hippedMetalLines,
    ],

    allLines: [
      ...(base.allLines || []),
      ...hippedMetalLines,
    ],
  };
}