Timberlite v240 — Tile starter pricing consistency
Apply over v239. Close the app, back up your src folder, then merge the included src folder into your project. Restart using your usual API-enabled launcher.

Victorian Hipped Lean-To now charges tile starter by metres consumed, matching the established regular Hipped policy. Order Qty remains whole stock lengths. Existing saved adjustments still add/remove whole stock lengths; installed weight remains unchanged. Exclusion removes the charge without removing installed weight.

Scope: two source files. No geometry, hip tile quantities, other material rows or ordinary Hipped calculations changed. Saved quotes use the updated calculation when reopened; save the quote again if you want to refresh its stored pricing snapshot.

Source-level checks passed for consumed-metre charges, whole stock ordering, positive/negative saved adjustments, exclusions, weights and section/footer totals. Compared before/after: every other material row, VH geometry and regular Hipped model unchanged. PIR100, boss-dimension and quote/job book-detail persistence checks also passed. Native CRA build, browser and factory validation were not available in this source-only workspace.

Remaining investigation
In the 6200 x 2450, 15 degree front / 27.7 degree requested side comparison, the regular route calculates 3167.584mm per covering hip and the adjusted Victorian route 3132.086mm. Both already use the same steel stock allocation helper. Its 2.5-tile allowance covers 3135mm (2 full pieces at 1260mm plus a nominal 615mm half). The small length difference therefore changes the order from six tiles to five. This update intentionally does not force those quantities to match. The covering geometry/datum conventions need tracing next.

The routes are close rather than identical geometry: the rounded requested side pitch gives a different boss position; eaves allowance conventions also differ. This finding does not establish which covering length is correct. Half Edwardian/Half Victorian remains pending this reconciliation.
