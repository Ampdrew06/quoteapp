import React from 'react';
import {buildDoubleEdwardianValleyOrder,epdmDefaultAllowanceMM,valleySurfaces} from '../../lib/Calculations/doubleEdwardianValleyOrder';

const mm=n=>Number(n.toFixed(1)).toLocaleString('en-GB');

export default function DoubleEdwardianValleyReview({geometry:g,inputs={},onChange,controlsOnly=false}){
 if(!g?.valid)return null;
 const {valleySurface, valleyFinish}=inputs;
 const order=buildDoubleEdwardianValleyOrder(g,inputs);
 const scale=Math.min(540/g.externalWidthMM,170/g.projectionMM);
 const x=v=>360+(v-g.widthMM/2)*scale,y=v=>88+v*scale;
 const points=rows=>rows.map(p=>x(p.x)+','+y(p.y)).join(' ');
 const rear=g.facets[0],plateLeft=x(-g.extensionMM),plateRight=x(g.widthMM+g.extensionMM);
 return <details style={{border:'1px solid #d4e1e4',borderRadius:10,marginTop:16,padding:12}}>
  <summary style={{cursor:'pointer',fontWeight:650}}>Rear valley waterproofing review</summary>
  {!controlsOnly&&<>  <p>The valley runs along the house-facing width, whichever way the ridge runs. The external waterproofed valley is outside the quoted projection.</p>
  <svg viewBox="0 0 720 290" role="img" aria-label="Plan showing the rear valley beside the house and the rear roof facet" style={{display:'block',width:'100%',maxWidth:720}}>
   <text x="360" y="25" textAnchor="middle" fill="#18333f" fontSize="14">{valleySurfaces[valleySurface]||'Existing building'}</text>
   <polygon points={points(g.corners)} fill="#f1f5f9" stroke="#64748b"/>
   <polygon points={points(rear.vertices)} fill="#dbeafe" stroke="#64748b"/>
   {g.hips.map((p,i)=><polyline key={i} points={points(p)} stroke="#64748b" fill="none"/>)}
   <polyline points={points(g.ridge)} stroke="#334155" strokeWidth="2" fill="none"/>
   <line x1={plateLeft} x2={plateRight} y1="88" y2="88" stroke="#92400e" strokeWidth="5"/>
   <line x1={plateLeft} x2={plateRight} y1="54" y2="54" stroke="#0f766e" strokeWidth="3"/>
   <text x="360" y="46" textAnchor="middle" fill="#0f766e" fontSize="13">External valley location (schematic)</text>
   <text x="360" y="280" textAnchor="middle" fill="#18333f" fontSize="13">Front of conservatory</text>
  </svg>
  <ul>
   <li>R1 valley plate / external roof width: <strong>{mm(g.externalWidthMM)} mm</strong>.</li>
  </ul>
  </>}
  <label>Valley meets <select value={valleySurface||''} onChange={e=>onChange({valleySurface:e.target.value})}>
   <option value="">To confirm</option>{Object.entries(valleySurfaces).map(([key,label])=><option key={key} value={key}>{label}</option>)}
  </select></label>{' '}
  <label>Waterproofing planned <select value={valleyFinish||''} onChange={e=>onChange({valleyFinish:e.target.value})}>
   <option value="">To confirm</option><option value="epdm">EPDM — rubber and adhesives</option><option value="grp">GRP — no rubber or adhesives supplied</option>
  </select></label>
  {!controlsOnly&&<>  {!order?<p>Select what the valley meets to include materials in the estimate.</p>:<>
   <p><strong>{order.sheets} × 18 mm OSB sheet{order.sheets===1?'':'s'}</strong> (2,400 × 1,200 mm). Estimated from nominal 280 mm strips: {mm(order.runsMM[0])} mm Timberlite side{order.runsMM.length>1?` and ${mm(order.runsMM[1])} mm bungalow side (including 500 mm total extra)`:' only'}.</p>
   {valleyFinish==='epdm'&&<>
    <details><summary>EPDM stock allowances</summary>
     <p>Extra length for stock selection. The joined allowance is the total extra across all pieces.</p>
     {[['valleySingleAllowanceMM','Single strip',epdmDefaultAllowanceMM.single],['valleyJoinedAllowanceMM','Joined strips',epdmDefaultAllowanceMM.joined]].map(([key,label,defaultValue])=><label key={key} style={{display:'inline-block',marginRight:12}}>{label} (mm) <input type="number" min="0" max="5000" step="1" style={{width:80}} value={inputs[key]??''} placeholder={String(defaultValue)} onChange={e=>onChange({[key]:e.target.value})}/></label>)}
    </details>
    {order.error?<p role="alert">{order.error}</p>:<p><strong>{order.epdm.map(({length,qty})=>`${qty} × 1 m × ${length/1000} m`).join(' + ')}</strong> · {mm(order.totalMM)} mm total stock · {mm(order.excessMM)} mm over the valley width. Includes one 2.5 L tub of deck adhesive and one can of bonding adhesive.</p>}
   </>}
   {valleyFinish==='grp'&&<p>OSB is included. GRP materials are priced separately.</p>}
   {!valleyFinish&&<p>OSB is included. Choose the waterproofing to complete this part of the estimate.</p>}
  </>}
  <p>Material allowance only. Confirm the board cuts, liner joints, end returns, falls and outlets for the job.</p>
  </>}
 </details>;
}
