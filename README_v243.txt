Timberlite v243 — Shared Hipped insulation rules
Apply over v242. Back up src, merge the included src folder into your local project, and restart using your API-enabled launcher.

This is the insulation stage of the agreed reconciliation plan. It does not claim that all roof weights/materials now agree. Tile weights and outstanding fixing allowances remain next.

Shared policy
- PIR covers the roof to the outside of active frame/eaves lines, excluding soffits. House-wall boundaries stay fixed.
- Regular Hipped now uses the same offset/roof-plane partition calculation as the Victorian Hipped insulation route. No change to either roof's design geometry or timber cut profiles.
- Timber footprint deduction uses the nominal45mm member width, distinct from48mm ringbeam routing slots.
- Regular Hipped cradle runs now extend from their existing internal member profiles to the frame boundary, including sloping wallbars. Horizontal wallplate remains excluded.
- PIR50 cradle and both ringbeam-face areas pool before its configured waste is applied once. PIR50 has its own sheet dimensions/waste, independent of PIR100.
- PIR100 has its own configured sheet dimensions/waste and whole-sheet price. PIR50 retains consumed-area pricing with whole-sheet ordering allowances.
- Installed weight excludes ordering waste and sheet rounding. Both routes apply the Materials cradle machining multiplier to net cradle area only; ringbeam insulation retains its full material weight. A configured zero multiplier is honoured.
- Required-area display is net installed area. Supply adjustments retain their existing units: regular PIR adjustments are m2; Victorian adjustments are whole sheets. They affect supply/cost, not installed coverage or weight.
- Technical shows the corrected frame boundary and nominal member width.

Controlled comparison:5500 x3000/front15/bosses exactly1500mm
Both routes: gross outside-frame roof18.414720765m2; seven PIR100 sheets and five PIR50 sheets.
Regular PIR100 net17.020633764m2; Victorian17.017584147m2.
Regular PIR50 net13.097258162m2; Victorian13.116233556m2.
PIR50 installed weight at the source test rates:15.08kg regular versus15.10kg Victorian. PIR100:53.19kg versus53.18kg.
Residual differences follow the existing provisional member profiles; they have not been forced to match. In the user's rounded27.8-degree case, the small boss/eaves geometry differences also remain. Seven rather than six PIR100 sheets is the consequence of consistent outside-frame coverage, not a price-matching override.

Preserved
Geometry, bosses, measured facets, manual rafters, numbering, timber cuts, all non-insulation sections and ordinary Lean-To materials are unchanged. Existing quotes use current calculations when reopened; review and save again if refreshing their stored pricing snapshots.

Checks passed
- Exact-boss comparison, independent geometric examples, sheet boundary rounding, custom board sizes, independent waste settings, net installed weights, zero machining multiplier, saved adjustments, exclusions and footer reconciliation.
-18 regular Hipped size/end/central-boss cases plus existing34-style soffit matrix.
- Existing v239 PIR pricing, v241 covering, v242 factory/PIR50 behaviour, v230 manufacture order, v231 persistence and v236 Gable overhang checks.
- Before/after confirms unchanged geometry/cuts and all other material sections. Ordinary Lean-To full model unchanged.
Source modules were compiled/executed in the available source test harness. Full CRA build, browser rendering, native Jest and physical manufacture validation were unavailable. Included Jest tests are for the local project.
