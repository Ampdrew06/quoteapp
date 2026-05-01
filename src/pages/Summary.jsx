// src/pages/Summary.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMaterials } from "../lib/materials";
import { computeTilesLathsBOM } from "../lib/Calculations/tilesLathsCalc";
import { computeLiteSlateLeanTo } from "../lib/Calculations/liteslateCalc";
import { computeFasciaSoffitLeanTo } from "../lib/Calculations/fasciaSoffitCalc";
import { computeEdgeTrimsLeanTo } from "../lib/Calculations/edgeTrimsCalc";
import { computeGuttersLeanTo } from "../lib/Calculations/guttersCalc";
import { computeMiscLeanTo } from "../lib/Calculations/miscCalc";
import NavTabs from "../components/NavTabs"; 
import {
  computePricing,
  computeLabourPricing,
  computeDeliveryPricing,
  getLabourPricingConfig,
  saveLabourPricingConfig,
  getDeliveryPricingConfig,
  saveDeliveryPricingConfig,
  getMarkupPricingConfig,
  saveMarkupPricingConfig,
} from "../lib/pricing";
import { computeTotalWeightKg, applyWeightsToLines } from "../lib/utils/weights";
import { buildLeanToTotals, buildLeanToQuoteBase } from "../lib/leanToTotals";
import { calculateLeanToGeometry } from "../lib/geometry/leanToGeometry";

// adjust relative path if needed

// adjust path if file structure differs
// Safely pull the first valid positive number from a list
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
  const qty = asQty(line);
  const unitPrice = asUnitPrice(line);

  // Preferred path: qty × unitPrice (tiles, new stuff)
  if (qty && unitPrice) {
    return +(qty * unitPrice).toFixed(2);
  }

  // 🔙 Backwards-compat for existing timber / legacy lines
  const directCostCandidates = [
    line.cost,
    line.line,
    line.totalCost,
    line.total_cost,
  ];

  for (const v of directCostCandidates) {
    if (v == null) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n !== 0) return n;
  }

  return 0;
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


// ---------- small helpers ----------

const tabStyle = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f9fafb",
  textDecoration: "none",
  color: "#333",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const activeTabStyle = {
  ...tabStyle,
  background: "#0284c7",
  color: "#fff",
  borderColor: "#0284c7",
  fontWeight: 600,
};

const th = {
  border: "1px solid #e5e7eb",
  padding: "4px 6px",
  fontSize: 12,
  textAlign: "left",
  background: "#f9fafb",
};

const td = {
  border: "1px solid #e5e7eb",
  padding: "4px 6px",
  fontSize: 12,
  verticalAlign: "top",
};

const fmtMoney = (n) => `£${(Number(n) || 0).toFixed(2)}`;
const fmtKg = (n) => `${Number(n || 0).toFixed(2)} kg`;

// exclusions in localStorage
const loadExclusions = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_exclusions") || "{}");
  } catch {
    return {};
  }
};

const saveExclusions = (obj) => {
  try {
    localStorage.setItem("summary_exclusions", JSON.stringify(obj || {}));
    window.dispatchEvent(new Event("summary_exclusions_updated"));
  } catch {
    // ignore
  }
};

// lean-to inputs (same key used by LeanToLanding / Quotes)
const loadInputs = () => {
  try {
    return JSON.parse(localStorage.getItem("leanToInputs") || "null");
  } catch {
    return null;
  }
};

// ---------- main component ----------

