Timberlite v244 — Installed covering weights and shared fixing allowances
Apply over v243. Back up src, merge the included src folder into your local project, and restart with your API-enabled launcher.

Implemented
- Regular Hipped and Victorian Hipped now use one installed main-tile weight calculation: developed covering area and the configured product weight/density (pitch bands for slate). Spare tiles and supply rounding affect order/cost, not installed load.
- Steel hip tile weight uses allocated pieces, including half-piece allocations, rather than adding unused stock halves to roof weight. Whole stock ordering remains unchanged.
- Loose touch-up kits add no installed roof weight.
- Saved supply changes and exclusions retain installed covering/fixing weights. Whole item quantities and ordering aliases agree after changes. Added items retain their existing separate treatment.
- Both routes share tile-fixing rates from Materials and separate internal/external lath box rounding. Regular Hipped no longer adds duplicate loose screws for factory ringbeam outer-fixing/upstand-finishing laths; their glue/staple assembly allowance already exists.
- Regular Hipped now includes the same eight concrete screws as the Victorian route, charged as consumed units from configured box price. Extra screw adjustments retain the unrounded unit rate, avoiding a penny rounding error.
- Fixing weight uses estimated installed screw count and explicit Materials box-weight/pack rates. Spare box contents do not add installed weight. If no explicit box-weight rate exists, weight is shown as Unconfigured rather than inferred from ambiguous legacy aliases or hardcoded box weights. Prices remain independent of missing weights.
- Summary respects explicitly zero installed weight. Technical explains that perimeter ringbeam screws are not duplicated.

Controlled5500 x3000,15degree front,bosses exactly1500mm
Both routes:70 main tiles,7 hip tiles,2 ninety-degree caps;2 lath-screw boxes;8 concrete screws. Existing tile orders/prices and all timber cut profiles remain unchanged.
Regular main-tile installed weight becomes144.14kg rather than153.30kg at the reference2.19kg/tile and3.2tiles/m2. Victorian remains144.57kg. The residual0.43kg comes from developed external covering areas of approximately20.568m2 and20.630m2. It has NOT been rounded away or corrected with a price/weight override.
This release aligns the policy but does not claim complete roof-weight parity. The small outside covering surface/eaves geometry difference is the next investigation. Other consumable/factory weights may remain unconfigured.

Preserved
Roof geometry, bosses, manual rafters, insulation rules fromv243, timber cuts/numbering, tile orders, tile prices, plastics and guttering. Ordinary Lean-To full materials model unchanged. Reopen/recalculate saved test quotes and save again when refreshing stored pricing snapshots.

Validation
Source-level tests passed for installed main/hip/cap/kit weights; positive/excessive-negative supply changes; exclusions; exact concrete-screw adjustment pricing; configured fixing weights/rates; separate lath box rounding and no duplicate perimeter screws; footer reconciliation. Four covering products tested with explicit fixture rates where needed (including configured Tapco hip coverage). Independent policy examples checked.
Before/after checks confirm unchanged geometry/cuts and tile orders/prices. Existing v243 insulation, v239 PIR pricing, v241 covering, v242 factory allowances, v230 book order, v231 persistence, v235 soffit and v236 Gable overhang checks passed. Source/test files parsed with Babel. Native Jest, full CRA build, browser rendering and physical testing were unavailable in this source-only workspace.

Following work
Trace the residual developed covering-area difference, then verify outside-frame insulation boundaries across the remaining styles as requested. No geometry or insulation changes to those other styles are included here.
