Timberlite v289 — purchasing group confirmations
Copy src and public into matching app folders. No SQL required.
Cumulative update retaining v288 requirements and calendar changes.
Each material group has an All ordered checkbox. Checking it marks all listed
items in that group Ordered; In stock items retain their status. Unticking it
returns ordered lines to To order, preserving stock items. Each line now also
has an Ordered checkbox alongside its status selector. Group checked state is
derived from item statuses, so checking individual lines updates the group.
Empty groups are disabled and do not block completion. An empty roof checklist
still needs explicit reviewed/no additional items confirmation; untouched orders
never turn green automatically. Nonempty checklists become complete when every
line is Ordered or In stock, without a separate review-checkbox hurdle.
Job heading turns green as the draft completes; save the checklist to persist
and update Materials on List. Unsaved changes retain discard protection.
Adding/changing requirements resets affected line to To order as before.
Checks passed: individual/batch synchronisation, group isolation, stock status
preservation, empty states, completion and dirty tracking; changed JSX parsed.
No live database or full CRA/browser build tested here.
