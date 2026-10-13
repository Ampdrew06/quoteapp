Timberlite v106 — Edwardian navigation persistence
Apply over v105: extract and copy the src folder into quoteapp-v2, replacing the included file.

Fix: the quoted plan and price now remain visible when the Edwardian D/O page is reopened from Summary, Technical or Idiot List. The current inputs and amendments continue to determine the price.
Home fresh-design entry and Reset without a saved quote still clear the preview. Reset to a saved quote still displays its results.

Validation: Edwardian UI regression checks including page remount after Quote, blank Reset/remount, fresh entry, saved Reset, admin front pitch and JSX syntax passed. Existing calculation checks passed.

On your PC run npm run build. Quote an Edwardian roof, open Summary and return to D/O; confirm the plan and price remain. Repeat from Technical and Idiot List. Check Home begins a fresh design.
