Timberlite Schedule tabs and printable delivery calendar — v278

INSTALL
1. Merge src into your existing quoteapp-v2/src as usual.
2. Run schedule-update-v278.sql once in Supabase SQL Editor. It is beside src in this ZIP.
   This update assumes the v276 Schedule setup and v277 selection update have already been run. Do not run the older setup files afterwards.
3. Open Schedule. List is the default tab. Included jobs and existing manual orders are retained.

LIST
A simpler list: customer, reference, job number, roof style, delivery date, book done and invoiced. Dated orders are sorted earliest first, with job number as a tie-breaker. Search and the Unscheduled view remain. Click the customer to open the full order editor, including prices, payments, production status and reminders.
The Include in Schedule checkbox on Jobs still selects real orders and keeps test conversions out. Unticking preserves saved details and excludes the job from List, Calendar and Sales.
CSV export remains an administrator export of the selected rows including the existing financial columns. Use Print calendar for the staff copy containing no prices.

CALENDAR
- Monday–Sunday monthly grid, previous/next month, month picker and This month.
- Shows active dated orders only, with customer / reference / job number. Cancelled, archived, undated and unselected app jobs are omitted.
- Past dates containing deliveries are green. Today and upcoming delivery dates are pale red. These are date indicators: they do NOT mark orders delivered or change any saved payment/production status.
- England/Wales bank holidays for 2026 and 2027 default to yellow. Dates checked against https://www.gov.uk/bank-holidays on 5 November 2026. Other years and any extra local closures can be marked manually. There is no invented automatic holiday recurrence for unverified years.
- Click a day number to edit its note, bank-holiday marker and colour. Add staff leave, workshop closures or other text. Colours: automatic, green, pale red, yellow, pale blue, grey and white. A manual colour takes priority over automatic holiday/delivery colours.
- Save day stores notes and colours in Supabase, shared between your admin browsers. Editing does not change roof dimensions, jobs or money. Cancel discards the day edit. Clear notes and restore automatic colour must also be saved to persist.
- A conflicting edit from another window is rejected. The unsaved note remains visible so you can copy it before refreshing.
- Leaving the calendar/month or navigating away prompts if a day editor is open. Printing is disabled until the day edit is saved/cancelled and saved notes have loaded. If another print control is used while notes are unavailable, a warning is printed rather than silently claiming a complete staff copy.

PRINT
Choose Calendar, then Print calendar. The print stylesheet requests A4 landscape and hides app navigation, controls, order editors and all financial information. Enable Background graphics in your browser's print settings to include colours; disable browser-generated headers/footers if you want a cleaner sheet.
The calendar includes the month, prepared date, deliveries and saved day notes. All text is retained. Busy days or long notes expand the grid and can require more than one sheet; there is no hidden overflow or truncation. A3 landscape or a smaller browser print scale can help for a crowded month. Browser printer settings may override the requested page size/orientation.

SALES
Select a delivery year independently of the monthly List. The top line contains net sales, VAT and gross sales. Below: average roof value, labour, materials, delivery, combined net cost, contribution, deposits and outstanding balance.
All totals use the selected delivery year and exclude cancelled/archived orders. They are order-based estimates, not invoice-ledger turnover. VAT is recorded gross minus recorded net, not a new 20% assumption. No historical spreadsheet data has been imported.
Older saved orders may lack separate component costs. Unknown values are flagged as partial; they are not guessed from current Materials rates. The order editor now has separate materials/delivery-cost fields alongside labour. Those components are already inside the combined net cost; they are not subtracted twice. An explicit button can set combined net cost from the three entered components. Blank components must be entered (including an explicit zero where applicable) before using it.

TO ORDER
Placeholder tab only, ready for the purchasing layout to be agreed later.

VERIFICATION / LIMITS
Actual-source tests passed for 4/5/6-week calendars, leap years and Monday alignment; delivery/holiday/custom colours; cancelled/archived omission; year net/VAT/gross/component/partial totals; calendar day load/save/concurrency-error retention; List columns and tab switching; staff calendar excluding prices. Existing manual-entry/save/reopen, inclusion controls and remembered-admin tests passed.
This supplied project is source-only. A full CRA build, live Supabase execution, browser visual review and a physical print test were not available here. Please review the first print preview after installation before handing the calendar to staff.
