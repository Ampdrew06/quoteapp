Merge the entire included src folder into quoteapp-v2/src, replacing matching files. Restart your usual app launcher. This cumulative update includes v271 and earlier updates.

Double Hipped Edwardian now supports Save Quote, Update Quote and Save as New Quote through the shared quotation persistence controls. Enter a customer reference and complete missing Materials prices, selected-customer details and delivery distance where required before saving. Saved records retain manual member positions, options, supply +/- adjustments, cost exclusions, added items and provisional price-scope flags.

A dedicated Summary page uses the same shared six-element cost/weight layout as the other styles, including extra supplied items, quantity/cost changes, labour, delivery, markup and VAT controls. Summary and Design/Options share the local draft. Reset restores the saved design when editing a saved quote/job; a new unsaved design resets to blank defaults.

Opening saved records from Quotes or Jobs restores the correct Double Hipped Edwardian draft and routes to Design/Options. Updating a converted job preserves its status, job number, dates, delivery address and notes. Save as New creates a quote without inherited job metadata. Manufacture links are intentionally absent until cutting integration is complete.

All saved prices remain provisional roof-package estimates. External valley OSB, EPDM/adhesives, valley starter and rear hip weathering are excluded. Manufacture release is marked pending in the stored pricing record. This update does not claim a complete customer quotation or factory cutting schedule.

Checks: actual save/update/save-as-new handlers exercised with mocked persistence; activation and reopening preserved member edits, summary adjustments, reference and price. Job metadata preservation and new-copy isolation passed. Shared Summary rendering and added-item cost/weight behaviour checked. All 36 material/product/pitch calculations and 30 member-layout cases still pass. Full CRA build, real Supabase writes and live browser verification were unavailable in this source-only workspace.
