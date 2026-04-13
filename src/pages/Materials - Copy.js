// NOTE:
// This file defines material PRICES, WEIGHTS and STOCK SIZES only.
// All geometry, quantities and coverage calculations live in src/lib/Calculations/*
// src/pages/Materials.js
import React, { useState, useEffect, useMemo } from "react";
import NavTabs from "../components/NavTabs";
import { defaultMaterials, getMaterials, saveMaterials } from "../lib/materials";

// Simple card wrapper to keep layout neat & consistent
const Section = ({ title, children }) => (
  <div
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 14,
      marginTop: 16,
    }}
  >
    <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 600 }}>{title}</h2>
    {children}
  </div>
);

export default function Materials() {
  // materials data
  const [m, setM] = useState(getMaterials());

useEffect(() => {
  setM(getMaterials()); // load once on mount
}, []);
  // local UI state bag (currently used only for Pricing box)
  const [state, setState] = useState({
    filter: "",
    filter2: "",
    filter3: "",
    editKey: null,
    editValue: "",
    editUnit: "",
    expandGroup: null,
    sortBy: "name",
  });

  // helpers
  // helpers (FIXED + autosave)
const setField = (key, val) =>
  setM((prev) => {
    // keep what the user is typing in React state (string is fine)
    const next = { ...prev, [key]: val };

    // ONLY persist when it's a real number
    const n = Number(val);
    if (val !== "" && Number.isFinite(n)) {
      saveMaterials({ ...next, [key]: n });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("materials_updated"));
      }
    }

    return next;
  });

const updateState = (patch) =>
  setState((prev) => ({ ...prev, ...patch }));

  // update nested objects like "fascia_price_per_length_white_mm.225"
  const setNested = (path, val) => {
  setM((prev) => {
    const next = { ...prev };
    const parts = path.split(".");
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      cur[p] = { ...(cur[p] || {}) };
      cur = cur[p];
    }
    cur[parts[parts.length - 1]] = val;
saveMaterials(next);
if (typeof window !== "undefined") window.dispatchEvent(new Event("materials_updated"));
return next;
  });
};

  // allow normal typing in controlled inputs (don’t force 0 while user is mid-edit)
const num = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

  // Areas
  const area9 = useMemo(() => {
    const g = m.ply9mm || {};
    return (g.sheet_width_m || 0) * (g.sheet_len_m || 0);
  }, [m]);

  const area18 = useMemo(() => {
    const g = m.ply18mm || {};
    return (g.sheet_width_m || 0) * (g.sheet_len_m || 0);
  }, [m]);

  const area50 = useMemo(
    () => (m.pir50?.sheet_w_m || 0) * (m.pir50?.sheet_h_m || 0),
    [m]
  );
  const area100 = useMemo(
    () => (m.pir100?.sheet_w_m || 0) * (m.pir100?.sheet_h_m || 0),
    [m]
  );
  // Lath helper prices
  const lath25_per_m = m.lath25x50?.price_per_m ?? 2.98 / 4.8;   // £2.98 / 4.8m
  const lath25_bar_price = lath25_per_m * 4.8;

  const lath19_per_m = m.lath19x38_price_per_m ?? 1.68 / 4.8;   // £1.68 / 4.8m
  const lath19_bar_price = lath19_per_m * 4.8;

  // Nested group setter: "group.key"
  const toNumOrKeep = (v) => {
  if (v === "" || v === null || v === undefined) return "";

  if (
    typeof v === "string" &&
    /^[0-9]*\.?[0-9]*$/.test(v) &&
    v.endsWith(".")
  ) {
    return v;
  }

  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};
