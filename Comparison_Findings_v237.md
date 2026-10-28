# Equivalent Hipped Lean-To routes — initial audit

This is a reference comparison using the workspace default materials, not the customer’s saved quotes or their current Materials configuration. Some default rates (including guttering) are unconfigured, so the figures below are known configured material costs only, not complete quotation prices.

## Controlled example

Internal width 7304mm; projection 3371mm; front pitch 17°; side pitches 25°; front soffit 150mm; 70mm frames; Britmet; white plastics; square black gutters. VH has both sides set to Edwardian/90°. The regular route has both hips enabled and the same calculated boss inset, 2185.7813mm. No quantity overrides/exclusions were applied.

| Known chargeable section | Regular Hipped | VH with two 90° sides | Difference |
|---|---:|---:|---:|
| Timber, including configured waste | £613.62 | £615.09 | +£1.47 |
| Tiles | £623.22 | £623.22 | £0.00 |
| Plastics | £108.64 | £108.64 | £0.00 |
| Metal | £101.20 | £101.83 | +£0.63 |
| Guttering, unconfigured in this fixture | £0.00 | £0.00 | — |
| Miscellaneous/insulation | £608.31 | £633.36 | +£25.05 |
| Known materials total | £2054.99 | £2082.14 | +£27.15 |

Totals include internal rounding; the regular timber chargeable total is £613.624 before rounding. Use chargeable timber cost when comparing: its displayed base timber cost is £557.84 before the 10% configured timber waste. VH includes that allowance in its individual timber rows.

## Findings

1. 100mm PIR is the main cost discrepancy: regular £251.36 versus VH £278.40 (+£27.04). VH explicitly charges 10 sheets at £27.84. The regular route uses area-based pricing and a separate pack/coverage rate lookup. Its returned row also contains conflicting order metadata (10 in orderQty/qty_order but 9 in order_qty). These paths need reconciliation, not a discount adjustment.
2. Tile starter: regular charges consumed length (£59.37); VH orders five whole 3m lengths (£60.00). Difference £0.63. A common supply/cost policy is required.
3. Cradle/PIR50 is £2.02 lower on VH and staples £0.03 higher; net miscellaneous difference is £25.05 after the PIR100 difference.
4. Timber differs by about £1.47 after waste. Both paths use their own member/cut/lath schedules and need a row-by-row quantity/allowance reconciliation.
5. Outside width is not identical yet: regular 7650.4893mm, VH 7654.4893mm. Both external projections are 3596mm. The 4mm width difference is consistent with a 2mm-per-side ply/foot-clearance convention difference. Establish which perimeter represents the intended construction before changing it globally. This audit does not declare either path more accurate.
6. Labour defaults are also different (1.5 versus 1.8 baseline days at 8.36m²), but the materials discrepancy exists before labour, markup, discount or delivery. Matching a labour setting cannot remove it.

## Recommended sequence

- Reconcile the same physical roof through the two existing routes: geometry datum/clearance, PIR rates and whole-sheet ordering, tile-starter ordering, then remaining timber/cradle quantities.
- Make equivalent configurations reuse the same construction and supply helpers. Avoid copying an entire calculation set, which would leave two implementations that can diverge again.
- Build Half Victorian/Half Edwardian with a side configurator over those shared rules. Its footprint, ridge/hip connections and facet editor still require a roof-specific adapter.
- Support a no-hip Hipped configurator setting as a true Lean-To only when plan, Summary, pricing and manufacture all resolve to the same dedicated Lean-To model.

No pricing, material-quantity or geometry formulas were altered in v237. The update fixes the null-result crash and restores an explicit no-hip instruction instead of allowing a misleading comparison or quote. Half/Half implementation has not started in this update.
