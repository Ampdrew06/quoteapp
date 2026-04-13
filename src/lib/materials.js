// src/lib/materials.js
// Stores editable material prices in localStorage and provides sane defaults.

const STORAGE_KEY = "materials_v1";

export const defaultMaterials = {
  // --- uPVC colour price multipliers ---
  // Multiplies against “white” base prices
  // 1.00 = white
  // Foils are more expensive
  upvc_colour_multipliers: {
    white: 1.0,
    rosewood: 1.35,
    golden_oak: 1.35,
    anthracite: 1.35,
    black: 1.25,
  },
// ---------- Core timber & boards ----------
steico: {
  price_per_m: 6.40,        // £/m (I-joist 220)
  stock_len_m: 12.0,        // ref only
  price_per_bar: 76.80,     // ref only
  weight_kg_per_m: 2.95,    // kg/m  ← you already know this value
  waste_percent: 10,        // % waste, editable in Materials page
},
pse30x90: {
  // 30×90 PSE ring-beam timber
  price_per_m: 1.28,        // £/m
  weight_kg_per_m: 1.4,     // kg/m (approx.)
  stock_len_m: 4.8,         // standard PSE stock length
  waste_percent: 10,        // default 10% (editable from Materials page)
},
  ply9mm: {
    // 9mm structural ply used as soffit / wallplate face / ring-beam upstands
    price_per_m2: 5.40,       // £/m²  (set your real value in Materials UI)
    weight_kg_per_m2: 5.21,   // kg/m² (set your real value in Materials UI)
    sheet_len_m: 2.4,         // 2400 mm
    sheet_width_m: 1.2,       // 1200 mm
    waste_pct: 10,            // default 10% waste for chargeable cost
  },

chamferLath: {
  price_per_m: 0.55,          // £/m
  weight_kg_per_m: 0.65,      // kg/m
  waste_percent: 10,          // % waste, editable
},

ply18mm: {
  // 18mm structural ply used for wallplate internal infill (and later ring-beam supports)
  price_per_m2: 8.16,
  weight_kg_per_m2: 10.76,
  sheet_len_m: 2.4,
  sheet_width_m: 1.2,
  waste_pct: 10,
},

// Legacy alias for old code (Materials page) that still expects "ply18"
ply18: {
  price_per_m2: 8.16,
  weight_kg_per_m2: 10.76,
  sheet_len_m: 2.4,
  sheet_width_m: 1.2,
  waste_pct: 10,
},

metal: {
  tile_starter: { price_each: 0, weight_kg_each: 0 },
  joist_hanger: { price_each: 0, weight_kg_each: 0 },
  joist_hanger_variable: { price_each: 0, weight_kg_each: 0 },

  spar_hook: { price_each: 0, weight_kg_each: 0 },
  jack_rafter_hook: { price_each: 0, weight_kg_each: 0 },
  jack_rafter_bracket: { price_each: 0, weight_kg_each: 0 },

  corner_hanger: { price_each: 0, weight_kg_each: 0 }, // your “Corner Angle”
  boss_rafter_terminal: { price_each: 0, weight_kg_each: 0 },
  reinforcement_plate: { price_each: 0, weight_kg_each: 0 },
  gable_strap: { price_each: 0, weight_kg_each: 0 },
  watercourse: { price_per_piece: 0, effective_cover_mm: 2950, weight_kg_per_piece: 0 },
},


  // ---------- Ring-beam materials ----------
  ringBeam: {
  timber_price_per_m: 1.28,   // £/m for 30×90 PSE
  stock_len_m: 4.8,           // standard stock length
  price_per_bar: 6.14,        // 1.28 * 4.8
  routing_price_per_m: 0.00,  // £/m for groove (labour)
},

  // 50×25 fixing lath (per metre, continuous run)
  lath25x50: {
    price_per_m: 0.62,
  },

  // 25×50 finishing lath (per metre, per upstand pieces total length)
  lathFinish: {
    price_per_m: 0.62,
  },
    // Stock length for both internal & external laths
  lath_stock_length_m: 4.8,


  // 50 mm PIR for upstands — bought as sheets, cost by m²
  pir50: {
  sheet_w_m: 1.2,
  sheet_h_m: 2.4,
  price_per_sheet: 16.27,
  price_per_m2: 5.65,
  waste_pct: 5,             // set to whatever you prefer
  weight_kg_per_m2: 1.6,    // typical-ish for 50mm PIR; tweak if you have a known value
},

  // 100 mm PIR between rafters
  pir100: {
    sheet_w_m: 1.2,
    sheet_h_m: 2.4,
    price_per_sheet: 27.84,
    price_per_m2: 9.67,     // ref only; we usually charge by sheet
  },

  // ---------- NEW: Britmet tiles & accessories (grouped) ----------
  britmetShingle: {
    price_each: 6.12,
    weight_kg_per_tile: 2.19,
    cover_w_mm: 1231,
    gauge_mm: 250,
  },

  // --- LiteSlate (flat keys used by Materials UI) ---
liteslate_tile_price_each: 1.81,
liteslate_ridge_tile_price_each: 3.10,
liteslate_ridge_hip_adaptor_price_each: 30.00,      // set your real value
liteslate_hip_end_cap_90_price_each: 23.50,
liteslate_dry_verge_price_each: 13.91,


  eavesGuard: {
    price_per_piece: 8.80,       // £ per 3.0 m piece
    piece_len_mm: 3000,
    effective_cover_mm: 3000,    // no overlap on lean-to front run
    weight_kg_per_piece: 2.7,
  },

  vergeTrim2Part: {
    price_per_piece: 8.27,       // £ per 1.25 m piece (corrected)
    piece_len_mm: 1250,
    effective_cover_mm: 1150,    // 100 mm overlap
    weight_kg_per_piece: 1.2,    // approx
  },

chamferLath: {
  price_per_m: 0.55,           // £/m
  weight_kg_per_m: 0.65,       // kg/m
  waste_pct: 10,               // default 10% waste for laths
},


  fixingsPackBritmet: {
    price_each: 3.50,            // £ per pack (per course)
    weight_kg_per_pack: 0.30,
  },
  
  tileFixings: {
  label: `1" x 8`,
  price_per_box: 1.47,
  units_per_box: 200,
  per_tile_britmet: 3,
  per_tile_liteslate: 2,
},

  touchUpKitBritmet: {
    price_each: 5.10,            // £ per kit
    weight_kg_per_kit: 0.30,
  },

  watercourse: {
    price_per_piece: 4.00,       // £ per piece
    piece_len_mm: 3000,
    effective_cover_mm: 2950,    // 50 mm overlap
    weight_kg_per_piece: 0.90,
  },
  // ---------- Site consumables & fixings ----------
  expandingFoam: {
    price_each: 3.78,        // £ per can
    base_cans_per_roof: 2,   // default: 2 cans
    extra_cans_area_step_m2: 12, // add +1 can per this many m² above the first step
    weight_kg_each: 0.80,
  },

  polytopPins: {
    price_per_box: 5.95,     // £ per 250
    units_per_box: 250,
    default_qty_units: 50,    // we usually include 50 pins per roof
    weight_kg_each: 0.25,  
  },

  aluRollTape: {
    price_each: 3.88,        // £ per roll (50 m)
    default_rolls: 1,        // usually 1 per roof
    area_step_m2: 25,        // optional: add another roll per 25 m² (keeps 1 for small roofs)
    weight_kg_each: 0.35,  
  },

  rafterEavesScrews: {
    label: '3" x 10 (rafter/eaves)',
    price_per_box: 4.70,
    units_per_box: 200,
    // need ≈ (#rafters + spaces between rafters) × 1.5 (50% extra)
    extra_factor: 1.5,
    weight_kg_each: 1.2,  
  },

  lathFixings: {
    label: '2" x 8 (lath fixings)',
    price_per_box: 3.06,
    units_per_box: 200,
    weight_kg_each: 0.9,  
  },

  tileFixings: {
    label: '1" x 8 (tile fixings)',
    price_per_box: 1.47,
    units_per_box: 200,
    per_tile: 3,             // 3 per tile for Britmet
    per_ridge_cap: 4,        // lean-to has no ridge, but keep for future
    per_hip_end_cap: 2,      // lean-to has no hips, but keep for future
    weight_kg_each: 0.6,  
  },

  // ---------- Top-level (flat) defaults for direct editing ----------
  tile_britmet_price_each: 6.12,
  tile_britmet_weight_kg: 2.19,
  tile_britmet_cover_w_mm: 1231,
  tile_britmet_tiles_per_m2: 3.2,
  tile_britmet_gauge_mm: 250,

  // Ply & OSB sheet prices (2.88 m² sheets)
ply9_sheet_price: 0,
ply18_sheet_price: 0,
osb18_sheet_price: 0,

// 19×38 laths (binding)
lath19x38_price_per_m: 0,
lath19x38_bar_price: 0,


// --- Britmet accessories (flat keys used by Materials page) ---
britmet_ridge_tile_price_each: 0,
britmet_y_adaptor_price_each: 0,
britmet_5way_adaptor_price_each: 0,
britmet_universal_ridge_adaptor_price_each: 0,
britmet_hip_end_cap_90_price_each: 0,
britmet_hip_end_cap_135_price_each: 0,
britmet_gable_end_cap_price_each: 0,
britmet_vent_strip_price_each: 0,

  eaves_guard_piece_cover_mm: 3000,
  eaves_guard_price_each: 8.80,
  eaves_guard_weight_kg: 2.70,

  verge_trim_piece_cover_mm: 1150,
  verge_trim_price_each: 8.27,
  verge_trim_weight_kg: 1.20,

  chamfer_lath_price_per_m: 0.55,
  chamfer_lath_weight_kg_per_m: 0.65,

  fixings_pack_britmet_price_each: 3.50,
  fixings_pack_britmet_weight_kg: 0.30,

  touchup_kit_britmet_price_each: 5.10,
  touchup_kit_britmet_weight_kg: 0.30,

    // --- Fascia & soffit (shared plastics) ---
  fascia_stock_length_m: 5,
  soffit_stock_length_m: 5,

  // Approx weights per metre (tweak in Materials page if you want)
  fascia_weight_kg_per_m_white: 1.0,
  fascia_weight_kg_per_m_foiled: 1.2,

  soffit_weight_kg_per_m_white: 0.8,
  soffit_weight_kg_per_m_foiled: 1.0,

  // Fascia accessories – corners & joints
  fascia_corner_price_each_white: 0,
  fascia_corner_price_each_foiled: 0,
  fascia_corner_weight_kg_each: 0.25,

  fascia_joint_price_each_white: 0,
  fascia_joint_price_each_foiled: 0,
  fascia_joint_weight_kg_each: 0.25,

// Fascia/soffit accessories (per item)
fascia_j_section_white_price: 0,
fascia_j_section_foiled_price: 0,

fascia_h_section_white_price: 0,
fascia_h_section_foiled_price: 0,

fascia_corner_90_ext_300_white_price: 0,
fascia_corner_90_ext_300_foiled_price: 0,

fascia_corner_90_double_ext_500_white_price: 0,
fascia_corner_90_double_ext_500_foiled_price: 0,

fascia_corner_int_500_white_price: 0,
fascia_corner_int_500_foiled_price: 0,

fascia_joint_300_white_price: 0,
fascia_joint_300_foiled_price: 0,

fascia_joint_500_white_price: 0,
fascia_joint_500_foiled_price: 0,

fascia_corner_135_300_white_price: 0,
fascia_corner_135_300_foiled_price: 0,

fascia_vent_disc_white_price: 0,
fascia_vent_disc_foiled_price: 0,

plaster_bead_white_price: 0,
plaster_bead_foiled_price: 0,


  // --- LiteSlate (unit-priced by tile) ---
  liteslate_tile_price_each: 1.81,
  liteslate_tile_weight_kg_each: 0.7,        // 🔹 adjustable in UI later

  liteslate_density_12_25: 22,   // tiles per m² for 12°–24.99°
  liteslate_density_25_27: 20,   // 25°–27.49°
  liteslate_density_27_30: 19,   // 27.5°–29.99°
  liteslate_density_ge_30: 18,   // ≥30°

  liteslate_ridge_tile_price_each: 3.10,
  liteslate_ridge_units_per_m: 5.5,

  liteslate_three_way_adaptor_price: 31.20,
  liteslate_ridge_end_cap_price: 10.56,

  liteslate_dry_verge_2m_price: 14.86,
  liteslate_dry_verge_weight_kg_each: 0.7,   // 🔹 per 2m piece (tweak as needed)

  liteslate_hip_end_cap_90_price: 10.56,
  liteslate_hip_end_cap_135_price: 10.56,

  // --- Fascia / Soffit (defaults) ---
  fascia_stock_length_m: 5,
  soffit_stock_length_m: 5,

  // geometry constant: 25° with 150→225 baseline
  fascia_k_constant_mm: 225 - 150 * Math.tan(25 * Math.PI / 180), // ≈155.05

  // vent pricing (per metre)
  fascia_vent_price_per_m: 0.50,   // TODO: set your real value
  vent_disc_price_each: 0.50,       // TODO
  vent_discs_per_m: 1,
  vent_rounding_mode: "ceil",       // "ceil" | "exact"

  // stocked fascia heights (per 5.0 m length)
  fascia_price_per_length_white_mm: {
    200: 13.41, 225: 15.95, 250: 18.42, 300: 22.57, 400: 31.33, // TODO: confirm
  },
  fascia_price_per_length_foiled_mm: {
    200: 27.15, 225: 32.43, 250: 35.13, 300: 39.62, 400: 56.30, // TODO: confirm
  },

  soffit_board_widths_mm: [100, 150, 175, 200],
  soffit_price_per_length_white_mm: {
    100: 8.89, 150: 11.47, 175: 13.59, 200: 13.59,             // TODO: confirm
  },
  soffit_price_per_length_foiled_mm: {
    100: 18.81, 150: 26.29, 175: 27.19, 200: 29.22,            // TODO: confirm
  },

    // --- J-Section / J-Trim (5.0 m length) ---
  j_section_stock_length_m: 5,

  j_section_price_each_white: 0,   // 🔹 set real prices in Materials UI
  j_section_price_each_foiled: 0,

  j_section_weight_kg_each_white: 0.80,  // kg per 5.0 m length (example)
  j_section_weight_kg_each_foiled: 0.90,

    // --- Gutters (defaults) ---
  gutter_length_m: 4,
  gutter_bracket_spacing_mm: 800,

  // Square profile (per item)
  gutter_square_length_4m_price: 0,
  gutter_square_union_price: 0,
  gutter_square_bracket_price: 0,
  gutter_square_running_outlet_price: 0,
  gutter_square_stop_end_price: 0,

  // Round profile
  gutter_round_length_4m_price: 0,
  gutter_round_union_price: 0,
  gutter_round_bracket_price: 0,
  gutter_round_running_outlet_price: 0,
  gutter_round_stop_end_price: 0,

  // Ogee profile
  gutter_ogee_length_4m_price: 0,
  gutter_ogee_union_price: 0,
  gutter_ogee_bracket_price: 0,
  gutter_ogee_running_outlet_price: 0,
  gutter_ogee_stop_end_price: 0,

  // Downpipes & fittings
  dp_length_m: 2.5,
  dp_length_2_5m_price: 0,
  dp_bend_price: 0,
  dp_shoe_price: 0,
  dp_clip_price: 0,
  dp_adaptor_price: 0,

  // 🔹 Gutter & downpipe weights (kg per piece)
  gutter_length_weight_kg: 2.6,       // 4.0 m length
  gutter_union_weight_kg: 0.2,
  gutter_bracket_weight_kg: 0.02,
  gutter_outlet_weight_kg: 0.3,
  gutter_stop_end_weight_kg: 0.05,

  downpipe_length_weight_kg: 2.5,     // 2.5 m piece
  downpipe_bend_weight_kg: 0.05,
  downpipe_shoe_weight_kg: 0.05,
  downpipe_clip_weight_kg: 0.02,
  downpipe_adaptor_weight_kg: 0.05,

    // --- Metal items ---
  metal: {
    tile_starter: { price_each: 12.00, weight_kg_each: 2.7, },
     watercourse: { price_per_piece: 4.00, piece_len_mm: 3000, effective_cover_mm: 2950, weight_kg_per_piece: 0.90, },
    joist_hanger: { price_each: 0.49, weight_kg_each: 0.9, },

    // future-proofing (safe defaults)
    spar_hook: { price_each: 3.35, weight_kg_each: 0.25 },
    jack_rafter_hook: { price_each: 0, weight_kg_each: 0 },
  },


  // ---------- Misc / Insulation ----------
  // Breather membrane (roll coverage in m, priced per roll)
  breatherMembrane: {
    roll_width_m: 1.0,        // your latest value
    roll_length_m: 50,
    price_per_roll: 28.32,
    weight_kg_per_roll: 9.0,
    wastage_pct: 8,
  },

  // 100 mm slab insulation — coverage by m² (set to 2.88 m² to match your “~4 packs” case)
  slab100: {
    pack_coverage_m2: 2.88,     // e.g. 4 boards × 1200×600 = 2.88 m²
    price_per_pack: 28.50,
    weight_kg_per_pack: 9.0,
    wastage_pct: 5,
  },

  // 50 mm slab insulation — coverage by m²
slab50: {
  pack_coverage_m2: 2.88,     // example: set to whatever your 50mm pack covers
  price_per_pack: 15.20,          // put your real 50mm pack price here
  weight_kg_per_pack: 5.0,      // put your real 50mm pack weight here
  wastage_pct: 5,
},


  // SuperQuilt — multiple roll sizes (12 m² and 15 m²)
  // SuperQuilt (simple default used by calculators)
superquilt: {
  roll_width_m: 1.2,
  roll_length_m: 10,
  price_per_roll: 115.00,   // put your real price
  weight_kg_per_roll: 7.5,  // put your real weight
  wastage_pct: 6,
},

  superquilt_options: [
    {
      label: "SuperQuilt 1.2×10 m (12.0 m²)",
      roll_width_m: 1.2,
      roll_length_m: 10,
      coverage_m2: 12.0,
      price_per_roll: 78.90,
      weight_kg_per_roll: 7.5,
    },
    {
      label: "SuperQuilt 1.5×10 m (15.0 m²)",
      roll_width_m: 1.5,
      roll_length_m: 10,
      coverage_m2: 15.0,
      price_per_roll: 96.60,
      weight_kg_per_roll: 9.0,
    },
  ],
  superquilt_wastage_pct: 6,            // applied to the total area
  superquilt_overlap_mm: 50,            // course overlap loss
  superquilt_half_roll_window_m2: 2.0,  // allow 6/7.5 only if within +2 m² of boundary

  // Settings: treat 50 mm PIR “cradle” on rafters as included in rafter price?
  include_rafters_pir_cradle_in_rafters: false,
  pir50_cradle_weight_multiplier: 0.6,

  // ---------- Pricing knobs (flat) ----------
delivery_flat: 0,  // flat delivery charge (£)
profit_pct: 0,     // profit % applied to materialsCost
vat_rate: 0.20,    // VAT rate

// ---------- Gutter weights (kg per metre) ----------
gutter_square_weight_kg_per_m: 0.625,
gutter_round_weight_kg_per_m: 0.56,
gutter_ogee_weight_kg_per_m: 0.675,
downpipe_weight_kg_per_m: 1.65,
};


