Timberlite v164 — Separate Tiles/Laths results

Apply over v163. Copy the included src folder into your project, replacing the files and adding pages/shared/DesignedRoofTilesLaths.jsx. No dependencies/database changes.

Gable, Edwardian and both Victorian roof styles now have dedicated /quote/<family>/tiles-laths routes. Their tabs no longer link to a hash in Technical, so Technical and Tiles/Laths highlight separately. The 5-facet Victorian now also has a Tiles/Laths tab.

The new read-only results page uses the existing roof geometry and tiling audit calculations, shared roof totals and per-facet lath schedule components. It reads the current family-specific D/O inputs, refreshes Materials on updates, and shows main order quantities from the accepted steel stagger sequence or slate ordering. Roof-edge coverings, support lath lengths and per-facet dimensions/rows are included. External field laths include chamfered eaves; internal/ringbeam laths are separate. Existing Summary adjustments/extras remain on Summary. No pricing/geometry calculation changes or new material charges.

Existing Technical audits remain available. Lean-To and Hipped Lean-To Tiles/Laths routes and their standalone/manual calculator are unchanged. New routes are admin-only.

Validation: all four actual results pages rendered with 2/3/5/7 facets and finite dimensions/totals; distinct tab targets and highlight callbacks; admin guard; JSX and route parsing; cross-family navigation regression checks. Full local compile and browser navigation/print checks remain for your local environment.
