Timberlite Shared Summary Pricing — v26

Apply after v25. Copy the enclosed src folder into quoteapp-v2 and replace matching files.
Do not delete your existing src folder. The development app should update automatically.

The audited Summary calculation is now shared by Summary and Design/Options.
Material pricing is the sum of:
Timber CHARGEABLE cost + Tiles + Plastics + Metal + Guttering + Miscellaneous.
Quantity adjustments and exclusions apply to the material rows exactly once.
The old Lean-To quotation baseline and cached cash-delta reconciliation are no longer used by these pages.
Extras and factory consumable costs are included. Configured zero prices remain zero.
Markup, customer discount and VAT still use the existing pricing helper, after the corrected materials sum.

Overall Totals now explicitly shows Materials total used for pricing (sum of Elements).
The base total excludes timber's chargeable uplift; reconciliation between base and pricing total represents that uplift.
Your supplied six section figures add to £1,415.78 on the chargeable basis.
Confirm this against the live app after applying the overlay, with temporary test extras removed and intended adjustments retained.

Saved quotations retain Summary quantity/exclusion controls and a material-pricing breakdown.
Opening an older quotation without saved controls clears stale controls from the preceding quotation.
Historical saved prices are not rewritten; reopening recalculates the live quotation using current inputs and Materials.

Delivery-distance fallback, labour rules, manufacture-book layout and the hipped Idiot List are not changed in this patch.

Run:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/miscellaneousIntegrationAudit.test.js src/lib/Calculations/hippedLathFixingAudit.test.js src/lib/Calculations/miscellaneousSummaryIntegration.test.js src/lib/Calculations/summaryAddedItems.test.js src/lib/Calculations/summaryMaterialsModel.test.js

36 calculation checks passed here through a Node assertion harness; pure JS syntax checks also passed.
React compilation and CRA Jest need verification in your installed app.

Live checks:
- Sum timber chargeable total and the other five cost totals; compare with Materials total used for pricing.
- Add one lath screw box: pricing material total rises by its Materials price once.
- Exclude that row: its whole adjusted cost is removed once, while installed weight is retained.
- Add/remove a dropdown extra: cost changes once.
- Compare Materials total on Design/Options, then save/reopen and confirm adjustments remain.
- Reset/new quote must not retain earlier extras, quantity adjustments or exclusions.