/**
 * Load materials from localStorage and merge with defaults so any missing fields
 * are filled automatically.
 *
 * Returns:
 * - grouped objects (steico, ply*, pir*, ringBeam, …)
 * - flat compatibility keys used elsewhere:
 *   steico220_per_m, ply9_per_m2, …, pir100_sheet_price,
 * - tiles/accessories flat keys (tile_britmet_*, eaves_guard_*, verge_trim_*, etc.)
 * - plus a few aliases for older names (…_each, …_per_m_kg) for compatibility
 */
export function getMaterials() {
  // ✅ Ensure materials_v1 exists (seed defaults if user cleared localStorage)
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    }
  }

  try {
    if (typeof window !== "undefined") {
      window.__GET_MATERIALS_CALLS__ =
        (window.__GET_MATERIALS_CALLS__ || 0) + 1;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) || {}) : {};
    // ... keep the rest as-is
// ✅ Backfill PIR nested objects from any legacy/flat UI keys
// (so whatever the Materials page edits, the calculators see it)

data.pir50 = { ...(defaultMaterials.pir50 || {}), ...(data.pir50 || {}) };
data.pir100 = { ...(defaultMaterials.pir100 || {}), ...(data.pir100 || {}) };

data.pir50 = data.pir50 || {};
data.pir100 = data.pir100 || {};

