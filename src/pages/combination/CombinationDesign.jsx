import CustomerPicker from '../../components/CustomerPicker';
import FrameThicknessEditor from '../../components/FrameThicknessEditor';
import CombinationFacetGeometryEditor from './CombinationFacetGeometryEditor';
import GablePricingPanel from '../gable/GablePricingPanel';
import {buildCombinationQuotation,buildCombinationQuoteRecord} from '../../lib/Calculations/combinationQuotation';
import {getCustomers} from '../../lib/customers';
import {getLabourPricingConfig,getDeliveryPricingConfig,getMarkupPricingConfig} from '../../lib/pricing';
import {clearActiveDesignRecord,readActiveDesignRecord} from '../../lib/activeDesignRecord';
import {combinationDesignDefaults as defaults,normalizeCombinationInputs} from '../../lib/geometry/combinationDesignInputs';
import {LITESLATE_COLOURS} from '../../lib/tileColours';
import CombinationNavigation from './CombinationNavigation';
import CombinationRafterEditor from './CombinationRafterEditor';
import React,{useState,useEffect} from 'react';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {isAdminUser} from '../../lib/userRole';
import {getMaterials} from '../../lib/materials';
import {buildCombinationGeometry} from '../../lib/geometry/combinationGeometry';
export const COMBINATION_DRAFT_KEY='combinationGeometryDraft';

