Timberlite v235 - Soffit continuity across the remaining template styles
Apply over v234. Copy the included src contents into your app src folder, replacing matching files. Restart using your usual API launcher. This is a source delta, not a complete standalone app.

Covered styles: Lean-To, regular Hipped Lean-To, Gable, Edwardian and Victorian Hipped Lean-To. The 3 and 5 Facet Victorian changes from v234 remain in place.

Common wording: Soffit requirement / Automatic / Soffit restriction to side / No soffit. Required side soffit reveals one dimension, applied to both sides. New roofs retain 150mm default soffits. The Lean-To front-only control intentionally offers Automatic and No soffit: its optional left/right side overhangs remain separate, as agreed.

Gable: required side size applies equally to left and right. No soffit removes side soffit boards and front overhang, while retaining compulsory side fascia-lip clearance and space for the 95mm PSE. Existing saved separate left/right settings are preserved in Automatic mode; the separate-sides checkbox is removed from the normal D/O flow. Returning to Automatic restores retained values.

Edwardian: adds No soffit to the existing eaves solver. Side fascia lips remain; any front strip necessary for aligned fascia is supplied. D/O shows the resolved front dimension. Manufacture book identifies the no-soffit setting.

Victorian Hipped Lean-To: adds No soffit through geometry, timber, plastics, materials and book front. Both wall ends are also supported for the no-soffit front detail. Compulsory side lips remain. The front/chamfered facets retain additional strips only where alignment needs them. J-trim is not charged on facets with no soffit strips. No-soffit combinations that fail the existing 95mm PSE clearance checks are explicitly rejected for workshop review rather than silently changing the side request.

Regular Hipped Lean-To: same wording and symmetric selection, without the controlling-side dropdown. On a new/changed selection the shared solver chooses the limiting side automatically if side pitches differ. At unequal side pitches, both exact requested sizes cannot generally coexist with the same fascia height: the other side is derived within the restriction. Previously saved left/right controlling-side settings remain unchanged until that requirement is edited. Existing cutting equations are retained. Resolved front projection is shown rather than the old requested front value.

Lean-To: No soffit sets the requested front to zero; the existing manufacture formula retains 25mm fascia-lip clearance. Independent optional side overhangs are retained. Fixed a zero-value fallback that incorrectly restored 150mm in the quote cost calculation; ringbeam ply quantities now retain the compulsory clearance consistently.

Important: No soffit means no optional soffit boards, not a promise of zero projection outside the frames. Timber/fascia clearance remains; unequal pitches can require a front/chamfered strip. Limits that cannot be manufactured need workshop review. This update does not validate every possible roof/pitch combination physically.

Validation performed in the source-only workspace:
- 34 integration configurations across Gable, Edwardian, VH and Hipped eaves; VH includes all nine end combinations.
- Shared control callbacks, symmetric selection, JSON rebuild and impossible VH no-soffit rejection.
- Additional default-material rebuild checks for nine combinations.
- 17 pre-existing standard/restricted full-model snapshots matched previous code exactly.
- The 24 v234 legacy Victorian snapshots remained unchanged; v234 new-mode checks passed.
- Book-details saving and Home regression checks passed; all changed files parsed.
- Full CRA production build, live database/browser interaction and physical assembly were not run here.

Suggested review after installing: for each style try Automatic, 80mm restriction (where applicable) and No soffit; check plan external dimensions, resulting front projection, Summary soffit boards/trims and book cuts. Save/reopen one of each. Reopen an older custom-soffit quote to confirm its retained settings. Please report any discrepancy before manufacture.
