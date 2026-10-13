Timberlite Edwardian Summary / pricing / Idiot List — v104

Apply over v103. Extract this ZIP into quoteapp-v2 (the folder containing package.json), merge src folders and replace the listed files. Your Materials prices are not overwritten. GableDesignForm.jsx and RoofPlanDiagram are not included, preserving your placeholder/font edits.

Edwardian now uses the reconciled model for shared Summary tables, customer-discount quotation pricing and the shared Idiot List. Summary extras, quantity changes and price exclusions persist in the Edwardian design and saved quote. Installed weights stay based on roof geometry. Factory consumption is costed but omitted from loose supplies. Starter adjustments are whole purchased 3m lengths. Timber order displays use whole stock lengths/sheets; insulation Qty shows m² and Order Qty retains sheets/rolls.

Open Edwardian from Home. Its current design/audit screen has quotation details, pricing, Save/Update Quote, Reset amendments, Summary and Idiot List links. Delivery postcode lookup overrides the saved customer default distance. Reopened Edwardian quotes/jobs route to Edwardian rather than a different roof style. Edwardian manufacture book integration and the polished standard D/O form are later stages. The technical audit quantities are base requirements; Summary contains extras and adjustments.

Reset amendments restores the opened saved quote/job baseline. With no opened record it clears dimensions. Restore completed-roof example starts a separate draft, avoiding accidental overwrite of a saved quote.

Local verification: 241 transformed-module checks passed, plus Edwardian Summary/Idiot List/save-update handler checks and Gable/Lean-To UI regression harness checks. This workspace does not contain a full CRA installation; a production build and real Jest should be run on your PC:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/edwardianSummaryIntegration.test.js src/lib/Calculations/edwardianMaterialsReconciliation.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/gableTimberOrderDisplay.test.js src/lib/Calculations/summaryAddedItems.test.js src/lib/activeDesignRecord.test.js

npm run build

Quick check: open your Edwardian example; compare the six Summary subtotals with the base audit; confirm the D/O/audit price matches Summary; add a gutter fitting and +2 main tiles, check the Idiot List; save, reopen, amend, Update Quote, reopen and Reset amendments.

Home Tile Calcs and existing roof geometry calculations are unchanged. Shared Gable Summary rendering, timber order display and quotation handlers are reused; Gable behavior passed the regression harness.
