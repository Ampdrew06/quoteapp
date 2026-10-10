Timberlite v79 — Gable D/O and Manufacture Book presentation
Apply OVER v78. Copy src into quoteapp-v2 and accept overwrites. No deletions. No changes to shared Lean-To/Hipped geometry or manufacture books; RoofPlanDiagram is not included.

D/O is grouped into Roof Dimensions, Soffits/Overhang/Height, and Roof Finish/Quotation Details. Normal quote saving, postcode lookup, extras, exclusions and prices are preserved. Unequal side soffits remain admin only. The example loader is admin only. Reset design retains the current signed-in customer.

Gable navigation now includes Technical, Manufacture Book, Idiot List, Summary, Quotes, Jobs, Customers, Print and Materials (admin). The new Gable Idiot List route is /quote/gable/idiot-list and uses exactly the same shared model/checklist as the manufacture book. Existing Lean-To routes are not redirected.

Page 1 is now a boxed Manufacture Book front page matching the existing books' format: job/customer/reference/date, delivery type, roof/frame/tile/colour/soffit details, address, contact name/phone, instructions, Summary extras and manufacture/check signoffs.
- Converted-job details save to the existing quotation/job record, including delivery_address_json. Existing address/contact/type fields are preserved when editing one field.
- Draft book details can be saved locally with Save draft book details; reopening the same reference and dimensions restores them. A different reference/dimensions does not inherit them.

Page 2 is the large CAD roof plan with truss positions from the wall, centre gaps, dashed internal frame outline, internal/external width dimension lines and internal/manufacturing projections. Customer/reference/colours/weight are in its compact header. Other component pages follow; the integrated Idiot List remains last. The 5mm factory clearance is included exactly once. Full front face includes the existing outer gusset in one layer.

Summary, pricing and the book remain connected to the v77/v78 integrated requirements; no new material subtotal or second weight contribution is introduced. Extras and adjusted quantities appear on the checklist; price exclusions do not remove physically supplied items. Total lath stock includes fitted ring-beam laths and is labelled as a manufacture stock check. Tile cutting list and exact central box-end shape remain future work.

FILE MAP
pages/gable/GableNavigation.jsx — Gable-specific full tab strip, reused by D/O/Summary/Technical/book/list.
pages/gable/GableJobFront.jsx — boxed front-page fields, extras, address/contact/instructions and signoffs.
pages/gable/GableIdiotList.jsx — standalone checklist from the existing model and manufacture schedule.
pages/gable/GablePage.jsx — shared navigation and protected Idiot List view.
pages/gable/GableDesignPreview.jsx — grouped D/O controls and current integration wording.
pages/gable/GableManufacture.jsx — front-page wiring, draft/job details persistence, customer lookup and enhanced page-2 plan.
app/routes.js — adds /quote/gable/idiot-list.
No redundant files are introduced or retired.

VALIDATION
160 lightweight transformed-module regression checks passed. Actual React handler checks passed for Summary extras/exclusions, delivery/save/reopen, Gable job conversion/opening, front-page-first/plan-second/checklist-last, standalone checklist model identity, local draft reopen and saved-job address/contact payload. JSX transformations passed; actual SVG plan/member diagrams rendered and inspected. The full CRA installation is unavailable here; genuine Jest/build and complete browser print pagination must be checked on your PC.

Windows regression command:
npm test -- --watchAll=false --runInBand --runTestsByPath src/lib/Manufacturing/gableManufactureSchedule.test.js src/lib/Calculations/gableSummaryMaterialsModel.test.js src/lib/Calculations/summaryIdiotList.test.js src/lib/Calculations/summaryAddedItems.test.js

Remote review: open Gable Design/Options, Summary, Idiot List and Manufacture Book. Check A4 Print Preview, front-page details, page-2 dimension readability, final checklist and one manually added extra. No physical roof measurements are required for this presentation review.
