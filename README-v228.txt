Apply over v227 by replacing the included src files.

SAVE AND REOPEN
After obtaining a complete quotation, enter a Customer Reference and click Save Quote on Design/Options. Successful saving displays the quote number. The button becomes Update Quote. Open the roof again from Quotes; jobs open their current Manufacture Book from Jobs. Save as New Quote creates a separate quote number. New Quote starts blank; Reset restores the opened saved quote (or clears an unsaved design).

WHAT IS RETAINED
The complete input data is stored: dimensions, pitches and side choices, measured facet lengths/angles/tolerance, manual rafter-position arrays, ringbeam joint method, soffit controls, book details, delivery postcode/mileage, labour-day override and all six Summary adjustment/exclusion states. Pricing and Materials snapshots are stored with the quote. Updating an existing job preserves its status, job number, requested date, delivery address and order notes.

FUTURE BOOK UPDATES
The stored design contains inputs, not a frozen SVG/PDF. Reopening uses the latest installed manufacture-book code, so future presentation/layout updates apply to existing quotes. Manual rafter positions are restored as saved. Deliberately applying changed facet geometry still resets manual rafters, as the facet editor already explains. A previously exported PDF remains unchanged; generate a new one for the latest layout.

LOCAL TESTING
Use the with-api launcher and localhost:3000 as before. Saving writes to the configured Supabase quotes database, just like the other styles. It is persistent saving, not only this browser's draft. No external data was written during assistant testing.

VERIFICATION
Mocked API round-trips preserve the measured roof and manual rafter positions. Checked create/update/new copy, job metadata, failure retention, the actual D/O Save/New button callbacks, Quotes and Jobs navigation, reopening with current geometry, module parsing and prior manufacture numbering/quantity regressions. The nine numerical roof baselines remain unchanged. A real Supabase save/reopen and full Windows production build must be confirmed in your environment.
