Timberlite Victorian quote display + admin postcode exception v149
Apply over v148 by merging supplied src files.
Victorian D/O now reuses the Edwardian/Gable result cards: Plan preview first, internal/external dimensions, finished height, pitch, tile/colour, plastics and gutter details; then separate subtotal/VAT/gross price card and31-day validity.
New clean Victorian customer plan follows the same diagram style/size. Accepted Technical/manufacture drawings and calculations are not changed.
Admin can quote/save without a delivery postcode using the existing customer/default distance allowance. Trade still requires postcode plus matching confirmed route. Entering a postcode as admin still requires its route to match; stale routes are not accepted.
Edit-collapse works without postcode for admin. Trade missing-postcode prompt is now outside the closed Delivery tools details and always visible below the buttons.
Unresolved material geometry shows its actual error only, without misleading postcode/customer-loading messages. The3800mm example in the screenshot requires8unresolved jack profiles, so that roof still cannot produce a complete price. Supported smaller Victorian designs retain pricing.
380 calculation checks passed plus actual result ordering/metadata, admin no-postcode price/save, visible trade prompt, shared route checks and existing mocked save/load/role/Edit workflows.
Full browser visual QA/live app build require your local environment. Compile and inspect both result cards; test admin without postcode and trade with/without postcode.
