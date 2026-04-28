
// src/pages/Summary.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getMaterials } from "../lib/materials";
import { computeTilesLathsBOM } from "../lib/tilesLathsCalc";
import { computeLiteSlateLeanTo } from "../lib/Calculations/liteslateCalc";
import { computeFasciaSoffitLeanTo } from "../lib/Calculations/fasciaSoffitCalc";
import { computeEdgeTrimsLeanTo } from "../lib/Calculations/edgeTrimsCalc";
import { computeGuttersLeanTo } from "../lib/Calculations/guttersCalc";
import { computeMiscLeanTo } from "../lib/Calculations/miscCalc";
import NavTabs from "../components/NavTabs"; 
import { computePricing } from "../lib/pricing";    // 👈 NEW
import { computeTotalWeightKg } from "../lib/utils/weights";
import { buildLeanToTotals } from "../lib/leanToTotals";

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
  const m = getMaterials();

  const [ex, setEx] = useState(loadExclusions());

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
    Number(inputs.soffit_mm) ||
    Number(inputs.eaves_overhang_mm) ||
    150;

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
  const eavesOverhangMM      = Number(inputs.eaves_overhang_mm ?? inputs.soffit_mm ?? 150);
  const frameOnMM            = Number(inputs.frame_on_mm ?? 70);
  const thetaRad             = (pitchDeg * Math.PI) / 180 || 0;
  const timberExtProjectionMM= ip + eavesOverhangMM + frameOnMM;
  const timberRafterLenMM    = timberExtProjectionMM / (Math.cos(thetaRad) || 1);


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
  // We already have extWidthMM from the Steico / timber sizing block
  const extWidthPlyM = extWidthMM / 1000; // external width in metres

  // Visible soffit height: 150 mm over frame + 70 mm frame
  const soffitVisibleHeightMM =
    Number(inputs.soffit_mm ?? inputs.eaves_overhang_mm ?? 150) + 70;

  // 1) Ring-beam soffit strip (front run)
  const soffitStrip_m2 = extWidthPlyM * (soffitVisibleHeightMM / 1000);

  // 2) Wallplate full-face strip (220 mm high along external width)
  const wallplateFaceHeightMM = 220;
  const wallplateFace_m2 =
    extWidthPlyM * (wallplateFaceHeightMM / 1000);

  // 3) Ring-beam upstand “strips” (195 mm high along front run)
  const ringBeamUpstandHeightMM = 195;
  const ringBeamUpstands_m2 =
    extWidthPlyM * (ringBeamUpstandHeightMM / 1000);

  // Total 9 mm ply area used
  const totalPly9_m2 =
    soffitStrip_m2 + wallplateFace_m2 + ringBeamUpstands_m2;

  // 9 mm ply pricing/weight from materials
  const ply9PricePerM2 = Number(m.ply9mm?.price_per_m2 ?? 0);
  const ply9WeightPerM2 = Number(m.ply9mm?.weight_kg_per_m2 ?? 0);

  // Sheet size and order quantity (how many sheets to buy)
  const ply9SheetLenM = Number(m.ply9mm?.sheet_len_m ?? 2.4);
  const ply9SheetWidthM = Number(m.ply9mm?.sheet_width_m ?? 1.2);
  const ply9SheetAreaM2 = ply9SheetLenM * ply9SheetWidthM || 0;

  const ply9OrderQty =
    ply9SheetAreaM2 > 0
      ? Math.ceil(totalPly9_m2 / ply9SheetAreaM2)
      : 0;

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

const joistHangerPriceEach = Number(m.joist_hanger_price_each ?? 0);

const joistHangerWeightEach = Number(
  m.joist_hanger_weight_kg_each ?? m.metal?.joist_hanger?.weight_kg_each ?? 0
);


// Quantity logic (watercourse on wall abutment sides)
// If both sides are walls → 2, if one wall → 1
const watercourseQty =
  needsWatercourse ? (leftIsWall && rightIsWall ? 2 : 1) : 0;
// Tile starter (always)
const tileStarterQty = 1;
const tileStarterPriceEach = Number(m.tile_starter_price_each ?? m.metal?.tile_starter?.price_each ?? 0);
const tileStarterWeightEach = Number(m.tile_starter_weight_kg_each ?? m.metal?.tile_starter?.weight_kg_each ?? 0);

