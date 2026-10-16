Timberlite Edwardian / Victorian trade access v146
Apply over v145 by merging the supplied src files.
Home now opens Edwardian and Victorian D/O for trade as well as admin logins. Home selection still starts fresh.
Victorian D/O now permits trade users; navigation already limits trade to Home and Design/Options. Summary, manufacture, Technical, checklist and admin tabs retain their existing admin gates.
Trade forms use the logged-in customer ID/name and its discount/default mileage, including the session customer while customer records load. A stale admin-selected customer does not become the trade quotation customer. Conflicting active quote identities are cleared on restoration.
Victorian hides the customer selector, admin front-pitch label and manual mileage override, admin Summary/cost commentary and advanced Technical instructions from trade view. Quote/save/reset/delivery lookup and customer price remain available.
No pricing formula or geometry changes. Other styles unchanged.
371 calculation regressions passed plus actual component checks for both trade forms, own-customer/discount binding, matching Victorian trade price, hidden admin controls, Summary gates, fresh/reset/save/reopen flows.
Compile locally, log out of admin and log in with a trade test customer. Choose Edwardian or Victorian from Home and test quote/delivery/save. No live login/database changes were performed here.
