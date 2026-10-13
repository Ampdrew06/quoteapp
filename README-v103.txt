Apply over v102: extract into quoteapp-v2 and replace included files.
Home > Edwardian (admin): new Reconciled materials totals section below lath stock.
One model combines Timber, Tiles, Plastics, Metal, Guttering and Miscellaneous. Element totals sum to the material total using row-level penny rounding.
Duplicate audit charges removed: tile starter only in Metal; all 25x50 uses replaced by pooled stock in Timber; 50mm PIR cradles/ring faces pooled once; quilt/membrane/tape included once.
Factory consumption contributes cost and stays excluded from loose site supplies. One steel touch-up kit included.
Installed weights use net material/roof coverage. Existing plastic/gutter rates retained. Surplus tile/lath quantities are not included in installed weight. Plasterboard added once, not supplied/priced.
Missing required prices remain explicit and prevent complete costing readiness. Missing weights remain explicit; no imaginary consumption weights added.
Still read-only: live quote pricing, Summary, manufacture and Idiot List remain disconnected until the reconciled totals are reviewed.
234 lightweight checks plus Edwardian/existing UI and syntax checks passed. Please compile/run Jest on your PC.
Suggested test: npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/edwardianMaterialsReconciliation.test.js src/lib/Calculations/edwardianMetalMiscAudit.test.js src/lib/Calculations/edwardianInsulationAudit.test.js src/lib/Calculations/edwardianPlasticsGutteringAudit.test.js src/lib/geometry/edwardianGeometry.test.js
