Apply AFTER v4. Extract into:
C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

Connects approved hip/ridge support lath usage to the common 25x50 Summary
stock total, with existing price, waste uplift and installed weight rules.
Adds expanding foam tape as a separate Miscellaneous row in whole 5.6m rolls.
Slate systems receive neither contribution. Canned expanding foam is retained.
Tape weight remains explicitly unconfigured until its Materials value is set;
zero contribution does not imply tape is physically weightless.

Existing structural hip, jack and rafter cut lengths are unchanged.
Support laths/tape follow full external tiled hip edges to the house wall.
Black paint consumption and future ridge ventilation strips remain deferred.
Other quotation paths and packing outputs remain scheduled for reconciliation.
Technical records the before/after comparison and current integrated status.

Replaces Summary.jsx and LeanToTechnical.jsx based on supplied src(3).zip
plus v1-v4 overlays. Preserve any subsequent manual edits.
Adds one Summary selector and focused integration tests.

Expected unchanged reference roof:
25x50 usage about 216.388m (displayed 216.39m); 46 lengths at 4.8m.
Tape 3 rolls; cost 39.00 GBP with configured 13.00 GBP per roll.
Additional installed timber weight about 9.75kg.

Ten focused audit/integration tests passed here with Node assertions.
Full React build and Windows Jest regression must be run on your project:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/hipRidgeLathIntegrationAudit.test.js src/lib/Calculations/hipRidgeLathSummaryIntegration.test.js
npm run build

Full focused regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/installedCoveringWeights.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Calculations/wallplateSummaryIntegration.test.js src/lib/Calculations/wallplateIntegrationAudit.test.js src/lib/Calculations/ringBeamSummaryIntegration.test.js src/lib/Calculations/ringBeamIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/facetEavesGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js src/lib/geometry/hipManufactureGeometryV2.test.js src/lib/Manufacturing/frontRafterManufactureProfiles.test.js src/lib/Calculations/provisionalHippedLeanToTimber.test.js src/lib/Calculations/jackRafterManufactureAudit.test.js src/lib/Calculations/hipManufactureAudit.test.js src/lib/Manufacturing/groupProvisionalRoofMembers.test.js src/lib/Calculations/automaticRoofTiling.test.js src/lib/Calculations/hipRidgeLathIntegrationAudit.test.js src/lib/Calculations/hipRidgeLathSummaryIntegration.test.js
