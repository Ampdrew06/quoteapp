Timberlite v78 — Gable manufacture book
Apply over v77. Copy the src folder into quoteapp-v2 and accept overwrites. No files are deleted or retired. RoofPlanDiagram and the existing Lean-To/Hipped manufacture book are not included.

Open Gable > Manufacture to print a draft book. Converting a saved Gable quotation to a job, or opening it from Jobs, restores its Gable inputs and opens the Gable manufacture book. Job number, delivery date and notes can be saved on the details page.

Book contents: details; large roof setting-out plan; truss members; 18mm/9mm joint components; offcut closure; front face; square-ended ring-beams and paired upstand labels; insulation/internal lath guide; fascia/soffit preparation; final Idiot List. Quantities use the existing live Gable model. Factory consumption is excluded from loose packing. The lath quantity is clearly a TOTAL stock check including laths already fitted to ring-beams, not an instruction to pack all those lengths loose.

Dimensions are millimetres. Truss positions are from the house wall; T2 is 697mm on the standard example. Both side beams include the existing 5mm front soffit clearance: do not add it again. Unequal soffits use distinct foot cuts and separate ring-beam groups. No spar-hook deduction is applied to truss apex joints.

The full front face includes the outer gusset in one layer. Central box-end cut shape remains a workshop cut-to-fit detail. A tile cutting list and a validated loose lath cutting allocation remain future work. Unknown installed material weights retain the Summary convention. This update presents the accepted manufacture geometry; physical testing and print layout review are still required.

File map
- pages/gable/GableManufacture.jsx: print book, diagrams, job details and final checklist.
- lib/Manufacturing/gableManufactureSchedule.js: translates the live Gable model into named trusses, bays, member profiles and checklist assemblies; reuses the shared ring-beam schedule.
- lib/Manufacturing/gableManufactureSchedule.test.js: geometry identity, paired labels, unequal soffits, adjusted supply quantities and invalid designs.
- components/SummaryIdiotList.jsx: optional supplied checklist; existing callers retain their current behaviour.
- pages/gable/GablePage.jsx and app/routes.js: Manufacture navigation and route.
- pages/Quotes.jsx and pages/Jobs.jsx: Gable job conversion/opening uses Gable inputs and route instead of Lean-To.

Validation here: 160 lightweight transformed-module regression checks passed, plus actual React handler checks for Summary/save/reopen, Gable job conversion/opening and final-page ordering. Actual plan/member SVGs rendered and visually inspected. JSX transformations passed. This workspace does not contain the full CRA installation, so genuine Jest/production build must run on your PC.

Suggested Windows check:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/gableManufactureSchedule.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

Then inspect Print Preview at A4, 100% scale: the details page, large plan, component pages and final checklist. Please confirm truss positions, member dimensions and extra items before issuing the first Gable manufacture book to staff.
