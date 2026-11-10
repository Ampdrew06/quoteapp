import React from 'react';
import {monthlyStockRequirements} from '../lib/scheduleStockRequirements';
const quantity=new Intl.NumberFormat('en-GB',{maximumFractionDigits:3});
export default function ScheduleStockRequirements({rows,month}){
 const {totals,review,missingChecklists}=monthlyStockRequirements(rows);
 const period=month==='unscheduled'?'Unscheduled':/^\d{4}-\d{2}$/.test(month||'')?new Date(month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'Selected month';
 return <section className="schedule-stock-requirements" aria-labelledby="schedule-stock-totals-title">
  <h3 id="schedule-stock-totals-title">Materials required · {period}</h3>
  <p className="schedule-help">Total required includes all saved items. Yet to order excludes Ordered and In stock.</p>
  <div className="schedule-stock-table"><table aria-labelledby="schedule-stock-totals-title"><thead><tr><th scope="col">Item</th><th scope="col">Unit</th><th scope="col">Total required</th><th scope="col">Yet to order</th></tr></thead><tbody>{totals.map(({id,label,unit,qty,yetToOrder})=><tr key={id}><th scope="row">{label}</th><td>{unit}</td><td>{quantity.format(qty)}</td><td>{quantity.format(yetToOrder)}</td></tr>)}</tbody></table></div>
  {missingChecklists>0&&<p className="schedule-help">{missingChecklists} {missingChecklists===1?'order has':'orders have'} no saved material requirements yet.</p>}
  {review.length>0&&<details><summary>{review.length} {review.length===1?'line needs':'lines need'} a size or unit check before counting</summary><ul>{review.map((r,i)=><li key={i}>{r.customer} · Job {r.job||'—'}: {r.description} — {quantity.format(r.qty)} {r.unit}. {r.reason}</li>)}</ul></details>}
 </section>;
}
