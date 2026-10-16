import React from 'react';
import {buildVictorianTilingAudit} from '../lib/Calculations/victorianTilingAudit';
const money=n=>n==null?'Unconfigured':`£${n.toFixed(2)}`,kg=n=>n==null?'Unconfigured':`${n.toFixed(2)}kg`;
export default function VictorianTilingAudit({geometry,materials,productId}){
 const a=buildVictorianTilingAudit({geometry,materials,productId});
 if(!a.valid)return <section><h2>Tiles &amp; covering accessories audit</h2><p role="alert">{a.errors.join(' ')}</p></section>;
 return <section><h2>Tiles &amp; covering accessories · {a.productLabel} · review</h2><div style={{overflowX:'auto'}}><table><thead><tr><th>Item</th><th>Order quantity</th><th>Material cost</th><th>Installed weight</th></tr></thead><tbody>{a.lines.map(l=><tr key={l.key}><td>{l.label}<small style={{display:'block'}}>{l.basis}</small></td><td>{l.quantity==null?'Pending product confirmation':`${l.quantity} ${l.unit}`}</td><td>{money(l.cost)}</td><td>{kg(l.installedWeightKg)}</td></tr>)}</tbody></table></div>
 <p><b>{a.costComplete?'Tiles/accessories subtotal':'Known tile/accessory cost · incomplete'}: {money(a.knownCost)}</b> · {a.weightComplete?'Installed covering/accessories':'Known installed weight · incomplete rates'}: {kg(a.knownInstalledWeightKg)}</p>
 {a.supplyReviews.map((r,i)=><p role="alert" key={i}>{r}</p>)}
 <details><summary>Facet ordering and full covering lengths</summary><table><thead><tr><th>Facet</th><th>Main tiles before roof allowance</th></tr></thead><tbody>{a.facets.map((f,i)=><tr key={f.id}><td>{f.label}</td><td>{a.steel?a.sequence.facets[i].stagger.newTiles:a.result.facets[i].tileQuantityRaw.toFixed(2)}</td></tr>)}</tbody></table><p>Roof allowance {a.extraTiles} tiles · total order {a.mainTiles}. Gross tiled surface {a.roofAreaM2.toFixed(3)}m².</p><table><thead><tr><th>Covering run</th><th>Full length</th><th>Hip/ridge tiles</th></tr></thead><tbody>{a.edges.map(e=><tr key={e.id}><td>{e.id}</td><td>{e.lengthMM.toFixed(1)}mm</td><td>{e.tileQty??'Pending'}</td></tr>)}</tbody></table></details>
 {a.notes.map((note,i)=><p key={i}>{note}</p>)}
 </section>;
}
