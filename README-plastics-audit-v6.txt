Apply after v5. Extract into:
C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

READ-ONLY Reveal Liner/soffit/perimeter audit on Technical.
No Summary quantities, costs, weights or manufacturing geometry are changed.
Retains the existing resolved fascia-order widths and fitting allowances.
Horizontal eaves use external structural perimeter lengths, excluding tile
projection into guttering. Remaining open verges are listed separately.

The audit is preliminary: soffit stock width is selected from the existing
resolved depth, whole stock lengths are allocated per run, and front/side
corner junctions plus straight joins are REVIEW counts. No fitting orders
are committed. Final finished soffit cover, offcut reuse, wall terminations,
J-section rules and 9mm product weight rates need confirmation.

Legacy plastics rows are retained for comparison using the existing Technical
quoteTotals calculation; these are legacy reference rows, not a live revised BOM.

Replaces LeanToTechnical.jsx based on supplied src(3).zip plus v1-v5.
Preserve subsequent manual edits. Adds a calculator and six focused tests.
Six checks passed here, plus actual hipped facet/edge integration.
The updated React build and Windows Jest suite have not been run here.

Run in Windows CMD:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/plasticsIntegrationAudit.test.js
npm run build

Full focused regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/installedCoveringWeights.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Calculations/wallplateSummaryIntegration.test.js src/lib/Calculations/wallplateIntegrationAudit.test.js src/lib/Calculations/ringBeamSummaryIntegration.test.js src/lib/Calculations/ringBeamIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/facetEavesGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js src/lib/geometry/hipManufactureGeometryV2.test.js src/lib/Manufacturing/frontRafterManufactureProfiles.test.js src/lib/Calculations/provisionalHippedLeanToTimber.test.js src/lib/Calculations/jackRafterManufactureAudit.test.js src/lib/Calculations/hipManufactureAudit.test.js src/lib/Manufacturing/groupProvisionalRoofMembers.test.js src/lib/Calculations/automaticRoofTiling.test.js src/lib/Calculations/hipRidgeLathIntegrationAudit.test.js src/lib/Calculations/hipRidgeLathSummaryIntegration.test.js src/lib/Calculations/plasticsIntegrationAudit.test.js
