// src/pages/lean-to/IdiotList.jsx
import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { getMaterials } from "../../lib/materials";
import { computeTilesLathsBOM } from "../../lib/Calculations/tilesLathsCalc";
import { computeEdgeTrimsLeanTo } from "../../lib/Calculations/edgeTrimsCalc";
import { computeGuttersLeanTo } from "../../lib/Calculations/guttersCalc";
import { computeLiteSlateLeanTo } from "../../lib/Calculations/liteslateCalc";
import { computeTotalWeightKg } from "../../lib/utils/weights";
import NavTabs from "../../components/NavTabs";
import { buildLeanToTotals } from "../../lib/leanToTotals";

// adjust path if file structure differs


// --- Navigation tab styles ---
const tabStyle = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f9fafb",
  textDecoration: "none",
  color: "#333",
  fontWeight: 500,
  transition: "all 0.15s ease",
};

const activeTabStyle = {
  ...tabStyle,
  background: "#0284c7",
  color: "#fff",
  borderColor: "#0284c7",
  fontWeight: 600,
};

// ---------- helpers ----------
const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);
const round = (v, dp = 0) => {
  const p = 10 ** dp;
  const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");
  return Math.round((Number(v) || 0) * p) / p;
};
// Capitalize helper for nice display names (e.g., "anthracite" → "Anthracite")
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");

const ceilDiv = (a, b) => Math.ceil((Number(a) || 0) / (Number(b) || 1));
const piecesFromTotal = (total_m, cover_m) =>
  Math.ceil((Number(total_m) || 0) / (Number(cover_m) || 1));

