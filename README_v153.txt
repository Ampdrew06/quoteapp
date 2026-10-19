Timberlite Visual Home + My Quotes — v153

INSTALL
Apply over v152. Merge the included src folder into the app, replacing existing files and adding new ones. Compile locally, commit and deploy as usual. No database schema changes or new dependencies are required for this testing update.

HOME
- Compact existing Timberlite logo and responsive visual roof gallery.
- Five working styles: Lean-To, Hipped Lean-To, Gable, Edwardian and 3-facet Victorian. Choose a card, then Enter dimensions.
- Six indicative, unavailable Coming soon plans: 5-facet Victorian; Victorian Hipped Lean-To; combined Edwardian/Victorian; Edwardian P-Shape; Victorian P-Shape; Double Hipped Edwardian. No new geometry or mirror functionality is implemented by this update.
- New designs detach from saved quote/job identity when a working shape is chosen, rather than erasing a saved design merely by viewing Home.
- Existing trade login retained; minor invalid nested paragraph markup corrected.
- Admin shortcuts include Quotes, Jobs, Customers, Materials and Tile Calc.

MY QUOTES
- Trade Home shows the three latest saved quotes and View all quotes.
- /my-quotes has search, refresh and reopening into all five working styles. Prices recalculate through the existing D/O workflow when reopened.
- Queries specify the logged-in customer_id and select quote metadata/inputs, not admin pricing snapshots. Returned rows are also filtered by account ID and rechecked before opening.
- Account changes immediately suppress any retained rows belonging to another account.
- Trade users have My Quotes in every roof navigation. /quotes now redirects trade/public users into the appropriate guarded workflow. Admin retains its existing full list and management controls.
- Converted jobs are shown as status only; trade conversion/deletion is not introduced.
- Lean-To/Hipped saves explicitly use the signed-in trade account and reject updating an active record owned by another customer.
- Older records without the correct customer_id will not automatically appear in an account list. No ownership is guessed by customer name.

IMPORTANT RELEASE LIMITATION
The existing customer-code login stores account identity and role in browser localStorage. It does NOT establish a Supabase Auth session. Customer query filters and UI guards support normal testing but are NOT secure database authorization. Secure per-account access requires an authenticated identity mapped to customers and server/database ownership policies. This update does not claim to implement or verify RLS security. Complete that authentication work before releasing private quote access to external customers.

VALIDATION
Actual source/component-handler checks passed for Home selection, all fresh routes, disabled future styles, role navigation, scoped customer queries, query errors, account switching, own/foreign quote reopening, all five roof reopening routes and admin list separation. 13 Lean-To/Hipped save checks passed including ownership and foreign update rejection. Gable, Edwardian and Victorian actual save/update checks passed. Changed components/routes parse through Babel. A full app build, browser layout test and live Supabase write were not available in this source-only workspace.

LIVE CHECKS
1. Admin Home: verify logo/plans, five routes, six Coming soon cards and full Quotes list.
2. Trade A: save and reopen one quote for each working style from Home/My Quotes; change a dimension and Update Quote; confirm one record is updated.
3. Log out and log in as Trade B. A's quotes should not appear in normal app use; save B's own quote and confirm it appears.
4. Admin should see both accounts' quotes. Trade should have no Convert/Delete controls or admin list.
5. Check mobile at narrow widths; My Quotes and roof cards should wrap neatly.
