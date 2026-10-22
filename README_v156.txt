Timberlite 5-Facet Victorian Materials Audit — v156

Apply over v155. Merge src folders, replace/add included files, then compile/deploy.

Open the existing admin5-facet Home card or /quote/victorian-five/technical. The review now includes roof covering, plastics and gutter profile selectors, reconciled material quantities/known costs across six sections, plus expandable individual audits.

INCLUDED
- Seven ringbeam profiles,150degree corner/15degree mitre geometry, correct square house-wall ends on both side beams, truss/hip/jack slots and clear upstand bays.
- Six hips, existing truss construction and actual jack timber profiles for pricing allowances; one hook and bracket per jack, six spar pairs/twelve hooks at the boss and no extra boss intermediates.
- Seven-plane insulation and ceiling surface partition, correct rear house-wall clipping, cradle/PIR quantities and existing quilt/membrane rules.
- Lath, main covering and hip/ridge quantities on all seven planes; full covering lengths retain the boss region.
- Seven eaves runs for fascia/soffit/guttering, six150degree corners, geometry-based H-trim seams and existing full-stock supply rules.
- Existing three-facet135degree products/costs remain covered by regression checks. Surface/ringbeam calculations derive their final edge from the current polygon instead of hard-coding the fifth edge.

PRICING STILL PENDING PRODUCT CONFIRMATION
This stage shows known material costs, NOT a complete customer price. The existing configured135degree corners/caps and five-way adaptor are not substituted for this roof.
Confirm actual six-hip/ridge junction product/detail, its unit cost and fixing allowance;150degree hip end caps;150degree fascia corners (white/foiled); and150degree external gutter corners for the profiles supplied. Required missing rates remain Unconfigured and prevent a complete quotation. No material rates or new weight allocations are invented.

Internal future configuration keys are product-specific *_7way_adaptor_price_each, *_7way_adaptor_confirmed, *_7way_fixings_each, *_hip_end_cap_150_price_each, fascia_corner_150_300_white_price / foiled_price, and gutter_<profile>_corner_150_ext_price. The7way name is a provisional internal key, not a claim that a particular seven-way product is suitable or available. Actual product mapping/rates must be confirmed before customer pricing is enabled. These fields are not yet added to the Materials editor.

The5-facet style remains admin review only. Customer D/O quoting/saving, manufacture book and verified jack cut diagrams are subsequent steps. Existing customer/private-quote authentication limitation is unchanged.

VALIDATION
405 calculation/material tests passed, including both references, six-hip/five-jack quantities, unique material allocations, separate150degree rates, no five-way substitution, all seven ringbeams/upstands, rear surface datum and larger/tighter-soffit layouts. Actual admin page/reference controls and all seven material audit components passed component-handler checks. No full app build, browser layout test or live database write was available in this source-only workspace.

Please compile/deploy, open both reference roofs and review quantities/known costs. Existing weights remain provisional pending the final weight audit.
