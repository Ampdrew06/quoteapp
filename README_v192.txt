Timberlite v192 — 5-facet Victorian admin rafter editor

Apply over v191. Back up your source, copy the included src folder over your project src folder, then run your usual compile/deployment.

The admin-only Edit Rafter Position dropdown now covers the 5-facet Victorian: seven physical facets, RB1–RB7. The first and last are the sides; RB2–RB6 are the five front facets. Choose a facet to add/remove internal members, change centres, gap from previous or gap to next, Apply changes or Restore automatic layout.

The wall truss, boss truss and hips remain locked. Rear trusses are shared between the side facets; side jacks and front-facet supports are independently positioned. Restoring a side resets shared rear-truss spacing and that side’s jack positions, preserving the opposite jack override and the front facets.

All five front facets retain hip-connected jack rafters. Manual positions at the facet centre, including rounded centre entries, are rejected because they would connect directly to the boss, which has no room for additional members. Six hips remain fixed. The current 3-facet boss-rafter behaviour is retained for the 3-facet style.

Applied positions feed the existing CAD, member profiles/counts, timber, ringbeam slots/upstands, insulation, fixings, Summary and manufacture calculations. Existing provisional manufacture conventions remain in place. Saved, updated and copied quotes retain all facet edits. The two Victorian styles retain their separate drafts and quote families. Fresh designs clear overrides, and trade accounts have no editor.

Verification: all five changed sources pass Babel transformation; existing and new five-facet geometry tests; real selector and numeric callbacks; shared trusses, independent side supports, jack-only front geometry and direct-boss rejection; material and hardware counts; D/O state/persistence and rendered CAD; manufacture and Summary rendering; actual Save/Update/Save as New and reopen; exact automatic geometry comparison with v191 across 12 combinations covering both Victorian styles; 3-facet editor/geometry/save, Gable/Hipped editor and pricing regressions.

A full local React compile and deployed browser/live cloud checks were not available here. Please compile and run your normal visual/save-reopen check. Suggested test: edit front and side facets on a 3800 × 4200mm five-facet roof, confirm six hips and only hip-connected front jacks, compare CAD/Summary/Idiot List/Manufacture Book, save/reopen, then restore. Confirm 3-facet drafts remain separate and a trade login has no editor.
