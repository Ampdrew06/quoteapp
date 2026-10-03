Apply after Technical Audits v3.
Extract into C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

Adds a READ-ONLY audit to Technical; no live Summary costs, weight or ordering
are changed. The Technical page preserves the previous audit migrations.

Steel shingles (Britmet/Metrotile): two black-painted 25x50 laths along every
hip or ridge. Foam tape under each hip lath only, in 5.6m rolls.
LiteSlate/Tapco: no hip/ridge support laths or expanding foam tape.
Ridge ventilation strips and paint consumption remain unquantified.
Uses finished external tiled hip/ridge edge lengths from the shared edge model;
current structural member lengths are unchanged.

Lath usage joins the common 25x50 total before rounding stock lengths.
Tape usage is pooled across hips before rounding whole rolls. No extra waste
or cut-piece optimisation is added. Review these assumptions on Technical.
Existing expanding_foam_roll_price_each and expanding_foam_roll_weight_kg_each
Materials values supply tape pricing and installed linear weight. No new rate
is invented if those values are absent. Canned foam remains a separate item.

Replaces LeanToTechnical.jsx. Preserve manual edits made after the supplied
src(3).zip / v3 overlay. Adds one calculator and its focused regression tests.

Six focused checks passed here using Node assertions, plus actual hipped
roof-edge integration. The updated React build/Windows Jest suite must be run:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/hipRidgeLathIntegrationAudit.test.js
npm run build

Full focused regression group:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/installedCoveringWeights.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Calculations/wallplateSummaryIntegration.test.js src/lib/Calculations/wallplateIntegrationAudit.test.js src/lib/Calculations/ringBeamSummaryIntegration.test.js src/lib/Calculations/ringBeamIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/facetEavesGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js src/lib/geometry/hipManufactureGeometryV2.test.js src/lib/Manufacturing/frontRafterManufactureProfiles.test.js src/lib/Calculations/provisionalHippedLeanToTimber.test.js src/lib/Calculations/jackRafterManufactureAudit.test.js src/lib/Calculations/hipManufactureAudit.test.js src/lib/Manufacturing/groupProvisionalRoofMembers.test.js src/lib/Calculations/automaticRoofTiling.test.js src/lib/Calculations/hipRidgeLathIntegrationAudit.test.js
