Timberlite v84 — universal manufacture-book front
Apply over v83. Copy the included src folder into quoteapp-v2 and replace matching files. No files need deleting.

Lean-To, Hipped Lean-To and Gable now render the SAME ManufactureBookFront component. It owns headings, boxed details, address/contact/instructions, extras and authorisation areas. Roof adapters pass values and save/edit handlers only. Future roof styles should use this component instead of building another front page.

- Shared 4 x 4 details grid, including Box Gutter Details and Glazed Options for all styles.
- Internal dimensions and installed roof weight in a compact line beneath the grid.
- Arial 15px details/address/instructions; textareas do not use the browser monospace default.
- Address and instructions expand into the available page space, in approximately a 2:1 ratio.
- Short labels replace the large delivery/instructions heading.
- Fabrication and Despatch authorisation boxes reduced to 17mm high.
- Contact fields and Summary extras retained; factory notes supplied by the roof adapter.
- Gable no longer displays a duplicate front title/reference strip above the shared front.
- Lean-To draft front details can now be saved locally; fresh designs clear old draft details.
- Metadata identity and quote update/reset behaviour from v83 retained.

File map:
components/ManufactureBookFront.jsx: universal page appearance and controlled fields.
components/ManufactureBookFront.test.jsx: local Jest regressions for common layout and edits.
pages/gable/GableJobFront.jsx: Gable data adapter only.
pages/gable/GableManufacture.jsx: removes duplicate front title and outer padding.
pages/lean-to/LeanToPlanManufacture.jsx: shared front for Lean-To/Hipped; draft saving and current Summary details.
lib/activeDesignRecord.js: fresh designs clear Lean-To draft book metadata too.

Validation: 169 lightweight module checks passed. React handler/UI harness passed, including actual rendering of Lean-To/Hipped book routes, common Gable front, editable address/instructions, saved/draft job details and Update/Reset behaviours. JSX transformation passed for the changed pages. Full CRA/Jest and browser print rendering are not available here; please check the front page in print preview after applying.

Local tests:
npm test -- --watchAll=false --runInBand --runTestsByPath src/components/ManufactureBookFront.test.jsx src/lib/activeDesignRecord.test.js

Review: open the same saved job for each roof style. Check current customer/reference and delivery fields, the larger text boxes, the instructions height approximately half of the address height, and one front page followed by the Roof Plan page. Save metadata and reopen to confirm persistence.

Scope: this update shares the book front. D/O pages already have matching appearance, but are not yet entirely one universal component. Geometry/member pages remain driven by roof-specific calculations; further common layout extraction can be done when needed without changing those calculations.
