Timberlite v59 — central-boss Design/Options preview
Apply over v58. Copy the src folder into quoteapp-v2 and replace the matching files.

On the hipped Lean-To Design/Options page, admin sees Boss arrangement under Hip Configuration:
- Offset bosses (default): existing design and pricing behaviour.
- Single central boss: both hips are enabled and their side-pitch controls locked. The sole boss sits at half the internal width. Side pitches recalculate from width, projection and front pitch. Gusset/closure bottom remains 595mm.

The central roof plan and rear truss preview appear immediately. Foot cuts use the existing side-soffit and chamfered-lath alignment rules. One aligned boss rafter is drawn, not two coincident rafters. Offset settings are kept separately so switching back restores the existing design. The central selection and geometry inputs are remembered locally when leaving or refreshing the page. Admin access follows the existing application role mechanism.

IMPORTANT STAGE LIMIT: This wires the D/O design preview. Central-boss Summary quantities, quotation pricing and manufacture schedules have NOT yet been integrated. Quote/Save Quote are unavailable for this arrangement. Summary, Technical, automatic Tiles/Laths, Manufacture Book and Idiot List show its preview/integration status rather than running the old offset-boss outputs. Switch back to Offset bosses to use the existing complete quotation workflow. The manual Home Tile Calcs remains available and its calculations are unchanged. No cloud records are rewritten.

Validation here: 16 central geometry tests, 3 component element/event tests, 5 actual quote-save callback tests, and 68 tile/Summary regression checks (92 total) through lightweight local harnesses. Changed source/JSX parses. A live browser preview and full CRA build were not available here.

Run in your installed app:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/centralBossTrussAudit.test.js src/lib/geometry/centralBossDesign.test.js src/components/HippedLeanToOptions.test.jsx src/pages/lean-to/LeanToLanding.saveQuote.test.js src/lib/Calculations/integratedAutomaticRoofTiling.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

npm run build

Quick UI checks: as admin select central, check the two hips meet one rear midpoint; resize the width and check it moves to half-span. Check the two hip toggles and side-pitch inputs are locked. Leave and return to D/O, then refresh: central remains selected. Switch to Offset bosses: original controls/settings and quote workflow return. Public/trade users do not get the arrangement selector. Central Summary/manufacture pages display the pending status. The manual Home Tile Calcs still works.

Next integration: propagate central truss member/joint quantities and one-boss hardware through Summary/pricing, then add its manufacture drawings and final Idiot List before enabling priced central quotes.
