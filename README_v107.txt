Timberlite v107 — Edwardian Manufacture Book
Apply over v106. Copy the included src folder into quoteapp-v2 and replace these files.

Admin navigation now includes Plan/Manufacture. Existing Edwardian Jobs and converted Edwardian Quotes open the book. Ordinary saved Quotes still open Design/Options.

Book contents: editable shared job front, manufacturing plan, unique T/H/R/J member references, cutting details, truss assembly, gussets/chevrons/closures, three ring-beam layer and absolute slot schedules, insulation, net internal lath runs, covering/accessory requirements, fascia/soffit, gutters/factory fixings and the final shared despatch checklist.

The accepted geometry is reused. The completed 3560 x 3550mm roof at 25 degrees retains ridge 1770mm, terminal truss 1737mm, 19 joist members and 18 upstands; boss rafter 1835.5mm internal / 2044.9mm external. The 118mm connection allowance and 18-degree spar-hook cut limit remain.

PIR slab ordering and net lath runs are the accepted allowances, not verified slab nesting or saw cutting lists. Detailed field-tile cutting remains in the covering calculator. Final supply quantities follow Summary amendments; base fitted geometry is unchanged by supply extras. Section numbers identify book sections; the checklist can continue across printed pages.

Validation here: 251 lightweight calculation/regression checks passed, plus Edwardian book rendering, role gate, draft/job details saving and existing Edwardian/Gable UI checks. All 23 initial book diagrams rendered and representative diagrams were visually inspected. Browser print pagination could not be checked in this environment, so Print Preview on your PC is required before workshop use. No local full React build was available.

Run on your PC:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/edwardianManufactureSchedule.test.js src/lib/Calculations/edwardianMemberAudit.test.js src/lib/Calculations/edwardianRingBeamAudit.test.js src/lib/Calculations/edwardianTimberAudit.test.js src/lib/Calculations/edwardianSummaryIntegration.test.js
npm run build

Review:
1. Open the 3560 x 3550mm / 25-degree roof and choose Plan/Manufacture.
2. Check the front, roof plan, R1 cutting detail and RB1/RB2/RB3 slot sheets.
3. Open Print Preview (A4, 100% scale, browser headers/footers off). Check for clipped rows, blank pages or split diagrams, especially the checklist.
4. Save delivery address, contact and instructions, leave/reopen the saved job and check they remain.
5. Confirm the checklist retains added tiles and gutter fittings.
6. Try LiteSlate and admin front-pitch override; book should follow the same current design.