const set = (path, value) => {

  // ✅ Flat key: no dot
  if (!String(path).includes(".")) {
  setM((prev) => {
    const next = { ...prev, [path]: toNumOrKeep(value) };
    saveMaterials(next);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("materials_updated"));
    return next;
  });
  return;
}

  // ✅ Nested key: has dot
  setM((prev) => {
    const next = JSON.parse(JSON.stringify(prev));
    const [grp, key] = path.split(".");

    next[grp] = next[grp] || {};
    next[grp][key] = toNumOrKeep(value);


    // Keep derived fields in sync
    if (grp === "steico") {
  const stock = Number(next.steico.stock_len_m) || 0;

  // If £/m or stock length changes, update £/bar
  if (key === "price_per_m" || key === "stock_len_m") {
    if (next.steico.price_per_m && next.steico.stock_len_m) {
      next.steico.price_per_bar = +(
        next.steico.price_per_m * next.steico.stock_len_m
      ).toFixed(2);
    } else {
      next.steico.price_per_bar = 0;
    }
  }

  // If £/bar changes, back-calculate £/m
  if (key === "price_per_bar" && stock > 0) {
    next.steico.price_per_m = +(
      next.steico.price_per_bar / stock
    ).toFixed(4);
  }
}
    if (grp === "ringBeam") {
      const len = next.ringBeam.stock_len_m || 0;

      // If user edits £/m, update £/bar
      if (key === "timber_price_per_m" && len) {
        next.ringBeam.price_per_bar = +(
          next.ringBeam.timber_price_per_m * len
        ).toFixed(2);
      }

      // If user edits £/bar, update £/m
      if (key === "price_per_bar" && len) {
        next.ringBeam.timber_price_per_m = +(
          next.ringBeam.price_per_bar / len
        ).toFixed(4);
      }

      // If user changes stock length, recompute £/m from £/bar (keep bar cost as the "truth")
      if (key === "stock_len_m" && next.ringBeam.price_per_bar && next.ringBeam.stock_len_m) {
        next.ringBeam.timber_price_per_m = +(
          next.ringBeam.price_per_bar / next.ringBeam.stock_len_m
        ).toFixed(4);
      }
    }


      if (grp === "ply9mm") {
        const A =
          (next.ply9mm.sheet_width_m * next.ply9mm.sheet_len_m) || 1;

        if (key === "price_per_sheet") {
          next.ply9mm.price_per_m2 = +(
            next.ply9mm.price_per_sheet / A
          ).toFixed(4);
        }

        if (key === "price_per_m2") {
          next.ply9mm.price_per_sheet = +(
            next.ply9mm.price_per_m2 * A
          ).toFixed(2);
        }

        if (key === "sheet_width_m" || key === "sheet_len_m") {
          const area =
            (next.ply9mm.sheet_width_m * next.ply9mm.sheet_len_m) || 1;
          next.ply9mm.price_per_m2 = +(
            next.ply9mm.price_per_sheet / area
          ).toFixed(4);
        }
      }

      if (grp === "ply18mm") {
        const A =
          (next.ply18mm.sheet_width_m * next.ply18mm.sheet_len_m) || 1;

        if (key === "price_per_sheet") {
          next.ply18mm.price_per_m2 = +(
            next.ply18mm.price_per_sheet / A
          ).toFixed(4);
        }

        if (key === "price_per_m2") {
          next.ply18mm.price_per_sheet = +(
            next.ply18mm.price_per_m2 * A
          ).toFixed(2);
        }

        if (key === "sheet_width_m" || key === "sheet_len_m") {
          const area =
            (next.ply18mm.sheet_width_m * next.ply18mm.sheet_len_m) || 1;
          next.ply18mm.price_per_m2 = +(
            next.ply18mm.price_per_sheet / area
          ).toFixed(4);
        }
      }

      if (grp === "pir50") {
        const A =
          (next.pir50.sheet_w_m * next.pir50.sheet_h_m) || 1;
        if (key === "price_per_sheet")
          next.pir50.price_per_m2 = +(
            next.pir50.price_per_sheet / A
          ).toFixed(4);
        if (key === "price_per_m2")
          next.pir50.price_per_sheet = +(
            next.pir50.price_per_m2 * A
          ).toFixed(2);
        if (key === "sheet_w_m" || key === "sheet_h_m") {
          const area =
            (next.pir50.sheet_w_m * next.pir50.sheet_h_m) || 1;
          next.pir50.price_per_m2 = +(
            next.pir50.price_per_sheet / area
          ).toFixed(4);
        }
      }

      if (grp === "pir100") {
        const A =
          (next.pir100.sheet_w_m * next.pir100.sheet_h_m) || 1;
        if (key === "price_per_sheet")
          next.pir100.price_per_m2 = +(
            next.pir100.price_per_sheet / A
          ).toFixed(4);
        if (key === "price_per_m2")
          next.pir100.price_per_sheet = +(
            next.pir100.price_per_m2 * A
          ).toFixed(2);
        if (key === "sheet_w_m" || key === "sheet_h_m") {
          const area =
            (next.pir100.sheet_w_m * next.pir100.sheet_h_m) || 1;
          next.pir100.price_per_m2 = +(
            next.pir100.price_per_sheet / area
          ).toFixed(4);
        }
      }
// 🔒 Persist full materials object immediately
saveMaterials(next);
if (typeof window !== "undefined") window.dispatchEvent(new Event("materials_updated"));
      return next;
    });
  };

  // Top-level setter for flat keys (vat_pct, step_round_m, tiles/accessories, etc.)
  const setTop = (key, val) =>
  setM((prev) => {
    const next = { ...prev, [key]: val };

    const n = Number(val);
    if (val !== "" && Number.isFinite(n)) {
      saveMaterials({ ...next, [key]: n });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("materials_updated"));
      }
    }

    return next;
  });
