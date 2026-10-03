import { buildHippedMiscellaneousIntegrationAudit } from "./miscellaneousIntegrationAudit";
import { integrateMiscellaneousSummary } from "./miscellaneousSummaryIntegration";
import { integrateMetalSummaryWatercourse } from "./metalSummaryIntegration";
import { buildHippedGutteringIntegrationAudit } from "./gutteringIntegrationAudit";
import { integrateGutteringSummary } from "./gutteringSummaryIntegration";
import { applyWeightsToLines, getFixedProductWeightKg } from "../utils/weights";
import { calculateLeanToGeometry } from "../geometry/leanToGeometry";
import { buildHippedLeanToTotals } from "../hippedLeanToTotals";
import { calculateHippedLeanToGeometry } from "../geometry/hippedLeanToGeometry";
import { buildAutomaticRoofTiling } from "./automaticRoofTiling";
import { applyUniversalTilingToSummaryLines, selectSummaryExternalFixingLathM } from "./summaryTilingBOM";
import { buildHipRidgeLathIntegrationAudit } from "./hipRidgeLathIntegrationAudit";
import { buildHippedPlasticsIntegrationAudit } from "./plasticsIntegrationAudit";
import { integratePlasticsSummary } from "./plasticsSummaryIntegration";
import { selectHipRidgeLathSummaryContribution } from "./hipRidgeLathSummaryIntegration";
import { buildAutomaticRoofEdgeBOM } from "./automaticRoofEdgeBOM";
import { applyAutomaticEdgeBOMToSummaryLines, applyAutomaticHipBOMToSummaryTileLines } from "./summaryEdgeBOM";
import { buildProvisionalHippedLeanToTimber } from "./provisionalHippedLeanToTimber";
import { buildHippedLeanToRingBeamSchedule } from "../Manufacturing/ringBeamManufactureSchedule";
import { selectRingBeamSummaryQuantities } from "./ringBeamSummaryIntegration";
import { buildHippedWallplateIntegrationAudit } from "./wallplateIntegrationAudit";
import { selectWallplateSummaryQuantities } from "./wallplateSummaryIntegration";
import { externalFacetAreaM2, coveringWeightRates, apportionInstalledWeight } from "./installedCoveringWeights";
import { buildHippedLeanToInsulationAudit } from "./insulationIntegrationAudit";
import { buildLeanToTotals } from "../leanToTotals";
import { buildSummaryAddedItemLines } from "./summaryAddedItems";

const firstPositiveNumber = (...values) => {
  for (const v of values) {
    if (v == null) continue;
    const n =
      typeof v === "string"
        ? parseFloat(v.replace(/[^0-9.+-]/g, ""))
        : Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
};

// Normalise quantity for all lines (timber + tiles)
const asQty = (line) => {
  if (line.isAddedItem || (line.qty != null && Number(line.qty) === 0)) return Number(line.qty) || 0;
  return firstPositiveNumber(
    line.qty,
    line.count,
    line.lengths,
    line.pieces,
    line.tiles,
    line.panels,
    line.courses,
    line.qtyValue,
    line.quantity,
    line.qtyLabel,
    line.label // last-ditch fallback
  );
};
const applyAdjustmentsToLines = (lines = [], adjustments = {}) => {
  return (lines || []).map((r) => {
    if (r.isAddedItem) return r;
    const rawQty = asQty(r);
    const parsedAdj = Number(adjustments[r.key]);
    const adj = Number.isFinite(parsedAdj) ? parsedAdj : 0;

    if (!Number.isFinite(rawQty) || adj === 0) return r;

    const newQty = Math.max(0, rawQty + adj);
    const ratio = rawQty > 0 ? newQty / rawQty : 1;

    const oldCost = asCost(r);
    const oldWeight = lineWeightKg(r);

    return {
      ...r,
      qty: newQty,

      // cost fields
      line: Number((oldCost * ratio).toFixed(2)),
      total: Number((oldCost * ratio).toFixed(2)),
      cost: Number((oldCost * ratio).toFixed(2)),
      totalCost: Number((oldCost * ratio).toFixed(2)),

      // weight fields
      weight_kg: Number((oldWeight * ratio).toFixed(2)),
      weightKg: Number((oldWeight * ratio).toFixed(2)),
      totalWeightKg: Number((oldWeight * ratio).toFixed(2)),
      total_weight_kg: Number((oldWeight * ratio).toFixed(2)),
    };
  });
};
// Normalise unit price (from materials.js)
const asUnitWeightKg = (line) => {
  return firstPositiveNumber(
    line.weightPerUnitKg,
    line.weightEachKg,
    line.weight_per_each_kg,
    line.weight_per_m_kg,
    line.weightPerMKg,
    line.weight_kg_each,      // 👈 what guttersCalc / guttersWithWeights use
    line.weight_kg_per_m      // 👈 handy if we ever use /m weights
  );
};
// Normalise unit price (from materials.js)
const asUnitPrice = (line) => {
  return firstPositiveNumber(
    line.unitPrice,
    line.priceEach,
    line.price_per_each,
    line.price_per_m,
    line.pricePerM,
    line.rate,
    line.unit,
    line.unit_price
  );
};

// Line cost = qty * unitPrice, with backward-compat fallbacks
const asCost = (line) => {
  if (line.qty != null && Number(line.qty) === 0) return 0;
  // Explicit audited row totals, including configured zero prices, take precedence.
  for (const value of [line.line, line.cost, line.totalCost, line.total_cost, line.total]) {
    if (value != null && Number.isFinite(Number(value))) return Number(Number(value).toFixed(2));
  }
  return Number((asQty(line) * asUnitPrice(line)).toFixed(2));
};

// Total line weight (kg) – prefer explicit totals, then qty × per-unit weight
const lineWeightKg = (line) => {
  // 1) If the line explicitly gives a total weight, trust that first
  const directWeightCandidates = [
    line.totalWeightKg,
    line.total_weight_kg,
    line.weightKg,
    line.weight_kg,
  ];

  for (const v of directWeightCandidates) {
    if (v == null) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n !== 0) {
      return n;
    }
  }

  // 2) Otherwise, fall back to qty × per-unit weight
  const qty = asQty(line);
  const unitWeight = asUnitWeightKg(line);

  if (qty && unitWeight) {
    return +(qty * unitWeight).toFixed(2);
  }

  return 0;
};



