
// src/lib/leanToTotals.js
import { getMaterials } from "./materials";
import { computeTilesLathsBOM } from "./Calculations/tilesLathsCalc";
import { computeFasciaSoffitLeanTo } from "./Calculations/fasciaSoffitCalc";
import { computeEdgeTrimsLeanTo } from "./Calculations/edgeTrimsCalc";
import { computeGuttersLeanTo } from "./Calculations/guttersCalc";
import { computeLiteSlateLeanTo } from "./Calculations/liteslateCalc";
import { computeMiscLeanTo } from "./Calculations/miscCalc";
import { calculateLeanToGeometry } from "./geometry/leanToGeometry";

// -------- helpers --------
const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);

const buildExclusionFns = (exclusions) => {
  const ex = exclusions || {};
  const isExcluded = (key) => !!ex[String(key || "")];

  const sumCostFromLines = (lines = []) =>
    (lines || [])
      .filter((r) => !isExcluded(r.key))
      .reduce((s, r) => s + Number(r.line ?? r.total ?? 0), 0);

  return { isExcluded, sumCostFromLines };
};

const toLineShape = (r) => ({
  key: r.key,
  label: r.label || r.name || r.key,

  // qty
qty: r.qty ?? r.order_qty ?? r.orderQty ?? r.qtyDisplay,
qtyDisplay: r.qtyDisplay,
qty_order: r.qty_order ?? r.order_qty ?? r.orderQty,
orderQty: r.orderQty ?? r.qty_order ?? r.order_qty,
orderUnit: r.orderUnit ?? r.order_unit ?? r.orderUom,

  // pricing
  unit: r.unit ?? r.unitPrice ?? r.priceEach,
  unitPrice: r.unitPrice ?? r.unit,
  priceEach: r.priceEach ?? r.unitPrice ?? r.unit,
  line: r.line ?? r.total ?? 0,
  total: r.total ?? r.line ?? 0,

  // units / weights (KEEP THESE!)
  unitLabel: r.unitLabel,
  weightEachKg:
    r.weightEachKg ??
    r.weightPerUnitKg ??
    r.unitWeightKg ??
    r.weight_kg_each ??
    0,
  totalWeightKg:
    r.totalWeightKg ??
    r.total_weight_kg ??
    r.weightKg ??
    r.weight_kg ??
    0,
});

/**
 * Single source of truth for LEAN-TO totals.
 *
 * Inputs are the same ideas you already use in LeanToLanding:
 * widthMM/projMM internal, pitchDeg, walls/overhangs, colours, gutters, tileSystem.
 */
