// src/lib/liteslateCalc.js
// Minimal LiteSlate calculator for a Lean-To (no ridge/hips on a basic lean-to)
// Includes: tiles by area and pitch rate, dry verge on exposed ends.

export function computeLiteSlateLeanTo(inputs = {}, materials = {}) {
  const run_mm        = Number(inputs.run_mm) || 0;         // external width
  const projection_mm = Number(inputs.projection_mm) || 0;  // external projection
  const slope_mm      = Number(inputs.slope_mm) || 0;       // rafter/slope length
  const pitch_deg     = Number(inputs.pitch_deg) || 0;
  // Accept either boolean flags (left_exposed/right_exposed) OR side strings (leftSide/rightSide)
const left_exposed =
  typeof inputs.left_exposed === "boolean"
    ? inputs.left_exposed
    : String(inputs.leftSide || inputs.left_side || "").toLowerCase() === "exposed";

const right_exposed =
  typeof inputs.right_exposed === "boolean"
    ? inputs.right_exposed
    : String(inputs.rightSide || inputs.right_side || "").toLowerCase() === "exposed";

  // Defaults if not set in Materials (so it still works immediately)
  const price_tile_each         = Number(materials.liteslate_tile_price_each) || 1.81;
  const price_dry_verge_2m      = Number(materials.liteslate_dry_verge_2m_price) || 14.86;
  const waste_pct               = Number(materials.liteslate_waste_pct) || 8; // optional
  const wt_tile_each            = Number(materials.liteslate_tile_weight_kg_each ?? 0);
  const wt_dry_verge_each       = Number(materials.liteslate_dry_verge_weight_kg_each ?? 0);


  // Pieces per m² based on pitch:
  // 12–25° => 22/m², >25–27° => 20/m², >27–30° => 19/m², >30° => 18/m²
  let ratePerM2 = 22;
  if (pitch_deg > 30)       ratePerM2 = 18;
  else if (pitch_deg > 27)  ratePerM2 = 19;
  else if (pitch_deg > 25)  ratePerM2 = 20;
  else                      ratePerM2 = 22;

  // Area in m²
  const area_m2 = Math.max(0, (run_mm * projection_mm) / 1_000_000);

  // Tiles count (with waste)
  const tiles_raw = area_m2 * ratePerM2;
  const tiles_waste = tiles_raw * (waste_pct / 100);
  const tiles_qty = Math.ceil(tiles_raw + tiles_waste);

  const tiles_line = tiles_qty * price_tile_each;

  // Dry verge (2.0 m) for each exposed end along the slope
const verge_len_m = Math.max(0, slope_mm / 1000);

// Raw pieces per side (can be fractional)
const raw_verge_per_side = verge_len_m / 2.0;

// Allow half-lengths: 0.5, 1.0, 1.5, 2.0, etc.
const verge_pcs_per_side = Math.ceil(raw_verge_per_side * 2) / 2;

const left_verge_pcs  = left_exposed  ? verge_pcs_per_side : 0;
const right_verge_pcs = right_exposed ? verge_pcs_per_side : 0;
const verge_total_pcs = left_verge_pcs + right_verge_pcs;

const verge_line = verge_total_pcs * price_dry_verge_2m;


  const lines = [];

  if (tiles_qty > 0) {
    lines.push({
      key: "ls_tiles",
      label: `LiteSlate tiles (${ratePerM2}/m² @ ${pitch_deg.toFixed(1)}°)`,
      qty: tiles_qty,
      qtyDisplay: `${tiles_qty} pcs`,
      unit: price_tile_each,
      line: tiles_line,
       // 🔹 weight per tile (kg)
      weightPerUnitKg: wt_tile_each,
      weightEachKg: wt_tile_each,
    });
  }

  if (verge_total_pcs > 0) {
    lines.push({
      key: "ls_verge",
      label: "Dry Verge 2m",
      qty: verge_total_pcs,
      qtyDisplay: `${verge_total_pcs} pcs`,
      unit: price_dry_verge_2m,
      line: verge_line,
      // 🔹 weight per 2m verge piece (kg)
      weightPerUnitKg: wt_dry_verge_each,
      weightEachKg: wt_dry_verge_each,
    });
  }

  const grand = tiles_line + verge_line;

  return {
    meta: {
      ratePerM2,
      area_m2,
      waste_pct,
      counts: {
        tiles: tiles_qty,
        dry_verge_pcs: verge_total_pcs,
      },
    },
    lines,
    grand,
  };
}
