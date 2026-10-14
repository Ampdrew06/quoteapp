Timberlite v108 — Shared manufacture-book page 2 layout
Apply over v107. Copy the included src folder into quoteapp-v2 and replace included files.

Scope: page 2 only for Lean-To, Hipped Lean-To (offset and central), Gable and Edwardian.

All styles use one ManufacturePlanPage component matching the accepted Hipped benchmark:
- Centred Roof Plan title.
- Eight fields: Customer, Reference, Roof, Frame, Tiles, Fascia, Gutter, Roof weight.
- Centred scale-preserving roof plan.
- Matching bottom table: Facet, Pitch, Support, Soffit.
- Shared 194mm x 279mm frame for A4 printing with 6mm margins.

Lean-To retains Side Elevation / Height Check below the plan. Diagram bounds now include its left height label, and main-plan margins give external/internal dimensions space to print. Gable/Edwardian use Hipped-style text sizing, blue member references, green pitches and matching dimension prefixes. Edwardian includes front cumulative positions, front bay gaps and side-jack positions on the plan. Short geometry notes sit below the facet table.

No geometry/pricing formula changes. Both Hipped diagrams compare byte-for-byte with v107. The shared front page and subsequent schedules are unchanged. Gable/Edwardian plan proportions now follow their actual external dimensions rather than fixed drawing rectangles; printed dimensions remain the same.

Validation: 251 calculation checks passed; shared-frame checks for all five page variants, actual SVG rendering and JSX syntax checks passed. Existing Gable, Lean-To and Edwardian quote/save/book checks passed. Rendered plan diagrams were visually inspected. A browser print renderer is unavailable here; final print pagination must be checked on your PC. No full React build was available here.

On your PC:
npm run build
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/edwardianManufactureSchedule.test.js src/lib/Manufacturing/gableManufactureSchedule.test.js src/lib/geometry/edwardianGeometry.test.js

Please review A4 Print Preview at 100% scale with browser headers/footers off:
1. Lean-To page 2: all four overall dimensions readable; side elevation retained; job strip and facet table present.
2. Gable page 2: centred diagram with matching job strip and bottom facet table.
3. Edwardian page 2: matching header/table; blue member references, positions and dimensions readable.
4. Either Hipped variant: confirm the benchmark layout remains as expected.

Please send page-2 screenshots for Lean-To, Gable and Edwardian. We can then refine their drawing sizes/spacing before moving to subsequent pages.
