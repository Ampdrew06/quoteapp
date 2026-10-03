Apply AFTER Timberlite_Covering_Weights_v1.zip.
Extract into C:\Users\User\Documents\aw timberlite\B TimberLite\quoteapp-v2

Moves the new installed covering weight audit from Summary to Technical.
Uses the same shared area and density helper. No live weight, price or
quantity formulas are changed by this overlay.
The existing tile/lath comparison panel is left in place.

Replaces Summary.jsx and LeanToTechnical.jsx using the source supplied in
src(3).zip plus the v1 overlay. Preserve any subsequent manual edits.

The full Windows regression run already passed: 16 suites, 72 tests.
This follow-up is a presentation change. Check it with:
npm run build

Then verify Technical shows membrane 25.715m2 / 4.63kg and SuperQuilt
22.138m2 / 13.84kg for the unchanged roof shown in the latest screenshots.
