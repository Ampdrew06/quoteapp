import { resolveCustomerDeliveryMiles } from "../lib/customerRecords";
import { persistSummaryPricingState } from "../lib/Calculations/summaryPricingState";
import { buildSummaryMaterialsModel } from "../lib/Calculations/summaryMaterialsModel";
import { buildSummaryItemCatalog, buildSummaryAddedItemLines, readSummaryAddedItems, writeSummaryAddedItems } from "../lib/Calculations/summaryAddedItems";
// src/pages/Summary.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getMaterials } from "../lib/materials";
import NavTabs from "../components/NavTabs"; 
import { getCustomers } from "../lib/customers";
import { computePricing, computeLabourPricing, computeDeliveryPricing, getLabourPricingConfig, saveLabourPricingConfig, getDeliveryPricingConfig, saveDeliveryPricingConfig, getMarkupPricingConfig, saveMarkupPricingConfig } from "../lib/pricing";
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
    persistSummaryPricingState();
    window.dispatchEvent(new Event("summary_exclusions_updated"));
  } catch {
    // ignore
  }
};

const loadExclusionValues = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_exclusion_values") || "{}");
  } catch {
    return {};
  }
};

const saveExclusionValues = (obj) => {
  try {
    localStorage.setItem("summary_exclusion_values", JSON.stringify(obj || {}));
    window.dispatchEvent(new Event("summary_exclusions_updated"));
  } catch {
    // ignore
  }
};

const loadAdjustments = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_adjustments") || "{}");
  } catch {
    return {};
  }
};

const saveAdjustments = (obj) => {
  try {
    localStorage.setItem("summary_adjustments", JSON.stringify(obj || {}));
    persistSummaryPricingState();
    window.dispatchEvent(new Event("summary_adjustments_updated"));
  } catch {
    // ignore
  }
};

const loadAdjustmentValues = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_adjustment_values") || "{}");
  } catch {
    return {};
  }
};

