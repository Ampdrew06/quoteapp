// src/pages/lean-to/LeanToLanding.jsx
import PlanDiagramHippedLeanTo from "../../components/PlanDiagramHippedLeanTo";
import { calculateHippedLeanToGeometry } from "../../lib/geometry/hippedLeanToGeometry";
import HippedLeanToOptions from "../../components/HippedLeanToOptions";
import { isAdminUser } from "../../lib/userRole";
import { getCustomers } from "../../lib/customers";
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
import { getCurrentCustomer } from "../../lib/customers";
import {
  computePricing,
  computeLabourPricing,
  computeDeliveryPricing,
  getLabourPricingConfig,
  getDeliveryPricingConfig,
  getMarkupPricingConfig,
} from "../../lib/pricing";
import {
  saveQuote as saveQuoteToCloud,
  getNextQuoteNumber,
} from "../../lib/quotes";
//import { computeLeanToManufactureGeometry } from "../../lib/leanToManufactureGeometry";

// adjust path if file structure differs

//const LEAN_TO_STORAGE_KEY = "leanToInputs";

/* ——— styles ——— */
const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};
const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};
const inputStyle = {
  width: "100%",
  height: 34,
  padding: "5px 8px",
  fontSize: 13,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  boxSizing: "border-box",
};
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
const isMobile = window.innerWidth < 600;

const grid2Responsive = {
  display: "grid",
  gridTemplateColumns: isMobile
    ? "1fr 1fr"
    : "repeat(auto-fit, minmax(180px, 1fr))",
  gap: isMobile ? 8 : 10,
};

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
  const [roofStyle, setRoofStyle] = useState(location.state?.roofStyle || "leanTo");
  const [hippedSides, setHippedSides] = useState(location.state?.hippedSides || "both");
  const [leftHip, setLeftHip] = useState(true);
  const [rightHip, setRightHip] = useState(true);
  const [leftHipWidthMM, setLeftHipWidthMM] = useState("1000");
  const [rightHipWidthMM, setRightHipWidthMM] = useState("1000");
  const [leftHipWidthManual, setLeftHipWidthManual] = useState(false);
  const [rightHipWidthManual, setRightHipWidthManual] = useState(false);
  const activeHippedSides =
  leftHip && rightHip ? "both" : leftHip ? "left" : rightHip ? "right" : "none";
  const getDefaultHipWidth = (projection) => {
  const p = Number(projection) || 0;
  if (!p) return 1000;
  return Math.round(p * 0.5);
};
const degToRad = (deg) => (Number(deg) * Math.PI) / 180;
const radToDeg = (rad) => (Number(rad) * 180) / Math.PI;

const calcSidePitchDeg = ({ frontPitchDeg, projectionMM, hipWidthMM }) => {
  const projection = Number(projectionMM) || 0;
  const hipWidth = Number(hipWidthMM) || 0;

  if (!projection || !hipWidth) return 0;

  return radToDeg(
    Math.atan(Math.tan(degToRad(frontPitchDeg)) * (projection / hipWidth))
  );
};

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
const [materialsVersion, setMaterialsVersion] = useState(0);

useEffect(() => {
  const handleMaterialsUpdated = () => {
    setMaterialsVersion((v) => v + 1);
  };

  window.addEventListener("materials_updated", handleMaterialsUpdated);

  return () => {
    window.removeEventListener("materials_updated", handleMaterialsUpdated);
  };
}, []);

const m = useMemo(() => getMaterials(), [materialsVersion]);


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
if (saved.roofStyle) {
  setRoofStyle(saved.roofStyle);
}

if (saved.hippedSides) {
  setHippedSides(saved.hippedSides);
}

if (typeof saved.leftHip === "boolean") {
  setLeftHip(saved.leftHip);
}

if (typeof saved.rightHip === "boolean") {
  setRightHip(saved.rightHip);
}

if (saved.leftHipWidthMM !== undefined) {
  setLeftHipWidthMM(saved.leftHipWidthMM);
}

