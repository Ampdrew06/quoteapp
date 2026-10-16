import React from 'react';
import {buildVictorianLathAudit} from '../lib/Calculations/victorianLathAudit';
const num=n=>Number(n).toFixed(3),money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`,kg=n=>n==null?'Unconfigured':`${n.toFixed(2)}kg`;
export default function VictorianLathAudit({geometry,materials,productId}){
 const a=buildVictorianLathAudit({geometry,materials,productId});
 if(!a.valid)return <section><h2>Laths audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 return <section><h2>Laths audit · {a.productLabel} · review</h2><div style={{overflowX:'auto'}}><table><thead><tr><th>New lath requirement</th><th>Net length</th><th>Material cost</th><th>Installed weight</th></tr></thead><tbody>{a.lines.map(l=><tr key={l.key}><td>{l.label}</td><td>{num(l.lengthM)}m</td><td>{money(l.cost)}</td><td>{kg(l.installedWeightKg)}</td></tr>)}</tbody></table></div>
 <p><b>{a.costComplete?'New laths subtotal':'Known new lath cost · incomplete rates'}: {money(a.knownCost)}</b> · {a.weightComplete?'Installed new laths':'Known installed weight · incomplete rates'}: {kg(a.knownInstalledWeightKg)}</p>
 <p>New uses {num(a.newLathM)}m + ring-beam laths already in Timber &amp; plywood {num(a.ringLathM)}m = {num(a.allLathM)}m pooled. Stock allowance: {a.stockPlan.qty} × {num(a.stockM)}m; total-metres minimum {a.linearMinimumLengths} lengths. Stock allowance adds no further cost here.</p>
 <p>Hip foam tape for fittings audit: {num(a.support.quantities.tapeLengthM)}m · {a.support.quantities.tapeRollQty} ×5.6m rolls. Not charged in this lath subtotal.</p>
 <details><summary>Facet rows and existing ring-beam allocations</summary><table><thead><tr><th>Facet</th><th>Rows including eaves</th><th>Developed height</th><th>External lath run</th></tr></thead><tbody>{a.facets.map((f,i)=><tr key={f.id}><td>{f.label}</td><td>{a.result.facets[i].lathRows.length}</td><td>{num(f.heightMM)}mm</td><td>{num(a.result.facets[i].lathRows.reduce((n,r)=>n+r.widthMM,0)/1000)}m</td></tr>)}</tbody></table><p>{a.internal.rows.length} internal runs, including {a.internal.flatRows} longitudinal flat runs · maximum slope spacing {a.internal.maximumSpacingMM}mm.</p>{a.alreadyCounted.map(l=><p key={l.key}>{l.label}: {num(l.lengthM)}m · already counted.</p>)}</details>
 {a.warnings.map((w,i)=><p key={`warning-${i}`}>{w}</p>)}{a.notes.map((note,i)=><p key={i}>{note}</p>)}
 </section>;
}
