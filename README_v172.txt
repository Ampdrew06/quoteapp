Timberlite v172 — Compact Summary footer and editable roof labour factors

Apply over v171. Copy src into project src. No dependencies/database changes.

The shared Summary footer now shows three compact total cards: materials/labour/delivery; net/VAT/gross; margin/contribution. Controls and Delivery are side by side on desktop and stack on mobile. Delivery breakdown sits within Delivery. Supporting weights, discount/markup explanations and calculation notes are collapsed under Supporting details. Direct pricing/status alerts remain visible. Margin is actual contribution after discount divided by net price, excludingVAT.

Admin Controls -> Complexity factors by roof style -> select the style. Starts with the current quote style. Edit baseline team-days, reference internal area(m2), and additional days/m2. Changes save when leaving the field or pressingEnter. Invalid values revert. Future styles are listed as agreed baselines only, not enabled roof routes. Rate defaults remain0.03 until edited for that style. Day Rate, quote-only Override Days and Markup controls remain. Quote-only override takes precedence over the automatic style rule.

Style settings are stored within the existing labour_pricing_v1 browser settings and read by all active roof pricing adapters. They persist after refresh on the same browser/profile, like the existing labour/delivery controls; this does NOT introduce cross-device/Supabase settings sync. Editing another style does not change the currently designed roof's style. Opening that style later uses its revised rule. Existing material sections, geometry and slate contribution-matching rule are retained.

Validation: actual control handlers, current-style selection, persistence through labour settings helpers, preservation of other styles, selected-style increment changes, invalid input rejection, quote override priority, footer contribution/margin, notes/alerts and admin gating.412 calculation checks passed; actual Lean/Hipped Summary renders for steel/slate passed; changed modules parsed via component tests. Full local build and browser visual review remain for your environment.

Please compile and review the footer across the completed roofs and on mobile. To test factors, edit a baseline then leave the field: the matching roof's labour/price should recalculate unless an override exists. Navigate to D/O and confirm its price matches Summary. Saved historical quote snapshots are not rewritten until a quote is updated.
