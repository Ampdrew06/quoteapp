import React from 'react';
import {buildVictorianTimberAudit} from '../lib/Calculations/victorianTimberAudit';
const qty=n=>Number(n).toFixed(3),money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`,kg=n=>n==null?'Unconfigured':`${n.toFixed(2)}kg`;
export default function VictorianTimberAudit({geometry,materials}){
 const a=buildVictorianTimberAudit({geometry,materials});
 if(!a.valid)return <section><h2>Timber &amp; plywood audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 return <section className="vt-audit"><h2>Timber &amp; plywood audit · review</h2><p>{a.componentCounts.trusses} trusses ({a.componentCounts.trussMembers} members) · {a.componentCounts.hips} hips · {a.componentCounts.intermediates} intermediates · {a.componentCounts.jacks} jacks · {a.componentCounts.ringBeams} ring-beams · {a.componentCounts.upstands} ply upstands</p>
 <div style={{overflowX:'auto'}}><table><thead><tr><th>Material</th><th>Net quantity</th><th>Waste</th><th>Chargeable</th><th>Material cost</th><th>Installed weight</th></tr></thead><tbody>{a.lines.map(l=><tr key={l.key}><td>{l.label}<small style={{display:'block',fontWeight:400}}>{l.basis}</small></td><td>{qty(l.quantity)} {l.unit}</td><td>{l.wastePercent==null?'Unconfigured':`${l.wastePercent}%`}</td><td>{l.chargeableQuantity==null?'—':`${qty(l.chargeableQuantity)} ${l.unit}`}</td><td>{money(l.cost)}</td><td>{kg(l.installedWeightKg)}</td></tr>)}</tbody></table></div>
 <p><b>{a.costComplete?'Timber/ply material subtotal':'Known material cost · incomplete rates'}: {money(a.knownCost)}</b> · {a.weightComplete?'Installed timber/ply allowance':'Known installed weight · incomplete rates'}: {kg(a.knownInstalledWeightKg)}</p><p>I-joist {qty(a.totals.joistLengthM)}m · 9mm ply {qty(a.totals.ply9AreaM2)}m² · 18mm ply {qty(a.totals.ply18AreaM2)}m²</p>
 {a.notes.map((note,i)=><p key={i}>{note}</p>)}<p>{a.wallPackers.allocation}</p></section>;
}
