import React from 'react';
import {buildVictorianPlasticsGutteringAudit} from '../lib/Calculations/victorianPlasticsGutteringAudit';
const money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`;
export default function VictorianPlasticsGutteringAudit({geometry,materials,plasticsColour='white',gutterProfile='ogee'}){
 const a=buildVictorianPlasticsGutteringAudit({geometry,materials,plasticsColour,gutterProfile});
 if(!a.valid)return <section><h2>Fascia, soffit &amp; guttering audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 const table=(title,rows)=><div><h3>{title}</h3><div style={{overflowX:'auto'}}><table><thead><tr><th>Item</th><th>Quantity</th><th>Material cost</th></tr></thead><tbody>{rows.map(r=><tr key={r.key}><td>{r.label}</td><td>{r.qty} {r.unit}</td><td>{money(r.cost)}</td></tr>)}</tbody></table></div></div>;
 return <section><h2>Fascia, soffit &amp; guttering audit · review</h2><p>{plasticsColour} plastics · {gutterProfile} guttering · {a.totalRunM.toFixed(3)}m across five eaves · four 135° corners</p>
 <p>Reveal Liner: {a.fasciaCut.externalCutHeightMM}mm external preparation height; {a.fasciaWidthMM}mm stock coverage. Soffit strip width: {a.soffit.stripWidthMM}mm.</p>
 {table('Fascia, soffit & accessories',a.plasticLines)}
 {a.soffit.ripInstructions.map((r,i)=><p key={i}>Rip allowance: {r.strips} × {r.lengthMM/1000}m @ {r.stripWidthMM}mm from one {r.boardWidthMM}mm board.</p>)}
 {table('Guttering & downpipe — full stock supply',a.gutterLines)}
 <p><b>{a.costComplete?'New plastics/guttering subtotal':'Known plastics/guttering cost · incomplete'}: {money(a.knownCost)}</b></p>
 {a.notes.map((n,i)=><p key={i}>{n}</p>)}
 </section>;
}