const metalManualLines = [
  {
  key: "tile_starter",
  label: "Tile starter (3.0 m length)",
  qty: tileStarterQty,
  units: "Lengths",
  order_qty: tileStarterQty,
  weight_kg: Number((tileStarterQty * tileStarterWeightEach).toFixed(2)),
  line: Number((tileStarterQty * tileStarterPriceEach).toFixed(2)),
},

  // Watercourse (only if needed)
  ...(watercourseQty > 0
    ? [
        {
          key: "watercourse",
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


  // ---------- recompute BOMs (same calculators used elsewhere) ----------

const tilesBom = (() => {
  try {
    const run = typeof extWidthMM === "number" ? extWidthMM : iw;
    const proj = typeof extProjectionMM === "number" ? extProjectionMM : ip;

    // Work out exposed sides in a tolerant way (snake_case or camelCase)
    const leftExposed =
      (typeof inputs.left_exposed === "boolean"
        ? inputs.left_exposed
        : inputs.leftExposed) ?? false;

    const rightExposed =
      (typeof inputs.right_exposed === "boolean"
        ? inputs.right_exposed
        : inputs.rightExposed) ?? false;

    // Build base inputs for Britmet-style calculator
    const baseInputs = {
      ...inputs,
      run_mm: run,
      projection_mm: proj,
      pitch_deg: pitchDeg,
      tileSystem,
    };

    // Normalise side exposure for Britmet (computeTilesLathsBOM)
    baseInputs.leftSide = leftExposed ? "exposed" : "wall";
    baseInputs.rightSide = rightExposed ? "exposed" : "wall";

    // Map cover_w → cover_width_mm if present
    if (typeof inputs.cover_w === "number") {
      baseInputs.cover_width_mm = inputs.cover_w;
    }

    // Compute a sensible slope if we don't have one already (for LiteSlate)
    const thetaRad = (pitchDeg * Math.PI) / 180 || 0;
    const slopeFromGeom =
      thetaRad && proj > 0 ? proj / Math.cos(thetaRad) : 0;

    const slopeForLiteSlate =
      inputs.slope_mm ?? inputs.slopeMM ?? slopeFromGeom;

    // ---------- LiteSlate path ----------
    if (
      tileSystem === "liteslate" &&
      typeof computeLiteSlateLeanTo === "function"
    ) {
      return computeLiteSlateLeanTo(
        {
          run_mm: run,
          projection_mm: proj,
          slope_mm: slopeForLiteSlate,
          pitch_deg: pitchDeg,
          waste_pct: inputs.waste_pct,
          colour: inputs.tileColour || inputs.colour || "Slate",

          left_exposed: leftExposed,
          right_exposed: rightExposed,
        },
        m
      );
    }

    // ---------- LiteSlate vs Britmet ----------
if (tileSystem === "liteslate" && typeof computeLiteSlateLeanTo === "function") {
  return computeLiteSlateLeanTo(
    {
      run_mm: baseInputs.run_mm,
      projection_mm: baseInputs.projection_mm,
      slope_mm: baseInputs.slope_mm,
      pitch_deg: baseInputs.pitch_deg,
      waste_pct: baseInputs.waste_pct,
      leftSide: baseInputs.leftSide,
      rightSide: baseInputs.rightSide,
      // include colour if you store it
      colour: tileColour || "Slate",
    },
    m
  );
}

// Britmet fallback
delete baseInputs.projection_mm;
return computeTilesLathsBOM(baseInputs, m);

  } catch (e) {
    return { lines: [], derived: {}, grand: 0 };
  }
})();

    const plastics = (() => {
  try {
    // Use EXTERNAL geometry if available, otherwise internal iw/ip
    const run = Number(
      typeof extWidthMM === "number" ? extWidthMM : iw || 0
    );
    const proj = Number(
      typeof extProjectionMM === "number" ? extProjectionMM : ip || 0
    );

    // Work out exposed sides in a tolerant way (snake_case or camelCase)
    const leftExposed =
      (typeof inputs.left_exposed === "boolean"
        ? inputs.left_exposed
        : inputs.leftExposed) ?? false;

    const rightExposed =
      (typeof inputs.right_exposed === "boolean"
        ? inputs.right_exposed
        : inputs.rightExposed) ?? false;

    // ✅ TRUE plastics "finish" (white vs foiled) coming from inputs JSON
    // Your example JSON had: "plastics_finish": "white"
    const finish =
      (inputs.plastics_finish || "").toString().toLowerCase() ||
      (inputs.finish || "").toString().toLowerCase() ||
      "white";

    // ✅ Pretty colour name for labels (Rosewood / White etc.)
    const displayColour =
      inputs.plastics_color ||
      inputs.plasticsColour ||
      (finish === "white" ? "White" : "Foiled");

    const baseInputs = {
      ...inputs,
      run_mm: run,
      projection_mm: proj,
      pitch_deg: pitchDeg,

      // soffit request – try a few candidate keys
      soffit_requested_mm:
        inputs.soffit_requested_mm ??
        inputs.soffit_mm ??
        inputs.soffit ??
        0,

      // ✅ FORCE finish for fasciaSoffitCalc
      finish,
      plastics_finish: finish,
      plastics_color: displayColour,

      vent_method: inputs.vent_method || "factory",

      left_exposed: leftExposed,
      right_exposed: rightExposed,
    };

    return computeFasciaSoffitLeanTo(baseInputs, m);
  } catch (e) {
    return { lines: [], grand: 0 };
  }
})();


    const edgeTrims = (() => {
  try {
    // Prefer external geometry if available, fall back to internal
    const run = Number(
      typeof extWidthMM === "number" ? extWidthMM : iw || 0
    );
    const proj = Number(
      typeof extProjectionMM === "number" ? extProjectionMM : ip || 0
    );

    // Exposed sides – same tolerance pattern we used elsewhere
    const leftExposed =
      (typeof inputs.left_exposed === "boolean"
        ? inputs.left_exposed
        : inputs.leftExposed) ?? false;

    const rightExposed =
      (typeof inputs.right_exposed === "boolean"
        ? inputs.right_exposed
        : inputs.rightExposed) ?? false;

    // edgeTrimsCalc wants "exposed" | "wall"
    const leftSide = inputs.leftSide || (leftExposed ? "exposed" : "wall");
    const rightSide = inputs.rightSide || (rightExposed ? "exposed" : "wall");

    const baseInputs = {
      ...inputs,
      // 🔹 what edgeTrimsCalc actually expects:
      ext_width_mm: run,
      ext_projection_mm: proj,
      leftSide,
      rightSide,

      // keep finish in sync with uPVC colour
      finish: inputs.finish || inputs.uPVCColour || "white",
    };

    return computeEdgeTrimsLeanTo(baseInputs, m);
  } catch (e) {
    return { lines: [], grand: 0 };
  }
})();

  const gutters = (() => {
  try {
    // Prefer external run (like Idiot List / LeanToLanding),
    // fall back to internal width if needed
    const run =
      typeof extWidthMM === "number" && extWidthMM > 0
        ? extWidthMM
        : iw;

    const profile =
      inputs.gutter_profile ||
      inputs.gutterProfile ||
      "square";

    const outlet =
      inputs.gutter_outlet ||
      inputs.gutterOutlet ||
      "left";

    const color =
      inputs.gutter_color ||
      inputs.gutterColour ||
      inputs.gutterColor ||
      "black";

    return computeGuttersLeanTo(
      {
        run_mm: run,
        profile,
        outlet,
        color,
      },
      m
    );
  } catch (e) {
    return { lines: [], grand: 0 };
  }
})();

const guttersWithWeights = {
  ...gutters,
  lines: (gutters.lines || []).map((l) => {
    // Keep any weight coming from guttersCalc as a fallback
    const existingUnit =
      typeof l.weight_kg_each === "number" ? l.weight_kg_each : 0;

    // Try to get a per-unit weight from materials, keyed by line.key
    const mUnit =
      l.key === "g_len"   ? m.gutter_length_weight_kg :
      l.key === "g_union" ? m.gutter_union_weight_kg :
      l.key === "g_brkt"  ? m.gutter_bracket_weight_kg :
      l.key === "g_outlet"? m.gutter_outlet_weight_kg :
      l.key === "g_stop"  ? m.gutter_stop_end_weight_kg :
      l.key === "dp_len"  ? m.downpipe_length_weight_kg :
      l.key === "dp_bend" ? m.downpipe_bend_weight_kg :
      l.key === "dp_shoe" ? m.downpipe_shoe_weight_kg :
      l.key === "dp_clip" ? m.downpipe_clip_weight_kg :
      l.key === "dp_adapt"? m.downpipe_adaptor_weight_kg :
      undefined;

    // Prefer the materials value if it’s a real positive number, else keep the existing one
    const unitWeight =
      Number.isFinite(mUnit) && mUnit > 0 ? mUnit : existingUnit;

    const qty = Number(l.qty ?? 0);
    const totalWeight =
      qty && unitWeight ? +(qty * unitWeight).toFixed(2) : 0;

    return {
      ...l,
      // per-unit weight (used by asUnitWeightKg if needed)
      weight_kg_each: unitWeight,
      // total line weight (used by lineWeightKg's fallback, like timber)
      weight_kg: totalWeight,
    };
  }),
};



  const misc = (() => {
    
    try {
      // Try to get tile total hint if tilesBom has it
      const tilesLine =
        (tilesBom?.lines || []).find((r) =>
          /tiles/i.test(String(r.key || r.label || ""))
        ) || null;

      const hintRaw =
        tilesBom?.derived?.tiles_total ??
        tilesLine?.qty ??
        tilesLine?.qtyDisplay;

      const tiles_total_hint = Number.isFinite(Number(hintRaw))
        ? Number(hintRaw)
        : undefined;

      return computeMiscLeanTo(
  {
    internalWidthMM: iw,
    internalProjectionMM: ip,
    pitchDeg,
    tile_system: tileSystem, // use the key misc expects (LeanToLanding style)
    tiles_total_hint,
  },
  m
);

    } catch {
      return { lines: [], grand: 0 };
    }
  })();

  console.log(
  "SUMMARY misc items:",
  (misc?.items || misc?.lines || []).map((x) => ({
    key: x.key,
    label: x.label,
    total: x.total ?? x.line,
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

  // 1) Base lines from calculators only
const calcLines = [
  ...(tilesBom?.lines || []),
  ...(plastics?.lines || []),
  ...(edgeTrims?.lines || []),
  ...(guttersWithWeights?.lines || gutters.lines || []),

  // ✅ pull misc from either .lines or .items
  ...((misc?.lines || misc?.items || []).map((x) => ({ ...x, _from: "misc" }))),
].map((r) => ({
  ...r,
  _k: `${String(r.key || "").toLowerCase()} ${String(r.label || r.name || "").toLowerCase()}`,
}));

// 2) Only add manual metal lines if that key does NOT already exist in calcLines
const calcKeys = new Set(calcLines.map((r) => String(r.key || "")));

const mergedLines = [
  ...calcLines,
  ...(metalManualLines || []).filter((r) => !calcKeys.has(String(r.key || ""))),
];

// 3) Final baseLines (ensures _k exists for manual lines too)
const baseLines = mergedLines.map((r) => ({
  ...r,
  _k: r._k || `${String(r.key || "").toLowerCase()} ${String(r.label || r.name || "").toLowerCase()}`,
}));

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
const isPlastics = (k) =>
  /(fascia|soffit|vent(?!ilator)|j[_-]?(section|trim))/.test(k);


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



  const isGutter = (k) => /(gutter|^dp_|downpipe)/.test(k);

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
const timberFilteredLines = baseLines.filter((r) => isTimber(r._k));
const timberLines = [...timberManualLines, ...timberFilteredLines];
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

    // Pull safe derived counts out of the BOM (if present)
    const derivedTiles = tilesBom?.derived?.tiles_total;
    const derivedVerge = tilesBom?.derived?.vergePieces;
    const derivedFixings = tilesBom?.derived?.fixingsPacks;
    const derivedTouch = tilesBom?.derived?.touchUpQty;

    // Helper to overwrite qty/qtyDisplay when we have a clean derived value
    const withForcedQty = (row, derivedQty) => {
      const n = Number(derivedQty);
      if (!Number.isFinite(n) || n <= 0) return row;
      return {
        ...row,
        qty: n,
        qtyDisplay: n,
      };
    };

        // ---------- Main tiles row ----------
    if (isMainTilesRow) {
      let row = {
        ...r,
        label: isLiteSlateSystem ? "LiteSlate tiles" : "Britmet tiles",
      };

      // ✅ For Britmet, force qty from derived.tiles_total
      if (!isLiteSlateSystem) {
        row = withForcedQty(row, derivedTiles);
      }

      // ✅ For LiteSlate, just use the qty from the LiteSlate BOM line (ls_tiles)
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

      // For Britmet, force qty from derived.vergePieces
      row = withForcedQty(row, derivedVerge);
      return row;
    }

    // ---------- Fixings & Touch-up ----------
    if (isFixingsRow) {
      // Only Britmet uses these derived values
      if (!isLiteSlateSystem) {
        return withForcedQty(r, derivedFixings);
      }
      return r;
    }

    if (isTouchupRow) {
      if (!isLiteSlateSystem) {
        return withForcedQty(r, derivedTouch);
      }
      return r;
    }

    // Everything else unchanged
    return r;
  });

const plasticsLines = baseLines.filter((r) => isPlastics(r._k));
// Raw metal rows (from calculators + manual)
const metalLinesRaw = [
  ...(baseLines || []).filter((r) => isMetal(r._k)),
  ...(metalManualLines || []),
];

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

  return out;
})();

const gutterLines = baseLines.filter((r) => isGutter(r._k));

// ⚠️ NOTE: Misc items can appear twice (from calculators/BOM + manual rows).
// If that happens, we must dedupe by keeping the row that has price/weight/order_qty (same rule as Metal).

// 1) Manual misc rows (add items here as needed)
const miscManualLines = [
  // Example template (leave commented until we add real items)
  // {
  //   key: "example_misc_item",
  //   label: "Example misc item",
  //   qty: 1,
  //   units: "Ea",
  //   order_qty: 1,
  //   weight_kg: 0,
  //   line: 0,
  // },
];

// 2) Raw misc rows (from calculators/BOM + manual)
const miscLinesRaw = [
  ...(baseLines || []).filter(
    (r) =>
      isMisc(r._k) &&
      !isTimber(r._k) &&
      !isTile(r._k) &&
      !isPlastics(r._k) &&
      !isMetal(r._k) &&
      !isGutter(r._k)
  ),
  ...(miscManualLines || []),
];

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
    const id = String(r.key || r.label || r.name || "").toLowerCase().trim();
    if (!id) return;

    const prev = bestById.get(id);
    if (!prev || score(r) > score(prev)) bestById.set(id, r);
  });

  const seen = new Set();
  const out = [];

  (miscLinesRaw || []).forEach((r) => {
    const id = String(r.key || r.label || r.name || "").toLowerCase().trim();
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

// ---- Patch weights onto misc rows (without touching qty/cost logic) ----
const miscLinesWithWeights = (miscLines || []).map((r) => {
  // If the row already has weight, leave it alone
  const existing = Number(r.weight_kg ?? r.weightKg ?? r.total_weight_kg ?? 0) || 0;
  if (existing > 0) return r;

  // IMPORTANT: build a searchable string that includes key + label + name
  const txt = `${r.key || ""} ${r._k || ""} ${r.label || ""} ${r.name || ""}`.toLowerCase();

  // Choose per-unit weight from Materials (prefer your editable flat keys first)
  const unitWeight = (() => {
    // SuperQuilt: prefer the flat key you edit in Materials, then fallback to options
    if (txt.includes("superquilt")) {
      const SQ12 = (m.superquilt_options || []).find((o) => Number(o.coverage_m2) === 12);
      const SQ15 = (m.superquilt_options || []).find((o) => Number(o.coverage_m2) === 15);

      const opt =
        txt.includes("15") ? SQ15 :
        txt.includes("12") ? SQ12 :
        (SQ12 || SQ15);

      return Number(m.superquilt_roll_weight_kg ?? opt?.weight_kg_per_roll ?? 0);
    }

    // Breather: prefer the flat key you edit in Materials (and fall back to nested)
    if (txt.includes("breather")) {
      return Number(
        m.breather_roll_weight_kg ??
        m.breatherMembrane?.weight_kg_per_roll ??
        0
      );
    }
// 100mm slab insulation (packs)
if (txt.includes("slab100")) return Number(m.slab100_pack_weight_kg ?? 0);


    // Foam (label usually contains Can/Roll even when key doesn't)
    if (txt.includes("expanding") && txt.includes("can"))
      return Number(m.expanding_foam_can_weight_kg_each ?? 0);

    if (txt.includes("expanding") && txt.includes("roll"))
      return Number(m.expanding_foam_roll_weight_kg_each ?? 0);

    // Tapes
    if (txt.includes("aluminium") || txt.includes("alu"))
      return Number(m.aluminium_tape_roll_weight_kg_each ?? 0);

    if (txt.includes("duct"))
      return Number(m.duct_tape_roll_weight_kg_each ?? 0);

    // EPDM
    if (txt.includes("epdm"))
      return Number(m.epdm_rubber_weight_kg_per_m2 ?? 0);

    // Adhesives
    if (txt.includes("deck") && txt.includes("adhesive"))
      return Number(m.deck_adhesive_2_5l_weight_kg_each ?? 0);

    if (txt.includes("bond") && txt.includes("2.5"))
      return Number(m.bond_adhesive_2_5l_weight_kg_each ?? 0);

    if (txt.includes("bond") && txt.includes("can"))
      return Number(m.bond_adhesive_can_weight_kg_each ?? 0);

    // Pins / screws boxes
    if (txt.includes("polytop"))
      return Number(m.polytop_pins_weight_kg_per_box ?? 0);

    if (txt.includes('1"') || txt.includes("1x8") || txt.includes("1×8") || txt.includes("screws_1x8"))
      return Number(m.screws_1x8_weight_kg_per_box ?? 0);

    if (txt.includes('2"') || txt.includes("2x8") || txt.includes("2×8") || txt.includes("screws_2x8"))
      return Number(m.screws_2x8_weight_kg_per_box ?? 0);

    if (txt.includes('3"') || txt.includes("3x10") || txt.includes("3×10") || txt.includes("screws_3x10"))
      return Number(m.screws_3x10_weight_kg_per_box ?? 0);

    if (txt.includes("drywall") && txt.includes("32"))
      return Number(m.drywall_screws_32mm_weight_kg_per_box ?? 0);

    if (txt.includes("drywall") && txt.includes("50"))
      return Number(m.drywall_screws_50mm_weight_kg_per_box ?? 0);

    if (txt.includes("concrete"))
      return Number(m.concrete_screws_weight_kg_per_box ?? 0);

    // (If the unwanted fixings pack row exists, still allow weight)
    if (txt.includes("fixings_pack"))
      return Number(m.fixings_pack_weight_kg_each ?? 0);

    return 0;
  })();

  // Use order_qty when present, else fall back to qty
  const qty = Number(r.order_qty ?? r.orderQty ?? r.qty ?? 0) || 0;
  const totalWeight = qty && unitWeight ? Number((qty * unitWeight).toFixed(2)) : 0;

  return {
    ...r,
    // per-unit weight (used by Summary's normalisers if needed)
    weight_kg_each: unitWeight,
    // total line weight (shown in the Weight column)
    weight_kg: totalWeight,
  };
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
  const plasticsTotals = sectionTotals(plasticsLines, false);
  const metalTotals    = sectionTotals(metalLines, false);
  const gutterTotals   = sectionTotals(gutterLines, false);
  const miscTotals = sectionTotals(miscLinesWithWeights, false);

  
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
        style={excluded ? { opacity: 0.55 } : undefined}
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
            checked={excluded}
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


// ---------- overall totals ----------

const overallCost =
  timberTotals.cost +
  tilesTotals.cost +
  plasticsTotals.cost +
  metalTotals.cost +
  gutterTotals.cost +
  miscTotals.cost;

const overallWeight =
  timberTotals.weight +
  tilesTotals.weight +
  plasticsTotals.weight +
  metalTotals.weight +
  gutterTotals.weight +
  miscTotals.weight;

// Only Timber uses chargeable (waste uplift). Everything else uses base cost.
const materialsCostForPricing =
  timberTotals.chargeableCost +
  tilesTotals.cost +
  plasticsTotals.cost +
  metalTotals.cost +
  gutterTotals.cost +
  miscTotals.cost;

  const {
    materialsCost: pricingMaterialsCost, // should match materialsCostForPricing
    delivery,
    profitPct,
    profit,
    net,
    vatRate,
    vat,
    gross,
    marginPct,
  } = computePricing(materialsCostForPricing, m);


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
<Section title="Plastics Elements" lines={plasticsLines} totals={plasticsTotals} showChargeable={false} />
<Section title="Metal Elements" lines={metalLines} totals={metalTotals} showChargeable={false} />
<Section title="Guttering Elements" lines={gutterLines} totals={gutterTotals} showChargeable={false} />
<Section title="Miscellaneous" lines={miscLinesWithWeights} totals={miscTotals} showChargeable={false} />



            {/* Overall Totals Summary */}
      <div
        style={{
          marginTop: 16,
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
              fontSize: 14,
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
            <b>Delivery:</b>{" "}
            {fmtMoney(delivery)}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Profit markup:</b>{" "}
            {profitPct.toFixed(1)}% → {fmtMoney(profit)}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Net price (before VAT):</b>{" "}
            {fmtMoney(net)}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>VAT ({(vatRate * 100).toFixed(0)}%):</b>{" "}
            {fmtMoney(vat)}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Gross price:</b>{" "}
            {fmtMoney(gross)}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Margin on net (profit / net):</b>{" "}
            {Number.isFinite(marginPct) ? `${marginPct.toFixed(1)}%` : "—"}
          </p>
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
