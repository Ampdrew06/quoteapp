Timberlite v188 — Lean-To admin rafter editor

Apply over v187. Back up your existing source, then copy the included src folder over your project src folder. Run your usual compile and deployment.

Regular Lean-To now has an admin-only Edit Rafter Position dropdown. Select Facet 1 to add/remove internal rafters or edit their centres, gap from previous, or gap to next. Edge rafters remain fixed. Apply changes updates the design; Restore automatic layout removes the override.

Applied positions are retained with saved/updated/copied quotes and restored when reopening them. Shared material counts, hardware, diagrams, ringbeam slot/bay setting-out and manufacture member numbering use the applied layout. Overlapping/out-of-bounds slots are rejected. Other roof editors are unchanged.

Verification: Babel source transforms; actual editor and parent callbacks; validation and material quantity checks; manufacture-page rendering and ringbeam slot/bay checks; saved-quote callback suite (17 checks); Summary rendering; existing Edwardian editor and pricing regressions. Full local React build, deployed browser appearance and live cloud save/reopen should be checked in your normal environment.

Suggested check: create a Lean-To, select the editor, move a centre using either gap input, add/remove a member, and Apply. Compare D/O, Summary, Idiot List and Manufacture Book. Save, return Home, reopen, then restore automatic layout. Confirm a trade account has no editor.
