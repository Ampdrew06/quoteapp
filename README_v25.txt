Timberlite Summary Add Items — v25

Apply after v24. Copy the enclosed src folder into quoteapp-v2 and replace matching files.
Do not delete your existing src folder. The app should update automatically.

Each of the six Elements tables now has an Add item dropdown above its total.
Selecting an item adds one supplied unit and leaves a fresh blank dropdown available.
Use the added row's +/- field to adjust from that initial one (e.g. +2 supplies three).
Remove deletes that extra. An already selected extra is omitted from the dropdown; use +/- for more.
Automatic roof requirements remain separate from rows labelled Extra.

Prices come from Materials. Products without a configured price are disabled until configured.
Configured zero prices remain valid. Price changes recalculate existing extras.
Reveal liner/soffit options distinguish width and white/foiled price bands.
Gutter options distinguish square/round/ogee profiles, including corner types absent from the current roof.
Factory spare boxes or tubs are supplied extras; the existing factory consumption rows remain separate.

Extras are stored inside the current quotation inputs, survive page changes and saving/reopening a quote,
and clear with a new/reset quote. Both Summary and Design/Options pricing include their costs.
Extras appear in the matching Idiot List section. Exclude removes cost but retains supply, as on existing rows.
Because these are supplied extras, their weight is not added to the installed roof total; Weight displays a dash.
The existing three site screw allowance rows now show Box rather than Ea.

Optional plasterboard supply and the wider results layout are not changed in this update.

Run:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/miscellaneousIntegrationAudit.test.js src/lib/Calculations/hippedLathFixingAudit.test.js src/lib/Calculations/miscellaneousSummaryIntegration.test.js src/lib/Calculations/summaryAddedItems.test.js

Verification: 27 calculation tests passed here using a Node assertion harness.
React compilation and CRA Jest must be verified in the installed app.

Suggested live check:
1. Add a 135-degree square gutter corner and a duct tape roll.
2. Change the corner to +2 and verify three corners and three times its Materials price.
3. Exclude it: cost disappears, supply row remains. Remove it: row disappears.
4. Check the Idiot List and save/reopen the quotation; selected extras should be retained.
5. Start a new quotation; previous extras must be absent.
