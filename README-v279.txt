Schedule manual-save corrections — v279

INSTALL
1. With your current manual entry still open, run schedule-update-v279.sql once in your existing Supabase SQL Editor. It is beside src in this ZIP. Requires the previous v276–v278 setup.
2. Retry Save Schedule entry in the still-open app before changing the source files. If an excluded test job number was blocking it, this database correction allows it to save without retyping the form.
3. Then merge src into your quoteapp-v2/src as usual. This adds the clearer in-form save errors. If the save still fails, copy the typed values before any page reload; the old version does not persist unsaved forms across reloads.
Do not re-run older setup files after this update.

WHAT WAS FOUND
- A failed save left the form open, but the error appeared above the editor, potentially outside the visible screen area.
- The database rejected a manual job number if any converted app job used it, including excluded test jobs. A unique index also reserved numbers held by saved excluded-test Schedule rows.
- Native browser input validation could prevent the submit handler from running without showing the app's own save error.

CHANGES
- Failed-save messages now appear directly above the Save button, headed Entry not saved, with focus brought to that message. Inputs remain intact on failure. A successful save closes the editor and shows the saved row; until then the unsaved-edits prompt remains appropriate.
- The form uses the existing explicit app validation instead of allowing native browser validation to silently stop submission. Non-negative numeric values, dates, customer names and Delivered/status consistency are still checked.
- Excluded test jobs and their saved linked Schedule entries no longer reserve numbers against real manual orders.
- Duplicate protection remains for manual Schedule entries and other included real app jobs. Archived/cancelled manual numbers remain reserved.
- Save and include operations use the same transaction lock for a job number to prevent concurrent creation/inclusion bypassing the duplicate checks. The old over-broad number index is removed; the separate unique source-job link remains.
- Attempting to include a different test job whose number is used by a real Schedule order is rejected with a clear message. Matching manual/app customer and reference pairs retain the supported linking workflow, unless two separate saved records need review first.
- No job, Schedule row, note, deposit, payment or roof design is deleted.

VERIFICATION
Exact values from the reported Glazerite / Hutchinson / job 701 screenshot pass validation. Actual UI handlers were checked for failed-save visibility and retained input, followed by a successful mocked save and correct Calendar placement on 9 November 2026. Existing manual save/reopen, Calendar, admin-session and job-selection checks passed.
Live Supabase execution and a full app/browser build were unavailable. The screenshot does not show the original server error, so the precise live cause remains unconfirmed. If another error remains after this update, the in-form message will identify it rather than appearing above the visible form.
