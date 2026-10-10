import React from 'react';
import GablePricingPanel from './GablePricingPanel';
const inputStyle={width:'100%',height:34,padding:'5px 8px',fontSize:13,border:'1px solid #d1d5db',borderRadius:8,boxSizing:'border-box'};
export default function GableDesignForm({inputs,update,materials,customers,admin,onChange,onQuote,onReset,showQuote}){
 const field=(label,key,placeholder)=><label>{label}<input type="number" min="0" step="0.1" placeholder={placeholder} value={inputs[key]} onChange={e=>update(key,e.target.value)} style={inputStyle}/></label>;
 const select=(label,key,options)=><label>{label}<select value={inputs[key]} onChange={e=>update(key,e.target.value)} style={inputStyle}>{options.map(o=><option key={Array.isArray(o)?o[0]:o} value={Array.isArray(o)?o[0]:o}>{Array.isArray(o)?o[1]:o}</option>)}</select></label>;
 return <div className="gd-card"><div className="gd-grid">
 {field('Width (internal, mm)','widthMM','e.g. 3500')}{field('Projection (internal, mm)','projMM','e.g. 2500')}
 {select('Tile system','tileProductId',[['britmetShingle','Britmet'],['metrotileShingle','Metrotile'],['liteSlate','LiteSlate']])}
 {select('Tile colour','tileColour',inputs.tileProductId==='liteSlate'?['Slate','Ash','Charcoal']:['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Smoked Oak','Rustic Red','Tartan Green'])}
 {select('Fascia / Soffit colour','fasciaColour',['White','Rosewood','Black','Anthracite','Light Oak','Cream','Foiled (unspecified)'])}
 {field(admin&&inputs.separateSideSoffits?'Soffit to Left (mm)':'Soffit to Sides (mm)','leftSoffitMM')}
 {select('Gutter profile','gutterProfile',[['square','Square'],['ogee','Ogee'],['round','Round']])}{select('Gutter colour','gutterColour',['White','Black','Anthracite','Brown'])}
 {field('Pitch (degrees)','pitchDeg')}{field('Max Finished Height (mm)','maxFinishedHeightMM','Optional')}
 <section className="gd-specific"><h2>Gable Configuration</h2><div className="gd-grid">{field('Front Overhang (mm)','frontOverhangMM')}{field('Frame thickness (mm)','frameThicknessMM')}{admin&&inputs.separateSideSoffits&&field('Soffit to Right (mm)','rightSoffitMM')}</div>{admin&&<p><label><input type="checkbox" checked={!!inputs.separateSideSoffits} onChange={e=>update('separateSideSoffits',e.target.checked)}/> Set side soffits separately</label></p>}</section>
 {['deliveryPostcode','customerReference'].map((key,n)=><label key={key}>{n?'Customer Reference':'Delivery postcode (required)'}<input type="text" value={inputs[key]} placeholder={n?'e.g. SMITH':''} onChange={e=>update(key,e.target.value)} style={inputStyle}/></label>)}
 </div>
 {admin&&<div style={{marginTop:12}}><label>Customer <select aria-label="Customer" value={inputs.selectedCustomerId} onChange={e=>update('selectedCustomerId',e.target.value)} style={{marginLeft:10,padding:6,maxWidth:'100%'}}><option value="retail">Retail (No Discount)</option>{inputs.selectedCustomerId!=='retail'&&!customers.some(c=>c.id===inputs.selectedCustomerId)&&<option value={inputs.selectedCustomerId}>Selected customer (loading)</option>}{customers.map(c=><option key={c.id} value={c.id}>{c.name} ({Number(c.discountPct||0)}%)</option>)}</select></label></div>}
 <GablePricingPanel inputs={inputs} materials={materials} customers={customers} onChange={onChange} compact actionsOnly showQuote={showQuote} onQuote={onQuote} onReset={onReset}/>
 <style>{`.gd-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}.gd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.gd-grid label{min-width:0}.gd-grid input,.gd-grid select{display:block}.gd-specific{grid-column:1/-1;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0 0}.gd-specific h2{font-size:18px;font-weight:600;margin:0 0 8px}.gd-specific p{margin-bottom:0}.gd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.gd-actions button{padding:10px 14px;border-radius:10px;border:1px solid #0ea5e9;background:#0284c7;color:#fff;font-weight:600;width:100%;cursor:pointer}.gd-actions button:disabled{opacity:.5;cursor:default}.gd-actions button:nth-child(2){background:#10b981;border-color:#10b981}.gd-actions button:nth-child(3){background:#64748b;border-color:#64748b}@media(max-width:600px){.gd-grid{grid-template-columns:1fr 1fr;gap:8px}}`}</style>
 </div>;
}
