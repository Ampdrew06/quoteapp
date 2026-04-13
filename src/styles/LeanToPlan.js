// src/components/styles/LeanToPlan.js
import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * LeanToPlan — richer plan diagram (print-friendly)
 * - Reads inputs from query string (so Configurator can pre-fill it)
 * - Shows external & internal width dimension lines
 * - Rafter slots across the run (48 mm each), second at 685 mm, then 665 centres, right-edge rafter always
 * - Lists rafter centres
 * - Header shows customer name & reference if provided
 */

const toNum = (v, f = 0) => (v === "" || v == null ? f : Number.isFinite(Number(v)) ? Number(v) : f);

// Rafter layout rule
function computeRafterSlots(widthMM, { slotWidth = 48, secondCentre = 685, step = 665 } = {}) {
  const slots = [];
  const half = slotWidth / 2;
  const W = Math.max(0, Number(widthMM) || 0);

  if (W <= 0) return { slots, centres: [], slotWidth };

  // If too small for a full slot, centre one visually and bail
  if (W < slotWidth) {
    const left = Math.max(0, (W - slotWidth) / 2);
    slots.push({ left, right: left + slotWidth, centre: left + half, type: "edge-start" });
    return { slots, centres: slots.map((s) => s.centre), slotWidth };
  }

  // Left edge
  slots.push({ left: 0, right: slotWidth, centre: half, type: "edge-start" });

  // Interior (second at 685, then 665 centres)
  if (secondCentre + half <= W) {
    slots.push({ left: secondCentre - half, right: secondCentre + half, centre: secondCentre, type: "centre" });
    for (let c = secondCentre + step; c + half <= W; c += step) {
      slots.push({ left: c - half, right: c + half, centre: c, type: "centre" });
    }
  }

  // Right edge (always)
  const rightLeft = Math.max(0, W - slotWidth);
  slots.push({ left: rightLeft, right: W, centre: W - half, type: "edge-end" });

  return { slots, centres: slots.map((s) => s.centre), slotWidth };
}

