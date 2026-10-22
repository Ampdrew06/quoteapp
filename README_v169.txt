Apply over v168. Copy included src files into project src. No dependencies/database changes.

Regular Lean-To manufacture-book checklist now splits Internal fixing laths and External tiling laths into stock lengths. It previously used the shared integrated model but lacked hipped manufacture geometry, so the v168 hipped-only branch did not run. The ordinary standalone Lean-To checklist remains as before.

The Summary model now exposes the existing per-use lath metre quantities as additional metadata. No quantities, order totals, cost or weight are recalculated. The book adapter removes the old pooled lath row and omits fitted ringbeam/upstand laths from loose supplies. Stock length comes from Materials. Added lath extras remain visible.

The existing one-column shared manufacture-checklist presentation is retained. Other roof styles retain their v168 internal/external split. Edwardian slate-vs-steel calculations are unchanged.

Validation:412 regression checks passed, including actual ordinary Lean-To model/checklist split, whole stock rounding per use, removal of pooled row, and unchanged model sections/pricing/weight after checklist generation. Full local build and print pagination need checking locally. Please inspect the regular Lean-To manufacture book final page; two separate rows should replace the previous pooled timber row.
