Timberlite v290 — Technical metal audit null-weight fix
Copy src and public into matching folders. No SQL required.
Cumulative update including v289 purchasing group checkboxes.

The Lean-To Technical page formatted every metal row weight using toFixed.
Ringbeam corner braces deliberately carry weightKg:null pending confirmation,
causing Cannot read properties of null (reading toFixed) when that audit rendered.
The page now displays Weight not configured for missing/nonfinite metal weights.
Known numeric weights retain two decimal places, including genuine zero.
The known-weight subtotal is labelled partial when positive-quantity rows lack
weights. No material rates, weights, geometry or purchasing data are changed.

Checks passed with actual corner-brace requirement and metal audit rows; null,
undefined,NaN,zero and known weight cases; changed page JSX parsed/loaded.
No full CRA build or live browser verification performed here.
