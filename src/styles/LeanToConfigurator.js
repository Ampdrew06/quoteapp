import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMaterials } from "../../lib/materials";

/**
 * Timberlite — Lean-To Configurator (internal→external)
 *
 * External width/projection are derived from internal inputs:
 *  - extWidth = intWidth + 2 × (side frame thickness + fascia lip)
 *  - extProjection = intProjection + soffit + frame-on
 *
 * Geometry (side view):
 *  - A (underside): R_under = intProjection − t_wp − t_h;  A = R_under / cosθ
 *  - B (top-edge):  R_top   = extProjection;               B = R_top / cosθ
 *  - C = 39 mm (9 ply + 30 PSE at eaves underside)
 *  - D (shown) = TOP of rafter @ wall using TOP run (outer reference):
 *        D = C + d·cosθ + R_top·tanθ
 *    Also available (not shown): inner ref = D + frame_on·tanθ
 *
 * Rafters across run (width):
 *  - left edge rafter at 0–48
 *  - second at centre 685 mm
 *  - then 665 mm centres
 *  - ALWAYS a right-edge rafter at width−48 → width (final bay ≤ 665 mm)
 */

// ---------------- helpers ----------------
const toNum = (v, fallback = 0) => {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const degToRad = (deg) => (deg * Math.PI) / 180;
const round = (v, dp = 2) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};
const roundUpToStep = (value, step) => {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
};
const mm = (m) => Number(m ?? 0);

// Prices: support BOTH shapes (flattened or grouped)
function useMaterialPrices() {
  const m = getMaterials?.() || {};
  return {
    steico220_per_m: Number(m.steico220_per_m ?? m.steico?.price_per_m ?? 6.4),
    ply9_per_m2: Number(m.ply9_per_m2 ?? m.ply9?.price_per_m2 ?? 5.4),
    ply18_per_m2: Number(m.ply18_per_m2 ?? m.ply18?.price_per_m2 ?? 8.16),
    joist_hanger_each: Number(m.joist_hanger_each ?? m.joistHanger?.price_each ?? 0.49),
    ringbeam_pse90x30_per_m: Number(m.ringbeam_pse90x30_per_m ?? m.ringBeam?.timber_price_per_m ?? 1.28),
    lath_50x25_per_m: Number(m.lath_50x25_per_m ?? m.lath25x50?.price_per_m ?? 0.62),
    lath_25x50_per_m: Number(m.lath_25x50_per_m ?? m.lathFinish?.price_per_m ?? 0.62),
    pir50_per_m2: Number(m.pir50_per_m2 ?? m.pir50?.price_per_m2 ?? 5.65),
    // 100 mm PIR pricing
    pir100_per_m2: Number(m.pir100_per_m2 ?? m.pir100?.price_per_m2 ?? 9.67),
    pir100_sheet_price: Number(m.pir100_sheet_price ?? m.pir100?.price_per_sheet ?? 27.84),
    consumables_pct: Number(m.consumables_pct ?? m.overheads?.consumables_pct ?? 0),
    vat_pct: Number(m.vat_pct ?? 20),
    step_round_m: Number(m.step_round_m ?? 0.1),
  };
}

// ---------------- rafter slotting ----------------
function computeRafterSlots(widthMM) {
  const slots = [];
  const slotWidth = 48; // mm (for 45 mm rafters)
  const half = slotWidth / 2;
  const W = Math.max(0, Number(widthMM) || 0);

  // Degenerate: width smaller than one slot
  if (W < slotWidth) {
    if (W <= 0) return { slots: [], extraSpaceMM: 0 };
    const left = Math.max(0, (W - slotWidth) / 2);
    slots.push({ left, right: left + slotWidth, centre: left + half, type: "edge-start" });
    return { slots, extraSpaceMM: 0 };
  }

  // Left edge rafter
  slots.push({ left: 0, right: slotWidth, centre: half, type: "edge-start" });

  // Interior rafters: second centre 685 mm, then 665 mm centres
  const secondCentre = 685;
  const step = 665;
  if (secondCentre + half <= W) {
    slots.push({ left: secondCentre - half, right: secondCentre + half, centre: secondCentre, type: "centre" });
    for (let c = secondCentre + step; c + half <= W; c += step) {
      slots.push({ left: c - half, right: c + half, centre: c, type: "centre" });
    }
  }

  // Right edge rafter (always) -> ensures last bay ≤ 665 mm
  const rightLeft = W - slotWidth;
  slots.push({ left: rightLeft, right: W, centre: W - half, type: "edge-end" });

  // We always occupy the right edge, so no spare end space
  return { slots, extraSpaceMM: 0 };
}