const box={background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginTop:16};
const control={display:'block',width:'100%',height:34,boxSizing:'border-box',padding:'5px 8px',fontSize:13,border:'1px solid #d1d5db',borderRadius:8,background:'white'};
const mm=n=>Number(n.toFixed(1));
export function CombinationPlan({geometry:g}){
 const w=g.widthMM,p=g.projectionMM,s=Math.min(660/g.externalWidthMM,420/g.externalProjectionMM),x=a=>130+a*s,y=a=>80+a*s;
 const coords=points=>points.map(a=>`${x(a.xMM)},${y(a.yMM)}`).join(' ');
 const left=Math.min(...g.externalOutline.map(a=>a.xMM)),right=Math.max(...g.externalOutline.map(a=>a.xMM));
 const dim=(x1,y1,x2,y2,label,vertical=false)=><g stroke="#334155" strokeWidth="1"><line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#combination-arrow)" markerEnd="url(#combination-arrow)"/><text stroke="none" fill="#0f172a" fontSize="12" textAnchor="middle" transform={vertical?`translate(${x1-8},${(y1+y2)/2}) rotate(-90)`:undefined} x={vertical?0:(x1+x2)/2} y={vertical?0:y1-7}>{label}</text></g>;
 return <svg viewBox="0 0 940 600" role="img" aria-label="Half Edwardian and Victorian roof plan with internal and external dimensions" style={{width:'100%',display:'block',maxHeight:650,border:'1px solid #f1f5f9',borderRadius:8,fontFamily:'Inter,system-ui,Arial'}}><defs><marker id="combination-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 9 1 L 1 5 L 9 9" fill="none" stroke="#334155"/></marker></defs>
 <polygon points={coords(g.externalOutline)} fill="#f8fafc" stroke="#94a3b8"/><polygon points={coords(g.internalOutline)} fill="none" stroke="#111827" strokeWidth="2"/>
 <line x1={x(g.ridge.xMM)} y1={y(0)} x2={x(g.ridge.xMM)} y2={y(g.ridge.yMM)} stroke="#64748b" strokeDasharray="5 4"/>
 {(g.trusses||[]).map(t=><g key={t.id}><line x1={x(t.start.xMM)} y1={y(t.start.yMM)} x2={x(t.end.xMM)} y2={y(t.end.yMM)} stroke="#2563eb" strokeWidth="1.5"/><text x={x(w)+12} y={y(t.positionMM)+4} fill="#111827" fontSize="12">{mm(t.positionMM)}</text></g>)}
 {(g.rafters||[]).map(r=><g key={r.id}><line x1={x(r.start.xMM)} y1={y(r.start.yMM)} x2={x(r.end.xMM)} y2={y(r.end.yMM)} stroke="#2563eb" strokeWidth="1.5"/></g>)}
 {g.hips.map((h,i)=><line key={i} x1={x(h.start.xMM)} y1={y(h.start.yMM)} x2={x(h.end.xMM)} y2={y(h.end.yMM)} stroke="#111827" strokeWidth="2"/>)}
 {g.facets.map((f,i)=>{const a=f.start,b=f.end,l=f.internalLengthMM,nx=-(b.yMM-a.yMM)/l,ny=(b.xMM-a.xMM)/l;return <text key={f.id} x={x((a.xMM+b.xMM)/2)-nx*22} y={y((a.yMM+b.yMM)/2)-ny*22} textAnchor="middle" fontSize="12" fill="#111827">F{i+1} · {mm(l)}</text>;})}
 {g.hips.map((h,i)=><text key={i} x={x(h.end.xMM)+(h.end.xMM<w/2?-30:30)} y={y(h.end.yMM)+20} fontSize="11" textAnchor="middle" fill="#475569">{mm(g.cornerAnglesDeg[i])}°</text>)}
 {dim(x(0),45,x(w),45,`${mm(w)} int`)}{dim(x(left),555,x(right),555,`${mm(g.externalWidthMM)} ext`)}
 {dim(x(right)+65,y(0),x(right)+65,y(p),`${mm(p)} int`,true)}{dim(x(left)-65,y(0),x(left)-65,y(g.externalProjectionMM),`${mm(g.externalProjectionMM)} ext`,true)}
 <text x={x(g.ridge.xMM)} y={y(g.ridge.yMM)+35} textAnchor="middle" fontSize="17" fontWeight="bold" fill="#111827">{mm(g.pitchDeg)}°</text></svg>;
}
export default function CombinationDesign(){
 const location=useLocation(),navigate=useNavigate();
 const [inputs,setInputs]=useState(()=>{if(location.state?.fresh)return {...defaults};try{return normalizeCombinationInputs(JSON.parse(localStorage.getItem(COMBINATION_DRAFT_KEY)||'{}'));}catch{return {...defaults};}});
 const [materials,setMaterials]=useState(getMaterials),[customers,setCustomers]=useState([]),[expanded,setExpanded]=useState(false);
 useEffect(()=>{let alive=true;const load=async()=>{const rows=await getCustomers();if(alive)setCustomers(Array.isArray(rows)?rows:[]);};load();window.addEventListener('quoteapp_customers_updated',load);return()=>{alive=false;window.removeEventListener('quoteapp_customers_updated',load);};},[]);
 useEffect(()=>{if(location.state?.fresh)navigate(location.pathname,{replace:true,state:{...location.state,fresh:false}});},[location.pathname,location.state,navigate]);
 useEffect(()=>{localStorage.setItem(COMBINATION_DRAFT_KEY,JSON.stringify(inputs));},[inputs]);
 useEffect(()=>{const refresh=()=>setMaterials(getMaterials());window.addEventListener('materials_updated',refresh);return()=>window.removeEventListener('materials_updated',refresh);},[]);
 if(!isAdminUser())return <main style={{padding:20}}><NavLink to="/quote">Home</NavLink><p>This design preview is available to admin while it is being completed.</p></main>;
 const g=buildCombinationGeometry({inputs,materials}),update=(key,value)=>setInputs(old=>({...old,[key]:value,...(['widthMM','projMM','leftSide','rightSide'].includes(key)?{combinationFacetGeometry:undefined}:{}),...(key==='fasciaColour'?{plasticsColour:value==='White'?'white':'foiled'}:{}),...(key==='tileProductId'?{tileColour:value==='liteSlate'?'Slate':'Titanium'}:{}),...(key==='selectedCustomerId'?{customerName:customers.find(c=>c.id===value)?.name||'Retail'}:{}),...(['widthMM','projMM','pitchDeg','soffitMM','maxFinishedHeightMM','leftSide','rightSide'].includes(key)?{combinationRafterPositionsMM:undefined,combinationRearTrussPositionsMM:undefined,combinationSpacingOverride:undefined}:{})}));
 const patch=value=>setInputs(old=>({...old,...value})),customer=customers.find(c=>c.id===inputs.selectedCustomerId)||null;
 const q=inputs.quoteDisplayed?buildCombinationQuotation({inputs,materials,customer,labourConfig:getLabourPricingConfig(),deliveryConfig:getDeliveryPricingConfig(),markupConfig:getMarkupPricingConfig()}):null;
 const reset=()=>{const record=readActiveDesignRecord('combination');if(record)setInputs(normalizeCombinationInputs(record.inputs_json));else{clearActiveDesignRecord();setInputs({...defaults});}setExpanded(false);};
 const numberField=(label,key,placeholder)=><label key={key}>{label}<input aria-label={label} type="number" min="0" step="any" style={control} value={inputs[key]} placeholder={placeholder} onChange={e=>update(key,e.target.value)}/></label>;
 const textField=(label,key,placeholder)=><label key={key}>{label}<input aria-label={label} style={control} value={inputs[key]} placeholder={placeholder} onChange={e=>update(key,e.target.value)}/></label>;
 const selectField=(label,key,options)=><label key={key}>{label}<select aria-label={label} style={control} value={inputs[key]} onChange={e=>update(key,e.target.value)}>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>;
 return <><CombinationNavigation/>
 <main className="combination-design" style={{maxWidth:1100,margin:'0 auto',padding:16,fontFamily:'Inter,system-ui,Arial'}}><h1 style={{fontSize:24,fontWeight:700,margin:'12px 0 8px'}}>Timberlite Edwardian / Victorian</h1><p style={{color:'#555',marginTop:0,marginBottom:14}}>Enter your sizes and options below. We’ll show a plan preview and your price. Frame thickness is defaulted to 70mm, please confirm this when ordering.</p>
 <section className="gd-card" aria-label="Roof dimensions">{inputs.quoteDisplayed&&g.valid&&<button id="combination-edit-toggle" type="button" style={{width:'100%',background:'#0f766e',border:'1px solid #0f766e',borderRadius:10,color:'#fff',padding:'10px 14px',fontWeight:600,cursor:'pointer',marginBottom:expanded?14:0}} aria-expanded={expanded} aria-controls="combination-input-fields" onClick={()=>setExpanded(v=>!v)}>Edit {expanded?'▴':'▾'}</button>}<div id="combination-input-fields" hidden={inputs.quoteDisplayed&&g.valid&&!expanded}>
 <div className="gd-grid">
 {numberField('Width (internal, mm)','widthMM','e.g. 4000')}{numberField('Projection (internal, mm)','projMM','e.g. 3000')}
 {selectField('Tile system','tileProductId',[['britmetShingle','Britmet'],['liteSlate','LiteSlate']])}
 {selectField('Tile colour','tileColour',(inputs.tileProductId==='liteSlate'?LITESLATE_COLOURS:['Titanium','Raven','Bramble Brown','Rustic Brown','Rustic Terracotta','Smoked Oak','Rustic Red','Tartan Green']).map(v=>[v,v]))}
 {selectField('Fascia / Soffit colour','fasciaColour',['White','Rosewood','Black','Anthracite','Light Oak','Cream','Foiled (unspecified)'].map(v=>[v,v]))}
 {numberField('Soffit to Front (mm)','soffitMM')}
 {selectField('Gutter profile','gutterProfile',[['square','Square'],['ogee','Ogee'],['round','Round']])}
 {selectField('Gutter colour','gutterColour',['Black','White','Anthracite','Brown'].map(v=>[v,v]))}
 {numberField('Pitch (degrees)','pitchDeg')}{numberField('Max Finished Height (mm)','maxFinishedHeightMM','Optional')}
 <section className="gd-specific"><h2>Side Configuration</h2><div className="combination-side-grid">{[['leftSide','Left Side'],['rightSide','Right Side']].map(([key,label])=>selectField(label,key,[['edwardian','Edwardian — square corner (90°)'],['victorian','Victorian — faceted corner (135°)']]))}</div></section>
 {textField('Delivery postcode (required)','deliveryPostcode','')}{textField('Customer Reference','customerReference','e.g. SMITH')}
 </div>
 <div style={{marginTop:12}}><label>Customer <CustomerPicker customers={customers} value={inputs.selectedCustomerId} onChange={e=>update('selectedCustomerId',e.target.value)} style={{marginLeft:10}}/></label></div>
 </div><GablePricingPanel family="combination" inputs={inputs} materials={materials} customers={customers} onChange={patch} compact actionsOnly showQuote={inputs.quoteDisplayed} quotationBuilder={buildCombinationQuotation} recordBuilder={buildCombinationQuoteRecord} onSaved={()=>patch({quoteDisplayed:true})} onQuote={()=>{patch({quoteDisplayed:true});setExpanded(false);}} onReset={reset}/>
 <style>{`.combination-design{font-size:14px}.combination-design .gd-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}.combination-design .gd-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.combination-design .gd-grid label{min-width:0}.combination-design .gd-specific{grid-column:1/-1;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:16px 0 0}.combination-design .gd-specific h2{font-size:18px;font-weight:600;margin:0 0 8px}.combination-side-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.combination-design .gd-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.combination-design .gd-actions button{padding:10px 14px;border-radius:10px;border:1px solid #0ea5e9;background:#0284c7;color:#fff;font-weight:600;width:100%;cursor:pointer}.combination-design .gd-actions button:disabled{opacity:.5;cursor:default}.combination-design .gd-actions button:nth-child(2){background:#10b981;border-color:#10b981}.combination-design .gd-actions button:nth-child(3){background:#64748b;border-color:#64748b}@media(max-width:800px){.combination-design .gd-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:450px){.combination-side-grid{grid-template-columns:1fr}}`}</style></section>
 <FrameThicknessEditor admin value={inputs.frameThicknessMM??70} onApply={value=>patch({frameThicknessMM:value})}/>
 <CombinationFacetGeometryEditor key={`${inputs.widthMM}/${inputs.projMM}/${inputs.leftSide}/${inputs.rightSide}`} inputs={inputs} geometry={g} materials={materials} onChange={patch}/>
 <CombinationRafterEditor inputs={inputs} geometry={g} materials={materials} onChange={patch=>setInputs(old=>({...old,...patch}))}/>
 {g.rafterWarnings?.map(w=><p key={w} role="status" style={{color:'#92400e'}}>{w}</p>)}
 {g.valid?<section style={box}><h2 style={{fontSize:18,fontWeight:600,margin:'0 0 8px'}}>Plan preview</h2>{g.appliedFacetGeometry?.requiresManufactureReview&&<p role="status" style={{fontWeight:700}}>Survey-adjusted design: materials and price use the applied lengths, angles, pitches and aligned eaves. Manufacture cut release remains pending connection review.</p>}<CombinationPlan geometry={g}/><div style={{color:'#555',lineHeight:1.45,marginTop:8}}><p style={{margin:0}}><strong>Internal width:</strong> {mm(g.widthMM)} mm · <strong>External width:</strong> {mm(g.externalWidthMM)} mm</p><p style={{margin:0}}><strong>Internal projection:</strong> {mm(g.projectionMM)} mm · <strong>External projection:</strong> {mm(g.externalProjectionMM)} mm</p><p style={{margin:0}}><strong>External Finished Height:</strong> {mm(g.finishedHeightMM)} mm</p><div><b>Roof Pitch:</b> {Number(g.pitchDeg).toFixed(1)}°</div><div><b>Tile:</b> {({britmetShingle:'Britmet',liteSlate:'LiteSlate',metrotileShingle:'Metrotile',tapcoSlate:'Tapco'})[inputs.tileProductId]} — <b>{inputs.tileColour}</b></div><div><b>Fascia/Soffit:</b> <b>{inputs.fasciaColour||'White'}</b> · <b>Gutter:</b> {inputs.gutterProfile} / {(inputs.gutterColour||'Black').toLowerCase()}, one outlet</div></div><details style={{marginTop:12}}><summary>Facet dimensions and geometry details</summary><p><strong>Ridge point:</strong> {mm(g.ridge.xMM)} mm from left · {mm(g.ridge.yMM)} mm from house wall</p><table style={{borderCollapse:'collapse',width:'100%'}}><thead><tr>{['Facet','Internal length (mm)','External length (mm)','Pitch',...(g.facetEaves?['Ply-base projection (mm)']:[])].map(s=><th style={{textAlign:'left',border:'1px solid #cbd5e1',padding:6}} key={s}>{s}</th>)}</tr></thead><tbody>{g.facets.map((f,i)=><tr key={f.id}>{[i+1,mm(f.internalLengthMM),mm(f.externalLengthMM),`${mm(f.pitchDeg)}°`,...(g.facetEaves?[mm(g.facetEaves[i].plyBaseWidthMM)]:[])].map((v,j)=><td key={j} style={{border:'1px solid #cbd5e1',padding:6}}>{v}</td>)}</tr>)}</tbody></table><p style={{fontSize:13}}>External dimensions follow the existing style’s ply-base allowances. The dashed centre line marks the ridge datum. Blue lines show trusses and rafters. Member references are preview references; cutting details are not included. Changing roof dimensions or side configuration restores the automatic rafter layout.</p></details></section>:<p role="status">{inputs.widthMM&&inputs.projMM?g.errors.join(' '):'Enter width and projection to display the roof plan.'}</p>}
 {q&&<section style={box} aria-label="Your price"><h2 style={{fontSize:18,fontWeight:600,margin:'0 0 8px'}}>Your price</h2>{q.ready?<><div>Subtotal: <strong>£{q.pricing.net.toFixed(2)}</strong></div><div>VAT ({Number(q.pricing.vatRate*100)}%): £{q.pricing.vat.toFixed(2)}</div><div>Total (gross): <strong>£{q.pricing.gross.toFixed(2)}</strong></div><p style={{fontSize:12,color:'#6b7280',margin:'8px 0 0'}}>Quotations are valid for 31 days.</p></>:<p role="status">{!q.valid?q.errors.join(' '):<>{!q.distanceReady?'Calculate delivery distance before quoting. ':''}{!q.customerReady?'Selected customer details are loading or unavailable. ':''}{q.model.missingPrices?.length?'Configure missing Materials prices in Summary. ':''}{q.model.supplyReviews?.join(' ')}</>}</p>}</section>}
 </main></>;
}
