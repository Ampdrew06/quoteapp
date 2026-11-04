Cumulative update including v269 and previous changes. Stop the local development app, merge the entire src folder into quoteapp-v2/src (replace matching files), then restart using your usual launcher and refresh the browser.

Fix: the Double Hipped Edwardian page and plan wait for the member layout before accessing hanger details. A valid outline from the older geometry module no longer crashes the new page during partial updates or hot reload. The member editor stays disabled until the layout exists.

Verification: reproduced the exact v269 hanger error with the older geometry response. Fixed-page checks pass for that response, blank dimensions, valid dimensions, cleared projection, invalid member inputs and Reset. All 30 member-layout cases and editor handler checks still pass. Full CRA build/live browser not available in this source-only workspace.