// ---------------- BOM calcs ----------------
function computeWallplateBOM({ extWidthMM }, prices, stepRoundM) {
  const L_m = mm(extWidthMM) / 1000;
  const L_m_rounded = roundUpToStep(L_m, stepRoundM);
  const ply18_area_m2 = L_m * 0.142; // 142 mm high continuous strip
  const approxCentres = 800; // mm
  const stripsCount = Math.max(2, Math.ceil(mm(extWidthMM) / approxCentres) + 1);
  const stripArea_m2 = stripsCount * (0.05 * 0.22); // 50×220 each => 0.011 m²
  const hangerPositions = new Set([0]);
  for (let pos = 665; pos < mm(extWidthMM); pos += 665) hangerPositions.add(pos);
  hangerPositions.add(mm(extWidthMM));
  const hangerCount = hangerPositions.size;
  const exVAT = {
    steico: L_m_rounded * prices.steico220_per_m,
    ply18: ply18_area_m2 * prices.ply18_per_m2,
    ply9_strips: stripArea_m2 * prices.ply9_per_m2,
    hangers: hangerCount * prices.joist_hanger_each,
  };
  const exVAT_total = Object.values(exVAT).reduce((a, b) => a + b, 0);
  return { L_m, L_m_rounded, ply18_area_m2, stripsCount, stripArea_m2, hangerCount, costs: { lines: exVAT, exVAT_total } };
}

function computeFrontRingbeamBOM({ extWidthMM }, prices, rafterSlots) {
  const L_m = mm(extWidthMM) / 1000;
  const soffit9_area_m2 = L_m * 0.220; // 220 mm width
  const lath50x25_m = L_m;
  const pse90x30_m = L_m;
  const rafterCount = rafterSlots.slots.length;
  const upstandCount = Math.max(rafterCount - 1, 0);
  const upstandWidth_m = 0.617;
  const upstandHeight_m = 0.195;
  const upstandAreaPerPiece_m2 = upstandWidth_m * upstandHeight_m;
  const pirHeight_m = 0.185;
  const pirAreaPerPiece_m2 = 2 * upstandWidth_m * pirHeight_m;
  const finishLath25x50_m = upstandCount * upstandWidth_m;
  const exVAT = {
    soffit9: soffit9_area_m2 * prices.ply9_per_m2,
    lath50x25: lath50x25_m * prices.lath_50x25_per_m,
    pse90x30: pse90x30_m * prices.ringbeam_pse90x30_per_m,
    upstand_ply9: upstandCount * upstandAreaPerPiece_m2 * prices.ply9_per_m2,
    pir50: upstandCount * pirAreaPerPiece_m2 * prices.pir50_per_m2,
    lath25x50: finishLath25x50_m * prices.lath_25x50_per_m,
  };
  const exVAT_total = Object.values(exVAT).reduce((a, b) => a + b, 0);
  return {
    L_m,
    soffit9_area_m2,
    lath50x25_m,
    pse90x30_m,
    upstandCount,
    upstandAreaPerPiece_m2,
    pirAreaPerPiece_m2,
    finishLath25x50_m,
    costs: { lines: exVAT, exVAT_total },
  };
}

function computePIRCradleBOM(inputs, rafter, prices) {
  const { includeCradle, cradle_width_mm = 50, cradle_waste_pct = 0 } = inputs || {};
  if (!includeCradle) {
    return {
      faces: 0,
      interiorRafters: 0,
      endRafters: 0,
      length_per_face_m: 0,
      strip_width_m: cradle_width_mm / 1000,
      area_m2: 0,
      area_m2_with_waste: 0,
      costs: { lines: { pir50_cradle: 0 }, exVAT_total: 0 },
    };
  }
  const N = Math.max(rafter?.rafterCount || 0, 0);
  const endRafters = N >= 1 ? 2 : 0;
  const interiorRafters = Math.max(N - 2, 0);
  let faces = 0;
  if (N >= 2) faces = 2 * N - 2; // ends single, interiors double
  else if (N === 1) faces = 1;
  const length_per_face_m = (rafter?.A_mm || 0) / 1000;
  const strip_width_m = cradle_width_mm / 1000;
  const area_m2 = faces * length_per_face_m * strip_width_m;
  const area_m2_with_waste = area_m2 * (1 + (cradle_waste_pct || 0) / 100);
  const pir50_cradle = area_m2_with_waste * prices.pir50_per_m2;
  const exVAT_total = pir50_cradle;
  return {
    faces,
    interiorRafters,
    endRafters,
    length_per_face_m,
    strip_width_m,
    area_m2,
    area_m2_with_waste,
    costs: { lines: { pir50_cradle }, exVAT_total },
  };
}