export default function LeanToPlan() {
  const [search] = useSearchParams();

  // Inputs (prefer QS, fallback defaults)
  const [inputs] = useState({
    customerName: search.get("customerName") ?? "",
    customerRef: search.get("customerRef") ?? "",
    internalWidthMM: search.get("internalWidthMM") ?? "3500",
    side_frame_thickness_mm: search.get("side_frame_thickness_mm") ?? "70",
    fascia_lip_mm: search.get("fascia_lip_mm") ?? "25",
    // spacing rules (exposed so QS can tweak if ever needed)
    secondCentre: search.get("secondCentre") ?? "685",
    step: search.get("step") ?? "665",
    slotWidth: search.get("slotWidth") ?? "48",
  });

  // Derived external width
  const model = useMemo(() => {
    const internal = toNum(inputs.internalWidthMM);
    const side = toNum(inputs.side_frame_thickness_mm, 70);
    const lip = toNum(inputs.fascia_lip_mm, 25);
    const extWidthMM = internal + 2 * (side + lip);

    const layout = computeRafterSlots(extWidthMM, {
      slotWidth: toNum(inputs.slotWidth, 48),
      secondCentre: toNum(inputs.secondCentre, 685),
      step: toNum(inputs.step, 665),
    });

    return {
      internalWidthMM: internal,
      side,
      lip,
      extWidthMM,
      ...layout,
    };
  }, [inputs]);

  // SVG layout
  const marginL = 120;
  const marginR = 60;
  const marginT = 80;
  const vbH = 320;
  const yBaseline = marginT + 90;

  const vbW = Math.max(1, model.extWidthMM + marginL + marginR);
  const x0 = marginL;
  const x1 = marginL + model.extWidthMM;

  // Internal span inside external
  const intStart = x0 + (model.side + model.lip);
  const intEnd = intStart + model.internalWidthMM;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Lean-To — Plan Diagram</h1>
          {(inputs.customerName || inputs.customerRef) && (
            <div className="text-sm text-gray-600">
              {inputs.customerName && <span>Customer: <b>{inputs.customerName}</b></span>}
              {inputs.customerName && inputs.customerRef ? " · " : ""}
              {inputs.customerRef && <span>Ref: <b>{inputs.customerRef}</b></span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/quote/lean-to" className="underline">← Back to Configurator</Link>
          <Link to="/quote" className="underline">Styles</Link>
        </div>
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
        <div className="rounded-lg bg-gray-50 p-3">External width: <b>{Math.round(model.extWidthMM)} mm</b></div>
        <div className="rounded-lg bg-gray-50 p-3">Internal width: <b>{Math.round(model.internalWidthMM)} mm</b></div>
        <div className="rounded-lg bg-gray-50 p-3">Rafters: <b>{model.centres.length}</b></div>
      </div>

      {/* Diagram */}
      <section className="rounded-2xl shadow p-4 md:p-6 bg-white">
        <h2 className="text-lg font-semibold mb-3">Plan view</h2>
        <div className="w-full overflow-auto border rounded">
          <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-[320px]">
            {/* External baseline */}
            <line x1={x0} y1={yBaseline} x2={x1} y2={yBaseline} stroke="#111" strokeWidth="2" />

            {/* External dimension ticks & label */}
            <line x1={x0} y1={yBaseline - 70} x2={x0} y2={yBaseline + 10} stroke="#111" strokeWidth="1.5" />
            <line x1={x1} y1={yBaseline - 70} x2={x1} y2={yBaseline + 10} stroke="#111" strokeWidth="1.5" />
            <line x1={x0} y1={yBaseline - 60} x2={x1} y2={yBaseline - 60} stroke="#111" strokeWidth="1" />
            <text x={(x0 + x1) / 2} y={yBaseline - 66} textAnchor="middle" fontSize="12">
              External width = {Math.round(model.extWidthMM)} mm
            </text>

            {/* Internal dimension ticks & label */}
            <line x1={intStart} y1={yBaseline + 10} x2={intStart} y2={yBaseline + 70} stroke="#555" strokeWidth="1.5" />
            <line x1={intEnd} y1={yBaseline + 10} x2={intEnd} y2={yBaseline + 70} stroke="#555" strokeWidth="1.5" />
            <line x1={intStart} y1={yBaseline + 60} x2={intEnd} y2={yBaseline + 60} stroke="#555" strokeWidth="1" />
            <text x={(intStart + intEnd) / 2} y={yBaseline + 54} textAnchor="middle" fontSize="12" fill="#444">
              Internal width = {Math.round(model.internalWidthMM)} mm
            </text>

            {/* Side allowances annotations */}
            <text x={x0 + 6} y={yBaseline + 24} fontSize="10" fill="#666">
              side {model.side} + lip {model.lip}
            </text>
            <text x={x1 - 120} y={yBaseline + 24} fontSize="10" fill="#666">
              lip {model.lip} + side {model.side}
            </text>

            {/* Rafters as vertical slots */}
            {model.slots.map((s, i) => (
              <g key={i}>
                <rect
                  x={x0 + s.left}
                  y={yBaseline - 45}
                  width={s.right - s.left}
                  height={90}
                  fill={s.type.includes("edge") ? "#f59e0b" : "#0ea5e9"}
                  opacity="0.9"
                />
                <line x1={x0 + s.centre} y1={yBaseline - 49} x2={x0 + s.centre} y2={yBaseline - 60} stroke="#333" strokeWidth="1" />
                <text x={x0 + s.centre} y={yBaseline - 64} fontSize="10" textAnchor="middle" fill="#333">
                  {Math.round(s.centre)} mm
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Centres list */}
        <div className="mt-3 text-sm">
          <div className="font-medium mb-1">Rafter centres (mm):</div>
          <div className="flex flex-wrap gap-2">
            {model.centres.map((c, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 rounded text-[12px]">
                {Math.round(c)}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
