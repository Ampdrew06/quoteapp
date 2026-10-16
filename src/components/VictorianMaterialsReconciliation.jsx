import React from 'react';
import {buildVictorianMaterialsReconciliation} from '../lib/Calculations/victorianMaterialsReconciliation';
const money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`;
const names={timber:'Timber, plywood & laths',tiles:'Tiles & covering accessories',plastics:'Fascia, soffit & trims',metal:'Metalwork & tile starter',gutters:'Guttering & downpipe',misc:'Insulation, fixings & miscellaneous'};
export default function VictorianMaterialsReconciliation(props){
 const a=buildVictorianMaterialsReconciliation(props);
 if(!a.valid)return <section><h2>Victorian materials reconciliation</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 return <section><h2>Victorian materials reconciliation · review</h2><p>One allocation per item across all six material sections.</p>
 <table><thead><tr><th>Section</th><th>Material cost</th><th>Review</th></tr></thead><tbody>{Object.entries(a.sections).map(([key,s])=><tr key={key}><td>{names[key]}</td><td>{money(s.knownCost)}</td><td>{s.missingPrices.length?`${s.missingPrices.length} missing prices`:'Prices present'}</td></tr>)}</tbody></table>
 <p><b>{a.costComplete?'Reconciled materials total':'Known materials cost · incomplete'}: {money(a.knownCost)}</b></p>
 <p>Materials only. Labour, delivery, markup and VAT are not included. Weight allocations remain reserved for the final review.</p>
 {a.missingPrices.map(r=><p role="alert" key={r.key}>Price pending: {r.label}</p>)}{a.supplyReviews.map((r,i)=><p role="alert" key={i}>{r}</p>)}
 <details><summary>Review all allocated materials</summary>{Object.entries(a.sections).map(([key,s])=><div key={key}><h3>{names[key]}</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Item</th><th>Quantity</th><th>Cost</th><th>Supply / use</th></tr></thead><tbody>{s.lines.map(r=><tr key={r.key}><td>{r.label}{r.basis&&<small style={{display:'block'}}>{r.basis}</small>}</td><td>{r.qty==null?'Pending':`${Number(r.qty.toFixed(3))} ${r.unit}`}</td><td>{money(r.cost)}</td><td>{r.usage==='factory'?'Factory consumption':r.supplyToSite?'Loose site supply':'Fitted / manufactured'}</td></tr>)}</tbody></table></div></div>)}</details>
 <p>Plasterboard — NOT SUPPLIED: {a.plasterboard.sheets} sheets as a customer buying guide; excluded from material costs.</p>
 {a.notes.map((n,i)=><p key={i}>{n}</p>)}
 </section>;
}