const saveAdjustmentValues = (obj) => {
  try {
    localStorage.setItem("summary_adjustment_values", JSON.stringify(obj || {}));
    window.dispatchEvent(new Event("summary_adjustments_updated"));
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
  const [customers, setCustomers] = useState([]);

useEffect(() => {
  let alive = true;

  async function loadCustomers() {
    const loadedCustomers = await getCustomers();

    if (alive) {
      setCustomers(Array.isArray(loadedCustomers) ? loadedCustomers : []);
    }
  }

  loadCustomers();

  return () => {
    alive = false;
  };
}, []);
  const [labourConfig, setLabourConfig] = useState(() =>
  getLabourPricingConfig()
);

const [labourDaysOverride, setLabourDaysOverride] = useState(() => {
  const saved = loadInputs();
  return saved?.labourDaysOverride ?? "";
});

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
    window.addEventListener("leanToInputs_updated", bump);
    

    // Fired when localStorage changes (other tabs)
    const onStorage = (e) => {
      if (e && e.key === "materials_v1") {
        bump();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("materials_updated", bump);
      window.removeEventListener("leanToInputs_updated", bump);
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


  // ---- exclusions (unchanged behaviour) ----
  const [ex, setEx] = useState(loadExclusions());
const [adjustments, setAdjustments] = useState(loadAdjustments());
const [adjustmentDrafts, setAdjustmentDrafts] = useState(loadAdjustments());

useEffect(() => {
  const refreshExclusions = () => {
    setEx(loadExclusions());
  };

  window.addEventListener("summary_exclusions_updated", refreshExclusions);

  return () => {
    window.removeEventListener("summary_exclusions_updated", refreshExclusions);
  };
}, []);

useEffect(() => {
  const refreshAdjustments = () => {
    setAdjustments(loadAdjustments());
  };

  window.addEventListener("summary_adjustments_updated", refreshAdjustments);

  return () => {
    window.removeEventListener("summary_adjustments_updated", refreshAdjustments);
  };
}, []);

  const toggle = (key, rowValue = 0) => {
  const k = String(key || "");
  const next = { ...(ex || {}) };
  const nextValues = loadExclusionValues();

  if (next[k]) {
    delete next[k];
    delete nextValues[k];
  } else {
    next[k] = true;
    nextValues[k] = -Math.abs(Number(rowValue) || 0);
  }

  setEx(next);
  saveExclusions(next);
  saveExclusionValues(nextValues);
};


  const [addedItems, setAddedItems] = useState(() => readSummaryAddedItems());
  useEffect(() => {
    const refresh = () => setAddedItems(readSummaryAddedItems());
    window.addEventListener("leanToInputs_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("leanToInputs_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const itemCatalog = buildSummaryItemCatalog(m);
  const addedLines = buildSummaryAddedItemLines(addedItems, m);
  const saveAddedItems = (next) => {
    const saved = writeSummaryAddedItems(next);
    setAddedItems(saved);
    window.dispatchEvent(new Event("leanToInputs_updated"));
    window.dispatchEvent(new Event("summary_adjustments_updated"));
  };
  const addItem = (section, catalogId) => {
    if (!itemCatalog.some(item => item.section === section && item.id === catalogId && item.unitPrice != null) || addedItems.some(item => item.section === section && item.catalogId === catalogId)) return;
    saveAddedItems([...addedItems, { section, catalogId, qty: 1, excluded: false }]);
  };
  const updateAddedItem = (row, patch) => saveAddedItems(addedItems.map(item =>
    item.section === row.section && item.catalogId === row.catalogId ? { ...item, ...patch } : item));
  const removeAddedItem = (row) => saveAddedItems(addedItems.filter(item =>
    !(item.section === row.section && item.catalogId === row.catalogId)));
  const withAddedItems = (lines, section) => [...lines, ...addedLines.filter(row => row.section === section)];
  const isExcluded = (key) => String(key || "").startsWith("extra:")
    ? !!addedLines.find(row => row.key === key)?.extraExcluded
    : !!(ex && ex[String(key || "")]);

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


  const summaryMaterials = buildSummaryMaterialsModel({
    inputs, materials: m, exclusions: ex, adjustments, addedItems,
  });
  const {
    timberLinesAdjusted, tilesLinesAdjusted, plasticsLinesAdjusted, metalLinesAdjusted, gutterLinesAdjusted,
    miscLinesForSection, miscLinesForSectionAdjusted,
    timberTotals, tilesTotals, plasticsTotals, metalTotals, gutterTotals, miscTotals,
    totalsInput, totals, isHippedLeanToEarly, hippedInsulationIntegration,
    lineChargeableCost, sectionTotals,
  } = summaryMaterials;

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

const Section = ({ title, section, lines, totals, showChargeable }) => {
  const tdRight = { ...td, textAlign: "right" };

  // Sum of chargeable cost (cost + waste uplift) for this section
  const chargeableTotal = (lines || []).reduce((sum, r) => {
    if (isExcluded(r.key)) return sum;
    return sum + lineChargeableCost(r);
  }, 0);

  // ✅ Column widths MUST total 100% or you’ll force a scrollbar
const colWidths = showChargeable
  ? [28, 7, 9, 9, 11, 11, 11, 6]
  : [24, 7, 8, 8, 8, 18, 5];

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
const rowCostForManualChanges =
  Number.isFinite(chargeable) && chargeable !== 0
    ? chargeable
    : baseCost;

    if (String(r.key || "").includes("steico")) {
  console.log("STEICO ROW DEBUG", {
    key: r.key,
    label: r.label || r.name || r.item,
    qty,
    baseCost,
    chargeable,
    rowCostForManualChanges,
    rawRow: r,
  });
}
    return (
      <tr
  key={(r.key || r.label || r.name || "row") + "-" + idx}
  style={isExcluded(r.key) ? { opacity: 0.55 } : undefined}
>
  <td style={td}>
    {r.label || r.name || r.item || r.key}
    {r.price_unconfigured && r.isAddedItem && <span style={{ color: "#92400e" }}> — price unconfigured</span>}
    {r.isAddedItem && <button type="button" onClick={() => removeAddedItem(r)}
      style={{ marginLeft: 6, fontSize: 11 }} aria-label={`Remove ${r.label}`}>Remove</button>}
  </td>
  <td style={td}>{Number.isFinite(qty) ? qty : "—"}</td>
  <td style={td}>{Number.isFinite(orderQty) ? orderQty : "—"}</td>
  <td style={td}>{displayUnits(r)}</td>
  <td style={td} title={r.isAddedItem ? "Supplied extra; excluded from installed roof weight" : undefined}>{r.isAddedItem ? "—" : fmtKg(w)}</td>
  <td style={tdRight}>{fmtMoney(baseCost)}</td>
  {showChargeable && <td style={tdRight}>{fmtMoney(chargeable)}</td>}

  <td style={td}>
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <input
      type="checkbox"
      checked={isExcluded(r.key)}
      onChange={() => r.isAddedItem ? updateAddedItem(r, { excluded: !r.extraExcluded }) : toggle(r.key, rowCostForManualChanges)}
      title={r.isAddedItem ? "Exclude extra cost; item remains on the supply list" : "Exclude cost (weight still included)"}
    />

    <input
  type="text"
  inputMode="decimal"
  style={{
    width: 38,
    padding: "1px 3px",
    fontSize: 11,
    boxSizing: "border-box",
  }}
  key={r.isAddedItem ? `${r.key}:${r.qty}` : r.key}
  defaultValue={r.isAddedItem ? (r.qty - 1 || "") : (adjustments[r.key] ?? "")}
  placeholder="+/-"
  onBlur={(e) => {
    console.log("ADJUSTMENT BLUR", r.key, e.target.value);

    const raw = e.target.value;
    if (r.isAddedItem) {
      if (raw === "" || Number.isFinite(Number(raw))) updateAddedItem(r, { qty: Math.max(0, 1 + (Number(raw) || 0)) });
      else e.target.value = String(r.qty - 1 || "");
      return;
    }
    const next = { ...adjustments };

    const nextValues = loadAdjustmentValues();

if (raw === "" || Number(raw) === 0 || !Number.isFinite(Number(raw))) {
  delete next[r.key];
  delete nextValues[r.key];
} else {
  const adjustmentQty = Number(raw);
  const qty = asQty(r);

  const lineCostForAdjustment = rowCostForManualChanges;

  const unitCost =
    Number.isFinite(qty) && qty > 0
      ? lineCostForAdjustment / qty
      : 0;

  next[r.key] = raw;
  nextValues[r.key] = unitCost * adjustmentQty;
}

setAdjustments(next);
saveAdjustments(next);
saveAdjustmentValues(nextValues);
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }}
  title="Adjust quantity (+ or -)"
/>
  </div>
</td>
</tr>

    );
  })}

  <tr>
    <td style={td} colSpan={showChargeable ? 8 : 7}>
      <select aria-label={`Add item to ${title}`} value=""
        onChange={(event) => addItem(section, event.target.value)}
        style={{ width: "100%", maxWidth: 560, padding: "6px 8px" }}>
        <option value="">Add item…</option>
        {itemCatalog.filter(item => item.section === section &&
          !addedItems.some(added => added.section === section && added.catalogId === item.id)).map(item => (
          <option key={item.id} value={item.id} disabled={item.unitPrice == null}>
            {item.label} — {item.unitPrice == null ? "set price in Materials" : `${fmtMoney(item.unitPrice)} / ${item.units}`}
          </option>
        ))}
      </select>
    </td>
  </tr>
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
const overallCost = summaryMaterials.materialsBaseCost;

const overallWeight =
  timberTotals.weight +
  tilesTotals.weight +
  plasticsTotals.weight +
  metalTotals.weight +
  gutterTotals.weight +
  miscTotals.weight;

// --- Plasterboard calculation ---
const roofAreaM2 =
  isHippedLeanToEarly && hippedInsulationIntegration?.valid
    ? hippedInsulationIntegration.superQuilt.geometricAreaM2
    : (totalsInput?.widthMM || 0) *
  (totalsInput?.projMM || 0) /
  1_000_000;

// Board size (2.4m x 1.2m)
const boardAreaM2 = 2.88;

// Number of boards (rounded up)
const plasterboardQty = Math.ceil(roofAreaM2 / boardAreaM2);

// Weight per m²
const plasterboardKgPerM2 = 8.5;

// Total plasterboard weight
const plasterboardWeight = roofAreaM2 * plasterboardKgPerM2;

// Installed total weight
const installedWeight = overallWeight + plasterboardWeight;
console.log("SUMMARY_WEIGHT_DEBUG", {
  timberWeight: timberTotals.weight,
  metalWeight: metalTotals.weight,
  leanToWeight: leanToWeightTotals.weight,
  overallWeight,
  allLinesCount: totals.allLines?.length,
});

// Only timber is chargeable (waste uplift). Lean-to materials pricing comes straight from totals.

const labourFeatures = {
  roofVent: false,
  fixedUnit: false,
  reinforcedRingBeam: false,
};

const areaM2 =
  ((totalsInput?.widthMM || 0) * (totalsInput?.projMM || 0)) / 1_000_000;

let baseDays = 1;

if (areaM2 > 8.75) {
  baseDays = 1 + ((areaM2 - 8.75) * 0.15);
}

baseDays = Math.min(baseDays, 3);
baseDays = Math.ceil(baseDays * 10) / 10;

const labourConfigAdjusted = {
  ...labourConfig,
  minimumDays: Math.max(Number(labourConfig.minimumDays || 1), baseDays),
};

const labourBase = computeLabourPricing({
  widthMM: totalsInput?.widthMM,
  projectionMM: totalsInput?.projMM,
  tileSystem: totalsInput?.tileSystem,
  config: labourConfigAdjusted,
  features: labourFeatures,
});

const overrideDays = Number(labourDaysOverride);

const calculatedDays =
  labourBase?.days ??
  labourBase?.labourDays ??
  labourConfigAdjusted.minimumDays;

const finalDays =
  Number.isFinite(overrideDays) && overrideDays > 0
    ? overrideDays
    : calculatedDays;

const labour = {
  ...labourBase,
  days: finalDays,
  labourCost: finalDays * Number(labourConfig.dayRate || 0),
};

// Get saved delivery distance from D/O page
let savedInputs = {};

if (typeof window !== "undefined") {
  try {
    savedInputs = JSON.parse(window.localStorage.getItem("leanToInputs") || "{}");
  } catch {}
}

const selectedCustomerId = savedInputs.selectedCustomerId || "retail";
const deliveryCustomer = customers.find(customer => customer.id === selectedCustomerId);
const deliveryDistanceMiles = resolveCustomerDeliveryMiles(savedInputs.deliveryDistanceMiles, deliveryCustomer);

const deliveryResult = computeDeliveryPricing(
  deliveryDistanceMiles,
  deliveryConfig
);

const deliveryCost = deliveryResult.deliveryCost;
let discountPct = 0;

if (selectedCustomerId !== "retail") {
  const selected = customers.find((c) => c.id === selectedCustomerId);

  discountPct = Number(
    selected?.discountPct ??
    savedInputs?.discountPct ??
    savedInputs?.discount_pct ??
    0
  );
}
const adjustedMaterialsCostForPricing = summaryMaterials.materialsCostForPricing;
console.log("SUMMARY_PRICE_DEBUG", {
  discountPct,
  adjustedMaterialsCostForPricing,
  deliveryCost,
  labourCost: labour.labourCost,
});


const pricing = computePricing(
  adjustedMaterialsCostForPricing,
  {
    ...m,
    profit_pct: markupConfig.profitPct,
  },
  {
    labourCost: labour.labourCost,
    deliveryCost,
    discountPct,
  }
);



const pricingMaterialsCost = adjustedMaterialsCostForPricing;
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

      <p style={{ fontSize: 13, color: "#4b5563" }}>
        Use <b>Add item</b> for supplied extras, then <b>+/−</b> to change their quantity.
        Extra costs are included in the quotation; installed roof weight remains unchanged.
      </p>
      <Section section="timber" title="Timber Elements" lines={timberLinesAdjusted} totals={timberTotals} showChargeable />
      <Section section="tiles" title="Tile Elements" lines={tilesLinesAdjusted} totals={tilesTotals} showChargeable={false} />
      <Section section="plastics" title="Plastics Elements" lines={plasticsLinesAdjusted} totals={plasticsTotals} showChargeable={false} />
      <Section section="metal" title="Metal Elements" lines={metalLinesAdjusted} totals={metalTotals} showChargeable={false} />
      <Section section="gutters" title="Guttering Elements" lines={gutterLinesAdjusted} totals={gutterTotals} showChargeable={false} />
      <Section section="misc" title="Miscellaneous" lines={miscLinesForSectionAdjusted} totals={miscTotals} showChargeable={false} />

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
          <b>Materials total used for pricing (sum of Elements):</b>{" "}
          {fmtMoney(summaryMaterials.materialsCostForPricing)}
        </p>

        <p style={{ margin: 0, fontSize: 13 }}>
          <b>Total Weight (all items):</b>{" "}
          {fmtKg(overallWeight)}
        </p>
<p style={{ margin: 0, fontSize: 13 }}>
  <b>Installed Weight (incl. plasterboard):</b>{" "}
  {installedWeight.toFixed(2)} kg{" "}
  <span style={{ color: "#666" }}>
    (Qty Required: {plasterboardQty} boards)
  </span>
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
              <b>Pricing reconciliation:</b> base material total{" "}
              {fmtMoney(overallCost)} → pricing materials base{" "}
              {fmtMoney(pricingMaterialsCost)}
            </p>
            <p style={{ margin: "4px 0 0" }}>
              <b>Adjustment applied:</b> {fmtMoney(pricingAdjustment)}{" "}
              <span style={{ color: "#6b7280" }}>
                (timber chargeable uplift only; quantity changes and exclusions are already included)
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
           
           <b>Labour:</b> {fmtMoney(labour.labourCost)}
<span
  style={{
    marginLeft: 8,
    padding: "2px 6px",
    borderRadius: 6,
    background: "#f3f4f6",
    color: "#374151",
    fontSize: 12,
    fontWeight: 600,
  }}
>
  ({Number(labour.days || 0).toFixed(1)} days)
</span>

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
            {pricing.discountPct > 0 && (
  <p style={{ margin: 0, fontSize: 13 }}>
    <b>Customer discount:</b>{" "}
    {pricing.discountPct.toFixed(1)}% → -{fmtMoney(pricing.discountAmount)}
  </p>
)}
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
          Default Min Days
          <input
            type="number"
            step="0.1"
            value={labourConfig.minimumDays}
            onChange={(e) =>
              updateLabourConfig({ minimumDays: Number(e.target.value) })
            }
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
  Override Days (this quote only)
  <input
    type="number"
    step="0.1"
    min="0"
    value={labourDaysOverride}
    onChange={(e) => {
  const value = e.target.value;
  setLabourDaysOverride(value);

  const saved = loadInputs() || {};
  localStorage.setItem(
    "leanToInputs",
    JSON.stringify({
      ...saved,
      labourDaysOverride: value,
    })
  );
}}
    placeholder="e.g. 1.5"
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
