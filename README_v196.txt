Timberlite v196 — Victorian Hipped Lean-To wallplate/boss joint review

Apply over v195. Back up your source, copy the included src folder over your project src folder and run your normal compile/deployment.

Open Home > Admin tools > Victorian Hipped Preview. A new Wallplate and boss assembly review appears between the ringbeam diagrams and hip/rafter review cuts. It includes the house-wall assembly elevation, joint endpoints A/B/C, paired sloping wallbar profiles WB1/WB2, horizontal wallplate WP1, saw settings, top/bottom edge lengths and factory-floor heights. Joint coordinates are available in a collapsed table.

The assembly reuses the existing Hipped Lean-To equal-depth boss, mitre and finished-assembly solvers. Depth remains 220mm and wallbar feet sit on the existing ringbeam-height datum (default 40mm). The plan boss inset is retained as B, the physical midpoint of each mitred joint. A and C are the top and bottom joint endpoints. Feet use the current ply-base extension, including standard/specified soffit treatment.

IMPORTANT DATUM FINDING: the paused Victorian Hipped plan model treats its boss as a simple slope endpoint. The existing manufacturing joint solver instead treats it as the midpoint of an equal-depth mitre. With the default dimensions, the nominal side-facet pitch is about 25.00 degrees and the joint-centred wallbar pitch is about 24.76 degrees. The new assembly closes mathematically with the plan B positions retained, but its datums still need reconciling with the roof planes and earlier member-cut model before production or material integration.

This distinction is displayed in the preview. The new assembly is deliberately not fed back into the earlier hip/rafter cuts. Those review profiles, roof layout, boss positions, material rates and pricing remain unchanged. This update does not claim a production-ready manufacture book or a completed style quotation.

Verification: all four packaged files pass Babel transformation; five new schedule cases; boss-centre and A/B/C midpoint checks; independent finished-height and bottom-edge closure; matching wallbar lengths; all three cut polygons and cut-face lengths; 50mm specified-soffit geometry; insufficient joint-space and invalid-floor rejection; no mutation of nominal geometry; actual preview rendering and boss-input updates; admin gate; visual inspection of the assembly and cut drawings; existing Victorian Hipped layout/ringbeam/member and regular Hipped manufacture regressions.

A full local React compile and deployed browser/live cloud checks were not available here. Please compile and inspect the new review section. The next technical step is datum reconciliation, before combining these schedules into materials and manufacture outputs.
