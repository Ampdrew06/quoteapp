Timberlite Victorian Jack Rafter Pricing — v150

Apply over v149. Extract and merge the src folder into your app, replacing the included files, then compile and deploy as usual.

Changes
- Victorian jack-rafter layouts can generate prices and save quotes.
- Includes jack timber, insulation cradles, lath fixing intersections, hooks/brackets and associated factory/site fixings.
- Includes finished jack rafters in the despatch checklist; fitted hardware remains part of its assembly.
- Side jack threshold now measures the unsupported distance from the ridge point, avoiding premature jacks caused by the boss-truss centre offset.
- Larger roof areas automatically receive additional membrane rolls where required.
- Jack pricing profiles use existing shared connection rules and exclude the 160mm boss allowance. Workshop cut diagrams remain pending verification.
- Missing weight allocations remain deferred.

Validation
386 calculation/material checks passed, plus component-handler checks for quote display, Save enabling, postcode roles and retained inputs. Existing no-jack reference checks pass. This source-only workspace cannot perform the full application build or live Vercel verification.

Suggested local checks
1. Try a 3500mm-wide regular Victorian, then 3800 x 4100mm, then return to 3500mm. The smaller layout should not retain the wider roof's jacks.
2. On the 3800 x 4100mm example check eight jack rafters, eight jack hooks and eight jack brackets, with a valid price.
3. Compare D/O and Summary prices, then save and reopen the quote.

Existing restrictions for unsupported geometry and unresolved product specifications still apply.