const exportMaterialsBackup = () => {
  try {
    const raw = localStorage.getItem("materials_v1");
    if (!raw) {
      alert("No materials backup found in localStorage.");
      return;
    }

    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `materials-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Export failed.");
  }
};

const importMaterialsBackup = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const parsed = JSON.parse(text);

      localStorage.setItem("materials_v1", JSON.stringify(parsed));
      setM(JSON.parse(localStorage.getItem("materials_v1") || "{}"));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("materials_updated"));
      }

      alert("Materials backup imported.");
    } catch (err) {
      console.error(err);
      alert("Import failed. File is not valid JSON.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
};
  const save = () => {
  const next = {
    ...m,
    delivery_flat: Number(m.delivery_flat ?? 0),
    profit_pct: Number(m.profit_pct ?? 0),
    vat_rate: Number(m.vat_rate ?? 0.2),
  };

  setM(next);
  saveMaterials(next);

  alert("Materials saved.");
};

  const reset = () =>
    setM({ ...defaultMaterials, vat_pct: 20, step_round_m: 0.1 });

  const money = (v) => `£${Number(v).toFixed(2)}`;

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* App-wide nav tabs */}
      <NavTabs active="materials" />

      <h1
  style={{
    marginTop: 8,
    marginBottom: 2,
    fontSize: 20,
    fontWeight: 600,
  }}
>
  Materials & Prices
</h1>
<p
  style={{
    marginTop: 0,
    fontSize: 11,
    color: "#4b5563",
  }}
>
  Update and Save when supplier price changes.
</p>


      {/* 1️⃣ TIMBER & SHEET MATERIALS */}
      <Section title="Timber & Sheet Materials">
                {/* Steico */}
        {/* Steico */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    {/* Label on the left */}
    <div style={{ fontSize: 15, fontWeight: 600 }}>Steico I-joist (220)</div>

    {/* Spacer to push controls to the right */}
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m)</span>
      <input
        type="number"
        step="0.1"
        value={m.steico.stock_len_m}
        onChange={(e) => set("steico.stock_len_m", e.target.value)}
        style={{ marginLeft: 6, width: 70 }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m</span>
      <input
        type="number"
        step="0.01"
        value={m.steico.price_per_m}
        onChange={(e) => set("steico.price_per_m", e.target.value)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / bar</span>
      <input
        type="number"
        step="0.01"
        value={m.steico.price_per_bar}
        onChange={(e) => set("steico.price_per_bar", e.target.value)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>
</div>




        {/* Ring-beam (front) – 30×90 PSE */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 600 }}>30×90 PSE</div>

    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m)</span>
      <input
        type="number"
        step="0.1"
        value={m.ringBeam.stock_len_m ?? 4.8}
        onChange={(e) => set("ringBeam.stock_len_m", e.target.value)}
        style={{ marginLeft: 6, width: 70 }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m</span>
      <input
        type="number"
        step="0.01"
        value={m.ringBeam.timber_price_per_m ?? 0}
        onChange={(e) => set("ringBeam.timber_price_per_m", e.target.value)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / bar</span>
      <input
        type="number"
        step="0.01"
        value={m.ringBeam.price_per_bar ?? 0}
        onChange={(e) => set("ringBeam.price_per_bar", e.target.value)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>

  {/* Optional routing row, kept as a separate processing cost */}
  <div
    style={{
      marginTop: 8,
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "#555",
    }}
  >
    <span>Routing (groove) — £ / m</span>
    <input
      type="number"
      step="0.01"
      value={m.ringBeam.routing_price_per_m ?? 0}
      onChange={(e) => set("ringBeam.routing_price_per_m", e.target.value)}
      style={{ width: 90 }}
    />
  </div>
</div>

              {/* Laths START */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  {/* 25×50 Laths (Treated) */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 600 }}>
      25×50 Laths (Treated)
    </div>

    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m)</span>
      <input
        type="number"
        step="0.1"
        value={4.8}
        readOnly
        style={{
  marginLeft: 6,
  width: 70,
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  fontWeight: 400,
  boxShadow: "none",
  appearance: "textfield",
}}

      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m</span>
      <input
        type="number"
        value={(
          (
            (m.lath25x50_bar_price ??
              ((m.lath25x50?.price_per_m ?? 0) * 4.8)
            ) / 4.8
          ) || 0
        ).toFixed(2)}
        readOnly
        style={{
  marginLeft: 6,
  width: 90,
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  fontWeight: 400,
  boxShadow: "none",
  appearance: "textfield",
}}

      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / bar</span>
      <input
        type="number"
        step="0.01"
        value={
          m.lath25x50_bar_price ??
          ((m.lath25x50?.price_per_m ?? 0) * 4.8)
        }
        onChange={(e) => {
          const bar = Number(e.target.value) || 0;
          setM((prev) => ({
            ...prev,
            lath25x50_bar_price: bar,
            lath25x50: {
              ...(prev.lath25x50 || {}),
              price_per_m: bar / 4.8,
            },
          }));
        }}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>

  {/* small gap between rows */}
  <div style={{ height: 8 }} />

  {/* 19×38 Laths (Untreated, binding) */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 600 }}>
      19×38 Laths (Untreated, binding)
    </div>

    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m)</span>
      <input
        type="number"
        step="0.1"
        value={4.8}
        readOnly
        style={{
  marginLeft: 6,
  width: 70,
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  fontWeight: 400,
  boxShadow: "none",
  appearance: "textfield",
}}

      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m</span>
      <input
        type="number"
        value={(
          (
            (m.lath19x38_bar_price ??
              ((m.lath19x38_price_per_m ?? 0) * 4.8)
            ) / 4.8
          ) || 0
        ).toFixed(2)}
        readOnly
        style={{
  marginLeft: 6,
  width: 90,
  backgroundColor: "#fff",
  border: "1px solid #ccc",
  fontWeight: 400,
  boxShadow: "none",
  appearance: "textfield",
}}

      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / bar</span>
      <input
        type="number"
        step="0.01"
        value={
          m.lath19x38_bar_price ??
          ((m.lath19x38_price_per_m ?? 0) * 4.8)
        }
        onChange={(e) => {
          const bar = Number(e.target.value) || 0;
          setM((prev) => ({
            ...prev,
            lath19x38_bar_price: bar,
            lath19x38_price_per_m: bar / 4.8,
          }));
        }}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>
</div>
{/* Laths END */}

        {/* Ply & OSB START */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  {/* 9 mm Ply */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 600 }}>9 mm Ply</div>
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m²)</span>
      <input
        type="number"
        value={2.88}
        readOnly
        style={{
          marginLeft: 6,
          width: 70,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m²</span>
      <input
        type="number"
        value={((m.ply9_sheet_price ?? 0) / 2.88).toFixed(2)}
        readOnly
        style={{
          marginLeft: 6,
          width: 90,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / sheet</span>
      <input
        type="number"
        step="0.01"
        value={m.ply9_sheet_price ?? ""}
        onChange={(e) => setTop("ply9_sheet_price", Number(e.target.value) || 0)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>

  <div style={{ height: 8 }} />

  {/* 18 mm Ply */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 600 }}>18 mm Ply</div>
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m²)</span>
      <input
        type="number"
        value={2.88}
        readOnly
        style={{
          marginLeft: 6,
          width: 70,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m²</span>
      <input
        type="number"
        value={((m.ply18_sheet_price ?? 0) / 2.88).toFixed(2)}
        readOnly
        style={{
          marginLeft: 6,
          width: 90,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / sheet</span>
      <input
        type="number"
        step="0.01"
        value={m.ply18_sheet_price ?? ""}
        onChange={(e) => setTop("ply18_sheet_price", Number(e.target.value) || 0)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>

  <div style={{ height: 8 }} />

  {/* 18 mm OSB */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 600 }}>18 mm OSB</div>
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m²)</span>
      <input
        type="number"
        value={2.88}
        readOnly
        style={{
          marginLeft: 6,
          width: 70,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m²</span>
      <input
        type="number"
        value={((m.osb18_sheet_price ?? 0) / 2.88).toFixed(2)}
        readOnly
        style={{
          marginLeft: 6,
          width: 90,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / sheet</span>
      <input
        type="number"
        step="0.01"
        value={m.osb18_sheet_price ?? ""}
        onChange={(e) => setTop("osb18_sheet_price", Number(e.target.value) || 0)}
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>
</div>
{/* Ply & OSB END */}


        {/* PIR START */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  {/* PIR 50 mm */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 600 }}>PIR 50 mm</div>
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m²)</span>
      <input
        type="number"
        readOnly
        value={area50.toFixed(2)}
        style={{
          marginLeft: 6,
          width: 70,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m²</span>
      <input
        type="number"
        readOnly
        value={(
          (m.pir50.price_per_sheet ?? 0) /
          (area50 || 1)
        ).toFixed(2)}
        style={{
          marginLeft: 6,
          width: 90,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / sheet</span>
      <input
        type="number"
        step="0.01"
        value={m.pir50.price_per_sheet ?? ""}
        onChange={(e) =>
          set("pir50.price_per_sheet", Number(e.target.value) || 0)
        }
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>

  <div style={{ height: 8 }} />

  {/* PIR 100 mm */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ fontSize: 15, fontWeight: 600 }}>PIR 100 mm</div>
    <div style={{ flex: 1 }} />

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 70 }}>Stock (m²)</span>
      <input
        type="number"
        readOnly
        value={area100.toFixed(2)}
        style={{
          marginLeft: 6,
          width: 70,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 50 }}>£ / m²</span>
      <input
        type="number"
        readOnly
        value={(
          (m.pir100.price_per_sheet ?? 0) /
          (area100 || 1)
        ).toFixed(2)}
        style={{
          marginLeft: 6,
          width: 90,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          appearance: "textfield",
        }}
      />
    </label>

    <span>|</span>

    <label style={{ display: "flex", alignItems: "center" }}>
      <span style={{ minWidth: 60 }}>£ / sheet</span>
      <input
        type="number"
        step="0.01"
        value={m.pir100.price_per_sheet ?? ""}
        onChange={(e) =>
          set("pir100.price_per_sheet", Number(e.target.value) || 0)
        }
        style={{ marginLeft: 6, width: 90 }}
      />
    </label>
  </div>
</div>
{/* PIR END */}
{/* Tiles & Accessories START */}
<div
  style={{
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 24,
    }}
  >
    {/* ===================== */}
    {/* Britmet */}
    {/* ===================== */}
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        Britmet
      </div>

      {[
        ["Tile", "tile_britmet_price_each"],
        ["Ridge Tile", "britmet_ridge_tile_price_each"],
        ["Y Adaptor", "britmet_y_adaptor_price_each"],
        ["5 Way Adaptor", "britmet_5way_adaptor_price_each"],
        ["Universal Ridge Adaptor", "britmet_universal_ridge_adaptor_price_each"],
        ["90° Hip End Cap", "britmet_hip_end_cap_90_price_each"],
        ["135° Hip End Cap", "britmet_hip_end_cap_135_price_each"],
        ["Gable End Cap", "britmet_gable_end_cap_price_each"],
        ["2-Part Barge", "verge_trim_price_each"],
        ["Vent Strip", "britmet_vent_strip_price_each"],
        ["Touch-Up Kit", "touchup_kit_britmet_price_each"],
      ].map(([label, key]) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", marginBottom: 6 }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center" }}>
            <span style={{ minWidth: 70 }}>£ / each</span>
            <input
              type="number"
              step="0.01"
              value={m[key] ?? ""}
              onChange={(e) => set(key, Number(e.target.value) || 0)}
              style={{ marginLeft: 6, width: 90 }}
            />
          </label>
        </div>
      ))}
    </div>

    {/* ===================== */}
    {/* LiteSlate */}
    {/* ===================== */}
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        LiteSlate
      </div>

      {[
        ["Tile", "liteslate_tile_price_each"],
        ["Ridge Tile", "liteslate_ridge_tile_price_each"],
        ["Ridge / Hip Adaptor", "liteslate_ridge_hip_adaptor_price_each"],
        ["90° Hip End Cap", "liteslate_hip_end_cap_90_price_each"],
        ["Dry Verge", "liteslate_dry_verge_price_each"],
      ].map(([label, key]) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", marginBottom: 6 }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center" }}>
            <span style={{ minWidth: 70 }}>£ / each</span>
            <input
              type="number"
              step="0.01"
              value={m[key] ?? ""}
              onChange={(e) => set(key, Number(e.target.value) || 0)}
              style={{ marginLeft: 6, width: 90 }}
            />
          </label>
        </div>
      ))}
    </div>
  </div>
</div>
{/* Tiles & Accessories END */}



      </Section>

      

            {/* 4️⃣ PLASTICS — FASCIA & SOFFIT */}
<Section title="Plastics — Fascia, Soffit & Ventilation">
  <div style={{ marginTop: 4 }}>
    {/* Compact fascia/soffit geometry + vent settings on one row */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
        marginTop: 4,
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Fascia stock length (m)</span>
        <input
          type="number"
          step="0.1"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 90 }}
          value={m.fascia_stock_length_m ?? 5}
          onChange={(e) =>
            setField("fascia_stock_length_m", num(e.target.value))
          }
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Soffit stock length (m)</span>
        <input
          type="number"
          step="0.1"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 90 }}
          value={m.soffit_stock_length_m ?? 5}
          onChange={(e) =>
            setField("soffit_stock_length_m", num(e.target.value))
          }
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Fascia K constant (mm)</span>
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 90 }}
          value={m.fascia_k_constant_mm ?? 155.05}
          onChange={(e) =>
            setField("fascia_k_constant_mm", num(e.target.value))
          }
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Vented fascia price (£/m)</span>
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 90 }}
          value={m.fascia_vent_price_per_m ?? 0.5}
          onChange={(e) =>
            setField("fascia_vent_price_per_m", num(e.target.value))
          }
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Vent disc price (£ each)</span>
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 90 }}
          value={m.vent_disc_price_each ?? 0.5}
          onChange={(e) =>
            setField("vent_disc_price_each", num(e.target.value))
          }
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
        <span>Vent discs per metre</span>
        <input
          type="number"
          step="1"
          className="border rounded px-2 py-1"
          style={{ marginTop: 4, width: 80 }}
          value={m.vent_discs_per_m ?? 1}
          onChange={(e) =>
            setField(
              "vent_discs_per_m",
              Math.max(0, parseInt(e.target.value || 0, 10))
            )
          }
        />
      </label>
    </div>

    {/* Fascia + Soffit price tables side by side */}
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        gap: 16,
      }}
    >
      {/* Fascia price table (per 5.0 m length) */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Fascia price per 5.0 m length
        </div>
        <table
          className="w-full"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "left",
                }}
              >
                Height (mm)
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                White £
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                Foiled £
              </th>
            </tr>
          </thead>
          <tbody>
            {[200, 225, 250, 300, 400].map((h) => (
              <tr key={h}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                  }}
                >
                  {h}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    textAlign: "right",
                  }}
                >
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full"
                    value={m.fascia_price_per_length_white_mm?.[h] ?? 0}
                    onChange={(e) =>
                      setNested(
                        `fascia_price_per_length_white_mm.${h}`,
                        num(e.target.value)
                      )
                    }
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    textAlign: "right",
                  }}
                >
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full"
                    value={m.fascia_price_per_length_foiled_mm?.[h] ?? 0}
                    onChange={(e) =>
                      setNested(
                        `fascia_price_per_length_foiled_mm.${h}`,
                        num(e.target.value)
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Soffit price table (per 5.0 m length) */}
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Soffit price per 5.0 m length
        </div>
        <table
          className="w-full"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "left",
                }}
              >
                Width (mm)
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                White £
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                Foiled £
              </th>
            </tr>
          </thead>
          <tbody>
            {(m.soffit_board_widths_mm ?? [100, 150, 175, 200]).map((w) => (
              <tr key={w}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                  }}
                >
                  {w}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    textAlign: "right",
                  }}
                >
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full"
                    value={m.soffit_price_per_length_white_mm?.[w] ?? 0}
                    onChange={(e) =>
                      setNested(
                        `soffit_price_per_length_white_mm.${w}`,
                        num(e.target.value)
                      )
                    }
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: 6,
                    textAlign: "right",
                  }}
                >
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full"
                    value={m.soffit_price_per_length_foiled_mm?.[w] ?? 0}
                    onChange={(e) =>
                      setNested(
                        `soffit_price_per_length_foiled_mm.${w}`,
                        num(e.target.value)
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Fascia & soffit accessories (white / foiled) */}
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Fascia & soffit accessories (per item)
      </div>
      <table
        className="w-full"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                textAlign: "left",
              }}
            >
              Item
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                textAlign: "right",
              }}
            >
              White £
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                textAlign: "right",
              }}
            >
              Foiled £
            </th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              label: "J-Section",
              whiteKey: "fascia_j_section_white_price",
              foiledKey: "fascia_j_section_foiled_price",
            },
            {
              label: "H-Section",
              whiteKey: "fascia_h_section_white_price",
              foiledKey: "fascia_h_section_foiled_price",
            },
            {
              label: "90° Fascia Corner Ext (300mm)",
              whiteKey: "fascia_corner_90_ext_300_white_price",
              foiledKey: "fascia_corner_90_ext_300_foiled_price",
            },
            {
              label: "90° Double Fascia Corner Ext (500mm)",
              whiteKey: "fascia_corner_90_double_ext_500_white_price",
              foiledKey: "fascia_corner_90_double_ext_500_foiled_price",
            },
            {
              label: "Fascia Corner Int (500mm)",
              whiteKey: "fascia_corner_int_500_white_price",
              foiledKey: "fascia_corner_int_500_foiled_price",
            },
            {
              label: "Fascia Joint (300mm)",
              whiteKey: "fascia_joint_300_white_price",
              foiledKey: "fascia_joint_300_foiled_price",
            },
            {
              label: "Fascia Joint (500mm)",
              whiteKey: "fascia_joint_500_white_price",
              foiledKey: "fascia_joint_500_foiled_price",
            },
            {
              label: "135° Fascia Corner (300mm)",
              whiteKey: "fascia_corner_135_300_white_price",
              foiledKey: "fascia_corner_135_300_foiled_price",
            },
            {
              label: "Vent Disc",
              whiteKey: "fascia_vent_disc_white_price",
              foiledKey: "fascia_vent_disc_foiled_price",
            },
            {
              label: "Plaster Bead",
              whiteKey: "plaster_bead_white_price",
              foiledKey: "plaster_bead_foiled_price",
            },
          ].map((item) => (
            <tr key={item.label}>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                }}
              >
                {item.label}
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-2 py-1 w-full"
                  value={m[item.whiteKey] ?? 0}
                  onChange={(e) =>
                    setField(item.whiteKey, num(e.target.value))
                  }
                />
              </td>
              <td
                style={{
                  border: "1px solid #ddd",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-2 py-1 w-full"
                  value={m[item.foiledKey] ?? 0}
                  onChange={(e) =>
                    setField(item.foiledKey, num(e.target.value))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</Section>



      {/* 5️⃣ GUTTERS & DOWNPIPES */}
<Section title="Gutters & Downpipes">

    {/* === GLOBAL GUTTER CONSTANTS === */}
  

  {/* === GUTTER PROFILES === */}
  {[
  { key: "square", label: "Square" },
  { key: "round", label: "Round" },
  { key: "ogee", label: "Ogee" },
]
.map(({ key, label }) => (
    <div
      key={key}
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
        }}
      >
        <label>
          4.0 m gutter (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_length_4m_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_length_4m_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          Union (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_union_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_union_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          Running outlet (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_running_outlet_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_running_outlet_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          Stop end outlet (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_stop_end_outlet_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_stop_end_outlet_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          Stop end (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_stop_end_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_stop_end_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          90° external corner (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_corner_90_ext_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_corner_90_ext_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          90° internal corner (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_corner_90_int_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_corner_90_int_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          135° external corner (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_corner_135_ext_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_corner_135_ext_price`,
                num(e.target.value)
              )
            }
          />
        </label>

        <label>
          Bracket (£)
          <input
            type="number"
            step="0.01"
            className="border rounded px-2 py-1 w-full"
            value={m[`gutter_${key}_bracket_price`] ?? 0}
            onChange={(e) =>
              setField(
                `gutter_${key}_bracket_price`,
                num(e.target.value)
              )
            }
          />
        </label>
      </div>
    </div>
  ))}

  {/* === DOWNPIPES === */}
  <div
    style={{
      border: "1px solid #ddd",
      padding: 12,
      borderRadius: 6,
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 8 }}>
      Downpipes
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 12,
      }}
    >
      <label>
        Downpipe 2.5 m (£)
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.dp_length_2_5m_price ?? 0}
          onChange={(e) =>
            setField("dp_length_2_5m_price", num(e.target.value))
          }
        />
      </label>

      <label>
        Sq/Rnd adaptor (£)
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.dp_adaptor_price ?? 0}
          onChange={(e) =>
            setField("dp_adaptor_price", num(e.target.value))
          }
        />
      </label>

      <label>
        Offset bend (£)
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.dp_bend_price ?? 0}
          onChange={(e) =>
            setField("dp_bend_price", num(e.target.value))
          }
        />
      </label>

      <label>
        Clip (£)
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.dp_clip_price ?? 0}
          onChange={(e) =>
            setField("dp_clip_price", num(e.target.value))
          }
        />
      </label>

      <label>
        Shoe (£)
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.dp_shoe_price ?? 0}
          onChange={(e) =>
            setField("dp_shoe_price", num(e.target.value))
          }
        />
      </label>
    </div>
  </div>
