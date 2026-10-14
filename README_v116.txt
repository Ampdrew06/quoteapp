Timberlite v116 — Despatch-only checklist
Apply over v115. Copy src into quoteapp-v2 and replace included files.

Public heading: Roof Checklist. Full-width rows grouped by section headings.
For Hipped Lean-To, both boss arrangements:
- Keep manufactured assemblies; central boss lists one assembled truss.
- Remove raw I-joist, PSE and structural plywood stock.
- Remove fitted 50mm PIR, bosses, spar hooks, jack hooks/brackets and joist hangers.
- Retain loose 100mm PIR and all other site supplies.
- Loose laths are whole stock lengths from the current lath metres after subtracting audited fitted ring-beam outer/finishing laths. Lath pricing and installed weights remain untouched.
- Explicit extra fitted items added via Summary remain as extra supplies, including positive hardware quantity adjustments. Price exclusions still do not remove required supplies.
- Miscellaneous contains an informational plasterboard quantity: ceiling area / 2.88m2 rounded up, 2400 x 1200 sheets, clearly NOT SUPPLIED. It has no packing checkbox and adds no price or duplicate weight. Explicitly added plasterboard supplies remain separately visible.

The shared full-width visual layout also applies to existing Gable/Edwardian checklists. Hipped-only filtering is applied through its manufactureGeometry model; their existing supply models remain intact for later review/template replication.

Validation: 269 calculation/regression checks passed, including new despatch filtering, central assembly count, guide sheet quantity, preserved extras and model immutability checks. Existing UI/book/save checks passed. A 41-row Hipped checklist renders with the requested headings and omissions. No local full React build or browser pagination was available.

On your PC:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/summaryIdiotList.test.js
npm run build

Check Hipped Checklist / manufacture-book final page. Send the full Print Preview page to check readability and pagination. Confirm plasterboard quantity is visible in Miscellaneous and its Not Supplied label is unambiguous. Added tiles/gutter fittings should still appear after reopening the saved quote.
