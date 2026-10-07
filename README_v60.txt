Timberlite v60 — central-boss Summary and quotation costing

Apply over v59: copy the included src folder into quoteapp-v2, merging folders and replacing the included files. No RoofPlanDiagram/font customisations are included.

Materials > Timber & Sheet: enter the new 45×45 PSE truss closure price in £/m. Its kg/m field is also available; until entered the closure row clearly reports its weight as unconfigured. No price or weight has been invented. Explicit zero prices are retained.

Central-boss designs now use the shared geometry for Summary and quotation pricing. The rear assembly replaces the old horizontal wallplate with two truss members, two 9mm gussets, two 18mm chevrons and one 595mm closure. It includes one boss, six individual spar hooks (three pairs), the associated factory fixings, and watercourse along both sloping members. The closure follows existing timber waste pricing; its installed weight uses consumed length.

Quote and Save Quote become available when the central design, tile sequence and closure price are ready. Pricing uses the same canonical Summary totals, adjustments, exclusions and extras. Existing quotes are not rewritten.

Central manufacture book and final Idiot List remain guarded while we integrate the truss drawings. The loading-list data model is reconciled, but a central roof is not yet a released manufacture-book design. Technical shows the central preview and material reconciliation.

The manual Home Tile Calcs formulas are unchanged. Existing offset-boss designs retain their calculation path.

Local verification: 90 material/tiling/truss checks, 99 geometry regression checks, 6 save-callback checks and 3 component element/event checks passed through lightweight Node harnesses. All 22 included JS/JSX files parsed. Full CRA Jest/build is not available in this source-only workspace; please run locally:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/centralBossSummaryIntegration.test.js src/lib/geometry/centralBossDesign.test.js src/lib/geometry/centralBossTrussAudit.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/pages/lean-to/LeanToLanding.saveQuote.test.js
npm run build