</Section>

{/* 6️⃣ METAL ELEMENTS */}
<Section title="Metal Elements">
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 12,
      marginTop: 6,
    }}
  >
    {/* Tile Starter */}
    <fieldset style={{ border: "1px solid #ddd", padding: 10, borderRadius: 6 }}>
      <legend style={{ padding: "0 6px" }}>Tile Starter</legend>
      <label>
        £ each
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.tile_starter_price_each ?? 0}
          onChange={(e) =>
            setTop("tile_starter_price_each", num(e.target.value))
          }
        />
      </label>
      
    </fieldset>

    {/* Watercourse */}
    <fieldset style={{ border: "1px solid #ddd", padding: 10, borderRadius: 6 }}>
      <legend style={{ padding: "0 6px" }}>Watercourse</legend>
      <label>
        £ each
        <input
          type="number"
          step="0.01"
          className="border rounded px-2 py-1 w-full"
          value={m.watercourse_price_each ?? 0}
          onChange={(e) =>
            setTop("watercourse_price_each", num(e.target.value))
          }
        />
      </label>
     
    </fieldset>

    {[
  ["joist_hanger", "Joist Hanger"],
  ["joist_hanger_variable", "Variable Joist Hanger"],
  ["spar_hook", "Spar Hook"],
  ["jack_rafter_hook", "Jack Rafter Hook"],
  ["jack_rafter_bracket", "Jack Rafter Bracket"],
  ["corner_hanger", "Corner Hanger"],
  ["boss_rafter_terminal", "Boss"],
  ["reinforcement_plate", "Reinforcement Plate"],
  ["gable_strap", "Gable Strap"],
].map(([key, label]) => (
  <fieldset
    key={key}
    style={{
      border: "1px solid #ddd",
      padding: 10,
      borderRadius: 6,
    }}
  >
    <legend style={{ padding: "0 6px" }}>{label}</legend>

    <label>
      £ each
      <input
        type="number"
        step="0.01"
        className="border rounded px-2 py-1 w-full"
        value={m[`${key}_price_each`] ?? 0}
        onChange={(e) =>
          setTop(`${key}_price_each`, num(e.target.value))
        }
      />
    </label>
  </fieldset>
))}
  </div>
