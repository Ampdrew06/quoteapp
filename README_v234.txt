Timberlite v234 - Victorian soffit requirements (stage 1)
Apply over v233. Copy the included src contents into your app src folder, replacing matching files. Restart with your usual API launcher.

Scope: standard 3 Facet Victorian and 5 Facet Victorian roofs. Other roof styles will follow in the next stage.

Design/Options now has Soffit requirement: Automatic, Soffit restriction to side, No soffit. The restricted option reveals one required dimension (e.g. 80mm), applied symmetrically. The front field shows the resulting common value while controlled; returning to Automatic restores the retained front value (150mm for a new roof). The redundant Soffit basis dropdown is removed from D/O; existing custom/saved basis settings are preserved and remain available on Technical when not controlled.

Standard Victorian corner geometry gives equal facet pitches, so the controlled side foot and base apply to all facets. This uses the existing side-envelope solver and 220mm timber/25mm chamfered-lath alignment, not a new foot-cut equation. For default materials, 80mm overall envelope gives a 135mm ply base and 65mm soffit strip. The same dimensions drive CAD, trusses, rafters, hips, ringbeams, covering, materials, Summary and manufacture book.

No soffit removes soffit boards, J-trim and H-trim. It retains the existing compulsory fascia-lip construction (25mm beyond the frame in the default configuration, giving a 95mm ply base). This is stated on D/O, Technical and the book front. No-soffit does not promise a zero-projection roof edge. Fascia, guttering and ventilation remain included. A required envelope too small for the 95mm PSE is rejected instead of silently enlarged.

Limits: adjusted Victorian corner angles and independent front pitch remain outside this supported soffit integration. The code explicitly rejects controlled soffits on adjusted-angle roofs. Unequal-pitch behavior on other styles is for later stages. Existing standard/custom saved roofs retain their calculation path and settings.

Validation: 18 geometry/cut/material configurations covering 3/5 facets, Automatic/80mm/No soffit and 15/25/30 degrees; actual D/O control callbacks and JSON restoration; invalid restrictions; 24 legacy full-model snapshots matched the previous code exactly; book-details saving and Home regression checks passed. All changed files parsed. Full CRA production build, browser print and physical assembly checks were not available here. Source tests are included.

Suggested local check: start a new 3 or 5 Facet Victorian, enter dimensions, choose restriction and 80mm; compare CAD, Summary and book. Try No soffit and verify the fascia-lip note and no soffit boards/trims. Return to Automatic and confirm the original 150mm default. Save/reopen to check retention.
