Timberlite v184 - apply over v183.
Overwrite the included src file.

Removing the automatic boss rafter leaves a1330mm gap. To apply without adding/repositioning supports, explicitly tick the admin review checkbox and press Apply layout. Existing spacing/overlap/cut checks retained.

UI: Remove labels shortened, invalid draft reasons visible before Apply, explicit CAD-not-updated status, clearer admin acknowledgement, Apply shown unavailable until valid, success message retained after parent update. Numeric values captured before state updater.

Actual editor callback tests reproduce the reported remove-boss case: blocked without acknowledgement; acknowledged layout applies and removes boss in geometry. Existing member/metal/ringbeam/manufacture/save-record tests pass. JSX parsing passes. Full local build/browser checks remain required.
