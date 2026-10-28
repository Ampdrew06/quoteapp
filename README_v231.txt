Timberlite v231 - Victorian Hipped Lean-To book details persistence
Apply over v230: close the local app, extract this ZIP and copy the included src contents into your app src folder, replacing the matching files. Restart normally with your API launcher.

Save draft book details now updates the opened saved quote. For converted jobs the button reads Save job details and saves the same job record. Delivery date, delivery/install/collection, address, contacts and special instructions are retained on reopening. Job lifecycle and pricing are preserved. Unsaved roofs still keep a local draft until Save Quote is used.

Open the saved roof, re-enter any previously lost book details, click Save and wait for the saved-to-quote/job message. Navigate Home and reopen it to confirm. Details already lost cannot be recovered by this patch.

Checked with injected database save/reopen tests for quotes and jobs, conversion, failure reporting and preservation of design/manual rafters/pricing. Manufacture book section-order and quote-saving regression checks passed. Full CRA production build and real database/browser interaction were not available in this source-only workspace. No database/schema changes are needed.
