import React from 'react';
import {buildVictorianInsulationAudit} from '../lib/Calculations/victorianInsulationAudit';
const number=n=>Number(n).toFixed(3),money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`,weight=n=>n==null?'Unconfigured':`${n.toFixed(2)}kg`;
export default function VictorianInsulationAudit({geometry,materials}){
 const a=buildVictorianInsulationAudit({geometry,materials});
 if(!a.valid)return <section><h2>Insulation audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 const order=l=>l.sheets!=null?`${l.sheets} sheets × ${number(l.sheetAreaM2)}m²`:l.key==='superQuilt'?`${l.rolls12} × 12m² + ${l.rolls15} × 15m²`:`${l.rolls} roll${l.coverageReview?' · COVERAGE REVIEW':''}`;
 return <section><h2>Insulation audit · review</h2><div style={{overflowX:'auto'}}><table><thead><tr><th>Material</th><th>Net installed area</th><th>Supply</th><th>Order allowance</th><th>Material cost</th><th>Installed weight</th></tr></thead><tbody>{a.lines.map(l=><tr key={l.key}><td>{l.label}</td><td>{number(l.netAreaM2??l.installedAreaM2)}m²</td><td>{l.supply}</td><td>{order(l)}</td><td>{money(l.cost)}</td><td>{weight(l.installedWeightKg)}</td></tr>)}</tbody></table></div>
 <p><b>{a.costComplete?'Insulation/membrane subtotal':'Known insulation/membrane cost · incomplete'}: {money(a.knownCost)}</b> · {a.weightComplete?'Installed insulation/membrane weight':'Known installed weight · incomplete rates'}: {weight(a.knownInstalledWeightKg)}</p>
 <p>50mm PIR: {number(a.cradle.totalLengthM)}m of 140mm cradle strips ({number(a.cradle.netAreaM2)}m²) + {number(a.cradle.ringPir50AreaM2)}m² ring-beam insulation. Pooled order allowance {number(a.pir50.orderAreaM2)}m².</p>
 <p>100mm PIR: {number(a.slab.surface.areaM2)}m² gross roof surface − {number(a.slab.timberFootprintAreaM2)}m² timber footprint = {number(a.pir100.netAreaM2)}m² net. Order allowance {number(a.pir100.orderAreaM2)}m².</p>
 <p>Finished ceiling: {number(a.ceiling.areaM2)}m², including {number(a.ceiling.flat.areaM2)}m² horizontal flat. SuperQuilt nominal coverage with overlap/waste: {number(a.superQuilt.nominalM2)}m².</p>
 <p><b>Plasterboard · NOT SUPPLIED:</b> {a.plasterboard.sheets} sheets at 2.88m² · installed area {number(a.plasterboard.installedAreaM2)}m² · {weight(a.plasterboard.installedWeightKg)} separately, excluded from the subtotal above.</p>
 {a.membrane.coverageReview&&<p role="alert">Membrane area exceeds one roll; confirm supply before pricing.</p>}{a.notes.map((note,i)=><p key={i}>{note}</p>)}
 </section>;
}