// 100 mm PIR between rafters (600 wide strips from 1200×2400 slabs)
function computePIR100InfillBOM({ A_mm, slots, optimizeRemainders }, prices) {
  const SHEET_W_MM = 1200;
  const SHEET_L_MM = 2400;
  const STRIP_W_MM = 600; // slit sheet into two
  const SHEET_AREA_M2 = (SHEET_W_MM / 1000) * (SHEET_L_MM / 1000); // 2.88 m²
  const bays = Math.max((slots?.slots?.length || 0) - 1, 0);
  const A = Math.max(0, Number(A_mm) || 0);

  if (bays === 0 || A === 0) {
    return {
      bays,
      A_mm: A,
      strips_total: 0,
      sheets_total: 0,
      area_needed_m2: 0,
      area_from_sheets_m2: 0,
      plan: { fullSegmentsPerBay: 0, remainder_mm: 0, strips_naive: 0, strips_optimized: 0 },
      costs: { lines: { pir100_sheets: 0, pir100_area_val: 0 }, exVAT_total: 0 },
    };
  }

  const fullSegmentsPerBay = Math.floor(A / SHEET_L_MM);
  const remainder_mm = A - fullSegmentsPerBay * SHEET_L_MM;

  // naive: 2.4m strips only (no remainder pairing)
  const strips_naive = bays * Math.ceil(A / SHEET_L_MM);

  // optimized: remainder pieces paired from 2.4m strips
  let strips_optimized = strips_naive;
  if (remainder_mm > 0) {
    const pieces_per_remainder_strip = Math.max(1, Math.floor(SHEET_L_MM / remainder_mm));
    const full_total = bays * fullSegmentsPerBay;
    const remainder_strips = Math.ceil(bays / pieces_per_remainder_strip);
    strips_optimized = full_total + remainder_strips;
  } else {
    strips_optimized = bays * fullSegmentsPerBay;
  }

  const strips_total = optimizeRemainders ? strips_optimized : strips_naive;
  const sheets_total = Math.ceil(strips_total / 2);

  const area_needed_m2 = bays * (A / 1000) * (STRIP_W_MM / 1000);
  const area_from_sheets_m2 = sheets_total * SHEET_AREA_M2;

  const pir100_sheets = sheets_total * prices.pir100_sheet_price;
  const pir100_area_val = area_needed_m2 * prices.pir100_per_m2; // reference (not used for charging)
  const exVAT_total = pir100_sheets;

  return {
    bays,
    A_mm: A,
    strips_total,
    sheets_total,
    area_needed_m2,
    area_from_sheets_m2,
    plan: {
      fullSegmentsPerBay,
      remainder_mm,
      strips_naive,
      strips_optimized,
    },
    costs: { lines: { pir100_sheets, pir100_area_val }, exVAT_total },
  };
}

// ---------------- geometry & rafters ----------------
function computeRafters(
  { extWidthMM, intProjectionMM, extProjectionMM, pitchDeg, t_wp_mm, t_h_mm, rafter_depth_mm, frame_on_mm = 70 },
  prices,
  stepRoundM
) {
  const θ = degToRad(pitchDeg);
  const cosθ = Math.cos(θ);
  const tanθ = Math.tan(θ);

  // Runs
  const R_under_mm = intProjectionMM - t_wp_mm - t_h_mm; // inner RB face → inside wallplate
  const R_top_mm = extProjectionMM; // outer eaves plumb → wall face

  // Lengths
  const A_mm = R_under_mm / cosθ; // underside rafter
  const B_mm = R_top_mm / cosθ;   // top edge rafter

  // Eaves underside build-up under rafter
  const C_mm = 39;

  // ---- TOP-RUN WALL HEIGHTS ----
  // Height to TOP OF RAFTER @ wall, referenced from OUTER eaves plumb
  const D_wall_from_outer_mm = C_mm + rafter_depth_mm * cosθ + R_top_mm * tanθ;

  // Same height referenced from INNER top of frame (adds vertical of frame_on)
  const D_wall_from_inner_mm = D_wall_from_outer_mm + frame_on_mm * tanθ;

  // Rafter layout + costing
  const layout = computeRafterSlots(mm(extWidthMM));
  const rafterCount = layout.slots.length;
  const totalTopEdge_m = (B_mm / 1000) * rafterCount;
  const totalTopEdge_m_rounded = roundUpToStep(totalTopEdge_m, stepRoundM);
  const exVAT_total = totalTopEdge_m_rounded * prices.steico220_per_m;

  return {
    R_under_mm,
    R_top_mm,
    A_mm,
    B_mm,
    C_mm,
    // Back-compat: D_mm now means TOP of rafter @ wall (outer ref)
    D_mm: D_wall_from_outer_mm,
    D_wall_from_outer_mm,
    D_wall_from_inner_mm,
    plumbCut: { fromVertical_deg: pitchDeg, fromHorizontal_deg: 90 - pitchDeg },
    layout,
    rafterCount,
    totalTopEdge_m,
    totalTopEdge_m_rounded,
    costs: { lines: { steico_top_edge: exVAT_total }, exVAT_total },
  };
}

