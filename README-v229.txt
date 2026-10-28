Apply over v228.

USING SNAP
On Design/Options open Edit Rafter Position and choose Facet2 or Facet4. Set Rafter alignment to Perpendicular to ringbeam - snap. Add/move the centres with the existing controls, then press Apply changes. The alignment choice is a draft until applied; it applies to all rafters on that facet. Repeat for the opposite facet if wanted. Update Quote to retain the design.

RESTORE
Restore automatic layout restores both the original alignment and automatic centres for the selected facet. Existing quotes without this setting keep their current automatic arrangement. Facets1,3,5 retain their existing rules. This is a facet-level snap control, not individual mixed direction editing on one facet.

GEOMETRY AND SUPPLY
Snapped members follow the actual ringbeam normal, including measured non135 degree angles. They terminate on the intersected supporting hip; roles and fittings follow the actual connection. Geometry validation, numbered cutting profiles, ringbeam slots, hardware, insulation and costs use the applied member geometry. No hip/boss positions are moved by snap. Rafter editor facet labels now show current R-number ringbeam references.

PERSISTENCE
The alignment map is included in the existing full quote input snapshot, with the manual centres. Save/Update Quote retains it. Applying a new facet outline still clears manual centres as before; the selected alignment is retained for that facet.

CHECKS
Actual geometric perpendicularity and jack classification; jack cuts and48mm normal slots; matching spar/jack hardware; real editor select/apply/add/restore callbacks; all9 end combinations and measured angles; save/reopen map round-trip via simulated API; v227 numbering and v224 D/O regressions. The nine numerical baselines are unchanged when no snap is selected. Changed modules parse and an SVG example was rendered/inspected. Full Windows build, live database and physical fitting remain to be checked in the usual workflow.
