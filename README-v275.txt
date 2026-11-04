CUSTOMERS UPDATE v275 - cumulative, includes v274 and all previous updates.

INSTALL
1. Merge the entire src folder into quoteapp-v2/src, replacing matching files. The app should hot-reload; refresh/restart if needed.
2. In your existing Supabase project, open SQL Editor, paste the contents of customer-details-migration.sql and Run it once. It adds details_json for contact/address/trading defaults and permits directory entries without a login code. It does not delete customers or change existing IDs, roles, credentials or discounts. No live schema or customer data has been changed by this delivered bundle.
3. Open Customers > Import customer list. Choose customers-import.json from this package. Review the proposed additions/updates and their details, untick anything unwanted, then click Import selected customers.
4. Review the held rows separately and set discounts for new customers as appropriate. Existing discounts are preserved; new customers start at 0%.

Keep the import JSON local: it contains your customer data and is not app source. Do not copy it into src/public or commit it to GitHub.

CUSTOMER DIRECTORY
Searchable customer list on the left, grouped details on the right: contacts, main/invoice address, optional default delivery address, trading/payment terms, notes and separate account access/status. Favourites remain attached to the existing IDs. Contact/address/default-spec fields now persist in Supabase rather than being discarded by the old save adapter. An unavailable database blocks administration/import instead of presenting demo fallback accounts as live records. Inactive customers retain their history but are hidden from new picker searches and cannot log in. There is no delete-all or replacement import.

IMPORT
Prepared from Customer Database.xlsx: 129 named entries; four unnamed source rows are not imported. At least 13 rows are held for source review: duplicate account codes/names, do-not-use entries and multiple email addresses. Further conflicts with existing app accounts are held too. Matching uses account code, existing login code as a legacy match, or exact name; conflicting/multiple matches and protected non-trade accounts require review. Sparse blank fields never clear existing values. Existing IDs, names, usernames, login codes, roles, discounts and existing notes are retained. Nonblank source contact/address/terms fields update the matched profile. Supplementary unlabelled spreadsheet fields are preserved for review, not guessed into business rules.

Source Distance means RETURN-TRIP miles. Import stores the original return value and half that value in the existing one-way pricing field (e.g. 100 -> 50; 15 -> 7.5). Unknown remains blank in the profile, not an invented route. Directory distances are admin-only quotation fallbacks. Customer/trade quotation still requires a postcode and matched calculated route. Main/invoice address is not silently used as the job delivery address.

SEARCHABLE CUSTOMER PICKERS
All implemented roof D/O customer controls now support typing by customer name, code or contact, favourite-first browsing, mouse/touch selection and keyboard arrows/Enter/Escape. Unmatched typed text does not create/select a customer or alter the discount. Existing selections and customer IDs are retained.

VERIFICATION
129-row import planning, profile roundtrip, sparse updates, duplicate/conflict/inactive/protected-account holds, IDs/logins/discount preservation, return-mile conversion, strict directory loading, save adapters with mocked database, favourite/search ordering, keyboard selection, admin access gate and parsing of all changed pages passed. Existing quotation save/update and eight picking-list exclusion checks passed. Full CRA build, browser visual QA and real Supabase migration/import were unavailable here. Please complete the SQL step and browser import above to update the live database.

Double Hipped Edwardian work remains paused at the v272 marker, apart from shared changes since then. Schedule and historical order imports are not included yet.
