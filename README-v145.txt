Timberlite Victorian D/O form continuity v145
Apply over v144 by merging the supplied src files.
Home > Victorian starts fresh: blank dimensions, reference/postcode, quote hidden, active saved record detached. Tab returns and Quotes > Edit retain the design. Fresh route state is consumed as on Edwardian.
Matches Edwardian input ordering, sizing, heading/introduction, configuration box, customer selector and three main Quote / Save(Update) / Reset buttons. Delivery lookup/manual override and New Quote remain under Delivery and quote tools. Quote still automatically looks up a missing route.
New default gutter is Square, matching Edwardian. Saved gutter/options are preserved.
Maximum finished height uses the existing shared height solver,5mm buffer, and propagates resolved pitch to geometry/audits/Summary/book/checklist. Editing pitch clears the height constraint. Standard135-degree roof only; adjusted angles with this constraint require review.
LIMITATION: independent side soffits and front-pitch override are not yet supported by the Victorian geometry/material audits. Their matching form controls are disabled and marked pending. They cannot silently produce a quotation. Victorian currently uses one soffit setting for all five facets; the existing standard-board/specified-envelope basis remains available.
371 calculation checks passed plus actual form, fresh-vs-return state, admin gates, compact checklist, saved-book draft, mocked delivery/save/reopen/job-routing checks.
Full app compilation and browser visual QA need your local environment. Test Home > Victorian (blank), tab return (retained), Quotes > Edit (retained), and D/O vs Summary after setting max height.
Existing no-height Victorian prices/geometry and other roof-style forms unchanged.
