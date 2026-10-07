Timberlite v46 — fascia external cut height
Apply over v45. Copy src into quoteapp-v2 and replace the included files.

Confirmed factory rule:
- Structural datum: underside of ring-beam ply base to upper edge of chamfered lath.
- Add 10mm rounded soffit-board allowance and 10mm fascia lip.
- Round this complete external height UP to the next whole mm.
- Deduct 5mm clearance under the angled metal tile starter.
- Select Reveal Liner stock by coverage ABOVE the internal lip (external cut height minus 10mm).

Current roof: 233.7 + 10 + 10 => 254mm; subtract 5 => 249mm external cut height.
Coverage above internal lip: 239mm; required stock: 250mm.

Book preparation page shows the complete calculation and 249mm external cut height.
Hipped Summary and Idiot List use the same stock calculation. The shared Lean-To manufacture helper also uses the confirmed cut rule. Structural height remains a separate datum; no rafters, hips, ring-beams, pitches, soffit widths or envelope dimensions are changed. Existing plastic weight rates remain unchanged.
PSE 30x95 changes from v45 are preserved. RoofPlanDiagram is not included.

Run:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/fasciaCutHeight.test.js src/lib/Calculations/plasticsIntegrationAudit.test.js src/lib/Calculations/plasticsSummaryIntegration.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/geometry/facetEavesGeometry.test.js

Then: npm run build

Local validation: 46 perimeter/material checks plus 133 geometry checks passed through the lightweight Node harness. Five application modules parsed with Babel. Full CRA build and printed page layout need checking in your installed app.
