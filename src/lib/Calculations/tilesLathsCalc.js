// src/lib/tilesLathsCalc.js
import {
  mm,
  courseCount,
  pieceCount,
  sideEdgeParts,
  slopeLength,
  toM,
  lineTotal,
  money,
} from "./roofMath";

/**
 * Compute BOM for lean-to tiles/laths & ancillaries (slope-aware).
 *
 * inputs:
 *  - run_mm: number (eaves length on plan)
 *  - projection_mm: number (wall→eaves on plan)
 *  - slope_mm?: number (optional; if omitted, derived from projection_mm + pitch_deg)
 *  - pitch_deg?: number
 *  - eaves_overhang_mm?: number (default 50)
 *  - leftSide: 'exposed' | 'wall' | 'none'
 *  - rightSide: 'exposed' | 'wall' | 'none'
 *  - waste_pct: tile waste % (default 5)
 *  - eaves_guard_waste_pct?: number (default 0)
 *  - verge_waste_pct?: number (default 0)
 *  - chamfer_waste_pct?: number (default 0)
 *  - fixings_waste_pct?: number (default 0)
 *  - watercourse_waste_pct?: number (default 0)  // usually 0
 *  - gauge_mm?: override for course gauge (default 250 or materials)
 *  - cover_width_mm?: override for tile effective cover width (default 1231 or materials)
 *
 * materials: flat keys from getMaterials()
 */
