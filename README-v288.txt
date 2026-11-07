Timberlite v288 — To Order and List Materials status

Copy src and public into matching folders. No SQL required.
Cumulative update; preserves previous calendar and Victorian survey changes.

List: Materials column follows Payment status. Pink means Review needed or
N to order. Green means reviewed and all lines Ordered/In stock, or explicitly
reviewed None required. Existing orders start Review needed; no automatic claim
that an empty list is complete. Duplicate Jobs/Customers links removed.

To Order uses selected delivery month, with date-sorted job dropdowns. Use the
month controls or Unscheduled. Active included jobs/manual orders only; archived
and cancelled entries stay excluded. Open a job and add lines inside Timber,
Gutters, Plastics, Insulation, Metal items, Miscellaneous or Glazing. Templates
include joists,9/18mm ply,PIR50/100,SuperQuilt,gutter items,fascia/soffit/accessories,
foam tape,membrane,rubber,2.5litre deck adhesive,1litre bond adhesive,vents/fixed
glazing/A-frame glazing. Enter size/colour/spec,positive qty,unit and status.
Remove lines not required. Existing glazing/A-frame notes are visible above.

Statuses: To order / Ordered / In stock. Confirm Requirements reviewed, then
Save materials checklist. Spec/quantity/description/unit edits reset that line
to To order and clear review. Adding/removing lines also clears review. Status
changes retain review. Save is explicit; failures retain all draft edits and
use the existing version-conflict protection. Financial totals do not change.
No supplier orders are sent. No partial-quantity ordering or supplier ledger yet.
Checklist is saved in the existing Schedule entry JSON, no DB migration needed.

App job draft import is optional and explicitly replaces a draft only after a
confirmation if it already contains items. Supported saved-model families:
Gable,Edwardian,3/5facet Victorian,half/half (combination). Uses the saved design,
saved Materials snapshot and Summary exclusions/adjustments; does not read current
Materials prices. Other families or missing snapshots use manual entry for now.
Draft imports start To order and unreviewed. Imported timber may be net metres
or sheet area, not optimised stock length/sheet quantities: review and convert.
Glazing and extras need manual review/entry. No guessed glazing quantities.
Common stock screws/rivets/factory consumables are omitted. This is a purchasing
reminder, not a full copy of Summary or a numbered workshop cutting list.

Checks passed: reviewed/empty/pending/ordered/stock status rules; positive qty;
grouped editor save; preserved money/deposits/notes; save-conflict draft retention;
List column/link changes; saved-app draft import; calendar details/leave/colour
regressions. JSX parsed. No full CRA build, live SQL, browser/device verification
or supplier submission performed.
