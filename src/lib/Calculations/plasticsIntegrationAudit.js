const positive = (value) => Math.max(0, Number(value) || 0);
const nextWidth = (widths, required) => widths.map(Number).filter(Number.isFinite)
  .sort((a, b) => a - b).find((width) => width >= required) ?? null;

// A fitting layout, not a factory cut list. Whole boards are supplied.
export function planPlasticsStock(runs, stockM) {
  const pieces = [];
  const runPieces = runs.map(run => {
    const full = Math.floor((run.runM + 1e-9) / stockM);
    const remainder = Math.max(0, run.runM - full * stockM);
    const lengths = Array(full).fill(stockM);
    if (remainder > 1e-9) {
      if (run.side === "front" && full > 0) {
        lengths.unshift(remainder / 2);
        lengths.push(remainder / 2);
      }
      else lengths.push(remainder);
    }
    lengths.forEach(lengthM => pieces.push({ edgeId: run.edgeId, lengthM, widthMM: run.widthMM }));
    return { edgeId: run.edgeId, lengthsM: lengths };
  });
  const boards = [];
  pieces.sort((a, b) => b.lengthM - a.lengthM).forEach(piece => {
    let board = boards.find(item => item.widthMM === piece.widthMM && item.remainingM + 1e-9 >= piece.lengthM);
    if (!board) { board = { widthMM: piece.widthMM, remainingM: stockM, pieces: [] }; boards.push(board); }
    board.pieces.push(piece);
    board.remainingM -= piece.lengthM;
  });
  return { boards, runPieces, qty: boards.length,
    joints: runPieces.reduce((sum, run) => sum + Math.max(0, run.lengthsM.length - 1), 0) };
}

// Keep front boards whole-width; pair matching side strips when wider stock fits.
// This is a deterministic practical layout, not a general cutting optimiser.
export function planSoffitStock(runs, stockM, widths, kerfMM = 3) {
  const lanePlan = planPlasticsStock(runs.map(run => ({ ...run,
    side: run.side === "front" ? "soffitFront" : run.side,
    widthMM: run.soffitGeometryMM })), stockM);
  const pending = [...lanePlan.boards];
  const boards = [];
  while (pending.length) {
    const lane = pending.shift();
    const sideOnly = lane.pieces.every(piece => runs.find(run => run.edgeId === piece.edgeId)?.side !== "front");
    const pairWidth = nextWidth(widths, lane.widthMM * 2 + kerfMM);
    const match = sideOnly && pairWidth !== null ? pending.findIndex(other =>
      other.widthMM === lane.widthMM && other.pieces.every(piece =>
        runs.find(run => run.edgeId === piece.edgeId)?.side !== "front")) : -1;
    const strips = [lane];
    if (match >= 0) strips.push(pending.splice(match, 1)[0]);
    boards.push({ widthMM: strips.length === 2 ? pairWidth : nextWidth(widths, lane.widthMM), strips });
  }
  const order = [...new Set(boards.map(board => board.widthMM))].sort((a,b) => a-b)
    .map(widthMM => ({ widthMM, qty: boards.filter(board => board.widthMM === widthMM).length }));
  return { boards, order, qty: boards.length, runPieces: lanePlan.runPieces, joints: lanePlan.joints, kerfMM };
}

export const fasciaCornerStockAngle = angle => Math.abs(Number(angle) - 90) < 0.01 ? 90 : 135;

