Timberlite v32 — integrated Idiot List and final manufacture-book page

Apply after v31: extract into quoteapp-v2, preserving the src folder structure.

Hipped Idiot List now consumes the same shared integrated materials model as Summary and quotation pricing. It includes approved insulation, tiling, hip laths/tape, plastics, guttering, metals and site consumables, plus Summary quantity adjustments and added items once. Finished-member counts use the same manufacture geometry. Timber stock and fitted hardware appear as manufacture/assembly checks. Factory glue, screws, rivets and fascia vent machining are omitted from the despatch checklist. Explicitly added spare factory items remain loose supplies.

Supply counts use existing order quantities, rather than confusing installed metres/m2 with lengths/sheets. Adjusted stock requirements are rounded to configured stock sizes. H-trim shows consumed cut millimetres. Plasterboard is not automatically ordered: its installed weight remains included once; explicitly added plasterboard appears as a supply item. Price exclusions retain physical supply requirements, matching Summary's price-only convention.

The shared checklist page now sits outside roof-specific drawing sections, after all reference pages. This makes the Idiot List the last page for both supported roof styles. Future roof styles can use the same final-page slot and integrated model adapter when their materials calculations are added. Ordinary Lean-To currently retains its existing checklist calculations pending its separate material audit.

Page 2 manual font edits are preserved: RoofPlanDiagram.jsx is not included. No geometry or pricing calculations have been changed. The shared model now exposes its existing geometry and quantity adjustments for the checklist adapter.

Validation: 44 local calculation checks passed (36 existing + 8 new checklist checks); all six source/test modules passed Babel syntax/transformation. Actual hipped checklist and regular Lean-To book components were rendered with a lightweight React harness, checking final-page placement. Conservative checklist layout estimate reviewed visually. This is not a full CRA/browser print run. Check print preview; exceptionally long checklists can continue across pages rather than being clipped.

Windows regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryMaterialsModel.test.js src/lib/Calculations/summaryAddedItems.test.js
