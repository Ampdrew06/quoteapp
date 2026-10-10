Timberlite v82 — ring-beam factory fixings
Apply over v81: extract and copy the src folder into quoteapp-v2, replacing the four included files.

Removes the provisional Gable outer/finishing ring-beam lath screw row from the audit and integrated Summary/costings. Ring-beams use glue and staples as confirmed by the factory. Retains one D4 tub per roof and the existing practical staple allowance (40 per truss + 20 per metre of ring-beam/wallplate). No extra staple quantity is introduced. Loose site screw boxes and installed weights are unchanged.

File map:
- gableMiscellaneousAudit.js: confirmed assembly notes and removal of assumed factory screws.
- factoryStapleAllowance.js: shared allowance description; quantities and pricing unchanged.
- gableMiscellaneousAudit.test.js: confirms absence of ring-beam screws and retained glue/staples.
- gableSummaryMaterialsModel.test.js: confirms Summary has no ring-beam screw row and retains one glue allowance.

Validation: 160 lightweight transformed-module regression checks and the React handler/UI harness passed. A full CRA build/Jest run was not available in this workspace.
Windows check:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableMiscellaneousAudit.test.js src/lib/Calculations/factoryStapleAllowance.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js
