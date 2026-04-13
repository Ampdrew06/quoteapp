// src/lib/fasciaSoffitCalc.js
import { mm, money, lineTotal, slopeLength } from "./roofMath";

/**
 * Lean-to fascia & soffit calculator
 * - Soffit is the constant (user's requested S). We pick the next stocked board width >= S (or 0 for none).
 * - Fascia height H = K + S * tan(pitch). K is calibrated from your 25°/150→225 baseline.
 * - We round up to full stock lengths: fascia/soffit 5.0 m.
 * - Venting: always charge £/m, and show either "VENT FASCIA — N m" or "VENT DISCS — N pcs".
 * - End fascia (open ends): up the slope, fixed 300 mm board, 5.0 m lengths, no vent charge.
 * - NEW: Fascia 90° corners (2 per exposed end), Fascia straight joints (lengths − 2).
 */
export function computeFasciaSoffitLeanTo(inputs = {}, materials = {}) {
  console.log(
  "FASCIA_CALC received:",
  {
    finish: inputs.finish,
    plastics_finish: inputs.plastics_finish,
    plastics_color: inputs.plastics_color,
    fasciaPricesWhite: materials.fascia_price_per_length_white_mm,
    fasciaPricesFoiled: materials.fascia_price_per_length_foiled_mm
  }
);

  const run_mm = mm(inputs.run_mm); // front/eaves external run
  const pitch_deg = Number(inputs.pitch_deg) || 0;
  const soffit_req_mm = Math.max(0, mm(inputs.soffit_requested_mm || 0)); // requested horizontal soffit

// Raw inputs from Design/Options
const finishRaw =
  inputs.plastics_finish ||   // often just "white"
  inputs.finish ||
  inputs.uPVCColour ||
  "white";

const colourRaw = inputs.plastics_color || inputs.uPVCColour || "";

// Normalise into a simple band: "white" or "foiled"
const finish = (() => {
  const f = String(finishRaw).toLowerCase().trim();
  const c = String(colourRaw).toLowerCase().trim();

  // 1) If finish is explicitly "foiled", trust that
  if (f === "foiled") return "foiled";

  // 2) If colour *looks* white, treat as white band
  if (!c || c === "white" || c === "smooth white" || c === "white grain") {
    return "white";
  }

  // 3) Any non-empty non-white colour → foiled band
  if (c) return "foiled";

  // 4) Fallbacks if colour is empty for some reason
  if (f === "white") return "white";

  return "white";
})();

const vent_method = String(inputs.vent_method || "factory").toLowerCase();




  // 🔹 Visible colour text for labels
  const rawColour =
    inputs.plastics_color ||
    inputs.plasticsColour ||
    (finish === "white" ? "White" : "Foiled");
  const displayColour = String(rawColour).trim();

    // Simple banding: if the visible colour text looks like "white", treat as white band,
  // otherwise treat as foiled (Rosewood, Anthracite, etc.)
  const isWhiteColour =
    /white/i.test(displayColour || "");


  // End/open-end inputs
  const left_exposed  = !!inputs.left_exposed;   // true => open end on the left
  const right_exposed = !!inputs.right_exposed;  // true => open end on the right

  // Slope length from eaves to wallplate (prefer provided slope_mm; else derive from projection + pitch)
  const slope_mm =
    mm(inputs.slope_mm) ||
    slopeLength({ projection_mm: mm(inputs.projection_mm), pitch_deg });

  // --- Constants / defaults (override via materials if present)
  const stockLenFascia_m = Number(materials.fascia_stock_length_m ?? 5);
  const stockLenSoffit_m = Number(materials.soffit_stock_length_m ?? 5);
  const ventPricePerM = Number(materials.fascia_vent_price_per_m ?? 0.50);
  const ventDiscPriceEach = Number(materials.vent_disc_price_each ?? 0.50);
  const ventDiscsPerM = Number(materials.vent_discs_per_m ?? 1);
  const ventRoundMode = String(materials.vent_rounding_mode ?? "ceil"); // "ceil" | "exact"
  // Baseline K from 25° with S=150 → H=225 ⇒ K = 225 - 150*tan(25°)
  const K =
    Number(materials.fascia_k_constant_mm) ||
    (225 - 150 * Math.tan((25 * Math.PI) / 180)); // ≈ 155.05

  // --- Weights (kg) pulled from materials ---
  const fasciaWeightPerM =
    finish === "foiled"
      ? Number(materials.fascia_weight_kg_per_m_foiled ?? 0)
      : Number(materials.fascia_weight_kg_per_m_white ?? 0);

  const soffitWeightPerM =
    finish === "foiled"
      ? Number(materials.soffit_weight_kg_per_m_foiled ?? 0)
      : Number(materials.soffit_weight_kg_per_m_white ?? 0);

  const cornerWeightEach =
    Number(materials.fascia_corner_weight_kg_each ?? 0);
  const jointWeightEach =
    Number(materials.fascia_joint_weight_kg_each ?? 0);

  // Price tables (defaults from your list; can be overridden by object maps in materials)
    const fasciaHeights = [200, 225, 250, 300, 400];
  const fasciaPriceWhite = materials.fascia_price_per_length_white_mm ?? {
    200: 13.41,
    225: 15.95,
    250: 18.42,
    300: 22.57,
    400: 31.33
  };
  const fasciaPriceFoiled = materials.fascia_price_per_length_foiled_mm ?? {
    200: 27.15,
    225: 32.43,
    250: 35.13,
    300: 39.62,
    400: 56.30
  };

  const soffitWidths = (materials.soffit_board_widths_mm ?? [100, 150, 175, 200])
    .slice()
    .sort((a, b) => a - b);

    const soffitPriceWhite = materials.soffit_price_per_length_white_mm ?? {
    100: 8.89, 150: 11.47, 175: 13.59, 200: 13.59
  };
  const soffitPriceFoiled = materials.soffit_price_per_length_foiled_mm ?? {
    100: 18.81, 150: 26.29, 175: 27.19, 200: 29.22
  };

  // Pick the correct price table based on finish band ("white" | "foiled")
  const fasciaPriceTable =
    finish === "foiled" ? fasciaPriceFoiled : fasciaPriceWhite;
  const soffitPriceTable =
    finish === "foiled" ? soffitPriceFoiled : soffitPriceWhite;

  console.log(
  "FASCIA_CALC banding →",
  "finishRaw:", finishRaw,
  "| colourRaw:", colourRaw,
  "| normalisedFinish:", finish,
  "| displayColour:", displayColour,
  "| table:", finish === "foiled" ? "foiled" : "white"
);

  // Helpers
  const pickNext = (arr, minVal) => {
    const a = (arr || []).map(Number).filter(Number.isFinite).sort((x, y) => x - y);
    if (!a.length) return 0;
    for (let i = 0; i < a.length; i++) if (a[i] >= minVal) return a[i];
    return a[a.length - 1]; // cap at max if above range
  };

  // 🔹 Colour-based price multiplier (white is base = 1.0)
  const colourMults = materials.upvc_colour_multipliers || {};
  const finishKey = String(finish).toLowerCase().replace(/\s+/g, "_"); // "golden oak" → "golden_oak"
  const rawMult = Number(colourMults[finishKey]);
  const colourMultiplier =
    Number.isFinite(rawMult) && rawMult > 0 ? rawMult : 1;


  // --- Geometry (eaves fascia height from soffit + pitch)
  const theta = (pitch_deg * Math.PI) / 180;
  const H_calc = K + soffit_req_mm * Math.tan(theta);       // theoretical fascia height (mm)
  const fascia_height_mm =
  Number(inputs?.fascia_height_override_mm ??
  pickNext(fasciaHeights, H_calc));

  // Soffit: pick a single board width >= requested S (no stacking boards on lean-to)
  const soffit_width_mm = soffit_req_mm <= 0 ? 0 : pickNext(soffitWidths, soffit_req_mm);

    // --- Piece counts (round up to full lengths)
  const fascia_lengths = Math.ceil(run_mm / (stockLenFascia_m * 1000)); // 5m
  const soffit_lengths =
    soffit_width_mm > 0 ? Math.ceil(run_mm / (stockLenSoffit_m * 1000)) : 0; // 5m

    // --- Pricing (eaves)
  // We *explicitly* pick from white vs foiled tables here, no shared table indirection.
  const fascia_unit_len_price =
    finish === "foiled"
      ? Number(
          (fasciaPriceFoiled && fasciaPriceFoiled[fascia_height_mm]) ??
            0
        )
      : Number(
          (fasciaPriceWhite && fasciaPriceWhite[fascia_height_mm]) ??
            0
        );

  const soffit_unit_len_price =
    soffit_width_mm > 0
      ? (
          finish === "foiled"
            ? Number(
                (soffitPriceFoiled &&
                  soffitPriceFoiled[soffit_width_mm]) ??
                  0
              )
            : Number(
                (soffitPriceWhite &&
                  soffitPriceWhite[soffit_width_mm]) ??
                  0
              )
        )
      : 0;

  const fascia_line = lineTotal(fascia_lengths, fascia_unit_len_price);
  const soffit_line = lineTotal(soffit_lengths, soffit_unit_len_price);

  console.log(
    "FASCIA_CALC pricing →",
    "finish:", finish,
    "| fascia_height_mm:", fascia_height_mm,
    "| fascia_lengths:", fascia_lengths,
    "| fascia_unit_len_price:", fascia_unit_len_price,
    "| fascia_line:", fascia_line
  );


  // Venting: always price; show different line depending on method
  const run_m = run_mm / 1000;
  const vent_qty_m = ventRoundMode === "ceil" ? Math.ceil(run_m) : run_m;
  const vent_qty_int = ventRoundMode === "ceil" ? Math.ceil(run_m) : Math.round(run_m); // for discs
  const vent_line =
    vent_method === "discs"
      ? lineTotal(vent_qty_int * ventDiscsPerM, ventDiscPriceEach)
      : lineTotal(vent_qty_m, ventPricePerM);

  const lines = [];

  // Eaves fascia

  // Front run in metres (we pass run_mm in from Summary / LeanToLanding)
  const fasciaRunM = (run_mm || 0) / 1000;

  // Per-bar weight (one 5.0 m length) from kg per metre
  const fasciaBarWeightKg = fasciaWeightPerM * stockLenFascia_m;

  // ✅ Actual plastic on the roof: front run (m) × kg/m
  const fasciaTotalWeightKg = +(fasciaRunM * fasciaWeightPerM).toFixed(2);

  lines.push({
    key: "fascia",
    label: `Fascia board ${fascia_height_mm} mm  — ${displayColour}`,
    qty: fascia_lengths,                               // number of 5.0 m bars to send
    qtyDisplay: `${fascia_lengths} × 5.0 m`,
    unit: fascia_unit_len_price,
    line: fascia_line,

    // still useful if anything wants “per bar”
    weightPerUnitKg: fasciaBarWeightKg,
    weightEachKg: fasciaBarWeightKg,

    // 👇 this is what Summary will now use (meterage based)
    totalWeightKg: fasciaTotalWeightKg,
  });


    // Soffit (if any)
  if (soffit_width_mm > 0) {
    // Front run in metres (same ext run as fascia)
    const soffitRunM = (run_mm || 0) / 1000;

    // Per-bar weight (one 5.0 m length)
    const soffitBarWeightKg = soffitWeightPerM * stockLenSoffit_m;

    // ✅ Actual soffit plastic on the roof: run length × kg/m
    const soffitTotalWeightKg = +(soffitRunM * soffitWeightPerM).toFixed(2);

    lines.push({
      key: "soffit",
      label: `Soffit board ${soffit_width_mm} mm  — ${displayColour}`,
      qty: soffit_lengths,
      qtyDisplay: `${soffit_lengths} × 5.0 m`,
      unit: soffit_unit_len_price,
      line: soffit_line,

      // still useful if anything wants “per bar”
      weightPerUnitKg: soffitBarWeightKg,
      weightEachKg: soffitBarWeightKg,

      // 👇 Summary will now use this (meterage-based)
      totalWeightKg: soffitTotalWeightKg,
    });
  }


  // Venting line
  if (vent_method === "discs") {
    lines.push({
      key: "vent",
      label: `VENT DISCS — ${vent_qty_int * ventDiscsPerM} pcs`,
      qty: vent_qty_int * ventDiscsPerM,
      qtyDisplay: `${vent_qty_int * ventDiscsPerM} pcs`,
      unit: ventDiscPriceEach,
      line: vent_line,
      meta: { showOnMaterials: true }
    });
  } else {
    lines.push({
      key: "vent",
      label: `VENT FASCIA — ${vent_qty_m} m`,
      qty: vent_qty_m,
      qtyDisplay: `${vent_qty_m} m`,
      unit: ventPricePerM,
      line: vent_line,
      meta: { showOnMaterials: true }
    });
  }

  // --- End fascia (up the slope) for open ends (fixed 300 mm board) ---
const end_fascia_height_mm = Number(materials.end_fascia_height_mm ?? 300);

// Explicitly pick from white vs foiled tables, same as eaves fascia
const endFasciaUnit =
  finish === "foiled"
    ? Number(
        (fasciaPriceFoiled && fasciaPriceFoiled[end_fascia_height_mm]) ?? 0
      )
    : Number(
        (fasciaPriceWhite && fasciaPriceWhite[end_fascia_height_mm]) ?? 0
      );

// Lengths needed per exposed end (5.0 m stock)
const endFasciaLenCountPerEnd = Math.ceil(
  slope_mm / (stockLenFascia_m * 1000)
);

// How many exposed ends?
const exposedEnds =
  (left_exposed ? 1 : 0) + (right_exposed ? 1 : 0);

// 🔹 Actual fascia run up the slopes (m)
const endFasciaRunPerEndM = (slope_mm || 0) / 1000;
const endFasciaTotalRunM = exposedEnds * endFasciaRunPerEndM;

// Per-bar weight (one 5.0 m fascia)
const endFasciaBarWeightKg = fasciaWeightPerM * stockLenFascia_m;

// Total plastic on the roof by metre
const endFasciaTotalWeightKg = +(endFasciaTotalRunM * fasciaWeightPerM).toFixed(2);

// Total 5.0 m lengths across all exposed ends
const endFasciaTotalLengths = exposedEnds * endFasciaLenCountPerEnd;

console.log(
  "FASCIA_CALC end fascia →",
  "finish:", finish,
  "| end_fascia_height_mm:", end_fascia_height_mm,
  "| exposedEnds:", exposedEnds,
  "| endFasciaUnit:", endFasciaUnit,
  "| endFasciaTotalLengths:", endFasciaTotalLengths
);

if (endFasciaTotalLengths > 0) {
  lines.push({
    key: "end_fascia",
    label: `End fascia ${end_fascia_height_mm} mm  — ${displayColour}`,
    qty: endFasciaTotalLengths,
    qtyDisplay: `${endFasciaTotalLengths} × 5.0 m`,
    unit: endFasciaUnit,
    line: lineTotal(endFasciaTotalLengths, endFasciaUnit),

    weightPerUnitKg: endFasciaBarWeightKg,
    weightEachKg: endFasciaBarWeightKg,
    totalWeightKg: endFasciaTotalWeightKg,
  });
}

  // --- Fascia accessories (lean-to) ---
  // Corners: 2 per exposed end (supply enough to "box" the end neatly)
  const corners_each = (left_exposed ? 2 : 0) + (right_exposed ? 2 : 0);
  // Straight joints on the front eaves run: one joint for each extra fascia length beyond the first
const joints_each = Math.max(0, fascia_lengths - 1);

  const cornerUnit =
    finish === "foiled"
      ? Number(materials.fascia_corner_price_each_foiled ?? materials.fascia_corner_price_each ?? 0)
      : Number(materials.fascia_corner_price_each_white ?? materials.fascia_corner_price_each ?? 0);

  const jointUnit =
    finish === "foiled"
      ? Number(materials.fascia_joint_price_each_foiled ?? materials.fascia_joint_price_each ?? 0)
      : Number(materials.fascia_joint_price_each_white ?? materials.fascia_joint_price_each ?? 0);

    if (corners_each > 0) {
    lines.push({
      key: "fascia_corners",
      label: `Fascia 90° corners — ${displayColour}`,
      qty: corners_each,
      qtyDisplay: `${corners_each} Ea`,
      unit: cornerUnit,
      line: lineTotal(corners_each, cornerUnit),

      weightPerUnitKg: cornerWeightEach,
      weightEachKg: cornerWeightEach,
    });
  }

    if (joints_each > 0) {
    lines.push({
      key: "fascia_joints",
      label: `Fascia straight joints — ${displayColour}`,
      qty: joints_each,
      qtyDisplay: `${joints_each} Ea`,
      unit: jointUnit,
      line: lineTotal(joints_each, jointUnit),

      weightPerUnitKg: jointWeightEach,
      weightEachKg: jointWeightEach,
    });
  }

  // Grand total (sum all lines)
  const grand = money(lines.reduce((s, r) => s + Number(r.line || 0), 0));

  return {
    meta: {
      finish,
      vent_method,
      stockLenFascia_m,
      stockLenSoffit_m,
      fascia_height_mm,
      soffit_width_mm,
      H_calc_mm: Number(H_calc.toFixed(1)),
      K_mm: Number(K.toFixed(2)),
      slope_mm,
      left_exposed,
      right_exposed,
      end_fascia_height_mm,
      corners_each,
      joints_each
    },
    lines,
    grand
  };
}