if (saved.rightHipWidthMM !== undefined) {
  setRightHipWidthMM(saved.rightHipWidthMM);
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

  roofStyle,
  hippedSides: activeHippedSides,

  leftHip,
  rightHip,
  leftHipWidthMM,
  rightHipWidthMM,

  left_exposed: !leftWall,
  right_exposed: !rightWall,
};

    localStorage.setItem("leanToInputs", JSON.stringify(merged));
  } catch (e) {
    console.warn("Failed to save leanToInputs", e);
  }
}, [
  inputsRestored,
  widthMM,
  projMM,
  pitchDeg,
  leftWall,
  rightWall,
  roofStyle,
  activeHippedSides,
  leftHip,
  rightHip,
  leftHipWidthMM,
  rightHipWidthMM,
]);
useEffect(() => {
  const defaultHip = getDefaultHipWidth(projMM);

  if (!leftHipWidthManual) {
    setLeftHipWidthMM(String(defaultHip));
  }

  if (!rightHipWidthManual) {
    setRightHipWidthMM(String(defaultHip));
  }
}, [
  projMM,
  leftHipWidthManual,
  rightHipWidthManual,
]);

  // Reset Lean-To inputs when arriving from Welcome page with { state: { fresh: true } }
  useEffect(() => {
    if (location.state?.fresh) {
  try {
    // Clear saved inputs so the page starts at defaults
    localStorage.removeItem("leanToInputs");

localStorage.removeItem("summary_exclusions");
window.dispatchEvent(new Event("summary_exclusions_updated"));

localStorage.removeItem("summary_adjustments");
window.dispatchEvent(new Event("summary_adjustments_updated"));

        // Reset local state (blank/default form)
        setWidth("");
        setProj("");
        setPitch(15);
        setLeftWall(false);
        setRightWall(false);
        setRoofStyle(location.state?.roofStyle || "leanTo");
        setHippedSides(location.state?.hippedSides || "both");
        setLeftHipWidthManual(false);
        setRightHipWidthManual(false);
        setLeftHip(true);
        setRightHip(true);
      } catch (err) {
        console.warn("Could not reset Lean-To inputs:", err);
      }

      // Clear the flag so Back/Forward doesn’t retrigger
      navigate(".", { replace: true, state: {} });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// ---- clear summary adjustments ----
const clearSummaryAdjustments = () => {
  localStorage.removeItem("summary_adjustments");
  window.dispatchEvent(new Event("summary_adjustments_updated"));
};

  // ---- persist helper ----
const persist = (patch) => {
  let cur = {};
  try {
    cur = JSON.parse(localStorage.getItem("leanToInputs")) || {};
  } catch {}

  const hasChanged = Object.keys(patch || {}).some(
    (key) => cur[key] !== patch[key]
  );

  const next = { ...cur, ...patch };
  localStorage.setItem("leanToInputs", JSON.stringify(next));

  if (hasChanged) clearSummaryAdjustments();
};

  const [eavesOverhangMM, setEavesOverhang] = useState(150); // soffit depth (front)
  const [leftOverhangMM, setLeftOverhang] = useState("");    // optional side overhangs
  const [rightOverhangMM, setRightOverhang] = useState("");
const [summaryAdjustmentTick, setSummaryAdjustmentTick] = useState(0);
  // Gutters
  const [gutterProfile, setGutterProfile] = useState("square"); // 'square' | 'round' | 'ogee'
  const [gutterOutlet,  setGutterOutlet]  = useState("left");   // 'left' | 'right' | 'center' | 'both' | 'none'
  const [gutterColor,   setGutterColor]   = useState("black");  // 'black' | 'white' | 'anthracite' | 'brown'

  // Tiles & plastics (cosmetic choices here)
  // ✅ Persist selected tile system across pages (init from localStorage)
  const [tileSystem, setTileSystem] = useState(() => {
    return localStorage.getItem("tl_tile_system") ?? "britmet";
  });
  const minTilePitchDeg = tileSystem === "liteslate" ? 12 : 15;

const leftSidePitchDeg = calcSidePitchDeg({
  frontPitchDeg: pitchDeg,
  projectionMM: projMM,
  hipWidthMM: leftHipWidthMM,
});

const rightSidePitchDeg = calcSidePitchDeg({
  frontPitchDeg: pitchDeg,
  projectionMM: projMM,
  hipWidthMM: rightHipWidthMM,
});

const leftHipPitchTooLow =
  roofStyle === "hippedLeanTo" &&
  leftHip &&
  leftSidePitchDeg > 0 &&
  leftSidePitchDeg < minTilePitchDeg;

const rightHipPitchTooLow =
  roofStyle === "hippedLeanTo" &&
  rightHip &&
  rightSidePitchDeg > 0 &&
  rightSidePitchDeg < minTilePitchDeg;
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
  const [deliveryPostcode, setDeliveryPostcode] = useState("");
  const [deliveryDistanceMiles, setDeliveryDistanceMiles] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
  const current = getCurrentCustomer();
  return current?.id || "retail";
});

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

  window.addEventListener("quoteapp_customers_updated", loadCustomers);

  return () => {
    alive = false;
    window.removeEventListener("quoteapp_customers_updated", loadCustomers);
  };
}, []);
const isAdmin = isAdminUser();
const selectedCustomer =
  selectedCustomerId !== "retail"
    ? customers.find((c) => c.id === selectedCustomerId) || null
    : null;
    const discountPct = selectedCustomer
  ? Number(selectedCustomer.discountPct || 0)
  : 0;
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

  const loadSummaryExclusions = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_exclusions") || "{}");
  } catch {
    return {};
  }
};
const loadSummaryAdjustments = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_adjustments") || "{}");
  } catch {
    return {};
  }
};

const loadSummaryExclusionValues = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_exclusion_values") || "{}");
  } catch {
    return {};
  }
};

const loadSummaryAdjustmentValues = () => {
  try {
    return JSON.parse(localStorage.getItem("summary_adjustment_values") || "{}");
  } catch {
    return {};
  }
};
useEffect(() => {
  const handleSummaryAdjustmentsUpdated = () => {
    setSummaryAdjustmentTick((v) => v + 1);
  };

  window.addEventListener(
    "summary_adjustments_updated",
    handleSummaryAdjustmentsUpdated
  );

  return () => {
    window.removeEventListener(
      "summary_adjustments_updated",
      handleSummaryAdjustmentsUpdated
    );
  };
}, []);

  // ——— Persist to match the rest of the app ———
