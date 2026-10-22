Apply over v167. Copy included src files over project src, including new lib/Calculations/checklistLaths.js. No dependencies/database changes.

Checklists for Hipped Lean-To (central/offset), Gable, Edwardian and both Victorian families now list External tiling laths and Internal fixing laths separately as stock lengths. Configured stock length appears in the label. Regular Lean-To already has separate rows and is unchanged. Same checklist adapters feed standalone lists and manufacture books.

External includes loose field/eaves and hip/ridge support laths. Fitted ringbeam/upstand laths remain within assembled components. Explicit added lath extras remain visible. Gable/Edwardian positive pooled adjustments are shown as Extra25x50 lengths, avoiding arbitrary allocation to internal/external. Negative adjustments reduce external then internal allowance. Victorian per-use changes remain in their use group.

Each internal/external group is planned and rounded independently. Their total can exceed the pooled Summary order when offcuts could be shared between uses. These are standalone use-group allowances for checking and packing. No combined total or extra charge is added to Summary. Summary quantities in metres, order quantities in lengths, prices, weights and roof geometry are unchanged.

Validation:411 calculation/checklist regression checks passed, with old pooled checklist expectations updated for the new separate rows and extras. Hipped internal/external rows, actual Victorian group stock requirements and existing assembly/extra filtering covered. Actual book/front-detail checks passed. Full local compile and print pagination remain for your environment; an additional checklist row can affect page fit.

Please compile and compare the internal/external rows with the two actual roofs, then check final checklist page fit.