function loadInputs() {
  try {
    const s = localStorage.getItem("leanToInputs");
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

// helper: convert metres to 5.0 m stock joints (front fascia)
const jointsFromRunMM = (run_mm, piece_mm = 5000) =>
  Math.max(0, Math.ceil(num(run_mm) / piece_mm) - 1);

// ---------- component ----------
export default function IdiotList({ showNavTabs = true }) {
  const q = loadInputs();       // ✅ SINGLE source of inputs
  const m = getMaterials();

  


  // explicit wall flags from inputs (fallback to older keys if present)
  const leftWall = !!(
  q.left_wall_present ??
  q.leftWall ??
  q.left_wall ??
  (q.left_exposed === false)
);

const rightWall = !!(
  q.right_wall_present ??
  q.rightWall ??
  q.right_wall ??
  (q.right_exposed === false)
);

  // “Exposed” is simply the inverse
  const left_exposed = !leftWall;
  const right_exposed = !rightWall;

  // ---- core sizes & options (mirror LeanToLanding) ----
  const iw = num(q.internalWidthMM, 4000);
  const ip = num(q.internalProjectionMM, 2500);
  const sft = num(q.side_frame_thickness_mm ?? 70);
  const lip = num(q.fascia_lip_mm ?? 25);
  const soff = num(q.soffit_mm ?? 150);
  const frm = num(q.frame_on_mm ?? 70);
  const LOh = num(q.left_overhang_mm, 0);
  const ROh = num(q.right_overhang_mm, 0);
  const pitchDeg = num(q.pitchDeg, 15);

  const tileSystem = String(q.tile_system || "britmet").toLowerCase();
  const tileColour = String(q.tile_color || "").trim();
  const tileSystemDisplay   = tileSystem === "liteslate" ? "LiteSlate" : "Britmet";
const tileColourDisplay   = tileColour ? cap(tileColour) : "";
const plasticsFinishDisplay = cap(q.plastics_finish || "white");
const gutterProfileDisplay  = cap(q.gutter_profile || "square");
const gutterColorDisplay    = cap(q.gutter_color || "black");


  // Derived external sizes (match your lean-to logic incl. wall-present rules)
  const extWidthMM = useMemo(() => {
    const leftDelta = left_exposed ? sft + (LOh > 0 ? LOh : lip) : 0;
    const rightDelta = right_exposed ? sft + (ROh > 0 ? ROh : lip) : 0;
    return iw + leftDelta + rightDelta;
  }, [iw, sft, lip, LOh, ROh, left_exposed, right_exposed]);

  const extProjectionMM = useMemo(() => ip + soff + frm, [ip, soff, frm]);
// geometry
const theta = (pitchDeg * Math.PI) / 180;
const slope_mm = extProjectionMM / Math.cos(theta);
const slope_m = slope_mm / 1000;
const run_m = extWidthMM / 1000;

const leanToTotals = useMemo(
  () =>
    buildLeanToTotals({
      widthMM: iw,
      projMM: ip,
      pitchDeg,
      leftWall,
      rightWall,
      eavesOverhangMM: soff,
      leftOverhangMM: LOh,
      rightOverhangMM: ROh,
      tileSystem,
      plasticsColor: q.plastics_color || "white",
      gutterProfile: String(q.gutter_profile || "square").toLowerCase(),
      gutterOutlet: String(q.gutter_outlet || "left").toLowerCase(),
      gutterColor: String(q.gutter_color || "black").toLowerCase(),
    }),
  [
    iw,
    ip,
    pitchDeg,
    leftWall,
    rightWall,
    soff,
    LOh,
    ROh,
    tileSystem,
    q.plastics_color,
    q.gutter_profile,
    q.gutter_outlet,
    q.gutter_color,
  ]
);

  // ---- constants for barge / watercourse etc. ----
  // Total slope length that needs barge (open ends) and watercourse (wall ends)
  const totalOpenSlope_m = (left_exposed ? slope_m : 0) + (right_exposed ? slope_m : 0);
  const totalWallSlope_m = (leftWall ? slope_m : 0) + (rightWall ? slope_m : 0);

  // Piece effective covers (metres)
  const BARGE_COVER_M = tileSystem === "liteslate" ? 2.0 : 1.15; // LS dry verge 2.0 m, Britmet 2-Part Barge 1.15 m
  const WATERCOURSE_COVER_M = 2.95; // Watercourse 2.95 m

  // Total piece counts (sum first, then ceil once for sensible rounding)
  const bargesNeeded = piecesFromTotal(totalOpenSlope_m, BARGE_COVER_M);
  const watercourseQty = piecesFromTotal(totalWallSlope_m, WATERCOURSE_COVER_M);

  // tiles engine inputs
  const eaves_overhang_mm = num(q.eaves_overhang_mm, 50);
  const waste_pct = num(q.tile_waste_pct, 8);
  const gauge_mm = num(q.gauge_mm, 250);
  const cover_w = num(q.tile_cover_w_mm, m.tile_britmet_cover_w_mm ?? 1231);

  const plastics_finish =
    String(q.plastics_finish ?? q.plastics_color ?? "white").toLowerCase() === "white"
      ? "white"
      : "foiled";
  const vent_method = String(q.vent_method ?? "factory").toLowerCase();

  // ---- calculators ----
  const tilesBom = useMemo(() => {
    if (tileSystem === "liteslate" && typeof computeLiteSlateLeanTo === "function") {
      return computeLiteSlateLeanTo(
        {
          run_mm: extWidthMM,
          projection_mm: extProjectionMM,
          slope_mm,
          pitch_deg: pitchDeg,
          waste_pct,
          colour: tileColour || "Slate",
        },
        m
      );
    }
    return computeTilesLathsBOM(
      {
        run_mm: extWidthMM,
        projection_mm: extProjectionMM,
        slope_mm,
        pitch_deg: pitchDeg,
        eaves_overhang_mm,
        leftSide: left_exposed ? "exposed" : "wall",
        rightSide: right_exposed ? "exposed" : "wall",
        waste_pct,
        gauge_mm,
        cover_width_mm: cover_w,
      },
      m
    );
  }, [
    tileSystem,
    extWidthMM,
    extProjectionMM,
    slope_mm,
    pitchDeg,
    eaves_overhang_mm,
    left_exposed,
    right_exposed,
    waste_pct,
    gauge_mm,
    cover_w,
    tileColour,
    m,
  ]);

  const plastics = useMemo(
  () => ({
    lines: leanToTotals?.sections?.plastics || [],
    derived: leanToTotals?.derived || {},
  }),
  [leanToTotals]
);
const miscLines = leanToTotals?.sections?.misc || [];
if (typeof window !== "undefined") {
  window.__pirDebug = {
    miscLines,
    plasticsLines: plastics?.lines || [],
    leanToTotals,
    q,
  };
}
  const edgeTrims = useMemo(
    () =>
      computeEdgeTrimsLeanTo(
        {
          ext_width_mm: extWidthMM,
          ext_projection_mm: extProjectionMM,
          pitch_deg: pitchDeg,

          // side exposure + side overhangs
          leftSide: left_exposed ? "exposed" : "wall",
          rightSide: right_exposed ? "exposed" : "wall",
          left_overhang_mm: LOh,
          right_overhang_mm: ROh,

          // system + finish (for pricing band on J-Section)
          tileSystem: String(tileSystem || "britmet").toLowerCase(),
          finish: plastics_finish,
        },
        m
      ),
    [extWidthMM, extProjectionMM, pitchDeg, left_exposed, right_exposed, LOh, ROh, tileSystem, plastics_finish, m]
  );

  const gutters = useMemo(
    () =>
      computeGuttersLeanTo(
        {
          run_mm: extWidthMM,
          profile: String(q.gutter_profile || "square").toLowerCase(),
          outlet: String(q.gutter_outlet || "left").toLowerCase(),
          color: String(q.gutter_color || "black").toLowerCase(),
        },
        m
      ),
    [extWidthMM, q.gutter_profile, q.gutter_outlet, q.gutter_color, m]
    
  );
 // === Weight/BOM collections (use existing BOMs where possible) ===
const toWeightItems = (bom) =>
  (bom?.lines || []).map(r => ({
    key: r.key,
    qty: r.qty || 0,
    // optional: r.weight_kg_each if your calc emits it; safe if undefined
    weight_kg_each: r.weight_kg_each
  }));

const wTileItems   = toWeightItems(tilesBom);
const wFasciaItems = toWeightItems(plastics);
const wEdgeItems   = toWeightItems(edgeTrims);
const wGutterItems = toWeightItems(gutters);

// --- Misc (breather, 100 mm slab, SuperQuilt, fixings etc.) ---
const tilesLine =
  (tilesBom?.lines || []).find(r => /tiles/i.test(String(r.key || r.label || ""))) || null;

const tilesTotalHintRaw =
  tilesBom?.derived?.tiles_total ??
  Number(tilesLine?.qty) ??
  Number(tilesLine?.qtyDisplay);

const tilesTotalHint = Number.isFinite(tilesTotalHintRaw)
  ? tilesTotalHintRaw
  : undefined;

// ===== DEBUG: find tile starter + joist hangers (Idiot List) =====
const metalish = (arr, name) =>
  (arr || [])
    .filter((r) => {
      const s = `${String(r.key || "")} ${String(r.label || r.name || "")}`.toLowerCase();
      return /joist|hanger|tile_starter|starter/.test(s);
    })
    .map((r) => ({
      from: name,
      key: r.key,
      label: r.label || r.name,
      qty: r.qty ?? r.count ?? r.pieces ?? r.lengths ?? r.order_qty ?? r.qtyDisplay,
    }));

console.log("IDIOTLIST metal-ish tilesBom =>", metalish(tilesBom?.lines, "tilesBom.lines"));
console.log("IDIOTLIST metal-ish edgeTrims =>", metalish(edgeTrims?.lines, "edgeTrims.lines"));
console.log("IDIOTLIST metal-ish plastics  =>", metalish(plastics?.lines, "plastics.lines"));
console.log("IDIOTLIST metal-ish gutters   =>", metalish(gutters?.lines, "gutters.lines"));
console.log("IDIOTLIST metal-ish miscItems =>", metalish(miscLines, "miscLines"));

  // ---- derived counts for timber section (lean-to baseline) ----
const spacing = num(m.rafter_spacing_mm ?? 665, 665);
const firstCtr = num(m.rafter_first_center_mm ?? 690, 690);

let centresCount = 0;
for (let c = firstCtr; c <= iw; c += spacing) {
  centresCount++;
}

// +2 edge rafters, minimum 2 total
const rafters = Math.max(2, centresCount + 2);

// --- 50mm PIR (cradle + upstands) — same logic as Summary ---
const cradleStripWidthMM = 140;
const cradleProjectionMM = ip + frm;
const cradleLenPerFaceMM = cradleProjectionMM / Math.cos(theta);
const cradleFaces = Math.max(0, rafters >= 2 ? (2 * rafters - 2) : 0);
const cradleTotalLenM = (cradleFaces * cradleLenPerFaceMM) / 1000;
const cradleAreaM2_raw = cradleTotalLenM * (cradleStripWidthMM / 1000);

const cradleWastePct = Number(m?.pir50?.waste_pct ?? 0) || 0;
const cradleAreaM2 = cradleAreaM2_raw * (1 + cradleWastePct / 100);

const pir50UpstandHeightMM = 185;
const pir50Upstands_m2 = (extWidthMM / 1000) * (pir50UpstandHeightMM / 1000);

const pir50TotalM2 = cradleAreaM2 + pir50Upstands_m2;

const pir50KgPerM2 = Number(m?.pir50?.weight_kg_per_m2 ?? 0) || 0;
const cradleWeightMult = Number(m?.pir50_cradle_weight_multiplier ?? 1) || 1;

const pir50TotalWeightKg =
  (cradleAreaM2 * pir50KgPerM2 * cradleWeightMult) +
  (pir50Upstands_m2 * pir50KgPerM2);

  const pir50PackCoverageM2 =
  Number(m?.pir50_pack_coverage_m2) ||
  Number((m?.pir50?.sheet_w_m || 1.2) * (m?.pir50?.sheet_h_m || 2.4)) ||
  2.88;

const pir50TotalOrderQty =
  pir50PackCoverageM2 > 0 ? Math.ceil(pir50TotalM2 / pir50PackCoverageM2) : 0;

  const hips = 0; // standard lean-to
  const ringBeams = 1; // front only for lean-to
  const wallplate_m = run_m; // back wallplate runs whole external width

  // external tiling laths: one per course across external width
  const courses = num(tilesBom?.derived?.courses ?? Math.ceil(slope_m / (gauge_mm / 1000)));
  const laths_external_m = Math.max(0, Math.ceil(courses * run_m));

  // internal fixing laths: across *internal* width, 400 mm spacing up slope
  const int_run_m = iw / 1000;
  const int_courses = Math.ceil(slope_m / 0.4); // 400 mm spacing
  const laths_internal_m = Math.max(0, Math.ceil(int_courses * int_run_m));
// ---- Timber Elements ----
// Convert lath metre totals to stock lengths (default 4.8 m)
const LATH_STOCK_M = Math.max(0.001, Number(m.lath_stock_length_m ?? 4.8));
const extLathLengths = Math.ceil((Number(laths_external_m) || 0) / LATH_STOCK_M);
const intLathLengths = Math.ceil((Number(laths_internal_m) || 0) / LATH_STOCK_M);

const rowsTimber = [
  { item: "Rafters", qty: rafters, units: "Ea" },
  { item: "Front ring-beam", qty: ringBeams, units: "Ea" },
  { item: "Back wallplate", qty: round(wallplate_m, 2), units: "m" },
  { item: "Hips", qty: 0, units: "Ea" },

  // Laths as stock lengths (rounded up)
  { item: "External tiling laths", qty: extLathLengths, units: "Lengths" },
  { item: "Internal fixing laths", qty: intLathLengths, units: "Lengths" },

  { item: "Chamfered lath (front)", qty: Math.max(0, Math.ceil(run_m)), units: "m" },
];


  // ---- Tile Elements ----
  const rowsTiles = (() => {
    const lines = tilesBom?.lines || [];
    const out = [];

    // Tiles themselves
    const tilesRow = lines.find((r) => /tiles/i.test(r.key || ""));
    if (tilesRow) {
      out.push({
        item: tileSystem === "liteslate" ? "LiteSlate tiles" : "Britmet shingles",
        qty: tilesRow.qtyDisplay ?? tilesRow.qty,
        units: "pcs",
      });
    }

    // Barge / Dry verge by active system
    if ((bargesNeeded || 0) > 0) {
      if (tileSystem === "britmet") {
        out.push({ item: "2-Part Barge trim", qty: bargesNeeded, units: "pcs" });
      } else {
        out.push({ item: "Dry verge", qty: bargesNeeded, units: "Lengths" });
      }
    }

    // Britmet finishing kit (always shown for Britmet)
    if (tileSystem === "britmet") {
      out.push({ item: "Finishing Kit", qty: 1, units: "Ea" });
    }

    return out;
  })();

  // ---- Plastics Elements ----
const rowsPlastics = (() => {
  const pLines = plastics?.lines || [];
  const out = [];

  /**
   * Single source of truth for plastics colour:
   * 1) Explicit display colour from calculator (best)
   * 2) Stored user choice (e.g. "Rosewood")
   * 3) Fallback to White / Foiled
   */
  const displayColour =
    plastics?.meta?.displayColour ||
    loadInputs()?.plastics_color ||
    (plastics?.meta?.finish === "white" ? "White" : "Foiled");

  // --- Fascia ---
  const fascia = pLines.find((r) => r.key === "fascia");
  if (fascia) {
    const clean = String(fascia.label)
      .replace(/board\s*/i, "")
      .replace(/—.*$/, "")
      .trim();

    out.push({
      item: `${clean} – ${displayColour}`,
      qty: fascia.qty,
      units: "Lengths",
    });
  }

  // --- Soffit ---
  const soffit = pLines.find((r) => r.key === "soffit");
  if (soffit) {
    const clean = String(soffit.label)
      .replace(/board\s*/i, "")
      .replace(/—.*$/, "")
      .trim();

    out.push({
      item: `${clean} – ${displayColour}`,
      qty: soffit.qty,
      units: "Lengths",
    });
  }

  // --- End fascia (combine left + right) ---
  let endQty = 0;
  let endLabel = "";

  const endCombined = pLines.find((r) => r.key === "end_fascia");
  if (endCombined) {
    endQty = endCombined.qty || 0;
    endLabel = endCombined.label;
  } else {
    const endL = pLines.find((r) => r.key === "end_fascia_left");
    const endR = pLines.find((r) => r.key === "end_fascia_right");
    endQty = (endL?.qty || 0) + (endR?.qty || 0);
    endLabel = endL?.label || endR?.label || "";
  }

  if (endQty > 0) {
    const clean = String(endLabel)
      .replace(/\(left\)|\(right\)/gi, "")
      .replace(/board\s*/i, "")
      .replace(/—.*$/, "")
      .trim();

    out.push({
      item: `${clean} – ${displayColour}`,
      qty: endQty,
      units: "Lengths",
    });
  }

  // --- Fascia corners ---
  const corners = Math.max(
    0,
    4 - 2 * ((leftWall ? 1 : 0) + (rightWall ? 1 : 0))
  );
  if (corners > 0) {
    out.push({
      item: `Fascia corners – ${displayColour}`,
      qty: corners,
      units: "Ea",
    });
  }

  // --- Fascia straight joints ---
  const fasciaJoints = Math.max(0, ceilDiv(run_m, 5) - 1);
  if (fasciaJoints > 0) {
    out.push({
      item: `Fascia straight joints – ${displayColour}`,
      qty: fasciaJoints,
      units: "Ea",
    });
  }

  // --- J-Section ---
  const jsec = (edgeTrims?.lines || []).find((r) => r.key === "j_section");
  if (jsec) {
    out.push({
      item: `J-Section – ${displayColour}`,
      qty: jsec.qty,
      units: "Lengths",
    });
  }

  return out;
})();



  // ---- Metal Elements ----
  const rowsMetal = (() => {
    const eLines = edgeTrims?.lines || [];
    const out = [];

    // Tile Starter (if emitted)
    const starter = eLines.find((r) => r.key === "tile_starter");
    if (starter) out.push({ item: "Tile Starter", qty: starter.qty, units: "Lengths" });

    // Watercourse for wall sides
    if ((watercourseQty || 0) > 0) {
      out.push({ item: "Watercourse (wall abutment)", qty: watercourseQty, units: "Lengths" });
    }

    // Joist hangers (one per rafter)
    if ((rafters || 0) > 0) {
      out.push({ item: "Joist Hangers", qty: rafters, units: "Ea" });
    }

    return out;
  })();

  // ---- Guttering ----
  const rowsGutters = (() => {
    const out = [];


    const profile = String(q.gutter_profile || "square");
    const color = String(q.gutter_color || "black");
    const outlet = String(q.gutter_outlet || "left").toLowerCase();

    // Use calc-provided lines but skip any existing "Stop End" (we add our own)
    for (const r of (gutters?.lines || [])) {
      if (/stop end/i.test(r.label || "")) continue;
      out.push({
        item: r.label,
        qty: r.qtyDisplay ?? r.qty,
        units: r.units || "Ea",
      });
    }

    // Rule: if there is ANY running outlet, we need 2 stop ends
    if (outlet !== "none") {
      out.push({ item: "Stop End", qty: 2, units: "Ea" });
    }

    // Fallback line if nothing returned
    if (out.length === 0) {
      out.push({ item: `Gutter (${profile}, ${color})`, qty: round(extWidthMM / 1000, 2), units: "m" });
      if (outlet !== "none") out.push({ item: "Stop End", qty: 2, units: "Ea" });
    }

    return out;
  })();
const pir50FromTotals =
  window.__pirDebug?.leanToTotals?.allLines?.find(
    (x) => x.key === "pir50_cradle"
  );

const miscDisplayLines = (() => {
  const base = (miscLines || []).filter((it) => it.key !== "slab50");

  const breatherIndex = base.findIndex((it) => it.key === "breather_membrane");

  const pir50Line =
    pir50TotalOrderQty > 0
      ? {
          key: "pir50_cradle",
          label: "50mm PIR",
          qty: pir50TotalOrderQty,
          orderQty: pir50TotalOrderQty,
          qty_order: pir50TotalOrderQty,
          orderUnit: "",
          unitLabel: "",
        }
      : null;

  if (!pir50Line) return base;
  if (breatherIndex === -1) return [pir50Line, ...base];

  return [
    ...base.slice(0, breatherIndex + 1),
    pir50Line,
    ...base.slice(breatherIndex + 1),
  ];
})();
// Map Misc items (from computeMiscLeanTo) to Section rows
const rowsMisc = (miscDisplayLines || []).map((it) => {
  let cleanLabel = (it.label || it.name || "").trim();

  cleanLabel = cleanLabel
    .replace(/^Breather membrane.*$/i, "Breather Membrane")
    .replace(/^100.*slab.*$/i, "100mm PIR")
    .replace(/^50.*slab.*$/i, "50mm PIR")
    .replace(/^Expanding foam.*$/i, "Expanding Foam (Can)")
    .replace(/^Polytop.*$/i, "Polytop Pins")
    .replace(/^Aluminium.*$/i, "Aluminium Tape")
    .replace(/^Rafter.*screw.*$/i, `Rafter/Eaves Fixing Screws 3" x 10`)
    .replace(/^Internal.*lath.*$/i, `Int/Ext Lath Fixings 2" x 8`)
    .replace(/^Tile fixing.*$/i, `Tile Fixing Screws 1" x 8`)
    .replace(/^SuperQuilt.*12.*$/i, "SuperQuilt (12m)")
    .replace(/^SuperQuilt.*15.*$/i, "SuperQuilt (15m)");

  const isPirLine = it.key === "slab100" || it.key === "pir50_cradle";

return {
  item: cleanLabel,
  qty: isPirLine
    ? (it.orderQty ?? it.qty_order ?? it.qtyDisplay ?? it.qty)
    : (it.qtyDisplay ?? it.qty),
  units: isPirLine
    ? ""
    : (it.unitLabel || it.uom || it.units || "Ea"),
};
});


  // ---- Total weight (sum all BOM lines) ----
  const allBomItems = [
  ...(tilesBom?.lines || []),
  ...(plastics?.lines || []),
  ...(edgeTrims?.lines || []),
  ...(gutters?.lines || []),
  ...miscDisplayLines,
];
  const totalWeightKg = computeTotalWeightKg(allBomItems, m);

  // Header bits
  const customerRefRef = useRef(null);
  const referenceRef = useRef(null);
  const deliveryRef = useRef(null);
  const weightRef = useRef(null);

  const tilesRow = (tilesBom?.lines || []).find((r) => /tiles/i.test(r.key || ""));
    const tilesHeaderStr = (tilesBom?.lines || []).find((r) => /tiles/i.test(r.key || ""))
    ? `${tileSystem === "liteslate" ? "LiteSlate" : "Britmet"} — ${tileColour || ""}`.replace(
        /\s+—\s+$/,
        ""
      )
    : `${tileSystem === "liteslate" ? "LiteSlate" : "Britmet"}${
        tileColour ? " — " + tileColour : ""
      }`;
// ===== DEBUG: find tile starter + joist hangers in Idiot List inputs =====
const scan = (name, arr) => {
  const hit = (arr || [])
    .filter((r) => /joist|hanger|tile_starter|starter/.test(
      `${String(r.key || "")} ${String(r.label || r.name || "")}`.toLowerCase()
    ))
    .map((r) => ({
      from: name,
      key: r.key,
      label: r.label || r.name,
      qty: r.qty ?? r.count ?? r.pieces ?? r.lengths ?? r.order_qty,
    }));

  if (hit.length) console.log("IDIOTLIST metal-ish HIT =>", hit);
};

// 🔻 change these names to match whatever variables IdiotList actually has
scan("tilesBom.lines", tilesBom?.lines);
scan("edgeTrims.lines", edgeTrims?.lines);
scan("plastics.lines", plastics?.lines);
scan("gutters.lines", gutters?.lines);
metalish(miscLines, "miscLines");
scan("miscLines", miscLines);


  // ---------- RENDER ----------
  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
      {showNavTabs && <NavTabs />}

      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: 8,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {/* Row 1: big title line */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            Checklist · Customer:{" "}
            <span contentEditable suppressContentEditableWarning>
              {q.customer_name || ""}
            </span>{" "}
            · Reference:{" "}
            <span contentEditable suppressContentEditableWarning>
              {q.quote_ref || q.ref || ""}
            </span>{" "}
            · Delivery:{" "}
            <span contentEditable suppressContentEditableWarning>
              {q.delivery_date || ""}
            </span>
          </div>

          {/* Row 2: roof description */}
          <div style={{ fontSize: 13 }}>
            Roof: <b>Lean-to</b> · Pitch <b>{pitchDeg}°</b> · Finish{" "}
            <b>{plasticsFinishDisplay}</b> · Vent <b>{String(q.vent_method || "factory")}</b> ·
            Weight <b>{totalWeightKg.toFixed(1)} kg</b>
          </div>

          {/* Row 3: tiles summary */}
          <div style={{ fontSize: 13 }}>
            Tiles: <b>{tilesHeaderStr}</b>
          </div>
        </div>

        {/* Two column boxed sections */}
        <div className="grid">
          <Section title="Timber Elements" rows={rowsTimber} />

          <Section
            title={`Plastics Elements – ${plasticsFinishDisplay}`}
            rows={rowsPlastics}
          />

          <Section
            title={`Tile Elements – ${tileSystemDisplay}${
              tileColourDisplay ? " / " + tileColourDisplay : ""
            }`}
            rows={rowsTiles}
          />

          <Section title="Metal Elements" rows={rowsMetal} />

          <Section
            title={`Guttering – ${gutterColorDisplay} / ${gutterProfileDisplay}`}
            rows={rowsGutters}
          />

          <Section title="Miscellaneous" rows={rowsMisc} />
        </div>

        <style>{`
          :root {
            --fs: 12px;
            --fs-print: 11px;
            --gap: 8px;
            --pad: 8px;
            --line: 1px solid #d1d5db;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--gap);
          }
          .box {
            border: var(--line);
            border-radius: 6px;
            padding: var(--pad);
          }
          .box h2 {
            margin: 0 0 6px;
            font-size: calc(var(--fs) - 1px);
            font-weight: 700;
            border-bottom: var(--line);
            padding-bottom: 4px;
          }
          .rowitem {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            padding: 2px 0;
            border-bottom: 1px dashed #eee;
          }
          .rowitem:last-child { border-bottom: 0; }
          .item { flex: 1; }
          .qty { white-space: nowrap; min-width: 70px; text-align: right; }

          body { font-size: var(--fs); }

          @media print {
            @page { size: A4 portrait; margin: 6mm; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-size: var(--fs-print); }
            .print\\:hidden { display: none !important; }
            .grid { grid-template-columns: 1fr 1fr; gap: 6px; }
            .box { padding: 6px; border-radius: 4px; }
            .box h2 { font-size: var(--fs-print); margin-bottom: 4px; padding-bottom: 2px; }
            .rowitem { padding: 1px 0; }
          }

          @media (max-width: 900px) {
            .grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ---------- UI ---------- */
function Section({ title, rows }) {
  const filtered = (rows || []).filter(
    (r) => r && (Number(r.qty) > 0 || String(r.qty || "").length > 0)
  );
  if (filtered.length === 0) return null;

  return (
    <div className="box">
      <h2>{title}</h2>
      {filtered.map((r, i) => (
        <div key={`${title}-${r.item}-${i}`} className="rowitem">
          <div className="item">{r.item}</div>
          <div className="qty">
            {r.qty} {r.units}
          </div>
        </div>
      ))}
    </div>
  );
}

