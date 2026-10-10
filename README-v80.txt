Timberlite v80 — Gable landing page matched to Lean-To/Hipped
Apply OVER v79. Copy src into quoteapp-v2, accepting overwrites. No files deleted or retired. Existing Lean-To/Hipped pages and geometry are unchanged.

The existing Lean-To landing form is the visual reference: Timberlite Gable heading, same introductory wording, compact single rounded card, two-column mobile grid, matching control sizes, common field order and Quote/Save Quote/Reset action row. The Gable Configuration section occupies the Hip Configuration position, with side-soffit and front-overhang controls specific to this style. Pitch remains 25 degrees for Gable. Existing saved colours and dimensions are preserved.

Initial blank design no longer displays an error, example loader, technical-review button, price-band information or development explanation. Quote reveals the plan, elevation and integrated price. If a postcode needs a route distance, Quote starts the existing delivery lookup. Save Quote uses the existing saved-quote handler and cannot save incomplete/unpriced designs. Reset clears roof inputs while retaining the signed-in customer. Separate side soffits remain admin only.

Navigation now includes Tiles/Laths in the same sequence as the existing roof styles. For Gable this goes directly to its own Technical tile/lath audit, avoiding the Lean-To auto calculator's draft. The Home Tile Calcs tool remains unchanged.

FILE MAP
pages/gable/GableDesignForm.jsx — new compact common-order form, Gable Configuration and action-panel wiring.
pages/gable/GableDesignPreview.jsx — matching landing heading/intro, form, quote-result visibility and initial validation behaviour. Technical audits remain accessible.
pages/gable/GablePricingPanel.jsx — optional compact Quote/Save/Reset actions; existing Summary caller keeps its full pricing panel and handler behaviour.
pages/gable/GableNavigation.jsx — matching font and Tiles/Laths navigation.
pages/gable/GablePage.jsx — scroll to the Gable tile/lath audit when its tab is selected.

VALIDATION
160 lightweight regression checks passed. React handler checks passed for landing field order, blank-page validation silence, Quote/Save/Reset, Save readiness, existing Summary changes, delivery/save/reopen, job conversion, front-page persistence and checklist parity. JSX transformed successfully. Full CRA compilation and real mobile rendering require your Windows/Vercel check; pixel-for-pixel mobile identity has not been verified here.

Windows regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/gableManufactureSchedule.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

Review the blank Gable D/O page beside the Lean-To page on mobile. Then enter a known roof, press Quote, confirm price/Summary parity and save/reopen. No pricing quantities, structural geometry, manufacture cuts or loading quantities change in this overlay.
