Schedule List display tidy — v281

Merge src as usual. NO NEW SUPABASE SQL is needed. Keep your working v279 database setup.

- Removed the colour legend and explanatory text above the jobs table.
- Hidden Search, Show cancelled / archived, shown/active counts and CSV export controls for now. The underlying utilities remain available for future reinstatement. Hidden previous search/archive selections cannot affect the simplified List.
- Removed the Actions column. Remove from Schedule remains inside the saved order editor, accessed by clicking the customer.
- The monthly table expands naturally with all rows. It has no internal vertical scrolling box or forced minimum width. Very long text can wrap in other columns.
- Payment status is sized to its text and stays on one line, using Not Delivered/Not Due as requested. Retained the delivery and payment colour rules.
- Corrected the former print rule that hid the last Actions column, so it no longer hides Payment status now that Actions is gone.
- Calendar and Sales calculations, notes, payments and saved orders are unchanged.

Manual removals are still archived, not deleted. Their saved details remain in the database while the archive-view control is hidden, as requested. App jobs can still be included again from Jobs.

Actual-source checks passed for eight columns, absence of the removed controls, all 50 monthly rows displayed in date order, hidden old filters ignored, retained removal inside the editor, and save/Calendar regression checks. Full CRA build and browser visual review were not available here.
