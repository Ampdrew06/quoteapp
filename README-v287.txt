Timberlite v287 — expanded calendar day details

Copy src and public into matching app folders. No SQL required.
Cumulative update including Victorian best-fit work. Victorian physical testing
is deferred until an actual order. Double Hipped Edwardian remains paused.
To Order is unchanged; this release only refines selected-day information.

Click a calendar day: customer orders now appear ABOVE day editing controls.
Each order shows customer/ref/job, payment status, width/projection/style,
tiles/colour, fascia/soffit/gutter details, glazing/A-frame, delivery address and
contact, delivery/production/book/invoice statuses, payment due, net/VAT/gross,
deposit/payments/outstanding and order notes. No start/end times are added.
Edit Schedule order opens the existing editor. Staff leave/colour/notes remain
editable with the existing save and conflict protection. Printed monthly staff
calendar remains compact, without these admin financial details.

For manual entries, expand Calendar roof specification & delivery details in
the order editor to add dimensions, plastics/gutters, delivery contact/address
and optional A-frame net amount. Glazing and A-frame description remain in the
existing fields. These values save in the existing entry JSON, no migration.
Older manually entered orders are preserved; missing details say Not recorded.
App jobs populate available dimensions/colours/address/contact from saved job.
Refresh details from saved job explicitly refreshes those available fields too;
as before, review before saving. Saved Schedule overrides take precedence on
ordinary reads. No customer billing address is substituted for site delivery.

A-frame net sale is included within existing Net sell, NOT an additional price.
If supplied, Roof net = Net sell minus A-frame net; VAT comes from saved gross
minus saved net (no20percent assumption here). An A-frame amount above total
net sell is rejected. Existing gross, deposits and payments remain unchanged.

Source checks passed for the supplied Outlook example: net4654.17 split into
roof3775.01 + A-frame879.16, VAT930.83, gross5585.00. Deposit/payment subtraction,
linked-job defaults and manual overrides, validation and Edit callback checked.
Calendar regression passed: full-year CB/RS leave, half-days, colours, date
boundaries, day save/conflict retention, order drilldown and print privacy CSS.
Existing v282 manual gross/tile/customer-history checks passed.
No full CRA build/live database/device or actual print verification available.