export function buildLeanToTotals(inputs = {}, exclusions = {}) {
  const m = getMaterials();
  const { isExcluded, sumCostFromLines } = buildExclusionFns(exclusions);

  // ---- inputs (internal) ----
  const widthMM = num(inputs.widthMM ?? inputs.internalWidthMM ?? inputs.width_mm);
  const projMM = num(inputs.projMM ?? inputs.internalProjectionMM ?? inputs.projection_mm);
  const pitchDeg = num(inputs.pitchDeg ?? inputs.pitch_deg ?? 15);

  const leftWall = !!inputs.leftWall;
  const rightWall = !!inputs.rightWall;

  const eavesOverhangMM = num(inputs.eavesOverhangMM ?? 150);
  const leftOverhangMM = num(inputs.leftOverhangMM ?? 0);
  const rightOverhangMM = num(inputs.rightOverhangMM ?? 0);

  const tileSystem = String(
  inputs.tileSystem ??
    inputs.tile_system ??
    inputs.tileType ??
    inputs.tile_type ??
    inputs.roofCovering ??
    "britmet"
).toLowerCase();

if (typeof window !== "undefined") {
  console.log("🟥 DBG buildLeanToTotals inputs.tileSystem:", inputs.tileSystem);
  console.log("🟥 DBG buildLeanToTotals inputs.tile_system:", inputs.tile_system);
  console.log("🟥 DBG buildLeanToTotals resolved tileSystem:", tileSystem);
}

  const plasticsColor = inputs.plasticsColor || "white";
  const gutterProfile = inputs.gutterProfile || "square";
  const gutterOutlet = inputs.gutterOutlet || "left";
  const gutterColor = inputs.gutterColor || "black";

  // ---- derive externals (same “intent” as LeanToLanding) ----
const SFT = num(m.side_frame_thickness_mm ?? 70);
const LIP = num(m.fascia_lip_mm ?? 25);

const leftDelta =
  leftWall ? 0 : (leftOverhangMM > 0 ? (SFT + leftOverhangMM) : (SFT + LIP));
const rightDelta =
  rightWall ? 0 : (rightOverhangMM > 0 ? (SFT + rightOverhangMM) : (SFT + LIP));

const extWidthMM = widthMM + leftDelta + rightDelta;

const frameOn = num(m.frame_on_mm ?? 70);

const geom = calculateLeanToGeometry({
  widthMM,
  projectionMM: projMM,
  pitchDeg,
  soffitDepthMM: eavesOverhangMM,
  leftWall,
  rightWall,
  materials: m,
});

const effectiveSoffitMM = Number(geom.soffitDepthEffective ?? eavesOverhangMM);
const extProjectionMM = projMM + effectiveSoffitMM + frameOn;

// 🔁 Replace slope
const slopeMM = geom.rafterExternalLength;

const leftSideExposed = !leftWall;
const rightSideExposed = !rightWall;

// ---- calculators ----
const isLiteSlate = String(tileSystem || "").toLowerCase() === "liteslate";
const tilesBom =
  isLiteSlate
    ? computeLiteSlateLeanTo(
        {
          run_mm: extWidthMM,
          projection_mm: extProjectionMM,
          slope_mm: slopeMM,
          pitch_deg: pitchDeg,
          waste_pct: 5,
          leftSide: leftSideExposed ? "exposed" : "wall",
          rightSide: rightSideExposed ? "exposed" : "wall",
        },
        m
      )
    : computeTilesLathsBOM(
        {
          run_mm: extWidthMM,
          slope_mm: slopeMM,
          pitch_deg: pitchDeg,
          eaves_overhang_mm: 50,
          leftSide: leftSideExposed ? "exposed" : "wall",
          rightSide: rightSideExposed ? "exposed" : "wall",
          waste_pct: 5,
          gauge_mm: m.tile_britmet_gauge_mm ?? 250,
          cover_width_mm: m.tile_britmet_cover_w_mm ?? 1231,
        },
        m
      );
      if (typeof window !== "undefined") {
  console.log("🟩 DBG leanToTotals tileSystem/isLiteSlate:", { tileSystem, isLiteSlate });
  console.log(
    "🟩 DBG leanToTotals tilesBom.lines (full):",
    (tilesBom?.lines || []).map((l) => ({
      key: l.key,
      label: l.label,
      qty: l.qty ?? l.qtyDisplay,
      unit: l.unit ?? l.unitPrice ?? l.priceEach,
      line: l.line ?? l.total,
    }))
  );
}
     if (typeof window !== "undefined") {
  console.log(
    "🟧 DBG tilesBom lines:",
    (tilesBom?.lines || []).map((l) => ({ key: l.key, label: l.label }))
  );
} 
if (typeof window !== "undefined") {
  console.log("🟪 DBG tilesBom (keys/labels):", (tilesBom?.lines || []).map(l => ({
    key: l.key,
    label: l.label,
    qty: l.qty,
    unit: l.unit,
    line: l.line ?? l.total,
  })));
}
  const plastics = computeFasciaSoffitLeanTo(
    {
      run_mm: extWidthMM,
      pitch_deg: pitchDeg,
      soffit_requested_mm: eavesOverhangMM,
      slope_mm: slopeMM,
      projection_mm: extProjectionMM,
      fascia_height_override_mm: geom.fasciaOrderSize,

      leftSideExposed,
      rightSideExposed,
      left_exposed: leftSideExposed,
      right_exposed: rightSideExposed,

      finish: String(plasticsColor).toLowerCase() === "white" ? "white" : "foiled",
      plastics_color: plasticsColor,
      vent_method: "factory",
    },
    m
  );
      plastics.fasciaHeightMM = Number(geom.fasciaHeight ?? plastics.fasciaHeightMM);
      plastics.soffitDepthMM = Number(geom.soffitDepthEffective ?? plastics.soffitDepthMM);

  const gutters = computeGuttersLeanTo(
    { run_mm: extWidthMM, profile: gutterProfile, outlet: gutterOutlet, color: gutterColor },
    m
  );

  const edgeTrims = computeEdgeTrimsLeanTo(
  {
    ext_width_mm: extWidthMM,
    ext_projection_mm: extProjectionMM,
    pitch_deg: pitchDeg,
    leftSide: leftSideExposed ? "exposed" : "wall",
    rightSide: rightSideExposed ? "exposed" : "wall",

    tileSystem,              // keep this
    tile_system: tileSystem, // ✅ add this

    finish: String(plasticsColor).toLowerCase() === "white" ? "white" : "foiled",
  },
  m
);

  // tile total hint for misc (as per LeanToLanding)
  const tilesLineForHint =
    (tilesBom?.lines || []).find((r) => /tiles/i.test(String(r.key || r.label || ""))) || null;

  const tilesTotalHintRaw =
    tilesBom?.derived?.tiles_total ?? tilesLineForHint?.qty ?? tilesLineForHint?.qtyDisplay;

  const tilesTotalHint = Number(tilesTotalHintRaw);

  const misc = computeMiscLeanTo(
    {
      tile_system: tileSystem,
      pitchDeg,
      internalWidthMM: widthMM,
      internalProjectionMM: projMM,
      tiles_total_hint: Number.isFinite(tilesTotalHint) ? tilesTotalHint : undefined,
    },
    m
  );

  // ---- normalise + totals (same rule everywhere) ----
  const tilesLines = (tilesBom?.lines || []).map(toLineShape);
  const plasticsLines = (plastics?.lines || []).map(toLineShape);
  const edgeLines = (edgeTrims?.lines || []).map(toLineShape);
  
// 🔥 Apply fascia + soffit overrides (fixed)
if (Array.isArray(plasticsLines)) {
  plasticsLines.forEach(line => {
    const txt = String(line?.label || "").toLowerCase();

    if (txt.includes("fascia")) {
      line.size = geom?.fasciaHeight;
    }

    if (txt.includes("soffit")) {
      line.size = geom?.soffitWidth;
    }
  });
}

  if (typeof window !== "undefined") {
  console.log(
    "🟦 DBG edgeLines verge-ish:",
    (edgeLines || []).filter((r) => {
      const t = `${r.key || ""} ${r.label || ""}`.toLowerCase();
      return t.includes("verge") || t.includes("barge") || t.includes("dry");
    })
  );
}
  const gutterLines = (gutters?.lines || []).map(toLineShape);

// misc uses misc.items with {key,total,label?}
const miscLines = (misc?.items || []).map((r) =>
  toLineShape({
    ...r, // ✅ keep EVERYTHING from miscCalc (including any weight fields)

    // normalise the common names Summary expects
    label: r.label || r.name || r.key,
    unit: r.unit ?? r.uom,
    priceEach: r.priceEach ?? r.unit_price,
    line: r.line ?? r.total ?? 0,
    total: r.total ?? r.line ?? 0,
  })
);
console.log("DBG miscLines weights:", miscLines.map(r => ({
  key: r.key, label: r.label, unitWeightKg: r.unitWeightKg, totalWeightKg: r.totalWeightKg
})));
  const tilesCost = sumCostFromLines(tilesLines);
  const plasticsCost = sumCostFromLines(plasticsLines);
  const edgeCost = sumCostFromLines(edgeLines);
  const guttersCost = sumCostFromLines(gutterLines);
  const miscCost = sumCostFromLines(miscLines);

  const materialsCost = tilesCost + plasticsCost + edgeCost + guttersCost + miscCost;

  const delivery = Number(m.delivery_flat ?? 0);
  const profitPct = Number(m.profit_pct ?? 0);
  const profit = materialsCost * (profitPct / 100);

  const net = materialsCost + delivery + profit;

  // (keep your existing convention; your app sometimes uses 0.2, sometimes 20)
  const vatRate = Number(m.vat_rate ?? m.vat_pct ?? 0.2);
  const vat = net * (vatRate > 1 ? vatRate / 100 : vatRate);
  const gross = net + vat;

  return {
    m,
    derived: {
  extWidthMM,
  extProjectionMM,
  slopeMM,
  effectiveSoffitMM,
  fasciaHeightMM: Number(geom.fasciaHeight ?? 0),
},
    sections: {
      tiles: tilesLines,
      plastics: plasticsLines,
      edgeTrims: edgeLines,
      gutters: gutterLines,
      misc: miscLines,
    },
    totals: {
      tilesCost,
      plasticsCost,
      edgeCost,
      guttersCost,
      miscCost,
      materialsCost,
      delivery,
      profitPct,
      profit,
      net,
      vat,
      gross,
    },
    // handy if Summary wants one list
    allLines: [...tilesLines, ...plasticsLines, ...edgeLines, ...gutterLines, ...miscLines],
    isExcluded,
  };
}
/**
 * Single source of truth for QUOTE BASE used for pricing.
 *
 * This matches what Summary currently prices:
 *   - lean-to sections (from buildLeanToTotals)
 *   - PLUS timber + metal "manual lines"
 *   - timber gets waste uplift (chargeable cost)
 *
 * Returns:
 *   - totals (the existing buildLeanToTotals output)
 *   - materialsCostForPricing (the canonical number both Summary and Design/Options must price from)
 *   - breakdown fields (optional, for display/debug)
 */
