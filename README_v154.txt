Timberlite Home Layout + My Quotes — v154

APPLY DIRECTLY OVER v152. You do not need v153. All v153 source additions are included in this replacement package. Merge the src folder into your app, replace/add the included files, compile and deploy.

Home changes follow Home Page Suggestion.png:
- Compact existing logo, login in the header, New Quote and Saved Quotes/My Quotes navigation.
- Desktop arrangement: Lean-To / Hipped Lean-To / Victorian Hipped Lean-To; Gable / Edwardian / Double Hipped Edwardian; 3 Facet Victorian / 5 Facet Victorian / Edwardian-Victorian; two wider P-Shape plans beneath.
- Roof outline/ridge/rafter illustrations revised to follow the supplied drawing. These are Home illustrations only; pricing/manufacture geometry is unchanged.
- One click on a working roof goes directly to its D/O page. The selection panel and Enter Dimensions step are removed.
- Six unfinished shapes remain visible but disabled with Coming soon labels.
- Narrow screens reflow to two columns, with wide P-shapes spanning the row.
- Admin footer tools are rendered ONLY for admin accounts. Trade/public do not receive these tools.

Includes all v153 My Quotes work:
- Trade recent quotes on Home, full searchable /my-quotes page, and My Quotes links on each roof style.
- Queries filter customer_id; returned rows and open actions recheck the current account.
- Saved quotes reopen in all five working styles. Converted jobs are status-only. No trade conversion/deletion added.
- Admin keeps the full Quotes list. /quotes guards ordinary trade/public access.
- Lean-To/Hipped saves bind the signed-in trade customer and reject foreign active-record updates.
- Old quotes without a matching customer_id cannot be assigned automatically by name.

Existing release limitation: customer-code/localStorage login is not Supabase Auth. These account filters support normal testing but are not database authorization. Authenticated ownership policies remain necessary before private quote access is released externally. No schema/authentication changes are included.

Checks: actual Home/component handlers pass for all working/future routes, direct opening, role-specific links, admin-only tools, own quote opening across all five styles, foreign record refusal, query errors, account switching and route guards. 13 shared Lean-To/Hipped save callback checks pass. Components/routes parse successfully. This source-only workspace cannot perform your full application build, live database writes or browser layout verification.

Please check desktop/mobile layout, direct roof opening, trade My Quotes save/reopen/update, and admin-only footer visibility after deployment.
