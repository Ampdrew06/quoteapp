// src/lib/Calculations/miscCalc.js

// --- local helpers (must be BEFORE any usage) ---
function getTileSystem(q) {
function getTilesTotalEst(q, m, area_m2_ext) {
  // 1) Prefer a hint passed in from the caller (IdiotList)
  const hinted = Number(q?.tiles_total_hint);
  if (Number.isFinite(hinted) && hinted > 0) return Math.ceil(hinted);

  // 2) Otherwise estimate from area using system-specific densities
  const sys = getTileSystem(q) || "britmet";
  const pitch = Number(q?.pitchDeg) || 0;

  if (sys === "liteslate") {
    // Choose LiteSlate density by pitch
    const d_12_25 = Number(m?.liteslate_density_12_25 ?? 22);
    const d_25_27 = Number(m?.liteslate_density_25_27 ?? 20);
    const d_27_30 = Number(m?.liteslate_density_27_30 ?? 19);
    const d_ge_30 = Number(m?.liteslate_density_ge_30 ?? 18);

    let density = d_12_25;
    if      (pitch >= 30)   density = d_ge_30;
    else if (pitch >= 27.5) density = d_27_30;
    else if (pitch >= 25)   density = d_25_27;

    return Math.ceil((Number(area_m2_ext) || 0) * density);
  }

  // Britmet default: tiles per m²
const tiles_total_est = getTilesTotalEst(q, m, area_m2_ext);
}

  const raw =
    q?.tile_system ??
    q?.tileSystem ??
    q?.tileType ??            // belt & braces in case you use this elsewhere
    "";
  return String(raw).toLowerCase();
}

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const ceil = (n) => Math.ceil(num(n, 0));
const money = (v) => Number((Number(v) || 0).toFixed(2));
// Which tile system are we on? (already defined above)
// function getTileSystem(q) { ... }

// Robust tile total estimator: prefer a real total passed in; else estimate from area & system
function getTilesTotalEst(q, m, area_m2_ext) {
  // 1) If IdiotList passed a strong hint, use it
  const hint = Number(q?.tiles_total_hint);
  if (Number.isFinite(hint) && hint > 0) return Math.ceil(hint);

  // 2) Otherwise estimate from area using system-specific density
  const sys = getTileSystem(q) || "britmet";

  if (sys === "liteslate") {
    // Pick LiteSlate density from pitch
    const p = Number(q?.pitchDeg ?? q?.pitch_deg ?? 0);

    const d12_25 = num(m.liteslate_density_12_25, 22); // 12°–24.99°
    const d25_27 = num(m.liteslate_density_25_27, 20); // 25°–27.49°
    const d27_30 = num(m.liteslate_density_27_30, 19); // 27.5°–29.99°
    const dge30  = num(m.liteslate_density_ge_30, 18); // ≥30°

    let tilesPerM2 = d12_25;
    if (p >= 25 && p < 27.5) tilesPerM2 = d25_27;
    else if (p >= 27.5 && p < 30) tilesPerM2 = d27_30;
    else if (p >= 30) tilesPerM2 = dge30;

    return ceil((Number(area_m2_ext) || 0) * tilesPerM2);
  }

  // Default: Britmet area-based density
  const tilesPerM2 = num(m.tile_britmet_tiles_per_m2, 3.2);
  return ceil((Number(area_m2_ext) || 0) * tilesPerM2);
}


const deg2rad = (deg) => (Number(deg) || 0) * Math.PI / 180;
const slopeLen = ({ projection_mm = 0, pitch_deg = 0 }) => {
  const proj = Number(projection_mm) || 0;
  const theta = deg2rad(pitch_deg);
  return theta === 0 ? proj : proj / Math.cos(theta);
};

function slopeFromProjectionMM(proj_mm, pitch_deg) {
  const theta = (num(pitch_deg) * Math.PI) / 180;
  return num(proj_mm) / Math.cos(theta || 0);
}

// --- SuperQuilt roll-mix chooser ---


