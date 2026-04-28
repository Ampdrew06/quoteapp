// src/pages/lean-to/LeanToLanding.jsx
import React, { useMemo, useState, useEffect } from "react";
import { getMaterials } from "../../lib/materials";
import { computeTilesLathsBOM } from "../../lib/Calculations/tilesLathsCalc";
//import { computeFasciaSoffitLeanTo } from "../../lib/fasciaSoffitCalc";
//import { computeEdgeTrimsLeanTo } from "../../lib/edgeTrimsCalc";
//import { computeGuttersLeanTo } from "../../lib/guttersCalc";
import PlanDiagramLeanTo from "../../components/PlanDiagramLeanTo";
import { computeLiteSlateLeanTo as computeLiteSlate } from "../../lib/Calculations/liteslateCalc";
//import { computeMiscLeanTo } from "../../lib/miscCalc"; 
import { useLocation, useNavigate } from "react-router-dom";
import NavTabs from "../../components/NavTabs";
import { buildLeanToTotals, buildLeanToQuoteBase } from "../../lib/leanToTotals";
import { computePricing, computeLabourPricing, getLabourPricingConfig,} from "../../lib/pricing";
//import { computeLeanToManufactureGeometry } from "../../lib/leanToManufactureGeometry";

// adjust path if file structure differs

//const LEAN_TO_STORAGE_KEY = "leanToInputs";

