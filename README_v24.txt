Timberlite Miscellaneous Summary Integration — v24

Apply this overlay to the existing quoteapp-v2 project after the earlier updates.
Copy the enclosed src folder into the project root and replace the matching files.
Do not delete your existing src folder. The development app should update automatically.

Run in the project root:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/miscellaneousIntegrationAudit.test.js src/lib/Calculations/hippedLathFixingAudit.test.js src/lib/Calculations/miscellaneousSummaryIntegration.test.js

Changes:
- Valid hipped roofs use the confirmed miscellaneous audit allowances in Summary.
- Foam: two cans. Aluminium tape: one roll. Manual +/- extras remain available.
- Ring-beam fixings: two per rafter/hip/jack, rounded to whole boxes.
- Internal and external lath fixings round separately to 250-screw boxes.
- Main tile, hip/ridge and end-cap fixing allowances round to whole screw boxes.
- Factory D4 glue, 1.5-inch screws, rivets and drywall screws have separate cost rows.
- Factory consumables do not appear as loose items on the Idiot List; site fixing quantities and manual extras do.
- Summary quotation pricing reconciles the integrated consumable costs with the legacy quote base; audited-row exclusions are not deducted twice.
- Existing insulation, membrane, hip foam tape and polytop rows remain intact.
- Hipped plasterboard footnote uses internal sloping facet area, contributing weight once.
- Technical audit remains available as read-only evidence.

Current ordered-roof expectations:
2 foam cans; 1 aluminium tape roll; 1 rafter screw box; 2 lath screw boxes; 1 tile screw box.
Factory: 1 D4 tub allowance, 148 1.5-inch screws, 16 rivets and 28 drywall screws.
Plasterboard: 5 sheets by area; installed weight 106.33kg.
Factory consumable installed weights remain explicitly unconfigured rather than using full stock/tub weights.

Verification here: all 19 calculation tests passed through a Node assertion harness.
CRA Jest and the React compilation must be checked in your installed project using the command above and the running app.
Optional plasterboard supply, Add item dropdowns and the results layout remain separate follow-up work.
