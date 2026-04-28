// src/pages/TilesLaths.jsx
import React, { useMemo, useState } from "react";
import { getMaterials } from "../lib/materials";
import { computeTilesLathsBOM } from "../lib/Calculations/tilesLathsCalc";
import { computeInternalLining } from "../lib/Calculations/internalCalc";
import { computeFasciaSoffitLeanTo } from "../lib/Calculations/fasciaSoffitCalc";
import { computeEdgeTrimsLeanTo } from "../lib/Calculations/edgeTrimsCalc";
import NavTabs from "../components/NavTabs";

// ---------- helpers ----------
const num = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};

// ---------- read inputs from URL (optional) ----------
function useQueryInputs() {
  const params = new URLSearchParams(window.location.search);

  const internalWidthMM = num(params.get("internalWidthMM"), 3500);
  const internalProjectionMM = num(params.get("internalProjectionMM"), 3000);
  const side_frame_thickness_mm = num(params.get("side_frame_thickness_mm"), 70);
  const fascia_lip_mm = num(params.get("fascia_lip_mm"), 25);
  const soffit_mm = num(params.get("soffit_mm"), 150);
  const frame_on_mm = num(params.get("frame_on_mm"), 70);
  const pitchDeg = num(params.get("pitchDeg"), 15);

  const gauge_mm = num(params.get("gauge_mm"), 250);
  const tile_cover_w_mm = num(params.get("tile_cover_w_mm"), 1231);
  const eaves_overhang_mm = num(params.get("eaves_overhang_mm"), 50);

  const left_verge_exposed = params.get("left_verge_exposed");
  const right_verge_exposed = params.get("right_verge_exposed");

  return {
    internalWidthMM,
    internalProjectionMM,
    side_frame_thickness_mm,
    fascia_lip_mm,
    soffit_mm,
    frame_on_mm,
    pitchDeg,
    gauge_mm,
    tile_cover_w_mm,
    eaves_overhang_mm,
    left_verge_exposed:
      left_verge_exposed == null ? true : left_verge_exposed === "true",
    right_verge_exposed:
      right_verge_exposed == null ? true : right_verge_exposed === "true",
  };
}

