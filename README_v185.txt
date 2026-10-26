Timberlite v185 - apply over v183 or v184.
Overwrite included src file.

Edwardian admin front-rafter editor: remove introductory prose/spacing acknowledgement checkbox. Apply changes records the admin spacing choice automatically; structural overlap, boundary and cut-profile checks remain.

Each row has centre and gap input. First gap is measured from left internal corner; later gaps are from the preceding row centre. Changing a gap moves that rafter only; other centres stay fixed and their displayed gaps recalculate. Add after inserts a blank row between existing rafters; Add rafter appends at end. Enter either centre or gap, then Apply changes. Final positions are sorted on applying.

Tests passed: actual editor wide-gap Apply without checkbox, centre/gap arithmetic, blank editing, insertion between existing rows, following centres retained, add/remove/reset, member/classification/fittings/slots/manufacture/save-reopen regressions and JSX parsing. Full local React build/browser checks remain required.
