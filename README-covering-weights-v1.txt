TIMBERLITE — Installed covering weights overlay v1

Extract into:
C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

Contains only Summary.jsx, one shared helper and its focused tests.
Summary.jsx is based on the src(3).zip supplied on 30 September 2026.
Back up your project first. If you edited Summary.jsx after sending that ZIP,
merge those edits rather than overwriting them.

Changes:
- Breather membrane uses the sum of sloping external facet face areas.
- Membrane order is one 50m2 roll per roof.
- SuperQuilt uses internal sloping facet area and one fixed kg/m2 rate.
- SuperQuilt row weights share one installed total with exact rounding.
- Summary includes an installed covering weight audit panel.
- No extra overlap/waste area is included in installed weight, as requested.
- Quilt roll selection, quilt prices, PIR and timber quantities are unchanged.

Rates are derived from existing Materials values, without changing them:
SuperQuilt: 12m2 reference roll weight / 12.
Membrane: 50m2 roll weight / 50.
Optional explicit superquilt_weight_kg_per_m2 and breather_weight_kg_per_m2
keys take precedence if supplied. No Materials UI changes are included.

Validation here: four focused test cases passed using Node assertions,
plus an integration check with the actual hipped geometry builder.
Full React build and the Windows Jest suite have not been run here.

Run in Windows CMD from the project folder:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/installedCoveringWeights.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Calculations/wallplateSummaryIntegration.test.js src/lib/Calculations/wallplateIntegrationAudit.test.js src/lib/Calculations/ringBeamSummaryIntegration.test.js src/lib/Calculations/ringBeamIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/facetEavesGeometry.test.js src/lib/geometry/hippedWallplateSawSettings.test.js src/lib/geometry/hipManufactureGeometryV2.test.js src/lib/Manufacturing/frontRafterManufactureProfiles.test.js src/lib/Calculations/provisionalHippedLeanToTimber.test.js src/lib/Calculations/jackRafterManufactureAudit.test.js src/lib/Calculations/hipManufactureAudit.test.js src/lib/Manufacturing/groupProvisionalRoofMembers.test.js src/lib/Calculations/automaticRoofTiling.test.js

Then run: npm run build

Compare the Summary audit panel and material rows for your reference roof.
