Timberlite v81 — Gable results matched to other roof styles
Apply OVER v80. Copy src into quoteapp-v2 and accept overwrites. No deletions or changes to existing Lean-To/Hipped pages.

After Quote, Gable now displays Plan preview followed by Your price, matching the existing roof styles. The plan shows blue trusses, centred ridge, internal/external dimensions with arrows, centre positions measured from the house wall, pitch on both faces and two side outlets. The detail block shows dimensions, finished height, pitch, tiles/colours and fascia/gutters. Customer dimensions remain requested external dimensions, without adding the factory 5mm tolerance to the quotation drawing.

Your price shows Subtotal, configured VAT rate/amount, gross total and the existing 31-day validity wording. Detailed material/labour/delivery/markup controls remain in Summary; truss elevation and manufacture geometry remain in Technical. Quote/Save/Reset stay in the input card. Delivery lookup and Save handlers continue using the same authoritative quotation/model. Missing prices, distance or customer data prevent a final price/save.

FILE MAP
pages/gable/GableQuoteResults.jsx — customer-facing plan and compact price cards using the shared Gable quotation calculation.
pages/gable/GableDesignPreview.jsx — D/O result branch; Technical retains existing audits/elevation.
pages/gable/GableDesignForm.jsx — keeps action buttons in the input card while result cards follow it.
pages/gable/GablePricingPanel.jsx — optional actions-only presentation; Summary behaviour unchanged.
No obsolete files are introduced or retired. RoofPlanDiagram is not included. No quantities, costs, weights or manufacture dimensions are changed.

Validation: 160 lightweight regression checks passed; React handler checks passed for field/buttons, delivery/save/reopen, Summary parity, jobs/book/checklists and result card order. JSX transformed successfully. New customer-plan SVG rendered and visually inspected. Full Windows CRA build and real browser mobile layout require your check.

Suggested regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/gableManufactureSchedule.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

Remote check: enter a known Gable roof, press Quote, confirm Plan preview comes first and Your price second. Check subtotal/gross against Summary and send the updated result screenshot for any final spacing tweaks.