function plasticsAccessories(geometry, rows, fasciaPlan, soffitPlan, materials, band, colour) {
  // Roof external dimensions include soffit overhangs. Starter follows the frame instead.
  const frameMM = positive(materials.side_frame_thickness_mm ?? 70);
  const widthMM = positive(geometry.widthMM);
  const projectionMM = positive(geometry.projectionMM);
  const frameRuns = rows.map(row => ({ edgeId: row.edgeId, side: row.side,
    runM: (row.side === "front" ? widthMM + 2 * frameMM : projectionMM + frameMM) / 1000 }));
  const frameValid = widthMM > 0 && projectionMM > 0;
  const jRunM = frameValid ? frameRuns.reduce((sum, run) => sum + run.runM, 0) : null;
  const jStockM = positive(materials.j_section_stock_length_m) || 5;
  const jQty = jRunM == null ? null : Math.ceil(jRunM / jStockM);
  const jPrice = materials[`fascia_j_section_${band}_price`] ?? materials[`j_section_price_each_${band}`];
  const front = rows.find(row => row.side === "front");
  const hPieces = [];
  soffitPlan.runPieces.forEach(run => {
    const row = rows.find(item => item.edgeId === run.edgeId);
    for (let index = 1; index < run.lengthsM.length; index++)
      hPieces.push({ label: `${run.edgeId} straight soffit joint`, lengthMM: row.soffitGeometryMM });
  });
  if (front) rows.filter(row => row.side === "left" || row.side === "right").forEach(row => {
    // 90-degree mitre crosses both perpendicular board depths.
    hPieces.push({ label: `${row.side} soffit mitre`, lengthMM: Math.ceil(Math.hypot(front.soffitGeometryMM, row.soffitGeometryMM) / 10) * 10 });
  });
  const hLengthMM = hPieces.reduce((sum, piece) => sum + piece.lengthMM, 0);
  const hPrice = materials[`fascia_h_section_${band}_price`];
  const cornerQty = rows.filter(row => row.side === "left" || row.side === "right").length;
  const cornerPrice = materials[`fascia_corner_90_ext_300_${band}_price`] ?? materials[`fascia_corner_price_each_${band}`];
  const jointPrice = materials[`fascia_joint_300_${band}_price`] ?? materials[`fascia_joint_price_each_${band}`];
  // Materials price is the user's 50-pin allowance, despite the legacy box label.
  const pinsPrice = materials.polytop_pins_price_per_box ?? materials.polytopPins?.price_per_box;
  const priced = (qty, price) => qty == null || price == null ? null : qty * positive(price);
  return { frameRuns, jRunM, jQty, jStockM, hPieces, hLengthMM,
    lines: [
      { key: "j_trim", label: `Soffit starter / J-trim — ${colour}`, qty: jQty, unit: `${jStockM}m lengths`, cost: priced(jQty, jPrice) },
      { key: "h_trim", label: `H-trim — ${colour}`, qty: hLengthMM, unit: "mm cut from shared 5m stock", cost: priced(hLengthMM / 5000, hPrice) },
      { key: "fascia_corners", label: `90° fascia corners — ${colour}`, qty: cornerQty, unit: "each", cost: priced(cornerQty, cornerPrice) },
      { key: "fascia_joints", label: `Fascia straight joints — ${colour}`, qty: fasciaPlan.joints, unit: "each", cost: priced(fasciaPlan.joints, jointPrice) },
      { key: "polytop_pins", label: `Polytop pins — ${colour}`, qty: 50, unit: "pins (one priced allowance)", cost: priced(1, pinsPrice) },
    ] };
}