/* ——— styles ——— */
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const h2 = { fontSize: 18, fontWeight: 600, margin: "0 0 8px" };
const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0ea5e9",
  background: "#0284c7",
  color: "#fff",
  fontWeight: 600,
};
/*
  const linkBtn = {
  color: "#fff",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
};
*/
// small helpers
const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);
const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};

  export default function LeanToLanding() {
 // console.log("LEAN_TO_LANDING: RENDERED");

  // Router hooks must be inside the component
  const location = useLocation();
  const navigate = useNavigate();

  // ——— Simple customer inputs ———
  const [widthMM, setWidth]   = useState("");   // internal width
  const [projMM, setProj]     = useState("");   // internal projection
  const [pitchDeg, setPitch]  = useState(15);   // default 15°
  const [inputsRestored, setInputsRestored] = useState(false);
  const [leftWall, setLeftWall] = useState(false);
  const [rightWall, setRightWall] = useState(false);

        // ---- react to Materials changes ----
/*const [materialsTick, setMaterialsTick] = useState(0);

useEffect(() => {
  const bump = () => setMaterialsTick((t) => t + 1);

  window.addEventListener("materials_updated", bump);
  window.addEventListener("storage", bump); // cross-tab safety

  return () => {
    window.removeEventListener("materials_updated", bump);
    window.removeEventListener("storage", bump);
  };
}, []);
*/
const m = getMaterials();


    // Restore saved Lean-To inputs (if any) when landing on this page
useEffect(() => {
  try {
    const raw = localStorage.getItem("leanToInputs");
    if (!raw) {
  setInputsRestored(true);
  return;
}

    const saved = JSON.parse(raw) || {};

    // Width: prefer internalWidthMM, fall back to widthMM
    const savedWidth =
      saved.internalWidthMM ?? saved.widthMM;
    if (savedWidth !== undefined) {
      setWidth(savedWidth);
    }

    // Projection: prefer internalProjectionMM, fall back to projMM
    const savedProj =
      saved.internalProjectionMM ?? saved.projMM;
    if (savedProj !== undefined) {
      setProj(savedProj);
    }

    // Pitch
    if (saved.pitchDeg !== undefined) {
      setPitch(saved.pitchDeg);
    }

    // Walls: your stored shape uses left_exposed/right_exposed
    if (typeof saved.left_exposed === "boolean") {
      setLeftWall(!saved.left_exposed);
    } else if (typeof saved.leftWall === "boolean") {
      setLeftWall(saved.leftWall);
    }

    if (typeof saved.right_exposed === "boolean") {
      setRightWall(!saved.right_exposed);
    } else if (typeof saved.rightWall === "boolean") {
      setRightWall(saved.rightWall);
    }

    if (saved.showQuote) {
      setShowQuote(true);
    }
  } catch (e) {
    console.warn("Failed to restore leanToInputs", e);
  } finally {
    setInputsRestored(true);
  }
}, []);


  // Persist current Lean-To inputs, merging into any existing leanToInputs object
useEffect(() => {
  if (!inputsRestored) return;

  try {
    const raw = localStorage.getItem("leanToInputs");
    const existing = raw ? JSON.parse(raw) : {};

    const merged = {
      ...existing,
      internalWidthMM:
        widthMM === "" ? undefined : Number(widthMM),
      internalProjectionMM:
        projMM === "" ? undefined : Number(projMM),
      pitchDeg,
      // store exposed flags (invert wall flags)
      left_exposed: !leftWall,
      right_exposed: !rightWall,
    };

    localStorage.setItem("leanToInputs", JSON.stringify(merged));
  } catch (e) {
    console.warn("Failed to save leanToInputs", e);
  }
}, [inputsRestored, widthMM, projMM, pitchDeg, leftWall, rightWall]);

  // Reset Lean-To inputs when arriving from Welcome page with { state: { fresh: true } }
  useEffect(() => {
    if (location.state?.fresh) {
      try {
        // Clear saved inputs so the page starts at defaults
        localStorage.removeItem("leanToInputs");

        // Reset local state (blank/default form)
        setWidth("");
        setProj("");
        setPitch(15);
        setLeftWall(false);
        setRightWall(false);
      } catch (err) {
        console.warn("Could not reset Lean-To inputs:", err);
      }

      // Clear the flag so Back/Forward doesn’t retrigger
      navigate(".", { replace: true, state: {} });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persist helper ----
  const persist = (patch) => {

  let cur = {};
  try { cur = JSON.parse(localStorage.getItem("leanToInputs")) || {}; } catch {}
  const next = { ...cur, ...patch };
  localStorage.setItem("leanToInputs", JSON.stringify(next));
};

  const [eavesOverhangMM, setEavesOverhang] = useState(150); // soffit depth (front)
  const [leftOverhangMM, setLeftOverhang] = useState("");    // optional side overhangs
  const [rightOverhangMM, setRightOverhang] = useState("");

  // Gutters
  const [gutterProfile, setGutterProfile] = useState("square"); // 'square' | 'round' | 'ogee'
  const [gutterOutlet,  setGutterOutlet]  = useState("left");   // 'left' | 'right' | 'center' | 'both' | 'none'
  const [gutterColor,   setGutterColor]   = useState("black");  // 'black' | 'white' | 'anthracite' | 'brown'

  // Tiles & plastics (cosmetic choices here)
  // ✅ Persist selected tile system across pages (init from localStorage)
  const [tileSystem, setTileSystem] = useState(() => {
    return localStorage.getItem("tl_tile_system") ?? "britmet";
  });
  const [tileColor, setTileColor]   = useState("Titanium");
  const [plasticsColor, setPlasticsColor] = useState("White");

  // Exposed sides (persisted via leanToInputs; also synced with wall checkboxes)
  const [leftSideExposed, setLeftSideExposed] = useState(() => {
    const stored = localStorage.getItem("leanToInputs");
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored);
      return parsed.left_exposed ?? true;   // legacy key
    } catch {
      return true;
    }
  });
  const [rightSideExposed, setRightSideExposed] = useState(() => {
    const stored = localStorage.getItem("leanToInputs");
    if (!stored) return true;
    try {
      const parsed = JSON.parse(stored);
      return parsed.right_exposed ?? true;  // legacy key
    } catch {
      return true;
    }
  });

  // Quote UI
  const [showQuote, setShowQuote] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");

  // ---- tile colour lists (per system) ----
  const britmetColours = [
    "Titanium",
    "Raven",
    "Bramble Brown",
    "Rustic Brown",
    "Rustic Terracotta",
    "Smoked Oak",
    "Rustic Red",
    "Tartan Green",
  ];
  const liteslateColours = [
    "Slate",
    "Ash",
    "Charcoal",
    "Oak",
    "Amethyst",
    "Sunset",
    "Sunshine",
  ];

  // If the user switches system and the current colour isn't valid, snap to first
  useEffect(() => {
    const list = tileSystem === "liteslate" ? liteslateColours : britmetColours;
    if (!list.includes(tileColor)) setTileColor(list[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileSystem, tileColor]);

  // ✅ Save tile system whenever it changes
  useEffect(() => {
    localStorage.setItem("tl_tile_system", String(tileSystem).toLowerCase());
  }, [tileSystem]);

  // ——— Persist to match the rest of the app ———
const persistInputs = (opts = {}) => {
  const payload = {
    // core sizes
    internalWidthMM: widthMM === "" ? null : Number(widthMM),
    internalProjectionMM: projMM === "" ? null : Number(projMM),
    pitchDeg: Number(pitchDeg),

    // fascia/soffit + overhangs
    soffit_mm: Number(eavesOverhangMM),
    left_overhang_mm: Number(leftOverhangMM || 0),
    right_overhang_mm: Number(rightOverhangMM || 0),

    // exposed/wall flags — store with legacy keys for compatibility
    left_exposed: leftSideExposed,
    right_exposed: rightSideExposed,

    // defaults other pages expect
    gauge_mm: 250,
    tile_cover_w_mm: m.tile_britmet_cover_w_mm ?? 1231,
    eaves_overhang_mm: 50,
    plastics_finish:
      String(plasticsColor).toLowerCase() === "white" ? "white" : "foiled",
    vent_method: "factory",
    side_frame_thickness_mm: m.side_frame_thickness_mm ?? 70,
    fascia_lip_mm: m.fascia_lip_mm ?? 25,
    frame_on_mm: m.frame_on_mm ?? 70,

    // gutters
    gutter_profile: gutterProfile,
    gutter_outlet: gutterOutlet,
    gutter_color: gutterColor,

    // cosmetic choices
    tile_system: tileSystem,
    tile_color: tileColor,
    plastics_color: plasticsColor,

    // NEW: whether the quote/plan panel is currently shown
    showQuote: opts.overrideShowQuote ?? showQuote,
  };

  localStorage.setItem("leanToInputs", JSON.stringify(payload));
};


  // LOAD once on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem("leanToInputs");
      if (s) {
        const q = JSON.parse(s);

        // core sizes
        if (q.internalWidthMM != null)      setWidth(String(Number(q.internalWidthMM)));
        if (q.internalProjectionMM != null) setProj(String(Number(q.internalProjectionMM)));
        if (q.pitchDeg != null)             setPitch(Number(q.pitchDeg));
        if (q.soffit_mm != null)            setEavesOverhang(Number(q.soffit_mm));
        if (q.left_overhang_mm != null)     setLeftOverhang(String(q.left_overhang_mm));
        if (q.right_overhang_mm != null)    setRightOverhang(String(q.right_overhang_mm));

// walls — prefer new keys, fall back to legacy exposed flags
if ("left_wall_present" in q) {
  setLeftWall(!!q.left_wall_present);
} else if ("left_exposed" in q) {
  setLeftWall(!q.left_exposed);
}

if ("right_wall_present" in q) {
  setRightWall(!!q.right_wall_present);
} else if ("right_exposed" in q) {
  setRightWall(!q.right_exposed);
}


        // gutters
        if (q.gutter_profile)               setGutterProfile(String(q.gutter_profile));
        if (q.gutter_outlet)                setGutterOutlet(String(q.gutter_outlet));
        if (q.gutter_color)                 setGutterColor(String(q.gutter_color));

        // cosmetics
        if (q.tile_system)                  setTileSystem(String(q.tile_system));
        if (q.tile_color)                   setTileColor(String(q.tile_color));
        if (q.plastics_color)               setPlasticsColor(String(q.plastics_color));
      }
    } catch (e) {
      console.warn("Failed to load leanToInputs", e);
    }

    // If a subpage asked us to show the quote on return
    if (localStorage.getItem("auto_show_quote") === "1") {
      setShowQuote(true);
      localStorage.removeItem("auto_show_quote");
    }
  }, []);

  // Keep exposed-side flags in sync with the “wall present?” checkboxes
  useEffect(() => {
    setLeftSideExposed(!leftWall);
    setRightSideExposed(!rightWall);
  }, [leftWall, rightWall]);

// ===============================
// SINGLE SOURCE OF TRUTH TOTALS
// (same pipeline as Summary)
// ===============================

const exclusions = useMemo(() => ({}), []); // Landing = no exclusions (customer-facing)

const totalsInput = useMemo(
  () => ({
    widthMM: num(widthMM, 0),
    projMM: num(projMM, 0),
    pitchDeg: num(pitchDeg, 15),

    leftWall,
    rightWall,

    eavesOverhangMM: num(eavesOverhangMM, 150),
    leftOverhangMM: num(leftOverhangMM, 0),
    rightOverhangMM: num(rightOverhangMM, 0),

    tileSystem,
    plasticsColor,
    gutterProfile,
    gutterOutlet,
    gutterColor,
  }),
  [
    widthMM,
    projMM,
    pitchDeg,
    leftWall,
    rightWall,
    eavesOverhangMM,
    leftOverhangMM,
    rightOverhangMM,
    tileSystem,
    plasticsColor,
    gutterProfile,
    gutterOutlet,
    gutterColor,
  ]
);

/*const t = useMemo(
  () => buildLeanToTotals(totalsInput, exclusions),
  [totalsInput, exclusions]
);
*/
const quoteBase = useMemo(
  () => buildLeanToQuoteBase(totalsInput, exclusions),
  [totalsInput, exclusions]
);
const totals = useMemo(
  () => buildLeanToTotals(totalsInput, exclusions),
  [totalsInput, exclusions]
);
const pricing = useMemo(() => {
  const labourConfig = getLabourPricingConfig();

  const labourFeatures = {
    roofVent: false,
    fixedUnit: false,
    reinforcedRingBeam: false,
  };

  const labour = computeLabourPricing({
    widthMM: Number(widthMM || 0),
    projectionMM: Number(projMM || 0),
    tileSystem,
    config: labourConfig,
    features: labourFeatures,
  });

  return computePricing(quoteBase.materialsCostForPricing, m, {
    labourCost: labour.labourCost,
  });
}, [
  quoteBase.materialsCostForPricing,
  m,
  widthMM,
  projMM,
  tileSystem,
]);
/*console.log("PRICING_COMPARE", {
  page: "LeanToLanding",
  materialsCostForPricing: quoteBase?.materialsCostForPricing,
  delivery_flat: m?.delivery_flat,
  profit_pct: m?.profit_pct,
  vat_rate: m?.vat_rate,
  net: pricing?.net,
  vat: pricing?.vat,
  gross: pricing?.gross,

  // geometry + options that MUST match Summary
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

  // ❌ Do NOT auto-save on every input change – it wipes leanToInputs when revisiting the page
/*
useEffect(() => {
  persistInputs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  widthMM, projMM, pitchDeg,
  leftWall, rightWall,
  eavesOverhangMM, leftOverhangMM, rightOverhangMM,
  gutterProfile, gutterOutlet, gutterColor,
  tileSystem, tileColor, plasticsColor,
]);
*/


// ——— Derived external sizes ———
const extWidthMM = useMemo(() => {
  const iw   = num(widthMM);

  // Side frame + lip from materials (with sensible fallbacks)
  const SFT  = num(m.side_frame_thickness_mm ?? 70);
  const LIP  = num(m.fascia_lip_mm ?? 25);

  const L_OH = num(leftOverhangMM, 0);
  const R_OH = num(rightOverhangMM, 0);

  // Rules:
  // - If side is a wall => 0 (we don't push past the wall)
  // - If side is open AND has an explicit overhang => frame + that overhang
  // - If side is open AND no overhang entered      => frame + lip
  const leftDelta = leftWall
    ? 0
    : (L_OH > 0 ? SFT + L_OH : SFT + LIP);

  const rightDelta = rightWall
    ? 0
    : (R_OH > 0 ? SFT + R_OH : SFT + LIP);

  return iw + leftDelta + rightDelta;
}, [widthMM, leftWall, rightWall, leftOverhangMM, rightOverhangMM, m]);



  const extProjectionMM = useMemo(() => {
    const ip      = num(projMM);
    const soff    = num(eavesOverhangMM);
    const frameOn = num(m.frame_on_mm ?? 70);
    return ip + soff + frameOn;
  }, [projMM, eavesOverhangMM, m]);

  const theta = (num(pitchDeg) * Math.PI) / 180;
  const slopeMM = extProjectionMM / Math.cos(theta);
  const riseMM = extProjectionMM * Math.tan(theta);

  // ——— Minimal BOMs ———

  const tilesBom = useMemo(() => {
    // If LiteSlate selected, use the LiteSlate calculator
    if (String(tileSystem).toLowerCase() === "liteslate" && typeof computeLiteSlate === "function") {
      return computeLiteSlate(
        {
          run_mm: extWidthMM,
          projection_mm: extProjectionMM,
          pitch_deg: pitchDeg,
        },
        m
      );
    }

    // Default: Britmet tiles & laths calculator
    return computeTilesLathsBOM(
      {
        run_mm: extWidthMM,
        // projection_mm: extProjectionMM, // ❌ keep omitted to avoid double-deriving
        slope_mm: slopeMM,                 // ✅ use single slope basis
        pitch_deg: pitchDeg,
        eaves_overhang_mm: 50,
        leftSide: leftSideExposed ? "exposed" : "wall",
        rightSide: rightSideExposed ? "exposed" : "wall",
        waste_pct: 5,
        gauge_mm: m.tile_britmet_gauge_mm ?? 250,
        cover_width_mm: m.tile_britmet_cover_w_mm ?? 1231,
      },
      m
    );
  }, [
    tileSystem,
    extWidthMM,
    extProjectionMM,
    slopeMM,
    pitchDeg,
    leftSideExposed,
    rightSideExposed,
    m,
  ]);

  /*const plastics = useMemo(
  () =>
    computeFasciaSoffitLeanTo(
      {
        run_mm: extWidthMM,
        pitch_deg: pitchDeg,
        soffit_requested_mm: eavesOverhangMM,
        slope_mm: slopeMM,
        projection_mm: extProjectionMM,

        // old names (if fasciaSoffitCalc ever used them)
        leftSideExposed,
        rightSideExposed,

        // 👇 names fasciaSoffitCalc *does* read
        left_exposed: leftSideExposed,
        right_exposed: rightSideExposed,

        // pricing band: white vs foiled
        finish:
          String(plasticsColor).toLowerCase() === "white"
            ? "white"
            : "foiled",

        // NEW: actual visible colour name for labels
        plastics_color: plasticsColor,

        vent_method: "factory",
      },
      m
    ),
  [
    extWidthMM,
    pitchDeg,
    eavesOverhangMM,
    leftSideExposed,
    rightSideExposed,
    slopeMM,
    extProjectionMM,
    plasticsColor,
    m,
  ]
);

  const gutters = useMemo(
    () =>
      computeGuttersLeanTo(
        {
          run_mm: extWidthMM,
          profile: gutterProfile,
          outlet: gutterOutlet,
          color: gutterColor,
        },
        m
      ),
    [extWidthMM, gutterProfile, gutterOutlet, gutterColor, m]
  );

  // ✅ Edge trims (dry verge etc.) — works for Britmet & LiteSlate
  const edgeTrims = useMemo(() => {
    return computeEdgeTrimsLeanTo(
      {
        ext_width_mm: extWidthMM,
        ext_projection_mm: extProjectionMM,
        pitch_deg: pitchDeg,
        // slope_mm: slopeMM, // optional

        leftSide: leftSideExposed ? "exposed" : "wall",
        rightSide: rightSideExposed ? "exposed" : "wall",
        tileSystem: String(tileSystem).toLowerCase(),
        finish: String(plasticsColor).toLowerCase() === "white" ? "white" : "foiled",
      },
      m
    );
  }, [extWidthMM, extProjectionMM, pitchDeg, leftSideExposed, rightSideExposed, tileSystem, plasticsColor, m]);
*/
// --- Build a tile total hint for misc (so tile screws use real tile count) ---
const tilesLineForHint =
  (tilesBom?.lines || []).find(r =>
    /tiles/i.test(String(r.key || r.label || ""))) || null;

const tilesTotalHintRaw =
  tilesBom?.derived?.tiles_total ??
  tilesLineForHint?.qty ??
  tilesLineForHint?.qtyDisplay;

const tilesTotalHint = Number(tilesTotalHintRaw);

// --- Compute Misc (breather, slab, SuperQuilt, fixings etc.) ---
/*
const misc = React.useMemo(() => {
  return computeMiscLeanTo(
    {
      tile_system: tileSystem,          // "britmet" or "liteslate"
      pitchDeg,                         // lets misc pick LiteSlate density bands
      internalWidthMM: Number(widthMM) || 0,
      internalProjectionMM: Number(projMM) || 0,
      tiles_total_hint: Number.isFinite(tilesTotalHint) ? tilesTotalHint : undefined,
    },
    m
  );
  
}, [tileSystem, pitchDeg, widthMM, projMM, tilesTotalHint, m]);
*/

// Can we generate a quote yet?
const canQuote = Number(widthMM) > 0 && Number(projMM) > 0;

  const onGetQuote = () => {
  // Save inputs AND the fact that the quote/diagram is visible
  persistInputs({ overrideShowQuote: true });
  setShowQuote(true);

  setTimeout(() => {
    const el = document.getElementById("quote-result");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
};


  const resetAll = () => {
    // clear UI
    setWidth("");
    setProj("");
    setPitch(15);
    setLeftWall(false);
    setRightWall(false);
    setEavesOverhang(150);
    setLeftOverhang("");
    setRightOverhang("");

    // gutters
    setGutterProfile("square");
    setGutterOutlet("left");
    setGutterColor("black");

    // tiles/plastics
    setTileSystem("britmet");
    setTileColor("charcoal");
    setPlasticsColor("white");

    setQuoteRef("");
    setShowQuote(false);

    // clear stored in-progress quote
    localStorage.removeItem("leanToInputs");
  };

  const saveQuote = () => {
    const ref = (quoteRef || "").trim();
    if (!ref) {
      alert("Please enter a quote reference first.");
      return;
    }
    if (!canQuote) {
      alert("Please enter width and projection before saving.");
      return;
    }

    // make sure we’ve written the latest inputs
    persistInputs();
    let payload = {};
    try {
      payload = JSON.parse(localStorage.getItem("leanToInputs") || "{}");
    } catch {}

    // compact summary to save alongside the raw inputs
    const record = {
      ref,
      createdAt: new Date().toISOString(),
      inputs: payload,
      summary: {
        internalWidthMM: Number(widthMM),
        internalProjectionMM: Number(projMM),
        pitchDeg,
        leftWall,
        rightWall,
        eavesOverhangMM: Number(eavesOverhangMM),
        leftOverhangMM: Number(leftOverhangMM || 0),
        rightOverhangMM: Number(rightOverhangMM || 0),
        tileSystem,
        tileColor,
        plasticsColor,
        gutterProfile,
        gutterColor,
        gutterOutlet,
        extWidthMM: Math.round(extWidthMM),
        extProjectionMM: Math.round(extProjectionMM),
        riseMM: Math.round(riseMM),
        net: Number((pricing.net ?? 0).toFixed(2)),
        gross: Number((pricing.gross ?? 0).toFixed(2)),
      },
    };

    const KEY = "quotes";
    let list = [];
    try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}

    const idx = list.findIndex((q) => (q && q.ref) === ref);
    if (idx >= 0) {
      const overwrite = window.confirm(`A quote with ref "${ref}" already exists. Overwrite it?`);
      if (!overwrite) return;
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(KEY, JSON.stringify(list));
    alert("Quote saved.");
  };
  /*
const manufactureGeom = useMemo(
  () =>
    computeLeanToManufactureGeometry({
      internalProjectionMM: Number(projMM || 0),
      pitchDeg: Number(pitchDeg || 15),
      soffitDepthMM: Number(eavesOverhangMM ?? 150),

      frameThicknessMM: 70,
      soffitBoardThicknessMM: 10,
      plyThicknessMM: 9,
      lathThicknessMM: 25,

      fasciaStockSizesMM: [200, 225, 250, 300, 400],
    }),
  [projMM, pitchDeg, eavesOverhangMM]
);
*/
const demoBase = tileSystem === "liteslate" ? 450 : 110;
const demoPct = tileSystem === "liteslate" ? 0.235 : 0.525;

const demoProfit = demoBase + (pricing.net ?? 0) * demoPct;
const demoNet = (pricing.net ?? 0) + demoProfit;
const demoVat = demoNet * (pricing.vatRate ?? 0);
const demoGross = demoNet + demoVat;

  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, system-ui, Arial" }}>
<NavTabs />

      {/* Page body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 8px" }}>
          <img src="/logo.png" alt="Timberlite" style={{ height: 38 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Timberlite Lean-To</h1>
        </div>
        <p style={{ color: "#555", marginTop: 0, marginBottom: 14 }}>
          Enter your sizes and options below. We’ll show a plan preview and your price.
        </p>

        {/* Inputs card */}
        <div style={card}>
          <div style={grid2}>
            <label>Width (internal, mm)
              <input
                type="number"
                value={widthMM}
                placeholder="e.g. 3500"
                onChange={(e) => setWidth(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
            </label>

            <label>Projection (internal, mm)
              <input
                type="number"
                value={projMM}
                placeholder="e.g. 2500"
                onChange={(e) => setProj(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
            </label>

            <label>Pitch (degrees)
              <input
                type="number"
                step="0.1"
                value={pitchDeg}
                onChange={(e) => setPitch(num(e.target.value, 0))}
                className="border rounded px-2 py-1 w-full"
              />
              {pitchDeg < 15 && (
                <div style={{ color: "#b45309", fontSize: 12, marginTop: 4 }}>
                  Recommended minimum is 15°. Please confirm suitability if you go lower.
                </div>
              )}
            </label>

<div style={{ display: "grid", gap: 8 }}>
  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={leftWall}
  onChange={(e) => {
    const v = e.target.checked;
    setLeftWall(v);
    persist({ left_wall_present: v, left_exposed: !v });
  }}
/>

    Left side wall present
  </label>

  <label className="flex items-center gap-2">
    <input
  type="checkbox"
  checked={rightWall}
  onChange={(e) => {
    const v = e.target.checked;
    setRightWall(v);
    persist({ right_wall_present: v, right_exposed: !v });
  }}
/>

    Right side wall present
  </label>
</div>

            <label>Overhang at eaves (mm)
  <input
    type="number"
    value={eavesOverhangMM}
    onChange={(e) => {
      const v = num(e.target.value, 0);
      setEavesOverhang(v);
      persist({ soffit_mm: v });
    }}
    className="border rounded px-2 py-1 w-full"
  />
</label>

            <label>Overhang at left side (mm)
  <input
    type="number"
    placeholder="e.g. 150"
    value={leftOverhangMM}
    onChange={(e) => {
      const v = e.target.value;
      setLeftOverhang(v);
      persist({ left_overhang_mm: Number(v || 0) });
    }}
    className="border rounded px-2 py-1 w-full"
  />
</label>

            <label>Overhang at right side (mm)
  <input
    type="number"
    placeholder="e.g. 150"
    value={rightOverhangMM}
    onChange={(e) => {
      const v = e.target.value;
      setRightOverhang(v);
      persist({ right_overhang_mm: Number(v || 0) });
    }}
    className="border rounded px-2 py-1 w-full"
  />
</label>

            {/* Tile system + colour */}
            <label>Tile system
              <select
                value={tileSystem}
                onChange={(e) => setTileSystem(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="britmet">Britmet</option>
                <option value="liteslate">LiteSlate</option>
              </select>
            </label>

            <label>Tile colour
              <select
                value={tileColor}
                onChange={(e) => setTileColor(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                {(tileSystem === "liteslate" ? liteslateColours : britmetColours).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* Fascia/Soffit colour (cosmetic) */}
            <label>Fascia / Soffit colour
              <select
                value={plasticsColor}
                onChange={(e) => setPlasticsColor(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="White">White</option>
                <option value="Rosewood">Rosewood</option>
                <option value="Black">Black</option>
                <option value="Anthracite">Anthracite</option>
                <option value="Light Oak">Light Oak</option>
                <option value="Cream">Cream</option>
              </select>
              {plasticsColor === "Cream" && (
                <div style={{ color: "#b45309", fontSize: 12, marginTop: 4 }}>
                  Cream: Priced on request
                </div>
              )}
            </label>

            {/* Gutter style + colour */}
            <label>Gutter profile
              <select
                value={gutterProfile}
                onChange={(e) => setGutterProfile(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="square">Square</option>
                <option value="round">Round</option>
                <option value="ogee">Ogee</option>
              </select>
            </label>

            <label>Gutter colour
              <select
                value={gutterColor}
                onChange={(e) => setGutterColor(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="black">Black</option>
                <option value="white">White</option>
                <option value="anthracite">Anthracite</option>
                <option value="brown">Brown</option>
              </select>
            </label>

            <label>Gutter outlet position
  <select
    value={gutterOutlet}
    onChange={(e) => {
      const v = e.target.value;
      setGutterOutlet(v);
      persist({ gutter_outlet: v });
    }}
    className="border rounded px-2 py-1 w-full"
  >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="center">Center</option>
                <option value="both">Both ends</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={onGetQuote}
              style={primaryBtn}
              disabled={!canQuote}
              aria-disabled={!canQuote}
              title={!canQuote ? "Enter width & projection first" : "Generate price & plan"}
            >
              Get Quote
            </button>

            {/* Save with reference */}
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "#374151" }}>Quote ref</span>
              <input
                type="text"
                value={quoteRef}
                onChange={(e) => setQuoteRef(e.target.value)}
                placeholder="e.g. SMITH-0725"
                className="border rounded px-2 py-1"
                style={{ minWidth: 160 }}
              />
            </label>

            <button
              onClick={saveQuote}
              style={{ ...primaryBtn, background: "#10b981", borderColor: "#10b981" }}
              disabled={!canQuote || !quoteRef.trim()}
              title={!quoteRef.trim() ? "Enter a quote ref to save" : "Save this quote"}
            >
              Save Quote
            </button>

            <button
              onClick={resetAll}
              style={{ ...primaryBtn, background: "#64748b", borderColor: "#64748b" }}
              title="Clear all fields and current stored quote"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {showQuote && (
          <div id="quote-result" style={{ marginTop: 16, display: "grid", gap: 14 }}>
            {/* Plan preview */}
            <div style={card}>
              <h2 style={h2}>Plan preview</h2>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                <PlanDiagramLeanTo
                  iw={num(widthMM)}
                  ip={num(projMM)}
                  sft={num(m.side_frame_thickness_mm ?? 70)}
                  lip={num(m.fascia_lip_mm ?? 25)}
                  soffit={num(eavesOverhangMM)}
                  frameOn={num(m.frame_on_mm ?? 70)}
                  leftOH={num(leftOverhangMM, 0)}
                  rightOH={num(rightOverhangMM, 0)}
                  leftWall={leftWall}
                  rightWall={rightWall}
                  rafterSpacing={num(m.rafter_spacing_mm ?? 665)}
                  firstCentre={num(m.rafter_first_center_mm ?? 690)}
                  outlet={gutterOutlet}
                  gutterColor={gutterColor}
                />
              </div>

              <div style={{ marginTop: 10, color: "#444", display: "grid", gap: 4 }}>
                <div>
                  <b>Internal width</b>: {round(widthMM)} mm · <b>External width</b>: {round(extWidthMM)} mm
                </div>
                <div>
                  <b>External projection</b>: {round(extProjectionMM)} mm · <b>Internal projection</b>: {round(projMM)} mm
                </div>
                <div>
                  <b>Back height (rise)</b>: {round(riseMM)} mm · <b>Pitch</b>: {pitchDeg}°
                </div>
                <div>
                  <b>Tile</b>: {tileSystem === "britmet" ? "Britmet" : "LiteSlate"} — <b>{tileColor}</b>
                </div>
                <div>
                  <b>Fascia/Soffit</b>: <b>{plasticsColor}</b> · <b>Gutter</b>: {gutterProfile} / {gutterColor}, outlet {gutterOutlet}
                </div>
              </div>
            </div>

            {/* Price summary */}
<div style={card}>
  <h2 style={h2}>Your price</h2>
  <div style={{ display: "grid", gap: 6, fontSize: 16 }}>
    <div>
      Materials subtotal (net): <b>£{(pricing.net ?? 0).toFixed(2)}</b>
    </div>
    <div>
      VAT ({((pricing.vatRate ?? 0) * 100).toFixed(0)}%): £{(pricing.vat ?? 0).toFixed(2)}
    </div>
    <div style={{ fontSize: 18 }}>
      Total (gross): <b>£{(pricing.gross ?? 0).toFixed(2)}</b>
    </div>
  </div>
  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
    Includes tiles & ancillaries, fascia/soffit, gutters, tile starter, J-Section and membrane.
  </div>
</div>
          </div>
        )}
        <div
  style={{
    marginTop: 16,
    padding: 12,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#f9fafb",
    fontSize: 13,
  }}
>
  {/*
<h3 style={{ margin: "0 0 8px", fontSize: 15 }}>
  Manufacturing geometry debug
</h3>

<p style={{ margin: "2px 0" }}>
  <b>User soffit:</b> {manufactureGeom.userSoffitMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Effective soffit:</b> {manufactureGeom.effectiveSoffitMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Internal rafter length:</b> {manufactureGeom.internalRafterLengthMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Horizontal extension:</b> {manufactureGeom.horizontalExtensionMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>External rafter extension:</b> {manufactureGeom.externalRafterExtensionMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Total rafter length:</b> {manufactureGeom.totalRafterLengthMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Vertical drop:</b> {manufactureGeom.verticalDropMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Plumb cut height:</b> {manufactureGeom.plumbCutHeightMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Finished fascia height:</b> {manufactureGeom.finishedFasciaHeightMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Fascia allowance:</b> {manufactureGeom.fasciaAllowanceMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Ordering fascia reference:</b> {manufactureGeom.fasciaOrderingReferenceMM} mm
</p>
<p style={{ margin: "2px 0" }}>
  <b>Order fascia size:</b> {manufactureGeom.fasciaOrderSizeMM} mm
</p>
*/}
</div>
      </div>
    </div>
  );
}
