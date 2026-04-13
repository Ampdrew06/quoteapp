// src/lib/guttersCalc.js
import { mm, money, lineTotal } from "./roofMath";

/**
 * Lean-to gutters (front eaves only) + simple downpipes per outlet.
 *
 * - Lengths are 4.0 m (rounded up).
 * - Brackets at spacing (default 800 mm) + 2 per union (one either side).
 * - Unions = lengths - 1.
 * - Running outlet(s): 'left' | 'right' | 'center' | 'both' | 'none'
 * - Stop ends: complement of outlets (e.g., left outlet => 1 stop end on the other end).
 * - Downpipes: one per outlet (except 'none'); each pipe defaults to:
 *      2 × 112° offset bends, 1 × shoe, clips_per_pipe (default 2),
 *      1 × square→round adaptor if profile !== 'round'.
 *
 * Pricing pulls from /materials when present, else falls back to your list defaults.
 * Materials keys (optional, override defaults):
 *   gutter_length_m                       (default 4)
 *   gutter_bracket_spacing_mm             (default 800)
 *   downpipe_length_m                     (default 2.5)
 *   downpipe_clips_per_pipe               (default 2)
 *
 *   gutter_round_length_4m_price          (default 8.43)
 *   gutter_round_union_price              (default 2.03)
 *   gutter_round_bracket_price            (default 0.69)
 *   gutter_round_running_outlet_price     (default 2.64)
 *   gutter_round_stop_end_price           (default 1.42)
 *
 *   gutter_square_* (same defaults as round)
 *   gutter_ogee_length_4m_price           (default 14.65)
 *   gutter_ogee_union_price               (default 3.52)
 *   gutter_ogee_bracket_price             (default 1.03)
 *   gutter_ogee_running_outlet_price      (default 4.32)
 *   gutter_ogee_stop_end_price            (default 2.17)
 *
 *   downpipe_length_price                 (default 6.25)   // per 2.5 m length
 *   downpipe_bend_112_price               (default 1.80)
 *   downpipe_shoe_price                   (default 2.02)
 *   downpipe_clip_price                   (default 0.59)
 *   sq_to_round_adaptor_price             (default 2.66)
 */
