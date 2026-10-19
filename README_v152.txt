Timberlite trade hip validation — v152
Apply over v151. Merge the included src folder, replace files, compile and deploy.

Trade Hipped Lean-To geometry checks:
- Enabled hip widths must be positive finite numbers.
- Combined enabled hip widths cannot exceed internal roof width.
- Offset bosses cannot coincide: user is prompted to select central boss or reduce hip widths.
- Distinct offset boss rafters must have at least 45mm centre separation to avoid their existing 45mm member widths overlapping. This is a footprint check, not a structural span certification.
- Central-boss arrangement retains its existing resolved geometry checks.
- Invalid trade layouts cannot Quote or Save/Update. Any displayed previous CAD/price is suppressed until the current inputs pass. Correction opens Edit and provides an explanation.
- Admin bypasses all NEW checks to retain diagnostic control; pre-existing admin validation remains unchanged.

No maximum roof dimensions, aspect-ratio restrictions, manufacturing span limits or unusual-proportion confirmation thresholds have been introduced. Other styles' geometry behaviour is unchanged.

Validation: 394 calculation checks passed; 11 actual Lean-To/Hipped Save callback checks passed; shared Gable/Edwardian and Victorian save/update checks passed, plus existing component regression harness. No full application build or live database/browser test was available here.

Suggested live test: trade 1000 x 6000 with two 3000 hips must show no CAD/price and explain overlapping hips; the same admin inputs must retain existing behaviour. Try a valid design, edit to invalid widths, and confirm the old price disappears. Correct the widths and re-quote/save. Try central boss and one-sided hips too.
