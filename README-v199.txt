Apply over v198. Copy src into your project, replacing matching files.

Victorian Hipped matched eaves review
The front is the controlling soffit. Standard-board mode reuses the existing facet-eaves and chamfered-lath alignment rules for each of the five facets, using the resolved wallplate side pitch for the two side facets. Specified-envelope mode retains the explicit front envelope and aligns other feet to it without the standard-board fitting tolerance. Unsupported widths below the 95mm PSE or an adjustment that would silently change the requested front reference are rejected.

The external ply outline now uses each facet's calculated width. Ply and outer-lath profile ends follow the actual varying-width corner intersections; their end angles can differ from the unchanged 22.5 degree PSE mitres. Ringbeam areas and member toe intersections consume the revised perimeter. Specified-soffit wallbar feet use the same resolved eaves profile. The preview table shows individual widths and common outside foot-plus-lath alignment height.

Current example (17 degree front, 25 degree sides, standard 150mm front soffit): approximately 175.24 / 209.57 / 225 / 209.57 / 175.24mm ply bases. Stock board widths and customer pricing are not introduced in this preview.

Verified: common foot-plus-lath outside height; exact five external edge lengths and corner closure; mirror symmetry; 20/25/30 degree targets; specified 50mm front envelope; existing side-pitch and wallplate checks; existing member schedule and editor checks. Actual ringbeam SVGs inspected. No full React compile/live deployment available locally.

The new-style hip/rafter manufacturing profiles remain provisional: their full finite-depth roof/joint datum integration is the next task. Matching the eaves does not validate those profiles for production.