export default function Summary() {
  const [labourConfig, setLabourConfig] = useState(() =>
  getLabourPricingConfig()
);
const updateLabourConfig = (patch) => {
  const next = { ...labourConfig, ...patch };
  setLabourConfig(next);
  saveLabourPricingConfig(next);
};
const [markupConfig, setMarkupConfig] = useState(() =>
  getMarkupPricingConfig()
);

const updateMarkupConfig = (patch) => {
  const next = { ...markupConfig, ...patch };
  setMarkupConfig(next);
  saveMarkupPricingConfig(next);
};
const [deliveryConfig, setDeliveryConfig] = useState(() =>
  getDeliveryPricingConfig()
);

const updateDeliveryConfig = (patch) => {
  const next = { ...deliveryConfig, ...patch };
  setDeliveryConfig(next);
  saveDeliveryPricingConfig(next);
};
  // ---- react to Materials changes ----
  const [materialsTick, setMaterialsTick] = useState(0);

  useEffect(() => {
    const bump = () => setMaterialsTick((t) => t + 1);

    // Fired when Materials page saves
    window.addEventListener("materials_updated", bump);

    // Fired when localStorage changes (other tabs)
    const onStorage = (e) => {
      if (e && e.key === "materials_v1") {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("materials_updated", bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  // ⬇️ SINGLE source of truth for Materials inside Summary
  const m0 = useMemo(() => getMaterials(), [materialsTick]);

// Force cradle to NOT be included in rafter/steico pricing (we price it separately in Misc)
const m = useMemo(
  () => ({ ...m0, include_rafters_pir_cradle_in_rafters: false }),
  [m0]
);

  // ---------- weights ----------
  const lineWeightKg = (r) => {

  if (!r) return 0;

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


  // ---- exclusions (unchanged behaviour) ----
  const [ex, setEx] = useState(loadExclusions());

  useEffect(() => {
  const refreshExclusions = () => {
    setEx(loadExclusions());
  };

  window.addEventListener("summary_exclusions_updated", refreshExclusions);

  return () => {
    window.removeEventListener("summary_exclusions_updated", refreshExclusions);
  };
}, []);

  const toggle = (key) => {
    const k = String(key || "");
    const next = { ...(ex || {}) };

    if (next[k]) delete next[k];
    else next[k] = true;

    setEx(next);
    saveExclusions(next);
  };


  const isExcluded = (key) => !!(ex && ex[String(key || "")]);

  const inputs = loadInputs();

  // If no inputs yet, guide user back
   if (!inputs) {
    return (
      <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
        <NavTabs />
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: 16,
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Summary
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#4b5563",
            }}
          >
            No Lean-To configuration found. Go to{" "}
            <Link
              to="/quote/lean-to"
              style={{ textDecoration: "underline" }}
            >
              Design/Options
            </Link>{" "}
            first, enter the roof details, then return here.
          </p>
        </div>
      </div>
    );
  }


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
const sftForSteico =
  Number(inputs.side_frame_thickness_mm) ||
  Number(m.side_frame_thickness_mm) ||
  70;
const lipForSteico =
  Number(inputs.fascia_lip_mm) ||
  Number(m.fascia_lip_mm) ||
  25;

const wallplate_m = (iw + 2 * (sftForSteico + lipForSteico)) / 1000;

// Rafters run along slope
const raftersTotal_m = (raftersCount * timberRafterLenMM) / 1000;

// Total Steico length = rafters + wallplate
const steicoTotal_m = raftersTotal_m + wallplate_m;

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
const pseRingBeamLen_m = extWidthM;

// Price, weight, and stock from materials
const psePricePerM = Number(m.pse30x90?.price_per_m ?? 0);
const pseWeightPerM = Number(m.pse30x90?.weight_kg_per_m ?? 0);
const pseStockLenM  = Number(m.pse30x90?.stock_len_m ?? 4.8) || 4.8;

// Bars to order (can be joined if > stock length)
const pseOrderQty =
  pseStockLenM > 0 ? Math.ceil(pseRingBeamLen_m / pseStockLenM) : 0;

  // ---------- 9mm Structural Ply (wallplate + ring-beam) ----------
const extWidthPlyM = extWidthMM / 1000; // external width in metres

const soffitVisibleHeightMM =
  Number(inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150) + 70;

// 1) Ring-beam soffit strip (front run)
const soffitStrip_m2 = extWidthPlyM * (soffitVisibleHeightMM / 1000);

// 2) Wallplate full-face strip (220 mm high along external width)
const wallplateFaceHeightMM = 220;
const wallplateFace_m2 = extWidthPlyM * (wallplateFaceHeightMM / 1000);

// 3) Ring-beam upstand “strips” (195 mm high along front run)
const ringBeamUpstandHeightMM = 195;
const ringBeamUpstands_m2 = extWidthPlyM * (ringBeamUpstandHeightMM / 1000);

// 50mm PIR on inside face of ring-beam upstands (approx as continuous strip)
const pir50UpstandHeightMM = 185;
const pir50Upstands_m2 = extWidthPlyM * (pir50UpstandHeightMM / 1000);

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
  const ply18WallplateInfillHeightM = 0.142;
  const ply18WallplateInfillArea_m2 = extWidthM * ply18WallplateInfillHeightM;

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
  const internalLathsM = internalRows * intWidthM;

// Chamfered front lath ≈ one full external width
const chamferLathM = extWidthM;

// Ring-beam upstand finishing laths:
// one 25×50 per upstand, approx 0.617 m wide
const upstandBayWidthM = 0.617; // matches your 617 mm upstand width
const upstandCountForLaths = Math.max(0, raftersCount - 1);
const ringBeamUpstandLathsM =
  upstandCountForLaths * upstandBayWidthM;

// Total lath length (all 25×50) in metres
const totalLathsM =
  Math.max(0, externalLathsM) +
  Math.max(0, internalLathsM) +
  Math.max(0, chamferLathM) +
  Math.max(0, ringBeamUpstandLathsM);


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
      label: "Steico 220 I-Joists (rafters + wallplate)",
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
  label: "9mm Structural Ply (soffit + wallplate face + ring-beam upstands)",
  qty: Number(totalPly9_m2.toFixed(2)),           // m² actually used
  units: "m²",
  order_qty: ply9OrderQty,                        // number of sheets to order
  weight_kg: Number((totalPly9_m2 * ply9WeightPerM2).toFixed(2)),
  line: Number((totalPly9_m2 * ply9PricePerM2).toFixed(2)),   // base cost (no waste)
},
    {
      key: "ply18mm_wallplate_infill",
      label: "18mm Structural Ply (wallplate internal infill)",
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

const metalManualLines = [
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
    qty: raftersCount,
    units: "Ea",
    order_qty: raftersCount,
    weight_kg: Number(
      (raftersCount * joistHangerWeightEach).toFixed(2)
    ),
    line: Number(
      (raftersCount * joistHangerPriceEach).toFixed(2)
    ),
  },
];



  // Use 12m stock unless overridden in materials
  const stockLenMM = Number(m.timber_stock_length_mm || 12000) || 12000;
  const timberFullLengths =
    totalTimberMM > 0
      ? Math.max(1, Math.ceil(totalTimberMM / stockLenMM))
      : 0;

  // Basic timber / lath / ring-beam summary for this page
  const LATH_STOCK_M = Number(m.lath_stock_length_m || 4.8) || 4.8;


  // ---------- BOM + totals (single source of truth) ----------
  const exclusions = (() => {
  try {
    return JSON.parse(localStorage.getItem("summary_exclusions") || "{}");
  } catch {
    return {};
  }
})();


// Map whatever is in localStorage(leanToInputs) into the canonical shape
// that buildLeanToTotals() expects (same as LeanToLanding).
const totalsInput = {
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

const totals = buildLeanToTotals(totalsInput, exclusions);



// This is the canonical calculator output list (tiles+plastics+edge+gutters+misc)
const baseLines = (totals.allLines || [])
  .filter((r) => String(r.key || "").toLowerCase() !== "membrane")
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
  return {
    ...line,
    label: "100mm PIR insulation (sheet)",
    name: "100mm PIR insulation (sheet)",
    _k: "slab100 100mm PIR insulation (sheet)",
    units: line.unitLabel ?? line.units ?? line.unit ?? "m²",
    order_qty: line.orderQty ?? line.qty_order ?? line.order_qty ?? "—",
    weight_kg: Number(line.totalWeightKg ?? line.weight_kg ?? 0),
    cost: Number(line.total ?? line.line ?? 0),
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

if (typeof window !== "undefined") {
  window.__SUMMARY_BASELINES__ = baseLines || [];
  window.__SUMMARY_BASELINES_PRICED__ = baseLinesPriced || [];
  window.__SUMMARY_BASELINES_PRICED_WEIGHTED__ = baseLinesPricedWeighted || [];
}
if (typeof window !== "undefined") {
  console.log(
    "SUMMARY baseLines keys (first 80):",
    (baseLines || []).slice(0, 80).map((r) => r.key)
  );

  const insRows = (baseLines || []).filter((r) => {
    const t = `${r.key || ""} ${r._k || ""} ${r.label || ""} ${r.name || ""}`.toLowerCase();
    return (
      t.includes("pir") ||
      t.includes("slab") ||
      t.includes("insul") ||
      String(r.key || "").toLowerCase().includes("slab")
    );
  });

  console.log(
    "SUMMARY insulation-ish rows in baseLines:",
    insRows.map((r) => ({
      key: r.key,
      label: r.label,
      qty: r.qty,
      unit: r.unit,
      units: r.units,
      order_qty: r.order_qty,
      weight_kg: r.weight_kg,
      priceEach: r.priceEach,
      line: r.line ?? r.total,
    }))
  );
}

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
if (typeof window !== "undefined") {
  console.log(
    "🧱 DBG weight fields sample:",
    (baseLinesPriced || []).slice(0, 15).map(r => ({
      key: r.key,
      label: r.label,
      qty: r.order_qty ?? r.qty,
      weightEachKg: r.weightEachKg,
      weightPerUnitKg: r.weightPerUnitKg,
      unitWeightKg: r.unitWeightKg,
      totalWeightKg: r.totalWeightKg,
      weight_kg_each: r.weight_kg_each,
      total_weight_kg: r.total_weight_kg,
    }))
  );
}
if (typeof window !== "undefined") {
  const debugCovering = (baseLinesPriced || []).filter(r => {
    const k = String(r._k || r.key || "").toLowerCase();
    const label = String(r.label || "").toLowerCase();
    return (
      label.includes("verge") ||
      label.includes("barge") ||
      label.includes("dry verge") ||
      k.includes("verge") ||
      label.includes("liteslate")
    );
  });
  console.log("🧱 DBG Summary verge/covering lines:", debugCovering);
}
if (typeof window !== "undefined") {
  const rawTiles = (baseLines || []).filter(r => {
    const k = String(r._k || r.key || "").toLowerCase();
    const label = String(r.label || "").toLowerCase();
    return k.includes("tile") || label.includes("tile") || label.includes("liteslate");
  });
  console.log("🧱 DBG baseLines tile-ish:", rawTiles);
}
console.log("✅ SUMMARY LOG TEST – I am running");
// 🔍 DEBUG – Inspect tile lines reaching Summary
if (typeof window !== "undefined") {
  const debugTiles = (baseLinesPriced || []).filter(r => {
    const k = String(r._k || r.key || "").toLowerCase();
    const label = String(r.label || "").toLowerCase();
    return (
      k.includes("tile") ||
      label.includes("tile") ||
      label.includes("liteslate")
    );
  });

  console.log("🧱 DBG Summary tile lines:", debugTiles);
}

// ✅ Debug AFTER baseLines is defined
if (typeof window !== "undefined") {
  const pirRows = (baseLines || []).filter((r) => {
    const t = `${r.key || ""} ${r._k || ""} ${r.label || ""}`.toLowerCase();
    return t.includes("pir") || String(r.key || "").toLowerCase().includes("pir");
  });
  console.log("SUMMARY PIR rows in baseLines:", pirRows);
}

console.log(
  "SUMMARY baseLines (key/qty/weights):",
  baseLines.map((l) => ({
    key: l.key,
    label: l.label,
    qty: l.qty,
    unit: l.unit,
    priceEach: l.priceEach,
    line: l.line ?? l.total,

    unitWeightKg:
      l.unitWeightKg ??
      l.weight_kg_each ??
      l.weightKgEach ??
      l.weightEachKg ??
      null,

    totalWeightKg:
      l.totalWeightKg ??
      l.total_weight_kg ??
      l.weightKg ??
      l.weight_kg ??
      null,
  }))
);




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
  return base * (1 + wasteFractionForKey(r.key)); // apply waste uplift only for Timber
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
const timberLines = [...timberManualLines, ...timberFilteredLines].map(
  patchUnitPricesFromMaterials
);
if (typeof window !== "undefined") {
  window.__SUMMARY_TIMBER_LINES__ = timberLines;
}
const isLiteSlateSystem = tileSystem === "liteslate";
const tilesLines = baseLines
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

console.log(
  "DBG plasticsLines sample:",
  (plasticsLines || []).slice(0, 10).map(r => ({
    key: r.key, label: r.label, qty: r.qty, unit: r.unit, units: r.units, qtyDisplay: r.qtyDisplay,
    used_m: r.used_m, run_m: r.run_m, length_m: r.length_m, total_m: r.total_m,
    stock_len_m: r.stock_len_m
  }))
);

// Raw metal rows (from calculators + manual)
const metalLinesRaw = [
  ...(baseLines || []).filter((r) => {
    const k = String(r?._k || r?.key || r?.label || "").toLowerCase();
    if (k.includes("tile_starter") || k.includes("tile starter")) return false;
    return isMetal(r._k);
  }),
  ...(metalManualLines || []),
];
if (typeof window !== "undefined") {
  console.log(
    "DBG metalLinesRaw",
    (metalLinesRaw || []).map((r) => ({
      key: r.key,
      _k: r._k,
      label: r.label,
      qty: r.qty,
      order_qty: r.order_qty,
      weight_kg: r.weight_kg,
      line: r.line,
    }))
  );
}
// De-dupe metal rows by key/label so items can never appear twice
const metalLines = (() => {


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
if (typeof window !== "undefined") {
  console.log(
    "DBG metalLines final",
    (out || []).map((r) => ({
      key: r.key,
      _k: r._k,
      label: r.label,
      qty: r.qty,
      order_qty: r.order_qty,
      weight_kg: r.weight_kg,
      line: r.line,
    }))
  );
}
  return out;
})();

// 🔍 DEBUG: inspect raw gutter lines before any weighting logic
if (typeof window !== "undefined") {
  console.log(
    "DBG gutterLines sample:",
    (gutterLines || []).map((r) => ({
      key: r.key,
      _k: r._k,
      label: r.label,
      qty: r.qty,
      order_qty: r.order_qty,
      unit: r.unit,
      units: r.units,
    }))
  );
}

// ⚠️ NOTE: Misc items can appear twice (from calculators/BOM + manual rows).
// If that happens, we must dedupe by keeping the row that has price/weight/order_qty (same rule as Metal).

// 1) Manual misc rows (add items here as needed)

// ---------- 50mm PIR totals (cradle + ring-beam upstands) ----------
const pir50TotalM2 = cradleAreaM2 + (pir50Upstands_m2 || 0);

const pir50TotalOrderQty =
  pir50SheetAreaM2 > 0 ? Math.ceil(pir50TotalM2 / pir50SheetAreaM2) : 0;

const pir50KgPerM2 = Number(m?.pir50?.weight_kg_per_m2 ?? 0) || 0;
const cradleWeightMult = Number(m?.pir50_cradle_weight_multiplier ?? 1) || 1;
const upstandWeightMult = 1; // upstands not machined (make a knob later if needed)

const pir50TotalWeightKg =
  (cradleAreaM2 * pir50KgPerM2 * cradleWeightMult) +
  ((pir50Upstands_m2 || 0) * pir50KgPerM2);

// 1) Manual misc rows (add items here as needed)
const miscManualLines = [
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
if (typeof window !== "undefined") {
  window.__SUMMARY_MISC_LINES__ = miscLines;
}
// ---- Patch weights onto misc rows (without touching qty/cost logic) ----
// ✅ Use the same proven weight filler you used for baseLinesPricedWeighted
const miscLinesWithWeights = applyWeightsToLines(miscLines || [], m);
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
const internalUsedM2 = Number((internalPlanM2 * slopeFactor).toFixed(4));
const externalUsedM2 = Number((externalPlanM2 * slopeFactor).toFixed(4));

// Breather roll coverage (m²)
const breatherCoverM2 =
  Number(m?.breather_roll_width_m ?? m?.breatherMembrane?.roll_width_m ?? 0) *
  Number(m?.breather_roll_length_m ?? m?.breatherMembrane?.roll_length_m ?? 0);

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
    const rollKg = Number(m?.breather_roll_weight_kg ?? m?.breatherMembrane?.weight_kg_per_roll ?? 0);
    const cover = Number(breatherCoverM2 || 0);
    const kgPerM2 = cover > 0 ? rollKg / cover : 0;
    const usedKg = Number((externalUsedM2 * kgPerM2).toFixed(2));

    return {
      ...r,
      used_m2: externalUsedM2,
      weight_kg: usedKg,
      // keep weight_kg_each as-is (it currently represents per-roll) unless you want otherwise
    };
  }

  // SuperQuilt: weight based on internal USED m², qty stays 1 roll
  if (key === "superquilt" || txt.includes("superquilt")) {
  const rollKg = Number(m?.superquilt_roll_weight_kg ?? 0);
  const coverM2 = superquiltCoverM2FromLabel(label);
  const qty = Number(r?.qty ?? 0);

  // total supplied SuperQuilt coverage across all SQ rows
  const allSqRows = (miscLinesWithWeights || []).filter((x) => {
    const xKey = String(x?.key || "").toLowerCase();
    const xTxt = String(x?.label || x?.name || "").toLowerCase();
    return xKey === "superquilt" || xTxt.includes("superquilt");
  });

  const totalSqCoverage = allSqRows.reduce((sum, x) => {
    const xCover = superquiltCoverM2FromLabel(x?.label || x?.name || "");
    const xQty = Number(x?.qty ?? 0);
    return sum + (xCover * xQty);
  }, 0);

  const thisCoverage = coverM2 * qty;
  const usedM2Share =
    totalSqCoverage > 0
      ? Number(((internalUsedM2 * thisCoverage) / totalSqCoverage).toFixed(2))
      : internalUsedM2;

  const kgPerM2 = coverM2 > 0 ? rollKg / coverM2 : 0;
  const usedKg = Number((usedM2Share * kgPerM2).toFixed(2));

  return {
    ...r,
    used_m2: usedM2Share,
    weight_kg: usedKg,
  };
}

  return r;
});

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
      chargeableCost += applyWaste
        ? base * (1 + wasteFractionForKey(r.key))
        : base;
    }

    if (Number.isFinite(w)) weight += w;
  });

  return { cost, weight, chargeableCost };
};

  const timberTotals   = sectionTotals(timberLines, true);
  const tilesTotals    = sectionTotals(tilesLines, false);
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
      console.group("SUMMARY GUTTER ROW");
      console.log("key:", r.key);
      console.log("label:", r.label);
      console.log("txt:", txt);
      console.log("qty:", r.qty, "order_qty:", r.order_qty);
      console.log("unit:", r.unit, "units:", r.units);
      console.log("inputs.gutter_profile:", inputs?.gutter_profile);
      console.log("kgPerM returned:", getKgPerM(r, txt));
      console.groupEnd();
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
const plasticsLinesWithUsedWeights = patchLinesUsedWeight(
  plasticsLines,
  plasticsKgPerM,
  Number(m?.fascia_stock_length_m ?? 5) // stock lengths are already in Materials
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
const gutterLinesFinal = (gutterLinesWithUsedWeights || []).map((r) => {

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
// TEMP DEBUG: gutter fitting weights (remove after test)
if (typeof window !== "undefined") {
  const sample = (gutterLinesFinal || []).slice(0, 12).map((r) => ({
    key: r.key,
    label: r.label,
    qty: r.qty,
    order_qty: r.order_qty,
    weight_kg_each: r.weight_kg_each,
    weight_kg: r.weight_kg,
  }));

  console.log("DBG gutterLinesFinal sample:", sample);

  console.log("DBG m item-weight keys:", {
    gutter_bracket_weight_kg: m?.gutter_bracket_weight_kg,
    gutter_union_weight_kg: m?.gutter_union_weight_kg,
    gutter_stop_end_weight_kg: m?.gutter_stop_end_weight_kg,
    gutter_outlet_weight_kg: m?.gutter_outlet_weight_kg,
    downpipe_length_weight_kg: m?.downpipe_length_weight_kg,
    dp_length_weight_kg_each: m?.dp_length_weight_kg_each,
    downpipe_bend_weight_kg: m?.downpipe_bend_weight_kg,
    downpipe_shoe_weight_kg: m?.downpipe_shoe_weight_kg,
    downpipe_clip_weight_kg: m?.downpipe_clip_weight_kg,
    downpipe_adaptor_weight_kg: m?.downpipe_adaptor_weight_kg,
  });
}


  const plasticsTotals = sectionTotals(plasticsLinesWithUsedWeights, false);
  const metalTotals    = sectionTotals(metalLines, false);
  const gutterTotals   = sectionTotals(gutterLinesFinal, false);
  const miscTotals = sectionTotals(miscLinesWithUsedWeights, false);

  
  // Decide what to show in the Units column
const displayUnits = (r) => {
  // 1) Prefer explicit unit label if provided
  if (r.unitLabel) return r.unitLabel;

  // 2) Legacy: some lines might still have a text unit in r.unit
  if (r.unit && typeof r.unit === "string") return r.unit;

  if (r.units) {
    const raw = String(r.units).trim();
    const m = raw.match(/^[\d.,]+\s*(.*)$/);
    return m && m[1] ? m[1] : raw;
  }

  const raw = String(r.qtyDisplay || "").trim();
  if (!raw) return "";
  const m = raw.match(/^[\d.,]+\s*(.*)$/);
  return m && m[1] ? m[1] : "";
};

// ---------- table renderer with footer row ----------

const Section = ({ title, lines, totals, showChargeable }) => {
  const tdRight = { ...td, textAlign: "right" };

  // Sum of chargeable cost (cost + waste uplift) for this section
  const chargeableTotal = (lines || []).reduce((sum, r) => {
    if (isExcluded(r.key)) return sum;
    return sum + lineChargeableCost(r);
  }, 0);

  // ✅ Column widths MUST total 100% or you’ll force a scrollbar
const colWidths = showChargeable
  ? [30, 8, 10, 10, 12, 12, 12, 6] // Timber Elements with Chargeable Cost
  : [24, 7, 8, 8, 8, 18, 5]; // Other tables without Chargeable Cost

  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: "8px 0" }}>
        {title}
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            {colWidths.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>

          <thead>
  <tr>
    <th style={th}>Item</th>
    <th style={th}>Qty</th>
    <th style={th}>Order Qty</th>
    <th style={th}>Units</th>
    <th style={th}>Weight</th>
    <th style={tdRight}>Cost</th>
    {showChargeable && <th style={tdRight}>Chargeable Cost</th>}
    <th style={th}>Exclude</th>
  </tr>
</thead>



          <tbody>
  {(lines || []).map((r, idx) => {
    const qty = asQty(r);
    const orderQty = typeof r.order_qty === "number" ? r.order_qty : undefined;
    const w = lineWeightKg(r);
    const excluded = isExcluded(r.key);
    const baseCost = asCost(r);
    const chargeable = lineChargeableCost(r);

    return (
      <tr
  key={(r.key || r.label || r.name || "row") + "-" + idx}
  style={isExcluded(r.key) ? { opacity: 0.55 } : undefined}
>
  <td style={td}>{r.label || r.name || r.item || r.key}</td>
  <td style={td}>{Number.isFinite(qty) ? qty : "—"}</td>
  <td style={td}>{Number.isFinite(orderQty) ? orderQty : "—"}</td>
  <td style={td}>{displayUnits(r)}</td>
  <td style={td}>{fmtKg(w)}</td>
  <td style={tdRight}>{fmtMoney(baseCost)}</td>
  {showChargeable && <td style={tdRight}>{fmtMoney(chargeable)}</td>}
  <td style={td}>
    <input
      type="checkbox"
      checked={isExcluded(r.key)}
      onChange={() => toggle(r.key)}
      title="Exclude cost (weight still included)"
    />
  </td>
</tr>

    );
  })}

  {/* Footer total row moved to the bottom */}
  <tr>
    <td style={{ ...td, fontWeight: 700 }}>Total</td>
    <td style={td}>—</td>
    <td style={td}>—</td>
    <td style={td}>—</td>
    <td style={td}>
      <b>{fmtKg(totals.weight)}</b>
    </td>
    <td style={tdRight}>
      <b>{fmtMoney(totals.cost)}</b>
    </td>
    {showChargeable && (
      <td style={tdRight}>
        <b>{fmtMoney(chargeableTotal)}</b>
      </td>
    )}
    <td style={td}>—</td>
  </tr>
</tbody>


        </table>
      </div>
    </div>
  );
};


/// ---------- overall totals ----------

// Weight should include EVERYTHING (including excluded items), so use totals.allLines
const leanToWeightTotals = sectionTotals(totals.allLines || [], false);

// Overall totals
const overallCost =
  timberTotals.cost +
  metalTotals.cost +
  (totals.totals?.materialsCost ?? 0);

const overallWeight =
  timberTotals.weight +
  metalTotals.weight +
  (leanToWeightTotals.weight ?? 0);

// Only timber is chargeable (waste uplift). Lean-to materials pricing comes straight from totals.
const quoteBase = buildLeanToQuoteBase(inputs, exclusions);

const labourFeatures = {
  roofVent: false,
  fixedUnit: false,
  reinforcedRingBeam: false,
};

const labour = computeLabourPricing({
  widthMM: totalsInput?.widthMM,
  projectionMM: totalsInput?.projMM,
  tileSystem: totalsInput?.tileSystem,
  config: labourConfig,
  features: labourFeatures,
});

// Get saved delivery distance from D/O page
let savedInputs = {};

if (typeof window !== "undefined") {
  try {
    savedInputs = JSON.parse(window.localStorage.getItem("leanToInputs") || "{}");
  } catch {}
}

const deliveryDistanceMiles = Number(savedInputs.deliveryDistanceMiles || 0);

const deliveryResult = computeDeliveryPricing(
  deliveryDistanceMiles,
  deliveryConfig
);

const deliveryCost = deliveryResult.deliveryCost;

const pricing = computePricing(
  quoteBase?.materialsCostForPricing ?? 0,
  {
    ...m,
    profit_pct: markupConfig.profitPct,
  },
  {
    labourCost: labour.labourCost,
    deliveryCost,
  }
);
/*console.log("PRICING_COMPARE", {
  page: "Summary",
  materialsCostForPricing: quoteBase?.materialsCostForPricing,
  delivery_flat: m?.delivery_flat,
  profit_pct: m?.profit_pct,
  vat_rate: m?.vat_rate,
  net: pricing?.net,
  vat: pricing?.vat,
  gross: pricing?.gross,

  // geometry + options that MUST match LeanToLanding
  widthMM: totalsInput?.widthMM,
  projMM: totalsInput?.projMM,
  pitchDeg: totalsInput?.pitchDeg,
  leftWall: totalsInput?.leftWall,
  rightWall: totalsInput?.rightWall,
  eavesOverhangMM: totalsInput?.eavesOverhangMM,
  leftOverhangMM: totalsInput?.leftOverhangMM,
  rightOverhangMM: totalsInput?.rightOverhangMM,
  tileSystem: totalsInput?.tileSystem,
  gutterProfile: totalsInput?.gutterProfile,
  gutterOutlet: totalsInput?.gutterOutlet,
  gutterColor: totalsInput?.gutterColor,
});
*/

const pricingMaterialsCost = pricing.materialsCost;
const delivery = pricing.delivery;
const profitPct = pricing.profitPct;
const profit = pricing.profit;
const net = pricing.net;
const vatRate = pricing.vatRate;
const vat = pricing.vat;
const gross = pricing.gross;
const marginPct = pricing.marginPct;



const pricingAdjustment = (pricingMaterialsCost ?? 0) - (overallCost ?? 0);
const showPricingAdjustment = Math.abs(pricingAdjustment) > 0.01;

const pirOrder = ["pir50_cradle", "slab100"];

const miscLinesForSection = [...(miscLinesWithUsedWeights || [])].sort((a, b) => {
  const ai = pirOrder.indexOf(a.key);
  const bi = pirOrder.indexOf(b.key);

  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;

  return 0;
});

if (typeof window !== "undefined") {
  window.__SUMMARY_MISC_FOR_SECTION__ = miscLinesForSection;
  window.__SUMMARY_MISC_RENDER_ORDER__ = miscLinesForSection.map((r) => r.key);
}

return (
  <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
    <NavTabs />

    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: 12,
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: "0 0 10px",
        }}
      >
        Summary — Cost &amp; Weight Breakdown
      </h1>

      <p
        style={{
          fontSize: 13,
          color: "#4b5563",
          marginBottom: 12,
        }}
      >
        Tick <b>Exclude</b> to drop an item&apos;s cost from the quote
        (for example when a customer supplies their own gutters) while its
        weight remains included for final overall weight purposes.
      </p>

      <Section title="Timber Elements" lines={timberLines} totals={timberTotals} showChargeable />
      <Section title="Tile Elements" lines={tilesLines} totals={tilesTotals} showChargeable={false} />
      <Section title="Plastics Elements" lines={plasticsLinesWithUsedWeights} totals={plasticsTotals} showChargeable={false} />
      <Section title="Metal Elements" lines={metalLines} totals={metalTotals} showChargeable={false} />
      <Section title="Guttering Elements" lines={gutterLinesFinal} totals={gutterTotals} showChargeable={false} />
      <Section title="Miscellaneous" lines={miscLinesForSection} totals={miscTotals} showChargeable={false} />

      {/* Overall Totals Summary */}
      <div
        style={{
          marginTop: 12,
          borderTop: "2px solid #e5e7eb",
          paddingTop: 12,
        }}
      >
        <h3
          style={{
            margin: "4px 0 8px",
            fontSize: 16,
          }}
        >
          Overall Totals
        </h3>

        <p style={{ margin: 0, fontSize: 13 }}>
          <b>Total Cost (after exclusions, base):</b>{" "}
          {fmtMoney(overallCost)}
        </p>

        <p style={{ margin: 0, fontSize: 13 }}>
          <b>Total Weight (all items):</b>{" "}
          {fmtKg(overallWeight)}
        </p>

        {showPricingAdjustment && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <p style={{ margin: 0 }}>
              <b>Pricing reconciliation:</b> visible section total{" "}
              {fmtMoney(overallCost)} → pricing materials base{" "}
              {fmtMoney(pricingMaterialsCost)}
            </p>
            <p style={{ margin: "4px 0 0" }}>
              <b>Adjustment applied:</b> {fmtMoney(pricingAdjustment)}{" "}
              <span style={{ color: "#6b7280" }}>
                (includes timber waste / chargeable uplift)
              </span>
            </p>
          </div>
        )}

        {/* Pricing overview based on Summary totals */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: "1px dashed #e5e7eb",
          }}
        >
          <h4
            style={{
              margin: "0 0 6px",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Pricing overview (using chargeable materials total)
          </h4>

          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Materials used for pricing (incl. waste):</b>{" "}
            {fmtMoney(pricingMaterialsCost)}
          </p>
           
           <p style={{ margin: 0, fontSize: 13 }}>
           <b>Labour:</b>{" "}
           {fmtMoney(labour.labourCost)}
           </p>

          <div
  style={{
    margin: "6px 0",
    padding: "8px 10px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 13,
  }}
>
  <p style={{ margin: 0 }}>
    <b>Delivery:</b> {fmtMoney(delivery)}
  </p>

  <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
    One-way distance: {deliveryResult.oneWayMiles.toFixed(2)} miles
    {" "} | Return distance: {deliveryResult.returnMiles.toFixed(2)} miles
  </p>

  <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
    Time cost: {fmtMoney(deliveryResult.timeCost)}
    {" "} | Fuel cost: {fmtMoney(deliveryResult.fuelCost)}
  </p>
</div>

          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Net price:</b>{" "}
            {fmtMoney(net)}
          </p>

          <p style={{ margin: 0, fontSize: 13 }}>
            <b>VAT ({(vatRate * 100).toFixed(0)}%):</b>{" "}
            {fmtMoney(vat)}
          </p>

          <p style={{ margin: 0, fontSize: 14 }}>
            <b>Gross price:</b>{" "}
            {fmtMoney(gross)}
          </p>
           
           <p style={{ margin: 0, fontSize: 13 }}>
            <b>Profit markup:</b>{" "}
            {profitPct.toFixed(1)}% → {fmtMoney(profit)}
          </p>
          
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Margin on net (profit / net):</b>{" "}
            {Number.isFinite(marginPct) ? `${marginPct.toFixed(1)}%` : "—"}
          </p>

        </div>
      </div>
     <div
  style={{
    marginTop: 20,
    padding: 14,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#f9fafb",
  }}
>
  <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 15, fontWeight: 700 }}>
    Controls
  </h3>

  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
    {/* Labour */}
    <div
      style={{
        padding: 12,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>
        Labour
      </h4>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Day Rate (£)
          <input
            type="number"
            value={labourConfig.dayRate}
            onChange={(e) =>
              updateLabourConfig({ dayRate: Number(e.target.value) })
            }
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Days
          <input
            type="number"
            step="0.1"
            value={labourConfig.minimumDays}
            onChange={(e) =>
              updateLabourConfig({ minimumDays: Number(e.target.value) })
            }
          />
        </label>
      </div>
    </div>

    {/* Delivery */}
    <div
      style={{
        padding: 12,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>
        Delivery
      </h4>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Hourly Rate (£)
          <input
            type="number"
            step="0.01"
            value={deliveryConfig.hourlyRate}
            onChange={(e) =>
              updateDeliveryConfig({ hourlyRate: Number(e.target.value) })
            }
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Van MPG
          <input
            type="number"
            step="0.1"
            value={deliveryConfig.vanMpg}
            onChange={(e) =>
              updateDeliveryConfig({ vanMpg: Number(e.target.value) })
            }
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Fuel Price Per Litre (£)
          <input
            type="number"
            step="0.01"
            value={deliveryConfig.fuelPricePerLitre}
            onChange={(e) =>
              updateDeliveryConfig({
                fuelPricePerLitre: Number(e.target.value),
              })
            }
          />
        </label>
      </div>
    </div>

    {/* Markup */}
    <div
      style={{
        padding: 12,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>
        Markup
      </h4>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Markup (%)
          <input
            type="number"
            step="1"
            value={markupConfig.profitPct}
            onChange={(e) =>
              updateMarkupConfig({ profitPct: Number(e.target.value) })
            }
          />
        </label>
      </div>
    </div>
  </div>
</div>

      <p
        style={{
          color: "#6b7280",
          fontSize: 11,
          marginTop: 8,
        }}
      >
        Note: the Design/Options page uses the same pricing helper,
        so gross price here should match the quote, allowing you to
        cross-check materials, weight and profit in one place.
      </p>
    </div>
  </div>
);
}