// Read-only perimeter requirements. Geometry owns all HFC/VFC/soffit rules.
export function buildHippedPlasticsIntegrationAudit({ geometry = null, edgeModel = null,
  materials = {}, legacyLines = [], plasticsColor = "white" } = {}) {
  if (!geometry || !edgeModel?.valid) return { valid: false, rows: [], errors: ["Valid facet and edge geometry is required."] };
  const foiled = !/^(white|smooth white|white grain)$/i.test(String(plasticsColor).trim());
  const band = foiled ? "foiled" : "white";
  const fasciaStockM = positive(materials.fascia_stock_length_m) || 5;
  const soffitStockM = positive(materials.soffit_stock_length_m) || 5;
  const fasciaPrices = materials[`fascia_price_per_length_${band}_mm`] || {};
  const soffitPrices = materials[`soffit_price_per_length_${band}_mm`] || {};
  const widths = materials.soffit_board_widths_mm || [100, 150, 175, 200];
  const errors = [];
  const rows = (edgeModel.edges || []).filter((edge) => edge.kind === "eaves").map((edge) => {
    const facet = (geometry.facets || []).find((item) => (edge.facetIds || []).includes(item.id));
    const profile = facet?.ringBeam?.eavesGeometry;
    const runM = positive(edge.lengthMM) / 1000;
    const vfcMM = positive(profile?.plumbCutHeightMM);
    const finishedFasciaHeightMM = vfcMM + 40 + 9 + 30;
    const fasciaWidthMM = profile ? nextWidth(materials.fascia_stock_sizes_mm || [200, 225, 250, 300, 400], finishedFasciaHeightMM + 10) : null;
    const soffitGeometryMM = positive(profile?.soffitDepthMM);
    const soffitWidthMM = soffitGeometryMM > 0 ? nextWidth(widths, soffitGeometryMM) : 0;
    if (!profile || !vfcMM || !fasciaWidthMM) errors.push(`Missing resolved eaves profile: ${edge.id}`);
    if (soffitWidthMM === null) errors.push(`Soffit dimension exceeds configured stock widths: ${edge.id}`);
    const fasciaQty = Math.ceil(runM / fasciaStockM);
    const soffitQty = soffitWidthMM > 0 ? Math.ceil(runM / soffitStockM) : 0;
    return { edgeId: edge.id, side: edge.side, runM,
      vfcMM, finishedFasciaHeightMM, legacyFasciaWidthMM: positive(profile?.fasciaOrderSizeMM),
      fasciaWidthMM, fasciaQty, fasciaStockM,
      fasciaCost: fasciaPrices[fasciaWidthMM] == null ? null : fasciaQty * positive(fasciaPrices[fasciaWidthMM]),
      soffitGeometryMM, soffitWidthMM, soffitQty, soffitStockM,
      soffitCost: soffitWidthMM === 0 ? 0 : soffitPrices[soffitWidthMM] == null ? null : soffitQty * positive(soffitPrices[soffitWidthMM]),
    };
  });
  const fasciaPlan = planPlasticsStock(rows.map(row => ({ ...row, widthMM: row.fasciaWidthMM })), fasciaStockM);
  const soffitRuns = rows.filter(row => row.soffitWidthMM > 0);
  const kerfMM = materials.soffit_rip_kerf_mm == null ? 3 : positive(materials.soffit_rip_kerf_mm);
  const soffitPlan = planSoffitStock(soffitRuns, soffitStockM, widths, kerfMM);
  const soffitCost = soffitPlan.order.some(item => soffitPrices[item.widthMM] == null)
    ? null : soffitPlan.order.reduce((sum, item) => sum + item.qty * positive(soffitPrices[item.widthMM]), 0);
  const accessories = plasticsAccessories(geometry, rows, fasciaPlan, soffitPlan, materials, band, plasticsColor);
  const totalRunM = rows.reduce((sum, row) => sum + row.runM, 0);
  const ventMode = materials.vent_rounding_mode ?? "ceil";
  const ventQtyM = ventMode === "exact" ? totalRunM : Math.ceil(totalRunM);
  return { valid: errors.length === 0, errors, rows, band, fasciaPlan, soffitPlan, soffitCost, accessories,
    legacyLines: legacyLines.map((line) => ({ key: line.key, label: line.label,
      qty: line.qty, cost: Number(line.line ?? line.total ?? 0) })),
    totals: { totalRunM, fasciaQty: fasciaPlan.qty,
      soffitQty: soffitPlan.qty, ventQtyM,
      ventCost: ventQtyM * Number(materials.fascia_vent_price_per_m ?? 0.5),
      frontHipCornerCount: rows.filter((row) => row.side === "left" || row.side === "right").length,
      straightJoints: fasciaPlan.joints },
    remainingOpenVerges: (edgeModel.edges || []).filter((edge) => edge.kind === "openVerge")
      .map((edge) => ({ edgeId: edge.id, runM: positive(edge.lengthMM) / 1000 })),
    assumptions: [
      "Reveal Liner cover = resolved VFC + 40mm ring beam + 9mm soffit + 30mm chamfered lath. Add 10mm return lip to select nominal stock width.",
      "Eaves runs use structural external perimeter lengths, excluding the tile overhang into guttering.",
      "Row quantities are standalone run comparisons. Order totals use a fitting layout with shared suitable offcuts and centred full front boards; the factory still supplies full lengths.",
      "Front soffit uses its own stock width. Matching side strips may share a wider board when both finished widths plus the rip saw kerf fit. The factory supplies full lengths; trimming is a fitting/preparation requirement.",
      `Rip saw kerf allowance: ${kerfMM}mm (configurable; default 3mm). This practical stock plan is not a factory cut list or a global cost optimiser.`,
      "J-trim follows the active external frame runs, excluding soffit overhangs. H-trim is charged by installed cut length from shared 5m stock, not a whole length per roof.",
      "Mitre H-trim pieces are rounded up to the next 10mm. This layout covers rectangular 90-degree eaves corners; unusual corner geometry needs separate review. Supply 135-degree fascia corners for non-90-degree angles.",
      "Polytop pricing is one configured 50-pin allowance. Confirm the Materials rate is £1.19 rather than the full 250-pin box price.",
      "Installed plastic weights are not revised here. Existing kg/m rates must be verified as 9mm Reveal Liner rates and against board widths.",
    ] };
}
