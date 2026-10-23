Apply over v173. Copy src into project src, including lib/customerListOrder.js. No dependencies/database changes.

Customers table is always alphabetically ordered by name, case-insensitively, including after save/edit. A star button marks/unmarks favourites. Dropdown customer lists loaded through getCustomers (all existing roof D/O forms) put favourites first, then other customers; each group is alphabetical. Existing special Retail options remain in their established position. Customer IDs, names, login, discounts and selected quote customer are unchanged.

Favourites persist in this browser/profile only under quoteapp_favourite_customers_v1; they are not new Supabase customer fields and do not sync between devices. The Customers page states this. Selecting/unselecting emits the existing customer refresh event. Fallback lists are sorted consistently too.

Validation: alphabetical order, case handling, favourites priority, table alphabetical override, persisted star toggle, immutable source list and syntax checks passed. Existing Gable/Edwardian/Victorian save/update component checks passed. Please compile and verify a star, D/O dropdown order and page refresh locally.
