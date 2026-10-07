Timberlite v57 — integrated hipped steel tile ordering
Apply over v56: copy the included src folder into quoteapp-v2, replacing matching files.

Summary, live Design/Options quotation pricing and the final manufacture-book Idiot List now use the accepted right-to-left staggered steel tile sequence. The 4050 x 2885 test roof orders 54 layout tiles plus 2 spares = 56. Minimum reusable starter remains 295mm overall / 200mm visible. Quantity adjustments still apply once. Technical retains the previous area-based quantity for comparison.

Home Tile Calcs and its shared calculation modules are unchanged. Ordinary Lean-To and slate ordering retain existing behaviour. Invalid/unsupported layouts retain the earlier result and show the integration issue in Technical. Existing saved cloud quotations are not rewritten; save a quotation again to store its recalculated price.

Validation here: 68 calculation/regression checks through a lightweight Node harness, plus parsing of changed source/JSX. Full CRA Jest and production build must be run in your installed app:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/integratedAutomaticRoofTiling.test.js src/lib/Calculations/steelTileCourseAudit.test.js src/lib/Calculations/steelTileStaggerAudit.test.js src/lib/Calculations/squaredSteelTileOffcut.test.js src/lib/Calculations/automaticRoofTiling.test.js src/lib/Calculations/tileOrderAllowanceRegression.test.js src/lib/Calculations/summaryTilingBOM.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

npm run build

The tile cutting list is not added to the manufacture book in this update. Trial the accepted ordering rules on the next physical roof.
