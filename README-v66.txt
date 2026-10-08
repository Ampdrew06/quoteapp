Timberlite Gable Tiling and Ridge Audit — v66

Apply over v65. Merge the included src folder and replace matching files.
This is a read-only extension of the Gable preview, not live quotation integration.

FILE MAP
src/lib/Calculations/gableTilingAudit.js — NEW. Builds rectangular tile faces from the Gable geometry and reuses existing facet tiling, steel course ordering and regular Lean-To verge calculations. Adds ridge, ventilation, end-cap, starter and external lath requirements.
src/lib/Calculations/gableTilingAudit.test.js — NEW. Five regression tests for steel/LiteSlate, stock pooling, unequal soffits, prices and invalid inputs.
src/pages/gable/GableDesignPreview.jsx — UPDATED. Adds remembered covering selection, read-only quantity/cost table and expandable lath rows.
No files are deleted or retired. Home Tile Calcs, existing Lean-To/Hipped quantities, Summary, quotations and manufacture books are unchanged.

CONFIRMED 4320mm RIDGE EXAMPLE
Steel: 2 x 4320mm ridge laths; 18 x 500mm vent strips; 4 ridge tiles; one front ridge end cap. No ridge foam tape.
LiteSlate: ceil(4.32 x 5.5) = 24 ridge tiles. No ridge support laths or end cap. Two runs of 50mm-wide, 6mm twinwall strip total 8.64m: three 3m strips with butt joints and shared offcuts. Surplus material has no cost allowance.
Two eaves require three 3m tile starter lengths with shared offcuts. Front open ends reuse the existing two-part barge/dry-verge rule.
Steel uses the accepted right-to-left sequence, minimum 295mm physical starter including 95mm rib, plus two additional tiles for the whole roof.
External tile faces include the 50mm plan extension at the tile starter. Existing membrane audit remains unchanged pending reconciliation at integration.
The 70mm ridge product height is NOT added to the truss peak.
External field laths include the chamfered perimeter. Ridge support is added once and pooled for stock rounding. Internal ceiling and ring-beam laths are outside this subtotal.
Costs are partial candidates; absent rates show Unconfigured and configured zero remains zero. No complete Gable price or tile cut list is claimed.

VALIDATION
116 lightweight Node regression checks passed, covering new audit, Gable geometry/insulation/timber and existing steel ordering/Summary paths. Gable JSX evaluated against real calculation dependencies; both existing SVG diagrams rendered. This workspace does not contain the complete CRA installation, so run the following locally:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableTilingAudit.test.js src/lib/Calculations/gableInsulationAudit.test.js src/lib/Calculations/gableTimberAudit.test.js src/lib/geometry/gableGeometry.test.js src/lib/Calculations/steelTileCourseAudit.test.js src/lib/Calculations/integratedAutomaticRoofTiling.test.js

npm run build

Review both covering choices on Gable preview, expand the two lath schedules, and compare ridge quantities above. This audit must be reviewed before its quantities feed quotation/manufacture output.
