Apply over v98: extract into quoteapp-v2 and replace included files.
Home > Edwardian (admin): new Insulation and finished ceiling audit below timber.
Shows 50mm PIR cradles pooled with ring-beam faces, 100mm PIR, SuperQuilt roll mix, breather membrane and informational plasterboard.
Reference ceiling: 13.817m2 including 1.230m2 flat; plasterboard weight 117.45kg. Membrane coverage 17.304m2.
SuperQuilt and plasterboard use identical internal ceiling area, excluding soffits. Flat ceiling is clipped at the 595mm closure height and continues to its intersection with the front slope.
100mm PIR continues to apex/ridge, independent of ceiling flat; slab area uses frame envelope minus the existing timber-footprint estimate. These are area-based ordering allowances, not a PIR cut/nesting list.
Rear truss has one cradle face per member; intermediate and terminal trusses have two. Truss cradles stop at gussets. Other member cradles follow existing Hipped allowance.
Installed weight uses net area, not full ordered sheets/rolls. PIR100 weight supports per-m2 or pack-based rate. Plasterboard is not supplied/priced.
Still read-only: existing roof styles, live pricing, Summary, manufacture and Idiot List are unchanged.
210 lightweight checks plus Edwardian/existing UI and syntax checks passed. Please compile/run Jest on your PC.
Suggested test: npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Calculations/edwardianInsulationAudit.test.js src/lib/Calculations/edwardianTimberAudit.test.js src/lib/Calculations/edwardianRingBeamAudit.test.js src/lib/Calculations/edwardianMemberAudit.test.js src/lib/geometry/edwardianGeometry.test.js src/lib/Calculations/gableInsulationAudit.test.js
