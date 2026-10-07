Timberlite v58 — confirmed central-boss gusset and closure geometry
Apply over v57 by copying the included src folder into quoteapp-v2 and replacing the three matching files.

This continues the read-only Single central boss — truss audit on Technical. Design/Options, Summary, live roof geometry, Home Tile Calcs and manufacture book are unchanged.

The confirmed gusset/closure bottom corners meet the underside edges of the two joists. The gusset shows vertical sides, total height, slope lengths and net area. The 45x45 closure is drawn green and its bottom/top edge lengths, end insets, angled end lengths and angles are calculated. Angle to bottom and angle off square are distinct values; this audit does not prescribe a saw setup.

Default 4050 x 2885, front pitch 15 degrees, shared bottom 595mm:
Truss pitch 20.7063 degrees.
Gusset vertical sides 235.2mm; overall height 347.6mm; slope edges 318.0mm.
Closure bottom 595mm; top 356.9mm; end insets 119.0mm each; angled ends 127.3mm each.
At a truss pitch of 25 degrees the gusset slope is 328.3mm, matching the approximate CAD reference.

595mm remains the confirmed geometry input; no span-dependent structural sizing formula is introduced. Boss-height and foot-cut assumptions remain visible for review before integration into the live roof.

Validation here: 10 geometry tests through a lightweight Node harness and source/JSX parsing. Run full app tests and production build locally:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/centralBossTrussAudit.test.js src/lib/geometry/wallplateBossGeometry.test.js src/lib/geometry/wallplateAssemblyGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js

npm run build
