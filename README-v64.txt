Timberlite Gable Insulation and Front Face Audit — v64

Apply over v63 by merging the included src folder and replacing the supplied files.

Open Gable. New read-only insulation/coverings audit sits below the timber audit. For 3800 x 4100 at 25 degrees with standard 150mm soffits/overhang:
- Finished ceiling including 595mm flat: 16.938m2.
- External membrane candidate area: 20.210m2.
- Cradle area: 8.521m2.
- Combined 50mm PIR including upstand faces: 11.429m2.
- Between-truss 100mm PIR: 17.176m2.
- Full front outer plywood face: 1.048m2; extra area beyond its existing outer gusset: 0.862m2.

Front truss retains the standard joint arrangement and closure. Only its inward member faces have PIR cradles; the rear follows the same inward-face rule, intermediate trusses have two faces per member. Full front plywood covering is costed as single-layer coverage of the members and gusset, not a solid triangle blocking the window opening. Please review this coverage assumption: the added area excludes the outer gusset already counted. If the factory installs a second overlapping plywood layer, that needs a separate correction.

PIR candidates use the existing internal-span-plus-frame convention, excluding soffit extensions. 140mm cradle strips are conservative gross allowances with no joint rebates deducted. Slab clear bays deduct the actual 45mm joist thickness; ring-beam slots retain 48mm clearance. Sheet counts pool 50mm requirements once and add configured waste, but do not represent a validated cutting optimisation.

Internal ceiling = two slopes outside the gusset flat plus the flat, across the internal projection. SuperQuilt uses the shared existing roll selector and fixed installed-area weight rate. Plasterboard is informational only, with no supply cost included. Membrane uses the present external geometry; extra tile-starter overhang remains for the tile audit. One supplied membrane roll remains the rule, with review flagged above 50m2.

Do not add the insulation audit costs to the timber subtotal: upstand PIR is deliberately shown in both comparisons. None of these candidates changes Summary, saved quotes, pricing or manufacture outputs.

FILE MAP
src/pages/gable/GableDesignPreview.jsx — displays the new audit and front-face coverage details; reads shared upstand height for the cut text.
src/lib/Calculations/gableTimberAudit.js — retains joint counts, adds non-overlapping full front plywood coverage, takes standard ring-beam dimensions from the universal builder.
src/lib/Calculations/gableInsulationAudit.js — NEW read-only Gable cradle, slab, ceiling, quilt, membrane and plasterboard candidates.
src/lib/Calculations/gableInsulationAudit.test.js — NEW five regression tests for front coverage, face counts, PIR aggregation, ceiling areas and invalid inputs.
src/lib/Calculations/insulationIntegrationAudit.js — exposes the existing SuperQuilt mix helper for reuse; existing hipped calculations unchanged.
src/lib/Manufacturing/ringBeamBuilder.js — exports the existing 48mm slot constant for reuse; dimensions and behaviour unchanged.
No files retired or deleted. Your adjusted RoofPlanDiagram is not included.

LOCAL VERIFICATION
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableInsulationAudit.test.js src/lib/Calculations/gableTimberAudit.test.js src/lib/geometry/gableGeometry.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/centralBossTrussAudit.test.js src/lib/geometry/centralBossDesign.test.js
npm run build

Verification here: 109 lightweight material/geometry checks and 99 further geometry regression checks passed. All six changed/new source files parsed. Gable page evaluated with real calculation dependencies and its drawings rendered. Full CRA Jest/build must be run locally.
