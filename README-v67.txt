Timberlite Gable LiteSlate Ridge Allowance — v67

Apply over v66. Merge src and replace the two included files.

FILE MAP
src/lib/Calculations/gableTilingAudit.js — UPDATED. Gable LiteSlate keeps its final ordinary cut course and omits the additional short finishing course/lath beneath the ridge. The shared calculator and other roof styles are unchanged.
src/lib/Calculations/gableTilingAudit.test.js — UPDATED. Adds regression coverage for 480 main slates, 16 lath rows per face and unchanged steel ordering.
No files deleted or retired. No page file replacement is needed.

3800 x 4100 @ 25 DEGREES EXAMPLE
480 main slates (225 ordinary + 15 extra starter per face).
138.240m external field laths including 8.640m chamfered perimeter.
29 x 4.8m external lath stock lengths.
24 separate ridge tiles; three 3m polycarbonate strips; three dry verge pieces.
At the supplied main-slate rate of GBP1.81, candidate main cost = GBP868.80.
The additional short finishing course may be restored later if factory testing demonstrates it is required. This is the user's confirmed provisional ordering rule.
Britmet/Metrotile and Home Tile Calcs remain unchanged. Read-only Gable audit only.

CHECKS
117 lightweight Node regression checks passed; Gable JSX evaluates with actual calculation dependencies. Full CRA build was not available in this workspace.
Run locally:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableTilingAudit.test.js src/lib/Calculations/gableInsulationAudit.test.js src/lib/Calculations/gableTimberAudit.test.js src/lib/geometry/gableGeometry.test.js src/lib/Calculations/steelTileCourseAudit.test.js src/lib/Calculations/integratedAutomaticRoofTiling.test.js
npm run build
