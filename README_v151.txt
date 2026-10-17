Timberlite Save Quote fix — v151
Apply over v150. Merge the included src folder into your project and replace the files, then compile/deploy as usual.

Lean-To and Hipped Lean-To previously disabled Save when a trade customer reference was missing. After Quote collapsed the inputs, the required field was hidden and the disabled button gave no explanation. Save now remains actionable and opens Edit with an alert for the missing reference or postcode/dimensions. Existing validation still prevents incomplete records being written.

Validation: 10 actual shared Lean-To/Hipped callback checks, plus actual Gable, Edwardian and Victorian new-save/update handlers with database boundaries simulated. Both hipped boss arrangements and existing-record updates covered. Existing Victorian component/quotation checks pass. Full application compilation and live Supabase writes were not available in this source-only workspace.

Please test on mobile: generate a Hipped Lean-To price without a customer reference, press Save Quote, enter the prompted reference and save again. Then reopen from Quotes, edit and Update Quote. If saving still fails with all required details supplied, report the alert shown and whether the account is admin or trade so the separate database/record failure can be traced.
