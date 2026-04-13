// src/pages/LeanToPlanManufacture.js
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

/** ---------------- helpers ---------------- */
const toNum = (v, f = 0) => (v === "" || v == null ? f : Number.isFinite(Number(v)) ? Number(v) : f);
const degToRad = (deg) => (deg * Math.PI) / 180;
const round = (v, dp = 2) => {
  const p = 10 ** dp;
  return Math.round(v * p) / p;
};

function computeRafterSlots(widthMM, { slotWidth = 48, secondCentre = 685, step = 665 } = {}) {
  const W = Math.max(0, Number(widthMM) || 0);
  const slots = [];
  const half = slotWidth / 2;

  if (W <= 0) return { slots, centres: [], bays: [], slotWidth, half };

  // Degenerate: narrower than a slot
  if (W < slotWidth) {
    const left = Math.max(0, (W - slotWidth) / 2);
    const centre = left + half;
    slots.push({ left, right: left + slotWidth, centre, type: "edge-start" });
    return { slots, centres: [centre], bays: [], slotWidth, half };
  }

  // Left edge rafter
  slots.push({ left: 0, right: slotWidth, centre: half, type: "edge-start" });

  // Interior pattern
  if (secondCentre + half <= W) {
    slots.push({ left: secondCentre - half, right: secondCentre + half, centre: secondCentre, type: "centre" });
    for (let c = secondCentre + step; c + half <= W; c += step) {
      slots.push({ left: c - half, right: c + half, centre: c, type: "centre" });
    }
  }

  // Right edge rafter (always)
  const rightLeft = Math.max(0, W - slotWidth);
  slots.push({ left: rightLeft, right: W, centre: W - half, type: "edge-end" });

  const centres = slots.map((s) => s.centre);
  const bays = [];
  for (let i = 0; i < centres.length - 1; i++) bays.push(centres[i + 1] - centres[i]);
  return { slots, centres, bays, slotWidth, half };
}

function computeHangerPositions(extWidthMM) {
  // Hangers: ends + 665 mm centres across the width
  const W = Math.max(0, Number(extWidthMM) || 0);
  const pos = new Set([0]);
  for (let x = 665; x < W; x += 665) pos.add(round(x, 0));
  pos.add(W);
  return Array.from(pos).sort((a, b) => a - b);
}

// 50 mm PIR cradle — just faces & length per face for notes
function computeCradle(rafterCount, A_mm, stripWidthMM = 50) {
  const N = Math.max(rafterCount || 0, 0);
  const endRafters = N >= 1 ? 2 : 0;
  const interiorRafters = Math.max(N - 2, 0);
  let faces = 0;
  if (N >= 2) faces = 2 * N - 2; else if (N === 1) faces = 1;
  return {
    faces,
    interiorRafters,
    endRafters,
    length_per_face_m: (A_mm || 0) / 1000,
    strip_width_mm: stripWidthMM,
  };
}

// 100 mm PIR between rafters — 600 mm strips from 1200×2400 sheets
function computePIR100(A_mm, bayCount, optimizeRemainders = true) {
  const SHEET_W_MM = 1200;
  const SHEET_L_MM = 2400;
  const STRIP_W_MM = 600;
  const SHEET_AREA_M2 = (SHEET_W_MM / 1000) * (SHEET_L_MM / 1000); // 2.88 m²
  const bays = Math.max(bayCount || 0, 0);
  const A = Math.max(0, Number(A_mm) || 0);

  if (bays === 0 || A === 0) {
    return {
      bays, A_mm: A, strips_total: 0, sheets_total: 0,
      area_needed_m2: 0, area_from_sheets_m2: 0,
      plan: { fullSegmentsPerBay: 0, remainder_mm: 0, strips_naive: 0, strips_optimized: 0 },
    };
  }

  const fullSegmentsPerBay = Math.floor(A / SHEET_L_MM);
  const remainder_mm = A - fullSegmentsPerBay * SHEET_L_MM;

  const strips_naive = bays * Math.ceil(A / SHEET_L_MM); // 2.4 m only
  let strips_optimized = strips_naive;
  if (remainder_mm > 0) {
    const pieces_per_remainder_strip = Math.max(1, Math.floor(SHEET_L_MM / remainder_mm));
    const full_total = bays * fullSegmentsPerBay;
    const remainder_strips = Math.ceil(bays / pieces_per_remainder_strip);
    strips_optimized = full_total + remainder_strips;
  } else {
    strips_optimized = bays * fullSegmentsPerBay;
  }

  const strips_total = optimizeRemainders ? strips_optimized : strips_naive;
  const sheets_total = Math.ceil(strips_total / 2);
  const area_needed_m2 = bays * (A / 1000) * (STRIP_W_MM / 1000);
  const area_from_sheets_m2 = sheets_total * SHEET_AREA_M2;

  return {
    bays,
    A_mm: A,
    strips_total,
    sheets_total,
    area_needed_m2,
    area_from_sheets_m2,
    plan: { fullSegmentsPerBay, remainder_mm, strips_naive, strips_optimized },
  };
}