// If UI (or old code) wrote flat sheet-price keys, push them into nested objects
const pir50Sheet = data.pir50?.price_per_sheet ?? data.pir50_price_per_sheet;
if (pir50Sheet !== undefined) data.pir50.price_per_sheet = Number(pir50Sheet);

const pir100Sheet = data.pir100?.price_per_sheet ?? data.pir100_price_per_sheet;
if (pir100Sheet !== undefined) data.pir100.price_per_sheet = Number(pir100Sheet);

// If UI wrote flat m² keys, push them too
if (data.pir50_per_m2 !== undefined) data.pir50.price_per_m2 = Number(data.pir50_per_m2);
if (data.pir100_per_m2 !== undefined) data.pir100.price_per_m2 = Number(data.pir100_per_m2);

// Recalculate price_per_m2 from price_per_sheet if we have sheet dimensions
const pirArea50 = Number(data.pir50.sheet_w_m || 0) * Number(data.pir50.sheet_h_m || 0);
if (pirArea50 > 0 && Number(data.pir50.price_per_sheet) > 0) {
  data.pir50.price_per_m2 = Number((Number(data.pir50.price_per_sheet) / pirArea50).toFixed(4));
}

const pirArea100 = Number(data.pir100.sheet_w_m || 0) * Number(data.pir100.sheet_h_m || 0);
if (pirArea100 > 0 && Number(data.pir100.price_per_sheet) > 0) {
  data.pir100.price_per_m2 = Number((Number(data.pir100.price_per_sheet) / pirArea100).toFixed(4));
}

    // ✅ Backfill nested metal group from legacy + UI flat keys (so old UI + new UI both work)
data.metal = data.metal || {};
// ✅ Backfill MISC keys used by Materials UI into the nested objects that calculators read

// ---- Breather membrane (UI keys → nested group) ----
data.breatherMembrane = data.breatherMembrane || {};

if (data.breather_membrane_price_each !== undefined) {
  data.breatherMembrane.price_per_roll = Number(data.breather_membrane_price_each);
}
if (data.breather_membrane_weight_kg_each !== undefined) {
  data.breatherMembrane.weight_kg_per_roll = Number(data.breather_membrane_weight_kg_each);
}

// Also accept the newer roll-style keys (if present)
if (data.breather_roll_price_each !== undefined) {
  data.breatherMembrane.price_per_roll = Number(data.breather_roll_price_each);
}
if (data.breather_roll_weight_kg !== undefined) {
  data.breatherMembrane.weight_kg_per_roll = Number(data.breather_roll_weight_kg);
}
if (data.breather_roll_width_m !== undefined) {
  data.breatherMembrane.roll_width_m = Number(data.breather_roll_width_m);
}
if (data.breather_roll_length_m !== undefined) {
  data.breatherMembrane.roll_length_m = Number(data.breather_roll_length_m);
}
if (data.breather_wastage_pct !== undefined) {
  data.breatherMembrane.wastage_pct = Number(data.breather_wastage_pct);
}

// ---- SuperQuilt (UI keys → superquilt_options rows) ----
if (!Array.isArray(data.superquilt_options)) {
  data.superquilt_options = Array.isArray(defaultMaterials.superquilt_options)
    ? JSON.parse(JSON.stringify(defaultMaterials.superquilt_options))
    : [];
}

const patchSQ = (coverage, patch) => {
  const idx = (data.superquilt_options || []).findIndex(
    (o) => Number(o?.coverage_m2) === Number(coverage)
  );
  if (idx >= 0) data.superquilt_options[idx] = { ...data.superquilt_options[idx], ...patch };
};

// UI price keys
if (data.superquilt_12m_price_each !== undefined) {
  patchSQ(12, { price_per_roll: Number(data.superquilt_12m_price_each) });
}
if (data.superquilt_15m_price_each !== undefined) {
  patchSQ(15, { price_per_roll: Number(data.superquilt_15m_price_each) });
}

// UI weight keys (allow different weights per roll if you want)
if (data.superquilt_12m_weight_kg_each !== undefined) {
  patchSQ(12, { weight_kg_per_roll: Number(data.superquilt_12m_weight_kg_each) });
}
if (data.superquilt_15m_weight_kg_each !== undefined) {
  patchSQ(15, { weight_kg_per_roll: Number(data.superquilt_15m_weight_kg_each) });
}

