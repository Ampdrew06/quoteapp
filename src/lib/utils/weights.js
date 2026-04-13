console.log("🧪 miscCalc.js LOADED");
// src/lib/utils/weights.js
// Calculates the total estimated roof weight in kilograms.
// bomItems = array of { key, qty, label?, name?, order_qty?, weight_kg_each?, ... }
// m = materials object from getMaterials()

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ✅ Fill missing weights on line items (gutter/plastics already have many; misc usually doesn't)
export function applyWeightsToLines(lines = [], m) {
  const arr = Array.isArray(lines) ? lines : [];

  const getExplicitUnit = (it) =>
    it?.weight_kg_each ??
    it?.unitWeightKg ??
    it?.weightKgEach ??
    it?.weightEachKg ??
    it?.weightPerUnitKg ??
    null;

  // Minimal mapping for the misc items that are currently 0.00 kg
const miscUnitWeightByKey = (key = "") => {
    // 🧪 TEMP DEBUG — tell us what weights.js can see
  if (typeof window !== "undefined") {
    const lsRaw = localStorage.getItem("materials_v1");
    let lsObj = null;
    try { lsObj = JSON.parse(lsRaw || "null"); } catch (e) {}

    const k0 = String(key || "").toLowerCase();
    if (["polytop_pins","alu_roll_tape","screws_rafter_eaves","screws_lath_fixings","screws_tile_fixings"].includes(k0)) {
      console.log("🧪 DBG miscUnitWeightByKey", {
        key: k0,
        m_has_polytopPins: !!m?.polytopPins,
        m_polytopPins_weight: m?.polytopPins?.weight_kg_each,
        ls_has_polytopPins: !!lsObj?.polytopPins,
        ls_polytopPins_weight: lsObj?.polytopPins?.weight_kg_each,
        ls_keys_sample: lsObj ? Object.keys(lsObj).slice(0, 25) : null,
      });
    }
  }
  const k = String(key || "").toLowerCase();

  // 🔒 Bulletproof: try passed-in materials FIRST, then fall back to materials_v1 in localStorage
  let ls = null;
  if (typeof window !== "undefined") {
    try {
      ls = JSON.parse(localStorage.getItem("materials_v1") || "null");
    } catch (e) {
      ls = null;
    }
  }

  const src = (pathFn) => {
    const a = pathFn(m);
    if (Number(a) > 0) return n(a);
    const b = pathFn(ls);
    if (Number(b) > 0) return n(b);
    return 0;
  };

  if (k === "expanding_foam")
    return src((x) => x?.expandingFoam?.weight_kg_each ?? x?.expanding_foam_can_weight_kg_each);

  if (k === "polytop_pins")
    return src((x) => x?.polytopPins?.weight_kg_each);

  if (k === "alu_roll_tape")
    return src((x) => x?.aluRollTape?.weight_kg_each);

  if (k === "screws_rafter_eaves")
    return src((x) => x?.rafterEavesScrews?.weight_kg_each);

  if (k === "screws_lath_fixings")
    return src((x) => x?.lathFixings?.weight_kg_each);

  if (k === "screws_tile_fixings")
    return src((x) => x?.tileFixings?.weight_kg_each);

  return 0;
};

  return arr.map((it) => {
    // prefer order_qty when present, else qty
    const qty = n(
  it?.order_qty ??
  it?.orderQty ??
  it?.qty ??
  it?.quantity ??
  it?.qtyDisplay ??
  0
);

    const explicit = getExplicitUnit(it);
    const unitWeight =
      typeof explicit === "number" && Number.isFinite(explicit)
        ? explicit
        : miscUnitWeightByKey(it?.key);

    // If still 0, leave as-is
    if (!unitWeight) return it;

    const totalWeight = +(unitWeight * qty).toFixed(3);

    return {
      ...it,
      unitWeightKg: unitWeight,
      weight_kg_each: unitWeight,
      weightEachKg: unitWeight,
      weightPerUnitKg: unitWeight,
      totalWeightKg: totalWeight,
      total_weight_kg: totalWeight,
    };
  });
}

export function computeTotalWeightKg(bomItems, m) {
  // ✅ DEBUG: sample a few rows (gutters + the misc items you're missing)
  if (typeof window !== "undefined") {
    const sample = (bomItems || []).filter((r) => {
      const t = `${r.key || ""} ${r._k || ""} ${r.label || ""}`.toLowerCase();
      return (
        t.includes("gutter") ||
        String(r.key || "").toLowerCase().startsWith("g_") ||
        t.includes("downpipe") ||
        t.includes("expanding foam") ||
        t.includes("polytop") ||
        t.includes("roll tape") ||
        t.includes("rafter/eaves") ||
        t.includes("lath fixings") ||
        t.includes("tile fixing")
      );
    });

    console.log(
      "🧪 DBG computeTotalWeightKg sample rows:",
      sample.map((r) => ({
        key: r.key,
        label: r.label,
        qty: r.qty ?? r.order_qty ?? r.orderQty ?? r.qtyDisplay,
        unitWeightKg:
          r.weightEachKg ??
          r.weightPerUnitKg ??
          r.unitWeightKg ??
          r.weight_kg_each ??
          null,
        totalWeightKg:
          r.totalWeightKg ??
          r.total_weight_kg ??
          r.weightKg ??
          r.weight_kg ??
          null,
      }))
    );
  }

  const weightByItem = (it) => {
    // 1) Prefer explicit weights coming from calculators/BOM lines
    const explicit =
      it?.weight_kg_each ??
      it?.unitWeightKg ??
      it?.weightKgEach ??
      it?.weightEachKg ??
      it?.weightPerUnitKg ??
      null;

    if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) return explicit;

    // 2) Otherwise infer from key/label/name text and map to Materials weights
    const key = String(it?.key || "").toLowerCase().trim();
    const label = String(it?.label || it?.name || "").toLowerCase().trim();
    const txt = `${key} ${label}`.replace(/\s+/g, " ").trim();

    // ---- Tiles: Britmet / LiteSlate ----
    // Main tiles row (your Summary often uses key "tiles" + label "Britmet tiles" / "LiteSlate tiles")
    const isMainTiles =
      key === "tiles" ||
      (txt.includes(" tiles") && !txt.includes("ridge") && !txt.includes("verge") && !txt.includes("barge"));

    if (isMainTiles) {
      if (txt.includes("liteslate")) {
        // Try a few likely keys. If your Materials uses a different key, add it here.
        return n(
          m?.tile_liteslate_weight_kg ??
          m?.liteslate_tile_weight_kg ??
          m?.tile_liteslate_kg_each ??
          0
        );
      }
      // Default = Britmet
      return n(
        m?.tile_britmet_weight_kg ??
        m?.britmet_tile_weight_kg ??
        m?.tile_britmet_kg_each ??
        0
      );
    }

    // Ridge tiles
    if (txt.includes("ridge")) {
      if (txt.includes("liteslate")) {
        return n(
          m?.liteslate_ridge_tile_weight_kg ??
          m?.tile_liteslate_ridge_weight_kg ??
          m?.ridge_tile_liteslate_weight_kg ??
          0
        );
      }
      return n(
        m?.britmet_ridge_tile_weight_kg ??
        m?.ridge_tile_britmet_weight_kg ??
        m?.tile_britmet_ridge_weight_kg ??
        0
      );
    }

    // Verge / barge / dry verge
    // Britmet: "2-Part Barge"
    // LiteSlate: "Dry Verge"
    if (txt.includes("barge") || txt.includes("verge")) {
      if (txt.includes("dry") || txt.includes("liteslate")) {
        return n(
          m?.dry_verge_weight_kg ??
          m?.liteslate_dry_verge_weight_kg ??
          m?.verge_liteslate_weight_kg ??
          0
        );
      }
      return n(
        m?.barge_2part_weight_kg ??
        m?.verge_trim_weight_kg ?? // your current weights.js used this
        m?.verge_trim_2part_weight_kg ??
        0
      );
    }

    // Adaptors / caps (hip end caps, gable end cap, ridge adaptors, etc.)
    // If you have distinct weights per adaptor/cap, add them here.
    if (txt.includes("adaptor") || txt.includes("adapter")) {
      if (txt.includes("liteslate")) {
        return n(
          m?.liteslate_adaptor_weight_kg ??
          m?.ridge_hip_adaptor_liteslate_weight_kg ??
          0
        );
      }
      return n(
        m?.britmet_adaptor_weight_kg ??
        m?.y_adaptor_weight_kg ??
        m?.five_way_adaptor_weight_kg ??
        m?.universal_ridge_adaptor_weight_kg ??
        0
      );
    }

    if (txt.includes("end cap") || txt.includes("hip end cap") || txt.includes("gable end cap")) {
      if (txt.includes("liteslate")) {
        return n(
          m?.liteslate_end_cap_weight_kg ??
          m?.hip_end_cap_liteslate_weight_kg ??
          m?.gable_end_cap_liteslate_weight_kg ??
          0
        );
      }
      return n(
        m?.britmet_end_cap_weight_kg ??
        m?.hip_end_cap_britmet_weight_kg ??
        m?.gable_end_cap_britmet_weight_kg ??
        0
      );
    }

    // Vent strip (tile accessories)
    if (txt.includes("vent strip")) {
      return n(
        m?.vent_strip_weight_kg ??
        m?.tile_vent_strip_weight_kg ??
        0
      );
    }

    // Touch-up kit (Britmet only in your earlier logic)
    if (txt.includes("touch")) {
      if (txt.includes("liteslate")) {
        return n(
          m?.touchup_kit_liteslate_weight_kg ??
          m?.touchup_kit_weight_kg ??
          0
        );
      }
      return n(
        m?.touchup_kit_britmet_weight_kg ??
        m?.touchup_kit_weight_kg ??
        0
      );
    }

    // ---- Other known items (from your current file) ----
    if (key === "eaves_guard" || txt.includes("eaves guard")) {
      return n(m?.eaves_guard_weight_kg);
    }
if (key === "tile_starter" || txt.includes("tile starter")) {
  return n(m?.tile_starter_weight_kg_each ?? 0);
}
    if (key === "watercourse" || txt.includes("watercourse")) {
      return n(m?.watercourse_weight_kg);
    }

    // Chamfer lath is per metre (only relevant if this line represents metres of chamfer)
    if (key === "chamfer_lath" || txt.includes("chamfer")) {
      return n(m?.chamfer_lath_weight_kg_per_m);
    }

    // Fixings packs (misc)
    if (key === "fixings_pack_britmet" || txt.includes("fixings pack")) {
      return n(
        m?.fixings_pack_britmet_weight_kg ??
        m?.fixings_pack_weight_kg_each ??
        0
      );
    }

    if (key === "breather_membrane" || txt.includes("breather")) {
      return n(m?.breather_roll_weight_kg);
    }

    if (key === "slab100" || txt.includes("slab100") || txt.includes("100 mm slab")) {
      return n(m?.slab100_pack_weight_kg);
    }

    if (key === "slab50" || txt.includes("slab50") || txt.includes("50 mm slab")) {
  return n(m?.slab50_pack_weight_kg);
}
    if (key === "superquilt" || txt.includes("superquilt")) {
      return n(m?.superquilt_roll_weight_kg);
    }
// ---- Misc site consumables (no UI weight boxes, but should still weigh) ----
if (key === "expanding_foam" || txt.includes("expanding foam")) {
  return n(
    m?.expandingFoam?.weight_kg_each ??
      m?.expanding_foam_can_weight_kg_each ??
      0
  );
}

if (key === "polytop_pins" || txt.includes("polytop")) {
  return n(
    m?.polytopPins?.weight_kg_each ??
      m?.polytop_pins_weight_kg_each ??
      0
  );
}

if (key === "alu_roll_tape" || txt.includes("roll tape") || txt.includes("aluminium roll")) {
  return n(
    m?.aluRollTape?.weight_kg_each ??
      m?.alu_roll_tape_weight_kg_each ??
      0
  );
}

// ---- Screw packs (misc) ----
if (key === "screws_rafter_eaves" || txt.includes("rafter/eaves")) {
  return n(m?.screws_rafter_eaves_weight_kg_each ?? 0);
}

if (key === "screws_lath_fixings" || txt.includes("lath fixings")) {
  return n(m?.screws_lath_fixings_weight_kg_each ?? 0);
}

if (key === "screws_tile_fixings" || txt.includes("tile fixings")) {
  return n(m?.screws_tile_fixings_weight_kg_each ?? 0);
}
    return 0;
  };

  return (bomItems || []).reduce((sum, it) => {
    const qty = n(
  it?.order_qty ??
  it?.orderQty ??
  it?.qty ??
  it?.quantity ??
  it?.qtyDisplay ??
  0
);
    return sum + qty * weightByItem(it);
  }, 0);
}
