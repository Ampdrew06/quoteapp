Apply after covering weights v1. Includes and supersedes audit-location v2.
Extract into C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

Moves both installed covering weight and Tile/Lath integration audit panels
from Summary to Technical. Keeps live Summary quantities, prices and weights.
Technical still uses the shared tile comparison helper; the old rectangular
lath estimate is retained only to reproduce the legacy comparison.
Updates obsolete ring-beam and wallplate integration-status wording.
These older comparison tables record their respective integration stages,
not all final live totals after subsequent integrations.

Replaces Summary.jsx and LeanToTechnical.jsx. Preserve manual changes made
after supplying src(3).zip or installing v1/v2.

Validation here: shared comparison helper smoke check passed.
The full 16-suite / 72-test Windows run passed before this presentation update.
Run from Windows CMD in the project folder:
npm run build
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/summaryTilingComparison.test.js src/lib/Calculations/installedCoveringWeights.test.js

Check Technical shows the tile/lath comparison; Summary has neither audit panel.
The covering weight helper installed by v1 is still required.