</Section>

      {/* 6️⃣ FIXINGS & MISCELLANEOUS */}
<Section title="Fixings & Miscellaneous">
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
      gap: 12,
      marginTop: 4,
    }}
  >
    {[
     
      // Superquilt
      {
        label: "Superquilt – 12 m",
        priceKey: "superquilt_12m_price_each",
        priceLabel: "£ / roll",
      },
      {
        label: "Superquilt – 15 m",
        priceKey: "superquilt_15m_price_each",
        priceLabel: "£ / roll",
      },
      // Membranes / tapes / foam
      {
        label: "Breather Membrane",
        priceKey: "breather_membrane_price_each",
        priceLabel: "£ / roll",
      },
      {
        label: "Expanding Foam (Can)",
        priceKey: "expanding_foam_can_price_each",
        priceLabel: "£ / can",
      },
      {
        label: "Expanding Foam (Roll)",
        priceKey: "expanding_foam_roll_price_each",
        priceLabel: "£ / roll",
      },
      {
        label: "Aluminium Tape (Roll)",
        priceKey: "aluminium_tape_roll_price_each",
        priceLabel: "£ / roll",
      },
      {
        label: "Duct Tape (Roll)",
        priceKey: "duct_tape_roll_price_each",
        priceLabel: "£ / roll",
      },
      // EPDM & adhesives
      {
        label: "EPDM Rubber",
        priceKey: "epdm_rubber_price_per_m2",
        priceLabel: "£ / m²",
      },
      {
        label: "Deck Adhesive (2.5 ltr)",
        priceKey: "deck_adhesive_2_5l_price_each",
        priceLabel: "£ / tub",
      },
      {
        label: "Bond Adhesive (2.5 ltr)",
        priceKey: "bond_adhesive_2_5l_price_each",
        priceLabel: "£ / tub",
      },
      {
        label: "Bond Adhesive (Can)",
        priceKey: "bond_adhesive_can_price_each",
        priceLabel: "£ / can",
      },
      // Pins & screws
      {
        label: "Polytop Pins",
        priceKey: "polytop_pins_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: '1" × 8 Screws',
        priceKey: "screws_1x8_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: '2" × 8 Screws',
        priceKey: "screws_2x8_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: '3" × 10 Screws',
        priceKey: "screws_3x10_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: "32mm Drywall Screws",
        priceKey: "drywall_screws_32mm_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: "50mm Drywall Screws",
        priceKey: "drywall_screws_50mm_price_per_box",
        priceLabel: "£ / box",
      },
      {
        label: "Concrete Screws",
        priceKey: "concrete_screws_price_per_box",
        priceLabel: "£ / box",
      },
    ].map((item) => (
      <div
        key={item.priceKey}
        style={{
          border: "1px solid #ddd",
          padding: 12,
          borderRadius: 6,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>
          {item.label}
        </h3>

        <label style={{ display: "block", marginBottom: 6 }}>
          {item.priceLabel}
          <input
            type="number"
            step="0.01"
            value={m[item.priceKey] ?? 0}
            onChange={(e) =>
              set(item.priceKey, num(e.target.value))
            }
            style={{ marginLeft: 8, width: 130 }}
          />
        </label>


        {item.weightKey && item.weightLabel && (
  <label style={{ display: "block" }}>
    {item.weightLabel}
    <input
      type="number"
      step="0.01"
      value={m[item.weightKey] ?? 0}
      onChange={(e) =>
        set(item.weightKey, num(e.target.value))
      }
      style={{ marginLeft: 8, width: 130 }}
    />
  </label>
)}
      </div>
    ))}
  </div>
</Section>


      {/* 7️⃣ PRICING / PROFIT / DELIVERY */}
      <Section title="Pricing / Delivery & Profit">
        <div className="card">
          <h3>Pricing</h3>

          <label style={{ display: "block", marginBottom: 8 }}>
            Delivery (flat £):
            <input
              type="number"
              step="0.01"
              value={m.delivery_flat ?? 0}
onChange={(e) => setTop("delivery_flat", e.target.value)}

              style={{ marginLeft: 8 }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            Profit (% of materials):
            <input
              type="number"
              step="0.1"
              value={m.profit_pct ?? 0}
onChange={(e) => setTop("profit_pct", e.target.value)}

              style={{ marginLeft: 8 }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 8 }}>
            VAT rate (e.g. 0.2 for 20%):
            <input
              type="number"
              step="0.01"
              value={m.vat_rate ?? 0.2}
onChange={(e) => setTop("vat_rate", e.target.value)}

              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
      </Section>

      {/* Save / Reset / Backup buttons */}
<div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
  <button
    onClick={save}
    style={{
      padding: "8px 12px",
      background: "#2e7d32",
      color: "#fff",
      border: 0,
      borderRadius: 4,
      cursor: "pointer",
    }}
  >
    Save
  </button>

  <button
    onClick={reset}
    type="button"
    style={{ padding: "8px 12px" }}
  >
    Reset to defaults
  </button>

  <button
    onClick={exportMaterialsBackup}
    type="button"
    style={{ padding: "8px 12px" }}
  >
    Export backup
  </button>

  <label
    style={{
      padding: "8px 12px",
      border: "1px solid #ccc",
      borderRadius: 4,
      cursor: "pointer",
      background: "#f7f7f7",
      display: "inline-flex",
      alignItems: "center",
    }}
  >
    Import backup
    <input
      type="file"
      accept=".json,application/json"
      onChange={importMaterialsBackup}
      style={{ display: "none" }}
    />
  </label>
</div>

      {/* Defaults summary */}
      <div
        style={{ marginTop: 10, fontSize: 12, color: "#555" }}
      >
        Defaults: Steico {m.steico.stock_len_m} m @{" "}
        {money(m.steico.price_per_bar)} per bar (
        {money(m.steico.price_per_m)}/m). 9 mm ply{" "}
        {money(m.ply9mm.price_per_sheet)} per {area9.toFixed(2)} m²
        sheet ({money(m.ply9mm.price_per_m2)}/m²). 18 mm ply{" "}
        {money(m.ply18mm.price_per_sheet)} per{" "}
        {area18.toFixed(2)} m² sheet (
        {money(m.ply18mm.price_per_m2)}/m²). PIR 50 mm{" "}
        {money(m.pir50.price_per_sheet)} per {area50.toFixed(2)} m²
        sheet ({money(m.pir50.price_per_m2)}/m²). PIR 100 mm{" "}
        {money(m.pir100.price_per_sheet)} per{" "}
        {area100.toFixed(2)} m² sheet (
        {money(m.pir100.price_per_m2)}/m²). Joist hanger{" "}
        {money(m.joist_hanger_price_each ?? 0)} each. Consumables {(m.consumables_pct ?? m.overheads?.consumables_pct ?? 0)}%.
      </div>
    </div>
  );
}
