Timberlite v338 — Saved Order Form and manufacture delivery details

Apply over v337 by merging the included src folder. No PowerShell command.
Quotation styles, email signature, tile colours and your print spacing CSS
are not replaced.

Order Form (including the combined pack) now has Save order details.
Enter the address, required date and contacts, then click Save order details.
The confirmation reports when the saved quote/job has been updated.
Reopen the saved quote and details return. There is no need to press Update Quote.
Form billing/contact edits apply to this quote, not the master customer record.

Manufacture save calls now send blank date/job number values as null rather
than empty strings. Gable and Edwardian display the database error if saving
still fails. Victorian book delivery details now also save to the shared record.
Changes made in the Order Form are read by the Manufacture Book on reopening.

Geometry, pricing, job status and numbering are not changed by Order Form save.
The address is stored in the existing delivery_address_json field; no database
migration is required. Verified locally using mocked API save/reopen scenarios.
The live Supabase connection was not available to verify the reported failure.