export function buildLeanToQuoteBase(inputs = {}, exclusions = {}) {
  const totals = buildLeanToTotals(inputs, exclusions);
  const m = totals?.m || getMaterials();

  const leanToMaterialsCost = Number(totals?.totals?.materialsCost ?? 0);

  // ---------- replicate Summary's "manual" timber + ply + laths costing ----------
  const iw = Number(inputs.internalWidthMM || inputs.widthMM || 0);
  const ip = Number(inputs.internalProjectionMM || inputs.projMM || 0);
  const pitchDeg = Number(inputs.pitchDeg || inputs.pitch || 15);

  const sft = Number(inputs.side_frame_thickness_mm) || Number(m.side_frame_thickness_mm) || 70;
  const lip = Number(inputs.fascia_lip_mm) || Number(m.fascia_lip_mm) || 25;
  const soff = Number(inputs.soffit_mm) || Number(inputs.eaves_overhang_mm) || 150;
  const frameOn = Number(inputs.frame_on_mm) || Number(m.frame_on_mm) || 70;

  const extWidthMM = iw + 2 * (sft + lip);
  const extWidthM = extWidthMM / 1000;

  const timberSpacing = Number(m.rafter_spacing_mm ?? 665);
  const timberFirstCtr = Number(m.rafter_first_center_mm ?? 690);

  let timberCentresCount = 0;
  if (iw > 0 && timberSpacing > 0 && timberFirstCtr > 0) {
    for (let c = timberFirstCtr; c <= iw; c += timberSpacing) timberCentresCount++;
  }
  const raftersCount = Math.max(2, timberCentresCount + 2);

 const geom = calculateLeanToGeometry({
  widthMM: iw,
  projectionMM: ip,
  pitchDeg,
  soffitDepthMM: soff,
  materials: m,
});

const timberRafterLenMM = geom.rafterExternalLength;

  // Steico (base cost)
  const wallplate_m = extWidthM;
  const raftersTotal_m = (raftersCount * timberRafterLenMM) / 1000;
  const steicoTotal_m = raftersTotal_m + wallplate_m;
  const steicoBaseCost = steicoTotal_m * Number(m.steico?.price_per_m ?? 0);

  // 30×90 PSE ring beam (base cost)
  const pseBaseCost = extWidthM * Number(m.pse30x90?.price_per_m ?? 0);

  // 9mm ply (base cost)
  const soffitVisibleHeightMM =
    Number(inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150) + 70;

  const soffitStrip_m2 = (extWidthMM / 1000) * (soffitVisibleHeightMM / 1000);
  const wallplateFace_m2 = (extWidthMM / 1000) * (220 / 1000);
  const ringBeamUpstands_m2 = (extWidthMM / 1000) * (195 / 1000);

  const totalPly9_m2 = soffitStrip_m2 + wallplateFace_m2 + ringBeamUpstands_m2;
  const ply9BaseCost = totalPly9_m2 * Number(m.ply9mm?.price_per_m2 ?? 0);

  // 18mm ply infill (base cost)
  const totalPly18_m2 = Math.max(0, extWidthM * 0.142);
  const ply18BaseCost = totalPly18_m2 * Number(m.ply18mm?.price_per_m2 ?? 0);

  // 25×50 laths (base cost)
  const slopeLenMM = timberRafterLenMM;
  const gaugeMM = Number(inputs.gauge_mm || m.tile_britmet_gauge_mm || 250);

  const tileCourses = pitchDeg > 0 && gaugeMM > 0 ? Math.ceil(slopeLenMM / gaugeMM) : 0;
  const externalLathsM = tileCourses * extWidthM;

  const internalRows = pitchDeg > 0 ? Math.ceil(slopeLenMM / 400) : 0;
  const internalLathsM = internalRows * (iw / 1000);

  const chamferLathM = extWidthM;

  const upstandBayWidthM = 0.617;
  const upstandCountForLaths = Math.max(0, raftersCount - 1);
  const ringBeamUpstandLathsM = upstandCountForLaths * upstandBayWidthM;

  const totalLathsM =
    Math.max(0, externalLathsM) +
    Math.max(0, internalLathsM) +
    Math.max(0, chamferLathM) +
    Math.max(0, ringBeamUpstandLathsM);

  const lathsBaseCost = totalLathsM * Number(m.chamferLath?.price_per_m ?? 0);

  // Waste uplift (same rule Summary uses)
  const defaultWasteFrac = (Number(m.global_waste_percent ?? 10) || 0) / 100;

  const wasteFracFor = (key) => {
    if (key === "steico") {
      const pct = Number(m.steico?.waste_percent);
      return Number.isFinite(pct) ? pct / 100 : defaultWasteFrac;
    }
    if (key === "pse30x90") {
      const pct = Number(m.pse30x90?.waste_percent ?? m.pse30x90?.waste_pct);
      return Number.isFinite(pct) ? pct / 100 : defaultWasteFrac;
    }
    if (key === "laths") {
      const pct = Number(m.chamferLath?.waste_percent);
      return Number.isFinite(pct) ? pct / 100 : defaultWasteFrac;
    }
    if (key === "ply9") {
      const pct = Number(m.ply9mm?.waste_percent ?? m.ply9mm?.waste_pct);
      return Number.isFinite(pct) ? pct / 100 : defaultWasteFrac;
    }
    if (key === "ply18") {
      const pct = Number(m.ply18mm?.waste_percent ?? m.ply18mm?.waste_pct);
      return Number.isFinite(pct) ? pct / 100 : defaultWasteFrac;
    }
    return defaultWasteFrac;
  };

  const timberChargeableCost =
    steicoBaseCost * (1 + wasteFracFor("steico")) +
    pseBaseCost * (1 + wasteFracFor("pse30x90")) +
    lathsBaseCost * (1 + wasteFracFor("laths")) +
    ply9BaseCost * (1 + wasteFracFor("ply9")) +
    ply18BaseCost * (1 + wasteFracFor("ply18"));

  // ---------- replicate Summary's "manual" metal costing ----------
  const leftIsWall =
  typeof inputs.leftWall === "boolean"
    ? inputs.leftWall
    : (((typeof inputs.left_exposed === "boolean" ? inputs.left_exposed : inputs.leftExposed) ?? false) === false);

const rightIsWall =
  typeof inputs.rightWall === "boolean"
    ? inputs.rightWall
    : (((typeof inputs.right_exposed === "boolean" ? inputs.right_exposed : inputs.rightExposed) ?? false) === false);

  const needsWatercourse = leftIsWall || rightIsWall;
  const watercourseQty = needsWatercourse ? (leftIsWall && rightIsWall ? 2 : 1) : 0;

  const watercoursePriceEach = Number(m.watercourse_price_each ?? m.metal?.watercourse?.price_per_piece ?? 0);
  const watercourseCost = watercourseQty * watercoursePriceEach;

  const tileStarterCost = 1 * Number(m.tile_starter_price_each ?? m.metal?.tile_starter?.price_each ?? 0);

  const joistHangerCost =
    raftersCount * Number(m.joist_hanger_price_each ?? 0);

  const metalCost = watercourseCost + tileStarterCost + joistHangerCost;

  const materialsCostForPricing = leanToMaterialsCost + timberChargeableCost + metalCost;

  return {
    totals,
    leanToMaterialsCost,
    timberChargeableCost,
    metalCost,
    materialsCostForPricing,
  };
}
