Timberlite Schedule selection and remembered admin access — v277

INSTALL (v276 already installed)
1. Merge src into your existing quoteapp-v2/src as usual.
2. Run schedule-update-v277.sql (beside src in this ZIP) once in Supabase SQL Editor.
   This updates the v276 setup; do not run the old setup afterwards because it defines the earlier save function.
3. Open Jobs and tick Include in Schedule for each real order. Then open Schedule.

CHANGES
- All existing and future converted jobs default to NOT included. Testing a conversion no longer adds an order to Schedule or its headline totals.
- Each Jobs row has an Include in Schedule checkbox. Selections are saved to the database, not just this PC.
- Unticking hides a job and removes its contribution to all Schedule totals. Its job, manufacture book, saved Schedule notes, deposits and payment figures remain intact. Ticking again restores those saved Schedule details.
- Manual Schedule orders remain present. Existing saved linked Schedule entries remain stored but hidden until their app jobs are explicitly included again.
- The migration does not delete any customer, job or Schedule record. Re-running it does not reset later selections.
- Included jobs with no date appear under Unscheduled; dated ones appear in their delivery month.
- Job selection updates only schedule_included and the job's updated timestamp. It does not recalculate prices, modify the design or turn the job back into a quote.
- A stale selection made in another window is rejected rather than silently overwriting it. Refresh Jobs before trying again.

ADMIN ACCESS
- After the next successful Schedule read or selection, the already signed-in saved admin identity is remembered separately on this browser. Reopening the app in its normal admin mode can reuse that verified identity if the ordinary customer login is absent.
- The server still verifies the active admin account on every Schedule read/write/selection. The local device admin flag alone never invents a login or grants database access.
- If you are still signed in from v276, simply opening Schedule after this update establishes the remembered identity. If not, sign in once using the saved admin account and open Schedule.
- Explicit Sign out clears the remembered Schedule identity. Public/trade mode cannot use it. If the admin code changes or the account is disabled, the server rejects it and a fresh valid login is required.
- This uses the existing app login-code system; full production customer-facing authentication remains separate future work.

VERIFICATION
Actual-source checks passed for selection defaults, hidden linked records, manual rows, totals, include/remove/reinclude retention, design-patch preservation, remembered verified login, public/trade rejection, credential revocation, explicit logout, actual Jobs checkbox success/error/stale/setup paths, Schedule manual save/reopen and source parsing. Customer-directory regression also passed.
A full CRA build, live Supabase execution and visual browser verification were not available here. Run the supplied SQL update before testing the checkbox.
