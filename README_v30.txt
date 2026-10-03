Timberlite — Manufacture Book page 2 readability v30

Apply after v29. Merge src into quoteapp-v2/src and replace the three included files. Keep all other files. No geometry or cutting rules are changed by this update.

PAGE 2
- Removed the large additional manufacture heading. Roof Plan is the compact main heading.
- Replaced nested padded boxes with a near-full-width plan area, retaining A4 portrait and the existing page margins.
- Compact two-row details box: customer, reference, style, frame thickness, tile system/colour, fascia colour, gutter colour/profile, and roof weight.
- Roof weight is installed weight INCLUDING plasterboard, following the current Summary convention. It comes from the same shared material model, including price-excluded material weights and counting plasterboard once.
- Larger, darker spacing and setting-out figures. Spacing labels increase from 11 to 22 SVG units; recovered page width also makes them larger physically.
- Member references, slab references, pitches and overall dimensions are larger too.
- Front member positions and gap/spacing values now occupy separate rows.
- Member labels are moved away from overlapping pitch/member labels; side ring-beam references are moved inside the plan.
- Retained the facet pitch/support/soffit table beneath the drawing.
- Page 1 markup and the other manufacture pages remain as before. The enlarged drawing mode is enabled only on this roof-plan page.

VALIDATION
Rendered the actual page component using representative 4050 x 2885 roof inputs, inspected the resulting SVG at approximately the available print width, and corrected visible overlaps. All 66 original CAD text labels are retained exactly. Metadata includes all requested fields.
The three changed modules passed Babel syntax/transformation checks. All 36 existing material/pricing assertions passed locally.
A browser print engine is unavailable in this workspace, so full Chrome print pagination has not been verified here. Please check your app's print preview before printing, particularly that page 2 fits on one page with the complete facet table and all outer dimensions visible.

OPTIONAL REGRESSION COMMAND
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/summaryMaterialsModel.test.js

Factory validation of v29's revised geometry remains outstanding. This visual update does not establish physical fit of the roof.
