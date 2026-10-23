// Prefer the saved design: older hipped quotes use "lean-to" in roof_style.
export function quoteStyleLabel(record) {
 const style=record?.inputs_json?.roofStyle||record?.roof_style||'';
 const labels={leanTo:'Lean-To','lean-to':'Lean-To',hippedLeanTo:'Hipped Lean-To','hipped-lean-to':'Hipped Lean-To',gable:'Gable',edwardian:'Edwardian',victorian:'3 Facet Victorian','victorian-five':'5 Facet Victorian','victorian-hipped':'Victorian Hipped Lean-To',combination:'Edwardian/Victorian','double-edwardian':'Double Hipped Edwardian','edwardian-p':'Edwardian P-Shape','victorian-p':'Victorian P-Shape'};
 return labels[style]||style||'—';
}