// ---------------- component ----------------
export default function LeanToConfigurator() {
  const prices = useMaterialPrices();

  // Inputs as strings for easy clearing/typing
  // ---- persisted inputs (with defaults that depend on prices) ----
  const DEFAULT_INPUTS = useMemo(
    () => ({
      internalWidthMM: "3500",
      internalProjectionMM: "3500",
      soffit_mm: "150",
      frame_on_mm: "70",
      side_frame_thickness_mm: "70",
      fascia_lip_mm: "25",
      leftWall: false,
      rightWall: false,
      pitchDeg: "15",
      t_wp_mm: "63",
      t_h_mm: "2",
      rafter_depth_mm: "220",
      includeCradle: true,
      cradle_width_mm: "50",
      cradle_waste_pct: "0",
      includePir100: true,
      optimizePir100Remainders: true,
      // these three come from your materials pricing so we memoize defaults
      step_round_m: String(prices.step_round_m),
      consumables_pct: String(prices.consumables_pct),
      vat_pct: String(prices.vat_pct),
    }),
    [prices.step_round_m, prices.consumables_pct, prices.vat_pct]
  );

  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem("leanToInputs");
      return saved ? { ...DEFAULT_INPUTS, ...JSON.parse(saved) } : DEFAULT_INPUTS;
    } catch {
      return DEFAULT_INPUTS;
    }
  });

  // keep inputs persisted as the user types
  useEffect(() => {
    try {
      localStorage.setItem("leanToInputs", JSON.stringify(inputs));
    } catch {}
  }, [inputs]);


  const onStr = (k) => (e) => setInputs((s) => ({ ...s, [k]: e.target.value }));
  const onToggle = (k) => (e) => setInputs((s) => ({ ...s, [k]: !!e.target.checked }));

  // Build query string for the combined Plan & Manufacture page
 // Build query string for the combined Plan & Manufacture page
const planQs = useMemo(() => {
  const s = new URLSearchParams({
    customerName: "",
    customerRef: "",
    internalWidthMM: String(inputs.internalWidthMM ?? ""),
    internalProjectionMM: String(inputs.internalProjectionMM ?? ""),
    side_frame_thickness_mm: String(inputs.side_frame_thickness_mm ?? ""),
    fascia_lip_mm: String(inputs.fascia_lip_mm ?? ""),
    soffit_mm: String(inputs.soffit_mm ?? ""),
    frame_on_mm: String(inputs.frame_on_mm ?? ""),
    pitchDeg: String(inputs.pitchDeg ?? ""),
    t_wp_mm: String(inputs.t_wp_mm ?? ""),
    t_h_mm: String(inputs.t_h_mm ?? ""),
    rafter_depth_mm: String(inputs.rafter_depth_mm ?? ""),

    // spacing defaults for the sheet
    secondCentre: "685",
    step: "665",
    slotWidth: "48",
    optimizePir100Remainders: "true",

    // Tiles/Laths defaults (Britmet)
    gauge_mm: "250",
    tile_cover_w_mm: "1231",
    eaves_overhang_mm: "50",
  });
  return s.toString();
}, [inputs]);


  // Normalised numeric inputs + derived external dims
  const norm = useMemo(() => {
    const internalWidthMM = toNum(inputs.internalWidthMM);
    const internalProjectionMM = toNum(inputs.internalProjectionMM);
    const soffit_mm = toNum(inputs.soffit_mm, 150);
    const frame_on_mm = toNum(inputs.frame_on_mm, 70);
    const side_frame_thickness_mm = toNum(inputs.side_frame_thickness_mm, 70);
    const fascia_lip_mm = toNum(inputs.fascia_lip_mm, 25);

    const extWidthMM = internalWidthMM + 2 * (side_frame_thickness_mm + fascia_lip_mm);
    const extProjectionMM = internalProjectionMM + soffit_mm + frame_on_mm;

    return {
      internalWidthMM,
      internalProjectionMM,
      extWidthMM,
      soffit_mm,
      frame_on_mm,
      side_frame_thickness_mm,
      fascia_lip_mm,
      leftWall: !!inputs.leftWall,
      rightWall: !!inputs.rightWall,
      extProjectionMM,
      pitchDeg: toNum(inputs.pitchDeg, 15),
      t_wp_mm: toNum(inputs.t_wp_mm, 63),
      t_h_mm: toNum(inputs.t_h_mm, 2),
      rafter_depth_mm: toNum(inputs.rafter_depth_mm, 220),
      includeCradle: inputs.includeCradle,
      cradle_width_mm: toNum(inputs.cradle_width_mm, 50),
      cradle_waste_pct: toNum(inputs.cradle_waste_pct, 0),
      includePir100: !!inputs.includePir100,
      optimizePir100Remainders: !!inputs.optimizePir100Remainders,
      step_round_m: toNum(inputs.step_round_m, prices.step_round_m),
      consumables_pct: toNum(inputs.consumables_pct, prices.consumables_pct),
      vat_pct: toNum(inputs.vat_pct, prices.vat_pct),
    };
  }, [inputs, prices]);

  // Derived calcs
  const rafter = useMemo(
    () =>
      computeRafters(
        {
          extWidthMM: norm.extWidthMM,
          intProjectionMM: norm.internalProjectionMM,
          extProjectionMM: norm.extProjectionMM,
          pitchDeg: norm.pitchDeg,
          t_wp_mm: norm.t_wp_mm,
          t_h_mm: norm.t_h_mm,
          rafter_depth_mm: norm.rafter_depth_mm,
          frame_on_mm: norm.frame_on_mm, // <-- important for inner reference
        },
        prices,
        norm.step_round_m
      ),
    [norm, prices]
  );

  const wallplate = useMemo(
    () => computeWallplateBOM({ extWidthMM: norm.extWidthMM }, prices, norm.step_round_m),
    [norm, prices]
  );
  const frontRingbeam = useMemo(
    () => computeFrontRingbeamBOM({ extWidthMM: norm.extWidthMM }, prices, rafter.layout),
    [norm, prices, rafter.layout]
  );
  const cradle = useMemo(() => computePIRCradleBOM(norm, rafter, prices), [norm, rafter, prices]);

  const pir100 = useMemo(() => {
    if (!norm.includePir100) {
      return {
        bays: 0,
        A_mm: 0,
        strips_total: 0,
        sheets_total: 0,
        area_needed_m2: 0,
        area_from_sheets_m2: 0,
        plan: { fullSegmentsPerBay: 0, remainder_mm: 0, strips_naive: 0, strips_optimized: 0 },
        costs: { lines: { pir100_sheets: 0, pir100_area_val: 0 }, exVAT_total: 0 },
      };
    }
    return computePIR100InfillBOM(
      { A_mm: rafter.A_mm, slots: rafter.layout, optimizeRemainders: norm.optimizePir100Remainders },
      prices
    );
  }, [norm.includePir100, norm.optimizePir100Remainders, rafter, prices]);
