import React from 'react';
import {buildVictorianMetalFixingsAudit} from '../lib/Calculations/victorianMetalFixingsAudit';
const money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`;
export default function VictorianMetalFixingsAudit({geometry,materials,productId}){
 const a=buildVictorianMetalFixingsAudit({geometry,materials,productId});
 if(!a.valid)return <section><h2>Metalwork &amp; fixings audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 const table=(title,rows)=><div key={title}><h3>{title}</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Item</th><th>Quantity</th><th>Material cost</th><th>Supply / use</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><td>{r.label}<small style={{display:'block'}}>{r.basis}</small></td><td>{r.qty==null?'Pending':`${r.qty} ${r.unit}`}</td><td>{money(r.cost)}</td><td>{r.usage==='factory'?'Factory consumption':r.supplyToSite?'Loose site supply':'Fitted before despatch'}</td></tr>)}</tbody></table></div></div>;
 return <section><h2>Metalwork &amp; fixings audit · review</h2><p>{a.counts.bosses} boss · {a.counts.sparPairs} spar pairs / {a.counts.sparHooks} hooks · {a.counts.jacks} jack sets · no joist hangers</p>
 {table('Metal components',a.metalRows)}{table('Loose site fixings & consumables',a.siteRows)}{table('Factory consumption — not loose despatch stock',a.factoryRows)}
 <p><b>{a.costComplete?'New metal/fixings subtotal':'Known new metal/fixings cost · incomplete'}: {money(a.knownCost)}</b></p><p>Missing weights are reserved for the final weight review.</p>
 <details><summary>Already allocated in Tiles &amp; covering accessories — excluded from this subtotal</summary>{a.existingAllocations.map(r=><p key={r.key}>{r.label}: {r.quantity} {r.unit} · {money(r.cost)} already counted.</p>)}</details>
 {a.supplyReviews.map((r,i)=><p role="alert" key={i}>{r}</p>)}{a.notes.map((note,i)=><p key={i}>{note}</p>)}
 </section>;
}
