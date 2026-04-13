// src/lib/edgeTrimsCalc.js
import { mm, money, lineTotal, pieceCount } from "./roofMath";

/**
 * Lean-to edge trims + membrane
 * - Tile starter (3.0 m lengths): along the external eaves run (front only).
 * - J-Section (5.0 m lengths): front only by default; add a side if that side has a soffit overhang.
 * - Watercourse (2.95 m effective cover): per side that abuts a wall.
 * - Breather membrane: always 1 roll per roof (1 m × 50 m).
 *
 * Inputs we read:
 *  - ext_width_mm
 *  - ext_projection_mm
 *  - pitch_deg (not used directly here, kept for parity)
 *  - leftSide: "exposed" | "wall"
 *  - rightSide: "exposed" | "wall"
 *  - left_overhang_mm (mm) — if > 0, add J-Section on left side
 *  - right_overhang_mm (mm) — if > 0, add J-Section on right side
 *  - finish: "white" | "foiled" — pricing band for J-Section
 *  - tileSystem: "britmet" | "liteslate" — not used here but kept for future
 */
export function computeEdgeTrimsLeanTo(inputs = {}, materials = {}) {
  const extWidthMM = mm(inputs.ext_width_mm);
  const extProjMM  = mm(inputs.ext_projection_mm);
  const leftSide   = String(inputs.leftSide || "exposed").toLowerCase();  // "exposed" | "wall"
  const rightSide  = String(inputs.rightSide || "exposed").toLowerCase();
  const leftOH     = mm(inputs.left_overhang_mm || 0);
  const rightOH    = mm(inputs.right_overhang_mm || 0);
  const finish     = String(
    inputs.finish || inputs.uPVCColour || "white"
  ).toLowerCase();
  const rawColour =
    inputs.plastics_color ||
    inputs.plasticsColour ||
    inputs.uPVCColour ||
    (finish === "white" ? "White" : "Foiled");

  const displayColour = String(rawColour).trim();
  // Stock / pricing
  const tileStarterLenM = Number(materials.tile_starter_stock_length_m ?? 3);

  // J-Section stock length (e.g. 5.0 m)
  const jSectionLenM    = Number(materials.j_section_stock_length_m ?? 5);

  const waterLenMM      = Number(materials.watercourse_piece_cover_mm ?? 2950);

  const tileStarterUnit = Number(materials.tile_starter_price_per_length ?? 0);

  // J-Section price per length from materials (white / foiled)
  const jUnitPrice =
    finish === "foiled"
      ? Number(materials.j_section_price_each_foiled ?? 0)
      : Number(materials.j_section_price_each_white ?? 0);

  const waterUnit = Number(materials.watercourse_price_each ?? 0);
  const membraneUnit = Number(materials.breather_membrane_roll_price_each ?? 0);

  // J-Section weight per 5.0 m length (white / foiled)
  const jWeightEach =
    finish === "foiled"
      ? Number(materials.j_section_weight_kg_each_foiled ?? 0)
      : Number(materials.j_section_weight_kg_each_white ?? 0);

  // --- quantities (rounded to full lengths / pieces)

  // Tile starter: front run only
  const tileStarterRunMM = extWidthMM;
  const tileStarterLengths = Math.ceil(
    tileStarterRunMM / (tileStarterLenM * 1000)
  );

  // J-Section: front always; add left/right side only if that side has a soffit overhang (>0)
  // Side J-Section length equals the external projection.
  let jSectionRunMM = extWidthMM; // front
  if (leftOH > 0)  jSectionRunMM += extProjMM;   // left side
  if (rightOH > 0) jSectionRunMM += extProjMM;   // right side

  const jSectionLengths = Math.ceil(
    jSectionRunMM / (jSectionLenM * 1000)
  );

  // Watercourse: one piece run per wall side (effective cover 2.95 m along the projection)
  const leftWaterPieces  = leftSide  === "wall" ? pieceCount(extProjMM, waterLenMM) : 0;
  const rightWaterPieces = rightSide === "wall" ? pieceCount(extProjMM, waterLenMM) : 0;
  const waterPiecesTotal = leftWaterPieces + rightWaterPieces;

  // Membrane: 1 roll per roof
  const membraneRolls = 1;

  // --- pricing
  const ltTileStarter = lineTotal(tileStarterLengths, tileStarterUnit);
  const ltJSection    = lineTotal(jSectionLengths, jUnitPrice);
  const ltWater       = lineTotal(waterPiecesTotal, waterUnit);
  const ltMembrane    = lineTotal(membraneRolls, membraneUnit);

  const lines = [];

  lines.push({
    key: "tile_starter",
    label: `Tile starter (3.0 m length)`,
    qty: tileStarterLengths,
    qtyDisplay: `${tileStarterLengths} × 3.0 m`,
    unit: tileStarterUnit,
    line: ltTileStarter,
  });

  if (jSectionLengths > 0) {
    lines.push({
      key: "j_section",
      label: `J-Section — ${displayColour}`,
      qty: jSectionLengths,
      qtyDisplay: `${jSectionLengths} × ${jSectionLenM.toFixed(1)} m`,
      unit: jUnitPrice,
      line: ltJSection,

      // Weight per 5.0 m length
      weightPerUnitKg: jWeightEach,
      weightEachKg: jWeightEach,
    });
  }

  if (waterPiecesTotal > 0) {
    lines.push({
      key: "watercourse",
      label: `Watercourse (wall abutment)`,
      qty: waterPiecesTotal,
      qtyDisplay: `${waterPiecesTotal} pcs`,
      unit: waterUnit,
      line: ltWater,
    });
  }

  lines.push({
    key: "membrane",
    label: `Breather membrane (1 m × 50 m roll)`,
    qty: membraneRolls,
    qtyDisplay: `${membraneRolls} Roll`,
    unit: membraneUnit,
    line: ltMembrane,
  });

  const grand = money(lines.reduce((s, r) => s + Number(r.line || 0), 0));

  return {
    meta: {
      extWidthMM,
      extProjMM,
      leftOH,
      rightOH,
      jSectionLenM,
      tileStarterLenM,
      waterLenMM,
    },
    lines,
    grand,
  };
}