// Finished height to top of tiles (defaults: membrane 1 mm + lath 25 mm + tile 15 mm)
// Uses current D_mm (top of rafter @ wall, outer reference).
// If you later switch computeRafters to return D_wall_from_outer_mm, just
// replace rafter.D_mm below with rafter.D_wall_from_outer_mm.
const buildUpVertical_mm = (1 + 25 + 15) * Math.cos(degToRad(norm.pitchDeg));
const finished_outer_mm = rafter.D_mm + buildUpVertical_mm;

// Inner reference = outer ref + vertical rise across the frame-on distance
// (i.e., add frame_on_mm * tan(theta)).
const finished_inner_mm =
  finished_outer_mm + norm.frame_on_mm * Math.tan(degToRad(norm.pitchDeg));

  // Totals
  const allExVAT =
    rafter.costs.exVAT_total +
    wallplate.costs.exVAT_total +
    frontRingbeam.costs.exVAT_total +
    cradle.costs.exVAT_total +
    pir100.costs.exVAT_total;

  const consumables = allExVAT * (norm.consumables_pct / 100);
  const net_exVAT = allExVAT + consumables;
  const vat = net_exVAT * (norm.vat_pct / 100);
  const gross_incVAT = net_exVAT + vat;

return (
  <div className="p-4 md:p-6 max-w-5xl mx-auto">
    {/* HEADER */}
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">Lean-To Configurator</h1>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          to={`/quote/lean-to/plan-manufacture?${planQs}`}
          className="text-sm underline"
        >
          Plan &amp; Manufacture
        </Link>
        <Link to={`/tiles-laths?${planQs}`} className="text-sm underline">
          Tiles &amp; Laths
        </Link>
        <Link to="/materials" className="text-sm underline">
          Materials
        </Link>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            try { localStorage.removeItem("leanToInputs"); } catch {}
            setInputs({ ...DEFAULT_INPUTS }); // clone to trigger re-render
          }}
        >
          Reset inputs
        </button>
        <Link to="/quote" className="text-sm underline">
          ← Back to Styles
        </Link>
      </div>
    </div>

    {/* INPUTS TOP SECTION */}
      <section className="rounded-2xl shadow p-4 md:p-6 bg-white mb-6">
        <h2 className="text-xl font-semibold mb-4">Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">Internal width (mm)
            <input type="number" inputMode="numeric" placeholder="e.g. 3500" className="border rounded px-3 py-2" value={inputs.internalWidthMM} onChange={onStr("internalWidthMM")} />
          </label>
          <label className="flex flex-col gap-1">Internal projection to wall (mm)
            <input type="number" inputMode="numeric" placeholder="e.g. 3500" className="border rounded px-3 py-2" value={inputs.internalProjectionMM} onChange={onStr("internalProjectionMM")} />
          </label>
          <label className="flex flex-col gap-1">Pitch θ (deg)
            <input type="number" inputMode="decimal" placeholder="e.g. 15" className="border rounded px-3 py-2" value={inputs.pitchDeg} onChange={onStr("pitchDeg")} />
          </label>
          <label className="flex flex-col gap-1">Soffit overhang at eaves (mm)
            <input type="number" inputMode="numeric" placeholder="150" className="border rounded px-3 py-2" value={inputs.soffit_mm} onChange={onStr("soffit_mm")} />
          </label>
          <label className="flex flex-col gap-1">Frame-on (ring-beam bearing) (mm)
            <input type="number" inputMode="numeric" placeholder="70" className="border rounded px-3 py-2" value={inputs.frame_on_mm} onChange={onStr("frame_on_mm")} />
          </label>
          <label className="flex flex-col gap-1">Side frame thickness (per side, mm)
            <input type="number" inputMode="numeric" placeholder="70" className="border rounded px-3 py-2" value={inputs.side_frame_thickness_mm} onChange={onStr("side_frame_thickness_mm")} />
          </label>
          <label className="flex flex-col gap-1">Fascia lip (per side, mm)
            <input type="number" inputMode="numeric" placeholder="25" className="border rounded px-3 py-2" value={inputs.fascia_lip_mm} onChange={onStr("fascia_lip_mm")} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={inputs.leftWall} onChange={onToggle("leftWall")} /> Left side wall present
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={inputs.rightWall} onChange={onToggle("rightWall")} /> Right side wall present
          </label>
          <label className="flex flex-col gap-1">Wallplate thickness t_wp (mm)
            <input type="number" inputMode="numeric" placeholder="63" className="border rounded px-3 py-2" value={inputs.t_wp_mm} onChange={onStr("t_wp_mm")} />
          </label>
          <label className="flex flex-col gap-1">Hanger allowance t_h (mm)
            <input type="number" inputMode="numeric" placeholder="2" className="border rounded px-3 py-2" value={inputs.t_h_mm} onChange={onStr("t_h_mm")} />
          </label>
          <label className="flex flex-col gap-1">Rafter depth d (mm)
            <input type="number" inputMode="numeric" placeholder="220" className="border rounded px-3 py-2" value={inputs.rafter_depth_mm} onChange={onStr("rafter_depth_mm")} />
          </label>

          <div className="col-span-full border-t my-1"></div>

          <label className="flex items-center gap-2 col-span-full">
            <input type="checkbox" checked={inputs.includeCradle} onChange={onToggle("includeCradle")} />
            Include PIR cradle on rafter webs (50 mm rebated strips)
          </label>
          {inputs.includeCradle && (
            <>
              <label className="flex flex-col gap-1">Cradle strip width (mm)
                <input type="number" inputMode="numeric" placeholder="50" className="border rounded px-3 py-2" value={inputs.cradle_width_mm} onChange={onStr("cradle_width_mm")} />
              </label>
              <label className="flex flex-col gap-1">Rebate/waste allowance (%)
                <input type="number" inputMode="decimal" placeholder="0" className="border rounded px-3 py-2" value={inputs.cradle_waste_pct} onChange={onStr("cradle_waste_pct")} />
              </label>
            </>
          )}

          <div className="col-span-full border-t my-1"></div>

          {/* 100 mm PIR infill controls */}
          <label className="flex items-center gap-2 col-span-full">
            <input type="checkbox" checked={inputs.includePir100} onChange={onToggle("includePir100")} />
            Include 100 mm PIR infill between rafters (600 mm strips from 1200×2400 slabs)
          </label>
          {inputs.includePir100 && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={inputs.optimizePir100Remainders} onChange={onToggle("optimizePir100Remainders")} />
              Optimise remainder cuts (pair 2×remainder from a 2400 strip)
            </label>
          )}

          <div className="col-span-full border-t my-1"></div>

          <label className="flex flex-col gap-1">Rounding step (m)
            <input type="number" inputMode="decimal" step="0.01" placeholder="0.1" className="border rounded px-3 py-2" value={inputs.step_round_m} onChange={onStr("step_round_m")} />
          </label>
          <label className="flex flex-col gap-1">Consumables / Overheads (%)
            <input type="number" inputMode="decimal" placeholder="0" className="border rounded px-3 py-2" value={inputs.consumables_pct} onChange={onStr("consumables_pct")} />
          </label>
          <label className="flex flex-col gap-1">VAT (%)
            <input type="number" inputMode="decimal" placeholder="20" className="border rounded px-3 py-2" value={inputs.vat_pct} onChange={onStr("vat_pct")} />
          </label>
        </div>

        {/* Derived dims preview */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="rounded-lg bg-gray-50 p-3">External width (derived): <b>{round(norm.extWidthMM, 1)} mm</b></div>
          <div className="rounded-lg bg-gray-50 p-3">External projection (derived): <b>{round(norm.extProjectionMM, 1)} mm</b></div>
        </div>
      </section>

      {/* BREAKDOWN SECTIONS */}
      <div className="grid gap-6">
        {/* Geometry quick view */}
        <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
          <h2 className="text-lg font-semibold mb-2">Geometry (derived)</h2>
          <ul className="space-y-1 text-sm">
            <li>A (underside length) = <b>{round(rafter.A_mm)} mm</b></li>
            <li>B (top-edge length) = <b>{round(rafter.B_mm)} mm</b></li>
            <li>C (eaves underside above frame) = <b>{rafter.C_mm} mm</b></li>
            <li>D (top of rafter @ wall, outer ref) = <b>{round(rafter.D_mm)} mm</b></li>
            <li>Rafters across run: <b>{rafter.rafterCount}</b> · pattern: left edge, centre at 685, then 665 centres, and right edge (slot 48 mm)</li>
          </ul>
        </section>

        {/* Wallplate */}
        <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
          <h2 className="text-lg font-semibold">Wallplate (Steico I-joist 220)</h2>
          <div className="text-xs text-gray-600 mb-2">External width = {round(norm.extWidthMM, 1)} mm → L (m) = {round(wallplate.L_m, 3)} → charged length (rounded) = {round(wallplate.L_m_rounded, 3)} m</div>
          <table className="w-full text-sm mt-1 border">
            <thead>
              <tr className="bg-gray-100 text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Line</th></tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Steico 220 (per m, rounded)</td><td className="p-2">{round(wallplate.L_m_rounded, 3)} m</td><td className="p-2">£{prices.steico220_per_m.toFixed(2)}</td><td className="p-2">£{round(wallplate.costs.lines.steico, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">18 mm ply infill (area)</td><td className="p-2">{round(wallplate.ply18_area_m2, 3)} m²</td><td className="p-2">£{prices.ply18_per_m2.toFixed(2)}</td><td className="p-2">£{round(wallplate.costs.lines.ply18, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">9 mm fixing strips (50×220)</td><td className="p-2">{wallplate.stripsCount} pcs ({round(wallplate.stripArea_m2, 3)} m²)</td><td className="p-2">£{prices.ply9_per_m2.toFixed(2)} / m²</td><td className="p-2">£{round(wallplate.costs.lines.ply9_strips, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">Joist hangers (ends + 665 mm centres)</td><td className="p-2">{wallplate.hangerCount} pcs</td><td className="p-2">£{prices.joist_hanger_each.toFixed(2)} each</td><td className="p-2">£{round(wallplate.costs.lines.hangers, 2).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div className="text-right text-sm mt-2">Wallplate ex-VAT: <b>£{round(wallplate.costs.exVAT_total, 2).toFixed(2)}</b></div>
        </section>

        {/* Front Ring-beam */}
        <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
          <h2 className="text-lg font-semibold">Front Ring-beam (Standard)</h2>
          <table className="w-full text-sm mt-1 border">
            <thead>
              <tr className="bg-gray-100 text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Line</th></tr>
            </thead>
            <tbody>
              <tr><td className="p-2">9 mm ply soffit (220 mm width)</td><td className="p-2">{round(frontRingbeam.soffit9_area_m2, 3)} m²</td><td className="p-2">£{prices.ply9_per_m2.toFixed(2)}</td><td className="p-2">£{round(frontRingbeam.costs.lines.soffit9, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">50×25 fixing lath (outer)</td><td className="p-2">{round(frontRingbeam.lath50x25_m, 3)} m</td><td className="p-2">£{prices.lath_50x25_per_m.toFixed(2)}</td><td className="p-2">£{round(frontRingbeam.costs.lines.lath50x25, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">90×30 PSE with groove (inner)</td><td className="p-2">{round(frontRingbeam.pse90x30_m, 3)} m</td><td className="p-2">£{prices.ringbeam_pse90x30_per_m.toFixed(2)}</td><td className="p-2">£{round(frontRingbeam.costs.lines.pse90x30, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">Upstands: 9 mm ply pieces</td><td className="p-2">{frontRingbeam.upstandCount} pcs ({round(frontRingbeam.upstandAreaPerPiece_m2, 3)} m² each)</td><td className="p-2">£{prices.ply9_per_m2.toFixed(2)} / m²</td><td className="p-2">£{round(frontRingbeam.costs.lines.upstand_ply9, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">PIR 50 mm (both faces / upstand)</td><td className="p-2">{frontRingbeam.upstandCount} pcs ({round(frontRingbeam.pirAreaPerPiece_m2, 3)} m² each)</td><td className="p-2">£{prices.pir50_per_m2.toFixed(2)} / m²</td><td className="p-2">£{round(frontRingbeam.costs.lines.pir50, 2).toFixed(2)}</td></tr>
              <tr><td className="p-2">25×50 finishing lath</td><td className="p-2">{round(frontRingbeam.finishLath25x50_m, 3)} m</td><td className="p-2">£{prices.lath_25x50_per_m.toFixed(2)}</td><td className="p-2">£{round(frontRingbeam.costs.lines.lath25x50, 2).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div className="text-right text-sm mt-2">Front ring-beam ex-VAT: <b>£{round(frontRingbeam.costs.exVAT_total, 2).toFixed(2)}</b></div>
        </section>

        {/* PIR Cradle (50 mm) */}
        {inputs.includeCradle && (
          <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
            <h2 className="text-lg font-semibold">PIR Cradle on Rafter Webs (50 mm rebated)</h2>
            <p className="text-sm text-gray-700 mb-2">Rafters: <b>{rafter.rafterCount}</b> · Interiors (double-face): <b>{cradle.interiorRafters}</b> · Ends (single-face): <b>{cradle.endRafters}</b> · Total faces: <b>{cradle.faces}</b></p>
            <div className="text-xs text-gray-600">Length per face = {round(cradle.length_per_face_m, 3)} m · Strip width = {round(cradle.strip_width_m * 1000)} mm</div>
            <table className="w-full text-sm mt-2 border">
              <thead>
                <tr className="bg-gray-100 text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Line</th></tr>
              </thead>
              <tbody>
                <tr><td className="p-2">PIR 50 mm (strip area incl. waste)</td><td className="p-2">{round(cradle.area_m2_with_waste, 3)} m²</td><td className="p-2">£{prices.pir50_per_m2.toFixed(2)} / m²</td><td className="p-2">£{round(cradle.costs.lines.pir50_cradle, 2).toFixed(2)}</td></tr>
              </tbody>
            </table>
            <div className="text-right text-sm mt-2">PIR cradle ex-VAT: <b>£{round(cradle.costs.exVAT_total, 2).toFixed(2)}</b></div>
          </section>
        )}

        {/* 100 mm PIR infill between rafters */}
        {inputs.includePir100 && (
          <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
            <h2 className="text-lg font-semibold">100 mm PIR — Between Rafters</h2>
            <p className="text-sm text-gray-700 mb-2">
              Bays: <b>{pir100.bays}</b> · A per bay (underside): <b>{round(pir100.A_mm)} mm</b> · Optimisation: <b>{norm.optimizePir100Remainders ? "On" : "Off"}</b>
            </p>
            <div className="text-xs text-gray-600 mb-2">
              Plan per bay: <b>{pir100.plan.fullSegmentsPerBay}</b> × 2400 + remainder <b>{round(pir100.plan.remainder_mm)} mm</b><br />
              Strips total: <b>{pir100.strips_total}</b> (naive {pir100.plan.strips_naive}, optimised {pir100.plan.strips_optimized}) · Sheets (1200×2400): <b>{pir100.sheets_total}</b>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Area needed: <b>{round(pir100.area_needed_m2, 2)} m²</b> · Area from sheets: <b>{round(pir100.area_from_sheets_m2, 2)} m²</b>
            </div>
            <table className="w-full text-sm mt-2 border">
              <thead>
                <tr className="bg-gray-100 text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Line</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">PIR 100 mm sheets (1200×2400)</td>
                  <td className="p-2">{pir100.sheets_total} pcs</td>
                  <td className="p-2">£{prices.pir100_sheet_price.toFixed(2)} each</td>
                  <td className="p-2">£{round(pir100.costs.lines.pir100_sheets, 2).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2 text-gray-500">Ref (area × £/m²)</td>
                  <td className="p-2 text-gray-500">{round(pir100.area_needed_m2, 2)} m²</td>
                  <td className="p-2 text-gray-500">£{prices.pir100_per_m2.toFixed(2)} / m²</td>
                  <td className="p-2 text-gray-500">£{round(pir100.costs.lines.pir100_area_val, 2).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-right text-sm mt-2">PIR 100 mm ex-VAT: <b>£{round(pir100.costs.exVAT_total, 2).toFixed(2)}</b></div>
          </section>
        )}

        {/* Rafters */}
        <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
          <h2 className="text-lg font-semibold">Rafters (Lean-To)</h2>
          <p className="text-sm text-gray-700 mb-2">Count: <b>{rafter.rafterCount}</b> · Top-edge length per rafter B = <b>{round(rafter.B_mm)} mm</b></p>
          <div className="text-xs text-gray-600">Total B × count = {round(rafter.totalTopEdge_m, 3)} m → rounded to step = {round(rafter.totalTopEdge_m_rounded, 3)} m</div>
          <table className="w-full text-sm mt-2 border">
            <thead>
              <tr className="bg-gray-100 text-left"><th className="p-2">Item</th><th className="p-2">Qty</th><th className="p-2">Rate</th><th className="p-2">Line</th></tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Steico 220 (top-edge, total rounded)</td><td className="p-2">{round(rafter.totalTopEdge_m_rounded, 3)} m</td><td className="p-2">£{prices.steico220_per_m.toFixed(2)}</td><td className="p-2">£{round(rafter.costs.lines.steico_top_edge, 2).toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div className="text-right text-sm mt-2">Rafters ex-VAT: <b>£{round(rafter.costs.exVAT_total, 2).toFixed(2)}</b></div>
        </section>
      </div>

      {/* TOTALS */}
      <section className="rounded-2xl shadow p-4 md:p-6 bg-white mt-6">
        <h2 className="text-lg font-semibold mb-2">Totals</h2>
        <div className="flex flex-col items-end gap-1 text-base">
          <div>Materials + Overheads (Net, ex VAT): <b>£{round(net_exVAT, 2).toFixed(2)}</b></div>
          <div>VAT ({norm.vat_pct}%): £{round(vat, 2).toFixed(2)}</div>
          <div className="text-2xl font-bold">Grand Total (inc VAT): £{round(gross_incVAT, 2).toFixed(2)}</div>
        </div>
      </section>

      <p className="text-xs text-gray-500 mt-3">
        Internal inputs → external derived. Includes 50 mm cradle & 100 mm PIR infill (sheet-optimised).
      </p>
    </div>
  );
}
