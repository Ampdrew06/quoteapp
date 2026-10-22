Timberlite 5-Facet Victorian D/O, Summary and Save — v158

APPLY OVER v157
Merge included src folders, replace/add files, compile/deploy. No new dependencies or database schema changes are included.

HOME / D/O
5 Facet Victorian is now a working Home choice for admin/trade. It opens /quote/victorian-five with fresh blank dimensions, using the established Victorian D/O form, Edit collapse behaviour, customer plan/roof details and separate price card.
- Fixed150degree corners, six hips, no extra front boss rafters;850mm Victorian support threshold.
- Five-facet materials use the seven-plane geometry and confirmed Universal/135degree stock fittings.
- Labour, delivery, markup, discount and VAT reuse the established quotation functions.
- Trade postcode and matching verified route are required. Admin can omit postcode and retain existing customer/default delivery behaviour.
- Missing rates or unresolved product reviews still prevent quote saving; deferred weights do not block it.

SUMMARY / TECHNICAL
Admin /quote/victorian-five/summary uses the same model and pricing as D/O, including quantity adjustments, exclusions, added items, labour overrides and existing pricing controls.
Technical remains the detailed plan/material review. It now shares the D/O five-facet draft rather than a separate geometry draft; older preview values can be read as a fallback. Reference buttons explicitly detach any saved quote before loading a new test design.
Existing3-facet input storage remains separate and unchanged.

SAVE / REOPEN
Five-facet records use roof_style/roofStyle='victorian-five',frontFacetCount=5 and six150degree corner angles. Their draft key is victorianFiveInputs.
Save/Update retain design options, customer/reference, route, Summary changes, pricing snapshot and material snapshot through the existing quotes API. Reopen routing covers admin Quotes and trade My Quotes. Reset restores the active record; New Quote detaches and starts fresh.
- No manufacture book or checklist is exposed for this style yet.
- Quote-to-job conversion for five-facet records is withheld until that manufacture workflow exists. Other styles retain their conversion controls.
- Existing customer-code login/account filtering remains the testing setup; authenticated database ownership is still a release prerequisite. No authentication changes are made here.

VALIDATION
411 calculation/material checks pass, including shared3-facet regressions and new5-facet pricing equality, Summary adjustments, trade/admin postcode handling, record persistence, separate drafts and missing-rate rejection.
Actual component/save-handler checks pass for5-facet save/update, D/O-to-Summary selling-price equality, trade postcode prompting, customer ownership and My Quotes reopening. Existing Lean-To/Hipped13save checks and Gable/Edwardian/3-facet save/update handler checks pass. Database responses were simulated; full app compilation, live Supabase writes and browser layout QA require your local/deployed test.

SUGGESTED LIVE CHECK
1. Admin:3150x3300@25, Quote. Compare D/O and Summary prices. Save with a reference, go Home, reopen from Quotes, edit and Update Quote.
2. Repeat3800x4200@25 and confirm six hips/five front jacks.
3. Modify an item quantity in Summary, return to D/O, compare price and save/reopen.
4. Trade: confirm blank postcode prompts and prevents a price; enter postcode and calculate route, then save/reopen through My Quotes.
5. Switch between3-facet and5-facet quotes; verify dimensions and facet count never mix. Test narrow mobile layout.