// Also accept your existing shared weight key if you’ve used it
if (data.superquilt_roll_weight_kg !== undefined) {
  patchSQ(12, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
  patchSQ(15, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
}

// ✅ Backfill MISC groups from flat keys so Materials edits persist

// ---- Breather membrane ----
data.breatherMembrane = data.breatherMembrane || {};

if (data.breather_roll_price_each !== undefined) {
  data.breatherMembrane.price_per_roll = Number(data.breather_roll_price_each);
}
if (data.breather_roll_weight_kg !== undefined) {
  data.breatherMembrane.weight_kg_per_roll = Number(data.breather_roll_weight_kg);
}
if (data.breather_roll_width_m !== undefined) {
  data.breatherMembrane.roll_width_m = Number(data.breather_roll_width_m);
}
if (data.breather_roll_length_m !== undefined) {
  data.breatherMembrane.roll_length_m = Number(data.breather_roll_length_m);
}
if (data.breather_wastage_pct !== undefined) {
  data.breatherMembrane.wastage_pct = Number(data.breather_wastage_pct);
}

// ---- SuperQuilt options (12m² / 15m²) ----
// getMaterials derives SQ prices from superquilt_options, so we must push flat edits into the option rows.
if (!Array.isArray(data.superquilt_options)) {
  data.superquilt_options = Array.isArray(defaultMaterials.superquilt_options)
    ? JSON.parse(JSON.stringify(defaultMaterials.superquilt_options))
    : [];
}

const patchSQ_UI = (coverage, patch) => {
  const idx = (data.superquilt_options || []).findIndex(
    (o) => Number(o.coverage_m2) === Number(coverage)
  );
  if (idx >= 0) data.superquilt_options[idx] = { ...data.superquilt_options[idx], ...patch };
};
// ########## SUPERQUILT: keep keys in sync (Materials UI edits *_price_each) ##########
if (data.superquilt_12m_price_each !== undefined) {
  data.superquilt_12m2_price_ex_vat = Number(data.superquilt_12m_price_each);
}
if (data.superquilt_15m_price_each !== undefined) {
  data.superquilt_15m2_price_ex_vat = Number(data.superquilt_15m_price_each);
}
// ###########################################################################
if (data.superquilt_12m2_price_ex_vat !== undefined) {
  patchSQ_UI(12, { price_per_roll: Number(data.superquilt_12m2_price_ex_vat) });
}
if (data.superquilt_15m2_price_ex_vat !== undefined) {
  patchSQ_UI(15, { price_per_roll: Number(data.superquilt_15m2_price_ex_vat) });
}
if (data.superquilt_roll_weight_kg !== undefined) {
  patchSQ_UI(12, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
  patchSQ_UI(15, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
}


// Breather membrane (roll)
data.breatherMembrane = data.breatherMembrane || {};
data.breatherMembrane = {
  ...(data.breatherMembrane || {}),
  ...(data.breather_roll_width_m    !== undefined ? { roll_width_m: Number(data.breather_roll_width_m) } : {}),
  ...(data.breather_roll_length_m   !== undefined ? { roll_length_m: Number(data.breather_roll_length_m) } : {}),
  ...(data.breather_roll_price_each !== undefined ? { price_per_roll: Number(data.breather_roll_price_each) } : {}),
  ...(data.breather_roll_weight_kg  !== undefined ? { weight_kg_per_roll: Number(data.breather_roll_weight_kg) } : {}),
  ...(data.breather_wastage_pct     !== undefined ? { wastage_pct: Number(data.breather_wastage_pct) } : {}),
};

// SuperQuilt — your UI edits flat keys, but getMaterials derives price from superquilt_options.
// So: push flat edits back into the matching option rows (12m² / 15m²) before merge.
if (Array.isArray(data.superquilt_options)) {
  data.superquilt_options = data.superquilt_options.map((o) => {
    const cov = Number(o?.coverage_m2);
    if (cov === 12 && data.superquilt_12m2_price_ex_vat !== undefined) {
      return { ...o, price_per_roll: Number(data.superquilt_12m2_price_ex_vat) };
    }
    if (cov === 15 && data.superquilt_15m2_price_ex_vat !== undefined) {
      return { ...o, price_per_roll: Number(data.superquilt_15m2_price_ex_vat) };
    }
    // Optional: if you want the baseline weight to be editable too:
    if ((cov === 12 || cov === 15) && data.superquilt_roll_weight_kg !== undefined) {
      return { ...o, weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) };
    }
    return o;
  });
}

// ---------- Tile starter ----------
data.metal.tile_starter = {
  ...(data.metal.tile_starter || {}),
  ...(data.tile_starter_price_each !== undefined
    ? { price_each: Number(data.tile_starter_price_each) }
    : {}),
  ...(data.tile_starter_weight_kg_each !== undefined
    ? { weight_kg_each: Number(data.tile_starter_weight_kg_each) }
    : {}),
};

// ---------- Joist hanger ----------
// UI uses joist_hanger_price_each; older code used joist_hanger_each
data.metal.joist_hanger = {
  ...(data.metal.joist_hanger || {}),
  ...((data.joist_hanger_each ?? data.joist_hanger_price_each) !== undefined
    ? { price_each: Number(data.joist_hanger_each ?? data.joist_hanger_price_each) }
    : {}),
  ...(data.joist_hanger_weight_kg_each !== undefined
    ? { weight_kg_each: Number(data.joist_hanger_weight_kg_each) }
    : {}),
};

// ---------- Variable Joist Hanger ----------
// UI uses variable_joist_hanger_*
// Your canonical legacy flat keys are joist_hanger_variable_*
data.metal.joist_hanger_variable = {
  ...(data.metal.joist_hanger_variable || {}),
  ...((data.joist_hanger_variable_price_each ?? data.variable_joist_hanger_price_each) !== undefined
    ? { price_each: Number(data.joist_hanger_variable_price_each ?? data.variable_joist_hanger_price_each) }
    : {}),
  ...((data.joist_hanger_variable_weight_kg_each ?? data.variable_joist_hanger_weight_kg_each) !== undefined
    ? { weight_kg_each: Number(data.joist_hanger_variable_weight_kg_each ?? data.variable_joist_hanger_weight_kg_each) }
    : {}),
};

// ---------- Corner Hanger (UI calls it corner_angle) ----------
data.metal.corner_hanger = {
  ...(data.metal.corner_hanger || {}),
  ...((data.corner_hanger_price_each ?? data.corner_angle_price_each) !== undefined
    ? { price_each: Number(data.corner_hanger_price_each ?? data.corner_angle_price_each) }
    : {}),
  ...((data.corner_hanger_weight_kg_each ?? data.corner_angle_weight_kg_each) !== undefined
    ? { weight_kg_each: Number(data.corner_hanger_weight_kg_each ?? data.corner_angle_weight_kg_each) }
    : {}),
};

// ---------- Boss (Rafter Terminal) ----------
data.metal.boss_rafter_terminal = {
  ...(data.metal.boss_rafter_terminal || {}),
  ...((data.boss_rafter_terminal_price_each ?? data.boss_price_each) !== undefined
    ? { price_each: Number(data.boss_rafter_terminal_price_each ?? data.boss_price_each) }
    : {}),
  ...((data.boss_rafter_terminal_weight_kg_each ?? data.boss_weight_kg_each) !== undefined
    ? { weight_kg_each: Number(data.boss_rafter_terminal_weight_kg_each ?? data.boss_weight_kg_each) }
    : {}),
};

// ---------- Watercourse ----------
// UI uses watercourse_price_each + watercourse_weight_kg_each
// Legacy backfill used price_per_piece / weight_kg_per_piece.
// We store BOTH forms so all downstream code is safe.
data.metal.watercourse = {
  ...(data.metal.watercourse || {}),
  ...(data.watercourse_price_each !== undefined
    ? { price_each: Number(data.watercourse_price_each), price_per_piece: Number(data.watercourse_price_each) }
    : {}),
  ...(data.watercourse_piece_cover_mm !== undefined
    ? { effective_cover_mm: Number(data.watercourse_piece_cover_mm) }
    : {}),
  ...((data.watercourse_weight_kg_each ?? data.watercourse_weight_kg) !== undefined
    ? {
        weight_kg_each: Number(data.watercourse_weight_kg_each ?? data.watercourse_weight_kg),
        weight_kg_per_piece: Number(data.watercourse_weight_kg_each ?? data.watercourse_weight_kg),
      }
    : {}),
};

// ✅ Backfill MISC groups from legacy/UI flat keys (so Materials edits affect Summary calculators)
data.breatherMembrane = data.breatherMembrane || {};
data.expandingFoam = data.expandingFoam || {};
data.polytopPins = data.polytopPins || {};
data.aluRollTape = data.aluRollTape || {};

// --- Breather membrane (roll) ---
if (data.breather_roll_price_each !== undefined) {
  data.breatherMembrane.price_per_roll = Number(data.breather_roll_price_each);
}
if (data.breather_roll_weight_kg !== undefined) {
  data.breatherMembrane.weight_kg_per_roll = Number(data.breather_roll_weight_kg);
}
if (data.breather_roll_width_m !== undefined) {
  data.breatherMembrane.roll_width_m = Number(data.breather_roll_width_m);
}
if (data.breather_roll_length_m !== undefined) {
  data.breatherMembrane.roll_length_m = Number(data.breather_roll_length_m);
}
if (data.breather_wastage_pct !== undefined) {
  data.breatherMembrane.wastage_pct = Number(data.breather_wastage_pct);
}

// --- Expanding foam (can) ---
if (data.expanding_foam_can_price_each !== undefined) {
  data.expandingFoam.price_each = Number(data.expanding_foam_can_price_each);
}
if (data.expanding_foam_base_cans_per_roof !== undefined) {
  data.expandingFoam.base_cans_per_roof = Number(data.expanding_foam_base_cans_per_roof);
}
if (data.expanding_foam_extra_cans_area_step_m2 !== undefined) {
  data.expandingFoam.extra_cans_area_step_m2 = Number(data.expanding_foam_extra_cans_area_step_m2);
}

// --- Polytop pins (box) ---
if (data.polytop_pins_price_each !== undefined) {
  data.polytopPins.price_per_box = Number(data.polytop_pins_price_each);
}
if (data.polytop_pins_units_per_box !== undefined) {
  data.polytopPins.units_per_box = Number(data.polytop_pins_units_per_box);
}
if (data.polytop_pins_default_qty_units !== undefined) {
  data.polytopPins.default_qty_units = Number(data.polytop_pins_default_qty_units);
}

// --- Aluminium tape (roll) ---
if (data.aluminium_tape_roll_price_each !== undefined) {
  data.aluRollTape.price_each = Number(data.aluminium_tape_roll_price_each);
}
if (data.aluminium_tape_default_rolls !== undefined) {
  data.aluRollTape.default_rolls = Number(data.aluminium_tape_default_rolls);
}
if (data.aluminium_tape_area_step_m2 !== undefined) {
  data.aluRollTape.area_step_m2 = Number(data.aluminium_tape_area_step_m2);
}

// --- SuperQuilt (IMPORTANT: prices are derived from superquilt_options) ---
if (Array.isArray(data.superquilt_options)) {
  // nothing
} else {
  data.superquilt_options = Array.isArray(defaultMaterials.superquilt_options)
    ? JSON.parse(JSON.stringify(defaultMaterials.superquilt_options))
    : [];
}

const setSQ = (coverage, patch) => {
  const idx = (data.superquilt_options || []).findIndex(
    (o) => Number(o.coverage_m2) === Number(coverage)
  );
  if (idx >= 0) data.superquilt_options[idx] = { ...data.superquilt_options[idx], ...patch };
};

if (data.superquilt_12m2_price_ex_vat !== undefined) {
  setSQ(12, { price_per_roll: Number(data.superquilt_12m2_price_ex_vat) });
}
if (data.superquilt_15m2_price_ex_vat !== undefined) {
  setSQ(15, { price_per_roll: Number(data.superquilt_15m2_price_ex_vat) });
}
if (data.superquilt_roll_weight_kg !== undefined) {
  // apply to both common sizes as a simple rule
  setSQ(12, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
  setSQ(15, { weight_kg_per_roll: Number(data.superquilt_roll_weight_kg) });
}


    // 1) Merge nested groups safely
    const merged = {
      steico:       { ...defaultMaterials.steico,       ...(data.steico       || {}) },
      pse30x90:     { ...defaultMaterials.pse30x90,     ...(data.pse30x90     || {}) },
      ply9mm:       { ...defaultMaterials.ply9mm,       ...(data.ply9mm       || {}) },
      ply18mm:      { ...defaultMaterials.ply18mm,      ...(data.ply18mm      || {}) },
      ply18:        { ...defaultMaterials.ply18,        ...(data.ply18        || {}) },
      joistHanger:  { ...defaultMaterials.joistHanger,  ...(data.joistHanger  || {}) },
      ringBeam:     { ...defaultMaterials.ringBeam,     ...(data.ringBeam     || {}) },
      lath25x50:    { ...defaultMaterials.lath25x50,    ...(data.lath25x50    || {}) },
      lathFinish:   { ...defaultMaterials.lathFinish,   ...(data.lathFinish   || {}) },
      pir50:        { ...defaultMaterials.pir50,        ...(data.pir50        || {}) },
      pir100:       { ...defaultMaterials.pir100,       ...(data.pir100       || {}) },

      // Britmet groups
      britmetShingle:     { ...defaultMaterials.britmetShingle,     ...(data.britmetShingle     || {}) },
      eavesGuard:         { ...defaultMaterials.eavesGuard,         ...(data.eavesGuard         || {}) },
      vergeTrim2Part:     { ...defaultMaterials.vergeTrim2Part,     ...(data.vergeTrim2Part     || {}) },
      chamferLath:        { ...defaultMaterials.chamferLath,        ...(data.chamferLath        || {}) },
      fixingsPackBritmet: { ...defaultMaterials.fixingsPackBritmet, ...(data.fixingsPackBritmet || {}) },
      touchUpKitBritmet:  { ...defaultMaterials.touchUpKitBritmet,  ...(data.touchUpKitBritmet  || {}) },
      watercourse:        { ...defaultMaterials.watercourse,        ...(data.watercourse        || {}) },

      // Metal group (nested)
metal: {
  ...(defaultMaterials.metal || {}),
  ...(data.metal || {}),
  tile_starter: {
    ...(defaultMaterials.metal?.tile_starter || {}),
    ...(data.metal?.tile_starter || {}),
  },
  joist_hanger: {
    ...(defaultMaterials.metal?.joist_hanger || {}),
    ...(data.metal?.joist_hanger || {}),
  },
  watercourse: {
    ...(defaultMaterials.metal?.watercourse || {}),
    ...(data.metal?.watercourse || {}),
  },
},


      // Misc / Insulation
      breatherMembrane: { ...defaultMaterials.breatherMembrane, ...(data.breatherMembrane || {}) },
      slab100:          { ...defaultMaterials.slab100,          ...(data.slab100          || {}) },
      slab50:           { ...defaultMaterials.slab50,           ...(data.slab50           || {}) },
      expandingFoam:     { ...defaultMaterials.expandingFoam,     ...(data.expandingFoam     || {}) },
      polytopPins:       { ...defaultMaterials.polytopPins,       ...(data.polytopPins       || {}) },
      aluRollTape:       { ...defaultMaterials.aluRollTape,       ...(data.aluRollTape       || {}) },
      rafterEavesScrews: { ...defaultMaterials.rafterEavesScrews, ...(data.rafterEavesScrews || {}) },
      lathFixings:       { ...defaultMaterials.lathFixings,       ...(data.lathFixings       || {}) },
      tileFixings:       { ...defaultMaterials.tileFixings,       ...(data.tileFixings       || {}) },


      // SuperQuilt options & settings
      superquilt_options:            Array.isArray(data.superquilt_options) && data.superquilt_options.length
                                       ? data.superquilt_options : defaultMaterials.superquilt_options,
      superquilt_wastage_pct:        data.superquilt_wastage_pct ?? defaultMaterials.superquilt_wastage_pct,
      superquilt_overlap_mm:         data.superquilt_overlap_mm ?? defaultMaterials.superquilt_overlap_mm,
      superquilt_half_roll_window_m2:data.superquilt_half_roll_window_m2 ?? defaultMaterials.superquilt_half_roll_window_m2,

      include_rafters_pir_cradle_in_rafters:
        (data.include_rafters_pir_cradle_in_rafters !== undefined
          ? data.include_rafters_pir_cradle_in_rafters
          : defaultMaterials.include_rafters_pir_cradle_in_rafters),
      pir50_cradle_weight_multiplier:
  (data.pir50_cradle_weight_multiplier !== undefined
    ? Number(data.pir50_cradle_weight_multiplier)
    : Number(defaultMaterials.pir50_cradle_weight_multiplier ?? 1)),
      overheads:    { ...defaultMaterials.overheads,    ...(data.overheads    || {}) },
    };
    // Helpers to pick 12/15m² SuperQuilt options
    const SQ12 = (merged.superquilt_options || []).find(o => Number(o.coverage_m2) === 12);
    const SQ15 = (merged.superquilt_options || []).find(o => Number(o.coverage_m2) === 15);
    const sqBaseline = SQ12 || SQ15 || {};

    // 2) Flat compatibility keys (including SuperQuilt from options)
    const flat = {
      steico220_per_m: merged.steico.price_per_m,
      ply9_per_m2: merged.ply9mm.price_per_m2,
      ply18_per_m2: merged.ply18mm.price_per_m2,
      ringbeam_pse90x30_per_m: merged.ringBeam.timber_price_per_m,
      lath_50x25_per_m: merged.lath25x50.price_per_m,
      lath_25x50_per_m: merged.lathFinish.price_per_m,
     // PIR (flat compatibility keys — many calculators read these)
pir50_per_m2: Number(merged?.pir50?.price_per_m2 ?? 0),
pir50_sheet_price: Number(merged?.pir50?.price_per_sheet ?? 0),
pir50_price_per_sheet: Number(merged?.pir50?.price_per_sheet ?? 0),

pir50_weight_kg_per_m2: Number(merged?.pir50?.weight_kg_per_m2 ?? 0),
pir50_weight_kg_per_sheet: Number(merged?.pir50?.weight_kg_per_sheet ?? 0),

pir100_per_m2: Number(merged?.pir100?.price_per_m2 ?? 0),
pir100_sheet_price: Number(merged?.pir100?.price_per_sheet ?? 0),
pir100_price_per_sheet: Number(merged?.pir100?.price_per_sheet ?? 0),

pir100_weight_kg_per_m2: Number(merged?.pir100?.weight_kg_per_m2 ?? 0),
pir100_weight_kg_per_sheet: Number(merged?.pir100?.weight_kg_per_sheet ?? 0),





// 🔩 METAL (safe) — flat keys derived from merged.metal
tile_starter_price_each: Number(merged.metal?.tile_starter?.price_each ?? 0),
tile_starter_weight_kg_each: Number(merged.metal?.tile_starter?.weight_kg_each ?? 0),

joist_hanger_price_each: Number(merged.metal?.joist_hanger?.price_each ?? 0),
joist_hanger_weight_kg_each: Number(merged.metal?.joist_hanger?.weight_kg_each ?? 0),

joist_hanger_variable_price_each: Number(merged.metal?.joist_hanger_variable?.price_each ?? 0),
joist_hanger_variable_weight_kg_each: Number(merged.metal?.joist_hanger_variable?.weight_kg_each ?? 0),

spar_hook_price_each: Number(merged.metal?.spar_hook?.price_each ?? 0),
spar_hook_weight_kg_each: Number(merged.metal?.spar_hook?.weight_kg_each ?? 0),

jack_rafter_hook_price_each: Number(merged.metal?.jack_rafter_hook?.price_each ?? 0),
jack_rafter_hook_weight_kg_each: Number(merged.metal?.jack_rafter_hook?.weight_kg_each ?? 0),

jack_rafter_bracket_price_each: Number(merged.metal?.jack_rafter_bracket?.price_each ?? 0),
jack_rafter_bracket_weight_kg_each: Number(merged.metal?.jack_rafter_bracket?.weight_kg_each ?? 0),

corner_hanger_price_each: Number(merged.metal?.corner_hanger?.price_each ?? 0),
corner_hanger_weight_kg_each: Number(merged.metal?.corner_hanger?.weight_kg_each ?? 0),

boss_rafter_terminal_price_each: Number(merged.metal?.boss_rafter_terminal?.price_each ?? 0),
boss_rafter_terminal_weight_kg_each: Number(merged.metal?.boss_rafter_terminal?.weight_kg_each ?? 0),

reinforcement_plate_price_each: Number(merged.metal?.reinforcement_plate?.price_each ?? 0),
reinforcement_plate_weight_kg_each: Number(merged.metal?.reinforcement_plate?.weight_kg_each ?? 0),

gable_strap_price_each: Number(merged.metal?.gable_strap?.price_each ?? 0),
gable_strap_weight_kg_each: Number(merged.metal?.gable_strap?.weight_kg_each ?? 0),

// (if you also store watercourse in metal)
watercourse_price_each: Number(merged.metal?.watercourse?.price_per_piece ?? 0),
watercourse_piece_cover_mm: Number(merged.metal?.watercourse?.effective_cover_mm ?? 2950),
watercourse_weight_kg_each: Number(merged.metal?.watercourse?.weight_kg_per_piece ?? 0),




      // Breather membrane (roll)
      breather_roll_width_m:    merged.breatherMembrane.roll_width_m,
      breather_roll_length_m:   merged.breatherMembrane.roll_length_m,
      breather_roll_price_each: merged.breatherMembrane.price_per_roll,
      breather_roll_weight_kg:  merged.breatherMembrane.weight_kg_per_roll,
      breather_wastage_pct:     merged.breatherMembrane.wastage_pct,
// UI-compatible breather keys (Materials page uses these)
breather_membrane_price_each: merged.breatherMembrane.price_per_roll,
breather_membrane_weight_kg_each: merged.breatherMembrane.weight_kg_per_roll,

      // ########## SAFE slab access (prevents getMaterials() crashing) ##########

// 100 mm slab (pack)
slab100_pack_coverage_m2: Number(merged?.slab100?.pack_coverage_m2 ?? 0),
slab100_pack_price_each:  Number(merged?.slab100?.price_per_pack ?? 0),
slab100_pack_weight_kg:   Number(merged?.slab100?.weight_kg_per_pack ?? 0),
slab100_wastage_pct:      Number(merged?.slab100?.wastage_pct ?? 0),

// 50 mm slab (pack)
slab50_pack_coverage_m2:  Number(merged?.slab50?.pack_coverage_m2 ?? 0),
slab50_pack_price_each:   Number(merged?.slab50?.price_per_pack ?? 0),
slab50_pack_weight_kg:    Number(merged?.slab50?.weight_kg_per_pack ?? 0),
slab50_wastage_pct:       Number(merged?.slab50?.wastage_pct ?? 0),

// #########################################################################

      // PIR (derived from nested objects edited in Materials UI)
pir50_per_m2: Number(merged?.pir50?.price_per_m2 ?? 0),
pir100_per_m2: Number(merged?.pir100?.price_per_m2 ?? 0),

pir50_sheet_price: Number(merged?.pir50?.price_per_sheet ?? 0),
pir100_sheet_price: Number(merged?.pir100?.price_per_sheet ?? 0),


      // SuperQuilt (derived from options)
      superquilt_12m2_price_ex_vat: SQ12?.price_per_roll,
      superquilt_15m2_price_ex_vat: SQ15?.price_per_roll,
      superquilt_roll_width_mm:     Math.round((sqBaseline.roll_width_m || 1.2) * 1000),
      superquilt_roll_length_m:     sqBaseline.roll_length_m || 10,
      superquilt_roll_weight_kg:    sqBaseline.weight_kg_per_roll || 7.5,
      superquilt_wastage_pct:       merged.superquilt_wastage_pct,
      superquilt_overlap_mm:        merged.superquilt_overlap_mm,
      superquilt_half_roll_window_m2: merged.superquilt_half_roll_window_m2,
// UI-compatible SuperQuilt keys (Materials page uses these)
superquilt_12m_price_each: SQ12?.price_per_roll,
superquilt_15m_price_each: SQ15?.price_per_roll,
superquilt_12m_weight_kg_each: SQ12?.weight_kg_per_roll,
superquilt_15m_weight_kg_each: SQ15?.weight_kg_per_roll,

      // Toggle
      include_rafters_pir_cradle_in_rafters: merged.include_rafters_pir_cradle_in_rafters,

      // Tiles & accessories (flat)
      tile_britmet_price_each: merged.britmetShingle.price_each,
      tile_britmet_weight_kg: merged.britmetShingle.weight_kg_per_tile,
      tile_britmet_cover_w_mm: merged.britmetShingle.cover_w_mm,

      eaves_guard_price_each: merged.eavesGuard.price_per_piece,
      eaves_guard_piece_cover_mm: merged.eavesGuard.effective_cover_mm,
      eaves_guard_weight_kg: merged.eavesGuard.weight_kg_per_piece,

      verge_trim_price_each: merged.vergeTrim2Part.price_per_piece,
      verge_trim_piece_cover_mm: merged.vergeTrim2Part.effective_cover_mm,
      verge_trim_weight_kg: merged.vergeTrim2Part.weight_kg_per_piece,

      chamfer_lath_price_per_m: merged.chamferLath.price_per_m,
      chamfer_lath_weight_per_m_kg: merged.chamferLath.weight_kg_per_m,

      fixings_pack_britmet_price_each: merged.fixingsPackBritmet.price_each,
      fixings_pack_britmet_weight_kg: merged.fixingsPackBritmet.weight_kg_per_pack,

      touchup_kit_britmet_price_each: merged.touchUpKitBritmet.price_each,
      touchup_kit_britmet_weight_kg: merged.touchUpKitBritmet.weight_kg_per_kit,


      // expose overheads and sensible defaults for others
      consumables_pct: Number(
  merged.overheads?.consumables_pct ??
  defaultMaterials.overheads?.consumables_pct ??
  0
),

      vat_pct: data.vat_pct ?? 20,
      step_round_m: data.step_round_m ?? 0.1,
    };

    // 3) Top-level editable keys
    const canonicalKeys = {
      tile_britmet_price_each:            true,
      tile_britmet_weight_kg:             true,
      tile_britmet_cover_w_mm:            true,

    // Britmet accessories
   britmet_ridge_tile_price_each: true,
   britmet_y_adaptor_price_each: true,
   britmet_5way_adaptor_price_each: true,
   britmet_universal_ridge_adaptor_price_each: true,
   britmet_hip_end_cap_90_price_each: true,
   britmet_hip_end_cap_135_price_each: true,
   britmet_gable_end_cap_price_each: true,
   britmet_vent_strip_price_each: true,

   // LiteSlate (edited in Materials UI)
   liteslate_tile_price_each: true,
   liteslate_ridge_tile_price_each: true,
   liteslate_ridge_hip_adaptor_price_each: true,
   liteslate_hip_end_cap_90_price_each: true,
   liteslate_dry_verge_price_each: true,

   // (if your UI later includes these too)
   liteslate_hip_end_cap_135_price_each: true,
   liteslate_tile_weight_kg_each: true,
   liteslate_dry_verge_weight_kg_each: true,
   liteslate_three_way_adaptor_price: true,
   liteslate_ridge_end_cap_price: true,
   liteslate_dry_verge_2m_price: true,

   // Metal Elements (flat keys edited in Materials UI)
tile_starter_price_each: true,
tile_starter_weight_kg_each: true,

joist_hanger_each: true,
joist_hanger_weight_kg_each: true,

joist_hanger_variable_price_each: true,
joist_hanger_variable_weight_kg_each: true,

spar_hook_price_each: true,
spar_hook_weight_kg_each: true,

jack_rafter_hook_price_each: true,
jack_rafter_hook_weight_kg_each: true,

jack_rafter_bracket_price_each: true,
jack_rafter_bracket_weight_kg_each: true,

corner_hanger_price_each: true,
corner_hanger_weight_kg_each: true,

boss_rafter_terminal_price_each: true,
boss_rafter_terminal_weight_kg_each: true,

reinforcement_plate_price_each: true,
reinforcement_plate_weight_kg_each: true,

gable_strap_price_each: true,
gable_strap_weight_kg_each: true,

// ✅ UI key names used by Materials.js (must be canonical so they persist)
joist_hanger_price_each: true,

variable_joist_hanger_price_each: true,
variable_joist_hanger_weight_kg_each: true,

corner_angle_price_each: true,
corner_angle_weight_kg_each: true,

boss_price_each: true,
boss_weight_kg_each: true,

   ply9_sheet_price: true,
   ply18_sheet_price: true,
   osb18_sheet_price: true,

   // PIR insulation (Materials page)
// PIR boards (edited as nested objects in Materials UI)

pir50: true,
pir100: true,
pir50_cradle_weight_multiplier: true,

   lath19x38_price_per_m: true,
   lath19x38_bar_price: true,

      eaves_guard_piece_cover_mm:         true,
      eaves_guard_price_each:             true,
      eaves_guard_weight_kg:              true,

      verge_trim_piece_cover_mm:          true,
      verge_trim_price_each:              true,
      verge_trim_weight_kg:               true,

      chamfer_lath_price_per_m:           true,
      chamfer_lath_weight_kg_per_m:       true,

      fixings_pack_britmet_price_each:    true,
      fixings_pack_britmet_weight_kg:     true,

      watercourse_piece_cover_mm:         true,
      watercourse_price_each:             true,
      watercourse_weight_kg:              true,

      touchup_kit_britmet_price_each:     true,
      touchup_kit_britmet_weight_kg:      true,

            // 🔹 new plastics keys
      fascia_stock_length_m:              true,
      soffit_stock_length_m:              true,

      fascia_weight_kg_per_m_white:       true,
      fascia_weight_kg_per_m_foiled:      true,

      soffit_weight_kg_per_m_white:       true,
      soffit_weight_kg_per_m_foiled:      true,

      fascia_corner_price_each_white:     true,
      fascia_corner_price_each_foiled:    true,
      fascia_corner_weight_kg_each:       true,

      fascia_joint_price_each_white:      true,
      fascia_joint_price_each_foiled:     true,
      fascia_joint_weight_kg_each:        true,

      fascia_price_per_length_white_mm: true,
      fascia_price_per_length_foiled_mm: true,
      soffit_board_widths_mm: true,
      soffit_price_per_length_white_mm: true,
      soffit_price_per_length_foiled_mm: true,

      // Fascia/soffit accessories (per item)
      fascia_j_section_white_price: true,
      fascia_j_section_foiled_price: true,

      fascia_h_section_white_price: true,
      fascia_h_section_foiled_price: true,

      fascia_corner_90_ext_300_white_price: true,
      fascia_corner_90_ext_300_foiled_price: true,

      fascia_corner_90_double_ext_500_white_price: true,
      fascia_corner_90_double_ext_500_foiled_price: true,

      fascia_corner_int_500_white_price: true,
      fascia_corner_int_500_foiled_price: true,

      fascia_joint_300_white_price: true,
      fascia_joint_300_foiled_price: true,

      fascia_joint_500_white_price: true,
      fascia_joint_500_foiled_price: true,

      fascia_corner_135_300_white_price: true,
      fascia_corner_135_300_foiled_price: true,

      fascia_vent_disc_white_price: true,
      fascia_vent_disc_foiled_price: true,

      plaster_bead_white_price: true,
      plaster_bead_foiled_price: true,

      // Gutters (global)
      gutter_length_m: true,
      gutter_bracket_spacing_mm: true,

      // Gutter square
      gutter_square_length_4m_price: true,
      gutter_square_union_price: true,
      gutter_square_running_outlet_price: true,
      gutter_square_stop_end_outlet_price: true,
      gutter_square_stop_end_price: true,
      gutter_square_corner_90_ext_price: true,
      gutter_square_corner_90_int_price: true,
      gutter_square_corner_135_ext_price: true,
      gutter_square_bracket_price: true,

      // Gutter round
      gutter_round_length_4m_price: true,
      gutter_round_union_price: true,
      gutter_round_running_outlet_price: true,
      gutter_round_stop_end_outlet_price: true,
      gutter_round_stop_end_price: true,
      gutter_round_corner_90_ext_price: true,
      gutter_round_corner_90_int_price: true,
      gutter_round_corner_135_ext_price: true,
      gutter_round_bracket_price: true,

      // Gutter ogee
      gutter_ogee_length_4m_price: true,
      gutter_ogee_union_price: true,
      gutter_ogee_running_outlet_price: true,
      gutter_ogee_stop_end_outlet_price: true,
      gutter_ogee_stop_end_price: true,
      gutter_ogee_corner_90_ext_price: true,
      gutter_ogee_corner_90_int_price: true,
      gutter_ogee_corner_135_ext_price: true,
      gutter_ogee_bracket_price: true,

      // Downpipes
      dp_length_2_5m_price: true,
      dp_adaptor_price: true,
      dp_bend_price: true,
      dp_clip_price: true,
      dp_shoe_price: true,

      // 🔹 J-Section
      j_section_stock_length_m:           true,
      j_section_price_each_white:         true,
      j_section_price_each_foiled:        true,
      j_section_weight_kg_each_white:     true,
      j_section_weight_kg_each_foiled:    true,

// Fixings & Miscellaneous (Materials page keys)
fixings_pack_price_each: true,
fixings_pack_weight_kg_each: true,

superquilt_12m2_price_ex_vat: true,
superquilt_15m2_price_ex_vat: true,
superquilt_roll_weight_kg: true,

breather_roll_price_each: true,
breather_roll_weight_kg: true,
breather_roll_width_m: true,
breather_roll_length_m: true,
breather_wastage_pct: true,

expanding_foam_can_price_each: true,
expanding_foam_can_weight_kg_each: true,
expanding_foam_roll_price_each: true,
expanding_foam_roll_weight_kg_each: true,

aluminium_tape_roll_price_each: true,
aluminium_tape_roll_weight_kg_each: true,

duct_tape_roll_price_each: true,
duct_tape_roll_weight_kg_each: true,

epdm_rubber_price_per_m2: true,
epdm_rubber_weight_kg_per_m2: true,

deck_adhesive_2_5l_price_each: true,
deck_adhesive_2_5l_weight_kg_each: true,

bond_adhesive_2_5l_price_each: true,
bond_adhesive_2_5l_weight_kg_each: true,

bond_adhesive_can_price_each: true,
bond_adhesive_can_weight_kg_each: true,

polytop_pins_price_per_box: true,
polytop_pins_weight_kg_per_box: true,

screws_1x8_price_per_box: true,
screws_1x8_weight_kg_per_box: true,

screws_2x8_price_per_box: true,
screws_2x8_weight_kg_per_box: true,

screws_3x10_price_per_box: true,
screws_3x10_weight_kg_per_box: true,

drywall_screws_32mm_price_per_box: true,
drywall_screws_32mm_weight_kg_per_box: true,

drywall_screws_50mm_price_per_box: true,
drywall_screws_50mm_weight_kg_per_box: true,

concrete_screws_price_per_box: true,
concrete_screws_weight_kg_per_box: true,
// Materials UI keys (must be persisted)
breather_membrane_price_each: true,
breather_membrane_weight_kg_each: true,

superquilt_12m_price_each: true,
superquilt_12m_weight_kg_each: true,
superquilt_15m_price_each: true,
superquilt_15m_weight_kg_each: true,


    };

    const top = {};
for (const k of Object.keys(canonicalKeys)) {
  const fromData = data[k];

  if (Array.isArray(defaultMaterials[k]) || Array.isArray(fromData)) {
    top[k] = Array.isArray(fromData)
      ? fromData
      : (Array.isArray(defaultMaterials[k]) ? defaultMaterials[k] : []);
    continue;
  }

  if (
    typeof defaultMaterials[k] === "object" && defaultMaterials[k] !== null &&
    !Array.isArray(defaultMaterials[k])
  ) {
    top[k] = {
      ...(defaultMaterials[k] || {}),
      ...((fromData && typeof fromData === "object") ? fromData : {}),
    };
    continue;
  }


  top[k] =
    (fromData !== undefined ? fromData : undefined) ??
    (flat[k] !== undefined ? flat[k] : undefined) ??
    (defaultMaterials[k] !== undefined ? defaultMaterials[k] : undefined);
}


    // 4) Aliases for backwards compatibility
    // ✅ Ensure top-level pricing knobs always exist (Materials UI + pricing calc rely on these)
top.delivery_flat = Number.isFinite(Number(data.delivery_flat))
  ? Number(data.delivery_flat)
  : Number(defaultMaterials.delivery_flat ?? 0);

top.profit_pct = Number.isFinite(Number(data.profit_pct))
  ? Number(data.profit_pct)
  : Number(defaultMaterials.profit_pct ?? 0);

// vat_rate may be stored either as 0.2 or via vat_pct (20). Keep both in sync.
const _vatRate =
  (Number.isFinite(Number(data.vat_rate)) ? Number(data.vat_rate) : undefined) ??
  (Number.isFinite(Number(data.vat_pct)) ? Number(data.vat_pct) / 100 : undefined) ??
  Number(defaultMaterials.vat_rate ?? 0.2);

top.vat_rate = _vatRate;
top.vat_pct = Number.isFinite(Number(data.vat_pct))
  ? Number(data.vat_pct)
  : Math.round(_vatRate * 100);
  // ✅ Ensure top-level gutter/downpipe ITEM weights always exist (Summary relies on these)
const ensureNum = (k, fallback = 0) => {
  const v = Number(data?.[k]);
  top[k] = Number.isFinite(v) ? v : Number(defaultMaterials?.[k] ?? fallback);
};

ensureNum("gutter_length_weight_kg", 2.6);      // 4.0m length (legacy key)
ensureNum("gutter_union_weight_kg", 0.2);
ensureNum("gutter_bracket_weight_kg", 0.02);
ensureNum("gutter_outlet_weight_kg", 0.3);
ensureNum("gutter_stop_end_weight_kg", 0.05);

ensureNum("downpipe_length_weight_kg", 2.5);    // 2.5m piece (legacy key)
ensureNum("downpipe_bend_weight_kg", 0.05);
ensureNum("downpipe_shoe_weight_kg", 0.05);
ensureNum("downpipe_clip_weight_kg", 0.02);
ensureNum("downpipe_adaptor_weight_kg", 0.05);

// Aliases you might be editing in the UI (keep them in sync / always present)
ensureNum("dp_length_weight_kg_each", top.downpipe_length_weight_kg);

// ✅ Ensure gutter kg/m keys always exist (Summary weight calc relies on these)
top.gutter_square_weight_kg_per_m = Number.isFinite(Number(data.gutter_square_weight_kg_per_m))
  ? Number(data.gutter_square_weight_kg_per_m)
  : Number(defaultMaterials.gutter_square_weight_kg_per_m ?? 0);

top.gutter_round_weight_kg_per_m = Number.isFinite(Number(data.gutter_round_weight_kg_per_m))
  ? Number(data.gutter_round_weight_kg_per_m)
  : Number(defaultMaterials.gutter_round_weight_kg_per_m ?? 0);

top.gutter_ogee_weight_kg_per_m = Number.isFinite(Number(data.gutter_ogee_weight_kg_per_m))
  ? Number(data.gutter_ogee_weight_kg_per_m)
  : Number(defaultMaterials.gutter_ogee_weight_kg_per_m ?? 0);

top.downpipe_weight_kg_per_m = Number.isFinite(Number(data.downpipe_weight_kg_per_m))
  ? Number(data.downpipe_weight_kg_per_m)
  : Number(defaultMaterials.downpipe_weight_kg_per_m ?? 0);
// -------------------------------------------------
// ✅ PIR / INSULATION ALIASES (m²-based)
// -------------------------------------------------

const ensureNumOr = (value, fallback) =>
  Number.isFinite(Number(value)) ? Number(value) : Number(fallback ?? 0);

// ---- 100mm PIR ----
// Prefer explicit pir100 values (old projects),
// otherwise derive from slab100 (current insulation config)

top.pir100_pack_coverage_m2 =
  ensureNumOr(
    data?.pir100_pack_coverage_m2,
    defaultMaterials?.pir100_pack_coverage_m2 ??
      defaultMaterials?.slab100?.pack_coverage_m2
  );

top.pir100_price_per_pack =
  ensureNumOr(
    data?.pir100_price_per_pack,
    defaultMaterials?.pir100_price_per_pack ??
      defaultMaterials?.slab100?.price_per_pack
  );

top.pir100_weight_kg_per_pack =
  ensureNumOr(
    data?.pir100_weight_kg_per_pack,
    defaultMaterials?.pir100_weight_kg_per_pack ??
      defaultMaterials?.slab100?.weight_kg_per_pack
  );

// Derived (used by Summary for m² scaling)
top.pir100_weight_kg_per_m2 =
  top.pir100_pack_coverage_m2 > 0
    ? Number(
        (top.pir100_weight_kg_per_pack / top.pir100_pack_coverage_m2).toFixed(3)
      )
    : 0;


// ---- 50mm PIR ----
// Same pattern, using slab50 as the source of truth

top.pir50_pack_coverage_m2 =
  ensureNumOr(
    data?.pir50_pack_coverage_m2,
    defaultMaterials?.pir50_pack_coverage_m2 ??
      defaultMaterials?.slab50?.pack_coverage_m2
  );

top.pir50_price_per_pack =
  ensureNumOr(
    data?.pir50_price_per_pack,
    defaultMaterials?.pir50_price_per_pack ??
      defaultMaterials?.slab50?.price_per_pack
  );

top.pir50_weight_kg_per_pack =
  ensureNumOr(
    data?.pir50_weight_kg_per_pack,
    defaultMaterials?.pir50_weight_kg_per_pack ??
      defaultMaterials?.slab50?.weight_kg_per_pack
  );

top.pir50_weight_kg_per_m2 =
  top.pir50_pack_coverage_m2 > 0
    ? Number(
        (top.pir50_weight_kg_per_pack / top.pir50_pack_coverage_m2).toFixed(3)
      )
    : 0;

const aliases = {
  tile_britmet_weight_kg_each:         top.tile_britmet_weight_kg,
  eaves_guard_weight_kg_each:          top.eaves_guard_weight_kg,
  verge_trim_weight_kg_each:           top.verge_trim_weight_kg,
  chamfer_lath_weight_per_m_kg:        top.chamfer_lath_weight_kg_per_m,
  fixings_pack_britmet_weight_kg_each: top.fixings_pack_britmet_weight_kg,
  watercourse_weight_kg_each:          top.watercourse_weight_kg,
  touch_up_kit_price_each:             top.touchup_kit_britmet_price_each,
  touch_up_kit_weight_kg_each:         top.touchup_kit_britmet_weight_kg,

  j_section_price_each_white:  top.fascia_j_section_white_price ?? top.j_section_price_each_white,
  j_section_price_each_foiled: top.fascia_j_section_foiled_price ?? top.j_section_price_each_foiled,



  // If your Summary expects a single “corner” price, pick the most common one as a fallback
  fascia_corner_price_each_white: top.fascia_corner_90_ext_300_white_price ?? top.fascia_corner_price_each_white,
  fascia_corner_price_each_foiled: top.fascia_corner_90_ext_300_foiled_price ?? top.fascia_corner_price_each_foiled,
    };

  // ########## KEEP all saved flat keys from localStorage ##########
// Put data first so any one-off flat keys (e.g. fascia_vent_price_per_m)
// survive, while merged still "normalises" nested groups afterwards.
const out = { ...(data || {}), ...merged, ...flat, ...top, ...aliases };
// ###############################################################
  
// --- Shape normalisation (restore nested groups from flat UI keys) ---
// Materials UI edits many values as flat keys (e.g. joist_hanger_price_each, consumables_pct)
// but other pages (and the Defaults summary) read nested groups (m.joistHanger.price_each, m.overheads.consumables_pct).
// This ensures BOTH representations stay available without refactoring storage.

out.overheads = out.overheads || {};
if (out.overheads.consumables_pct === undefined && out.consumables_pct !== undefined) {
  out.overheads.consumables_pct = Number(out.consumables_pct);
}

// joistHanger nested group expected by some UI/calcs
out.joistHanger = out.joistHanger || {};
if (out.joistHanger.price_each === undefined) {
  const v =
    out.joist_hanger_price_each ??
    out.joist_hanger_each; // legacy alias
  if (v !== undefined) out.joistHanger.price_each = Number(v);
}
if (out.joistHanger.weight_kg_each === undefined && out.joist_hanger_weight_kg_each !== undefined) {
  out.joistHanger.weight_kg_each = Number(out.joist_hanger_weight_kg_each);
}
// ✅ Ensure saved top-level canonical keys always win over defaults/derived values
const canonicalList = Array.isArray(canonicalKeys)
  ? canonicalKeys
  : canonicalKeys instanceof Set
    ? Array.from(canonicalKeys)
    : Object.keys(canonicalKeys || {});

canonicalList.forEach((k) => {
  if (data && data[k] !== undefined) out[k] = data[k];
});
if (typeof window !== "undefined") {
  window.__MATERIALS_DEBUG__ = out;
  window.__MATERIALS_DEBUG_META__ = { PATH: "TRY", ts: Date.now() };
}
return out;

  } catch (e) {
  console.error("getMaterials() FAILED — falling back to defaults", e);

 // ########## DEBUG: record CATCH path + error ##########
  if (typeof window !== "undefined") {
    window.__MATERIALS_DEBUG_META__ = { PATH: "CATCH", ts: Date.now() };
    window.__MATERIALS_DEBUG_ERRS__ = window.__MATERIALS_DEBUG_ERRS__ || [];
    window.__MATERIALS_DEBUG_ERRS__.push({
      ts: Date.now(),
      error: String(e && (e.message || e)),
    });
  }
  // ######################################################
    // Fallback to defaults if parsing fails
    const m = defaultMaterials;
    const merged = m;


    const SQ12 = (m.superquilt_options || []).find(o => Number(o.coverage_m2) === 12);
    const SQ15 = (m.superquilt_options || []).find(o => Number(o.coverage_m2) === 15);
    const sqBaseline = SQ12 || SQ15 || {};

    const flat = {
      steico220_per_m: m.steico.price_per_m,
      ply9_per_m2: m.ply9mm.price_per_m2,
      ply18_per_m2: m.ply18mm.price_per_m2,
      joist_hanger_variable_price_each: Number(m.metal?.joist_hanger_variable?.price_each ?? 0),
      ringbeam_pse90x30_per_m: m.ringBeam.timber_price_per_m,
      lath_50x25_per_m: m.lath25x50.price_per_m,
      lath_25x50_per_m: m.lathFinish.price_per_m,
      // PIR (fallback flat keys)
pir50_per_m2: Number(m?.pir50?.price_per_m2 ?? 0),
pir100_per_m2: Number(m?.pir100?.price_per_m2 ?? 0),

pir50_sheet_price: Number(m?.pir50?.price_per_sheet ?? 0),
pir50_price_per_sheet: Number(m?.pir50?.price_per_sheet ?? 0),

pir100_sheet_price: Number(m?.pir100?.price_per_sheet ?? 0),
pir100_price_per_sheet: Number(m?.pir100?.price_per_sheet ?? 0),


      tile_britmet_price_each: m.britmetShingle.price_each,
      tile_britmet_weight_kg: m.britmetShingle.weight_kg_per_tile,
      tile_britmet_cover_w_mm: m.britmetShingle.cover_w_mm,

      eaves_guard_price_each: m.eavesGuard.price_per_piece,
      eaves_guard_piece_cover_mm: m.eavesGuard.effective_cover_mm,
      eaves_guard_weight_kg: m.eavesGuard.weight_kg_per_piece,

      verge_trim_price_each: m.vergeTrim2Part.price_per_piece,
      verge_trim_piece_cover_mm: m.vergeTrim2Part.effective_cover_mm,
      verge_trim_weight_kg: m.vergeTrim2Part.weight_kg_per_piece,

      chamfer_lath_price_per_m: m.chamferLath.price_per_m,
      chamfer_lath_weight_per_m_kg: m.chamferLath.weight_kg_per_m,

      fixings_pack_britmet_price_each: m.fixingsPackBritmet.price_each,
      fixings_pack_britmet_weight_kg: m.fixingsPackBritmet.weight_kg_per_pack,

      touchup_kit_britmet_price_each: m.touchUpKitBritmet.price_each,
      touchup_kit_britmet_weight_kg: m.touchUpKitBritmet.weight_kg_per_kit,

            // Metal Elements fallback
      tile_starter_price_each: Number(m.metal?.tile_starter?.price_each ?? 0),
      tile_starter_weight_kg_each: Number(m.metal?.tile_starter?.weight_kg_each ?? 0),

      joist_hanger_price_each: Number(m.metal?.joist_hanger?.price_each ?? 0),
      joist_hanger_weight_kg_each: Number(m.metal?.joist_hanger?.weight_kg_each ?? 0),

      watercourse_price_each: Number(m.metal?.watercourse?.price_per_piece ?? 0),
      watercourse_piece_cover_mm: Number(m.metal?.watercourse?.effective_cover_mm ?? 2950),
      watercourse_weight_kg: Number(m.metal?.watercourse?.weight_kg_per_piece ?? 0),
      watercourse_weight_kg_each: Number(m.metal?.watercourse?.weight_kg_per_piece ?? 0),



      // Misc / Insulation (fallback defaults)
      breather_roll_width_m:    m.breatherMembrane.roll_width_m,
      breather_roll_length_m:   m.breatherMembrane.roll_length_m,
      breather_roll_price_each: m.breatherMembrane.price_per_roll,
      breather_roll_weight_kg:  m.breatherMembrane.weight_kg_per_roll,
      breather_wastage_pct:     m.breatherMembrane.wastage_pct,

      slab100_pack_coverage_m2: m.slab100.pack_coverage_m2,
      slab100_pack_price_each:  m.slab100.price_per_pack,
      slab100_pack_weight_kg:   m.slab100.weight_kg_per_pack,
      slab100_wastage_pct:      m.slab100.wastage_pct,

      superquilt_12m2_price_ex_vat: SQ12?.price_per_roll,
      superquilt_15m2_price_ex_vat: SQ15?.price_per_roll,
      superquilt_roll_width_mm:     Math.round((sqBaseline.roll_width_m || 1.2) * 1000),
      superquilt_roll_length_m:     sqBaseline.roll_length_m || 10,
      superquilt_roll_weight_kg:    sqBaseline.weight_kg_per_roll || 7.5,
      superquilt_wastage_pct:       m.superquilt_wastage_pct,
      superquilt_overlap_mm:        m.superquilt_overlap_mm,
      superquilt_half_roll_window_m2: m.superquilt_half_roll_window_m2,

      include_rafters_pir_cradle_in_rafters: m.include_rafters_pir_cradle_in_rafters,

      consumables_pct: Number(m.overheads?.consumables_pct ?? 0),

      vat_pct: 20,
      step_round_m: 0.1,
    };

    const top = {
      tile_britmet_price_each: m.tile_britmet_price_each,
      tile_britmet_weight_kg: m.tile_britmet_weight_kg,
      tile_britmet_cover_w_mm: m.tile_britmet_cover_w_mm,

      eaves_guard_piece_cover_mm: m.eaves_guard_piece_cover_mm,
      eaves_guard_price_each: m.eaves_guard_price_each,
      eaves_guard_weight_kg: m.eaves_guard_weight_kg,

      verge_trim_piece_cover_mm: m.verge_trim_piece_cover_mm,
      verge_trim_price_each: m.verge_trim_price_each,
      verge_trim_weight_kg: m.verge_trim_weight_kg,

      chamfer_lath_price_per_m: m.chamfer_lath_price_per_m,
      chamfer_lath_weight_kg_per_m: m.chamfer_lath_weight_kg_per_m,

      fixings_pack_britmet_price_each: m.fixings_pack_britmet_price_each,
      fixings_pack_britmet_weight_kg: m.fixings_pack_britmet_weight_kg,

      touchup_kit_britmet_price_each: m.touchup_kit_britmet_price_each,
      touchup_kit_britmet_weight_kg: m.touchup_kit_britmet_weight_kg,
    };

    const aliases = {
      tile_britmet_weight_kg_each:          top.tile_britmet_weight_kg,
      eaves_guard_weight_kg_each:           top.eaves_guard_weight_kg,
      verge_trim_weight_kg_each:            top.verge_trim_weight_kg,
      chamfer_lath_weight_per_m_kg:         top.chamfer_lath_weight_kg_per_m,
      fixings_pack_britmet_weight_kg_each:  top.fixings_pack_britmet_weight_kg,
      watercourse_weight_kg_each:           top.watercourse_weight_kg,
      touch_up_kit_price_each:              top.touchup_kit_britmet_price_each,
      touch_up_kit_weight_kg_each:          top.touchup_kit_britmet_weight_kg,
    };

    const out = { ...m, ...flat, ...top, ...aliases };

if (typeof window !== "undefined") {
  window.__MATERIALS_DEBUG__ = out;
}

return out;

  }
}

/** Persist materials back to localStorage. */
export function saveMaterials(m) {
  // Load previous saved snapshot so we don't wipe keys that aren't present in `m`
  let prev = {};
  try {
    const rawPrev = localStorage.getItem(STORAGE_KEY);
    prev = rawPrev ? (JSON.parse(rawPrev) || {}) : {};
  } catch {
    prev = {};
  }

  // Shallow merge first (keeps any keys not supplied by `m`)
  const out = { ...prev, ...(m || {}) };

  // Deep-merge object groups so we don't wipe nested objects either
  const deepMergeKeys = [
    "steico","pse30x90","ply9mm","ply18mm","ply18","joistHanger","ringBeam",
    "lath25x50","lathFinish","pir50","pir100",
    "britmetShingle","eavesGuard","vergeTrim2Part","chamferLath","fixingsPackBritmet",
    "touchUpKitBritmet","watercourse",
    "breatherMembrane","slab100","slab50","expandingFoam","polytopPins","aluRollTape",
    "rafterEavesScrews","lathFixings","tileFixings",
    "metal","overheads",
  ];

  for (const k of deepMergeKeys) {
    if (prev[k] && typeof prev[k] === "object" && !Array.isArray(prev[k]) &&
        out[k] && typeof out[k] === "object" && !Array.isArray(out[k])) {
      out[k] = { ...prev[k], ...out[k] };
    }
  }

  // ---- Keep PIR "flat keys" in sync with nested objects ----
  if (out.pir50 && typeof out.pir50 === "object") {
    const sheet = Number(out.pir50.price_per_sheet ?? 0);
    const perM2  = Number(out.pir50.price_per_m2 ?? 0);
    out.pir50_sheet_price = sheet;
    out.pir50_price_per_sheet = sheet;
    out.pir50_per_m2 = perM2;
  }
  if (out.pir100 && typeof out.pir100 === "object") {
    const sheet = Number(out.pir100.price_per_sheet ?? 0);
    const perM2  = Number(out.pir100.price_per_m2 ?? 0);
    out.pir100_sheet_price = sheet;
    out.pir100_price_per_sheet = sheet;
    out.pir100_per_m2 = perM2;
  }

  // ---- Breather Membrane flat keys ----
  if (out.breather_membrane_price_each !== undefined) {
    out.breather_roll_price_each = Number(out.breather_membrane_price_each);
  }
  if (out.breather_membrane_weight_kg_each !== undefined) {
    out.breather_roll_weight_kg = Number(out.breather_membrane_weight_kg_each);
  }

  // ---- SuperQuilt baseline weight ----
  const sq12w = out.superquilt_12m_weight_kg_each;
  const sq15w = out.superquilt_15m_weight_kg_each;
  if (sq12w !== undefined) out.superquilt_roll_weight_kg = Number(sq12w);
  else if (sq15w !== undefined) out.superquilt_roll_weight_kg = Number(sq15w);

  // ---- Downpipe legacy sync ----
  if (out.dp_length_weight_kg_each !== undefined) {
    out.downpipe_length_weight_kg = Number(out.dp_length_weight_kg_each ?? 0);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(out));

  try {
    window.dispatchEvent(new Event("materials_updated"));
  } catch {}
}

