Timberlite v191 — 3-facet Victorian admin rafter editor

Apply over v190. Back up your source, copy the included src folder over your project src folder, and run your usual compile/deployment.

The 3-facet Victorian D/O page now has the admin-only Edit Rafter Position dropdown. It lists the five physical ringbeam facets: RB1 left side, RB2 front left, RB3 front centre, RB4 front right, RB5 right side. Choose a facet to add/remove members, change centres, gap from previous or gap to next, then Apply changes. Restore automatic layout clears the selected facet override.

The wall truss, boss truss and hips remain locked in this update. Rear trusses are shared between the two side facets; editing them from either side changes both. Side jack positions remain independent. Restoring a side resets shared rear-truss spacing and that side’s jacks, preserving the opposite side’s jack override and the front facets.

Front members retain the established boss-rafter arrangement when aligned with the facet centre and supported by its existing manufacturing method. Other manually positioned members use the actual hip intersection. Wide front facets retain the existing jack-rafter method. Shared geometry drives CAD, member profiles and counts, ringbeam slots/upstands, timber, insulation, fixings, Summary and manufacture outputs. Existing provisional jack cutting conventions remain in place. Applied layouts persist through Save, Update and Save as New Quote; fresh designs clear them. Invalid slot positions or unresolved manufacture profiles are rejected before Apply.

Trade accounts have no editor. The 5-facet Victorian editor is not included in this update; its automatic geometry is unchanged.

Verification: all six packaged source files pass Babel transformation; 13 Victorian geometry test cases; real selector/locked-centre/gap handlers and selective restore; shared side-truss and independent jack geometry; quantities and metal fitting counts; actual ringbeam slots; D/O state, persistence effect and rendered CAD; manufacture and Summary renders; actual save/update/copy callbacks and quote reopen; exact automatic geometry comparison against v190 for 12 combinations covering both Victorian styles; existing Lean-To, Hipped Lean-To, Gable, Edwardian editor and pricing regressions.

A full local React compile and deployed browser/live cloud check were not available here. Please compile and test your normal save/reopen flow. Suggested check: edit each of the five facets, Apply, compare CAD/Summary/Idiot List/Manufacture Book, save/reopen, and restore. Confirm side truss edits affect both sides, side jacks remain independent, and trade login has no editor.
