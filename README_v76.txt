Timberlite v76 — Gable site fixings
Apply over v75. Copy the included src folder into quoteapp-v2 and replace the included files.

Eight 150mm concrete screws per Gable roof, priced by consumed quantity using the saved concrete_screws_price_per_box divided by concrete_screws_units_per_box (default 100). At £19.61/100: £1.5688, displayed £1.57.
No saved box price is overwritten by this update. Materials now labels the full-box price and exposes the pack quantity.
Front barges/dry verge, steel ridge cap and ventilation strip fixings are covered within the existing tile screw allowance. LiteSlate polycarbonate strips use ridge tile fixings. No extra accessory fixing rows or charges.
Existing Add Items concrete screw option remains a full box, now explicitly labelled. Existing Lean-To/Hipped automatic quantities are unchanged; no automatic concrete-screw row was found in their shared model during this check.
Gable remains read-only; Summary, quoting, manufacture and loading integration is the next stage. Installed screw weight remains unconfigured; no full box weight is added.

Files
Gable miscellaneous calculation/test — confirmed site allowances and pricing regression.
GableDesignPreview — removes empty outstanding-fixings heading and updates cost explanation.
materials.js — 100-screw default and persistence whitelist.
Materials.js — full-box price and quantity entry.
summaryAddedItems.js — full-box label clarification only.
No files removed or retired. RoofPlanDiagram is not included.

Validation: 144 lightweight Node regression checks passed; actual Gable module/UI checks passed and two SVG drawings rendered. A full CRA build and actual Jest cannot run in this partial workspace.
Local tests:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableMiscellaneousAudit.test.js src/lib/Calculations/summaryAddedItems.test.js src/lib/Calculations/summaryMaterialsModel.test.js
Confirm clean compilation and review the Technical Gable miscellaneous table.
