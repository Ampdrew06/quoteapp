import { buildLeanToTotals } from "./leanToTotals";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const isVergeLine = (line = {}) => {
  const text = `${line.key || ""} ${line.label || ""}`.toLowerCase();
  return text.includes("verge") || text.includes("barge");
};

const isWatercourseLine = (line = {}) => {
  const text = `${line.key || ""} ${line.label || ""}`.toLowerCase();
  return text.includes("watercourse");
};

const replaceSideEdgeLine = (line, quantity) => {
  if (!(quantity > 0)) return null;

  const unitPrice = num(line.unitPrice ?? line.unit ?? line.priceEach, 0);
  const lineCost = quantity * unitPrice;

  return {
    ...line,
    qty: quantity,
    qtyDisplay: quantity,
    line: lineCost,
    total: lineCost,
  };
};

export function adjustHippedSideEdgeLines({
  lines = [],
  hippedSides = "both",
  leftWall = false,
  rightWall = false,
  slopeMM = 0,
  projectionMM = 0,
  tileSystem = "britmet",
  materials = {},
} = {}) {
  const hasLeftHip = hippedSides === "left" || hippedSides === "both";
  const hasRightHip = hippedSides === "right" || hippedSides === "both";

  const exposedVergeCount =
    (!hasLeftHip && !leftWall ? 1 : 0) +
    (!hasRightHip && !rightWall ? 1 : 0);
  const wallAbutmentCount =
    (!hasLeftHip && leftWall ? 1 : 0) +
    (!hasRightHip && rightWall ? 1 : 0);

  const isLiteSlate = String(tileSystem).toLowerCase() === "liteslate";
  const vergeCoverMM = isLiteSlate
    ? num(materials.dry_verge_piece_cover_mm, 2000)
    : num(materials.verge_trim_piece_cover_mm, 1150);
  const watercourseCoverMM = num(materials.watercourse_piece_cover_mm, 2950);

  const vergePerSide =
    vergeCoverMM > 0
      ? Math.ceil((num(slopeMM) / vergeCoverMM) * 2) / 2
      : 0;
  const vergeQuantity = exposedVergeCount * vergePerSide;

  const watercoursePerSide =
    watercourseCoverMM > 0
      ? Math.ceil(num(projectionMM) / watercourseCoverMM)
      : 0;
  const watercourseQuantity = wallAbutmentCount * watercoursePerSide;

  return lines
    .map((line) => {
      if (isVergeLine(line)) return replaceSideEdgeLine(line, vergeQuantity);
      if (isWatercourseLine(line)) {
        return replaceSideEdgeLine(line, watercourseQuantity);
      }
      return line;
    })
    .filter(Boolean);
}

const sumIncludedCost = (lines, isExcluded) =>
  (lines || [])
    .filter((line) => !isExcluded(line.key))
    .reduce((total, line) => total + num(line.line ?? line.total), 0);

export function buildHippedLeanToTotals(inputs = {}, exclusions = {}) {
  const base = buildLeanToTotals(inputs, exclusions);
  const hippedSides = inputs.hippedSides ?? "both";
  const hasLeftHip = hippedSides === "left" || hippedSides === "both";
  const hasRightHip = hippedSides === "right" || hippedSides === "both";

  const edgeAdjustmentInputs = {
    hippedSides,
    leftWall: !!inputs.leftWall,
    rightWall: !!inputs.rightWall,
    slopeMM: base.derived?.slopeMM,
    projectionMM: base.derived?.extProjectionMM,
    tileSystem: inputs.tileSystem ?? inputs.tile_system ?? "britmet",
    materials: base.m,
  };

  const tileLines = adjustHippedSideEdgeLines({
    lines: base.sections?.tiles || [],
    ...edgeAdjustmentInputs,
  });
  const edgeTrimLines = adjustHippedSideEdgeLines({
    lines: base.sections?.edgeTrims || [],
    ...edgeAdjustmentInputs,
  });

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
      line: 0,
    },
    sparHookQty > 0 && {
      key: "spar_hook",
      label: "Spar Hook",
      qty: sparHookQty,
      order_qty: sparHookQty,
      units: "Ea",
      weight_kg: sparHookQty * 0.25,
      line: 0,
    },
  ].filter(Boolean);

  const tilesCost = sumIncludedCost(tileLines, base.isExcluded);
  const edgeCost = sumIncludedCost(edgeTrimLines, base.isExcluded);
  const materialsCost =
    tilesCost +
    edgeCost +
    num(base.totals?.plasticsCost) +
    num(base.totals?.guttersCost) +
    num(base.totals?.miscCost);
  const delivery = num(base.totals?.delivery);
  const profitPct = num(base.totals?.profitPct);
  const profit = materialsCost * (profitPct / 100);
  const net = materialsCost + delivery + profit;
  const vatRate = num(base.m?.vat_rate ?? base.m?.vat_pct, 0.2);
  const vat = net * (vatRate > 1 ? vatRate / 100 : vatRate);
  const gross = net + vat;

  return {
    ...base,
    roofStyle: "hippedLeanTo",
    engineeringPreview: true,
    sections: {
      ...base.sections,
      tiles: tileLines,
      edgeTrims: edgeTrimLines,
    },
    totals: {
      ...base.totals,
      tilesCost,
      edgeCost,
      materialsCost,
      profit,
      net,
      vat,
      gross,
    },
    metalLines: [...(base.metalLines || []), ...hippedMetalLines],
    allLines: [
      ...tileLines,
      ...(base.sections?.plastics || []),
      ...edgeTrimLines,
      ...(base.sections?.gutters || []),
      ...(base.sections?.misc || []),
      ...hippedMetalLines,
    ],
  };
}