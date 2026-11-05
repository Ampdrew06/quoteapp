Schedule delivery/payment colours and removal controls — v280

INSTALL
Merge src into your quoteapp-v2/src as usual. NO NEW SUPABASE SQL is required for this update. Keep the working v279 database setup; do not re-run the older SQL files carried in the cumulative ZIP.

LIST CHANGES
Delivery date / status shows the date plus Delivered or Not delivered. The cell turns green only when Delivered is Yes, as chosen in the order editor. Passing the calendar date alone does not change this indicator.
A Payment status column follows Invoiced:
- Yellow: Not Delivered / Not Due.
- Purple: Delivered — Not Due (includes the due date itself).
- Red: Overdue (delivered, unpaid and the due date is earlier than today).
- Green: Paid, so a settled order does not remain red after its old due date.
- Amber: delivered but due date or payment details are missing and require review.
- Grey: cancelled/archived entries, when shown for review.
The colours are accompanied by text labels. Calendar date-based colours remain separate from confirmed Delivered and payment status.

REMOVE FROM SCHEDULE
Each List row has Remove from Schedule. The saved order editor also has the same button.
- App job: unticks Include in Schedule on Jobs, excluding it from List, Calendar and Sales totals. The job, design, manufacture book, saved Schedule notes and payment details are retained. Include it again from Jobs when needed.
- Manual order: archives the saved Schedule entry. It disappears from normal List, Calendar and Sales totals. Select Show cancelled / archived in the relevant month, then Restore to Schedule, to restore it. All saved values are retained; no order record is deleted.
- A matching manual order waiting to be linked to an app job is linked before the app job is excluded, so the manual row cannot unexpectedly reappear on refresh.
- Unsaved changes prompt before removal. Only saved order values are kept by removal. Cancel the removal or save your changes first if they need to be retained.
- A failed operation leaves the row and any open editor available and shows its error. Cancelling the confirmation makes no database change.
- Archived manual job numbers remain reserved, as before. Removal is reversible exclusion, not permanent deletion.

VERIFICATION
Actual-source checks passed for confirmed delivery status, yellow/purple/red/paid colours, due-date boundary, retained amounts/notes after archive/restore, app-job exclusion, pending-manual linking, removal failures and confirmation cancellation, Calendar omission and excluded totals. Existing save-flow and Schedule inclusion/admin tests also passed.
No full CRA build, live database execution or browser visual review was available in this source-only workspace.
