Timberlite Gable PIR Correction — v65

Apply over v64 by merging the src folder and replacing the three included files.

CONFIRMED CONSTRUCTION
50mm rebated cradle strips are present only on faces bordering insulation bays. They run from the ring-beam upstands to the outer edge of the 9mm gussets, stopping before the apex section. The 140mm strip width remains the existing allowance.
100mm PIR slabs continue from the upstands to the peak, with chamfered meeting edges. Expanding foam seals joints against insulation and joists. No new foam quantity formula is introduced.
SuperQuilt and plasterboard have identical installed coverage: house wall to inside of front frame, two slopes plus the continuous flat ceiling below gussets/closures. This already used the internal projection and has not been extended to the front overhang.

EXPECTED 3800 x 4100, 25 DEGREE FIGURES
Cradle run to gusset per member: 1845.4mm.
50mm cradle net area: 7.234m2.
50mm combined cradle + ring-beam faces: 10.142m2 (4 sheets with the current 5% waste and 2.88m2 sheets).
100mm PIR slab area remains 17.176m2.
SuperQuilt/plasterboard installed ceiling area remains 16.938m2.
100mm PIR weight now reads the same pir100_weight_kg_per_m2 Materials field used by Summary, with nested-field and weight-per-pack fallbacks. Explicit zero is preserved. At 3.125kg/m2, the installed weight is 53.68kg; your configured rate controls the result.

These remain read-only audit candidates. Cradle length retains the existing outside-frame-line lower datum, excludes soffit extensions and now deducts half the gusset width at the upper end. Sheet counts are area estimates with waste, not a validated cutting plan. No Summary, quotation, manufacture-book or Idiot List quantities are changed. Existing roof geometry and Home Tile Calcs are untouched.

FILE MAP
src/lib/Calculations/gableInsulationAudit.js — corrected cradle endpoints and 100mm PIR weight lookup; clarified separate pitched insulation and flat ceiling areas.
src/pages/gable/GableDesignPreview.jsx — labels the distinct cradle-to-gusset and slab-to-apex runs.
src/lib/Calculations/gableInsulationAudit.test.js — regression tests for gusset endpoints, shared weight lookup/zero/pack fallback, and internal ceiling independence from front overhang.
No files retired or deleted.

LOCAL CHECKS
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/gableInsulationAudit.test.js src/lib/Calculations/gableTimberAudit.test.js src/lib/geometry/gableGeometry.test.js src/lib/Calculations/insulationIntegrationAudit.test.js src/lib/Manufacturing/ringBeamManufactureSchedule.test.js src/lib/geometry/centralBossTrussAudit.test.js src/lib/geometry/centralBossDesign.test.js
npm run build

Verification here: 111 lightweight calculation checks passed; all three source files parsed; Gable page evaluated with its calculation dependencies and both drawings rendered. Full CRA Jest/build must be run locally.
