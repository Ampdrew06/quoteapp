Timberlite v85 — compact job / quote number field
Apply over v84. Copy src into quoteapp-v2, replacing the two included files.

The shared manufacture front now places the editable job number and the quote number side by side in the same field. The quote number no longer occupies a second line, allowing the first row to retain the normal row height. Applies to all current styles using the shared front.

React handler/UI harness passed, including the horizontal number-field regression. Full CRA/Jest and browser print preview remain local checks.

Optional local test:
npm test -- --watchAll=false --runInBand --runTestsByPath src/components/ManufactureBookFront.test.jsx
