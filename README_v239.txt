Timberlite v239 - regular Hipped Lean-To PIR100 sheet pricing
Apply over v238. Copy the included src contents into your app src folder, replacing matching files, then restart using the usual API launcher.

CORRECTION TO PREVIOUS ANALYSIS
There is no 27-pound Summary/footer reconciliation bug in the supplied regular and adjusted roofs. The assistant misread the plastics subtotal of 136.43 as 163.43. Correct arithmetic:
Regular: 489.50 + 467.28 + 136.43 + 101.12 + 83.37 + 443.09 = 1720.79.
Adjusted VH: 489.92 + 461.10 + 136.43 + 101.68 + 83.37 + 500.46 = 1772.96.
The totals calculations have NOT been changed to compensate for this reading error.

ACTUAL FIX
The regular Hipped Lean-To PIR100 row previously used legacy pack/coverage prices and charged a fractional square-metre area despite ordering whole sheets. It now uses the PIR100 price per sheet shown in Materials and charges the whole supplied sheet count, matching the existing Victorian Hipped method. For the supplied six-sheet case at 35.50 per sheet, both routes charge 213.00 for that item.

All order aliases (orderQty/order_qty/qty_order) now agree. Existing saved regular-Hipped PIR100 quantity adjustments retain their original square-metre allowance meaning; the resulting supplied area is rounded up to whole sheets. Supply edits/exclusions retain installed roof weights. Explicit zero sheet prices remain valid; legacy flat/pack settings are fallbacks only when a current sheet price is unavailable.

Scope is the regular Hipped route, including central-boss Hipped designs that use its valid insulation audit. The ordinary Lean-To and other roof-family calculation paths are retained. VH already uses the current PIR100 sheet price and is unchanged. No geometry, member positions, labour, markup, discount or delivery formulas change.

REVIEW
Open/recalculate the dedicated Hipped quote, check Materials PIR100 price per sheet, and confirm Summary Order Qty x sheet price equals the PIR100 line cost. Reopened quotes recalculate with current Materials; previously exported PDFs remain unchanged. Compare against the adjusted VH quote with the same Materials settings. Full net-price equality is not claimed: hip tile ordering, other quantities/supply conventions and the small geometry differences are still to be reconciled.

VALIDATION
- Injected Materials test: current sheet price 35.50 overrides stale legacy pack price 28.50; both Hipped routes order six sheets and charge 213.00.
- Area allowances +/-1, +3 and removal to zero recalculate whole sheets and keep installed weight.
- Exclusion removes cost once and retains installed weight.
- The other material rows, manufacture geometry and installed total weight match the original module exactly in the comparison fixture.
- Order aliases and section/footer reconciliation checked.
- Gable overhang, boss dimensions, book-details save and 34-configuration cross-style regression checks passed.
- Changed source/test files parsed. Full CRA production build, native Jest run, live database/browser and physical manufacture tests were not available in this source-only workspace. Source tests included.
