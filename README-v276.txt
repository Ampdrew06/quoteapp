Timberlite Schedule v276

INSTALL
1. Merge this ZIP's src folder into your quoteapp-v2/src as usual. This is cumulative with v275 and the earlier roof updates.
2. Run schedule-setup.sql once in your existing Supabase SQL Editor. The customer-details migration from v275 must already have been applied.
3. Sign in using the saved administrator account, then open Home > Schedule (also in the admin navigation tabs).
   Schedule requires an actual active admin record in Customers with a nonblank login code. A browser-only admin role or fallback demo account is not sufficient. Re-sign in if your browser holds an older account without its saved login code.

FIRST VERSION
- Main monthly Schedule only; purchasing/history/charts tabs remain future work.
- Previous/next month, month picker, This month and Unscheduled; future dates do not need months created in advance.
- Converted app jobs appear automatically. Quotes that are not converted do not appear.
- App job fields initially use saved values, never current Materials prices. Fields unavailable in a saved record remain blank. Confirm net cost includes materials, labour AND delivery before relying on contribution.
- Edit a row using its customer button. Its first save creates one linked Schedule entry; later saves update it. Concurrent saves are checked to avoid overwriting another update.
- Delivery dates, financial/status changes here are Schedule-specific; they do not modify quote records, requested dates in manufacture books or roof geometry. Refresh details from saved job explicitly when required; payments/status remain.
- Add manual order for roofs designed outside the app, select a directory customer or type a customer name. Existing entries/job numbers are checked to avoid duplicates. A manual number does not reserve the next automatic app job number: continue using your usual numbering sequence when converting app quotes.
- Manual orders are not manufacture jobs/designs. Do not add a separate manual entry for an app job already shown.
- A manual order and app job with the same number, customer name and reference share one displayed row; saving links the entry to the app job. Conflicting details are left separate with a warning, not silently merged.
- All entries persist in Supabase, not just this browser. No historical spreadsheet data has been imported and no existing customers/jobs are changed by this setup.
- Archive or cancel rather than delete. These remain available via Show cancelled / archived and are excluded from totals. Archives keep their job numbers reserved.
- CSV exports the visible view (not a substitute for database backups).

FIGURES AND COLOURS
- Delivery month/year determines the monthly/annual totals, not order or invoice date. Undated orders are in Unscheduled and all-outstanding but not annual sales. These figures are order-based estimates, not recognised turnover or an invoice ledger.
- Sales, net cost, contribution and labour exclude VAT. Net cost includes labour and delivery; the Labour display is informational, not deducted twice. Contribution = discounted net sell minus net cost. Margin = contribution/net sell, and the headline margin uses combined contribution/combined sales for rows with known costs.
- Balances, deposits and other payments include VAT. Enter cumulative amounts actually received; Other payments excludes the deposit. Balance is max(0, gross sale - deposit - other payments). Credits/overpayments are visible on each row/editor and are not deducted from other orders.
- No automatic VAT assumption for saved jobs. Manual entry has an explicit Set total using 20% VAT button; otherwise enter the actual gross total.
- Blank prices/costs remain unknown; missing amounts are omitted with a warning. Average roof price uses rows with known net selling values only.
- Undelivered = yellow. Delivered and due date earlier than today = red. Delivered and due today/future = purple. Fully paid = green. Delivered without a due date or unknown gross price = amber for review. Status Complete is available separately from Scheduled.
- Invoiced and Book done have separate yes/no indicators. Vent, A-frame and REGS are free text for your reminders. No deposit bookkeeping/application workflow or automatic payment-term rules has been inferred.
- Month totals are not changed by the search filter. Cancelled/archived entries are excluded. An incomplete-price/cost warning is shown rather than inventing financial values.

ACCESS / VERIFICATION
- New table has RLS enabled and no direct access for anon/authenticated clients. Dedicated database functions check the EXISTING saved active admin login code before every read/write. Never put a Supabase service-role key in the app.
- This uses the current app's login-code model; it does not replace that model with full production authentication. The broader customer-facing access/security review is still required before public release.
- Automated tests run against actual source with mocked React/database, including totals/colours/deposits, save/reopen adapters, duplicate checks and routing. No full CRA build, live Supabase execution or browser visual verification was possible from the supplied source-only project.
