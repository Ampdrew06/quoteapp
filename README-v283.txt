Editable admin calendar and CB/RS leave balances — v283

INSTALL
1. Merge src into your quoteapp-v2/src as usual.
2. Run schedule-update-v283.sql once in Supabase SQL Editor as a New query. It is beside src in this ZIP. This assumes your existing v279 setup is working. Do not re-run older setup scripts afterwards.
3. Open Calendar and Refresh if needed. The whole day box is clickable. The date button also remains keyboard-accessible.
No job, payment, customer, existing day note or colour is deleted by the SQL update.

DAY EDITING
Click anywhere in a day to open its editor. The editor scrolls into view. Change day colour, bank holiday marker, notes and CB/RS leave amounts, then Save day.
The old version only opened from the small date number. Editing still requires saved calendar data to load successfully, so unknown versions cannot overwrite existing notes. Any setup/load error is shown explicitly.
An unchanged editor no longer causes an unsaved-changes warning merely because it was opened. Real note/colour/leave changes still prompt before being discarded. Failed saves retain your input. Concurrent edits are rejected with a review message.

ADMIN VIEW
Default on-screen calendar shows a separate status colour for each roof:
Grey: provisional booking.
Orange: not invoiced.
Purple: invoiced, not due (including the due date itself).
Red: invoice due date passed, with no recorded full payment.
Green: recorded balance paid in full.
Amber: invoice exists but its due date is missing.
A Provisional booking option is available in the Schedule order editor. A placeholder with no job number, reference or style is also treated as provisional. Existing detailed orders remain non-provisional unless marked otherwise.
Calendar invoice colours use Invoiced, payment due date and recorded payments. They do not require Delivered to be Yes. Existing List payment/delivery rules are unchanged.
Mixed statuses on one day remain visible as individually coloured roof cards. Manual day colour applies to the surrounding day, not to the status of each individual order.
Opening a day shows admin order details (style, delivery/invoice status, due date, prices, outstanding balance, glazing and notes). Edit Schedule order opens the existing order editor, where invoice/payment/delivery/date details can be changed. Day notes do not overwrite scheduled orders.

STAFF PRINT VIEW
Staff print view previews the simpler delivery calendar. Print staff calendar always prints that version, even when Admin view is selected.
Printed copies contain customer/reference/job number, staff leave labels, day notes and leave balances. Admin invoice labels, admin order details and money are hidden; coloured invoice-card backgrounds are removed. The original past/upcoming delivery colours and manual day colours are used on paper.
Print landscape with Background graphics enabled. The requested A4 layout is more compact to accommodate leave counters. Dense days/long notes expand rather than truncate and can require more than one page. Review the first print preview locally.

STAFF LEAVE
- CB and RS each start with 25 days for every January–December calendar year, plus bank holidays separately.
- Select No leave, Half day (0.5) or Full day (1) for each staff member in the day editor and Save day.
- Remaining to book = 25 minus recorded leave already taken AND future leave booked. Both figures are shown separately.
- Weekends (Saturday/Sunday) and marked bank holidays do not reduce the 25-day allowance. Bank-holiday markers can be overridden in the day editor. This assumes a Monday–Friday working week.
- Published England/Wales bank holidays are included for 2026–2027. Other years or local closures must be marked manually before relying on leave deductions.
- Full-year day records are loaded, so counters include leave in other months of the selected year. Switching months does not reset them.
- Earlier leave must be entered for an accurate current balance. Free-text holiday notes are preserved but are NOT interpreted as leave bookings; select CB/RS amounts to count them. Carry-over, prior unrecorded leave and different leave-year start dates are not invented.
- Clear day notes and leave resets that day's structured leave as well as notes/colour; it must be saved. It does not delete roof orders.
- Unknown/unavailable data shows a dash rather than claiming that all 25 days are available.

VERIFICATION
Actual-source tests passed for whole-day editing, invoice/provisional/paid/due-date colours, full-year and half-day totals, year isolation, weekend/bank-holiday exclusion, preserved old notes, save/version-conflict retention, admin order drilldown, staff-view switching and print privacy rules. Customer-history and List-layout regressions passed. SQL structure and access/version/leave validation were checked.
A full CRA build, live Supabase execution and browser/physical print verification were not available in this source-only workspace.