const persistInputs = (opts = {}) => {
  const payload = {

    // core sizes
    internalWidthMM: widthMM === "" ? null : Number(widthMM),
    internalProjectionMM: projMM === "" ? null : Number(projMM),
    pitchDeg: Number(pitchDeg),
    selectedCustomerId,
    roofStyle,
    hippedSides: activeHippedSides,
    leftHip,
    rightHip,

    leftHipWidthMM: Number(leftHipWidthMM || 0),
    rightHipWidthMM: Number(rightHipWidthMM || 0),


    // customer / reference
    quoteRef,
    customerName: selectedCustomerId === "retail" ? "Retail" : selectedCustomer?.name || "",
    discountPct,

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

// delivery
deliveryPostcode: opts.deliveryPostcode ?? deliveryPostcode,
deliveryDistanceMiles:
  opts.deliveryDistanceMiles ?? Number(deliveryDistanceMiles || 0),

// NEW: whether the quote/plan panel is currently shown
showQuote: opts.overrideShowQuote ?? showQuote,
  };

  localStorage.setItem("leanToInputs", JSON.stringify(payload));
  window.dispatchEvent(new Event("leanToInputs_updated"));
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
if (q.gutter_profile) setGutterProfile(String(q.gutter_profile));
if (q.gutter_outlet) setGutterOutlet(String(q.gutter_outlet));
if (q.gutter_color) setGutterColor(String(q.gutter_color));

// cosmetics
if (q.tile_system) setTileSystem(String(q.tile_system));
if (q.tile_color) setTileColor(String(q.tile_color));
if (q.plastics_color) setPlasticsColor(String(q.plastics_color));

// customer
if (q.selectedCustomerId) {
  setSelectedCustomerId(String(q.selectedCustomerId));
}
if (q.quoteRef) setQuoteRef(String(q.quoteRef));

// delivery
if (q.deliveryPostcode) {
  setDeliveryPostcode(String(q.deliveryPostcode));
}

if (q.deliveryDistanceMiles != null) {
  setDeliveryDistanceMiles(Number(q.deliveryDistanceMiles || 0));
}
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
const summaryExclusions = loadSummaryExclusions();

const quoteBase = useMemo(
  () => buildLeanToQuoteBase(totalsInput, summaryExclusions),
  [totalsInput, summaryExclusions]
);

const totals = useMemo(
  () => buildLeanToTotals(totalsInput, summaryExclusions),
  [totalsInput, summaryExclusions]
);

const summaryAdjustments = loadSummaryAdjustments();
const summaryAdjustmentValues = loadSummaryAdjustmentValues();
const summaryExclusionValues = loadSummaryExclusionValues();

const adjustmentDelta = [
  ...Object.values(summaryAdjustmentValues),
  ...Object.values(summaryExclusionValues),
].reduce((sum, value) => {
  const n = Number(value);
  return Number.isFinite(n) ? sum + n : sum;
}, 0);


const pricing = useMemo(() => {
  const labourConfig = getLabourPricingConfig();

  const labourFeatures = {
    roofVent: false,
    fixedUnit: false,
    reinforcedRingBeam: false,
  };
const areaM2 =
  (Number(widthMM || 0) * Number(projMM || 0)) / 1_000_000;

let baseDays = 1;

if (areaM2 > 8.75) {
  baseDays = 1 + ((areaM2 - 8.75) * 0.15);
}

baseDays = Math.min(baseDays, 3);
baseDays = Math.ceil(baseDays * 10) / 10;

const savedInputs = (() => {
  try {
    return JSON.parse(localStorage.getItem("leanToInputs") || "{}");
  } catch {
    return {};
  }
})();

const labourDaysOverride = Number(savedInputs.labourDaysOverride);

const effectiveMinimumDays =
  Number.isFinite(labourDaysOverride) && labourDaysOverride > 0
    ? labourDaysOverride
    : Math.max(Number(labourConfig.minimumDays || 1), baseDays);

const labourConfigAdjusted = {
  ...labourConfig,
  minimumDays: effectiveMinimumDays,
};
  const labour = computeLabourPricing({
    widthMM: Number(widthMM || 0),
    projectionMM: Number(projMM || 0),
    tileSystem,
    config: labourConfigAdjusted,
    features: labourFeatures,
  });

  const deliveryConfig = getDeliveryPricingConfig();

const deliveryMilesForPricing =
  Number(deliveryDistanceMiles || 0) ||
  Number(selectedCustomer?.defaultDeliveryMilesOneWay || 0);

const deliveryResult = computeDeliveryPricing(
  deliveryMilesForPricing,
  deliveryConfig
);

const markupConfig = getMarkupPricingConfig();
console.log("DO_PRICE_DEBUG", {
  selectedCustomerId,
  selectedCustomer,
  discountPct,
  materialsCostForPricing: quoteBase.materialsCostForPricing,
  adjustmentDelta,
  deliveryDistanceMiles,
});
return computePricing(
  quoteBase.materialsCostForPricing + adjustmentDelta,
  {
    ...m,
    profit_pct: markupConfig.profitPct,
  },
  {
  labourCost: labour.labourCost,
  deliveryCost: deliveryResult.deliveryCost,
  discountPct,
}
);
}, [
  quoteBase.materialsCostForPricing,
  adjustmentDelta,
  summaryAdjustmentTick,
  m,
  widthMM,
  projMM,
  tileSystem,
  deliveryDistanceMiles,
  discountPct,
  selectedCustomer,
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

const ringBeamHeightMM = 40;
const roofBuildUpMM = 260;

const externalFinishedHeightMM =
  riseMM +
  ringBeamHeightMM +
  (roofBuildUpMM / Math.cos(theta));

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

const missingWidth = !Number(widthMM);
const missingProjection = !Number(projMM);
const missingPostcode = !isAdmin && !String(deliveryPostcode || "").trim();

const hasDeliveryPostcode = !missingPostcode;

const canQuote =
  !missingWidth &&
  !missingProjection &&
  hasDeliveryPostcode;

const requiredInputStyle = {
  borderColor: "#b91c1c",
  background: "#fef2f2",
};

const lookupDeliveryDistance = async () => {
  const postcode = String(deliveryPostcode || "").trim(); 

  if (!postcode) {
    setDeliveryDistanceMiles(0);
    setDeliveryError("");
    return;
  }

  setDeliveryLoading(true);
  setDeliveryError("");

  try {
    const res = await fetch("/api/delivery-distance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destinationPostcode: postcode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Could not calculate delivery distance");
    }

    const miles = Number(data.distanceMiles || 0);
setDeliveryDistanceMiles(miles);

persistInputs({
  deliveryPostcode: postcode,
  deliveryDistanceMiles: miles,
});
return miles;
  } catch (err) {
    setDeliveryDistanceMiles(0);
    setDeliveryError(err.message || "Delivery lookup failed");
  } finally {
    setDeliveryLoading(false);
  }
};

  const onGetQuote = async () => {
  setQuoteError("");

  if (!Number(widthMM) || !Number(projMM)) {
    setQuoteError("Please enter both width and projection before getting a quote.");
    return;
  }

  let miles = Number(deliveryDistanceMiles || 0);

const customerDefaultMiles = Number(
  selectedCustomer?.defaultDeliveryMilesOneWay || 0
);

if (!isAdmin && !String(deliveryPostcode || "").trim() && !customerDefaultMiles) {
  setQuoteError("Please enter a delivery postcode before getting a quote.");
  return;
}

if (String(deliveryPostcode || "").trim()) {
  miles = await lookupDeliveryDistance();
} else if (customerDefaultMiles) {
  miles = customerDefaultMiles;
}

// Save inputs AND the fact that the quote/diagram is visible
persistInputs({
  overrideShowQuote: true,
  deliveryPostcode: String(deliveryPostcode || "").trim(),
  deliveryDistanceMiles: miles,
});

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

    setRoofStyle(location.state?.roofStyle || roofStyle || "leanTo");
    setHippedSides(location.state?.hippedSides || "both");

    setLeftHip(true);
    setRightHip(true);
    setLeftHipWidthManual(false);
    setRightHipWidthManual(false);
    setLeftHipWidthMM("1000");
    setRightHipWidthMM("1000");
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
    setSelectedCustomerId("retail");

    setDeliveryPostcode("");
    setDeliveryDistanceMiles(0);
    setDeliveryError("");

    // clear stored in-progress quote
    localStorage.removeItem("leanToInputs");
    localStorage.removeItem("summary_exclusions");
    window.dispatchEvent(new Event("summary_exclusions_updated"));
    localStorage.removeItem("summary_adjustments");
    window.dispatchEvent(new Event("summary_adjustments_updated"));
  };

  const saveQuote = async () => {
  const manualReference = (quoteRef || "").trim();
const nextQuoteNumber = await getNextQuoteNumber();
if (!isAdmin && !manualReference) {
  alert("Please enter a customer reference before saving.");
  return;
}

  if (!canQuote) {
    alert("Please enter width and projection before saving.");
    return;
  }

  const payload = {
  widthMM,
  projMM,
  pitchDeg,

  leftWall,
  rightWall,

  eavesOverhangMM,
  leftOverhangMM,
  rightOverhangMM,

  tileSystem,
  tileColor,

  plasticsColor,

  gutterProfile,
  gutterColor,
  gutterOutlet,

  selectedCustomerId,

  deliveryPostcode,
  deliveryDistanceMiles,

  quoteRef: manualReference,
};

  const customerForQuote = selectedCustomer || getCurrentCustomer();

  const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(value || "")
    );

  const summary = {
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
  };

  const record = {
    quote_number: nextQuoteNumber,
manual_reference: manualReference,
    customer_id:
      customerForQuote && isUuid(customerForQuote.id)
        ? customerForQuote.id
        : null,
    customer_name: customerForQuote?.name || "",
    roof_style: "lean-to",
    status: "quote",
    inputs_json: payload,
    pricing_json: {
      net: Number((pricing.net ?? 0).toFixed(2)),
      vat: Number((pricing.vat ?? 0).toFixed(2)),
      gross: Number((pricing.gross ?? 0).toFixed(2)),
      summary,
    },
    materials_snapshot_json: getMaterials(),
  };

  const saved = await saveQuoteToCloud(record);

  if (!saved) {
    alert("Quote was not saved. Check the console for details.");
    return;
  }

  alert(`Quote ${nextQuoteNumber} saved.`);
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
const hippedGeom =
  roofStyle === "hippedLeanTo"
    ? calculateHippedLeanToGeometry({
        widthMM: num(widthMM),
        projectionMM: num(projMM),
        pitchDeg: num(pitchDeg, 15),
        soffitDepthMM: num(eavesOverhangMM),
        materials: m,

        hippedSides: activeHippedSides,
        leftHipWidthMM: num(leftHipWidthMM, 1000),
        rightHipWidthMM: num(rightHipWidthMM, 1000),

        leftWall,
        rightWall,
        leftOverhangMM: num(leftOverhangMM, 0),
        rightOverhangMM: num(rightOverhangMM, 0),
      })
    : null;

const displayExtWidthMM =
  roofStyle === "hippedLeanTo" && hippedGeom
    ? hippedGeom.externalWidthMM
    : extWidthMM;

const displayExtProjectionMM =
  roofStyle === "hippedLeanTo" && hippedGeom
    ? hippedGeom.externalProjectionMM
    : extProjectionMM;
    
  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, system-ui, Arial" }}>
<NavTabs />

      {/* Page body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0 8px" }}>
          <img src="/logo.png" alt="Timberlite" style={{ height: 38 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
  Timberlite {roofStyle === "hippedLeanTo" ? "Hipped Lean-To" : "Lean-To"}
</h1>
        </div>
        <p style={{ color: "#555", marginTop: 0, marginBottom: 14 }}>
          Enter your sizes and options below. We’ll show a plan preview and your price. 
          Frame thickness is defaulted to 70mm, please confirm this when ordering.
        </p>

        {/* Inputs card */}
        <div style={card}>
          <div style={grid2Responsive}>
            <label>Width (internal, mm)
              <input
                type="number"
                value={widthMM}
                placeholder="e.g. 3500"
                onChange={(e) => {
  setWidth(e.target.value);
  persist({ width: e.target.value });
}}
                style={{
  ...inputStyle,
  ...(missingWidth && quoteError ? requiredInputStyle : {}),
}}
              />
            </label>

            <label>Projection (internal, mm)
              <input
                type="number"
                value={projMM}
                placeholder="e.g. 2500"
                onChange={(e) => {setProj(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={{
  ...inputStyle,
  ...(missingProjection && quoteError ? requiredInputStyle : {}),
}}
              />

            </label>
{/* Tile system + colour */}
            <label>Tile system
              <select
                value={tileSystem}
                onChange={(e) => {setTileSystem(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={inputStyle}
              >
                <option value="britmet">Britmet</option>
                <option value="liteslate">LiteSlate</option>
              </select>
            </label>

            <label>Tile colour
              <select
                value={tileColor}
                onChange={(e) => {setTileColor(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={inputStyle}
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
                onChange={(e) => {setPlasticsColor(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={inputStyle}
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
            <label>Soffit to Front (mm)
  <input
    type="number"
    value={eavesOverhangMM}
onChange={(e) => {
  const v = e.target.value;

  // Allow empty input
  if (v === "") {
    setEavesOverhang("");
    return;
  }

  const numVal = Number(v);
  if (!Number.isNaN(numVal)) {
    setEavesOverhang(numVal);
    persist({ soffit_mm: numVal });
  }
}}
    style={inputStyle}
  />
</label>
{/* Gutter style + colour */}
            <label>Gutter profile
              <select
                value={gutterProfile}
                onChange={(e) => {setGutterProfile(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={inputStyle}
              >
                <option value="square">Square</option>
                <option value="round">Round</option>
                <option value="ogee">Ogee</option>
              </select>
            </label>

            <label>Gutter colour
              <select
                value={gutterColor}
                onChange={(e) => {setGutterColor(e.target.value);
  persist({ projectionMM: e.target.value });
}}
                style={inputStyle}
              >
                <option value="black">Black</option>
                <option value="white">White</option>
                <option value="anthracite">Anthracite</option>
                <option value="brown">Brown</option>
              </select>
            </label>
 
            <label>Pitch (degrees)
              <input
                type="number"
                step="0.1"
                value={pitchDeg}
onChange={(e) => {
  const v = e.target.value;

  if (v === "") {
    setPitch("");
    return;
  }

  const numVal = Number(v);
  if (!Number.isNaN(numVal)) {
    setPitch(numVal);
    persist({ pitch: numVal });
  }
}}
                style={inputStyle}
              />
              {pitchDeg < 15 && (
                <div style={{ color: "#b45309", fontSize: 12, marginTop: 4 }}>
                  Recommended minimum is 15°. Please confirm suitability if you go lower.
                </div>
              )}
            </label>

{roofStyle !== "hippedLeanTo" && (
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
)}
{roofStyle === "hippedLeanTo" && (
  <div style={{ gridColumn: "1 / -1" }}>
    <HippedLeanToOptions
    leftHip={leftHip}
    setLeftHip={setLeftHip}
    rightHip={rightHip}
    setRightHip={setRightHip}
    leftHipWidthMM={leftHipWidthMM}
    setLeftHipWidthMM={setLeftHipWidthMM}
    rightHipWidthMM={rightHipWidthMM}
    setRightHipWidthMM={setRightHipWidthMM}
    setLeftHipWidthManual={setLeftHipWidthManual}
    setRightHipWidthManual={setRightHipWidthManual}
    leftWall={leftWall}
    setLeftWall={setLeftWall}
    rightWall={rightWall}
    setRightWall={setRightWall}
    tileSystem={tileSystem}
    minTilePitchDeg={minTilePitchDeg}
    leftSidePitchDeg={leftSidePitchDeg}
    rightSidePitchDeg={rightSidePitchDeg}
    leftHipPitchTooLow={leftHipPitchTooLow}
    rightHipPitchTooLow={rightHipPitchTooLow}
    persist={persist}
      />
  </div>
)}
            

            {(roofStyle !== "hippedLeanTo" || (!leftHip && !leftWall)) && (
  <label>Left Overhang? (mm)
    <input
      type="number"
      placeholder="e.g. 150"
      value={leftOverhangMM}
      onChange={(e) => {
        const v = e.target.value;
        setLeftOverhang(v);
        persist({ left_overhang_mm: Number(v || 0) });
      }}
      style={inputStyle}
    />
  </label>
)}

            {(roofStyle !== "hippedLeanTo" || (!rightHip && !rightWall)) && (
  <label>Right Overhang? (mm)
    <input
      type="number"
      placeholder="e.g. 150"
      value={rightOverhangMM}
      onChange={(e) => {
        const v = e.target.value;
        setRightOverhang(v);
        persist({ right_overhang_mm: Number(v || 0) });
      }}
      style={inputStyle}
    />
  </label>
)}

      <label> Delivery postcode {isAdmin ? "(optional)" : ""}
  <input
    type="text"
    value={deliveryPostcode}
    style={missingPostcode && quoteError ? requiredInputStyle : undefined}
    onChange={(e) => {setDeliveryPostcode(e.target.value.toUpperCase());
  persist({ projectionMM: e.target.value });
}}
    onBlur={lookupDeliveryDistance}
onKeyDown={(e) => {
  if (e.key === "Enter") {
    lookupDeliveryDistance();
  }
}}
    style={inputStyle}
  />
  {deliveryLoading && (
    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
      Checking delivery distance...
    </div>
  )}
  
  {deliveryError && (
    <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 4 }}>
      {deliveryError}
    </div>
  )}
</label>
{/* Save with reference */}
            <label>
  Customer Reference
  <input
    type="text"
    value={quoteRef}
    onChange={(e) => {
  const v = e.target.value;
  setQuoteRef(v);
  persist({ quoteRef: v });
}}
    placeholder="e.g. SMITH"
    style={{
      ...inputStyle,
      minWidth: 160,
    }}
  />
</label>
    {/* TEMP HIDDEN – Gutter outlet not needed for now */}
{false && (
         <label>Gutter outlet position
  <select
    value={gutterOutlet}
    onChange={(e) => {
      const v = e.target.value;
      setGutterOutlet(v);
      persist({ gutter_outlet: v });
    }}
    style={inputStyle}
  >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="center">Center</option>
                <option value="both">Both ends</option>
                <option value="none">None</option>
              </select>
            </label>
)}
          </div>
          
{isAdmin && (
  <div style={{ marginTop: 12 }}>
    <label>
      Customer
      <select
        value={selectedCustomerId}
        onChange={(e) => {
  const id = e.target.value;
  setSelectedCustomerId(id);

  const selected = customers.find((c) => c.id === id);

  persist({
    selectedCustomerId: id,
    customerName: id === "retail" ? "Retail" : selected?.name || "",
    discountPct: id === "retail" ? 0 : Number(selected?.discountPct || 0),
  });
}}
        style={{ marginLeft: 10, padding: 6 }}
      >
        <option value="retail">Retail (No Discount)</option>

        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({Number(c.discountPct || 0)}%)
          </option>
        ))}
      </select>
    </label>
  </div>
)}
          <div
  style={{
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
    gap: 10,
  }}
>
            <button
              onClick={onGetQuote}
              style={{ ...primaryBtn, width: "100%" }}
              title={
  !Number(widthMM) || !Number(projMM)
    ? "Enter width & projection first"
    : !hasDeliveryPostcode
    ? "Enter delivery postcode first"
    : "Generate price & plan"
}
        
        >
              Quote
            </button>
            {quoteError && (
            <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 6 }}>
    {quoteError}
  </div>
)}

            

            <button
              onClick={saveQuote}
              style={{ ...primaryBtn, width: "100%", background: "#10b981", borderColor: "#10b981" }}
              disabled={!canQuote || (!isAdmin && !quoteRef.trim())}
title={
  !canQuote
    ? "Enter the required roof details first"
    : !isAdmin && !quoteRef.trim()
    ? "Please enter a customer reference"
    : "Save this quotation"
}
            >
              Save Quote
            </button>

            <button
              onClick={resetAll}
              style={{ ...primaryBtn, width: "100%", background: "#64748b", borderColor: "#64748b" }}
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
                {roofStyle === "hippedLeanTo" ? (
  <PlanDiagramHippedLeanTo
  iw={num(widthMM)}
  ip={num(projMM)}
  leftHipWidth={num(leftHipWidthMM, 1000)}
  rightHipWidth={num(rightHipWidthMM, 1000)}
  hippedSides={activeHippedSides}
  pitchDeg={num(pitchDeg, 15)}
  soffitDepthMM={num(eavesOverhangMM)}
  rafterSpacing={num(m.rafter_spacing_mm ?? 665)}
  firstCentre={num(m.rafter_first_center_mm ?? 690)}
  tileSystem={tileSystem}

  externalWidthMM={hippedGeom?.externalWidthMM}
  externalProjectionMM={hippedGeom?.externalProjectionMM}

  leftExternalAllowanceMM={hippedGeom?.leftExternalAllowanceMM}
  rightExternalAllowanceMM={hippedGeom?.rightExternalAllowanceMM}

  leftSideRingBeamLayout={hippedGeom?.leftSideRingBeamLayout}
  rightSideRingBeamLayout={hippedGeom?.rightSideRingBeamLayout}

  leftBoundaryType={hippedGeom?.leftBoundaryType}
  rightBoundaryType={hippedGeom?.rightBoundaryType}

  leftWall={leftWall}
  rightWall={rightWall}
/>
) : (
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
)}
              </div>

              <div style={{ marginTop: 10, color: "#444", display: "grid", gap: 4 }}>
                <div>
                  <b>Internal width</b>: {round(widthMM)} mm · <b>External width</b>: {round(displayExtWidthMM)} mm
                </div>
                <div>
                  <b>Internal projection</b>: {round(projMM)} mm · <b>External projection</b>: {round(displayExtProjectionMM)} mm
                </div>
                <div>
                  <b>Internal Wall-Plate Height</b>: {round(riseMM)} mm · <b>Pitch</b>: {pitchDeg}°
                </div>
                <div>
  <b>External Finished Height</b>: {round(externalFinishedHeightMM)} mm
</div>
                {roofStyle === "hippedLeanTo" && hippedGeom && (
  <>
    <div>
      <b>Front Soffit</b>: {Math.round(hippedGeom?.frontSoffitMM ?? 0)} mm</div>

    <div className="mt-3 rounded border bg-light p-3">
    <div className="fw-bold mb-2">Calculated Hipped Geometry</div>

    <div>Requested Front Soffit: {Math.round(hippedGeom.requestedFrontSoffitMM || 0)} mm</div>
    <div>Effective Front Soffit: {Math.round(hippedGeom.effectiveFrontSoffitMM || 0)} mm</div>
    <hr />

<div className="fw-bold">
  Finished Fascia Validation
</div>

<div>
  <b>Front Plumb Cut:</b>{" "}
  {Math.round(
    hippedGeom.frontPlumbCutHeightMM || 0
  )} mm
</div>

<div>
  <b>Front Finished Fascia Height:</b>{" "}
  {Math.round(
    hippedGeom.frontFinishedFasciaHeightMM || 0
  )} mm
</div>

<div>
  <b>Front Fascia Order Size:</b>{" "}
  {Math.round(
    hippedGeom.frontFasciaOrderSizeMM || 0
  )} mm
</div>

<div style={{ marginTop: 8 }}>
  <b>Common Roof Fascia:</b>{" "}
  {Math.round(
    hippedGeom.commonFasciaOrderSizeMM || 0
  )} mm
</div>

<div>
  <b>Common Fascia Set From Front:</b>{" "}
  {hippedGeom.fasciaOrderSizesMatch
    ? "Yes"
    : "No"}
</div>
{hippedGeom.leftSideRingBeam?.exists && (
  <>
    <div style={{ marginTop: 8 }}>
      <b>Left Side Plumb Cut:</b>{" "}
      {Math.round(
        hippedGeom.leftPlumbCutHeightMM || 0
      )} mm
    </div>
<div>
  <b>Left Solver Soffit:</b>{" "}
  {Math.round(
    hippedGeom.leftPlumbCutMatchedSoffitMM || 0
  )} mm
</div>

<div>
  <b>Left Solver Plumb Cut:</b>{" "}
  {Math.round(
    hippedGeom.leftMatchedPlumbCutHeightMM || 0
  )} mm
</div>

<div>
  <b>Left Solver Difference:</b>{" "}
  {Number(
    hippedGeom.leftPlumbCutDifferenceMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Left Mitre Trim Allowance:</b>{" "}
  {Number(
    hippedGeom.leftMitreTrimAllowanceMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Left Raw Manufactured Soffit:</b>{" "}
  {Number(
    hippedGeom.leftRawManufacturedSoffitMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Left Rounded Manufactured Soffit:</b>{" "}
  {Math.round(
    hippedGeom.leftRoundedManufacturedSoffitMM || 0
  )} mm
</div>
    <div>
      <b>Left Finished Fascia Height:</b>{" "}
      {Math.round(
        hippedGeom.leftFinishedFasciaHeightMM || 0
      )} mm
    </div>

    <div>
      <b>Left Fascia Order Size:</b>{" "}
      {Math.round(
        hippedGeom.leftFasciaOrderSizeMM || 0
      )} mm
    </div>

  </>
)}

{hippedGeom.rightSideRingBeam?.exists && (
  <>
    <div style={{ marginTop: 8 }}>
      <b>Right Side Plumb Cut:</b>{" "}
      {Math.round(
        hippedGeom.rightPlumbCutHeightMM || 0
      )} mm
    </div>
<div>
  <b>Right Solver Soffit:</b>{" "}
  {Math.round(
    hippedGeom.rightPlumbCutMatchedSoffitMM || 0
  )} mm
</div>

<div>
  <b>Right Solver Plumb Cut:</b>{" "}
  {Math.round(
    hippedGeom.rightMatchedPlumbCutHeightMM || 0
  )} mm
</div>

<div>
  <b>Right Solver Difference:</b>{" "}
  {Number(
    hippedGeom.rightPlumbCutDifferenceMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Right Mitre Trim Allowance:</b>{" "}
  {Number(
    hippedGeom.rightMitreTrimAllowanceMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Right Raw Manufactured Soffit:</b>{" "}
  {Number(
    hippedGeom.rightRawManufacturedSoffitMM || 0
  ).toFixed(2)} mm
</div>

<div>
  <b>Right Rounded Manufactured Soffit:</b>{" "}
  {Math.round(
    hippedGeom.rightRoundedManufacturedSoffitMM || 0
  )} mm
</div>

<hr />

<div className="fw-bold">
  Universal Facet Eaves Solver
</div>

<div>
  <b>Reference Soffit:</b>{" "}
  {Math.round(
    hippedGeom.facetEavesReferenceSoffitMM || 0
  )} mm
</div>

<div>
  <b>Common Plumb Cut:</b>{" "}
  {Math.round(
    hippedGeom.facetEavesCommonPlumbCutMM || 0
  )} mm
</div>

<div>
  <b>Common Finished Fascia Height:</b>{" "}
  {Math.round(
    hippedGeom.facetEavesCommonFasciaHeightMM || 0
  )} mm
</div>

<div>
  <b>Common Fascia Order Size:</b>{" "}
  {Math.round(
    hippedGeom.facetEavesCommonFasciaOrderSizeMM || 0
  )} mm
</div>

{hippedGeom.leftSideRingBeam?.exists && (
  <>
    <div style={{ marginTop: 8 }}>
      <b>Left Matched Soffit:</b>{" "}
      {Number(
        hippedGeom.facetEavesLeftMatchedSoffitMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Left Mitre Trim:</b>{" "}
      {Number(
        hippedGeom.facetEavesLeftMitreTrimMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Left Raw Manufactured Soffit:</b>{" "}
      {Number(
        hippedGeom.facetEavesLeftRawManufacturedSoffitMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Left Manufactured Soffit:</b>{" "}
      {Math.round(
        hippedGeom.facetEavesLeftManufacturedSoffitMM || 0
      )} mm
    </div>
  </>
)}

{hippedGeom.rightSideRingBeam?.exists && (
  <>
    <div style={{ marginTop: 8 }}>
      <b>Right Matched Soffit:</b>{" "}
      {Number(
        hippedGeom.facetEavesRightMatchedSoffitMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Right Mitre Trim:</b>{" "}
      {Number(
        hippedGeom.facetEavesRightMitreTrimMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Right Raw Manufactured Soffit:</b>{" "}
      {Number(
        hippedGeom.facetEavesRightRawManufacturedSoffitMM || 0
      ).toFixed(2)} mm
    </div>

    <div>
      <b>Right Manufactured Soffit:</b>{" "}
      {Math.round(
        hippedGeom.facetEavesRightManufacturedSoffitMM || 0
      )} mm
    </div>
  </>
)}
    <div>
      <b>Right Finished Fascia Height:</b>{" "}
      {Math.round(
        hippedGeom.rightFinishedFasciaHeightMM || 0
      )} mm
    </div>

    <div>
      <b>Right Fascia Order Size:</b>{" "}
      {Math.round(
        hippedGeom.rightFasciaOrderSizeMM || 0
      )} mm
    </div>

  </>
)}

    <div style={{ marginTop: 10 }}>
  <b>Active Facets:</b> {hippedGeom.facets?.length ?? 0}
</div>

{(hippedGeom.facets || []).map((facet) => (
  <div
    key={facet.id}
    style={{
      marginTop: 8,
      paddingTop: 8,
      borderTop: "1px solid #ddd",
    }}
  >
    <div>
      <b>{facet.label}</b>
    </div>

    <div>
      Internal eaves length:{" "}
      {Math.round(facet.geometry?.internalEavesLengthMM || 0)} mm
    </div>

    <div>
      External eaves length:{" "}
      {Math.round(facet.geometry?.externalEavesLengthMM || 0)} mm
    </div>

    <div>
      Pitch: {Number(facet.geometry?.pitchDeg || 0).toFixed(1)}°
    </div>

    <div>
      Ring-beam length:{" "}
      {Math.round(facet.ringBeam?.lengthMM || 0)} mm
    </div>
  </div>
))}

    {hippedGeom.frontSoffitAutoAdjusted && (
      <div className="text-warning">
        Front soffit adjusted to maintain minimum side soffit.
      </div>
    )}

    {hippedGeom.leftSideRingBeam?.exists && (
      <>
        <hr />
        <div className="fw-bold">Left Side Ring-Beam</div>
        <div>Internal Length: {Math.round(hippedGeom.leftSideRingBeam.internalLengthMM || 0)} mm</div>
        <div>External Length: {Math.round(hippedGeom.leftSideRingBeam.externalLengthMM || 0)} mm</div>
        <div>Side Soffit: {Math.round(hippedGeom.leftSideRingBeam.sideSoffitMM || 0)} mm</div>
      </>
    )}

    {hippedGeom.rightSideRingBeam?.exists && (
      <>
        <hr />
        <div className="fw-bold">Right Side Ring-Beam</div>
        <div>Internal Length: {Math.round(hippedGeom.rightSideRingBeam.internalLengthMM || 0)} mm</div>
        <div>External Length: {Math.round(hippedGeom.rightSideRingBeam.externalLengthMM || 0)} mm</div>
        <div>Side Soffit: {Math.round(hippedGeom.rightSideRingBeam.sideSoffitMM || 0)} mm</div>
      </>
    )}
  </div>
<div style={{ marginTop: 12 }}>
  <b>Facet Ring-beam Materials</b>
</div>

{(hippedGeom.facets || []).map((facet) => (
  <div
    key={`${facet.id}-ringbeam-materials`}
    style={{
      marginTop: 8,
      paddingTop: 8,
      borderTop: "1px solid #ddd",
    }}
  >
    <div>
      <b>{facet.label}</b>
    </div>

    <div>
      Ring-beam length:{" "}
      {Math.round(facet.ringBeam?.lengthMM || 0)} mm
    </div>

    <div>
      Upstands: {facet.ringBeam?.upstandCount || 0}
    </div>

    <div>
      Bay widths:{" "}
      {(facet.ringBeam?.bayWidthsMM || [])
        .map((width) => Math.round(width))
        .join(", ")}{" "}
      mm
    </div>

    <div>
      9 mm ply base:{" "}
      {Number(
        facet.ringBeam?.materials?.ply9BaseAreaM2 || 0
      ).toFixed(3)}{" "}
      m²
    </div>

    <div>
      9 mm ply upstands:{" "}
      {Number(
        facet.ringBeam?.materials?.ply9UpstandAreaM2 || 0
      ).toFixed(3)}{" "}
      m²
    </div>

    <div>
      30×90 PSE:{" "}
      {Number(
        facet.ringBeam?.materials?.pse30x90LengthM || 0
      ).toFixed(3)}{" "}
      m
    </div>

    <div>
      Outer 25×50 lath:{" "}
      {Number(
        facet.ringBeam?.materials
          ?.outerFixingLath25x50LengthM || 0
      ).toFixed(3)}{" "}
      m
    </div>

    <div>
      Finishing 25×50 lath:{" "}
      {Number(
        facet.ringBeam?.materials
          ?.finishingLath25x50LengthM || 0
      ).toFixed(3)}{" "}
      m
    </div>

    <div>
      50 mm PIR:{" "}
      {Number(
        facet.ringBeam?.materials?.pir50AreaM2 || 0
      ).toFixed(3)}{" "}
      m²
    </div>
  </div>
))}
    <div>
      <b>Left Hip</b>: {leftHipWidthMM} mm ·
      <b> Right Hip</b>: {rightHipWidthMM} mm ·
      <b> Left Pitch</b>: {round(leftSidePitchDeg, 1)}° ·
      <b> Right Pitch</b>: {round(rightSidePitchDeg, 1)}°
    </div>
    <div>
  <b>Left Hip Pitch</b>: {Number(hippedGeom?.leftHipPitchDeg ?? 0).toFixed(1)}° ·{" "}
  <b>Right Hip Pitch</b>: {Number(hippedGeom?.rightHipPitchDeg ?? 0).toFixed(1)}°
</div>
<div>
  <b>Left Hip Theoretical</b>: {round(hippedGeom.leftHipTrueLengthMM)} mm ·
  <b> Right Hip Theoretical</b>: {round(hippedGeom.rightHipTrueLengthMM)} mm
</div>

<div>
  <b>Left Hip Cut Length</b>: {round(hippedGeom.leftHipManufacturingLengthMM)} mm ·
  <b> Right Hip Cut Length</b>: {round(hippedGeom.rightHipManufacturingLengthMM)} mm
</div>

<div>
  <b>Left Timberlite Hip Cut</b>: {Math.round(hippedGeom?.leftHipTimberliteCutLengthMM ?? 0)} mm ·{" "}
  <b>Right Timberlite Hip Cut</b>: {Math.round(hippedGeom?.rightHipTimberliteCutLengthMM ?? 0)} mm
</div>

<div>
  <b>Pitch-based Hip Cut</b>: {Math.round(hippedGeom?.leftHipPitchBasedCutMM ?? 0)} mm
</div>

<div>
  <b>Hip Manufacture Test</b>:{" "}
  {Math.round(hippedGeom?.leftHipManufactureTest?.pitchBasedTimberliteCutMM ?? 0)} mm
</div>

<div>
  <b>External Edge Cut Length</b>:{" "}
  {Math.round(hippedGeom?.leftHipExternalEdgeCutLengthMM ?? 0)} mm ·{" "}
  {Math.round(hippedGeom?.rightHipExternalEdgeCutLengthMM ?? 0)} mm
</div>
<div>
  <b>Bosses</b>: {hippedGeom.bossQty} ·
  <b> Spar Hooks</b>: {hippedGeom.sparHookQty} ·
  <b> Hip Top Cut</b>: {hippedGeom.hipTopCutDeg}°
</div>

<div>
  <b>Plain Rafter Zone</b>: {round(hippedGeom.plainRafterZoneStartMM)} mm →{" "}
  {round(hippedGeom.plainRafterZoneEndMM)} mm ·
  <b> Width</b>: {round(hippedGeom.plainRafterZoneWidthMM)} mm
</div>

<div>
  <b>Left Jacks</b>: {hippedGeom.leftJackRafterCount} ·
  <b> Plain Rafters</b>: {hippedGeom.plainRafterCount} ·
  <b> Right Jacks</b>: {hippedGeom.rightJackRafterCount}
</div>

<div>
  <b>Top Allowance</b>: {hippedGeom.hipTopCutFaceOffsetMM} mm ·
  <b> Boss/Spar Hook</b>: {hippedGeom.sparHookToBossOffsetMM} mm
</div>
<div>
  <b>Left Boss Position</b>: {round(hippedGeom.leftBossXMM)} mm ·
  <b> Right Boss Position</b>: {round(hippedGeom.rightBossXMM)} mm ·
  <b> Wallplate Between Bosses</b>: {round(hippedGeom.centreWidthMM)} mm
</div>
    {hippedGeom.frontSoffitAutoAdjusted && (
      <div style={{ color: "#b45309" }}>
        ⚠ Front soffit automatically increased to maintain equal fascia sizes.
      </div>
    )}
  </>
)}
{roofStyle === "hippedLeanTo" &&
 !leftHipWidthManual &&
 !rightHipWidthManual && (
  <div style={{ color: "#666", fontSize: 13 }}>
    Default hip position based on projection ÷ 2.
  </div>
)}
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
    <div style={{ color: "#b45309", fontSize: 13 }}>
  Adjustment delta: £{adjustmentDelta.toFixed(2)}
</div>
<div style={{ color: "#6b7280", fontSize: 12 }}>
  Adjustment keys: {Object.keys(summaryAdjustments).join(", ")}
</div>
<div style={{ color: "#6b7280", fontSize: 12 }}>
  Available keys:
  {(totals?.allLines || [])
    .map((r) => r.key)
    .join(", ")}
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
