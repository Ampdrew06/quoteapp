Timberlite v195 — Victorian Hipped Lean-To hip and rafter review profiles

Apply over v194. Back up your source and copy the included src folder over your project src folder. Compile and deploy using your normal process.

Open Home > Admin tools > Victorian Hipped Preview, or /quote/victorian-hipped/technical. Below the ringbeams/upstands, the preview now displays grouped, dimensioned cutting profiles for four hips and every applied boss rafter, wallplate rafter and jack. The default layout has 17 members grouped into eight matching cuts. Wallplate assembly members are separate and are not included in this schedule.

Profiles use the existing 220mm member depth and 45mm thickness. Foot cuts enclose the actual convex exterior ply footprint across the full member width. Skewed boss rafters use their own pitch and direction. Spar-hook ends reuse the existing 18-degree off-square cap; jack cuts use the actual supporting hip angle, both 45mm member widths and the existing 5mm closest-corner gap. Matching cuts share a diagram. Hip cards retain the exterior-perimeter toe-trim range.

These are REVIEW profiles. The new style’s connection datums and inherited allowances require factory confirmation before production use. The expandable Cut profile allowances controls expose:
- Wallplate face: Materials wallplate thickness, default 63mm, measured in plan normal to the house wall.
- Hip boss allowance: default 156mm additional plan distance along the hip after the face allowance.
- Boss rafter allowance: default 150mm additional slope distance after the face allowance.

The model projects the face allowance along each wall-connected member’s direction. Each allowance is deducted once. Jack profiles have neither a wallplate-face nor boss deduction. No additional undocumented calibration or datum adjustment is inserted. Blank, negative, non-finite or excessive allowances produce an error rather than a misleading cut. Controls and applied layouts persist in the isolated preview draft.

An expandable cut-check table shows the individual deductions. The rafter editor checks the projected ringbeam openings and the resulting cut profiles before accepting edits. Invalid profiles do not commit a changed layout. Existing roof pricing and customer discounts are unchanged; this style is still an admin preview without quotation integration. Next stage: wallplate/boss assembly, followed by material and quotation integration.

Verification: Babel transformation of all five changed files; five new member-schedule cases; full cutting-polygon edge lengths and 220mm normal depth; capped hook angles; mirrored lengths; independent plan/slope/face allowance changes; jack supporting-hip connections; role changes after rafter movement; invalid input/profile rejection; preview control persistence/reopen; full-width toe sampled independently against the exterior polygon; visual inspection of all eight default drawing groups; existing rafter-layout, ringbeam/upstand and pricing regressions.

A full local React compile and deployed browser/live cloud checks were not available here. Please compile and inspect the review profiles. Compare relevant factory members when a suitable standard roof is available; the non-standard reference roof with vents/glazing has not been replicated.
