Timberlite Gable miscellaneous/fixings audit v74
Apply over v73. Copy src into quoteapp-v2 and replace matching files.

Technical gains a read-only Miscellaneous and fixings audit.
Confirmed shared allowances: two foam cans, one 50m aluminium tape roll and one factory D4 glue tub.
Provisional site member rule: two 5x80 screws per truss-member foot, rounded to whole boxes.
Internal/external lath screws are rounded separately to boxes of 250.
Field laths use one screw per truss intersection. Ridge support uses approximately 500mm plus ends.
Outer ring-beam/finishing laths are provisionally assigned to factory consumption with approximately 500mm/end fixings.
Factory screw type and allocation remain to confirm. They are not duplicated in loose site boxes.
Main tiles: three screws per ordered steel tile, two per slate. Ridge tiles: four per tile.
Front barge/dry-verge, flat ridge end-cap and ventilation attachment quantities remain to confirm.
Factory truss joint/faceplate/closure fixings and rear wall attachment also remain unconfigured.
No boss/spar/jack/joist-hanger/rivet rules are substituted for Gable truss fixings.

Current Britmet 3800x4100 at 25 degrees:
16 truss-member feet x2 = 32 site rafter screws -> 1 box (default 200).
Internal laths: 14 rows x8 trusses =112 screws -> 1x250 box.
External field/ridge: 160+20=180 -> 1x250 box.
Ring-beam outer/finishing factory allowance: 20+38=58 screws consumed.
Main/ridge known tile screws: 74x3 +4x4 =238 -> 2x200 boxes.
Front accessory fixings remain excluded from that calculation until confirmed.
LiteSlate: 480x2 +24x4 =1056 -> 6x200 boxes.

Supplied boxes/cans/glue tubs are not counted as installed roof weight.
Consumed fixing/glue weights remain unconfigured.
Plasterboard weight remains included once through insulation; no supply is added.
The known cost excludes pending quantities and missing rates; it is a partial audit comparison.
Summary, quotation pricing, saved quotes, Manufacture Book, Idiot List and Home Tile Calcs are unchanged.

File map:
src/lib/Calculations/gableMiscellaneousAudit.js — new separated site/factory consumable/fixing audit.
src/lib/Calculations/gableMiscellaneousAudit.test.js — member counts, separate box rounding, factory consumption, steel/slate rates, zero/missing prices and invalid inputs.
src/pages/gable/GableDesignPreview.jsx — displays the audit and unresolved requirements on Technical.
No files retired or deleted. No RoofPlanDiagram included.

Verification:
139 lightweight calculation checks passed.
D/O/Technical separation, option changes and persisted draft checks passed.
Both SVG drawings rendered. Changed JSX parsed.
Full CRA/Jest/build unavailable in this partial source workspace.

Run locally:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableMiscellaneousAudit.test.js src/lib/Calculations/gableInternalLathAudit.test.js src/lib/Calculations/gableLathMembraneAudit.test.js
