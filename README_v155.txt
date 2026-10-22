Timberlite Victorian 850mm rule + 5-Facet Plan Preview — v155

INSTALL
Apply over v154. This package also includes all v154 Home/My Quotes changes, so it can be applied directly over v152 if that Home update has not yet been installed. Merge src folders, replace/add files, compile and deploy as usual.

VICTORIAN SUPPORT RULE
Provisional maximum unsupported spacing is now850mm for Victorian geometry. All other styles retain their existing rules, and normal truss spacing remains665mm.
- 3-facet fronts: <=850mm no intermediate; >850 to1700mm one boss intermediate; wider facets use jacks. Side closing-span threshold is also850mm, still measured from ridge rather than boss-truss centre.
- Existing 3-facet D/O, Summary and materials pricing use this layout automatically. Some widths that previously had jacks now have intermediate bars instead, with corresponding recalculated material/hardware costs.

5-FACET FIRST STAGE
Admin Home: click the 5 Facet Victorian card, now marked Admin preview. Direct route: /quote/victorian-five/technical. Trade/public cannot use this review page; the Home card remains Coming soon for them.
- Isolated draft storage, separate from 3-facet designs and saved quotes.
- Seven roof planes, six hips, six150degree corner joints and15degree mitres. Same Edwardian ridge datum and existing soffit/ply-base allowance rules.
- Six hips only at the boss. No extra intermediate boss rafters.
- Front widths up to850mm have no jacks. Wider front facets receive off-centre hip-connected jacks. Prefer one jack665mm from the facet's start when both bays satisfy850mm; otherwise use an odd number of equal bays so no support is on the facet/boss centreline. Extra supports may be introduced to meet that condition. This is provisional automatic set-out, not a manual override tool.
- Both reference buttons included:3150x3300 has844.0mm front facets,2147.0mm sides,ridge1725mm and no jacks;3800x4200 has1018.2mm front facets,2809.1mm sides,ridge2300mm and five front jacks.
- CAD plus ringbeam internal/external plan lengths and support-position/bay tables.
- Jack quantity/hip connection concept matches the supplied report. Individual665/353 bay orientation is automatic and is not intended to reproduce every manually oriented jack in that report.
- This is geometry review only. 5-facet pricing, saved quotes, manufactured cut profiles and manufacture book are still to be integrated after plan review. No5-facet customer quotation is enabled.

CHECKS
400 calculation/material tests passed, including both5-facet references,850mm thresholds, external150degree mitre offsets, hip-only jack intersections and larger facet support layouts. Component-handler checks passed for admin/trade route guards and both reference buttons, plus Home/My Quotes regressions. The unchanged3-facet reference dimensions and material checks pass.
No full app compilation, browser layout test or live database write was possible in this source-only workspace. CAD source SVG was generated during checks but raster/browser rendering dependencies were unavailable.

HOME/MY QUOTES
All approved v154 Home layout/My Quotes changes are retained. Existing customer-code/localStorage login remains a testing mechanism; authenticated database ownership policies are still needed before releasing private quote access externally.

PLEASE CHECK
Compile/deploy, log in as admin, open the5-facet Home card and compare both reference plans and ringbeam dimensions with your PDFs. Try width changes around front-facet850mm and confirm jack placement. Confirm trade still sees Coming soon. Continue testing3-facet designs with the revised850mm rule.