function chooseRollMix(required_m2, opts) {
  // opts: { price12, price15, halfWindow }
  const { price12 = 0, price15 = 0, halfWindow = 2.0 } = opts || {};
  const rows = [];

  if (required_m2 <= 12) {
    rows.push({ size_m2: 12, label: "SuperQuilt 12 m² roll", count: 1, unit_ex_vat: price12 });
    return rows;
    }
  if (required_m2 <= 15) {
    rows.push({ size_m2: 15, label: "SuperQuilt 15 m² roll", count: 1, unit_ex_vat: price15 });
    return rows;
  }

  // search full-roll combos (12 & 15 only)
  const maxFull = Math.ceil(required_m2 / 12) + 3;
  let bestFull = null;
  let bestBelow = null;

  for (let n12 = 0; n12 <= maxFull; n12++) {
    for (let n15 = 0; n15 <= maxFull; n15++) {
      if (n12 + n15 === 0) continue;
      const coverage = n12 * 12 + n15 * 15;
      const items = n12 + n15;
      const cost = n12 * price12 + n15 * price15;

      if (coverage >= required_m2) {
        if (
          !bestFull ||
          coverage < bestFull.coverage ||
          (coverage === bestFull.coverage && items < bestFull.items) ||
          (coverage === bestFull.coverage && items === bestFull.items && cost < bestFull.cost)
        ) bestFull = { coverage, items, cost, n12, n15 };
      }

      if (coverage <= required_m2) {
        if (!bestBelow || coverage > bestBelow.coverage || (coverage === bestBelow.coverage && items < bestBelow.items)) {
          bestBelow = { coverage, items, cost, n12, n15 };
        }
      }
    }
  }

  if (!bestFull) {
    const n12 = Math.ceil(required_m2 / 12);
    rows.push({ size_m2: 12, label: "SuperQuilt 12 m² roll", count: n12, unit_ex_vat: price12 });
    return rows;
  }

  // consider one half-roll if just above a boundary
  let candidateHalf = null;
  if (bestBelow) {
    const delta = required_m2 - bestBelow.coverage;
    if (delta > 0 && delta <= halfWindow) {
      let halfSize = null;
      if (delta <= 6) halfSize = 6;
      else if (delta <= 7.5) halfSize = 7.5;

      if (halfSize) {
        candidateHalf = {
          coverage: bestBelow.coverage + halfSize,
          items: bestBelow.items + 1,
          cost:
            bestBelow.n12 * price12 +
            bestBelow.n15 * price15 +
            (halfSize === 6 ? price12 / 2 : price15 / 2),
          n12: bestBelow.n12,
          n15: bestBelow.n15,
          n6: halfSize === 6 ? 1 : 0,
          n75: halfSize === 7.5 ? 1 : 0,
        };
      }
    }
  }

  let choice = bestFull;
  if (candidateHalf) {
    const overFull = bestFull.coverage - required_m2;
    const overHalf = candidateHalf.coverage - required_m2;
    if (
      overHalf < overFull ||
      (overHalf === overFull && candidateHalf.items < bestFull.items) ||
      (overHalf === overFull && candidateHalf.items === bestFull.items && candidateHalf.cost < bestFull.cost)
    ) choice = candidateHalf;
  }

  const out = [];
  if (choice.n15) out.push({ size_m2: 15, label: "SuperQuilt 15 m² roll", count: choice.n15, unit_ex_vat: price15 });
  if (choice.n12) out.push({ size_m2: 12, label: "SuperQuilt 12 m² roll", count: choice.n12, unit_ex_vat: price12 });
  if (choice.n75) out.push({ size_m2: 7.5, label: "SuperQuilt 7.5 m² half-roll", count: choice.n75, unit_ex_vat: +(price15/2).toFixed(2) });
  if (choice.n6)  out.push({ size_m2: 6,   label: "SuperQuilt 6 m² half-roll",   count: choice.n6,  unit_ex_vat: +(price12/2).toFixed(2) });
  return out;
}

