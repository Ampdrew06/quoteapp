Timberlite v194 — Victorian Hipped Lean-To ringbeams and upstands

Apply over v193. Back up your source, copy the included src folder over your project src folder, and run your usual compile/deployment.

Open Home > Admin tools > Victorian Hipped Preview, or /quote/victorian-hipped/technical. Below the plan and geometric member information, the preview now includes ringbeam cutting profiles and dimensioned 9mm ply upstands for all five runs.

The 30x95 PSE, 9mm ply base and 25x50 outer lath reuse the existing Victorian 135-degree plan-profile calculations and shared visual cut-page format. Default mirror pairs RB1/RB5 and RB2/RB4 share diagrams only when their layer profiles and clear bay widths match; RB3 is unique. Asymmetric manual rafter layouts split the affected pairs. Width dimensions are above each upstand and the shared cut height appears at the left, with beam/bay references inside the shapes.

Applied rafter positions feed the actual ringbeam slots. The existing 48mm perpendicular slot allowance is projected along the ringbeam for skewed boss rafters; these slightly wider openings require workshop confirmation. Hip and wall boundary seats retain the existing nominal 48mm convention. The position editor now rejects projected slot overlaps before applying a layout. An expandable setting-out table provides centres, opening widths and start/end positions.

Automatic upstands remain 195mm pitched. A specified 50mm soffit envelope uses the established 210mm vertical cut (195mm visible plus 15mm groove) and a 110mm ply base. The Upstands dropdown also allows explicit pitched/vertical selection. Standard 150mm soffit boards retain the 225mm base, including the 5mm fitting allowance. The preview draft saves the selected arrangement and manual positions.

The new model records net layer lengths/areas, clear upstand widths, finishing-lath length and one 185mm PIR face per bay for later material integration. It does not add live pricing or purchase-stock allowances. Rafter/hip cutting profiles, vents, glazing and quotation integration remain to follow. Existing pricing settings and completed styles are unchanged; the shared cut renderer gains an optional label override with unchanged defaults.

Verification: Babel transformation of all six packaged files; five new ringbeam geometry cases; external ply dimensions match the plan; complete internal runs reconcile slots and bays; normal/skew slot widths; mirror grouping and asymmetric splitting; 195/210mm upstands and 225/110mm bases; overlap rejection without changing the applied layout; actual grouped drawing rendering; upstand arrangement persistence/reopen; visual inspection of all three default drawing groups; original Victorian Hipped layout/geometry and both Victorian/Edwardian editor/save regressions.

A full local React compile and deployed browser/live cloud checks were not available here. Please compile and review the profiles in the admin preview, then move/add a rafter to confirm that the upstand widths and grouping respond. Check the 50mm specified soffit and vertical upstands. Workshop feedback on the skewed openings is still needed before treating these as confirmed production instructions.
