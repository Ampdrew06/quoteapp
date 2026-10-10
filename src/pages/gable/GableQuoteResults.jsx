import React from 'react';
import {buildGableQuotation} from '../../lib/Calculations/gableQuotation';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../../lib/pricing';
const card={background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginTop:16};
const rounded=v=>Math.round(Number(v)),money=v=>'£'+Number(v).toFixed(2);
export function GableCustomerPlan({geometry:g}){
 const scale=Math.min(560/g.externalWidthMM,430/g.externalProjectionMM),x=v=>125+(v+g.feet[0].hfcMM)*scale,y=v=>105+v*scale,left=x(-g.feet[0].hfcMM),right=x(g.widthMM+g.feet[1].hfcMM),bottom=y(g.externalProjectionMM),mid=x(g.widthMM/2);
 const dim=(x1,y1,x2,y2)=><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" markerStart="url(#gable-preview-arrow)" markerEnd="url(#gable-preview-arrow)"/>;
 return <svg viewBox="0 0 820 670" role="img" aria-label="Gable plan preview" style={{width:'100%',display:'block',border:'1px solid #f1f5f9',borderRadius:8}}>
 <defs><marker id="gable-preview-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="#334155" strokeWidth="2"/></marker></defs>
 <rect x={left} y={y(0)} width={g.externalWidthMM*scale} height={g.externalProjectionMM*scale} fill="#f8fafc" stroke="#64748b"/>
 <rect x={x(0)} y={y(0)} width={g.widthMM*scale} height={g.projectionMM*scale} fill="none" stroke="#111827"/>
 {g.layout.centresMM.map((centre,n)=><g key={n}><line x1={left} x2={right} y1={y(centre)} y2={y(centre)} stroke="#2563eb" strokeWidth="3"/>{n>0&&<text x={right+9} y={y(centre)+4} fontSize="12">{rounded(centre)}</text>}</g>)}
 <line x1={mid} x2={mid} y1={y(0)} y2={bottom} stroke="#111827" strokeWidth="3"/>
 <text x={mid} y="50" textAnchor="middle" fontSize="15">HOUSE WALL</text>
 <text x={x(g.widthMM/4)} y={y(g.projectionMM/2)-14} textAnchor="middle" fontWeight="bold" fontSize="17">{Number(g.pitchDeg).toFixed(1)}°</text><text x={x(g.widthMM*3/4)} y={y(g.projectionMM/2)-14} textAnchor="middle" fontWeight="bold" fontSize="17">{Number(g.pitchDeg).toFixed(1)}°</text>
 {dim(x(0),y(0)-20,x(g.widthMM),y(0)-20)}<text x={mid} y={y(0)-27} textAnchor="middle" fontSize="13">{rounded(g.widthMM)} int</text>
 {dim(left,bottom+25,right,bottom+25)}<text x={mid} y={bottom+19} textAnchor="middle" fontSize="13">{rounded(g.externalWidthMM)} ext</text>
 {dim(left-35,y(0),left-35,bottom)}<text transform={`translate(${left-42},${(y(0)+bottom)/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{rounded(g.externalProjectionMM)} ext</text>
 {dim(right+65,y(0),right+65,y(g.projectionMM))}<text transform={`translate(${right+80},${(y(0)+y(g.projectionMM))/2}) rotate(-90)`} textAnchor="middle" fontSize="13">{rounded(g.projectionMM)} int</text>
 <circle cx={left+5} cy={bottom+7} r="5" fill="#111827"/><circle cx={right-5} cy={bottom+7} r="5" fill="#111827"/>
 </svg>;
}
export default function GableQuoteResults({inputs,geometry:g,materials,customers=[]}){
 const customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null;
 const q=buildGableQuotation({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()});
 const tile=inputs.tileProductId==='liteSlate'?'LiteSlate':inputs.tileProductId==='metrotileShingle'?'Metrotile':'Britmet';
 return <><section style={card}><h2 style={{fontSize:18,fontWeight:600,margin:'0 0 8px'}}>Plan preview</h2><GableCustomerPlan geometry={g}/><div style={{color:'#555',lineHeight:1.45,marginTop:8}}>
 <div><b>Internal width:</b> {rounded(g.widthMM)} mm · <b>External width:</b> {rounded(g.externalWidthMM)} mm</div>
 <div><b>Internal projection:</b> {rounded(g.projectionMM)} mm · <b>External projection:</b> {rounded(g.externalProjectionMM)} mm</div>
 <div><b>External Finished Height:</b> {rounded(g.finishedHeightMM)} mm</div><div><b>Roof Pitch:</b> {Number(g.pitchDeg).toFixed(1)}°</div>
 <div><b>Tile:</b> {tile} — <b>{inputs.tileColour}</b></div><div><b>Fascia/Soffit:</b> <b>{inputs.fasciaColour||'White'}</b> · <b>Gutter:</b> {inputs.gutterProfile} / {(inputs.gutterColour||'White').toLowerCase()}, one outlet per side</div></div></section>
 <section style={card}><h2 style={{fontSize:18,fontWeight:600,margin:'0 0 8px'}}>Your price</h2>{q.ready?<><div>Subtotal: <b>{money(q.pricing.net)}</b></div><div>VAT ({Number(q.pricing.vatRate*100)}%): {money(q.pricing.vat)}</div><div>Total (gross): <b>{money(q.pricing.gross)}</b></div><p style={{fontSize:12,color:'#6b7280',margin:'8px 0 0'}}>Quotations are valid for 31 days.</p></>:<p role="status">{!q.distanceReady?'Calculating delivery distance or awaiting a valid route. ':''}{!q.customerReady?'Customer details are loading or unavailable. ':''}{q.model.missingPrices?.length?'Configure missing Materials prices in Summary. ':''}{q.model.supplyReviews?.join(' ')||''}</p>}</section></>;
}
