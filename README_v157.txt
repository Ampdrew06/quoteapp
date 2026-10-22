Timberlite 5-Facet Confirmed Fittings — v157
Apply over v156; merge src, replace included files, compile/deploy.

Confirmed supply on5-facet Victorian:
- One Universal Ridge/Hip Adaptor using the existing Materials field britmet_universal_ridge_adaptor_price_each. Steel coverings share this existing stock item, with a product-specific field preferred if explicitly present. Existing universal-adaptor fixing allowance is five screws.
- Six135degree hip end caps, using existing product135degree rates and existing fixed steel cap weights.
- Six135degree fascia corners, using existing white/foiled135degree rates. Labels explain adapting to150degree roof joints or mitring on site.
- Six135degree external gutter bends, using existing selected-profile135degree rates. Labels explain factory cut/welding to150degrees.
- No invented seven-way adaptor,150degree product rate or extra fabrication charge. Ringbeam/roof geometry remains150degrees, with15degree mitres. H-trim seam calculations still follow actual150degree geometry.
- Unconfigured Universal Adaptor weight remains deferred with other missing weights. Missing real rates still show Unconfigured; explicit zero prices are accepted under existing app rules.
- Existing slate-junction product reviews are unchanged.

The admin5-facet material review now costs these confirmed supplies. Customer D/O quote/save integration and manufacture book remain the next stage; this patch does not enable a5-facet trade quotation.

406 calculation/material checks pass, including existing3-facet regressions, confirmed stock quantities/rates, no use of obsolete placeholder7way/150degree rates, missing-price handling and universal fixing count. No full application build/live database write was available in this source-only workspace.
