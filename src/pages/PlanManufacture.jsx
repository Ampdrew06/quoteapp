// src/pages/PlanManufacture.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/** ---------- helpers ---------- */
const num = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};
const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};

// Rafter layout: left edge, second @ 685, then 665 centres, always right edge.
function computeRafterSlots(widthMM, slotWidth = 48, secondCentre = 685, step = 665) {
  const W = Math.max(0, Number(widthMM) || 0);
  const slots = [];
  const half = slotWidth / 2;

  if (W <= 0) return { slots };
  // left edge
  slots.push({ left: 0, right: slotWidth, centre: slotWidth / 2, type: "edge-start" });

  // interior
  if (secondCentre + half <= W) {
    slots.push({ left: secondCentre - half, right: secondCentre + half, centre: secondCentre, type: "centre" });
    for (let c = secondCentre + step; c + half <= W; c += step) {
      slots.push({ left: c - half, right: c + half, centre: c, type: "centre" });
    }
  }

  // right edge
  const rightLeft = Math.max(W - slotWidth, 0);
  slots.push({ left: rightLeft, right: W, centre: W - half, type: "edge-end" });

  return { slots };
}

/** Reads inputs from the query string (sent from the configurator links). */
function useInputsFromQuery() {
  const params = new URLSearchParams(window.location.search);

  const internalWidthMM = num(params.get("internalWidthMM"), 3500);
  const internalProjectionMM = num(params.get("internalProjectionMM"), 3000);

  const side_frame_thickness_mm = num(params.get("side_frame_thickness_mm"), 70);
  const fascia_lip_mm = num(params.get("fascia_lip_mm"), 25);
  const soffit_mm = num(params.get("soffit_mm"), 150);
  const frame_on_mm = num(params.get("frame_on_mm"), 70);

  const pitchDeg = num(params.get("pitchDeg"), 15);
  const t_wp_mm = num(params.get("t_wp_mm"), 63);
  const t_h_mm = num(params.get("t_h_mm"), 2);
  const rafter_depth_mm = num(params.get("rafter_depth_mm"), 220);

  // Roof build-up (perpendicular thicknesses). Defaults are typical.
  const membrane_thk_mm = num(params.get("membrane_thk_mm"), 1);
  const lath_thk_mm = num(params.get("lath_thk_mm"), 25); // 25x50 lath
  const tile_thk_mm = num(params.get("tile_thk_mm"), 15); // tweak per tile profile

  // Derived external sizes (match configurator)
  const extWidthMM = internalWidthMM + 2 * (side_frame_thickness_mm + fascia_lip_mm);
  const extProjectionMM = internalProjectionMM + soffit_mm + frame_on_mm;

  // Angles
  const θ = (pitchDeg * Math.PI) / 180;
  const cosθ = Math.cos(θ);
  const tanθ = Math.tan(θ);

  // Side-view lengths / refs
  const R_under_mm = internalProjectionMM - t_wp_mm - t_h_mm;
  const A_mm = R_under_mm / cosθ; // underside rafter
  const R_top_mm = extProjectionMM;
  const B_mm = R_top_mm / cosθ;   // top edge rafter

  // Eaves underside build-up under the rafter (ply+PSE at eaves)
  const C_mm = 39; // 9 ply + 30 PSE

  // Height to TOP OF RAFTER @ wall, referenced from OUTER eaves plumb
  const eavesTopAboveFrontOuter_mm = C_mm + rafter_depth_mm * cosθ;
  const D_wall_from_outer_mm = eavesTopAboveFrontOuter_mm + R_top_mm * tanθ;

  // Same height referenced from INNER top of frame (adds vertical of frame_on)
  const D_wall_from_inner_mm = D_wall_from_outer_mm + frame_on_mm * tanθ;

  // Finished build-up above rafter → vertical component
  const layer_perp_mm = membrane_thk_mm + lath_thk_mm + tile_thk_mm; // perpendicular to roof
  const layer_vertical_mm = layer_perp_mm * cosθ;                     // vertical component

  // Finished wall height to TOP OF TILES
  const D_tiles_from_outer_mm = D_wall_from_outer_mm + layer_vertical_mm;
  const D_tiles_from_inner_mm = D_wall_from_inner_mm + layer_vertical_mm;

  // (Legacy convenience)
  const D_mm = 39 + R_under_mm * tanθ + rafter_depth_mm * Math.cos(θ);

  return {
    internalWidthMM,
    internalProjectionMM,
    extWidthMM,
    extProjectionMM,
    pitchDeg,
    t_wp_mm,
    t_h_mm,
    rafter_depth_mm,
    membrane_thk_mm,
    lath_thk_mm,
    tile_thk_mm,
    A_mm, B_mm, C_mm, D_mm,
    D_wall_from_outer_mm,
    D_wall_from_inner_mm,
    D_tiles_from_outer_mm,
    D_tiles_from_inner_mm,
  };
}