export function computeGuttersLeanTo(inputs = {}, materials = {}) {
  const run_mm  = mm(inputs.run_mm);
  const profile = String(inputs.profile || "square").toLowerCase(); // 'round' | 'square' | 'ogee'
  const outlet  = String(inputs.outlet  || "left").toLowerCase();   // 'left' | 'right' | 'center' | 'both' | 'none'
  const color   = String(inputs.color   || "black").toLowerCase();  // cosmetic only (doesn't change price)

  const length_m          = Number(materials.gutter_length_m ?? 4);
  const bracket_spacing_mm= Number(materials.gutter_bracket_spacing_mm ?? 800);

  // ------ counts (gutters) ------
  const lengths = Math.max(0, Math.ceil(run_mm / (length_m * 1000)));
  const unions  = Math.max(0, lengths - 1);

  // outlets/stop ends
  let outlets = 0, stopEnds = 0;
  if (outlet === "left" || outlet === "right") { outlets = 1; stopEnds = 1; }
  else if (outlet === "center")                 { outlets = 1; stopEnds = 2; }
  else if (outlet === "both")                   { outlets = 2; stopEnds = 0; }
  else                                          { outlets = 0; stopEnds = 2; } // 'none'

  // brackets: every spacing + one at start, plus 2 per union (either side of join)
  const baseBrackets = run_mm > 0 ? Math.ceil(run_mm / Math.max(1, bracket_spacing_mm)) + 1 : 0;
  const brackets     = baseBrackets + unions * 2;

  // ------ counts (downpipes, per outlet) ------
  const pipes             = outlets;                 // 1 per outlet
  const bends             = pipes * 2;               // two 112° bends per pipe
  const shoes             = pipes * 1;               // 1 shoe per pipe
  const clipsPerPipe      = Number(materials.downpipe_clips_per_pipe ?? 2);
  const clips             = pipes * clipsPerPipe;
  const adaptors          = (profile === "round") ? 0 : pipes; // square→round needed unless round gutter
  const downpipeLen_m     = Number(materials.downpipe_length_m ?? 2.5);

  // ------ pricing helpers ------
  const defaults = {
    round:  { len: 8.43, union: 2.03, brkt: 0.69, outlet: 2.64, stop: 1.42 },
    square: { len: 8.43, union: 2.03, brkt: 0.69, outlet: 2.64, stop: 1.42 },
    ogee:   { len:14.65, union: 3.52, brkt: 1.03, outlet: 4.32, stop: 2.17 },
  };
  const def = defaults[profile] || defaults.square;

  const P = (k, fallback) => Number(materials[k] ?? fallback ?? 0);
  const K = (suffix) => `gutter_${profile}_${suffix}`;
  // --- weight defaults (kg per item) ---
// Used ONLY if Materials page does not provide a value
const weightDefaults = {
  square: {
    len: 2.6,        // 4.0 m gutter length
    union: 0.2,
    bracket: 0.02,
    outlet: 0.3,
    stop: 0.05,
    pipeLen: 1.6,    // 2.5 m downpipe
    bend: 0.05,
    shoe: 0.05,
    clip: 0.02,
    adapt: 0.05,
  },

  round: {
    len: 2.6,
    union: 0.2,
    bracket: 0.02,
    outlet: 0.3,
    stop: 0.05,
    pipeLen: 1.6,
    bend: 0.05,
    shoe: 0.05,
    clip: 0.02,
    adapt: 0.05,
  },

  ogee: {
    len: 2.9,       // ogee slightly heavier
    union: 0.25,
    bracket: 0.025,
    outlet: 0.35,
    stop: 0.06,
    pipeLen: 1.8,
    bend: 0.06,
    shoe: 0.06,
    clip: 0.025,
    adapt: 0.05,
  },
};

// Pick defaults by gutter profile
const defW = weightDefaults[profile] || weightDefaults.square;

// Helper: prefer Materials page value, else fallback
const W = (k, fallback) => {
  const v = materials[k];
  return typeof v === "number" ? v : fallback;
};

// Allow overrides via hidden materials keys if you ever want them
const w_len     = W(K("length_4m_weight_kg"),      defW.len);
const w_union   = W(K("union_weight_kg"),          defW.union);
const w_bracket = W(K("bracket_weight_kg"),        defW.bracket);
const w_outlet  = W(K("running_outlet_weight_kg"), defW.outlet);
const w_stopend = W(K("stop_end_weight_kg"),       defW.stop);

// Downpipe weights (flat, not profile-specific)
const w_pipeLen = W("downpipe_length_weight_kg",   defW.pipeLen);
const w_bend    = W("downpipe_bend_weight_kg",     defW.bend);
const w_shoe    = W("downpipe_shoe_weight_kg",     defW.shoe);
const w_clip    = W("downpipe_clip_weight_kg",     defW.clip);
const w_adapt   = W("downpipe_adaptor_weight_kg",  defW.adapt);

// --- total weight for gutter length based on actual metreage ---
// w_len is the weight of ONE 4.0 m bar.
// Convert to kg per metre, then multiply by the true front run (length_m).
const gutterWeightPerM = w_len / 4;        // kg per m
const totalGutterWeightKg = +(length_m * gutterWeightPerM).toFixed(2);


  // gutter unit prices (pull from materials, else defaults above)
  const unit_len     = P(K("length_4m_price"),      def.len);
  const unit_union   = P(K("union_price"),          def.union);
  const unit_bracket = P(K("bracket_price"),        def.brkt);
  const unit_outlet  = P(K("running_outlet_price"), def.outlet);
  const unit_stopend = P(K("stop_end_price"),       def.stop);

  // downpipe unit prices (flat, independent of color/profile; you can key by color later if needed)
  const unit_pipeLen = P("downpipe_length_price", 6.25);       // per 2.5 m piece
  const unit_bend    = P("downpipe_bend_112_price", 1.80);
  const unit_shoe    = P("downpipe_shoe_price", 2.02);
  const unit_clip    = P("downpipe_clip_price", 0.59);
  const unit_adapt   = P("sq_to_round_adaptor_price", 2.66);

  // ------ line totals ------
  const lt_len     = lineTotal(lengths, unit_len);
  const lt_union   = lineTotal(unions, unit_union);
  const lt_bracket = lineTotal(brackets, unit_bracket);
  const lt_outlet  = lineTotal(outlets, unit_outlet);
  const lt_stopend = lineTotal(stopEnds, unit_stopend);

  const pipeLengthsPerPipe = 1; // default: 1 × 2.5 m per pipe; expand later if you add a height input
  const pipeLengths = pipes * pipeLengthsPerPipe;

  const lt_pipe    = lineTotal(pipeLengths, unit_pipeLen);
  const lt_bend    = lineTotal(bends, unit_bend);
  const lt_shoe    = lineTotal(shoes, unit_shoe);
  const lt_clip    = lineTotal(clips, unit_clip);
  const lt_adapt   = lineTotal(adaptors, unit_adapt);

// ------ assemble lines ------
const lines = [];

// Metre-based total weight for gutter lengths
const gutterStickLenM = Number(materials.gutter_length_m || 4); // 4.0 m default
const runM = run_mm / 1000;                                     // external run in metres

let gutterLenTotalKg = 0;
if (gutterStickLenM > 0 && w_len > 0 && runM > 0) {
  const kgPerM = w_len / gutterStickLenM;       // e.g. 2.6 / 4 = 0.65 kg/m
  gutterLenTotalKg = +(kgPerM * runM).toFixed(2);
}

if (lengths > 0) {
  lines.push({
    key: "g_len",
    label: `Gutter (${profile}) ${gutterStickLenM.toFixed(1)} m length`,
    qty: lengths,                                    // bars to order
    qtyDisplay: `${lengths} × ${gutterStickLenM.toFixed(1)} m`,
    unit: unit_len,
    line: lt_len,

    // keep per-bar weight if anything else ever uses it
    weight_kg_each: w_len,

    // ✅ metre-based total weight for this roof
    weight_kg: gutterLenTotalKg,
    totalWeightKg: gutterLenTotalKg,
  });
}



if (unions   > 0) lines.push({
  key: "g_union",
  label: `Gutter union (${profile})`,
  qty: unions,
  unit: unit_union,
  line: lt_union,
  weight_kg_each: w_union,
});

if (brackets > 0) lines.push({
  key: "g_brkt",
  label: `Gutter bracket (${profile})`,
  qty: brackets,
  unit: unit_bracket,
  line: lt_bracket,
  weight_kg_each: w_bracket,
});

if (outlets  > 0) lines.push({
  key: "g_outlet",
  label: `Running outlet (${profile})`,
  qty: outlets,
  unit: unit_outlet,
  line: lt_outlet,
  weight_kg_each: w_outlet,
});

if (stopEnds > 0) lines.push({
  key: "g_stop",
  label: `Stop end (${profile})`,
  qty: stopEnds,
  unit: unit_stopend,
  line: lt_stopend,
  weight_kg_each: w_stopend,
});

if (pipeLengths > 0) lines.push({
  key: "dp_len",
  label: `Downpipe length ${downpipeLen_m.toFixed(1)} m`,
  qty: pipeLengths,
  unit: unit_pipeLen,
  line: lt_pipe,
  weight_kg_each: w_pipeLen,
});

if (bends > 0) lines.push({
  key: "dp_bend",
  label: `112° offset bend (downpipe)`,
  qty: bends,
  unit: unit_bend,
  line: lt_bend,
  weight_kg_each: w_bend,
});

if (shoes > 0) lines.push({
  key: "dp_shoe",
  label: `Downpipe shoe`,
  qty: shoes,
  unit: unit_shoe,
  line: lt_shoe,
  weight_kg_each: w_shoe,
});

if (clips > 0) lines.push({
  key: "dp_clip",
  label: `Downpipe clip`,
  qty: clips,
  unit: unit_clip,
  line: lt_clip,
  weight_kg_each: w_clip,
});

if (adaptors > 0) lines.push({
  key: "dp_adapt",
  label: `Square→Round adaptor`,
  qty: adaptors,
  unit: unit_adapt,
  line: lt_adapt,
  weight_kg_each: w_adapt,
});


  const grand = money(lt_len + lt_union + lt_bracket + lt_outlet + lt_stopend + lt_pipe + lt_bend + lt_shoe + lt_clip + lt_adapt);

  return {
    meta: {
      profile, outlet, color,
      length_m, bracket_spacing_mm,
      downpipeLen_m: downpipeLen_m,
      clipsPerPipe,
      counts: { lengths, unions, brackets, outlets, stopEnds, pipes, pipeLengths, bends, shoes, clips, adaptors },
    },
    lines,
    grand,
  };
}