// Shared audited bill of materials for Summary, Design/Options and quotation saving.
// Adjustments/exclusions are applied to rows exactly once; no cached price deltas.
export function normalizeSummaryInputs(source = {}) {
  const width = Number(source.internalWidthMM ?? source.widthMM ?? 0);
  const projection = Number(source.internalProjectionMM ?? source.projMM ?? 0);
  const soffit = Number(source.soffit_mm ?? source.eavesOverhangMM ?? source.eaves_overhang_mm ?? 150);
  const leftWall = typeof source.leftWall === 'boolean' ? source.leftWall : source.left_exposed === false;
  const rightWall = typeof source.rightWall === 'boolean' ? source.rightWall : source.right_exposed === false;
  return { ...source, internalWidthMM:width, widthMM:width, internalProjectionMM:projection, projMM:projection,
    soffit_mm:soffit, eavesOverhangMM:soffit,
    tile_system:source.tileSystem ?? source.tile_system ?? 'britmet',
    tileSystem:source.tileSystem ?? source.tile_system ?? 'britmet',
    plastics_color:source.plasticsColor ?? source.plastics_color ?? 'white',
    plasticsColor:source.plasticsColor ?? source.plastics_color ?? 'white',
    leftWall,rightWall,left_exposed:!leftWall,right_exposed:!rightWall };
}
export function buildSummaryMaterialsModel({ inputs = {}, materials = {}, exclusions = {}, adjustments = {}, addedItems = inputs.summaryAddedItems || [] } = {}) {
  inputs = normalizeSummaryInputs(inputs);
  const m = { ...materials, include_rafters_pir_cradle_in_rafters: false };
  const addedLines = buildSummaryAddedItemLines(addedItems, m);
  const isExcluded = key => String(key || '').startsWith('extra:')
    ? !!addedLines.find(row => row.key === key)?.extraExcluded : !!exclusions[key];
  const withAddedItems = (lines, section) => [...lines, ...addedLines.filter(row => row.section === section)];
  const lineWeightKg = (r) => {

  if (!r || r.isAddedItem) return 0;

  // 1) If the row already has a TOTAL weight field, use it
  const total =
    r.weight_kg ??
    r.weightKg ??
    r.totalWeightKg ??
    r.total_weight_kg ??
    r.weight ??
    null;

  const totalNum = Number(total);
  if (Number.isFinite(totalNum) && totalNum > 0) return totalNum;

  // 2) If it has a PER-UNIT weight, multiply by order_qty/qty
  const unit =
    r.weight_kg_each ??
    r.unitWeightKg ??
    r.weightKgEach ??
    r.weightEachKg ??
    null;

  const unitNum = Number(unit);
  if (Number.isFinite(unitNum) && unitNum > 0) {
    const q = Number(r.order_qty ?? r.orderQty ?? r.qty ?? 0) || 0;
    return Number((q * unitNum).toFixed(2));
  }

  // 3) Otherwise: derive per-unit weight from Materials (m) using key+label text
  // IMPORTANT: this is what brings Tile/Plastics weights back even if calculators stopped outputting weight fields.
  const key = String(r.key || "").toLowerCase();
  const txt = `${String(r.key || "")} ${String(r._k || "")} ${String(r.label || "")} ${String(r.name || "")}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const unitWeightFromM = (() => {
    // ---- Tiles (Britmet / LiteSlate) ----
    // Main tiles row (often key "tiles")
    if (key === "tiles" || (txt.includes(" tiles") && !txt.includes("ridge") && !txt.includes("verge") && !txt.includes("barge"))) {
      if (txt.includes("liteslate")) {
        return Number(
          m?.tile_liteslate_weight_kg ??
          m?.liteslate_tile_weight_kg ??
          0
        );
      }
      return Number(
        m?.tile_britmet_weight_kg ??
        m?.britmet_tile_weight_kg ??
        0
      );
    }

    // Ridge tile
    if (txt.includes("ridge")) {
      if (txt.includes("liteslate")) {
        return Number(
          m?.liteslate_ridge_tile_weight_kg ??
          m?.ridge_tile_liteslate_weight_kg ??
          0
        );
      }
      return Number(
        m?.britmet_ridge_tile_weight_kg ??
        m?.ridge_tile_britmet_weight_kg ??
        0
      );
    }

    // Barge / Verge / Dry verge
    if (txt.includes("barge") || txt.includes("verge")) {
      if (txt.includes("dry") || txt.includes("liteslate")) {
        return Number(
          m?.dry_verge_weight_kg ??
          m?.liteslate_dry_verge_weight_kg ??
          0
        );
      }
      return Number(
        m?.barge_2part_weight_kg ??
        m?.verge_trim_weight_kg ??
        0
      );
    }

    // Touch-up kit
    if (txt.includes("touch")) {
      if (txt.includes("liteslate")) {
        return Number(m?.touchup_kit_liteslate_weight_kg ?? m?.touchup_kit_weight_kg ?? 0);
      }
      return Number(m?.touchup_kit_britmet_weight_kg ?? m?.touchup_kit_weight_kg ?? 0);
    }

    // Vent strip (tile accessory)
    if (txt.includes("vent strip")) {
      return Number(m?.vent_strip_weight_kg ?? m?.tile_vent_strip_weight_kg ?? 0);
    }

    // Adaptors / caps (if you’ve got these weights in Materials, add the exact keys later)
    if (txt.includes("adaptor") || txt.includes("adapter")) {
      return Number(
        m?.adaptor_weight_kg ??
        m?.y_adaptor_weight_kg ??
        m?.five_way_adaptor_weight_kg ??
        m?.universal_ridge_adaptor_weight_kg ??
        m?.ridge_hip_adaptor_weight_kg ??
        0
      );
    }

    if (txt.includes("end cap") || txt.includes("hip end cap") || txt.includes("gable end cap")) {
      return Number(
        m?.end_cap_weight_kg ??
        m?.hip_end_cap_weight_kg ??
        m?.gable_end_cap_weight_kg ??
        0
      );
    }

        // ---- Plastics & gutters (key-based, matches YOUR materials.js keys) ----
    switch (key) {
      // ===== Plastics =====

      case "fascia": {
        const isFoiled =
          /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
        const perM = Number(
          isFoiled
            ? m?.fascia_weight_kg_per_m_foiled
            : m?.fascia_weight_kg_per_m_white
        ) || 0;
        const lenM = Number(m?.fascia_stock_length_m ?? 5) || 5;
        return Number((perM * lenM).toFixed(3)); // kg per 5m length
      }

      case "soffit": {
        const isFoiled =
          /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
        const perM = Number(
          isFoiled
            ? m?.soffit_weight_kg_per_m_foiled
            : m?.soffit_weight_kg_per_m_white
        ) || 0;
        const lenM = Number(m?.soffit_stock_length_m ?? 5) || 5;
        return Number((perM * lenM).toFixed(3)); // kg per 5m length
      }

      case "j_section": {
        const isFoiled =
          /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
        return (
          Number(
            isFoiled
              ? m?.j_section_weight_kg_each_foiled
              : m?.j_section_weight_kg_each_white
          ) || 0
        );
      }

      // you don't have a vent fascia weight key yet
      case "vent":
      case "end_fascia":
      case "fascia_corners":
        return 0;

            // ===== Guttering =====
      case "g_len":
        return Number(
          m?.gutter_length_weight_kg ??
          m?.gutter_len_weight_kg_each ??
          m?.gutter_len_weight_kg ??
          0
        ) || 0;

      case "g_union":
        return Number(
          m?.gutter_union_weight_kg ??
          m?.gutter_union_weight_kg_each ??
          0
        ) || 0;

      case "g_brkt":
        return Number(
          m?.gutter_bracket_weight_kg ??
          m?.gutter_bracket_weight_kg_each ??
          0
        ) || 0;

      case "g_outlet":
        return Number(
          m?.gutter_outlet_weight_kg ??
          m?.running_outlet_weight_kg_each ??
          m?.gutter_running_outlet_weight_kg ??
          0
        ) || 0;

      case "g_stop":
        return Number(
          m?.gutter_stop_end_weight_kg ??
          m?.stop_end_weight_kg_each ??
          m?.gutter_stop_end_weight_kg_each ??
          0
        ) || 0;

      // Downpipes
      case "dp_len":
        return Number(
          m?.downpipe_length_weight_kg ??
          m?.dp_length_weight_kg_each ??
          0
        ) || 0;

      case "dp_bend":
        return Number(
          m?.downpipe_bend_weight_kg ??
          m?.dp_bend_weight_kg_each ??
          0
        ) || 0;

      case "dp_shoe":
        return Number(
          m?.downpipe_shoe_weight_kg ??
          m?.dp_shoe_weight_kg_each ??
          0
        ) || 0;

      case "dp_clip":
        return Number(
          m?.downpipe_clip_weight_kg ??
          m?.dp_clip_weight_kg_each ??
          0
        ) || 0;

      case "dp_adapt":
        return Number(
          m?.downpipe_adaptor_weight_kg ??
          m?.dp_adaptor_weight_kg_each ??
          m?.dp_adapt_weight_kg_each ??
          0
        ) || 0;


      // ===== fallback to your existing text-based misc mapping =====
      default:
        break;
    }

    // ---- Fallback text-based weight mapping (expanded) ----

// SuperQuilt (support 12/15 by label, and fallback to options)
if (txt.includes("superquilt")) {
  const SQ12 = (m?.superquilt_options || []).find((o) => Number(o?.coverage_m2) === 12);
  const SQ15 = (m?.superquilt_options || []).find((o) => Number(o?.coverage_m2) === 15);

  const opt =
    txt.includes("15") ? SQ15 :
    txt.includes("12") ? SQ12 :
    (SQ12 || SQ15);

  return Number(m?.superquilt_roll_weight_kg ?? opt?.weight_kg_per_roll ?? 0);
}

// Breather membrane (roll)
if (txt.includes("breather")) {
  return Number(m?.breather_roll_weight_kg ?? m?.breatherMembrane?.weight_kg_per_roll ?? 0);
}

// 100mm PIR insulation (per sheet) — weight is m²-based
if (txt.includes("slab100")) {
  const w = Number(m?.pir100_weight_kg_per_m2 ?? m?.pir100?.weight_kg_per_m2 ?? 0);
  const A = Number(m?.pir100?.sheet_w_m ?? 1.2) * Number(m?.pir100?.sheet_h_m ?? 2.4);
  return Number((w * A).toFixed(3)); // kg per sheet
}

// Foam
if (txt.includes("expanding") && txt.includes("can"))
  return Number(m?.expanding_foam_can_weight_kg_each ?? 0);

if (txt.includes("expanding") && txt.includes("roll"))
  return Number(m?.expanding_foam_roll_weight_kg_each ?? 0);

// Tapes
if (txt.includes("aluminium") || txt.includes("alu"))
  return Number(m?.aluminium_tape_roll_weight_kg_each ?? 0);

if (txt.includes("duct"))
  return Number(m?.duct_tape_roll_weight_kg_each ?? 0);

// EPDM
if (txt.includes("epdm"))
  return Number(m?.epdm_rubber_weight_kg_per_m2 ?? 0);

// Adhesives
if (txt.includes("deck") && txt.includes("adhesive"))
  return Number(m?.deck_adhesive_2_5l_weight_kg_each ?? 0);

if (txt.includes("bond") && txt.includes("2.5"))
  return Number(m?.bond_adhesive_2_5l_weight_kg_each ?? 0);

if (txt.includes("bond") && txt.includes("can"))
  return Number(m?.bond_adhesive_can_weight_kg_each ?? 0);

// Pins / screws boxes
if (txt.includes("polytop"))
  return Number(m?.polytop_pins_weight_kg_per_box ?? 0);

if (txt.includes('1"') || txt.includes("1x8") || txt.includes("1×8") || txt.includes("screws_1x8"))
  return Number(m?.screws_1x8_weight_kg_per_box ?? 0);

if (txt.includes('2"') || txt.includes("2x8") || txt.includes("2×8") || txt.includes("screws_2x8"))
  return Number(m?.screws_2x8_weight_kg_per_box ?? 0);

if (txt.includes('3"') || txt.includes("3x10") || txt.includes("3×10") || txt.includes("screws_3x10"))
  return Number(m?.screws_3x10_weight_kg_per_box ?? 0);

if (txt.includes("drywall") && (txt.includes("32") || txt.includes("32mm")))
  return Number(m?.drywall_screws_32mm_weight_kg_per_box ?? 0);

if (txt.includes("drywall") && (txt.includes("50") || txt.includes("50mm")))
  return Number(m?.drywall_screws_50mm_weight_kg_per_box ?? 0);

if (txt.includes("concrete"))
  return Number(m?.concrete_screws_weight_kg_per_box ?? 0);

// Older misc items already present in your first block
if (txt.includes("watercourse"))
  return Number(m?.watercourse_weight_kg ?? m?.watercourse?.weight_kg_per_piece ?? 0);

if (txt.includes("eaves guard"))
  return Number(m?.eaves_guard_weight_kg ?? m?.eavesGuard?.weight_kg_per_piece ?? 0);

return 0;

  })();

  const unitW = Number(unitWeightFromM) || 0;
  if (unitW <= 0) return 0;

  const q = Number(r.order_qty ?? r.orderQty ?? r.qty ?? 0) || 0;
  return Number((q * unitW).toFixed(2));
};


  // ---------- derive basics from inputs ----------

  const iw = Number(inputs.internalWidthMM || inputs.widthMM || 0);
  const ip = Number(inputs.internalProjectionMM || inputs.projMM || 0);
  const pitchDeg = Number(inputs.pitchDeg || inputs.pitch || 15);
  // 🔷 Shared geometry (NEW)
const sharedGeom = calculateLeanToGeometry({
  widthMM: iw,
  projectionMM: ip,
  pitchDeg,
  soffitDepthMM: Number(inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150),
  materials: m,
});
  const tileSystem = String(
    inputs.tile_system || inputs.tileSystem || "britmet"
  ).toLowerCase();

    // ---------- shared external geometry for Summary ----------

  const sft =
    Number(inputs.side_frame_thickness_mm) ||
    Number(m.side_frame_thickness_mm) ||
    70;

  const lip =
    Number(inputs.fascia_lip_mm) ||
    Number(m.fascia_lip_mm) ||
    25;

  const soff =
  Number(sharedGeom.soffitDepthEffective ?? inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150);

  const frameOn =
    Number(inputs.frame_on_mm) ||
    Number(m.frame_on_mm) ||
    70;

  // External sizes
  const extWidthMM = iw + 2 * (sft + lip);
  const extWidthM = extWidthMM / 1000;

  const extProjectionMM = ip + soff + frameOn;
  const extProjectionM = extProjectionMM / 1000;

  // ---------- TIMBER GEOMETRY (declare BEFORE any use) ----------
  // --- REQUIRED geometry values (fix missing vars) ---
const frameOnMM = Number(inputs.frame_on_mm ?? m.frame_on_mm ?? 70);
const thetaRad = (pitchDeg * Math.PI) / 180 || 0;

// 🔥 CRITICAL: use shared geometry for rafter length
const timberRafterLenMM = Number(sharedGeom.rafterExternalLength ?? 0);
const isHippedLeanToEarly =
  (inputs.roofStyle ?? inputs.roof_style ?? "leanTo") === "hippedLeanTo";

const hippedGeomEarly = isHippedLeanToEarly
  ? calculateHippedLeanToGeometry({
      widthMM: iw,
      projectionMM: ip,
      pitchDeg,
      soffitDepthMM: Number(inputs.eavesOverhangMM ?? inputs.soffit_mm ?? 150),
      materials: m,
      hippedSides: inputs.hippedSides ?? "both",
      leftHipWidthMM: Number(inputs.leftHipWidthMM ?? inputs.left_hip_width_mm ?? 0),
      rightHipWidthMM: Number(inputs.rightHipWidthMM ?? inputs.right_hip_width_mm ?? 0),
      requestedLeftSidePitchDeg:
        inputs.requestedLeftSidePitchDeg ?? null,
      requestedRightSidePitchDeg:
        inputs.requestedRightSidePitchDeg ?? null,
      sideSoffitMode: inputs.sideSoffitMode ?? "automatic",
      sideSoffitControlSide:
        inputs.sideSoffitControlSide ?? "left",
      specifiedSideSoffitMM:
        inputs.specifiedSideSoffitMM ?? null,
    })
  : null;
  const timberSpacing   = Number(m.rafter_spacing_mm ?? 665);
  const timberFirstCtr  = Number(m.rafter_first_center_mm ?? 690);

  let timberCentresCount = 0;
  if (iw > 0 && timberSpacing > 0 && timberFirstCtr > 0) {
    for (let c = timberFirstCtr; c <= iw; c += timberSpacing) {
      timberCentresCount++;
    }
  }

  // Edge rafters added (+2)
  const raftersCount = Math.max(2, timberCentresCount + 2);

  const hippedRingBeamSchedule = isHippedLeanToEarly
    ? buildHippedLeanToRingBeamSchedule({ geometry: hippedGeomEarly })
    : null;

  const legacyRingBeamBaseAreaM2 =
    extWidthM *
    ((Number(inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150) + 70) /
      1000);
  const legacyRingBeamUpstandAreaM2 = extWidthM * 0.195;
  const legacyRingBeamFinishingLathM =
    Math.max(0, raftersCount - 1) * 0.617;
  const legacyRingBeamPirAreaM2 = extWidthM * 0.185;

  const integratedRingBeam = selectRingBeamSummaryQuantities({
    isHippedLeanTo: isHippedLeanToEarly,
    legacy: {
      pse30x90LengthM: extWidthM,
      ply9BaseAreaM2: legacyRingBeamBaseAreaM2,
      ply9UpstandAreaM2: legacyRingBeamUpstandAreaM2,
      outerFixingLath25x50LengthM: 0,
      finishingLath25x50LengthM: legacyRingBeamFinishingLathM,
      pir50AreaM2: legacyRingBeamPirAreaM2,
    },
    ringSchedule: hippedRingBeamSchedule,
  });

  const legacyWallplatePly9AreaM2 = extWidthM * 0.22;
  const legacyWallplatePly18AreaM2 = extWidthM * 0.142;
  const wallplateIntegrationAudit = isHippedLeanToEarly
    ? buildHippedWallplateIntegrationAudit({
        geometry: hippedGeomEarly,
        currentSummaryExternalWidthMM: extWidthMM,
      })
    : null;
  const integratedWallplate = selectWallplateSummaryQuantities({
    isHippedLeanTo: isHippedLeanToEarly,
    legacy: {
      steicoLengthM: extWidthM,
      ply9AreaM2: legacyWallplatePly9AreaM2,
      ply18AreaM2: legacyWallplatePly18AreaM2,
    },
    wallplateAudit: wallplateIntegrationAudit,
  });

  const plainRafterQty = isHippedLeanToEarly
  ? Number(hippedGeomEarly?.plainRafterCount ?? 0)
  : raftersCount;

const leftJackRafterQty = isHippedLeanToEarly
  ? Number(hippedGeomEarly?.leftJackRafterCount ?? 0)
  : 0;

const rightJackRafterQty = isHippedLeanToEarly
  ? Number(hippedGeomEarly?.rightJackRafterCount ?? 0)
  : 0;

const leftSideIntermediateJackQty = isHippedLeanToEarly
  ? Number(
      hippedGeomEarly?.leftSideIntermediateJackCount ?? 0
    )
  : 0;

const rightSideIntermediateJackQty = isHippedLeanToEarly
  ? Number(
      hippedGeomEarly?.rightSideIntermediateJackCount ?? 0
    )
  : 0;

const jackRafterQty =
  leftJackRafterQty +
  rightJackRafterQty +
  leftSideIntermediateJackQty +
  rightSideIntermediateJackQty;

const joistHangerQty = isHippedLeanToEarly
  ? plainRafterQty
  : raftersCount;

  // Rafter length at pitch (to front)

// ---------- PIR 50mm cradle on rafter webs (NOT baked into rafters) ----------
// Ends are single-face, interior rafters are double-face
const cradleStripWidthMM = 140; // web height for 220 Steico: 220 - 40 - 40

// length per face: from wallplate to inside of ring-beam (exclude eaves overhang)
const cradleProjectionMM = ip + frameOnMM; // deliberately NOT including eavesOverhangMM
const cradleLenPerFaceMM = cradleProjectionMM / (Math.cos(thetaRad) || 1);

// faces: (raftersCount - 2) interior rafters *2 faces + 2 end rafters *1 face
const cradleFaces = Math.max(0, (raftersCount >= 2 ? (2 * raftersCount - 2) : 0));

const cradleTotalLenM = (cradleFaces * cradleLenPerFaceMM) / 1000;
const cradleAreaM2_raw = cradleTotalLenM * (cradleStripWidthMM / 1000);

const cradleWastePct = Number(m?.pir50?.waste_pct ?? 0) || 0;
const cradleAreaM2 = cradleAreaM2_raw * (1 + cradleWastePct / 100);

const pir50SheetAreaM2 =
  Number(m?.pir50?.sheet_w_m ?? 1.2) * Number(m?.pir50?.sheet_h_m ?? 2.4);

const cradleOrderQty =
  pir50SheetAreaM2 > 0 ? Math.ceil(cradleAreaM2 / pir50SheetAreaM2) : 0;

const cradleWeightKg =
  cradleAreaM2 * (Number(m?.pir50?.weight_kg_per_m2 ?? 0) || 0);


// ---------- Steico joists + 25x50 laths (Summary only) ----------

// Wallplate runs along external width
const wallplate_m = integratedWallplate.quantities.steicoLengthM;

const provisionalHippedTimber = isHippedLeanToEarly
  ? buildProvisionalHippedLeanToTimber({
      roofInputs: inputs,
      geometry: hippedGeomEarly,
    })
  : null;

// Hipped roofs use the classified manufacturing members and their actual
// internal slope lengths. The established ordinary Lean-To calculation below
// remains unchanged.
const hippedInsulationIntegration = isHippedLeanToEarly
  ? buildHippedLeanToInsulationAudit({
      roofInputs: inputs,
      geometry: hippedGeomEarly,
      ringSchedule: hippedRingBeamSchedule,
      timberSchedule: provisionalHippedTimber,
      memberWidthMM: 48,
      cradleStripWidthMM: 140,
      wastePercent: Number(
        m?.slab100_wastage_pct ?? m?.pir50?.waste_pct ?? 5
      ),
      sheetWidthMM: Number(m?.pir100?.sheet_w_m ?? 1.2) * 1000,
      sheetLengthMM: Number(m?.pir100?.sheet_h_m ?? 2.4) * 1000,
      internalLathCentresMM: Number(inputs?.int_lath_centres_mm ?? 400),
      superQuiltOverlapMM: Number(m?.superquilt_overlap_mm ?? 50),
      superQuiltWastePercent: Number(m?.superquilt_wastage_pct ?? 6),
      superQuiltRollWidthMM: Number(m?.superquilt_roll_width_mm ?? 1200),
      superQuilt12Price: Number(
        m?.superquilt_12m_price_each ??
          m?.superquilt_12m2_price_ex_vat ??
          0
      ),
      superQuilt15Price: Number(
        m?.superquilt_15m_price_each ??
          m?.superquilt_15m2_price_ex_vat ??
          0
      ),
    })
  : null;

// Ordinary Lean-To rafters retain their established calculation. A Hipped
// Lean-To instead totals the individually classified full rafters, jacks and
// hips so that ring-beams sharing the R-series cannot enter the Steico total.
const raftersTotal_m = isHippedLeanToEarly
  ? Number(
      provisionalHippedTimber?.totals?.steicoRoofMemberLengthMM ?? 0
    ) / 1000
  : (raftersCount * timberRafterLenMM) / 1000;

// Total Steico length = rafters + wallplate
let steicoTotal_m = raftersTotal_m + wallplate_m;

// Pull price & weight per metre from materials
const steicoPricePerM = Number(m.steico?.price_per_m ?? 0);
const steicoWeightPerM = Number(m.steico?.weight_kg_per_m ?? 0);

// Stock length for Steico
const steicoStockLenM = Number(m.steico?.stock_len_m ?? 12);

// How many bars to order
const steicoOrderQty =
  steicoStockLenM > 0 ? Math.ceil(steicoTotal_m / steicoStockLenM) : 0;
  // ---------- 30×90 PSE ring-beam timber ----------
// Continuous run along external width
const pseRingBeamLen_m =
  integratedRingBeam.quantities.pse30x90LengthM;

// Price, weight, and stock from materials
const psePricePerM = Number(m.pse30x90?.price_per_m ?? 0);
const pseWeightPerM = Number(m.pse30x90?.weight_kg_per_m ?? 0);
const pseStockLenM  = Number(m.pse30x90?.stock_len_m ?? 4.8) || 4.8;

// Bars to order (can be joined if > stock length)
const pseOrderQty =
  pseStockLenM > 0 ? Math.ceil(pseRingBeamLen_m / pseStockLenM) : 0;

  // ---------- 9mm Structural Ply (wallplate + ring-beam) ----------
// 1) Ring-beam base/soffit ply
const soffitStrip_m2 = integratedRingBeam.quantities.ply9BaseAreaM2;

// 2) Wallplate full-face strip (220 mm high along external width)
const wallplateFace_m2 = integratedWallplate.quantities.ply9AreaM2;

// 3) Ring-beam upstand ply
const ringBeamUpstands_m2 =
  integratedRingBeam.quantities.ply9UpstandAreaM2;

// 50mm PIR on the inside faces of ring-beam upstands
const pir50Upstands_m2 = integratedRingBeam.quantities.pir50AreaM2;

// Total 9 mm ply area used
const totalPly9_m2 = soffitStrip_m2 + wallplateFace_m2 + ringBeamUpstands_m2;

// 9 mm ply pricing/weight from materials
const ply9PricePerM2 = Number(m.ply9mm?.price_per_m2 ?? 0);
const ply9WeightPerM2 = Number(m.ply9mm?.weight_kg_per_m2 ?? 0);

// Sheet size and order quantity (how many sheets to buy)
const ply9SheetLenM = Number(m.ply9mm?.sheet_len_m ?? 2.4);
const ply9SheetWidthM = Number(m.ply9mm?.sheet_width_m ?? 1.2);
const ply9SheetAreaM2 = ply9SheetLenM * ply9SheetWidthM || 0;

const ply9OrderQty =
  ply9SheetAreaM2 > 0 ? Math.ceil(totalPly9_m2 / ply9SheetAreaM2) : 0;
  // ---------- 18mm ply (wallplate internal infill only, for now) ----------

  // 18mm ply pricing/weight from materials
  const ply18PricePerM2 = Number(m.ply18mm?.price_per_m2 ?? 0);
  const ply18WeightPerM2 = Number(m.ply18mm?.weight_kg_per_m2 ?? 0);

  // sheet dimensions for ordering
  const ply18SheetLenM = Number(m.ply18mm?.sheet_len_m ?? 2.4);
  const ply18SheetWidthM = Number(m.ply18mm?.sheet_width_m ?? 1.2);
  const ply18SheetArea_m2 = ply18SheetLenM * ply18SheetWidthM || 2.88;

  // Wallplate internal infill strip:
  // height = clear between Steico flanges ≈ 142 mm -> 0.142 m
  const ply18WallplateInfillArea_m2 =
    integratedWallplate.quantities.ply18AreaM2;

  // For now we only include this contribution; we can add ring-beam supports later
  const totalPly18_m2 = Math.max(0, ply18WallplateInfillArea_m2);

  // Sheets to order
  const ply18OrderQty =
    ply18SheetArea_m2 > 0 ? Math.ceil(totalPly18_m2 / ply18SheetArea_m2) : 0;


  // ---------- Timber Elements (rafters & joists) ----------

  const totalRafterRunMM = raftersCount * timberRafterLenMM;
  const wallplateMM = extWidthMM;            // reuse shared external width
  const totalTimberMM = totalRafterRunMM + wallplateMM;


  // ---------- 25×50 laths (external + internal + chamfer) ----------

  // External width run (front)
  const intWidthM = iw / 1000;

  // Slope length already known from timberRafterLenMM (mm)
  const slopeLenMM = timberRafterLenMM;

  // Tile gauge (mm) – fallback to 250 if not set
  const gaugeMM = Number(inputs.gauge_mm || m.tile_britmet_gauge_mm || 250);

  // Number of tile courses up the slope
  const tileCourses =
    pitchDeg > 0 && gaugeMM > 0
      ? Math.ceil(slopeLenMM / gaugeMM)
      : 0;

  // External tiling laths (m)
  const externalLathsM = tileCourses * extWidthM;

  // Internal fixing laths – e.g. 400mm centres up the slope
  const internalRows =
    pitchDeg > 0
      ? Math.ceil(slopeLenMM / 400)
      : 0;
  const legacyInternalLathsM = internalRows * intWidthM;
  const internalLathsM =
    isHippedLeanToEarly && hippedInsulationIntegration?.valid
      ? hippedInsulationIntegration.internalLaths.totalM
      : legacyInternalLathsM;

// Chamfered front lath ≈ one full external width
const chamferLathM = extWidthM;

const automaticRoofTilingAudit = buildAutomaticRoofTiling({
  roofInputs: inputs,
  materials: m,
});

const automaticRoofEdgeResult = buildAutomaticRoofEdgeBOM({
  roofInputs: inputs,
  materials: m,
  automaticRoofTiling: automaticRoofTilingAudit,
});

const hipRidgeLathAudit = buildHipRidgeLathIntegrationAudit({
  edgeModel: automaticRoofEdgeResult?.edgeModel,
  tileSystem: automaticRoofTilingAudit.productId,
  materials: m,
});
const hipRidgeSummaryContribution = selectHipRidgeLathSummaryContribution(hipRidgeLathAudit);
const integratedGutterAudit = isHippedLeanToEarly ? buildHippedGutteringIntegrationAudit({
  edgeModel: automaticRoofEdgeResult?.edgeModel, materials: m,
  profile: inputs.gutterProfile ?? inputs.gutter_profile ?? inputs.gutter_profile_type ?? "square",
}) : null;
const integratedPlasticsAudit = isHippedLeanToEarly ? buildHippedPlasticsIntegrationAudit({
  geometry: hippedGeomEarly, edgeModel: automaticRoofEdgeResult?.edgeModel, materials: m,
  plasticsColor: inputs.plasticsColor ?? inputs.plastics_color ?? inputs.plastics_finish ?? "white",
}) : null;


const legacyExternalFixingLathM =
  Math.max(0, externalLathsM) +
  Math.max(0, chamferLathM);

const summaryExternalFixingLathM =
  selectSummaryExternalFixingLathM({
    legacyExternalFixingLathM,
    automaticResult: automaticRoofTilingAudit.result,
  });

// Ring-beam outer-edge and upstand-finishing laths
const ringBeamUpstandLathsM =
  integratedRingBeam.quantities.finishingLath25x50LengthM;
const ringBeamOuterLathsM =
  integratedRingBeam.quantities.outerFixingLath25x50LengthM;

// Total lath length (all 25×50) in metres
const totalLathsM =
  Math.max(0, summaryExternalFixingLathM) +
  Math.max(0, internalLathsM) +
  Math.max(0, ringBeamOuterLathsM) +
  Math.max(0, ringBeamUpstandLathsM) +
  hipRidgeSummaryContribution.additionalLathM;


  // Convert to stock lengths using materials (e.g. 4.8m)
  const lathStockM = Number(m.lath_stock_length_m ?? 4.8) || 4.8;

  const lathLengths = totalLathsM > 0
      ? Math.ceil(totalLathsM / lathStockM)
      : 0;
// Price & weight per metre for all 25×50 laths
const lathPricePerM = Number(m.chamferLath?.price_per_m ?? 0);
const lathWeightPerM = Number(m.chamferLath?.weight_kg_per_m ?? 0);

  // ---------- Manual timber lines for Summary ----------

  const timberManualLines = [
    {
      key: "steico_220_total_m",
      label: "Steico 220 I-Joists",
      qty: Number(steicoTotal_m.toFixed(2)), // total metres
      units: "m",
      order_qty: steicoOrderQty, // number of 12m bars
      weight_kg: Number((steicoTotal_m * steicoWeightPerM).toFixed(2)),
      line: Number((steicoTotal_m * steicoPricePerM).toFixed(2)),
    },
      {
    key: "pse30x90_ringbeam",
    label: "30×90 PSE",
    qty: Number(pseRingBeamLen_m.toFixed(2)),  // metres along external width
    units: "m",
    order_qty: pseOrderQty,                   // number of 4.8 m bars
    weight_kg: Number((pseRingBeamLen_m * pseWeightPerM).toFixed(2)),
    line: Number((pseRingBeamLen_m * psePricePerM).toFixed(2)),
  },
    {
      key: "laths_25x50_lengths",
      label: `25×50 laths (${lathStockM.toFixed(2)} m lengths)`,
      qty: Number(totalLathsM.toFixed(2)), // total metres of 25×50
      units: "m",
      order_qty: lathLengths, // number of stock lengths (e.g. 4.8m)
      weight_kg: Number((totalLathsM * lathWeightPerM).toFixed(2)),
      line: Number((totalLathsM * lathPricePerM).toFixed(2)),
    },
{
  key: "ply9mm_strips_total_m2",
  label: "9mm Structural Ply (ring-beam + wallplate assembly)",
  qty: Number(totalPly9_m2.toFixed(2)),           // m² actually used
  units: "m²",
  order_qty: ply9OrderQty,                        // number of sheets to order
  weight_kg: Number((totalPly9_m2 * ply9WeightPerM2).toFixed(2)),
  line: Number((totalPly9_m2 * ply9PricePerM2).toFixed(2)),   // base cost (no waste)
},
    {
      key: "ply18mm_wallplate_infill",
      label: "18mm Structural Ply (wallplate infill + chevrons)",
      qty: Number(totalPly18_m2.toFixed(2)),     // m² used
      units: "m²",
      order_qty: ply18OrderQty,                  // sheets to order
      weight_kg: Number((totalPly18_m2 * ply18WeightPerM2).toFixed(2)),
      line: Number((totalPly18_m2 * ply18PricePerM2).toFixed(2)), // base cost
    },
  ];
  // ---------- Manual METAL lines for Summary (Lean-To) ----------

// Watercourse (only when a side abuts a wall)
// (We treat either side being "wall" as meaning we need watercourse)
const leftIsWall =
  ((typeof inputs.left_exposed === "boolean" ? inputs.left_exposed : inputs.leftExposed) ?? false) === false;

const rightIsWall =
  ((typeof inputs.right_exposed === "boolean" ? inputs.right_exposed : inputs.rightExposed) ?? false) === false;

const needsWatercourse = leftIsWall || rightIsWall;

// Pull unit price & weight from materials
// (flat keys first, nested metal fallback as safety)
const watercoursePriceEach = Number(
  m.watercourse_price_each ?? m.metal?.watercourse?.price_per_piece ?? 0
);
const watercourseWeightEach = Number(
  m.watercourse_weight_kg_each ?? m.metal?.watercourse?.weight_kg_per_piece ?? 0
);

const joistHangerPriceEach = Number(
  m.joist_hanger_price_each ?? m.metal?.joist_hanger?.price_each ?? 0
);

const joistHangerWeightEach = Number(
  m.joist_hanger_weight_kg_each ?? m.metal?.joist_hanger?.weight_kg_each ?? 0
);


// Quantity logic (watercourse on wall abutment sides)
// If both sides are walls → 2, if one wall → 1
const watercourseQty =
  needsWatercourse ? (leftIsWall && rightIsWall ? 2 : 1) : 0;
// Tile starter (3.0 m lengths) — used along the front run (external width)
const tileStarterStockLenM = 3.0;

// Use the roof front run length (external width) as metres needed
const tileStarterUsedM = (Number(extWidthMM || 0) / 1000) || 0;

// Material prices/weights are stored per 3m length, derive per-m if needed
const tileStarterPriceEach = Number(
  m.tile_starter_price_each ?? m.metal?.tile_starter?.price_each ?? 0
);
const tileStarterWeightEach = Number(
  m.tile_starter_weight_kg_each ?? m.metal?.tile_starter?.weight_kg_each ?? 0
);

const tileStarterPricePerM =
  Number(m.tile_starter_price_per_m ?? 0) ||
  (tileStarterPriceEach > 0 ? tileStarterPriceEach / tileStarterStockLenM : 0);

const tileStarterWeightPerM =
  Number(m.tile_starter_weight_kg_per_m ?? 0) ||
  (tileStarterWeightEach > 0 ? tileStarterWeightEach / tileStarterStockLenM : 0);

// Order qty (how many 3m lengths you must buy)
const tileStarterOrderQty =
  tileStarterStockLenM > 0 ? Math.ceil(tileStarterUsedM / tileStarterStockLenM) : 0;

// Chargeable metres rule: last piece charged as full length if > half used
const tileStarterFullLens = tileStarterStockLenM > 0 ? Math.floor(tileStarterUsedM / tileStarterStockLenM) : 0;
const tileStarterRemainderM = tileStarterUsedM - tileStarterFullLens * tileStarterStockLenM;

const tileStarterChargeableM =
  tileStarterFullLens * tileStarterStockLenM +
  (tileStarterRemainderM > (tileStarterStockLenM / 2) ? tileStarterStockLenM : tileStarterRemainderM);

const legacyMetalManualLines = [
  {
  key: "tile_starter",
  _k: "tile_starter",
  label: "Tile starter (3.0 m length)",
  qty: Number(tileStarterUsedM.toFixed(2)),
  units: "m",
  order_qty: tileStarterOrderQty,
  weight_kg: Number((tileStarterUsedM * tileStarterWeightPerM).toFixed(2)),
  line: Number((tileStarterChargeableM * tileStarterPricePerM).toFixed(2)),
},

  // Watercourse (only if needed)
  ...(watercourseQty > 0
    ? [
        {
  key: "watercourse",
  _k: "watercourse",
  label: "Watercourse",
          qty: watercourseQty,
          units: "Lengths",
          order_qty: watercourseQty,
          weight_kg: Number(
            (watercourseQty * watercourseWeightEach).toFixed(2)
          ),
          line: Number(
            (watercourseQty * watercoursePriceEach).toFixed(2)
          ),
        },
      ]
    : []),

  // Joist hangers (always)
  {
  key: "joist_hangers",
  _k: "joist_hangers",
  label: "Joist Hangers",
  qty: joistHangerQty,
  units: "Ea",
  order_qty: joistHangerQty,
  weight_kg: Number(
    (joistHangerQty * joistHangerWeightEach).toFixed(2)
  ),
  line: Number(
    (joistHangerQty * joistHangerPriceEach).toFixed(2)
  ),
},
...(jackRafterQty > 0
  ? [
      {
        key: "jack_rafter_hooks",
        _k: "jack_rafter_hooks",
        label: "Jack Rafter Hooks",
        qty: jackRafterQty,
        units: "Ea",
        order_qty: jackRafterQty,
        weight_kg: Number(
          (jackRafterQty * getFixedProductWeightKg("jack_rafter_hooks")).toFixed(2)
        ),
        line: Number(
          (
            jackRafterQty *
            Number(
              m.jack_rafter_hook_price_each ??
                m.metal?.jack_rafter_hook?.price_each ??
                0
            )
          ).toFixed(2)
        ),
      },
      {
        key: "jack_rafter_brackets",
        _k: "jack_rafter_brackets",
        label: "Jack Rafter Brackets",
        qty: jackRafterQty,
        units: "Ea",
        order_qty: jackRafterQty,
        weight_kg: Number(
          (jackRafterQty * getFixedProductWeightKg("jack_rafter_brackets")).toFixed(2)
        ),
        line: Number(
          (
            jackRafterQty *
            Number(
              m.jack_rafter_bracket_price_each ??
                m.metal?.jack_rafter_bracket?.price_each ??
                0
            )
          ).toFixed(2)
        ),
      },
    ]
  : []),

];

const summaryEdgeBOM = applyAutomaticEdgeBOMToSummaryLines({
  lines: legacyMetalManualLines,
  automaticEdgeResult: automaticRoofEdgeResult,
});

const metalManualLines = summaryEdgeBOM.lines;



  // Use 12m stock unless overridden in materials
  const stockLenMM = Number(m.timber_stock_length_mm || 12000) || 12000;
  const timberFullLengths =
    totalTimberMM > 0
      ? Math.max(1, Math.ceil(totalTimberMM / stockLenMM))
      : 0;

  // Basic timber / lath / ring-beam summary for this page
  const LATH_STOCK_M = Number(m.lath_stock_length_m || 4.8) || 4.8;


  // ---------- BOM + totals (single source of truth) ----------
  


// Map whatever is in localStorage(leanToInputs) into the canonical shape
// that buildLeanToTotals() expects (same as LeanToLanding).
const totalsInput = {
  roofStyle: inputs.roofStyle ?? inputs.roof_style ?? "leanTo",
hippedSides: inputs.hippedSides ?? "both",
leftHipWidthMM: Number(inputs.leftHipWidthMM ?? inputs.left_hip_width_mm ?? 0),
rightHipWidthMM: Number(inputs.rightHipWidthMM ?? inputs.right_hip_width_mm ?? 0),
requestedLeftSidePitchDeg:
  inputs.requestedLeftSidePitchDeg ?? null,
requestedRightSidePitchDeg:
  inputs.requestedRightSidePitchDeg ?? null,
sideSoffitMode: inputs.sideSoffitMode ?? "automatic",
sideSoffitControlSide:
  inputs.sideSoffitControlSide ?? "left",
specifiedSideSoffitMM:
  inputs.specifiedSideSoffitMM ?? null,

  widthMM: Number(inputs.internalWidthMM ?? inputs.widthMM ?? inputs.widthMM ?? 0),
  projMM: Number(inputs.internalProjectionMM ?? inputs.projMM ?? inputs.projectionMM ?? 0),
  pitchDeg: Number(inputs.pitchDeg ?? inputs.pitch_deg ?? 15),


  // Prefer explicit wall flags if present, otherwise invert exposed flags
  leftWall:  typeof inputs.leftWall === "boolean"
    ? inputs.leftWall
    : (typeof inputs.left_wall_present === "boolean"
        ? inputs.left_wall_present
        : (typeof inputs.left_exposed === "boolean" ? !inputs.left_exposed : false)),

  rightWall: typeof inputs.rightWall === "boolean"
    ? inputs.rightWall
    : (typeof inputs.right_wall_present === "boolean"
        ? inputs.right_wall_present
        : (typeof inputs.right_exposed === "boolean" ? !inputs.right_exposed : false)),

  // Overhangs: support both naming schemes you’ve used
  eavesOverhangMM: Number(inputs.eavesOverhangMM ?? inputs.soffit_mm ?? 150),
  leftOverhangMM:  Number(inputs.leftOverhangMM  ?? inputs.left_overhang_mm  ?? 0),
  rightOverhangMM: Number(inputs.rightOverhangMM ?? inputs.right_overhang_mm ?? 0),

  // System + finishes: support both naming schemes
  tileSystem:     inputs.tileSystem     ?? inputs.tile_system     ?? "britmet",
  plasticsColor:  inputs.plasticsColor  ?? inputs.plastics_color  ?? "White",
  gutterProfile:  inputs.gutterProfile  ?? inputs.gutter_profile  ?? "square",
  gutterOutlet:   inputs.gutterOutlet   ?? inputs.gutter_outlet   ?? "left",
  gutterColor:    inputs.gutterColor    ?? inputs.gutter_color    ?? "black",
};

const isHippedLeanTo = totalsInput.roofStyle === "hippedLeanTo";

const hippedGeom = isHippedLeanTo
  ? calculateHippedLeanToGeometry({
      widthMM: totalsInput.widthMM,
      projectionMM: totalsInput.projMM,
      pitchDeg: totalsInput.pitchDeg,
      soffitDepthMM: totalsInput.eavesOverhangMM,
      materials: m,
      hippedSides: totalsInput.hippedSides,
      leftHipWidthMM: totalsInput.leftHipWidthMM,
      rightHipWidthMM: totalsInput.rightHipWidthMM,
      requestedLeftSidePitchDeg: totalsInput.requestedLeftSidePitchDeg,
      requestedRightSidePitchDeg: totalsInput.requestedRightSidePitchDeg,
      sideSoffitMode: totalsInput.sideSoffitMode,
      sideSoffitControlSide: totalsInput.sideSoffitControlSide,
      specifiedSideSoffitMM: totalsInput.specifiedSideSoffitMM,
    })
  : null;

const totals = isHippedLeanTo
  ? buildHippedLeanToTotals(totalsInput, exclusions, m)
  : buildLeanToTotals(totalsInput, exclusions, m);

const summaryTilingBOM = applyUniversalTilingToSummaryLines({
  lines: totals.allLines || [],
  automaticResult: automaticRoofTilingAudit.result,
});

// This is the canonical calculator output list (tiles+plastics+edge+gutters+misc)
// This is the canonical calculator output list (tiles+plastics+edge+gutters+misc)
const auditedSuperQuiltLines =
  isHippedLeanToEarly && hippedInsulationIntegration?.valid
    ? [
        ...(hippedInsulationIntegration.superQuilt.rolls12 > 0
          ? [
              {
                key: "superquilt",
                label: "SuperQuilt 12 m² roll",
                name: "SuperQuilt 12 m² roll",
                qty: hippedInsulationIntegration.superQuilt.rolls12,
                order_qty: hippedInsulationIntegration.superQuilt.rolls12,
                units: "Roll",
                unit_price: Number(
                  m?.superquilt_12m_price_each ??
                    m?.superquilt_12m2_price_ex_vat ??
                    0
                ),
                line: Number(
                  (
                    hippedInsulationIntegration.superQuilt.rolls12 *
                    Number(
                      m?.superquilt_12m_price_each ??
                        m?.superquilt_12m2_price_ex_vat ??
                        0
                    )
                  ).toFixed(2)
                ),
                total: Number(
                  (
                    hippedInsulationIntegration.superQuilt.rolls12 *
                    Number(
                      m?.superquilt_12m_price_each ??
                        m?.superquilt_12m2_price_ex_vat ??
                        0
                    )
                  ).toFixed(2)
                ),
              },
            ]
          : []),
        ...(hippedInsulationIntegration.superQuilt.rolls15 > 0
          ? [
              {
                key: "superquilt",
                label: "SuperQuilt 15 m² roll",
                name: "SuperQuilt 15 m² roll",
                qty: hippedInsulationIntegration.superQuilt.rolls15,
                order_qty: hippedInsulationIntegration.superQuilt.rolls15,
                units: "Roll",
                unit_price: Number(
                  m?.superquilt_15m_price_each ??
                    m?.superquilt_15m2_price_ex_vat ??
                    0
                ),
                line: Number(
                  (
                    hippedInsulationIntegration.superQuilt.rolls15 *
                    Number(
                      m?.superquilt_15m_price_each ??
                        m?.superquilt_15m2_price_ex_vat ??
                        0
                    )
                  ).toFixed(2)
                ),
                total: Number(
                  (
                    hippedInsulationIntegration.superQuilt.rolls15 *
                    Number(
                      m?.superquilt_15m_price_each ??
                        m?.superquilt_15m2_price_ex_vat ??
                        0
                    )
                  ).toFixed(2)
                ),
              },
            ]
          : []),
      ]
    : [];

const baseLines = [
  ...(summaryTilingBOM.lines || []).filter(
    (r) =>
      !(
        isHippedLeanToEarly &&
        hippedInsulationIntegration?.valid &&
        String(r.key || "").toLowerCase() === "superquilt"
      )
  ),
  ...auditedSuperQuiltLines,
]
  .filter((r) => String(r.key || "").toLowerCase() !== "membrane")
  .map((r) => {
    if (String(r.key || "").toLowerCase() !== "breather_membrane") return r;
    const price = Number(m?.breather_roll_price_each ?? m?.breather_membrane_price_each ?? r.unitPrice ?? r.unit_price ?? 0);
    return { ...r, qty: 1, qtyDisplay: 1, order_qty: 1,
      unitPrice: price, unit: price, unit_price: price, line: price, total: price };
  })
  .map((r) => ({
    ...r,
    _k: `${String(r.key || "").toLowerCase()} ${String(r.label || r.name || "").toLowerCase()}`,
  }));
  // ===== Patch missing unit prices from materials =====
const withUnitPrice = (line, unitPrice) => {
  const p = Number(unitPrice || 0);
  if (!(p > 0)) return line;

  // only patch if current line has no price
  const existing = Number(line.unitPrice ?? line.unit ?? 0);
  if (existing > 0) return line;

  return { ...line, unitPrice: p, unit: p };
};

const profile = String(inputs?.gutter_profile || "square").toLowerCase();

// helper: always set unit price fields (Summary uses these via asUnitPrice/asCost)
const forceUnitPrice = (line, unit) => {
  const n = Number(unit);
  if (!Number.isFinite(n)) return line;
  return {
    ...line,
    unit: n,
    unitPrice: n,
    priceEach: n,
  };
};
const withUnitPriceRecalc = (line, unitPrice) => {
  const p = Number(unitPrice || 0);
  if (!(p > 0)) return line;

  const existing = Number(line.unitPrice ?? line.unit ?? 0);
  if (existing > 0) return line;

  const qty = Number(line.order_qty ?? line.orderQty ?? line.qty ?? 0) || 0;
  const total = Number((qty * p).toFixed(2));

  return {
    ...line,
    unit: p,
    unitPrice: p,
    priceEach: p,
    line: total,
    total,
  };
};
// helper: force unit price + recalc total using qty (NOT order_qty)
// needed for lines priced per m / per m² where total should be qty × unit
const forceUnitPriceRecalcByQty = (line, unitPrice) => {
  const p = Number(unitPrice || 0);
  if (!(p > 0)) return line;

  const qty = Number(line.qty ?? line.quantity ?? 0) || 0;
  const total = Number((qty * p).toFixed(2));

  return {
    ...line,
    unit: p,
    unitPrice: p,
    priceEach: p,
    line: total,
    total,
  };
};
const patchUnitPricesFromMaterials = (line) => {
  const k = String(line.key || "").toLowerCase();
  const txt = `${line._k || ""} ${line.label || ""} ${line.name || ""}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // ---------- gutters ----------
  if (k === "g_len")    return forceUnitPrice(line, m?.[`gutter_${profile}_length_4m_price`]);
  if (k === "g_union")  return forceUnitPrice(line, m?.[`gutter_${profile}_union_price`]);
  if (k === "g_brkt")   return forceUnitPrice(line, m?.[`gutter_${profile}_bracket_price`]);
  if (k === "g_outlet") return forceUnitPrice(line, m?.[`gutter_${profile}_running_outlet_price`]);
  if (k === "g_stop")   return forceUnitPrice(line, m?.[`gutter_${profile}_stop_end_price`]);

  // ---------- downpipes ----------
  if (k === "dp_len")   return forceUnitPrice(line, m?.dp_length_2_5m_price);
  if (k === "dp_bend")  return forceUnitPrice(line, m?.dp_bend_price);
  if (k === "dp_shoe")  return forceUnitPrice(line, m?.dp_shoe_price);
  if (k === "dp_clip")  return forceUnitPrice(line, m?.dp_clip_price);
  if (k === "dp_adapt" || k === "dp_adaptor") return forceUnitPrice(line, m?.dp_adaptor_price);

  // ---------- misc ----------
  if (k === "breather_membrane")
    return forceUnitPrice(line, m?.breather_roll_price_each ?? m?.breather_membrane_price_each);
  // 50mm PIR cradle (priced per m², qty is m² used)
if (k === "pir50_cradle") {
  const perM2 = Number(m?.pir50?.price_per_m2 ?? m?.pir50_per_m2 ?? 0) || 0;
  return perM2 > 0 ? forceUnitPriceRecalcByQty(line, perM2) : line;
}
// --- misc fixings (these rows arrive with totals but no unit, so we MUST recalc) ---
if (k === "polytop_pins")
  return withUnitPriceRecalc(line, m?.polytop_pins_price_per_box ?? m?.polytopPins?.price_per_box);

if (k === "screws_rafter_eaves")
  return withUnitPriceRecalc(line, m?.screws_3x10_price_per_box);

if (k === "screws_lath_fixings")
  return withUnitPriceRecalc(line, m?.screws_2x8_price_per_box);

if (k === "screws_tile_fixings")
  return withUnitPriceRecalc(line, m?.screws_1x8_price_per_box);
// ---------- timber: 25×50 laths + 9mm structural ply ----------

// 25×50 laths are priced per metre in Summary (qty = total metres)
if (k === "laths_25x50_lengths" || k === "laths_25x50_total_m") {
  const perM =
    Number(m?.lath25x50?.price_per_m ?? 0) ||
    Number(m?.lath_25x50_price_per_m ?? 0) ||
    0;

  return perM > 0 ? forceUnitPriceRecalcByQty(line, perM) : line;
}

// 9mm ply is priced per m² in Summary (qty = m² used)
if (k === "ply9mm_strips_total_m2") {
  const sheetLen = Number(m?.ply9mm?.sheet_len_m ?? 2.4);
  const sheetWid = Number(m?.ply9mm?.sheet_width_m ?? 1.2);
  const area = sheetLen * sheetWid || 2.88;

  // Prefer the editable per-sheet price if present (your test key)
  const perM2 =
    (Number(m?.ply9_sheet_price ?? 0) / area) ||
    Number(m?.ply9mm?.price_per_m2 ?? 0) ||
    0;

  return perM2 > 0 ? forceUnitPriceRecalcByQty(line, perM2) : line;
}
// 30×90 PSE is priced per metre (qty = total metres)
if (k === "pse30x90_ringbeam") {
  // Materials editor saves this as a flat key
  const perM =
    Number(m?.ringbeam_pse90x30_per_m ?? 0) ||
    Number(m?.pse30x90?.price_per_m ?? 0) ||
    0;

  return perM > 0 ? forceUnitPriceRecalcByQty(line, perM) : line;
}

// 18mm structural ply is priced per m² (qty = m² used)
if (k === "ply18mm_wallplate_infill") {
  const sheetLen =
    Number(m?.ply18mm?.sheet_len_m ?? 2.4) ||
    Number(m?.ply18?.sheet_len_m ?? 2.4);

  const sheetWid =
    Number(m?.ply18mm?.sheet_width_m ?? 1.2) ||
    Number(m?.ply18?.sheet_width_m ?? 1.2);

  const area = (sheetLen * sheetWid) || 2.88;

  // IMPORTANT: you edit ply18_sheet_price, and ply18_per_m2 may be stale.
  const perM2 =
    (Number(m?.ply18_sheet_price ?? 0) / area) ||
    Number(m?.ply18_per_m2 ?? 0) ||
    Number(m?.ply18mm?.price_per_m2 ?? 0) ||
    0;

  return perM2 > 0 ? forceUnitPriceRecalcByQty(line, perM2) : line;
}
  // SuperQuilt: choose 12m² vs 15m² from label text and use Materials editable prices
  if (k === "superquilt") {
    const want15 = txt.includes("15");
    const unit = Number(
      want15
        ? (m?.superquilt_15m_price_each ?? m?.superquilt_15m2_price_ex_vat ?? 0)
        : (m?.superquilt_12m_price_each ?? m?.superquilt_12m2_price_ex_vat ?? 0)
    ) || 0;

    // only override if we have a valid unit price
    return unit > 0 ? forceUnitPrice(line, unit) : line;
  }

// 100mm PIR (currently keyed as slab100 in baselines)
if (k === "slab100") {
  const useHippedAudit =
    isHippedLeanToEarly && hippedInsulationIntegration?.valid;
  const areaM2 = useHippedAudit
    ? Number(hippedInsulationIntegration.pir100.orderAreaM2)
    : Number(line.qty ?? 0);
  const orderQty = useHippedAudit
    ? Number(hippedInsulationIntegration.pir100.orderQty)
    : Number(line.orderQty ?? line.qty_order ?? line.order_qty ?? 0);
  const coverageM2 =
    Number(m?.slab100_pack_coverage_m2 ?? m?.pir100_pack_coverage_m2 ?? 2.88) || 2.88;
  const packPrice =
    Number(
      m?.slab100_pack_price_each ??
        m?.pir100_price_per_pack ??
        m?.pir100?.price_per_sheet ??
        0
    ) || 0;
  const pricePerM2 = coverageM2 > 0 ? packPrice / coverageM2 : 0;
  const weightPerM2 =
    Number(m?.slab100_weight_kg_per_m2 ?? m?.pir100_weight_kg_per_m2 ?? 0) ||
    (coverageM2 > 0
      ? Number(m?.slab100_pack_weight_kg ?? m?.pir100_weight_kg_per_pack ?? 0) /
        coverageM2
      : 0);

  return {
    ...line,
    label: "100mm PIR insulation (sheet)",
    name: "100mm PIR insulation (sheet)",
    _k: "slab100 100mm PIR insulation (sheet)",
    qty: Number(areaM2.toFixed(3)),
    units: line.unitLabel ?? line.units ?? line.unit ?? "m²",
    order_qty: orderQty,
    weight_kg: Number(
      (useHippedAudit ? areaM2 * weightPerM2 : Number(line.totalWeightKg ?? line.weight_kg ?? 0)).toFixed(2)
    ),
    cost: Number(
      (useHippedAudit ? areaM2 * pricePerM2 : Number(line.total ?? line.line ?? 0)).toFixed(2)
    ),
    line: Number(
      (useHippedAudit ? areaM2 * pricePerM2 : Number(line.total ?? line.line ?? 0)).toFixed(2)
    ),
    total: Number(
      (useHippedAudit ? areaM2 * pricePerM2 : Number(line.total ?? line.line ?? 0)).toFixed(2)
    ),
  };
}

  // ---------- plastics ----------
  // vented fascia is charged per metre — editable in Materials
  if (k === "vent") {
    const unit = Number(m?.fascia_vent_price_per_m ?? 0) || 0;
    return unit > 0 ? forceUnitPrice(line, unit) : line;
  }

  // J-section price depends on white vs foiled (use label text)
  if (k === "j_section") {
    const isFoiled = /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
    const unit = Number(
      isFoiled
        ? (m?.fascia_j_section_foiled_price ?? m?.j_section_price_each_foiled ?? 0)
        : (m?.fascia_j_section_white_price ?? m?.j_section_price_each_white ?? 0)
    ) || 0;
    return unit > 0 ? forceUnitPrice(line, unit) : line;
  }

  // fascia corners: use the “90 ext 300” keys (your storage shows these are the real ones)
if (k === "fascia_corners") {
  const isFoiled = /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
  const unit = Number(
    isFoiled
      ? (m?.fascia_corner_90_ext_300_foiled_price ?? m?.fascia_corner_price_each_foiled ?? 0)
      : (m?.fascia_corner_90_ext_300_white_price ?? m?.fascia_corner_price_each_white ?? 0)
  ) || 0;
  return unit > 0 ? forceUnitPrice(line, unit) : line;
}

// fascia joints
if (k === "fascia_joints") {
  const isFoiled = /anthracite|black|rosewood|golden[_\s-]*oak|foil|foiled/.test(txt);
  const unit = Number(
    isFoiled
      ? (m?.fascia_joint_300_foiled_price ?? m?.fascia_joint_price_each_foiled ?? 0)
      : (m?.fascia_joint_300_white_price ?? m?.fascia_joint_price_each_white ?? 0)
  ) || 0;
  return unit > 0 ? forceUnitPrice(line, unit) : line;
}

return line;
};

// IMPORTANT: use this patched list everywhere below
const baseLinesPriced = (baseLines || []).map(patchUnitPricesFromMaterials);
const baseLinesPricedWeighted = applyWeightsToLines(baseLinesPriced, m);




// ===============================
// 3) Everything else uses baseLines
// ===============================
const isPlastics = (k) =>
  /(fascia|soffit|vent(?!ilator)|j[_-]?(section|trim))/.test(k);

const isGutter = (k) =>
  /(gutter|^dp_|downpipe|^g_(len|union|brkt|outlet|stop)\b|stop[_\s-]?end|running[_\s-]?outlet|bracket|union)/.test(k);


// ✅ Now filter from the weighted version
const plasticsLines = baseLinesPricedWeighted.filter((r) =>
  isPlastics(String(r._k || "").toLowerCase())
);

const gutterLines = baseLinesPricedWeighted.filter((r) =>
  isGutter(String(r._k || "").toLowerCase()) ||
  isGutter(String(r.key || "").toLowerCase())
);
// etc…

// 🔍 DEBUG – Inspect tile lines reaching Summary


// ✅ Debug AFTER baseLines is defined





  // ---------- (DUPLICATE) Timber Elements block - COMMENTED OUT to avoid redeclarations ----------
  /*
  // ---- Timber Elements from geometry (for Summary only) ----
  const timberSpacing = Number(m.rafter_spacing_mm ?? 665);
  const timberFirstCtr = Number(m.rafter_first_center_mm ?? 690);

  let timberCentresCount = 0;
  for (let c = timberFirstCtr; c <= iw; c += timberSpacing) {
    timberCentresCount++;
  }

  const raftersCount = Math.max(2, timberCentresCount + 2);

  const eavesOverhangMM = Number(inputs.eaves_overhang_mm ?? inputs.soffit_mm ?? 150);
  const frameOnMM = Number(inputs.frame_on_mm ?? 70);

  const thetaRad = (pitchDeg * Math.PI) / 180 || 0;
  const timberExtProjectionMM = ip + eavesOverhangMM + frameOnMM;
  const rafterLenMM = timberExtProjectionMM / (Math.cos(thetaRad) || 1);
  const timberRafterLenMM = rafterLenMM;

  const wallplate_m = iw / 1000;
  const raftersTotal_m = (raftersCount * timberRafterLenMM) / 1000;

  const timberManualLines = [
    { key: "rafters_count", label: "Rafters", qty: raftersCount, units: "Ea" },
    { key: "rafter_length_each_mm", label: "Rafter length (each)", qty: Math.round(timberRafterLenMM), units: "mm" },
    { key: "rafters_total_m", label: "Rafters total run", qty: Number(raftersTotal_m.toFixed(2)), units: "m" },
    // ...
  ];
  */

    // ---------- normalise all lines ----------

const lineChargeableCost = (r) => {
  const base = asCost(r);
  if (!isTimberChargeableKey(r.key)) return base; // no uplift outside timber
  return Number((base * (1 + wasteFractionForKey(r.key))).toFixed(2)); // apply waste uplift only for Timber
};

  // ---------- classification rules ----------

  // Tile-related items (Britmet / LiteSlate) but NOT watercourse, tile starter or fixings
  const isTile = (k) => {
    // push these into other buckets instead:
    if (/watercourse/.test(k)) return false;
    if (/tile_starter/.test(k)) return false;
    if (/fixings?_pack|fixings?|screws?/.test(k)) return false;

    // everything else obviously tile-ish stays in Tile Elements
    return /(tile|slate|britmet|liteslate|verge|barge|ridge|eaves_guard|touchup)/.test(
      k
    );
  };

    // Plastics = fascia, soffit, vents, J-Section / J-Trim
// Match anywhere in key OR label (k already includes both, lowercased)



  // Metal bits = tile starter, joist hangers, trims, WATERCOURSE
  // (J-Section is now treated as plastics, not metal)
  const isMetal = (k) => {
  const s = String(k || "").toLowerCase();
  return (
    /tile[\s_-]*starter/.test(s) ||
    /joist[\s_-]*hanger(s)?/.test(s) ||   // catches joist_hanger, joist hanger, joist-hangers, etc.
    /watercourse/.test(s)
  );
};





  // Misc = insulation, tapes, screws, pins, breather, TILE FIXINGS, etc.
  const isMisc = (k) =>
    /breather|slab100|superquilt|expanding|polytop|alu|lath_fixings|rafter_eaves|screws|fixings?_pack/.test(
      k
    );


  const isTimber = (k) =>
    /(timber_rafters|timber_full_lengths|timber_ringbeam|lath_external|lath_internal|lath_chamfer_front)/.test(
      k
    );
    const isTimberChargeableKey = (key) => {
  const k = String(key || "").toLowerCase();
  return (
    k === "steico_220_total_m" ||
    k === "pse30x90_ringbeam" ||
    k === "laths_25x50_lengths" ||
    k === "laths_25x50_total_m" ||
    k === "ply9mm_strips_total_m2" ||
    k === "ply18mm_wallplate_infill"
  );
};

  const wasteFractionForKey = (key) => {
    const k = String(key || "").toLowerCase();

    // Global default = 10% if nothing else specified
    const defaultFrac =
      (Number(m.global_waste_percent ?? 10) || 0) / 100;

    // Steico 220 I-joists
    if (k === "steico_220_total_m") {
      const pct = Number(m.steico?.waste_percent);
      return Number.isFinite(pct) ? pct / 100 : defaultFrac;
    }

    // 25x50 laths (we've used both keys over time, so cover both)
    if (
      k === "laths_25x50_total_m" ||
      k === "laths_25x50_lengths"
    ) {
      const pct = Number(m.chamferLath?.waste_percent);
      return Number.isFinite(pct) ? pct / 100 : defaultFrac;
    }

    // 9mm structural ply (soffit + wallplate face + ring-beam upstands)
    if (k === "ply9mm_strips_total_m2") {
      const pct = Number(
        m.ply9mm?.waste_percent ?? m.ply9mm?.waste_pct
      );
      return Number.isFinite(pct) ? pct / 100 : defaultFrac;
    }

  // 18mm structural ply (wallplate internal infill)
  if (k === "ply18mm_wallplate_infill") {
    const pct = Number(
      m.ply18mm?.waste_percent ?? m.ply18mm?.waste_pct
    );
    return Number.isFinite(pct) ? pct / 100 : defaultFrac;
  }

  // 30x90 PSE ring-beam
  if (k === "pse30x90_ringbeam") {
    const pct = Number(
      m.pse30x90?.waste_percent ?? m.pse30x90?.waste_pct
    );
    return Number.isFinite(pct) ? pct / 100 : defaultFrac;
  }

    // For now, everything else also gets the default waste %
    return defaultFrac;
  };

// Combine manual timber geometry lines + any existing timber items from calculators
const timberFilteredLines = baseLinesPriced.filter((r) => isTimber(r._k));

const hipTimberLines = [];

const timberLines = [
  ...timberManualLines,
  ...hipTimberLines,
  ...timberFilteredLines,
].map(patchUnitPricesFromMaterials);


const isLiteSlateSystem = tileSystem === "liteslate";
let tilesLines = baseLines
  .filter((r) => {
    const key = String(r._k || "").toLowerCase();

    // Touch-up kit is NOT used with LiteSlate
    if (tileSystem === "liteslate" && key.includes("touch")) {
      return false;
    }

    // Everything that still looks like a tile item
    return isTile(key);
  })
  .map((r) => {
    const key = String(r._k || "").toLowerCase();

    const isMainTilesRow =
      key.includes("tiles") &&
      !key.includes("verge") &&
      !key.includes("barge") &&
      !key.includes("starter") &&
      !key.includes("water") &&
      !key.includes("fix") &&
      !key.includes("touch");

    const isVergeRow =
      key.includes("verge") || key.includes("barge");

    const isFixingsRow =
      key.includes("fix") && key.includes("pack");

    const isTouchupRow =
      key.includes("touch");

        // ---------- Main tiles row ----------
if (isMainTilesRow) {
  let row = {
    ...r,
    label: isLiteSlateSystem ? "LiteSlate tiles" : "Britmet tiles",
  };

  // ✅ leave qty as produced by baseLines
  return row;
}

// ---------- Verge / Dry Verge ----------
if (isVergeRow) {
  let row = { ...r };

  if (isLiteSlateSystem) {
    // For LiteSlate, just relabel LiteSlate verge as "Dry Verge"
    row.label = "Dry Verge";
    return row;
  }

  // ✅ leave qty as produced by baseLines
  return row;
}

// ---------- Fixings & Touch-up ----------
if (isFixingsRow) {
  // ✅ leave qty as produced by baseLines
  return r;
}

if (isTouchupRow) {
  // ✅ leave qty as produced by baseLines
  return r;
}

// Everything else unchanged
return r;

  });

const summaryHipBOM = applyAutomaticHipBOMToSummaryTileLines({
  lines: tilesLines,
  automaticEdgeResult: automaticRoofEdgeResult,
});

if (summaryHipBOM.valid) {
  tilesLines = summaryHipBOM.lines;
}


// Raw metal rows (from calculators + manual)
const metalLinesRaw = [
  ...(baseLines || []).filter((r) => {
    const k = String(r?._k || r?.key || r?.label || "").toLowerCase();
    if (k.includes("tile_starter") || k.includes("tile starter")) return false;
    return isMetal(r._k);
  }),
  ...(metalManualLines || []),
];

// De-dupe metal rows by key/label so items can never appear twice
const legacyMetalLines = (() => {


  // Pick the "best" row per id (prefer rows with line/order_qty/weight_kg)
  const bestById = new Map();

  const score = (row) => {
    let s = 0;
    if (row?.order_qty !== undefined) s += 2;
    if (row?.line !== undefined) s += 3;
    if (row?.weight_kg !== undefined) s += 1;
    // secondary preference if you ever use these elsewhere
    if (row?.total !== undefined) s += 2;
    if (row?.priceEach !== undefined) s += 1;
    return s;
  };

  (metalLinesRaw || []).forEach((r) => {
    const id = String(r.key || r.label || r.name || "").toLowerCase().trim();
    if (!id) return;

    const prev = bestById.get(id);
    if (!prev || score(r) > score(prev)) {
      bestById.set(id, r);
    }
  });

  // Keep original order, but only include the chosen "best" row for each id
  const seen = new Set();
  const out = [];

  (metalLinesRaw || []).forEach((r) => {
    const id = String(r.key || r.label || r.name || "").toLowerCase().trim();
    if (!id) return;

    if (seen.has(id)) return;

    const best = bestById.get(id);
    if (best === r) {
      seen.add(id);
      out.push(r);
    }
  });

    if (isHippedLeanTo && hippedGeom) {
  const bossQty = Number(hippedGeom.bossQty || 0);
  const sparHookQty = Number(hippedGeom.sparHookQty || 0);

  if (bossQty > 0) {
    out.push({
      key: "boss_rafter_terminal",
      label: "Boss / Rafter Terminal",
      qty: bossQty,
      order_qty: bossQty,
      units: "Ea",
      weight_kg:
        bossQty * getFixedProductWeightKg("boss_rafter_terminal"),
      line:
        bossQty *
        Number(
          m.boss_rafter_terminal_price_each ??
            m.boss_price_each ??
            m.metal?.boss_rafter_terminal?.price_each ??
            0
        ),
    });
  }

  if (sparHookQty > 0) {
    out.push({
      key: "spar_hook",
      label: "Spar Hook",
      qty: sparHookQty,
      order_qty: sparHookQty,
      units: "Ea",
      weight_kg: sparHookQty * getFixedProductWeightKg("spar_hook"),
      line:
        sparHookQty *
        Number(
          m.spar_hook_price_each ??
            m.metal?.spar_hook?.price_each ??
            0
        ),
    });
  }
}

  return out;
})();

const metalLines = isHippedLeanToEarly
  ? integrateMetalSummaryWatercourse(legacyMetalLines, hippedGeomEarly, m)
  : legacyMetalLines;

// 🔍 DEBUG: inspect raw gutter lines before any weighting logic


// ⚠️ NOTE: Misc items can appear twice (from calculators/BOM + manual rows).
// If that happens, we must dedupe by keeping the row that has price/weight/order_qty (same rule as Metal).

// 1) Manual misc rows (add items here as needed)

// ---------- 50mm PIR totals (cradle + ring-beam upstands) ----------
const integratedCradleAreaM2 =
  isHippedLeanToEarly && hippedInsulationIntegration?.valid
    ? hippedInsulationIntegration.pir50.cradleOrderAreaM2
    : cradleAreaM2;

const pir50TotalM2 = integratedCradleAreaM2 + (pir50Upstands_m2 || 0);

const pir50TotalOrderQty =
  pir50SheetAreaM2 > 0 ? Math.ceil(pir50TotalM2 / pir50SheetAreaM2) : 0;

const pir50KgPerM2 = Number(m?.pir50?.weight_kg_per_m2 ?? 0) || 0;
const cradleWeightMult = Number(m?.pir50_cradle_weight_multiplier ?? 1) || 1;
const upstandWeightMult = 1; // upstands not machined (make a knob later if needed)

const pir50TotalWeightKg =
  (integratedCradleAreaM2 * pir50KgPerM2 * cradleWeightMult) +
  ((pir50Upstands_m2 || 0) * pir50KgPerM2);

// 1) Manual misc rows (add items here as needed)
const miscManualLines = [
  ...(hipRidgeSummaryContribution.tapeLine ? [hipRidgeSummaryContribution.tapeLine] : []),
  ...(pir50TotalM2 > 0
    ? [
        {
          key: "pir50_cradle",
          label: "50mm PIR (cradle + upstands)",
          qty: Number(pir50TotalM2.toFixed(3)),
          units: "m²",
          order_qty: pir50TotalOrderQty,
          weight_kg: Number(pir50TotalWeightKg.toFixed(2)),
        },
      ]
    : []),
];

// 2) Raw misc rows (from calculators/BOM + manual)
const miscLinesRaw = [
  ...(baseLinesPriced || []).filter(
    (r) =>
      isMisc(r._k) &&
      !isTimber(r._k) &&
      !isTile(r._k) &&
      !isPlastics(r._k) &&
      !isMetal(r._k) &&
      !isGutter(r._k)
  ),
  ...(miscManualLines || []),
].map(patchUnitPricesFromMaterials);

// 3) De-dupe misc rows (keep the "best" row per key — priced rows win)
const miscLines = (() => {
  const bestById = new Map();

  const score = (row) => {
    let s = 0;
    if (row?.order_qty !== undefined) s += 2;
    if (row?.line !== undefined) s += 3;
    if (row?.weight_kg !== undefined) s += 1;
    if (row?.total !== undefined) s += 2;
    if (row?.priceEach !== undefined) s += 1;
    return s;
  };

  (miscLinesRaw || []).forEach((r) => {
    const id =
  String(r.key || "").toLowerCase() === "superquilt"
    ? `superquilt|${String(r.label || r.name || "").toLowerCase().trim()}`
    : String(r.key || r.label || r.name || "").toLowerCase().trim();
    if (!id) return;

    const prev = bestById.get(id);
    if (!prev || score(r) > score(prev)) bestById.set(id, r);
  });

  const seen = new Set();
  const out = [];

  (miscLinesRaw || []).forEach((r) => {
    const id =
  String(r.key || "").toLowerCase() === "superquilt"
    ? `superquilt|${String(r.label || r.name || "").toLowerCase().trim()}`
    : String(r.key || r.label || r.name || "").toLowerCase().trim();
    if (!id) return;
    if (seen.has(id)) return;

    const best = bestById.get(id);
    if (best === r) {
      seen.add(id);
      out.push(r);
    }
  });

  return out;
})();
// --- Reorder Misc: place 50mm PIR above 100mm PIR ---
const miscLinesOrdered = [...miscLines].sort((a, b) => {
  const aKey = (a.key || "").toLowerCase();
  const bKey = (b.key || "").toLowerCase();

  if (aKey === "pir50_cradle" && bKey === "slab100") return -1;
  if (aKey === "slab100" && bKey === "pir50_cradle") return 1;

  return 0;
});
// ✅ DEBUG: expose final misc lines (deduped + priced)

// ---- Patch weights onto misc rows (without touching qty/cost logic) ----
// ✅ Use the same proven weight filler you used for baseLinesPricedWeighted
const miscLinesWithWeights = applyWeightsToLines(miscLines || [], m).map((row) => {
  if (row.key === "polytop_pins" && integratedPlasticsAudit?.valid) {
    return { ...row, label: `Polytop pins — ${inputs.plasticsColor ?? inputs.plastics_color ?? inputs.plastics_finish ?? "white"} (50-pin allowance)` };
  }

  if (row.key !== "expanding_foam_tape" || !hipRidgeSummaryContribution.tapeLine) return row;
  // Preserve installed tape weight (or an explicitly unconfigured zero),
  // rather than assigning the canned-foam or supplied-roll weight.
  return { ...row, ...hipRidgeSummaryContribution.tapeLine };
});
// ---- Override weights for roll items using USED area (but keep qty=1 roll for ordering/charging) ----
const toM2 = (mm2) => Number(mm2 || 0) / 1_000_000;

const iw2 = Number(inputs?.internalWidthMM ?? 0);
const ip2 = Number(inputs?.internalProjectionMM ?? 0);
const lo2 = Number(inputs?.left_overhang_mm ?? 0);
const ro2 = Number(inputs?.right_overhang_mm ?? 0);
const eo2 = Number(inputs?.eaves_overhang_mm ?? 0);

const pitchDeg2 = Number(inputs?.pitchDeg ?? 0);
const pitchRad2 = (pitchDeg2 * Math.PI) / 180;
const slopeFactor = pitchDeg2 > 0 ? 1 / Math.cos(pitchRad2) : 1;

// Plan areas (m²)
const internalPlanM2 = toM2(iw2 * ip2);
const externalPlanM2 = toM2((iw2 + lo2 + ro2) * (ip2 + eo2));

// Sloped “surface” areas (m²)
const internalUsedM2 = Number(
  (
    isHippedLeanToEarly && hippedInsulationIntegration?.valid
      ? hippedInsulationIntegration.superQuilt.geometricAreaM2
      : internalPlanM2 * slopeFactor
  ).toFixed(4)
);
const externalFacetM2 = externalFacetAreaM2(automaticRoofTilingAudit.geometry?.facets || []);
const externalUsedM2 = Number((externalFacetM2 > 0
  ? externalFacetM2 : externalPlanM2 * slopeFactor).toFixed(4));
const installedCoveringRates = coveringWeightRates(m);

// SuperQuilt roll coverage (m²) — infer 12/15 from label
const superquiltCoverM2FromLabel = (label) => {
  const t = String(label || "").toLowerCase();
  if (t.includes("15")) return 15;
  if (t.includes("12")) return 12;

  // fallback: try options
  const SQ12 = (m?.superquilt_options || []).find((o) => Number(o?.coverage_m2) === 12);
  const SQ15 = (m?.superquilt_options || []).find((o) => Number(o?.coverage_m2) === 15);
  return Number(SQ12?.coverage_m2 ?? SQ15?.coverage_m2 ?? 12);
};

// New array with corrected "used weight" totals for these roll items
const miscLinesWithUsedWeights = [...(miscLinesWithWeights || [])]
  .sort((a, b) => {
    const aKey = (a.key || "").toLowerCase();
    const bKey = (b.key || "").toLowerCase();

    if (aKey === "pir50_cradle" && bKey === "slab100") return -1;
    if (aKey === "slab100" && bKey === "pir50_cradle") return 1;

    return 0;
  })
  .map((r) => {
  const key = String(r?.key || "").toLowerCase();
  const label = String(r?.label || "");
  const txt = `${key} ${label}`.toLowerCase();

  // Breather membrane: weight based on external USED m², qty stays 1 roll
  if (key === "breather_membrane" || txt.includes("breather")) {
    const usedKg = Number((externalUsedM2 * installedCoveringRates.membraneKgPerM2).toFixed(2));

    return {
      ...r,
      qty: 1,
      order_qty: 1,
      used_m2: externalUsedM2,
      weight_kg: usedKg,
      // keep weight_kg_each as-is (it currently represents per-roll) unless you want otherwise
    };
  }

  // SuperQuilt: weight based on internal USED m², qty stays 1 roll
  if (key === "superquilt" || txt.includes("superquilt")) {
  // total supplied SuperQuilt coverage across all SQ rows
  const allSqRows = (miscLinesWithWeights || []).filter((x) => {
    const xKey = String(x?.key || "").toLowerCase();
    const xTxt = String(x?.label || x?.name || "").toLowerCase();
    return xKey === "superquilt" || xTxt.includes("superquilt");
  });

  const coverages = allSqRows.map((x) =>
    superquiltCoverM2FromLabel(x?.label || x?.name || "") * Number(x?.qty ?? 0)
  );
  const rowIndex = allSqRows.indexOf(r);
  const totalSqCoverage = coverages.reduce((sum, value) => sum + value, 0);
  const usedM2Share = totalSqCoverage > 0
    ? internalUsedM2 * coverages[rowIndex] / totalSqCoverage : 0;
  const usedKg = apportionInstalledWeight(
    internalUsedM2, installedCoveringRates.superQuiltKgPerM2, coverages
  )[rowIndex] ?? 0;

  return {
    ...r,
    used_m2: usedM2Share,
    weight_kg: usedKg,
  };
}

  return r;
});

const integratedMiscellaneousAudit = isHippedLeanToEarly ? buildHippedMiscellaneousIntegrationAudit({
  geometry: hippedGeomEarly, roofInputs: inputs, materials: m,
  internalAreaM2: hippedInsulationIntegration?.superQuilt?.geometricAreaM2,
  externalAreaM2: externalUsedM2,
  tileQuantity: automaticRoofTilingAudit?.result?.tileQuantityOrdered,
  tileSystem: automaticRoofTilingAudit?.productId,
  legacyLines: miscLinesWithUsedWeights,
  automaticResult: automaticRoofTilingAudit?.result,
  insulationAudit: hippedInsulationIntegration,
  edgeModel: automaticRoofEdgeResult?.edgeModel,
  edgeLines: automaticRoofEdgeResult?.bom?.lines || [],
}) : null;
const miscLinesIntegrated = integrateMiscellaneousSummary(integratedMiscellaneousAudit, miscLinesWithUsedWeights);

  // ---------- totals per section (cost respects exclude; weight never does) ----------

  const sectionTotals = (lines = [], applyWaste = false) => {
  let cost = 0;            // base cost (no waste uplift)
  let weight = 0;          // total weight
  let chargeableCost = 0;  // cost including waste uplift (only when applyWaste)

  (lines || []).forEach((r) => {
    const base = asCost(r);
    const w = lineWeightKg(r);

    if (!isExcluded(r.key)) {
      cost += base;
      chargeableCost += applyWaste && !r.isAddedItem
        ? base * (1 + wasteFractionForKey(r.key))
        : base;
    }

    if (Number.isFinite(w)) weight += w;
  });

  return { cost, weight, chargeableCost };
};
const timberLinesAdjusted = withAddedItems(applyAdjustmentsToLines(timberLines, adjustments), "timber");
const tilesLinesAdjusted = withAddedItems(applyAdjustmentsToLines(tilesLines, adjustments), "tiles");
const timberTotals   = sectionTotals(timberLinesAdjusted, true);
const tilesTotals    = sectionTotals(tilesLinesAdjusted, false);
  // ------------------------------
// USED-WEIGHT PATCH (Plastics + Gutters)
// Weight should reflect *used metres* (or m² where applicable) even if pricing/ordering is per-length.
// This patch DOES NOT rely on frontRunM/soffitRunM etc. It reads whatever the row already contains.
// ------------------------------

const pickUsedMetres = (r) => {
  // Try the most common “used length” fields first
  const candidates = [
    r.used_m,
    r.usedM,
    r.length_used_m,
    r.lengthUsedM,
    r.run_m,
    r.runM,
    r.total_m,
    r.totalM,
    r.len_m,
    r.lenM,
    r.length_m,
    r.lengthM,
    r.m, // sometimes used by older code
  ];

  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
};
const mmToM = (mm) => Number(mm || 0) / 1000;



const normaliseQty = (r) => Number(r.order_qty ?? r.orderQty ?? r.qty ?? 0) || 0;
const getUnit = (r) => String(r?.unit || "").toLowerCase().trim();

// If the row is already expressed in metres, treat qty as used metres.
// (Ordering may still be per-length elsewhere, but weight needs used metres.)
const inferUsedMetresFromUnit = (r, fallbackStockLenM) => {
  const unit = getUnit(r);
  const qty = normaliseQty(r);
  const stockLen = Number(r.stock_len_m ?? r.stockLenM ?? fallbackStockLenM ?? 0) || 0;

  if (unit === "m" || unit === "metre" || unit === "metres") {
    // If qty is a sensible cut length (<= stock length), assume it’s the used metres
    if (qty > 0 && stockLen > 0 && qty <= stockLen * 1.01) return qty;

    // If qty is already a “run length” (often bigger than stock), still accept it
    if (qty > 0 && stockLen === 0) return qty;
  }

  return 0;
};
// ------------------------------
// PLASTICS USED-LENGTH HELPERS
// ------------------------------

// External width used for fascia lengths (your rule):
// internal width + frame-on for exposed sides + fascia lip for exposed sides (when no side overhang)
const plasticsExternalWidthUsedM = (inputs) => {
  const iw = Number(inputs?.internalWidthMM ?? 0);
  const frameOn = Number(inputs?.frame_on_mm ?? 70);     // your default assumption is 70
  const lip = Number(inputs?.fascia_lip_mm ?? 25);       // lip 25mm each side (when applicable)

  const leftExposed = !!inputs?.left_exposed;
  const rightExposed = !!inputs?.right_exposed;

  const lo = Number(inputs?.left_overhang_mm ?? 0);
  const ro = Number(inputs?.right_overhang_mm ?? 0);

  // Frames only count where the side is exposed
  const frameMm = (leftExposed ? frameOn : 0) + (rightExposed ? frameOn : 0);

  // Lip only matters when that side is exposed AND there is NO overhang on that side
  const lipMm =
    (leftExposed && lo <= 0 ? lip : 0) +
    (rightExposed && ro <= 0 ? lip : 0);

  // Side overhangs add to width if used
  const usedMm = iw + frameMm + lipMm + lo + ro;

  return Number(mmToM(usedMm).toFixed(3));
};

// Soffit “front run” = internal width + eaves both sides
const plasticsSoffitRunUsedM = (inputs) => {
  const iw = Number(inputs?.internalWidthMM ?? 0);
  const eo = Number(inputs?.eaves_overhang_mm ?? 0);
  const usedMm = iw + (2 * eo);
  return Number(mmToM(usedMm).toFixed(3));
};

// End fascia runs (left/right) — use internal projection + front eaves overhang.
// (This matches your “front overhang exists” logic; back is a wall/ledger so no rear overhang.)
const plasticsEndFasciaRunUsedM = (inputs) => {
  const ip = Number(inputs?.internalProjectionMM ?? 0);
  const eo = Number(inputs?.eaves_overhang_mm ?? 0);
  const usedMm = ip + eo;
  return Number(mmToM(usedMm).toFixed(3));
};

const patchLinesUsedWeight = (lines, getKgPerM, fallbackStockLenM) => {
  return (lines || []).map((r) => {
    const txt = `${r.key || ""} ${r._k || ""} ${r.label || ""} ${r.name || ""}`.toLowerCase();
        // 🔍 DEBUG: gutter rows only
    if (txt.includes("gutter")) {









    }

        // ✅ GUTTERS/DOWNPIPES fittings: ITEM weights (kg each), not kg/m
    // Only gutters length line uses kg/m (handled later by kgPerM logic)
    const qtyEach = normaliseQty(r);

    const fitKgEach = (() => {
      // ---- gutter fittings ----
      if (txt.includes("gutter") && txt.includes("bracket"))
        return Number(m?.gutter_bracket_weight_kg ?? m?.gutter_bracket_weight_kg_each ?? 0);

      if (txt.includes("gutter") && txt.includes("union"))
        return Number(m?.gutter_union_weight_kg ?? m?.gutter_union_weight_kg_each ?? 0);

      if (txt.includes("running outlet") || (txt.includes("gutter") && txt.includes("outlet")))
        return Number(m?.gutter_outlet_weight_kg ?? m?.running_outlet_weight_kg_each ?? 0);

      if (txt.includes("stop end") || txt.includes("stop-end"))
        return Number(m?.gutter_stop_end_weight_kg ?? m?.stop_end_weight_kg_each ?? 0);

      // ---- downpipe fittings ----
      // (you said: downpipe LENGTH itself is kg each, not kg/m)
      if (txt.includes("downpipe") && (txt.includes("length") || txt.includes(" m")))
        return Number(m?.dp_length_weight_kg_each ?? m?.downpipe_length_weight_kg ?? 0);

      if (txt.includes("bend") || txt.includes("offset"))
        return Number(m?.downpipe_bend_weight_kg ?? m?.dp_bend_weight_kg_each ?? 0);

      if (txt.includes("shoe"))
        return Number(m?.downpipe_shoe_weight_kg ?? m?.dp_shoe_weight_kg_each ?? 0);

      if (txt.includes("clip"))
        return Number(m?.downpipe_clip_weight_kg ?? m?.dp_clip_weight_kg_each ?? 0);

      if (txt.includes("adapt") || txt.includes("adaptor") || txt.includes("adapter"))
        return Number(m?.downpipe_adaptor_weight_kg ?? m?.dp_adaptor_weight_kg_each ?? m?.dp_adapt_weight_kg_each ?? 0);

      return 0;
    })();

    // If we found a fitting weight, apply it right here and bail out
    if (fitKgEach > 0 && qtyEach > 0) {
      return {
        ...r,
        weight_kg_each: fitKgEach,
        weight_kg: Number((qtyEach * fitKgEach).toFixed(2)),
      };
    }

    // ✅ Plastics: prefer geometry-derived “used metres” so weights aren’t qty×5m round numbers
// Fascia uses external width run, soffit uses soffit run.
// (Pricing still stays per stock length; we’re only fixing WEIGHT.)
let usedMFromGeometry = 0;
if (txt.includes("fascia")) usedMFromGeometry = plasticsExternalWidthUsedM(inputs);
if (txt.includes("soffit")) usedMFromGeometry = plasticsSoffitRunUsedM(inputs);

     // ✅ Vented fascia / vent add-ons: not a shipped physical item, so NO WEIGHT
    // (keep this very specific so it doesn't accidentally match normal fascia rows)
    const isVentedAddon =
      txt.includes("vent fascia") ||
      txt.includes("vented fascia") ||
      txt.includes("vent disc") ||
      txt.includes("ventilation disc");

    if (isVentedAddon) {
      return { ...r, weight_kg: 0, weight_kg_each: 0 };
    }
        // ✅ Per-item plastics (NOT length weighted)
    // Fascia corners are discrete fittings, so weight must be qty × kg_each
    const k = String(r?.key || "").toLowerCase();

    if (k === "fascia_corners" || txt.includes("fascia") && txt.includes("corner")) {
      const qty = normaliseQty(r);

      // Prefer editable material key if present, else fallback default
      const each = Number(m?.fascia_corner_weight_kg_each ?? 0.25) || 0;

      return {
        ...r,
        weight_kg_each: each,
        weight_kg: Number((qty * each).toFixed(2)),
      };
    }

// ✅ Downpipe LENGTH is a shipped *piece* (e.g. 2.5m), so weight is PER ITEM not per metre.
if (txt.includes("downpipe") && txt.includes("length")) {
  const each = Number(
    m?.dp_length_weight_kg_each ??
    m?.downpipe_length_weight_kg_each ??
    0
  );

  const qty = normaliseQty(r);

  return {
    ...r,
    weight_kg_each: each,
    weight_kg: Number((qty * each).toFixed(2)),
  };
}
    // ✅ Guttering + downpipe fittings are ITEM weights (kg each), not length weights
    const keyLower = String(r?.key || "").toLowerCase();


    const itemWeightEach = (() => {
      // Downpipe LENGTH (your rule: treat as item weight per 2.5m length)
      if (k === "downpipe" || txt.includes("downpipe length")) {
        // prefer a dedicated key if you add it; fallback to your existing field if that's what you've got
        return Number(m?.downpipe_length_weight_kg_each ?? m?.downpipe_weight_kg_each ?? m?.downpipe_weight_kg_per_m ?? 0);
      }

      // Downpipe fittings
      if (txt.includes("offset") || txt.includes("bend")) return Number(m?.downpipe_bend_weight_kg_each ?? 0);
      if (txt.includes("shoe")) return Number(m?.downpipe_shoe_weight_kg_each ?? 0);
      if (txt.includes("clip")) return Number(m?.downpipe_clip_weight_kg_each ?? 0);
      if (txt.includes("adaptor") || txt.includes("adapter")) return Number(m?.downpipe_adaptor_weight_kg_each ?? 0);

      // Gutter fittings
      if (txt.includes("bracket")) return Number(m?.gutter_bracket_weight_kg_each ?? 0);
      if (txt.includes("union")) return Number(m?.gutter_union_weight_kg_each ?? 0);
      if (txt.includes("stop end")) return Number(m?.gutter_stop_end_weight_kg_each ?? 0);
      if (txt.includes("outlet")) return Number(m?.gutter_outlet_weight_kg_each ?? 0);
      if (txt.includes("corner")) return Number(m?.gutter_corner_weight_kg_each ?? 0);

      return 0;
    })();

    if (itemWeightEach > 0) {
      const qty = normaliseQty(r);
      return {
        ...r,
        weight_kg_each: itemWeightEach,
        weight_kg: Number((qty * itemWeightEach).toFixed(2)),
      };
    }

    // Only apply kg/m to TRUE length-run items
const isLengthItem =
  txt.includes("fascia") ||
  txt.includes("soffit") ||
  // gutter LENGTH ONLY (not brackets/unions/stop-ends/corners/outlets)
  (txt.includes("gutter") &&
    (txt.includes(" length") || txt.includes(" 4m") || txt.includes(" 4 m"))) ||
  txt.includes("j-section") ||
  txt.includes("h-section");



    if (!isLengthItem) return r;
    // ✅ For plastics, force used lengths from geometry (NOT qty * stock length)
    if (txt.includes("fascia") || txt.includes("soffit") || txt.includes("end fascia")) {
      const kgPerM = Number(getKgPerM(r, txt) || 0);
      if (kgPerM > 0) {
        // Front fascia board uses external width used
        if (txt.includes("fascia") && !txt.includes("end fascia") && !txt.includes("corners")) {
          const usedM = plasticsExternalWidthUsedM(inputs);
          return {
            ...r,
            used_m: usedM,
            weight_kg: Number((usedM * kgPerM).toFixed(2)),
          };
        }

        // Soffit board uses soffit run used
        if (txt.includes("soffit")) {
          const usedM = plasticsSoffitRunUsedM(inputs);
          return {
            ...r,
            used_m: usedM,
            weight_kg: Number((usedM * kgPerM).toFixed(2)),
          };
        }

        // End fascia is per side — multiply by number of exposed sides
        if (txt.includes("end fascia")) {
          const perSideM = plasticsEndFasciaRunUsedM(inputs);
          const sides = (inputs?.left_exposed ? 1 : 0) + (inputs?.right_exposed ? 1 : 0);
          const usedM = Number((perSideM * Math.max(1, sides)).toFixed(3));
          return {
            ...r,
            used_m: usedM,
            weight_kg: Number((usedM * kgPerM).toFixed(2)),
          };
        }
      }
    }

    const kgPerM = Number(getKgPerM(r, txt) || 0);
    if (kgPerM <= 0) return r; // if you haven't defined kg/m yet, leave it alone
    // If unit is metres, qty may already be the used length
    const inferred = inferUsedMetresFromUnit(r, fallbackStockLenM);
    if (inferred > 0) {
      return {
        ...r,
        used_m: inferred,
        weight_kg: Number((inferred * kgPerM).toFixed(2)),
      };
    }

    const usedM = pickUsedMetres(r);
    if (usedM > 0) {
      return {
        ...r,
        used_m: usedM,
        weight_kg: Number((usedM * kgPerM).toFixed(2)),
      };
    }
if (usedMFromGeometry > 0) {
  return {
    ...r,
    used_m: usedMFromGeometry,
    weight_kg: Number((usedMFromGeometry * kgPerM).toFixed(2)),
  };
}

    // Fallback if the row doesn’t carry a used length:
    // estimate used length as qty * stock length (still better than “0”, and matches current ordering behaviour)
    const qty = normaliseQty(r);
    const stockLen = Number(r.stock_len_m ?? r.stockLenM ?? fallbackStockLenM ?? 0) || 0;
    if (qty > 0 && stockLen > 0) {
      const estUsedM = qty * stockLen;
      return {
        ...r,
        used_m: estUsedM,
        weight_kg: Number((estUsedM * kgPerM).toFixed(2)),
      };
    }

    return r;
  });
};

// Plastics kg/m (you already have these in Materials)
const plasticsKgPerM = (r, txt) => {
  const finish = String(inputs?.plastics_finish || "").toLowerCase(); // "white" or "foiled"
  const isFoiled = finish.includes("foil");

  const fasciaKgPerM = Number(
    isFoiled ? m?.fascia_weight_kg_per_m_foiled : m?.fascia_weight_kg_per_m_white
  ) || 0;

  const soffitKgPerM = Number(
    isFoiled ? m?.soffit_weight_kg_per_m_foiled : m?.soffit_weight_kg_per_m_white
  ) || 0;

  if (txt.includes("soffit")) return soffitKgPerM;
  if (txt.includes("fascia")) return fasciaKgPerM;

  return 0;
};


// Gutters kg/m — ONLY for the gutter LENGTH row (not brackets/fittings, not downpipe)
const guttersKgPerM = (r, txt) => {
  const profile = String(inputs?.gutter_profile || "").toLowerCase(); // "square" | "round" | "ogee"
  const keyLower = String(r?.key || "").toLowerCase();

  // ✅ Your gutter length row is keyed as "g_len"
  // Also allow other possible gutter-length keys if they appear later.
  const isGutterLengthKey =
    keyLower === "g_len" ||
    keyLower === "gutter" ||
    keyLower === "gutter_len" ||
    keyLower === "gutter_length";

  // Secondary safety: label text clearly shows it's a length row
  const looksLikeLengthRow =
    txt.includes("gutter") && (txt.includes("m length") || txt.includes("× 4.0 m") || txt.includes(" length"));

  const isGutterLength = isGutterLengthKey || looksLikeLengthRow;
  if (!isGutterLength) return 0;

  if (profile.includes("square")) return Number(m?.gutter_square_weight_kg_per_m ?? 0);
  if (profile.includes("round"))  return Number(m?.gutter_round_weight_kg_per_m ?? 0);
  if (profile.includes("ogee"))   return Number(m?.gutter_ogee_weight_kg_per_m ?? 0);

  // fallback
  return Number(m?.gutter_square_weight_kg_per_m ?? 0);
};





// Apply patches
const legacyPlasticsLinesWithUsedWeights = patchLinesUsedWeight(
  plasticsLines,
  plasticsKgPerM,
  Number(m?.fascia_stock_length_m ?? 5) // stock lengths are already in Materials
);

const plasticsLinesWithUsedWeights = integratePlasticsSummary(
  integratedPlasticsAudit, legacyPlasticsLinesWithUsedWeights, m
);

const gutterLinesWithUsedWeights = patchLinesUsedWeight(
  gutterLines,
  guttersKgPerM,
  Number(m?.gutter_length_m ?? 4)
);
// ------------------------------
// GUTTER FITTINGS: ITEM WEIGHTS (kg each)
// - gutter length row stays as-is (already kg/m)
// - all other gutter/downpipe fittings use kg_each from Materials
// ------------------------------
const legacyGutterLinesFinal = (gutterLinesWithUsedWeights || []).map((r) => {

  // ✅ FORCE correct stop-end quantity in Summary
  if (String(r?.key || "").toLowerCase() === "g_stop") {
    const outletType = String(
      inputs?.gutter_outlet_type ??
      inputs?.outlet_type ??
      inputs?.gutter_outlet ??
      ""
    ).toLowerCase();

    const fixedQty = outletType.includes("stop") ? 1 : 2;

    r = {
      ...r,
      qty: fixedQty,
      order_qty: fixedQty,
    };
  }

  const k2 = String(r?.key || "").toLowerCase();
  const t2 = `${r.key || ""} ${r._k || ""} ${r.label || ""} ${r.name || ""}`.toLowerCase();

  // Leave the gutter length row alone (already handled by kg/m patch)
  if (k2 === "g_len") return r;

  const qty = Number(r.order_qty ?? r.orderQty ?? r.qty ?? 0) || 0;

  const kgEach = (() => {
    if (k2 === "dp_len" || t2.includes("downpipe length")) {
      return Number(m?.dp_length_weight_kg_each ?? m?.downpipe_length_weight_kg ?? 0);
    }
    if (k2.includes("bracket") || t2.includes("bracket")) {
      return Number(m?.gutter_bracket_weight_kg ?? m?.gutter_bracket_weight_kg_each ?? 0);
    }
    if (k2.includes("union") || t2.includes("union")) {
      return Number(m?.gutter_union_weight_kg ?? m?.gutter_union_weight_kg_each ?? 0);
    }
    if (k2.includes("stop") || t2.includes("stop end")) {
      return Number(m?.gutter_stop_end_weight_kg ?? m?.stop_end_weight_kg_each ?? 0);
    }
    if (k2.includes("outlet") || t2.includes("outlet")) {
      return Number(m?.gutter_outlet_weight_kg ?? m?.running_outlet_weight_kg_each ?? 0);
    }
    if (k2.includes("bend") || t2.includes("bend")) {
      return Number(m?.downpipe_bend_weight_kg ?? m?.dp_bend_weight_kg_each ?? 0);
    }
    if (k2.includes("shoe") || t2.includes("shoe")) {
      return Number(m?.downpipe_shoe_weight_kg ?? m?.dp_shoe_weight_kg_each ?? 0);
    }
    if (k2.includes("clip") || t2.includes("clip")) {
      return Number(m?.downpipe_clip_weight_kg ?? m?.dp_clip_weight_kg_each ?? 0);
    }
    if (k2.includes("adapt") || t2.includes("adaptor") || t2.includes("adapter")) {
      return Number(m?.downpipe_adaptor_weight_kg ?? m?.dp_adaptor_weight_kg_each ?? m?.dp_adapt_weight_kg_each ?? 0);
    }
    return 0;
  })();

  if (kgEach <= 0) return r;

  const totalKg = qty > 0 ? Number((qty * kgEach).toFixed(2)) : 0;

  return {
    ...r,
    weight_kg_each: kgEach,
    weight_kg: totalKg,
  };
});
const gutterLinesFinal = integrateGutteringSummary(integratedGutterAudit, legacyGutterLinesFinal, m);
// TEMP DEBUG: gutter fitting weights (remove after test)


const plasticsLinesAdjusted = withAddedItems(applyAdjustmentsToLines(plasticsLinesWithUsedWeights, adjustments), "plastics");
const metalLinesAdjusted = withAddedItems(applyAdjustmentsToLines(metalLines, adjustments), "metal");
const gutterLinesAdjusted = withAddedItems(applyAdjustmentsToLines(gutterLinesFinal, adjustments), "gutters");
const miscLinesAdjusted = applyAdjustmentsToLines(miscLinesIntegrated, adjustments);
  const plasticsTotals = sectionTotals(plasticsLinesAdjusted, false);
  const metalTotals    = sectionTotals(metalLinesAdjusted, false);
  const gutterTotals   = sectionTotals(gutterLinesAdjusted, false);
  
  const pirOrder = ["pir50_cradle", "slab100"];

const miscLinesForSection = withAddedItems(miscLinesIntegrated || [], "misc").sort((a, b) => {
  const ai = pirOrder.indexOf(a.key);
  const bi = pirOrder.indexOf(b.key);

  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;

  return 0;
});
const miscLinesForSectionAdjusted = applyAdjustmentsToLines(
  miscLinesForSection,
  adjustments
);
const miscTotals = sectionTotals(miscLinesForSectionAdjusted, false);
  

  

  const sections = {
    timber: { lines: timberLinesAdjusted, totals: timberTotals },
    tiles: { lines: tilesLinesAdjusted, totals: tilesTotals },
    plastics: { lines: plasticsLinesAdjusted, totals: plasticsTotals },
    metal: { lines: metalLinesAdjusted, totals: metalTotals },
    gutters: { lines: gutterLinesAdjusted, totals: gutterTotals },
    misc: { lines: miscLinesForSectionAdjusted, totals: miscTotals },
  };
  const round = value => Number(value.toFixed(2));
  const pricingSections = Object.fromEntries(Object.entries(sections).map(([key, section]) =>
    [key, round(key === 'timber' ? section.totals.chargeableCost : section.totals.cost)]));
  const materialsCostForPricing = round(Object.values(pricingSections).reduce((sum, value) => sum + value, 0));
  const materialsBaseCost = round(Object.values(sections).reduce((sum, section) => sum + round(section.totals.cost), 0));
  // Same installed roof weight convention used by Summary: all material
  // sections (including price-excluded rows), plus plasterboard once.
  const materialsWeightKg = Object.values(sections).reduce((sum, section) => sum + section.totals.weight, 0);
  const plasterboardAreaM2 = isHippedLeanToEarly && hippedInsulationIntegration?.valid
    ? hippedInsulationIntegration.superQuilt.geometricAreaM2
    : Number(totalsInput.widthMM || 0) * Number(totalsInput.projMM || 0) / 1_000_000;
  const plasterboardWeightKg = plasterboardAreaM2 * 8.5;
  const installedWeightKg = materialsWeightKg + plasterboardWeightKg;
  return {
    sections, pricingSections, materialsCostForPricing, materialsBaseCost,
    quantityAdjustments: adjustments,
    manufactureGeometry: isHippedLeanToEarly ? hippedGeomEarly : null,
    materialsWeightKg, plasterboardWeightKg, installedWeightKg,
    timberLinesAdjusted, tilesLinesAdjusted, plasticsLinesAdjusted, metalLinesAdjusted, gutterLinesAdjusted,
    miscLinesForSection, miscLinesForSectionAdjusted,
    timberTotals, tilesTotals, plasticsTotals, metalTotals, gutterTotals, miscTotals,
    totalsInput, totals, isHippedLeanToEarly, hippedInsulationIntegration,
    lineChargeableCost, sectionTotals,
  };
}
