Timberlite v77 — Gable Summary and quotation pricing
Apply over v76: extract the ZIP and copy the src folder into quoteapp-v2, replacing the included files. No files are deleted or retired. RoofPlanDiagram is not included.

What is available
- Gable Summary tab for admin, with all six material sections, Add Item dropdowns, quantity changes and price exclusions.
- One authoritative material total feeds both Summary and D/O quotation pricing.
- Labour uses existing shared settings and the Summary area/day allowance; a roof-specific days override is available to admin.
- Markup, VAT and customer discount use the existing shared pricing helper/settings.
- Customer default delivery distance applies without a postcode. With a postcode, click Calculate delivery distance; a matching calculated or admin-entered distance is required before issuing/saving the price.
- Save Quote uses the existing quote service/schema with roof_style=gable. Reference is required. Saved Gable quotes reopen through Quotes/Edit on the Gable D/O page, including extras, exclusions, quantities and labour override.
- Gable draft/state is kept separate from Lean-To/Hipped drafts. Returning to D/O does not reset it.
- Gable manufacture/Idiot List integration follows next. Converting Gable quotes to jobs is held until manufacture integration is available; existing roof conversion is unchanged.

Cost reconciliation
Timber audit waste is included once. All five 25x50 uses are pooled into the audited purchased stock count (example 40 x 4.8m); cost is stock metres times saved rate, with no additional waste uplift. This differs from pricing only net installed lath metres.
Ring-beam 50mm PIR is removed from timber cost and pooled with cradle PIR before sheet rounding. Ridge laths and ring-beam laths are removed from their separate costs to avoid duplicates.
PIR100 sheets, SuperQuilt roll mix, whole membrane roll, plastics, guttering, tile starter, site screws and factory consumption reuse the verified audit requirements. Steel includes one existing touch-up kit allowance.
Rear packers remain within the practical ply/waste allowance; no precise packer cut list is claimed.
Unconfigured active prices are clearly listed and prevent quotation pricing/save until configured or intentionally price-excluded. Explicit configured zero prices are accepted.

Weight and supply
Installed areas determine SuperQuilt/membrane weight. Installed lath metres determine lath weight. Existing fascia/soffit per-metre rates are retained; main tile weight is an area-based estimate, excluding surplus and two extra steel tiles. Rows with no configured weight are marked Unconfigured and contribute no invented pack weight.
Plasterboard coverage/weight is included once and shown as information, with no supply cost.
Quantity adjustments and extra items change supply/cost, not installed roof geometry. Price exclusions retain supply quantities and installed weight. Factory glue/staples/fixings are tagged for exclusion from loose loading supplies.
A membrane requirement above supplied coverage must be resolved by increasing its roll quantity before quoting.

File map
NEW lib/Calculations/gableSummaryMaterialsModel.js — six-section Gable BOM, reconciliation, pricing totals and override/extra application.
NEW lib/Calculations/gableSummaryMaterialsModel.test.js — quantity, cost, weight, delivery, saved-quote and supply regressions.
NEW lib/Calculations/gableQuotation.js — shared labour/delivery/customer pricing and saved record builder.
NEW pages/gable/GableSummary.jsx — section tables, extras, quantity/exclusion controls and pricing.
NEW pages/gable/GablePricingPanel.jsx — shared D/O/Summary price panel, delivery lookup and save button.
UPDATED summaryMaterialsModel.js — routes Gable requests to its model; existing roof calculation paths retained.
UPDATED GablePage.jsx — Summary navigation/route and consumes fresh-design flag once.
UPDATED GableDesignPreview.jsx — D/O price panel and current integration-status wording.
UPDATED Quotes.jsx — opens Gable quotes on the correct route; manufacture conversion pending for Gable.
UPDATED app/routes.js — Gable Summary route.

Validation here
156 lightweight Node regression checks passed across Gable, Lean-To/Hipped shared costing, tiles and factory allowances.
Actual Gable React-module handler checks passed for Add Item, quantity changes, exclusions, isolated persistence, delivery request, Save Quote payload, saved quote reopening and fresh navigation. Edited React files transform without syntax errors. Existing D/O/Technical tests and two SVG renders also pass.
These checks mock the cloud quote service/delivery response. A live Supabase save and Google delivery lookup require checking in the running app. Full CRA production build and genuine Jest cannot run in this partial workspace.

Local regression command
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryAddedItems.test.js src/lib/Calculations/summaryIdiotList.test.js

App checks
1. Confirm clean compilation; open your Gable and select Summary.
2. Check all six subtotals sum to the Materials total and the D/O price uses it.
3. Try an extra gutter corner, one additional concrete screw and a price exclusion; check the total changes once and survives returning to D/O.
4. Review labour days and customer default delivery distance. With a postcode, calculate delivery before saving.
5. Save a test quote, reopen via Quotes/Edit, and check the Gable and its overrides return correctly.
