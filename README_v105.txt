Timberlite Edwardian standard Design/Options — v105

Apply over v104. Extract into quoteapp-v2 (the folder containing package.json), merge src folders and replace the included files.

Edwardian now opens its normal Design/Options form. Fields and Quote / Save Quote / Update Quote / Reset buttons follow the other roof styles. Quote reveals the dimensioned plan preview, roof details and Your price cards. Technical retains the detailed audits as read-only views of the same design. Summary and Idiot List retain the v104 integrated model and now share the Edwardian navigation.

The main pitch defaults to 25 degrees and normally applies to all three facets. Only admin sees the Adjust front pitch checkbox and separate front-pitch field. No manual ridge-position field is offered. The ridge and terminal truss positions continue to follow the accepted geometry; the terminal remains 33mm behind the ridge point.

Previously saved manual-ridge designs are converted to their equivalent front pitch when opened on D/O, preserving the roof position and extras. Saved dimensions/options/adjustments are retained. Reset restores the saved baseline; a new unsaved design resets to blank dimensions. Selecting Edwardian on Home starts a fresh design, while returning from Technical preserves the current design.

Maximum finished height follows the existing Gable joist/lath/covering section-height convention with 5mm clearance. If an admin front-pitch override is present, the steeper facet controls the section-depth allowance. Installed ridge-cap profile build-up is not added as an arbitrary 70mm. A manual pitch edit clears the maximum-height input.

Verification completed here: 246 transformed-module checks, Edwardian form/admin-control/Reset/Technical/SVG checks and the existing Gable/Lean-To UI regression harness. A full CRA production build and real Jest are not available in this workspace. On your PC run:

npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/geometry/edwardianDesignInputs.test.js src/lib/geometry/edwardianGeometry.test.js src/lib/Calculations/edwardianSummaryIntegration.test.js src/lib/Calculations/edwardianMaterialsReconciliation.test.js

npm run build

Please check: Home opens Edwardian with blank dimensions; enter 3560 x 3550 at 25 degrees and press Quote; compare the plan and price with Summary; visit Technical and return; enable front-pitch adjustment as admin and confirm the ridge moves; reopen your saved quote and confirm its extras/options; Reset restores its saved inputs.

The Home Tile Calcs tool, Gable placeholders, RoofPlanDiagram font edits and your stored Materials prices are not included or changed. Edwardian manufacture book integration is still the next stage.
