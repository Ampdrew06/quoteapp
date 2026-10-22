Timberlite v171 — Style labour baselines and Britmet contribution benchmark

Apply over v170. Copy src over project src, including new lib/Calculations/roofLabourPricing.js. No dependencies/database changes. Quotation prices will change when calculated or reopened. Existing stored quote pricing snapshots are not rewritten by applying this patch; updating a quote saves the new calculation.

Two-person team-day rate defaults to300GBP and still uses the saved Day Rate setting. Internal width x projection is the area basis. Days = baseline +0.03 x max(0, area-reference area). No rounding to tenths or3-day cap. Quote-specific positive day overrides remain available. Existing global minimum/roof-type/slate multiplier settings no longer drive active quotation labour. Feature allowances for glazing/vents/box gutters are not introduced here.

Agreed baselines (days / reference internal m2):
Lean-To:1 /9 (3x3)
Hipped Lean-To central and offset:1.5 /8.36 (3.8x2.2)
Gable:1.8 /12 (3x4)
Edwardian:2 /9 (3x3, superseding the earlier7.84m2 discussion)
3-facet Victorian:2 /9
5-facet Victorian:2 /9
Edwardian/Victorian combination:2.1 /9
Double Hipped Edwardian:2.2 /9
Edwardian P-Shape:2.5 /12.25
Victorian P-Shape:2.5 /12.25
Future styles are configuration entries only; their designs are not enabled. Victorian Hipped Lean-To remains an isolated geometry preview with no pricing baseline added.

Slate contribution rule: create the equivalent Britmet material model using the same design, adjustments/exclusions and extras; use the same labour/delivery and customer markup/discount settings. Slate net = Britmet customer net + (slate material cost - Britmet material cost). This preserves the pound contribution after discount. VAT is applied to the resulting slate net. Customer discount percentage is unchanged; an equivalent retail figure is calculated so retail less that discount reconciles with the final price. Only selected slate materials/despatch quantities are saved/displayed as the actual roof. LiteSlate and Tapco identifiers use the benchmark where their roof model supports them. Steel quotations retain normal markup/discount arithmetic. No automatic slate labour reduction remains.

Britmet benchmark rates must be complete for Gable/Edwardian/Victorian slate quotation readiness. Existing Lean-To material model/default-rate behavior is retained. Before real use, ensure Britmet rates and actual slate rates are current. Manual product-dependent quantity adjustments carry to the corresponding benchmark keys; verify unusual exclusions/extras in comparisons.

Summary now says Contribution after customer discount, shows two decimal team-days and the style baseline/reference. Slate shows its Britmet contribution basis instead of implying normal markup on its own cost. Internal saved field names retain compatibility. The old computeLabourPricing export remains for legacy compatibility; active roof routes use the new shared helper.

Validation: ten baselines tested below/at/above reference, retail/trade contribution equality/discount arithmetic/VAT, quotation adapters, actual Lean-To and Hipped Summary rendering for Britmet/LiteSlate,13 Lean/Hipped save callbacks and Gable/Edwardian/Victorian save/update handlers.412 existing calculation/checklist checks passed. JSX syntax parsed. Full local build, live Supabase saves and browser review remain for your environment.

Please compile and compare Britmet/slate on identical designs as retail and trade: same labour days, equal contribution, net difference equals actual material cost difference. Check D/O/Summary gross equality and save/reopen; then test each style baseline and larger sizes. Positive existing day overrides take precedence, so clear those when testing the new automatic baselines.
