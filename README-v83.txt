Timberlite v83 — active quotation and manufacture identity
Apply over v82. Copy the included src folder into quoteapp-v2, replacing matching files. No files need deleting. Reopen saved quotes/jobs from their lists after applying this update; legacy last-opened job IDs are intentionally ignored.

New designs clear the previous record identity on fresh navigation. Manufacture pages use the currently opened quote/job, not the last converted job. Draft Gable book details are scoped to a fresh-design identity; old drafts cannot leak into new books. Current design customer/reference remain current. Saved quote numbers appear below the job-number field; unsaved designs have no old job/quote number.

Save Quote becomes Update Quote for an opened or newly saved quotation. Updates write to the existing ID and retain quote number and conversion/job/delivery metadata. Successful saves establish the new saved baseline. Reset restores that last saved baseline, including extras, exclusions, quantity adjustments and other stored settings. A new unsaved design still resets to defaults. Lean-To/Hipped Reset reloads the form to rehydrate all existing input state consistently; Gable restores its input state directly.

Shared lib/activeDesignRecord.js owns identity, baseline restoration, safe design update patches and draft identity. New roof styles should use this same API when loading, saving, resetting and displaying manufacture details. No Supabase schema migration is needed.

Files:
- activeDesignRecord.js/.test.js: shared lifecycle and regressions.
- Quotes.jsx/Jobs.jsx: loading and conversion establish the active record.
- LeanToLanding.jsx: Save/Update and saved-baseline Reset for Lean-To/Hipped.
- LeanToPlanManufacture.jsx/PlanManufacture.jsx: current-record metadata only; no old-job input overwrite.
- GableDesignPreview.jsx/GablePricingPanel.jsx: fresh/reset/update behaviour.
- GableManufacture.jsx/GableJobFront.jsx: record-bound manufacture details and scoped drafts.

Validation: 169 lightweight module regression checks passed. Actual React handler harness passed for updates, reset, conversion/reopen, Summary extras, draft/saved manufacture details and UI. Edited JSX transformed successfully. Full CRA compilation and Jest were not available here; please run locally:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/activeDesignRecord.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryMaterialsModel.test.js

Practical checks: open quote, change tiles, Reset (restores saved tiles); change again and Update Quote (same quote number, no duplicate); start fresh roof and open manufacture (old delivery/job details blank); open converted job (its own details shown); switch back to another quote (no previous job details).
