Timberlite v335 — Modern white Order Form

This is a small update over v334. It preserves your quotation signature and CSS edits.

1. Extract the ZIP contents into your app root, the folder containing src and package.json.
   Merge the included src folder as usual.
2. Open PowerShell in that folder and run:
   powershell -ExecutionPolicy Bypass -File .\Apply-v335.ps1

The script only inserts the new Order Form component and maps contact fields.
It backs up CustomerRoofDocument.jsx before editing it. No quotation styles
or signature lines are overwritten.

The Order Form uses the real existing Timberlite logo. The page background is
white, with dark text and grey rules, and no bronze shading. Both address areas
have room for five lines and expand for longer saved addresses. Delivery postcode
belongs in the full address; there is no separate postcode field.

Saved customer, order, price and Summary notes fill automatically. Blank contact,
billing and delivery fields can be typed before printing. These on-page edits
affect the printed document only, not the saved customer or job. Save quote changes
from Design/Options before opening documents.

Normal content is designed for one A4 portrait page. Unusually long addresses or
notes can extend the form rather than hiding information. Check Print Preview.