// ---------- main component ----------
export default function TilesLaths() {
  const m = getMaterials();
  const q = useQueryInputs();

  // ---------- UI state ----------
  const [inputs, setInputs] = useState({
    internalWidthMM: String(q.internalWidthMM ?? 4000),
    internalProjectionMM: String(q.internalProjectionMM ?? 2500),
    side_frame_thickness_mm: String(q.side_frame_thickness_mm ?? ""),
    fascia_lip_mm: String(q.fascia_lip_mm ?? ""),
    soffit_mm: String(q.soffit_mm ?? ""),
    frame_on_mm: String(q.frame_on_mm ?? ""),
    pitchDeg: String(q.pitchDeg ?? ""),

    // Internal
    int_lath_centres_mm: String(q.int_lath_centres_mm ?? 400),
    superquilt_extra_waste_pct: String(q.superquilt_extra_waste_pct ?? 0),

    // Plastics
    plastics_finish: String(q.plastics_finish ?? "white"),
    vent_method: String(q.vent_method ?? "factory"),

    // Tiles / laths
    gauge_mm: String(q.gauge_mm ?? 250),
    tile_cover_w_mm: String(
      q.tile_cover_w_mm ?? m.tile_britmet_cover_w_mm ?? 1231
    ),
    eaves_overhang_mm: String(q.eaves_overhang_mm ?? 50),

    // Exposed sides
    left_verge_exposed: q.left_verge_exposed ?? true,
    right_verge_exposed: q.right_verge_exposed ?? true,

    // Wastes
    tile_waste_pct:
      Number.isFinite(Number(q.tile_waste_pct)) && q.tile_waste_pct !== ""
        ? Number(q.tile_waste_pct)
        : 8,
    eaves_guard_waste_pct:
      Number.isFinite(Number(q.eaves_guard_waste_pct)) &&
      q.eaves_guard_waste_pct !== ""
        ? Number(q.eaves_guard_waste_pct)
        : 5,
    verge_waste_pct:
      Number.isFinite(Number(q.verge_waste_pct)) &&
      q.verge_waste_pct !== ""
        ? Number(q.verge_waste_pct)
        : 7,
    chamfer_waste_pct:
      Number.isFinite(Number(q.chamfer_waste_pct)) &&
      q.chamfer_waste_pct !== ""
        ? Number(q.chamfer_waste_pct)
        : 5,
    fixings_waste_pct:
      Number.isFinite(Number(q.fixings_waste_pct)) &&
      q.fixings_waste_pct !== ""
        ? Number(q.fixings_waste_pct)
        : 5,
  });

  const onNum = (key) => (e) =>
    setInputs((s) => ({ ...s, [key]: e.target.value }));
  const onToggle = (key) => (e) =>
    setInputs((s) => ({ ...s, [key]: !!e.target.checked }));

  // ---------- Derived geometry ----------
  const derived = useMemo(() => {
    const iw = num(inputs.internalWidthMM);
    const ip = num(inputs.internalProjectionMM);
    const sft = num(inputs.side_frame_thickness_mm);
    const lip = num(inputs.fascia_lip_mm);
    const soff = num(inputs.soffit_mm);
    const frm = num(inputs.frame_on_mm);
    const theta = (num(inputs.pitchDeg) * Math.PI) / 180;

    const extWidthMM = iw + 2 * (sft + lip);
    const extProjectionMM = ip + soff + frm;
    const B_mm = extProjectionMM / (Math.cos(theta) || 1);

    const over = num(inputs.eaves_overhang_mm);
    const slope_from_eaves_guard_mm = B_mm + over / (Math.cos(theta) || 1);

    return { extWidthMM, extProjectionMM, B_mm, slope_from_eaves_guard_mm };
  }, [inputs]);

  // ---------- Map UI → BOM inputs ----------
  const run_mm = Number(inputs.internalWidthMM) || 0;
  const projection_mm = Number(inputs.internalProjectionMM) || 0;
  const leftSide = inputs.left_verge_exposed ? "exposed" : "wall";
  const rightSide = inputs.right_verge_exposed ? "exposed" : "wall";

  const waste_pct = Number(inputs.tile_waste_pct) || 0;
  const pitch_deg = Number(inputs.pitchDeg) || 0;
  const eaves_overhang_mm = Number(inputs.eaves_overhang_mm) || 50;
  const gauge_mm = Number(inputs.gauge_mm) || 250;
  const cover_width_mm =
    Number(inputs.tile_cover_w_mm) || m.tile_britmet_cover_w_mm || 1231;

  const eaves_guard_waste_pct = Number(inputs.eaves_guard_waste_pct) || 0;
  const verge_waste_pct = Number(inputs.verge_waste_pct) || 0;
  const chamfer_waste_pct = Number(inputs.chamfer_waste_pct) || 0;
  const fixings_waste_pct = Number(inputs.fixings_waste_pct) || 0;
  const watercourse_waste_pct = 0;

  const bom = useMemo(
    () =>
      computeTilesLathsBOM(
        {
          run_mm,
          projection_mm,
          leftSide,
          rightSide,
          waste_pct,
          pitch_deg,
          eaves_overhang_mm,
          gauge_mm,
          cover_width_mm,
          eaves_guard_waste_pct,
          verge_waste_pct,
          chamfer_waste_pct,
          fixings_waste_pct,
          watercourse_waste_pct,
        },
        m
      ),
    [
      run_mm,
      projection_mm,
      leftSide,
      rightSide,
      waste_pct,
      pitch_deg,
      eaves_overhang_mm,
      gauge_mm,
      cover_width_mm,
      eaves_guard_waste_pct,
      verge_waste_pct,
      chamfer_waste_pct,
      fixings_waste_pct,
      watercourse_waste_pct,
      m,
    ]
  );

  // ---------- Internal (SuperQuilt + laths) ----------
  const internal = useMemo(
    () =>
      computeInternalLining(
        {
          internal_width_mm: Number(inputs.internalWidthMM) || 0,
          internal_projection_mm: Number(inputs.internalProjectionMM) || 0,
          pitch_deg,
          lath_centres_mm: Number(inputs.int_lath_centres_mm) || 400,
          extra_waste_pct: Number(inputs.superquilt_extra_waste_pct) || 0,
        },
        m
      ),
    [
      inputs.internalWidthMM,
      inputs.internalProjectionMM,
      pitch_deg,
      inputs.int_lath_centres_mm,
      inputs.superquilt_extra_waste_pct,
      m,
    ]
  );

  // ---------- Weights ----------
  const weights = useMemo(() => {
    const w_tile = m?.tile_britmet_weight_kg ?? 2.19;
    const w_eaves = m?.eaves_guard_weight_kg ?? 2.7;
    const w_verge = m?.verge_trim_weight_kg ?? 1.2;
    const w_chamfer_pm = m?.chamfer_lath_weight_kg_per_m ?? 0.65;
    const w_fix = m?.fixings_pack_britmet_weight_kg ?? 0.3;
    const w_water = m?.watercourse_weight_kg ?? 0.9;
    const w_touch = m?.touchup_kit_britmet_weight_kg ?? 0.3;

    const d = bom?.derived || {};

    const tiles = (d.tiles_total || 0) * w_tile;
    const eavesGuard = (d.eavesGuardPieces || 0) * w_eaves;
    const verge = (d.vergePieces || 0) * w_verge;
    const chamfer = (d.chamferLath_m || 0) * w_chamfer_pm;
    const fixings = (d.fixingsPacks || 0) * w_fix;
    const watercourse = (d.watercoursePieces || 0) * w_water;
    const touchUp = (d.touchUpQty || 0) * w_touch;

    const total =
      tiles +
      eavesGuard +
      verge +
      chamfer +
      fixings +
      watercourse +
      touchUp;

    return {
      lines: {
        tiles,
        eavesGuard,
        verge,
        chamfer,
        fixings,
        watercourse,
        touchUp,
      },
      total: Number(total.toFixed(1)),
    };
  }, [bom, m]);

  // ---------- Fascia & Soffit ----------
  const fasciaSoffit = useMemo(
    () =>
      computeFasciaSoffitLeanTo(
        {
          run_mm:
            Number(derived?.extWidthMM) ||
            Number(inputs.internalWidthMM) ||
            0,
          pitch_deg: Number(inputs.pitchDeg) || 0,
          soffit_requested_mm: Number(inputs.soffit_mm) || 0,
          left_exposed: !!inputs.left_verge_exposed,
          right_exposed: !!inputs.right_verge_exposed,
          slope_mm: Number(derived?.B_mm) || 0,
          projection_mm:
            Number(derived?.extProjectionMM) ||
            Number(inputs.internalProjectionMM) ||
            0,
          finish: inputs.plastics_finish,
          vent_method: inputs.vent_method,
        },
        m
      ),
    [
      derived?.extWidthMM,
      derived?.B_mm,
      derived?.extProjectionMM,
      inputs.internalWidthMM,
      inputs.internalProjectionMM,
      inputs.pitchDeg,
      inputs.soffit_mm,
      inputs.left_verge_exposed,
      inputs.right_verge_exposed,
      inputs.plastics_finish,
      inputs.vent_method,
      m,
    ]
  );

  // ---------- Edge Trims & Membrane ----------
  const edgeTrims = useMemo(
    () =>
      computeEdgeTrimsLeanTo(
        {
          ext_width_mm: Number(derived?.extWidthMM) || 0,
          ext_projection_mm: Number(derived?.extProjectionMM) || 0,
          finish: inputs.plastics_finish,
        },
        m
      ),
    [derived?.extWidthMM, derived?.extProjectionMM, inputs.plastics_finish, m]
  );

  // ---------- RENDER ----------
  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
      <NavTabs />

      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: 16,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Tiles &amp; Laths — Britmet Shingle (Lean-To)
        </h1>

        <p
          style={{
            color: "#555",
            marginBottom: 12,
          }}
        >
          Gauge <b>{inputs.gauge_mm}</b> mm · cover width{" "}
          <b>{inputs.tile_cover_w_mm}</b> mm · eaves overhang{" "}
          <b>{inputs.eaves_overhang_mm}</b> mm.
        </p>

        {/* Inputs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <label>
            Internal width (mm)
            <input
              type="number"
              value={inputs.internalWidthMM}
              onChange={onNum("internalWidthMM")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Internal projection (mm)
            <input
              type="number"
              value={inputs.internalProjectionMM}
              onChange={onNum("internalProjectionMM")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Side frame thickness (per side, mm)
            <input
              type="number"
              value={inputs.side_frame_thickness_mm}
              onChange={onNum("side_frame_thickness_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Fascia lip (per side, mm)
            <input
              type="number"
              value={inputs.fascia_lip_mm}
              onChange={onNum("fascia_lip_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Soffit (mm)
            <input
              type="number"
              value={inputs.soffit_mm}
              onChange={onNum("soffit_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Frame-on (mm)
            <input
              type="number"
              value={inputs.frame_on_mm}
              onChange={onNum("frame_on_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Pitch (deg)
            <input
              type="number"
              step="0.1"
              value={inputs.pitchDeg}
              onChange={onNum("pitchDeg")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Gauge (mm)
            <input
              type="number"
              value={inputs.gauge_mm}
              onChange={onNum("gauge_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Tile cover width (mm)
            <input
              type="number"
              value={inputs.tile_cover_w_mm}
              onChange={onNum("tile_cover_w_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Eaves overhang (mm)
            <input
              type="number"
              value={inputs.eaves_overhang_mm}
              onChange={onNum("eaves_overhang_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!inputs.left_verge_exposed}
              onChange={onToggle("left_verge_exposed")}
            />{" "}
            Left verge exposed
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!inputs.right_verge_exposed}
              onChange={onToggle("right_verge_exposed")}
            />{" "}
            Right verge exposed
          </label>
          <label>
            Tile waste (%)
            <input
              type="number"
              value={inputs.tile_waste_pct}
              onChange={onNum("tile_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Eaves guard waste (%)
            <input
              type="number"
              value={inputs.eaves_guard_waste_pct}
              onChange={onNum("eaves_guard_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Verge trim waste (%)
            <input
              type="number"
              value={inputs.verge_waste_pct}
              onChange={onNum("verge_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Chamfered lath waste (%)
            <input
              type="number"
              value={inputs.chamfer_waste_pct}
              onChange={onNum("chamfer_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Fixings packs waste (%)
            <input
              type="number"
              value={inputs.fixings_waste_pct}
              onChange={onNum("fixings_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Internal lath centres (mm)
            <input
              type="number"
              value={inputs.int_lath_centres_mm}
              onChange={onNum("int_lath_centres_mm")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            SuperQuilt extra waste (%)
            <input
              type="number"
              value={inputs.superquilt_extra_waste_pct}
              onChange={onNum("superquilt_extra_waste_pct")}
              className="border rounded px-2 py-1 w-full"
            />
          </label>
          <label>
            Plastics finish
            <select
              value={inputs.plastics_finish}
              onChange={(e) =>
                setInputs((s) => ({
                  ...s,
                  plastics_finish: e.target.value,
                }))
              }
              className="border rounded px-2 py-1 w-full"
            >
              <option value="white">White</option>
              <option value="foiled">Foiled</option>
            </select>
          </label>
          <label>
            Vent method
            <select
              value={inputs.vent_method}
              onChange={(e) =>
                setInputs((s) => ({
                  ...s,
                  vent_method: e.target.value,
                }))
              }
              className="border rounded px-2 py-1 w-full"
            >
              <option value="factory">Factory-vent fascia</option>
              <option value="discs">Supply vent discs</option>
            </select>
          </label>
        </div>

        {/* Derived summary */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div>
            External width: <b>{round(derived.extWidthMM)}</b> mm
          </div>
          <div>
            External projection: <b>{round(derived.extProjectionMM)}</b> mm
          </div>
          <div>
            Slope from eaves guard (display):{" "}
            <b>{round(derived.slope_from_eaves_guard_mm)}</b> mm
          </div>
          <div>
            Courses: <b>{bom.derived.courses}</b>
          </div>
          <div>
            Tiles per course: <b>{bom.derived.perCourseTiles}</b>
          </div>
          <div>
            Total tiles (incl. waste): <b>{bom.derived.tiles_total}</b>
          </div>
        </div>

        {/* Tiles & Laths BOM */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            overflowX: "auto",
            marginBottom: 18,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Units</th>
                <th className="p-2">Unit £</th>
                <th className="p-2">Line £</th>
                <th className="p-2">Est. kg</th>
              </tr>
            </thead>
            <tbody>
              {/* Tiles */}
              <tr>
                <td className="p-2">Britmet Shingle (tiles)</td>
                <td className="p-2">{bom.derived.tiles_total}</td>
                <td className="p-2">pcs</td>
                <td className="p-2">
                  £{Number(bom.prices.price_tile).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find((r) => r.key === "tiles")?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(weights.lines.tiles, 1)}
                </td>
              </tr>

              {/* Eaves Guard */}
              <tr>
                <td className="p-2">Timberlite Eaves Guard</td>
                <td className="p-2">{bom.derived.eavesGuardPieces}</td>
                <td className="p-2">pcs (3.0 m)</td>
                <td className="p-2">
                  £{Number(bom.prices.price_eavesGuard).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find((r) => r.key === "eaves")?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(weights.lines.eavesGuard, 1)}
                </td>
              </tr>

              {/* Verge */}
              <tr>
                <td className="p-2">2-Part Barge Trim (verges)</td>
                <td className="p-2">{bom.derived.vergePieces}</td>
                <td className="p-2">pcs (1.15 m)</td>
                <td className="p-2">
                  £{Number(bom.prices.price_verge).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find((r) => r.key === "verge")?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(weights.lines.verge, 1)}
                </td>
              </tr>

              {/* Watercourse (conditional) */}
              {bom.derived.watercoursePieces > 0 && (
                <tr>
                  <td className="p-2">Watercourse (wall abutment)</td>
                  <td className="p-2">{bom.derived.watercoursePieces}</td>
                  <td className="p-2">pcs (2.95 m)</td>
                  <td className="p-2">
                    £
                    {Number(
                      bom.prices.price_watercourse
                    ).toFixed(2)}
                  </td>
                  <td className="p-2">
                    £
                    {Number(
                      bom.lines.find(
                        (r) => r.key === "watercourse"
                      )?.line ?? 0
                    ).toFixed(2)}
                  </td>
                  <td className="p-2">
                    {round(
                      weights.lines.watercourse,
                      1
                    )}
                  </td>
                </tr>
              )}

              {/* Chamfered lath */}
              <tr>
                <td className="p-2">Chamfered Lath (front)</td>
                <td className="p-2">
                  {round(bom.derived.chamferLath_m, 2)}
                </td>
                <td className="p-2">m</td>
                <td className="p-2">
                  £
                  {Number(
                    bom.prices.price_chamferLath_pm
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find(
                      (r) => r.key === "chamfer"
                    )?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(
                    weights.lines.chamfer,
                    1
                  )}
                </td>
              </tr>

              {/* Fixings */}
              <tr>
                <td className="p-2">Fixings Pack (per course)</td>
                <td className="p-2">
                  {bom.derived.fixingsPacks}
                </td>
                <td className="p-2">packs</td>
                <td className="p-2">
                  £
                  {Number(
                    bom.prices.price_fixingsPack
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find(
                      (r) => r.key === "fixings"
                    )?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(
                    weights.lines.fixings,
                    1
                  )}
                </td>
              </tr>

              {/* Touch-up kit */}
              <tr>
                <td className="p-2">Touch-Up Kit</td>
                <td className="p-2">1</td>
                <td className="p-2">each</td>
                <td className="p-2">
                  £
                  {Number(
                    bom.prices.price_touchup
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    bom.lines.find(
                      (r) => r.key === "touchup"
                    )?.line ?? 0
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  {round(
                    weights.lines.touchUp,
                    1
                  )}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="p-2 font-semibold" colSpan={4}>
                  Total
                </td>
                <td className="p-2 font-semibold">
                  £{Number(bom.grand).toFixed(2)}
                </td>
                <td className="p-2 font-semibold">
                  {round(weights.total, 1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Internal Insulation */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "16px 0 8px",
          }}
        >
          Internal Insulation (SuperQuilt) &amp; Fixing Laths
        </h2>
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            overflowX: "auto",
            marginBottom: 8,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Units</th>
                <th className="p-2">Unit £ (ex)</th>
                <th className="p-2">Line £ (ex)</th>
              </tr>
            </thead>
            <tbody>
              {internal.superquilt.mix.map((r) => (
                <tr key={r.label}>
                  <td className="p-2">{r.label}</td>
                  <td className="p-2">{r.count}</td>
                  <td className="p-2">
                    roll{r.count > 1 ? "s" : ""}
                  </td>
                  <td className="p-2">
                    £{Number(r.unit_ex_vat).toFixed(2)}
                  </td>
                  <td className="p-2">
                    £{Number(r.line_ex_vat).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="p-2">
                  Internal fixing laths
                </td>
                <td className="p-2">
                  {internal.laths.metres.toFixed(
                    2
                  )}
                </td>
                <td className="p-2">m</td>
                <td className="p-2">
                  £
                  {Number(
                    internal.laths
                      .unit_pm_ex_vat
                  ).toFixed(2)}
                </td>
                <td className="p-2">
                  £
                  {Number(
                    internal.laths
                      .line_ex_vat
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="p-2 font-semibold" colSpan={4}>
                  Total (ex VAT)
                </td>
                <td className="p-2 font-semibold">
                  £
                  {Number(
                    internal
                      .grand_ex_vat
                  ).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p
          style={{
            marginTop: 4,
            color: "#555",
          }}
        >
          Internal area for plasterboard:{" "}
          <b>
            {internal.derived.area_m2_board.toFixed(
              2
            )}{" "}
            m²
          </b>{" "}
          · Suggest 2400×1200 boards:{" "}
          <b>
            {
              internal
                .plasterboardSuggestions[
                "2400x1200"
              ].boards
            }
          </b>
        </p>

        {/* Fascia & Soffit */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "20px 0 8px",
          }}
        >
          Fascia &amp; Soffit (Lean-to)
        </h2>
        <p
          style={{
            color: "#555",
            marginBottom: 8,
          }}
        >
          Soffit request:{" "}
          <b>{Number(inputs.soffit_mm) || 0} mm</b>{" "}
          ⇒ Board chosen:{" "}
          <b>
            {fasciaSoffit.meta
              .soffit_width_mm || 0}{" "}
            mm
          </b>{" "}
          · Pitch:{" "}
          <b>
            {Number(inputs.pitchDeg) ||
              0}
            °
          </b>{" "}
          · Fascia calc H:{" "}
          <b>
            {
              fasciaSoffit.meta
                .H_calc_mm
            }{" "}
            mm
          </b>{" "}
          ⇒ Stocked fascia:{" "}
          <b>
            {
              fasciaSoffit.meta
                .fascia_height_mm
            }{" "}
            mm
          </b>{" "}
          · Finish:{" "}
          <b>
            {
              inputs
                .plastics_finish
            }
          </b>
        </p>
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            overflowX: "auto",
            marginBottom: 18,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Units</th>
                <th className="p-2">Unit £</th>
                <th className="p-2">Line £</th>
              </tr>
            </thead>
            <tbody>
              {fasciaSoffit.lines.map(
                (row) => (
                  <tr key={row.key}>
                    <td className="p-2">
                      {row.label}
                    </td>
                    <td className="p-2">
                      {
                        row.qtyDisplay
                      }
                    </td>
                    <td className="p-2">
                      {row.key ===
                        "vent" &&
                      row.label.startsWith(
                        "VENT DISCS"
                      )
                        ? "pcs"
                        : "lengths"}
                    </td>
                    <td className="p-2">
                      £
                      {Number(
                        row.unit
                      ).toFixed(2)}
                    </td>
                    <td className="p-2">
                      £
                      {Number(
                        row.line
                      ).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="p-2 font-semibold" colSpan={4}>
                  Total
                </td>
                <td className="p-2 font-semibold">
                  £
                  {Number(
                    fasciaSoffit
                      .grand
                  ).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Edge Trims & Membrane */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "20px 0 8px",
          }}
        >
          Edge Trims &amp; Membrane (Lean-to)
        </h2>
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 10,
            overflowX: "auto",
            marginBottom: 12,
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Units</th>
                <th className="p-2">Unit £</th>
                <th className="p-2">Line £</th>
              </tr>
            </thead>
            <tbody>
              {edgeTrims.lines.map(
                (row) => (
                  <tr key={row.key}>
                    <td className="p-2">
                      {row.label}
                    </td>
                    <td className="p-2">
                      {
                        row.qtyDisplay
                      }
                    </td>
                    <td className="p-2">
                      lengths
                    </td>
                    <td className="p-2">
                      £
                      {Number(
                        row.unit
                      ).toFixed(2)}
                    </td>
                    <td className="p-2">
                      £
                      {Number(
                        row.line
                      ).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="p-2 font-semibold" colSpan={4}>
                  Total
                </td>
                <td className="p-2 font-semibold">
                  £
                  {Number(
                    edgeTrims
                      .grand
                  ).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          .print\\:hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        input[type="number"] { appearance: textfield; }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
