Timberlite v242 — PIR50 and factory consumable consistency
Apply over v241. Back up your local src folder, merge the included src folder, then restart with your usual API-enabled launcher.

Changes to Victorian Hipped Lean-To
1. Ringbeam PIR now includes two 185mm faces per clear bay, matching the established regular ringbeam builder. Previously this route allowed only one face. This increases its PIR50 area and installed weight appropriately; timber pieces/cuts do not change.
2. PIR50 cost uses its area allowance (including the configured waste), at the current Materials per-m2 rate. Whole sheets remain the Order Qty. This follows the regular Hipped PIR50 area-cost policy. PIR100 keeps the separate whole-sheet pricing introduced in v239.
3. Existing saved VH PIR50 adjustments still represent whole sheets: each +1 adds one sheet-area allowance to cost and ordering, without changing installed area or weight. Exclusions retain installed weight.
4. Added missing 32mm factory drywall screws: 28 per actual ordinary joist hanger, prorated from the configured box price/quantity. No invented price or pack size. Missing rates/pack sizes are shown as unconfigured. These screws are excluded from the loose delivery checklist.
5. Staples use the selected ringbeam PSE cutting runs, matching the regular Hipped basis, rather than the longer external ply perimeter. The shared 20-staples/metre rule remains unchanged.
6. Technical identifies both PIR faces and shows hanger drywall screw consumption.

6200 x 2450 comparison, front15/requested side27.7
Victorian ringbeam PIR area changes from 1.88478 to 3.76956 m2, matching the regular route's ringbeam area. Both routes order five PIR50 sheets. Both now count 140 factory hanger screws and 367 staples in this comparison. Current Materials rates determine the actual prices.

Not yet reconciled
The routes still use different cradle length datums (manufacture/internal profiles versus frame-line extensions), PIR100 member-width assumptions and PIR50 waste application conventions. Regular applies cradle waste before adding ringbeam PIR; Victorian applies its waste to the combined net area. Therefore five sheets on each does NOT establish identical consumed areas or final prices. The concrete-screw allowance also needs checking between routes. These are the next audit items, rather than reasons to force prices to match.

Preserved
Regular Hipped calculations are unchanged in this release. Victorian roof geometry, bosses, manual rafter layouts, ringbeam slot/cut drawings, timber rows, main/hip tile rules and all other existing miscellaneous rows remain unchanged, apart from the explicit changes above. Saved quotes reopen with the current calculations; save again when refreshing their stored pricing snapshot.

Validation
Source-level checks cover both PIR faces; area pricing and whole-sheet ordering; positive, negative, excessive and invalid saved adjustments; exclusions and installed-weight retention; hanger screw rates and missing pack configuration; factory-only checklist filtering; and section/footer totals. All nine end configurations and actual Technical component output checked.
Before/after model comparison confirmed unchanged regular model, Victorian geometry, all ringbeam pieces/cuts and all unaffected Summary rows. v241 covering, v240 starter, v239 PIR100, v230 manufacture order and v231 book-details persistence checks passed.
Native CRA build, browser rendering and physical manufacture checks were unavailable in this source-only workspace. Included Jest tests were not run using native Jest.
