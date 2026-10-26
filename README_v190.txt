Timberlite v190 — Gable admin truss position editor

Apply over v189. Back up your existing source and copy the included src folder over your project src folder. Compile and deploy using your normal process.

Gable Design/Options now has the same admin-only Edit Rafter Position dropdown. Choose Facet 1 (Left) or Facet 2 (Right) to open the controls. Both facets share complete trusses: applying positions on either facet updates the whole truss and keeps both sides aligned.

Wall and front trusses stay locked at their existing setting-out centres. Intermediate trusses can be added, removed or positioned by centre, gap from previous or gap to next. Apply changes uses the edited layout; Restore automatic layout clears the manual override. Slot-clearance and boundary checks remain; admin layouts do not require the automatic 400–700mm spacing rule or an extra approval checkbox.

The shared Gable geometry feeds CAD, timber/gusset/chevron/closure counts, ringbeam slots and upstands, insulation, fixing allowances, Summary pricing, manufacture schedule and Idiot List. Saved inputs retain the applied positions for Save, Update and Save as New Quote. Fresh designs start without manual positions. Trade accounts have no editor. Ridge position, pitch, fixed end trusses and roof dimensions are unchanged by the editor.

Verification: Babel transformation of all changed sources; 12 Gable geometry test cases; actual editor and D/O callbacks, persistence effect and Quote/CAD rendering; manufacture plan/page and Summary renders; quantity, bay, fixing and insulation checks; actual save/update/copy callbacks and reopen; exact automatic geometry comparison against v189 across nine sizes; existing Lean-To, Hipped Lean-To, Edwardian editor, saved-quote and steel/slate pricing regressions.

A full React compile and deployed browser/live cloud checks were not available here. Please run your usual local compile and visual/save-reopen checks. Suggested test: move/add/remove intermediate trusses from each facet, Apply, compare the CAD/Summary/Idiot List/Manufacture Book, save/reopen, then Restore automatic layout. Verify a trade login has no editor.