/** ---------- main page ---------- */
export default function PlanManufacture() {
  const i = useInputsFromQuery();
  const navigate = useNavigate();

  // Rafter layout across external width
  const layout = useMemo(() => computeRafterSlots(i.extWidthMM, 48, 685, 665), [i.extWidthMM]);
  const rafterCount = layout.slots.length;
  const bayCentres = layout.slots
    .filter(s => s.type !== "edge-end" && s.type !== "edge-start")
    .map(s => round(s.centre)); // centres (excludes edges)

  // SVG sizing & scale
  const W = 980;              // px drawing width
  const H = 420;              // px drawing height

  // Margins + label pad so text never clips
  const margin = { t: 60, r: 84, b: 80, l: 84 };
  const labelPad = 14;

  const innerW = W - margin.l - margin.r;
  const innerH = H - margin.t - margin.b;

  const scaleX = innerW / Math.max(i.extWidthMM, 1);
  const scaleY = innerH / Math.max(i.extProjectionMM, 1);

  // Geometry in drawing space
  const ext = { x: margin.l, y: margin.t, w: i.extWidthMM * scaleX, h: i.extProjectionMM * scaleY };
  const int = {
    x: margin.l + ((i.extWidthMM - i.internalWidthMM) / 2) * scaleX,
    y: margin.t + ((i.extProjectionMM - i.internalProjectionMM) / 2) * scaleY,
    w: i.internalWidthMM * scaleX,
    h: i.internalProjectionMM * scaleY,
  };

  // Lines for rafters (full external height)
  const rafterLines = layout.slots.map((s, idx) => {
    const x = ext.x + s.centre * scaleX;
    return { x, idx };
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 12px", fontFamily: "Inter, system-ui, Arial" }}>
      {/* Back */}
      <div className="print:hidden mb-3">
        <button
          onClick={() =>
            window.history.length > 1 ? navigate(-1) : navigate("/quote/lean-to")
          }
          style={{ textDecoration: "underline", background: "none", border: 0, padding: 0, cursor: "pointer" }}
        >
          ← Back
        </button>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Lean-To — Plan & Manufacture</h1>
      <div style={{ color: "#555", marginBottom: 6 }}>
        Internal: <b>{round(i.internalWidthMM)} × {round(i.internalProjectionMM)} mm</b> &nbsp;·&nbsp;
        External (derived): <b>{round(i.extWidthMM)} × {round(i.extProjectionMM)} mm</b> &nbsp;·&nbsp;
        Pitch: <b>{round(i.pitchDeg,1)}°</b>
      </div>

      {/* Finished height to tiles */}
      <div style={{ color: "#333", marginBottom: 12, fontSize: 14 }}>
        Finished wall height to <b>top of tiles</b>:
        {" "}
        <b>{round(i.D_tiles_from_outer_mm)} mm</b>
        <span style={{ color: "#666" }}> (ref: outer/plumb eaves)</span>
        {" · "}
        <b>{round(i.D_tiles_from_inner_mm)} mm</b>
        <span style={{ color: "#666" }}> (ref: inner top of frame)</span>
      </div>

      {/* ---------- PLAN DIAGRAM (SVG) ---------- */}
      <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 8 }}>
        <svg width={W} height={H}>
          {/* Outer area (external) */}
          <rect x={ext.x} y={ext.y} width={ext.w} height={ext.h} fill="#fff" stroke="#111" strokeWidth="2" />

          {/* Wallplate (top) & Ring-beam (bottom) as bold lines */}
          <line x1={ext.x} y1={ext.y} x2={ext.x + ext.w} y2={ext.y} stroke="#111" strokeWidth="5" />
          <line x1={ext.x} y1={ext.y + ext.h} x2={ext.x + ext.w} y2={ext.y + ext.h} stroke="#111" strokeWidth="5" />

          {/* Internal outline (to show the int perimeter) */}
          <rect x={int.x} y={int.y} width={int.w} height={int.h} fill="none" stroke="#888" strokeDasharray="6 6" />

          {/* Rafters */}
          {rafterLines.map(({ x }, idx) => (
            <line
              key={idx}
              x1={x}
              y1={ext.y}
              x2={x}
              y2={ext.y + ext.h}
              stroke="#1f77b4"
              strokeWidth={idx === 0 || idx === rafterLines.length - 1 ? 4 : 3}
            />
          ))}

          {/* ---- DIMENSIONS ---- */}
          {/* Top: internal width */}
          <line
            x1={int.x}
            y1={int.y - 26}
            x2={int.x + int.w}
            y2={int.y - 26}
            stroke="#000"
            strokeWidth="1.5"
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={int.x + int.w / 2}
            y={int.y - 32}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
          >
            {round(i.internalWidthMM)} int
          </text>

          {/* Bottom: external width */}
          <line
            x1={ext.x}
            y1={ext.y + ext.h + 26}
            x2={ext.x + ext.w}
            y2={ext.y + ext.h + 26}
            stroke="#000"
            strokeWidth="1.5"
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={ext.x + ext.w / 2}
            y={ext.y + ext.h + 44}
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
          >
            {round(i.extWidthMM)} ext
          </text>

          {/* Left: external projection (label pulled INSIDE margin) */}
          <line
            x1={ext.x - 26}
            y1={ext.y}
            x2={ext.x - 26}
            y2={ext.y + ext.h}
            stroke="#000"
            strokeWidth="1.5"
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={ext.x + labelPad}
            y={ext.y + ext.h / 2}
            textAnchor="start"
            fontSize="16"
            fontWeight="700"
            dominantBaseline="middle"
          >
            {round(i.extProjectionMM)} ext
          </text>

          {/* Right: internal projection (label pulled INSIDE margin) */}
          <line
            x1={ext.x + ext.w + 26}
            y1={int.y}
            x2={ext.x + ext.w + 26}
            y2={int.y + int.h}
            stroke="#000"
            strokeWidth="1.5"
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={ext.x + ext.w - labelPad}
            y={int.y + int.h / 2}
            textAnchor="end"
            fontSize="16"
            fontWeight="700"
            dominantBaseline="middle"
          >
            {round(i.internalProjectionMM)} int
          </text>

          {/* Centre labels along the bottom (685 / +665 …) */}
          {rafterLines.map(({ x }, idx) => {
            const centre = layout.slots[idx].centre;
            if (idx === 0 || idx === rafterLines.length - 1) return null; // skip edges
            return (
              <text key={`c-${idx}`} x={x} y={ext.y + ext.h + 68} textAnchor="middle" fontSize="14">
                {round(centre)}
              </text>
            );
          })}

          {/* defs for arrowheads */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* ---------- CUT LIST ---------- */}
      <div style={{ marginTop: 18, background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Manufacture — Cut List</h2>
        <ol style={{ paddingLeft: 18, lineHeight: 1.6, fontSize: 15 }}>
          <li><b>Rafters</b>: {rafterCount} pcs — top edge <b>{round(i.B_mm)} mm</b> each (plumb cut {round(90 - i.pitchDeg,1)}° from horizontal).</li>
          <li><b>Wallplate (Steico 220)</b>: length ≈ <b>{round(i.extWidthMM)} mm</b>.</li>
          <li><b>Front ring-beam</b> (PSE 90×30): length ≈ <b>{round(i.extWidthMM)} mm</b>.</li>
          <li><b>50×25 fixing lath</b>: run ≈ <b>{round(i.extWidthMM)} mm</b>.</li>
          <li><b>9 mm ply soffit</b>: width 220 mm × length <b>{round(i.extWidthMM)} mm</b>.</li>
          <li><b>Upstands</b>: {Math.max(rafterCount - 1, 0)} pcs (each ~617 × 195 mm; PIR faces 185 mm tall).</li>
        </ol>

        <div style={{ marginTop: 10, fontSize: 14, color: "#555" }}>
          Spacing pattern: left edge rafter, second centre at <b>685</b> mm, then <b>665</b> mm centres, always a right edge rafter.
          <div style={{ marginTop: 6 }}>Centres (mm): {bayCentres.join(" / ")}</div>
        </div>
      </div>

      <div className="print:hidden" style={{ marginTop: 16 }}>
        <button onClick={() => window.print()} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #bbb", background: "#fff" }}>
          Print
        </button>
      </div>

      {/* Simple print CSS */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