/** ---------------- page component ---------------- */
export default function LeanToPlanManufacture() {
  // Support query string prefill so the configurator can deep-link with current values
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const qp = (k, d) => (params.get(k) ?? d);

  const [inputs, setInputs] = useState({
    customerName: qp("customerName", ""),
    customerRef: qp("customerRef", ""),
    internalWidthMM: qp("internalWidthMM", "3500"),
    internalProjectionMM: qp("internalProjectionMM", "3500"),
    side_frame_thickness_mm: qp("side_frame_thickness_mm", "70"),
    fascia_lip_mm: qp("fascia_lip_mm", "25"),
    soffit_mm: qp("soffit_mm", "150"),
    frame_on_mm: qp("frame_on_mm", "70"),
    pitchDeg: qp("pitchDeg", "15"),
    t_wp_mm: qp("t_wp_mm", "63"),
    t_h_mm: qp("t_h_mm", "2"),
    rafter_depth_mm: qp("rafter_depth_mm", "220"),
    // spacing rules
    slotWidth: qp("slotWidth", "48"),
    secondCentre: qp("secondCentre", "685"), // set 735 here if your shop uses it
    step: qp("step", "665"),
    // manufacture toggles
    optimizePir100Remainders: qp("optimizePir100Remainders", "true") === "true",
  });
  const on = (k) => (e) => setInputs((s) => ({ ...s, [k]: e.target.type === "checkbox" ? !!e.target.checked : e.target.value }));

  const model = useMemo(() => {
    const intW = toNum(inputs.internalWidthMM, 3500);
    const intP = toNum(inputs.internalProjectionMM, 3500);
    const side = toNum(inputs.side_frame_thickness_mm, 70);
    const lip = toNum(inputs.fascia_lip_mm, 25);
    const soff = toNum(inputs.soffit_mm, 150);
    const frame = toNum(inputs.frame_on_mm, 70);
    const pitchDeg = toNum(inputs.pitchDeg, 15);
    const t_wp = toNum(inputs.t_wp_mm, 63);
    const t_h = toNum(inputs.t_h_mm, 2);
    const d = toNum(inputs.rafter_depth_mm, 220);

    const slotWidth = toNum(inputs.slotWidth, 48);
    const secondCentre = toNum(inputs.secondCentre, 685);
    const step = toNum(inputs.step, 665);

    const extW = intW + 2 * (side + lip);
    const extProj = intP + soff + frame;

    const θ = degToRad(pitchDeg);
    const cosθ = Math.cos(θ);
    const tanθ = Math.tan(θ);

    const R_under = intP - t_wp - t_h;       // inner RB face → inside wallplate
    const A_mm = R_under / cosθ;             // underside length
    const R_top = extProj;                   // outer eaves plumb → wall face
    const B_mm = R_top / cosθ;               // top edge length
    const C_mm = 39;                         // eaves underside above frame
    const D_mm = 39 + R_under * tanθ + d * Math.cos(θ);

    const layout = computeRafterSlots(extW, { slotWidth, secondCentre, step });
    const hangers = computeHangerPositions(extW);

    const cradle = computeCradle(layout.slots.length, A_mm, 50);
    const pir100 = computePIR100(A_mm, Math.max(layout.centres.length - 1, 0), inputs.optimizePir100Remainders);

    return {
      intW, intP, side, lip, soff, frame, extW, extProj,
      pitchDeg, t_wp, t_h, rafter_depth_mm: d,
      A_mm, B_mm, C_mm, D_mm,
      slotWidth, secondCentre, step,
      ...layout,
      hangers,
      cradle,
      pir100,
    };
  }, [inputs]);

  /** ---- SVG layout shared for both sections ---- */
  const marginL = 120, marginR = 60, marginT = 80;
  const vbW = Math.max(1, model.extW + marginL + marginR);
  const vbH = 360;
  const x0 = marginL;
  const x1 = marginL + model.extW;
  const y0 = marginT + 110;
  const intStart = x0 + (model.side + model.lip);
  const intEnd = intStart + model.intW;

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto">
      {/* Controls (hidden in print) */}
      <div className="print:hidden flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Plan & Manufacture</h1>
        <div className="flex items-center gap-3">
          <Link to="/quote/lean-to" className="underline">← Back to Configurator</Link>
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded bg-black text-white">Print</button>
        </div>
      </div>

      {/* Inputs (hidden when printing) */}
      <section className="print:hidden rounded-2xl shadow p-4 bg-white mb-4">
        <h2 className="text-lg font-semibold mb-3">Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1">Customer name
            <input className="border rounded px-2 py-1.5" value={inputs.customerName} onChange={on("customerName")} />
          </label>
          <label className="flex flex-col gap-1">Customer ref
            <input className="border rounded px-2 py-1.5" value={inputs.customerRef} onChange={on("customerRef")} />
          </label>
          <div className="hidden sm:block" />
          <label className="flex flex-col gap-1">Internal width (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.internalWidthMM} onChange={on("internalWidthMM")} />
          </label>
          <label className="flex flex-col gap-1">Internal projection (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.internalProjectionMM} onChange={on("internalProjectionMM")} />
          </label>
          <label className="flex flex-col gap-1">Pitch (°)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.pitchDeg} onChange={on("pitchDeg")} />
          </label>
          <label className="flex flex-col gap-1">Soffit (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.soffit_mm} onChange={on("soffit_mm")} />
          </label>
          <label className="flex flex-col gap-1">Frame-on (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.frame_on_mm} onChange={on("frame_on_mm")} />
          </label>
          <label className="flex flex-col gap-1">Side frame (per side, mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.side_frame_thickness_mm} onChange={on("side_frame_thickness_mm")} />
          </label>
          <label className="flex flex-col gap-1">Fascia lip (per side, mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.fascia_lip_mm} onChange={on("fascia_lip_mm")} />
          </label>
          <label className="flex flex-col gap-1">Wallplate t_wp (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.t_wp_mm} onChange={on("t_wp_mm")} />
          </label>
          <label className="flex flex-col gap-1">Hanger allowance t_h (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.t_h_mm} onChange={on("t_h_mm")} />
          </label>
          <label className="flex flex-col gap-1">Rafter depth d (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.rafter_depth_mm} onChange={on("rafter_depth_mm")} />
          </label>

          <div className="col-span-full border-t my-1" />

          <label className="flex flex-col gap-1">Second rafter centre (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.secondCentre} onChange={on("secondCentre")} />
          </label>
          <label className="flex flex-col gap-1">Standard centres (mm)
            <input className="border rounded px-2 py-1.5" type="number" value={inputs.step} onChange={on("step")} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={inputs.optimizePir100Remainders} onChange={on("optimizePir100Remainders")} />
            Optimise PIR100 remainder cuts
          </label>
        </div>
      </section>

      {/* ---------- PAGE 1: PLAN (customer) ---------- */}
      <section className="rounded-2xl shadow p-4 bg-white">
        <div className="flex flex-wrap items-end justify-between mb-3">
          <div className="text-sm">
            <div className="text-xl font-semibold">Plan Diagram</div>
            <div>Customer: <b>{inputs.customerName || "—"}</b> · Ref: <b>{inputs.customerRef || "—"}</b></div>
          </div>
          <div className="text-right text-sm">
            <div>Ext width: <b>{Math.round(model.extW)} mm</b> · Int width: <b>{Math.round(model.intW)} mm</b></div>
            <div>Pitch: <b>{model.pitchDeg}°</b></div>
          </div>
        </div>

        <div className="w-full overflow-auto border rounded">
          <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-[360px]">
            {/* Baseline */}
            <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="#111" strokeWidth="2" />
            {/* External dim */}
            <line x1={x0} y1={y0 - 60} x2={x0} y2={y0 + 12} stroke="#111" strokeWidth="1.5" />
            <line x1={x1} y1={y0 - 60} x2={x1} y2={y0 + 12} stroke="#111" strokeWidth="1.5" />
            <line x1={x0} y1={y0 - 50} x2={x1} y2={y0 - 50} stroke="#111" strokeWidth="1" />
            <text x={(x0 + x1) / 2} y={y0 - 55} textAnchor="middle" fontSize="12">{Math.round(model.extW)} mm ext</text>

            {/* Internal dim */}
            <line x1={intStart} y1={y0 + 12} x2={intStart} y2={y0 + 62} stroke="#666" strokeWidth="1.5" />
            <line x1={intEnd}   y1={y0 + 12} x2={intEnd}   y2={y0 + 62} stroke="#666" strokeWidth="1.5" />
            <line x1={intStart} y1={y0 + 52} x2={intEnd}   y2={y0 + 52} stroke="#666" strokeWidth="1" />
            <text x={(intStart + intEnd) / 2} y={y0 + 47} textAnchor="middle" fontSize="12" fill="#444">
              {Math.round(model.intW)} mm int
            </text>

            {/* Pitch note */}
            <text x={x0} y={y0 - 75} fontSize="12">Pitch = {model.pitchDeg}°</text>

            {/* Rafters and bay labels (clean) */}
            {model.slots.map((s, i) => {
              const cx = x0 + s.centre;
              return (
                <g key={i}>
                  <rect x={x0 + s.left} y={y0 - 32} width={s.right - s.left} height={64} fill={s.type.includes("edge") ? "#f59e0b" : "#0ea5e9"} opacity="0.85" />
                  <line x1={cx} y1={y0 - 36} x2={cx} y2={y0 - 50} stroke="#333" strokeWidth="1" />
                  <text x={cx} y={y0 - 55} textAnchor="middle" fontSize="11" fill="#333">[{Math.round(s.centre)}]</text>
                </g>
              );
            })}

            {/* Bays: <width> only */}
            {model.bays.map((bw, i) => {
              const c0 = x0 + model.centres[i];
              const c1 = x0 + model.centres[i + 1];
              const mid = (c0 + c1) / 2;
              return (
                <g key={`g${i}`}>
                  <line x1={c0} y1={y0 + 8} x2={c1} y2={y0 + 8} stroke="#999" strokeWidth="1" />
                  <text x={mid} y={y0 + 28} textAnchor="middle" fontSize="12" fill="#444">&lt;{Math.round(bw)}&gt;</text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* PAGE BREAK */}
      <div className="page-break my-4"></div>

      {/* ---------- PAGE 2: MANUFACTURE (factory) ---------- */}
      <section className="rounded-2xl shadow p-4 bg-white">
        <div className="flex flex-wrap items-end justify-between mb-3">
          <div className="text-sm">
            <div className="text-xl font-semibold">Manufacture Sheet</div>
            <div>Customer: <b>{inputs.customerName || "—"}</b> · Ref: <b>{inputs.customerRef || "—"}</b></div>
          </div>
          <div className="text-right text-sm">
            <div>Rafters: <b>{model.centres.length}</b> · Bays: <b>{model.bays.length}</b></div>
            <div>Ext width: <b>{Math.round(model.extW)} mm</b></div>
          </div>
        </div>

        {/* Diagram again, now with P/G labels */}
        <div className="w-full overflow-auto border rounded">
          <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-[360px]">
            <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="#111" strokeWidth="2" />
            <line x1={x0} y1={y0 - 60} x2={x0} y2={y0 + 12} stroke="#111" strokeWidth="1.5" />
            <line x1={x1} y1={y0 - 60} x2={x1} y2={y0 + 12} stroke="#111" strokeWidth="1.5" />
            <line x1={x0} y1={y0 - 50} x2={x1} y2={y0 - 50} stroke="#111" strokeWidth="1" />
            <text x={(x0 + x1) / 2} y={y0 - 55} textAnchor="middle" fontSize="12">{Math.round(model.extW)} mm ext</text>

            {model.slots.map((s, i) => {
              const cx = x0 + s.centre;
              return (
                <g key={i}>
                  <rect x={x0 + s.left} y={y0 - 32} width={s.right - s.left} height={64} fill={s.type.includes("edge") ? "#f59e0b" : "#0ea5e9"} opacity="0.9" />
                  <line x1={cx} y1={y0 - 36} x2={cx} y2={y0 - 50} stroke="#333" strokeWidth="1" />
                  <text x={cx} y={y0 - 55} textAnchor="middle" fontSize="11" fill="#333">[{Math.round(s.centre)}]</text>
                  <text x={cx} y={y0 + 22} textAnchor="middle" fontSize="12" fontWeight="600">P{i + 1}</text>
                </g>
              );
            })}
            {model.bays.map((bw, i) => {
              const c0 = x0 + model.centres[i];
              const c1 = x0 + model.centres[i + 1];
              const mid = (c0 + c1) / 2;
              return (
                <g key={`g${i}`}>
                  <line x1={c0} y1={y0 + 8} x2={c1} y2={y0 + 8} stroke="#999" strokeWidth="1" />
                  <text x={mid} y={y0 + 28} textAnchor="middle" fontSize="12" fill="#444">&lt;{Math.round(bw)}&gt;</text>
                  <text x={mid} y={y0 + 44} textAnchor="middle" fontSize="11" fill="#666">G{i + 1}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Details */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded border p-3">
            <div className="font-semibold mb-1">Geometry</div>
            <ul className="space-y-1">
              <li>A underside = <b>{round(model.A_mm)} mm</b></li>
              <li>B top-edge = <b>{round(model.B_mm)} mm</b></li>
              <li>C eaves underside above frame = <b>{model.C_mm} mm</b></li>
              <li>D finished height at wall (TOP rafter) = <b>{round(model.D_mm)} mm</b></li>
              <li>Plumb cut @ wall: <b>{model.pitchDeg}°</b> from vertical</li>
            </ul>
          </div>

          <div className="rounded border p-3">
            <div className="font-semibold mb-1">Rafters & Bays</div>
            <div>Rafters: <b>{model.centres.length}</b> · Bays: <b>{model.bays.length}</b></div>
            <div className="mt-1">Centres (mm):</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {model.centres.map((c, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-[12px]">[{Math.round(c)}]</span>
              ))}
            </div>
            <div className="mt-2">Bays (mm):</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {model.bays.map((b, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-[12px]">&lt;{Math.round(b)}&gt;</span>
              ))}
            </div>
          </div>

          <div className="rounded border p-3">
            <div className="font-semibold mb-1">Hangers</div>
            <div>Ends + 665 mm centres</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {model.hangers.map((h, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-[12px]">[{Math.round(h)}]</span>
              ))}
            </div>
            <div className="mt-1">Total hangers: <b>{model.hangers.length}</b></div>
          </div>

          <div className="rounded border p-3">
            <div className="font-semibold mb-1">PIR — cradle (50 mm)</div>
            <ul className="space-y-1">
              <li>Rafters: <b>{model.centres.length}</b></li>
              <li>Faces: <b>{model.cradle.faces}</b> (ends single, interiors double)</li>
              <li>Length per face: <b>{round(model.cradle.length_per_face_m, 3)} m</b></li>
              <li>Strip width: <b>{model.cradle.strip_width_mm} mm</b></li>
            </ul>
          </div>

          <div className="rounded border p-3 md:col-span-2">
            <div className="font-semibold mb-1">PIR — 100 mm between rafters</div>
            <div>Bays: <b>{model.pir100.bays}</b> · A per bay: <b>{round(model.pir100.A_mm)} mm</b> · Optimisation: <b>{inputs.optimizePir100Remainders ? "On" : "Off"}</b></div>
            <div className="mt-1">Plan per bay: <b>{model.pir100.plan.fullSegmentsPerBay}</b> × 2400 + remainder <b>{round(model.pir100.plan.remainder_mm)} mm</b></div>
            <div className="mt-1">Strips total: <b>{model.pir100.strips_total}</b> (naive {model.pir100.plan.strips_naive}, optimised {model.pir100.plan.strips_optimized})</div>
            <div className="mt-1">Sheets (1200×2400): <b>{model.pir100.sheets_total}</b> · Area needed: <b>{round(model.pir100.area_needed_m2, 2)} m²</b> · From sheets: <b>{round(model.pir100.area_from_sheets_m2, 2)} m²</b></div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-600">
          Notes: left/right edge rafters are fixed; 2nd centre at {model.secondCentre} mm then {model.step} mm centres. Adjust spacing to match factory standards.
        </div>
      </section>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .page-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
