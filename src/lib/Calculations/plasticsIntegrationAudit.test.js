import { buildHippedPlasticsIntegrationAudit, planSoffitStock, fasciaCornerStockAngle } from "./plasticsIntegrationAudit";
const geometry = { facets: [
  { id: "front", ringBeam: { eavesGeometry: { fasciaOrderSizeMM: 225, plumbCutHeightMM: 159.8, finishedFasciaHeightMM: 230, soffitDepthMM: 150 } } },
  { id: "left", ringBeam: { eavesGeometry: { fasciaOrderSizeMM: 225, plumbCutHeightMM: 159.8, finishedFasciaHeightMM: 230, soffitDepthMM: 90 } } },
] };
const edgeModel = { valid: true, edges: [
  { id: "front", kind: "eaves", side: "front", lengthMM: 7356, facetIds: ["front"] },
  { id: "left", kind: "eaves", side: "left", lengthMM: 3135, facetIds: ["left"] },
  { id: "hip", kind: "hip", side: "left", lengthMM: 3752 },
] };
const run = (extra = {}) => buildHippedPlasticsIntegrationAudit({ geometry, edgeModel, ...extra });
test("uses resolved VFC plus construction cover and nominal return lip", () => {
  const result = run();
  expect(result.rows.map(row => row.fasciaWidthMM)).toEqual([250, 250]);
  expect(result.rows[0].vfcMM).toBe(159.8);
});
test("includes horizontal side eaves and excludes hip/tile boundary runs", () => {
  expect(run().rows.length).toBe(2);
  expect(run().totals.totalRunM).toBe(10.491);
});
test("keeps confirmed soffit cover widths separate in stock planning", () => {
  expect(run().rows.map(row => row.soffitWidthMM)).toEqual([150, 100]);
  expect(run().totals.fasciaQty).toBe(3);
  expect(run().totals.soffitQty).toBe(3);
});
test("does not silently cap soffit sizes above available stock", () => {
  expect(run({ materials: { soffit_board_widths_mm: [50] } }).valid).toBe(false);
});
test("uses colour price band and vents all eaves", () => {
  const result = run({ plasticsColor: "Light Oak", materials: {
    fascia_price_per_length_foiled_mm: { 250: 40 }, fascia_vent_price_per_m: 0.5 } });
  expect(result.rows[0].fasciaCost).toBe(80);
  expect(result.totals.ventQtyM).toBe(11);
  expect(result.totals.ventCost).toBe(5.5);
});
test("retains open verges separately and reports missing geometry", () => {
  const result = run({ edgeModel: { ...edgeModel, edges: [...edgeModel.edges,
    { id: "right", kind: "openVerge", lengthMM: 3000 }] } });
  expect(result.remainingOpenVerges.length).toBe(1);
  expect(buildHippedPlasticsIntegrationAudit().valid).toBe(false);
});

test("pools side offcuts for symmetric front joints while keeping soffit widths separate", () => {
  const right = { ...geometry.facets[1], id: "right" };
  const result = run({ geometry: { facets: [...geometry.facets, right] }, edgeModel: {
    valid: true, edges: [...edgeModel.edges, { id: "right", kind: "eaves", side: "right", lengthMM: 3135, facetIds: ["right"] }] } });
  expect(result.rows[0].finishedFasciaHeightMM).toBe(238.8);
  expect(result.totals.fasciaQty).toBe(3);
  expect(result.totals.straightJoints).toBe(2);
  expect(result.totals.frontHipCornerCount).toBe(2);
  expect(result.fasciaPlan.runPieces[0].lengthsM).toEqual([1.178, 5, 1.178]);
  expect(result.totals.soffitQty).toBe(3);
  expect(result.soffitPlan.order).toEqual([{ widthMM: 150, qty: 2 }, { widthMM: 200, qty: 1 }]);
  expect(result.soffitPlan.joints).toBe(1);
  expect(result.totals.ventQtyM).toBe(14);
});

test("does not claim three boards when side offcuts cannot cover front ends", () => {
  const result = run({ edgeModel: { valid: true, edges: [
    { ...edgeModel.edges[0], lengthMM: 9000 },
    { ...edgeModel.edges[1], lengthMM: 4000 },
    { ...edgeModel.edges[1], id: "right", side: "right", lengthMM: 4000 }
  ] } });
  expect(result.totals.fasciaQty).toBe(4);
  expect(result.totals.straightJoints).toBe(2);
});

const sideRuns = (width = 90, length = 3.135) => ["left", "right"].map(side =>
  ({ edgeId: side, side, runM: length, soffitGeometryMM: width }));
test("respects rip kerf when choosing wider stock", () => {
  expect(planSoffitStock(sideRuns(100), 5, [100, 200], 3).order).toEqual([{ widthMM: 100, qty: 2 }]);
  expect(planSoffitStock(sideRuns(), 5, [100, 200], 3).order).toEqual([{ widthMM: 200, qty: 1 }]);
});
test("does not fit side lengths longer than one stock strip into a single board", () => {
  const result = planSoffitStock(sideRuns(90, 6), 5, [100, 200], 3);
  expect(result.qty).toBe(2);
  expect(result.boards.every(board => board.strips.every(strip => strip.pieces.reduce((sum,piece) => sum + piece.lengthM,0) <= 5))).toBe(true);
});
test("prices purchased soffit widths and leaves missing prices unconfigured", () => {
  expect(run({materials:{soffit_price_per_length_white_mm:{150:20,100:10}}}).soffitCost).toBe(50);
  expect(run().soffitCost).toBe(null);
});

test("accessories follow frame perimeter and charge shared H-trim and one pin allowance", () => {
  const result = run({ geometry: { widthMM: 7040, projectionMM: 2910, facets: [...geometry.facets, { ...geometry.facets[1], id: "right" }] },
    edgeModel: { valid: true, edges: [...edgeModel.edges, { ...edgeModel.edges[1], id: "right", side: "right", facetIds: ["right"] }] },
    materials: { fascia_h_section_white_price: 11.5, polytopPins: { price_per_box: 1.19 }, fascia_j_section_white_price: 10 } });
  expect(result.accessories.jRunM).toBe(13.14);
  expect(result.accessories.jQty).toBe(3);
  expect(result.accessories.hLengthMM).toBe(510);
  expect(Number(result.accessories.lines[1].cost.toFixed(2))).toBe(1.17);
  expect(result.accessories.lines[4].cost).toBe(1.19);
  expect(result.accessories.lines[2].qty).toBe(2);
  expect(result.accessories.lines[3].qty).toBe(2);
});
test("selects adaptable 135-degree fascia corner for unusual angles", () => {
  expect(fasciaCornerStockAngle(90)).toBe(90);
  expect(fasciaCornerStockAngle(135)).toBe(135);
  expect(fasciaCornerStockAngle(150)).toBe(135);
});