export function computeTilesLathsBOM(inputs = {}, materials = {}) {
    if (typeof window !== "undefined") {
    console.log("🟦 DBG computeTilesLathsBOM inputs:", inputs);
    console.log("🟦 DBG tile system candidates:", {
      "inputs.tile_system": inputs?.tile_system,
      "inputs.tileSystem": inputs?.tileSystem,
      "inputs.tile_type": inputs?.tile_type,
      "inputs.tileType": inputs?.tileType,
      "inputs.roofCovering": inputs?.roofCovering,
      "inputs.options?.tileSystem": inputs?.options?.tileSystem,
      "inputs.options?.tile_system": inputs?.options?.tile_system,
      "inputs.design?.tileSystem": inputs?.design?.tileSystem,
      "inputs.design?.tile_system": inputs?.design?.tile_system,
    });
  }
  const {
    // Primary names used by the calc:
    // If these are missing, fall back to the Summary-style names.
    run_mm = inputs.internalWidthMM ?? 0,
    projection_mm = inputs.internalProjectionMM ?? 0,
    slope_mm: slopeIn,
    pitch_deg = inputs.pitchDeg ?? 0,

    eaves_overhang_mm = 50,
    leftSide = "exposed",
    rightSide = "wall",
    waste_pct = 5,

    eaves_guard_waste_pct = 0,
    tile_starter_waste_pct = 0,
    verge_waste_pct = 0,
    chamfer_waste_pct = 0,
    fixings_waste_pct = 0,
    watercourse_waste_pct = 0,

    gauge_mm: gaugeIn,
    cover_width_mm: coverIn,

    // Accept both camelCase and snake_case from callers
    tileSystem =
  inputs.tile_system ??
  inputs.tileSystem ??
  inputs.tileType ??
  inputs.tile_type ??
  inputs.roofCovering ??
  "britmet",
  } = inputs;

  const isLiteSlate = String(tileSystem).toLowerCase() === "liteslate";
  if (typeof window !== "undefined") {
  console.log("✅ tilesLathsCalc computeTilesLathsBOM called:", { tileSystem, isLiteSlate });
}

  // ---- covers (piece effective covers) ----
   const covers = {
  verge: isLiteSlate
    ? (materials.dry_verge_piece_cover_mm ?? 2000)   // LiteSlate Dry Verge (2.0m)
    : (materials.verge_trim_piece_cover_mm ?? 1150), // Britmet 2-Part Barge
    watercourse: materials.watercourse_piece_cover_mm ?? 2950, // Wall abutment
    eavesGuard: materials.eaves_guard_piece_cover_mm ?? 3000, // legacy key
    tileStarter: materials.eaves_guard_piece_cover_mm ?? 3000, // Tile starter (same length as eaves guard)
  };

  // ---- tile geometry (allow user overrides; fall back to materials; then constants) ----
const gauge_mm =
  Number(gaugeIn) ||
  (isLiteSlate
    ? materials.tile_liteslate_gauge_mm
    : materials.tile_britmet_gauge_mm) ||
  250;

const cover_width_mm =
  Number(coverIn) ||
  (isLiteSlate
    ? materials.tile_liteslate_cover_w_mm
    : materials.tile_britmet_cover_w_mm) ||
  1231;

// Tiles per m² (default 3.2 if not in materials)
const tiles_per_m2 = isLiteSlate
  ? Number(
      materials.tile_liteslate_tiles_per_m2 ??
        materials.tile_britmet_tiles_per_m2 ??
        3.2
    )
  : Number(materials.tile_britmet_tiles_per_m2 ?? 3.2);


  // ---- counts (AREA-BASED FOR BRITMET) ----
  // Resolve a single slope length up the roof (prefer explicit slope if given)
  const slope_mm_effective =
    mm(slopeIn) > 0 ? mm(slopeIn) : slopeLength({ projection_mm, pitch_deg });

  // Keep per-course count for items like fixings packs, etc.
  const courses = courseCount({
    gauge_mm,
    slope_mm: slope_mm_effective,
    eaves_overhang_mm,
  });

  // External roof area in m² (external run × slope length)
const area_m2_ext = +(
  (mm(run_mm) * slope_mm_effective) /
  1_000_000
).toFixed(2);

// Base tiles (no waste): round UP to a solid sheet count
const tiles_no_waste = Math.ceil(area_m2_ext * tiles_per_m2);


  // Waste % (default using inputs.waste_pct if provided; otherwise 5)
  const waste_pct_tiles = Number.isFinite(Number(waste_pct))
    ? Number(waste_pct)
    : 5;

  // Final tiles incl. waste, rounded up
  const tiles_total = Math.ceil(
    tiles_no_waste * (1 + waste_pct_tiles / 100)
  );

  // Tile starter (front only) with optional waste
  const tsPiecesRaw = pieceCount({
    run_mm,
    piece_cover_mm: covers.tileStarter,
  });

  // Apply wastage, then round up to the next 0.5 length (half-piece)
  const tileStarterPieces =
    Math.ceil(
      tsPiecesRaw *
        (1 + (Number(tile_starter_waste_pct) || 0) / 100) *
        2
    ) / 2;

  // Side trims run **up the slope** — reuse the same slope value
  const left  = sideEdgeParts({ sideType: leftSide,  slope_mm: slope_mm_effective, covers });
const right = sideEdgeParts({ sideType: rightSide, slope_mm: slope_mm_effective, covers });

// ---- Verge (2-Part Barge) with half-length logic ----

// How many sides are actually exposed?
const exposedSidesCount =
  (leftSide === "exposed" ? 1 : 0) +
  (rightSide === "exposed" ? 1 : 0);

let vergePiecesRaw = 0;

if (exposedSidesCount > 0 && covers.verge > 0) {
  // Raw pieces per side (can be fractional)
  const raw_per_side = slope_mm_effective / covers.verge;

  // Allow half-lengths per side: 0.5, 1.0, 1.5, ...
  const per_side_half = Math.ceil(raw_per_side * 2) / 2;

  // Total across both exposed sides
  vergePiecesRaw = exposedSidesCount * per_side_half;
}

// Watercourse still from sideEdgeParts
const watercoursePiecesRaw =
  (left.watercoursePieces || 0) + (right.watercoursePieces || 0);

// Apply optional wastes
const vergePiecesWithWaste =
  vergePiecesRaw * (1 + (Number(verge_waste_pct) || 0) / 100);

// Keep final verge count in 0.5 increments
const vergePieces = Math.ceil(vergePiecesWithWaste * 2) / 2;

const watercoursePieces = Math.ceil(
  watercoursePiecesRaw * (1 + (Number(watercourse_waste_pct) || 0) / 100)
);


  // Front-only items
  const chamferLath_m_raw = toM(run_mm); // metres along front run
  const chamferLath_m = Number(
    (chamferLath_m_raw *
      (1 + (Number(chamfer_waste_pct) || 0) / 100)).toFixed(2)
  );

  // Fixings: 1 pack per course (with optional waste)
  const fixingsPacks = Math.ceil(
    courses * (1 + (Number(fixings_waste_pct) || 0) / 100)
  );

  // Touch-up: 1 per roof
  const touchUpQty = 1;

// ---- pricing (from /materials with safe fallbacks) ----
const price_tile = isLiteSlate
  ? (materials.liteslate_tile_price_each ??
     materials.tile_britmet_price_each ??
     6.12)
  : (materials.tile_britmet_price_each ?? 6.12);

const price_verge = isLiteSlate
  ? (materials.liteslate_dry_verge_2m_price ??
     materials.verge_trim_price_each ??
     8.27)
  : (materials.verge_trim_price_each ?? 8.27);

const price_tileStarter =
  materials.eaves_guard_price_each ?? 8.80;

const price_watercourse =
  materials.watercourse_price_each ?? 4.0;

const price_chamferLath_pm =
  materials.chamfer_lath_price_per_m ?? 0.55;

const price_fixingsPack =
  materials.fixings_pack_britmet_price_each ?? 3.50;

const price_touchup =
  materials.touchup_kit_britmet_price_each ?? 5.10;


// ---- weights (kg) from materials with aliases/fallbacks ----
const wt_tile = Number(
  (isLiteSlate
    ? materials.liteslate_tile_weight_kg_each ??
      materials.liteslate_tile_weight_kg
    : materials.tile_britmet_weight_kg_each ??
      materials.tile_britmet_weight_kg) ?? 0
);

const wt_verge = Number(
  (isLiteSlate
    ? materials.dry_verge_weight_kg_each ??
      materials.dry_verge_weight_kg
    : materials.verge_trim_weight_kg_each ??
      materials.verge_trim_weight_kg) ?? 0
);

const wt_eaves_guard_piece_kg = Number(
  materials.eaves_guard_weight_kg_each ??
    materials.eaves_guard_weight_kg ??
    0
);

const wt_watercourse_piece_kg = Number(
  materials.watercourse_weight_kg_each ??
    materials.watercourse_weight_kg ??
    0
);

const wt_chamferLath_per_m_kg = Number(
  materials.chamfer_lath_weight_per_m_kg ??
    materials.chamfer_lath_weight_kg_per_m ??
    0
);

const wt_fixingsPack = Number(
  materials.fixings_pack_britmet_weight_kg_each ??
    materials.fixings_pack_britmet_weight_kg ??
    0
);

const wt_touchup = Number(
  materials.touchup_kit_britmet_weight_kg_each ??
    materials.touchup_kit_britmet_weight_kg ??
    0
);


  // ---- line totals ----
  const lt_tiles = lineTotal(tiles_total, price_tile);
  const lt_verge = lineTotal(vergePieces, price_verge);
  const lt_tileStarter = lineTotal(
    tileStarterPieces,
    price_tileStarter
  );
  const lt_water = lineTotal(
    watercoursePieces,
    price_watercourse
  );
  const lt_chamfer = lineTotal(
    chamferLath_m,
    price_chamferLath_pm
  );
  const lt_fix = lineTotal(fixingsPacks, price_fixingsPack);
  const lt_touch = lineTotal(touchUpQty, price_touchup);

  const grand = money(
    lt_tiles +
      lt_verge +
      lt_tileStarter +
      lt_water +
      lt_chamfer +
      lt_fix +
      lt_touch
  );
if (typeof window !== "undefined") {
  console.log("🧱 tilesLathsCalc returning lines labels:", ([
    { key: "tiles", label: isLiteSlate ? "LiteSlate tiles" : "Britmet tiles", qty: tiles_total, unit: price_tile, line: lt_tiles },
    { key: "tile_starter", qty: tileStarterPieces, unit: price_tileStarter, line: lt_tileStarter },
    { key: "screws_tile_fixings", qty: fixingsPacks, unit: price_fixingsPack, line: lt_fix },
  ]));
}
  return {
    meta: {
      gauge_mm,
      cover_width_mm,
      eaves_overhang_mm,
      pitch_deg,
      covers,
      wastes: {
        tiles_waste_pct: Number(waste_pct) || 0,
        eaves_guard_waste_pct: Number(eaves_guard_waste_pct) || 0,
        tile_starter_waste_pct:
          Number(tile_starter_waste_pct) || 0,
        verge_waste_pct: Number(verge_waste_pct) || 0,
        chamfer_waste_pct: Number(chamfer_waste_pct) || 0,
        fixings_waste_pct: Number(fixings_waste_pct) || 0,
        watercourse_waste_pct:
          Number(watercourse_waste_pct) || 0,
      },
    },
    derived: {
      courses,
      tiles_total,
      fixingsPacks,
      tileStarterPieces,
      vergePieces,
      watercoursePieces,
      chamferLath_m,
      touchUpQty,
    },
    prices: {
      price_tile,
      price_verge,
      price_tileStarter,
      price_watercourse,
      price_chamferLath_pm,
      price_fixingsPack,
      price_touchup,
    },

    // 🔽 LINES ENRICHED FOR SUMMARY / TILE ELEMENTS 🔽
    lines: [
      {
  key: "tiles",
  label: isLiteSlate ? "LiteSlate tiles" : "Britmet tiles",
  group: "tiles",
  qty: tiles_total,
  qtyDisplay: tiles_total,
  unit: price_tile,
  unitPrice: price_tile,
  unitLabel: "pcs",
  weightPerUnitKg: wt_tile,
  weightEachKg: wt_tile,
  line: lt_tiles,
},
{
  key: "verge",
  label: isLiteSlate ? "Dry Verge" : "2-Part Barge",
  group: "tiles",
  qty: vergePieces,
  qtyDisplay: vergePieces,
  unit: price_verge,
  unitPrice: price_verge,
  unitLabel: "pcs",              // 👈
  weightPerUnitKg: wt_verge,
  weightEachKg: wt_verge,
  line: lt_verge,
},
{
  key: "chamfer",
  label: "Chamfered lath (m, front only)",
  group: "tiles_front",
  qty: chamferLath_m,
  qtyDisplay: chamferLath_m.toFixed(2),
  unit: price_chamferLath_pm,
  unitPrice: price_chamferLath_pm,
  unitLabel: "m",                // 👈
  weightPerUnitKg: wt_chamferLath_per_m_kg,
  weightPerMKg: wt_chamferLath_per_m_kg,
  line: lt_chamfer,
},
{
  key: "fixings",
  label: "Fixings pack (per course)",
  group: "tiles",
  qty: fixingsPacks,
  qtyDisplay: fixingsPacks,
  unit: price_fixingsPack,
  unitPrice: price_fixingsPack,
  unitLabel: "pack",             // 👈
  weightPerUnitKg: wt_fixingsPack,
  weightEachKg: wt_fixingsPack,
  line: lt_fix,
},
{
  key: "touchup",
  label: "Touch-Up kit",
  group: "tiles",
  qty: touchUpQty,
  qtyDisplay: 1,
  unit: price_touchup,
  unitPrice: price_touchup,
  unitLabel: "kit",              // 👈
  weightPerUnitKg: wt_touchup,
  weightEachKg: wt_touchup,
  line: lt_touch,
},
    ],
    grand,
  };
}
