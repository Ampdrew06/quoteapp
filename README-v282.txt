Schedule entry shortcuts and customer order history — v282

INSTALL
Merge src into your existing quoteapp-v2/src as usual. NO NEW SUPABASE SQL is required. Keep the current working v279 database setup.
This update does not rewrite, import, migrate or recalculate your saved 2026 entries.

SCHEDULE ENTRY
- Changing Net sell automatically calculates Total sale including VAT, rounded to pennies. Manual orders default to 20%. An app job's explicit saved VAT rate (including zero) is retained when available.
- Opening an existing order does NOT recalculate its gross price. Changing unrelated fields or saving without changing net sell preserves the stored total. An explicit Refresh details from saved job also retains the source job's recorded gross price.
- Gross is displayed read-only because it now follows net-price edits. The Set total using 20% VAT button and the crossed-out cost-helper block are removed. Record balance paid in full remains.
- Tile system and colour are now dropdowns. Britmet and LiteSlate use the app's established colour lists. Historical Metrotile/Tapco system names can still be recorded; this does not enable or change roof pricing for those systems. Other / saved description allows older free-text descriptions to remain available.
- Existing tile strings are not rewritten merely by opening or saving an order. Known names/product IDs are recognised for display. An older colour not in the standard dropdown is retained as a selectable saved value.
- Vent requirements is now labelled Glazing requirements. The existing saved vent field is retained internally, so all earlier notes survive.

CUSTOMER ORDER HISTORY
Choose Customers, select a saved customer, then open Order history.
- All years is the default. A delivery-year selector provides year-by-year figures.
- Shows roof count, net spend, VAT, gross spend, outstanding balance, overdue balance and average net roof price, plus the underlying orders.
- Uses the same saved Schedule records as List, Calendar and Sales. It does not add a second set of manually-maintained customer totals or apply current Materials prices.
- All years means all available saved Schedule history, including undated orders; it does not invent earlier lifetime history not yet entered. Year views use delivery date, matching Sales.
- Cancelled/archived manual entries and app jobs not included in Schedule are excluded.
- Gross outstanding is reduced by deposit plus other payments once per order. Paid orders do not remain overdue. Credits/overpayments on one order are not automatically allocated to another.
- Missing prices are flagged as partial totals. A failed data load shows an error instead of substituting empty/zero financial figures.
- Saved customer ID takes priority. For older manual rows with no ID, an exact, unique name or customer-code match is used, ignoring case and repeated spaces. Duplicate or unmatched names are not guessed. A review section identifies unassigned orders so their customer can be selected in Schedule.
- Merely viewing customer history does not alter an order or save name-based links. Selecting a directory customer in the Schedule editor is the way to persist a link.
- Refresh orders reloads the saved Schedule data. The Details tab and existing customer fields/import/favourites remain available.

VERIFICATION
Actual-source checks passed for VAT calculation/rounding/zero rates, preservation of stored prices and tile descriptions, tile dropdown changes, retained glazing data, customer-ID matching and unique-name fallback, ambiguity review, year/all-years totals, payment/deposit handling, excluded/cancelled/archived rows, history load/error display and profile-tab controls. Existing Schedule save, List layout and customer-directory checks also passed.
Full CRA build, live Supabase execution and browser visual verification were not available in this source-only workspace.
