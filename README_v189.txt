Timberlite v189 — Hipped Lean-To admin rafter editor

Apply over v188. Back up your source, copy the included src folder over your project src folder, then run your usual compile and deployment.

The admin-only Edit Rafter Position dropdown now covers Hipped Lean-To. Select the front, left or right facet to edit centres, gap from previous or gap to next; add/remove internal members; Apply changes; or Restore automatic layout for the selected facet. Only existing hipped side facets are listed. Offset, one-sided and central-boss designs are supported.

Wall members and corner/hip-seat boundary positions stay locked. Existing hip/boss geometry and pitch controls remain responsible for hip and boss positions. Moving a front member reclassifies it as a boss rafter, wallplate rafter or hip-connected jack from its current location. Member lengths, spar hooks, hangers, jack hooks/brackets, ringbeam slots/bays, insulation and related material allowances follow the shared geometry. The editor imposes slot-clearance checks, with no additional maximum-spacing approval checkbox.

Applied positions are retained by Save Quote, Update Quote and Save as New Quote and restored with the design. Trade accounts have no editor. Automatic layouts are unchanged when overrides are absent. Restore automatic layout affects only the selected facet.

Verification completed: all 11 changed source files pass Babel transformation; actual facet-selector and numerical input callbacks; D/O apply/persistence/Quote action and rendered CAD; manufacture and Summary renders; shared member role/count/length and metal-quantity checks; invalid-position save/price/manufacture guards; 20 saved-quote callback checks; exact automatic geometry comparison against v188 for eight size/style combinations; existing Lean-To and Edwardian editor, central manufacture, Summary, pricing and corner-brace regressions.

A full local React compile, live cloud interaction and visual browser check were not available here. Please test those in your usual environment. Suggested check: edit each facet on an offset roof, compare CAD/Summary/Idiot List/Manufacture Book, save/reopen, then test central-boss and one-sided designs. Restore each facet and confirm the automatic layout returns. Confirm trade login has no editor.
