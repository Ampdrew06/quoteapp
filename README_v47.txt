Timberlite v47 — read-only central-boss truss audit
Apply over v46. Copy src into quoteapp-v2, replacing included files.
Open Technical: new Single central boss — truss audit near the top.

Separate audit inputs default to 4050mm internal width, 2885mm projection and 15 degree front pitch. They do not save or change D/O, current geometry, Summary or manufacture book.

Proposed geometry:
Central boss x=2025mm, B height=923.033mm above factory floor.
A top=1040.630mm, C bottom=805.437mm.
Side pitches=20.706279 degrees.
Each external slope=2328.402mm; internal slope=2164.837mm.
HFC=153mm, VFC=177.359mm. Apex plumb cut length=235.192mm.
No horizontal member; two matching plumb apex cuts. Spar-hook 18 degree cap does NOT apply to the truss timber-to-timber joint. Spar hooks/hip/boss rafters are not recalculated or integrated in this update.

Important review assumptions:
1. Existing boss centre height retained: 40 + projection*tan(front pitch) + 110mm. Confirm this height against the front boss-rafter connection before integration.
2. Side HFC retained at 153mm for requested 100mm side-soffit envelope. Front/side chamfered-lath alignment for the new arrangement remains to be solved.
3. Existing chevron allowances interpreted as centreline arm lengths: two 18mm plates, 300mm arms, 143mm perpendicular width. Two 9mm gussets, 350mm arms and 220mm width. Confirm the arm-length measurement reference with factory staff.
4. 45mm flanges; no obsolete eaves stiffeners.
5. 45x45 closure identified but no cut length invented: exact location/run remains unconfirmed.

The audit displays truss and plate outlines, dimensions, apex datums and explicit pending checks. Plate bounding blanks are rectangles containing the outlines, not a nesting/purchasing calculation. No manufacture approval is implied by numerical closure tests.

Run:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/centralBossTrussAudit.test.js src/lib/geometry/wallplateAssemblyGeometry.test.js src/lib/geometry/wallplateBossGeometry.test.js
Then: npm run build

Local validation: six new geometry checks and 133 existing geometry checks passed through lightweight Node harness. Three app modules parsed with Babel. Generated geometry outlines visually inspected; full React page/build must be checked in your app.
