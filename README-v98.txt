Apply over v97: extract into quoteapp-v2 and replace included files.
Home > Edwardian (admin): new Timber and truss joint audit below ring-beam results.
Counts all 19 joist members, 8 gussets, 8 chevrons and 4 assembled offcut closures on the reference roof. Uses the existing shared truss builder and ring-beam/member audits.
Shows joint dimensions, net quantities, configured waste, candidate material costs and installed weight allowances. No extra full Gable front face is added to an Edwardian.
Truss underside slope to closure: 1635.8mm; this is separate from the full internal slope.
Rear wall packers: 9mm plywood covered by existing practical waste allowance, matching Gable. No separate fabricated packer count or installed weight claimed.
Ring-beam timber is already included in the subtotal: do not add ring-beam audit quantities again. PIR faces are deferred to the insulation audit to avoid double charging.
Still read-only: existing roof styles, Summary, pricing, manufacture book and loading list unchanged. Field/internal/ridge/hip laths and other materials follow in later audits.
204 lightweight geometry/material checks plus existing and Edwardian UI/syntax checks passed. Please compile/run Jest on your PC.
Suggested test: npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/edwardianTimberAudit.test.js src/lib/Calculations/edwardianRingBeamAudit.test.js src/lib/Calculations/edwardianMemberAudit.test.js src/lib/geometry/edwardianGeometry.test.js src/lib/geometry/centralBossTrussAudit.test.js