/**
 * q: expects internalWidthMM, internalProjectionMM, pitchDeg
 * m: expects:
 *   - breather_* flat keys
 *   - slab100_pack_coverage_m2, slab100_pack_price_each
 *   - superquilt_12m2_price_ex_vat, superquilt_15m2_price_ex_vat,
 *     superquilt_overlap_mm, superquilt_wastage_pct, superquilt_half_roll_window_m2,
 *     superquilt_roll_width_mm (baseline for overlap factor)
 */
export function computeMiscLeanTo(q = {}, m = {}) {
  const iw_mm = num(q.internalWidthMM, 4000);
  const ip_mm = num(q.internalProjectionMM, 2500);
  const pitch = num(q.pitchDeg, 15);

  // Internal area for quilt/slab
  const slope_mm = slopeFromProjectionMM(ip_mm, pitch);
  const area_m2_internal = +((iw_mm * slope_mm) / 1_000_000).toFixed(2);

  // External area for breather (close enough: use same area unless you want extWidthMM)
  const area_m2_breather = area_m2_internal;

  const items = [];
  let total = 0;

  // --- Breather membrane (rolls) ---
  const bWidth = num(m.breather_roll_width_m, 1.0);
  const bLen   = num(m.breather_roll_length_m, 50);
  const bArea  = bWidth * bLen; // m² per roll
  const bWaste = num(m.breather_wastage_pct, 8) / 100;
  const bPrice = num(m.breather_roll_price_each, 0);

  if (bArea > 0) {
    const rolls = ceil((area_m2_breather * (1 + bWaste)) / bArea);
    if (rolls > 0) {
      items.push({
        key: "breather_membrane",
        name: "Breather membrane",
        label: `Breather membrane ${bWidth}×${bLen} m`,
        note: `(${bWidth}×${bLen} m)`,
        qty: rolls,
        uom: "Roll",
        unit_price: bPrice,
        total: +(rolls * bPrice).toFixed(2),
      });
      total += rolls * bPrice;
    }
  }


// --- 100 mm slab packs ---
const sCov = num(m.slab100_pack_coverage_m2, 2.88);
const sWaste = num(m.slab100_wastage_pct, 5) / 100;
const sPricePack = num(m.slab100_pack_price_each, 0);
const sPricePerM2 = sCov > 0 ? sPricePack / sCov : 0;

const sWeightPerM2 =
  num(
    m.slab100_weight_kg_per_m2,
    sCov > 0
      ? num(m.slab100_pack_weight_kg_each ?? m.slab100_pack_weight_kg, 0) / sCov
      : 0
  );

if (sCov > 0) {
  const areaNeeded100 = area_m2_internal * (1 + sWaste);
  const packsNeeded = ceil(areaNeeded100 / sCov);

  if (packsNeeded > 0) {
    items.push({
      key: "slab100",
      name: "100 mm slab insulation",
      label: "100 mm slab insulation (pack)",
      note: `(≈${sCov} m²/pack)`,

      // display quantity
      qty: +areaNeeded100.toFixed(3),
      qtyDisplay: areaNeeded100.toFixed(3),
      unitLabel: "m²",
      uom: "m²",

      // ordering quantity
      qty_order: packsNeeded,
      orderQty: packsNeeded,
      orderUnit: "Pack",

      // pricing as m² rate (not pack rate)
      unit_price: +sPricePerM2.toFixed(4),
      total: +(areaNeeded100 * sPricePerM2).toFixed(2),

      // weight as m² rate
      weightEachKg: +sWeightPerM2.toFixed(4),
      totalWeightKg: +(areaNeeded100 * sWeightPerM2).toFixed(2),
    });

    total += areaNeeded100 * sPricePerM2;
  }
}

// --- 50 mm slab packs ---
const s50Cov = num(m.slab50_pack_coverage_m2, 2.88);
const s50Waste = num(m.slab50_wastage_pct, 5) / 100;
const s50PricePack = num(m.slab50_pack_price_each, 0);
const s50PricePerM2 = s50Cov > 0 ? s50PricePack / s50Cov : 0;

const s50WeightPerM2 =
  num(
    m.slab50_weight_kg_per_m2,
    s50Cov > 0
      ? num(m.slab50_pack_weight_kg_each ?? m.slab50_pack_weight_kg, 0) / s50Cov
      : 0
  );

if (s50Cov > 0 && s50PricePack > 0) {
  const areaNeeded50 = area_m2_internal * (1 + s50Waste);
  const packsNeeded50 = ceil(areaNeeded50 / s50Cov);

  if (packsNeeded50 > 0) {
    items.push({
      key: "slab50",
      name: "50 mm slab insulation",
      label: "50 mm slab insulation (pack)",
      note: `(≈${s50Cov} m²/pack)`,

      // display quantity
      qty: +areaNeeded50.toFixed(3),
      qtyDisplay: areaNeeded50.toFixed(3),
      unitLabel: "m²",
      uom: "m²",

      // ordering quantity
      qty_order: packsNeeded50,
      orderQty: packsNeeded50,
      orderUnit: "Pack",

      // pricing as m² rate (not pack rate)
      unit_price: +s50PricePerM2.toFixed(4),
      total: +(areaNeeded50 * s50PricePerM2).toFixed(2),

      // weight as m² rate
      weightEachKg: +s50WeightPerM2.toFixed(4),
      totalWeightKg: +(areaNeeded50 * s50WeightPerM2).toFixed(2),
    });

    total += areaNeeded50 * s50PricePerM2;
  }
}
// ===== Extra misc items & fixings ===== 
// (use the top-level num/ceil helpers defined at the top of this file)


  // We need a couple of derived values:
  // - internal area (you already computed area_m2_internal earlier in this file)
  // - external area (fallback: approx internal area if you don't have it here)
  // Use internal area as a safe external-area proxy in this context
  const area_m2_ext = num(area_m2_internal, 0);


  // Rafters & lath rows, to estimate screws:
  // Try to mirror IdiotList’s logic:
  const iw   = num(q.internalWidthMM, 4000);
  const spacing   = num(m.rafter_spacing_mm ?? 665, 665);
  const firstCtr  = num(m.rafter_first_center_mm ?? 690, 690);
  const rafters   = 1 + Math.max(0, Math.ceil((iw - firstCtr) / spacing));

  // Tile course counts:
  const pitchDeg  = num(q.pitchDeg, 15);
  const soff      = num(q.soffit_mm ?? 150);
  const frm       = num(q.frame_on_mm ?? 70);
  const extProjMM = num(q.internalProjectionMM, 2500) + soff + frm;

  // slope up the roof, reusing your roofMath if available:
  const slope_mm_here = slope_mm || slopeLen({ projection_mm: extProjMM, pitch_deg: pitchDeg });
  const slope_m_here  = slope_mm_here / 1000;

  // Gauge for tiles (affects external courses):
  const gauge_mm = num(q.gauge_mm, m.tile_britmet_gauge_mm ?? 250);
  const courses_ext = Math.ceil(slope_m_here / (gauge_mm / 1000));

  // Internal laths: rows every 400 mm up the slope (same as IdiotList)
  const lath_centres_mm = 400;
  const int_rows = Math.max(1, Math.floor(slope_mm_here / lath_centres_mm) + 1);

// Tiles total (for tile-fixing screws) — prefer real total from IdiotList, else estimate
const tiles_total_est = getTilesTotalEst(q, m, area_m2_ext);



  // ---------- 1) Expanding foam (cans) ----------
  {
    const price = num(m.expandingFoam?.price_each, 3.78);
    const base  = num(m.expandingFoam?.base_cans_per_roof, 2);
    const step  = Math.max(1, num(m.expandingFoam?.extra_cans_area_step_m2, 12));

    // Rule: 2 cans base, +1 can per 'step' m² above 12 m²
    const extra = Math.max(0, Math.floor(Math.max(0, area_m2_ext - step) / step));
    const cans  = base + extra;
if (typeof window !== "undefined") {
  console.log("🧪 DBG miscCalc foam weight sources:", {
    grouped: m?.expandingFoam?.weight_kg_each,
    flat: m?.expanding_foam_can_weight_kg_each,
  });
}
    items.push({
      key: "expanding_foam",
      name: "Expanding foam (can)",
      qty: cans,
      uom: "Ea",
      unit_price: price,
      total: +(cans * price).toFixed(2),
      note: `(base ${base} + ${extra} for area)`,
      weightEachKg: Number(
  m?.expandingFoam?.weight_kg_each ??
  m?.expanding_foam_can_weight_kg_each ??
  0
),
weightPerUnitKg: Number(
  m?.expandingFoam?.weight_kg_each ??
  m?.expanding_foam_can_weight_kg_each ??
  0
),
    });
    total += cans * price;
  }
console.log("DBG miscCalc expanding_foam item:", items.find(x => x.key === "expanding_foam"));
  // ---------- 2) Polytop pins (colour-matched) ----------
  {
    const boxPrice = num(m.polytopPins?.price_per_box, 5.95);
    const boxUnits = Math.max(1, num(m.polytopPins?.units_per_box, 250));
    const wantUnits = Math.max(1, num(m.polytopPins?.default_qty_units, 50));

    const boxes = ceil(wantUnits / boxUnits);

    // pick colour from plastics finish
    const plasticsFinish = String(q.plastics_finish || "white").toLowerCase();
    const colourNote =
      plasticsFinish === "white" ? "White" :
      plasticsFinish === "anthracite" ? "Anthracite" :
      plasticsFinish === "rosewood" ? "Rosewood" :
      plasticsFinish.charAt(0).toUpperCase() + plasticsFinish.slice(1);

    items.push({
      key: "polytop_pins",
      name: "Polytop pins (colour matched)",
      qty: boxes,
      uom: "Box",
      unit_price: boxPrice,
      total: +(boxes * boxPrice).toFixed(2),
      note: `(~${wantUnits} pins; ${boxUnits}/box; ${colourNote})`,
      weightEachKg: 0.4,
      weightPerUnitKg: 0.4,
    });
    total += boxes * boxPrice;
  }

  // ---------- 3) Aluminium roll tape (for SuperQuilt joints) ----------
  {
    const price = num(m.aluRollTape?.price_each, 3.88);
    const base  = Math.max(1, num(m.aluRollTape?.default_rolls, 1));
    const stepM2 = Math.max(1, num(m.aluRollTape?.area_step_m2, 25));
    // Simple rule: 1 roll base, add +1 per each 'stepM2' area beyond that threshold
    const extra = Math.max(0, Math.floor(Math.max(0, area_m2_ext - stepM2) / stepM2));
    const rolls = base + extra;

    items.push({
      key: "alu_roll_tape",
      name: "Aluminium roll tape (50 m)",
      qty: rolls,
      uom: "Roll",
      unit_price: price,
      total: +(rolls * price).toFixed(2),
      note: `(base ${base}${extra ? ` + ${extra} for area` : ""})`,
      weightEachKg: 0.3,
      weightPerUnitKg: 0.3,
    });
    total += rolls * price;
  }

  // ---------- 4) Rafter/Eaves Fixing Screws — 3" x 10 ----------
  {
    const boxPrice = num(m.rafterEavesScrews?.price_per_box, 4.70);
    const boxUnits = Math.max(1, num(m.rafterEavesScrews?.units_per_box, 200));
    const factor   = num(m.rafterEavesScrews?.extra_factor, 1.5);

    // need ≈ (#rafters + #spaces) × 1.5
    const spaces = Math.max(0, rafters - 1);
    const needUnits = ceil((rafters + spaces) * factor);
    const boxes = Math.max(1, ceil(needUnits / boxUnits));

    items.push({
      key: "screws_rafter_eaves",
      name: `Rafter/Eaves fixing screws ${m.rafterEavesScrews?.label || '3" x 10'}`,
      qty: boxes,
      uom: "Box",
      unit_price: boxPrice,
      total: +(boxes * boxPrice).toFixed(2),
      note: `(~${needUnits} est.; ${boxUnits}/box)`,
      weightEachKg: 0.6,
      weightPerUnitKg: 0.6,
    });
    total += boxes * boxPrice;
  }

  // ---------- 5) Lath Fixings — 2" x 8 ----------
  {
    const boxPrice = num(m.lathFixings?.price_per_box, 3.06);
    const boxUnits = Math.max(1, num(m.lathFixings?.units_per_box, 200));

    // need = (external courses × rafters) + (internal rows × rafters)
    const needUnits = (courses_ext * rafters) + (int_rows * rafters);
    const boxes = Math.max(1, ceil(needUnits / boxUnits));

    items.push({
      key: "screws_lath_fixings",
      name: `Internal/External lath fixings ${m.lathFixings?.label || '2" x 8'}`,
      qty: boxes,
      uom: "Box",
      unit_price: boxPrice,
      total: +(boxes * boxPrice).toFixed(2),
      note: `(~${needUnits} est.; ${boxUnits}/box; ${courses_ext} ext rows × ${rafters} rafters + ${int_rows} int rows × ${rafters} rafters)`,
      weightEachKg: 0.8,
      weightPerUnitKg: 0.8,
    });
    total += boxes * boxPrice;
  }

// ---------- 6) Tile Fixing Screws — 1" x 8 (system-aware) ----------
{
  const sys = getTileSystem(q) || "britmet";

  const boxPrice = num(m.tileFixings?.price_per_box, 1.47);
  const boxUnits = Math.max(1, num(m.tileFixings?.units_per_box, 200));

  // System-specific overrides (if present), with sensible defaults:
  const perTile =
    sys === "liteslate"
      ? Math.max(0, num(m.tileFixings?.per_tile_liteslate, 2)) // LiteSlate = 2 per tile
      : Math.max(0, num(m.tileFixings?.per_tile_britmet, 3));  // Britmet   = 3 per tile

  // Lean-to has no ridge/hip caps; tiles only
  const needUnits = tiles_total_est * perTile;
  const boxes = Math.max(1, ceil(needUnits / boxUnits));

  items.push({
    key: "screws_tile_fixings",
    name: `Tile fixing screws ${m.tileFixings?.label || '1" x 8'}`,
    qty: boxes,
    uom: "Box",
    unit_price: boxPrice,
    total: +(boxes * boxPrice).toFixed(2),
    note: `(~${needUnits} est. @ ${perTile}/tile; ${boxUnits}/box)`,
    weightEachKg: 0.7,
    weightPerUnitKg: 0.7,
  });
  total += boxes * boxPrice;
}

  // --- SuperQuilt roll mix ---
  const sqOverlapMM = num(m.superquilt_overlap_mm, 50);
  const sqRollWmm   = num(m.superquilt_roll_width_mm, 1200);
  const coverageFactor = sqRollWmm > 0 ? (sqRollWmm - sqOverlapMM) / sqRollWmm : 1;

  const sqWaste = num(m.superquilt_wastage_pct, 6) / 100;
  const nominalNeeded = +((area_m2_internal / (coverageFactor || 1)) * (1 + sqWaste)).toFixed(2);

  const price12 = num(m.superquilt_12m2_price_ex_vat, 78.90);
  const price15 = num(m.superquilt_15m2_price_ex_vat, 96.60);
  const halfWindow = num(m.superquilt_half_roll_window_m2, 2.0);

  if (nominalNeeded > 0 && (price12 > 0 || price15 > 0)) {
    const mix = chooseRollMix(nominalNeeded, { price12, price15, halfWindow });
for (const r of mix) {
  items.push({
    key: "superquilt",
    name: "SuperQuilt",
    label: r.label,                // e.g. “SuperQuilt 15 m² roll”
    note: `(${r.size_m2} m²)`,     // adds visible size info
    qty: r.count,
    uom: "Roll",
    unit_price: r.unit_ex_vat,
    total: +(r.count * r.unit_ex_vat).toFixed(2),
  });
  total += r.count * r.unit_ex_vat;
}

  }

  return { items, total: +total.toFixed(2) };
}
